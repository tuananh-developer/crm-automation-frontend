import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

function loadWorkflowPollingModule() {
  const filePath = path.resolve(import.meta.dirname, "./workflow-polling.ts");
  const source = fs.readFileSync(filePath, "utf8");
  const { outputText } = ts.transpileModule(source, {
    fileName: filePath,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  });
  const mod = { exports: {} };
  const fn = new Function("exports", "require", "module", outputText);
  fn(mod.exports, require, mod);
  return mod.exports;
}

const {
  checkTranscriptStuck,
  evaluatePollStep,
  isTranscriptProcessingActive,
  isTranscriptProcessingDone,
  isTranscriptProcessingFailed,
  isWorkflowRunActive,
  isWorkflowRunFailure,
  MAX_POLL_ATTEMPTS,
  POLL_INTERVAL_MS,
  STUCK_THRESHOLD_MS,
} = loadWorkflowPollingModule();

describe("workflow-polling state & bounded polling transitions", () => {
  it("keeps Customer 360 polling through PENDING -> RUNNING and stops on SUCCESS or FAILED", () => {
    for (const terminalStatus of ["SUCCESS", "PARTIAL", "FAILED", "CANCELLED"]) {
      const attemptsRef = { current: 0 };
      let timedOut = false;

      const sequence = ["PENDING", "RUNNING", "RUNNING", terminalStatus];
      const intervals = sequence.map((status) =>
        evaluatePollStep({
          isQueryError: false,
          isActive: isWorkflowRunActive(status),
          attemptsRef,
          onTimeout: () => {
            timedOut = true;
          },
        }),
      );

      assert.deepEqual(intervals, [
        POLL_INTERVAL_MS,
        POLL_INTERVAL_MS,
        POLL_INTERVAL_MS,
        false,
      ]);
      assert.equal(attemptsRef.current, 0);
      assert.equal(timedOut, false);
    }
  });

  it("stops Customer 360 polling after MAX_POLL_ATTEMPTS when run stays RUNNING and invokes timeout callback", () => {
    const attemptsRef = { current: 0 };
    let timedOut = false;

    for (let i = 0; i < MAX_POLL_ATTEMPTS; i += 1) {
      const interval = evaluatePollStep({
        isQueryError: false,
        isActive: isWorkflowRunActive("RUNNING"),
        attemptsRef,
        onTimeout: () => {
          timedOut = true;
        },
      });
      assert.equal(interval, POLL_INTERVAL_MS);
    }
    assert.equal(timedOut, false);

    const terminalPoll = evaluatePollStep({
      isQueryError: false,
      isActive: isWorkflowRunActive("RUNNING"),
      attemptsRef,
      onTimeout: () => {
        timedOut = true;
      },
    });
    assert.equal(terminalPoll, false);
    assert.equal(timedOut, true);
  });

  it("keeps Conversation summary polling through PENDING -> RUNNING -> PROCESSING and stops on terminal states", () => {
    for (const terminalStatus of [
      "SUCCESS",
      "COMPLETED",
      "PARTIAL",
      "FAILED",
      "CANCELLED",
    ]) {
      const attemptsRef = { current: 0 };
      let timedOut = false;

      const sequence = ["PENDING", "RUNNING", "PROCESSING", terminalStatus];
      const intervals = sequence.map((status) =>
        evaluatePollStep({
          isQueryError: false,
          isActive: isTranscriptProcessingActive(status),
          attemptsRef,
          onTimeout: () => {
            timedOut = true;
          },
        }),
      );

      assert.deepEqual(intervals, [
        POLL_INTERVAL_MS,
        POLL_INTERVAL_MS,
        POLL_INTERVAL_MS,
        false,
      ]);
      assert.equal(attemptsRef.current, 0);
      assert.equal(timedOut, false);
    }
  });

  it("detects stuck transcript state for RUNNING as well as PENDING/PROCESSING and never for terminal states", () => {
    const now = 1_700_000_100_000;
    const recentIso = new Date(now - 5_000).toISOString();
    const expiredIso = new Date(now - STUCK_THRESHOLD_MS - 1_000).toISOString();

    assert.equal(
      checkTranscriptStuck(
        { processingStatus: "RUNNING", createdAt: recentIso },
        false,
        "tx-1",
        now,
      ),
      false,
    );

    assert.equal(
      checkTranscriptStuck(
        { processingStatus: "RUNNING", createdAt: recentIso },
        true,
        "tx-1",
        now,
      ),
      true,
    );

    assert.equal(
      checkTranscriptStuck(
        { processingStatus: "RUNNING", createdAt: expiredIso },
        false,
        "tx-1",
        now,
      ),
      true,
    );

    for (const status of [
      "SUCCESS",
      "COMPLETED",
      "PARTIAL",
      "FAILED",
      "CANCELLED",
    ]) {
      assert.equal(
        checkTranscriptStuck(
          { processingStatus: status, createdAt: expiredIso },
          true,
          "tx-1",
          now,
        ),
        false,
      );
    }
  });

  it("classifies backend workflow and transcript statuses consistently", () => {
    assert.equal(isWorkflowRunFailure("FAILED"), true);
    assert.equal(isWorkflowRunFailure("CANCELLED"), true);
    assert.equal(isWorkflowRunFailure("RUNNING"), false);

    assert.equal(isTranscriptProcessingDone("COMPLETED"), true);
    assert.equal(isTranscriptProcessingDone("SUCCESS"), true);
    assert.equal(isTranscriptProcessingDone("PARTIAL"), true);
    assert.equal(isTranscriptProcessingDone("RUNNING"), false);

    assert.equal(isTranscriptProcessingFailed("FAILED"), true);
    assert.equal(isTranscriptProcessingFailed("CANCELLED"), true);
    assert.equal(isTranscriptProcessingFailed("SUCCESS"), false);
  });
});
