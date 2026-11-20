import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const {
  QueryClient,
  QueryClientProvider,
  QueryObserver,
} = require("@tanstack/react-query");
const repoRoot = path.resolve(import.meta.dirname, "../..");

function createTsLoader(mocks = {}) {
  const cache = new Map();

  function resolveModulePath(request, fromDir) {
    if (Object.prototype.hasOwnProperty.call(mocks, request)) {
      return { mockKey: request };
    }
    if (!request.startsWith("@/") && !request.startsWith(".")) {
      return { external: request };
    }

    const base = request.startsWith("@/")
      ? path.join(repoRoot, request.slice(2))
      : path.resolve(fromDir, request);

    const candidates = [
      base,
      `${base}.ts`,
      `${base}.tsx`,
      `${base}.js`,
      path.join(base, "index.ts"),
      path.join(base, "index.tsx"),
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return { filePath: candidate };
      }
    }

    throw new Error(`Cannot resolve module '${request}' from '${fromDir}'`);
  }

  function loadTsModule(filePath) {
    if (cache.has(filePath)) {
      return cache.get(filePath).exports;
    }

    const cacheEntry = { exports: {} };
    cache.set(filePath, cacheEntry);

    const source = fs.readFileSync(filePath, "utf8");
    const { outputText } = ts.transpileModule(source, {
      fileName: filePath,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    });

    const localDir = path.dirname(filePath);
    const localRequire = (specifier) => {
      const resolved = resolveModulePath(specifier, localDir);
      if (resolved.mockKey) {
        return mocks[resolved.mockKey];
      }
      if (resolved.external) {
        return require(resolved.external);
      }
      return loadTsModule(resolved.filePath);
    };

    const fn = new Function(
      "exports",
      "require",
      "module",
      "__filename",
      "__dirname",
      outputText,
    );
    fn(
      cacheEntry.exports,
      localRequire,
      cacheEntry,
      filePath,
      localDir,
    );
    return cacheEntry.exports;
  }

  return { loadTsModule };
}

function buildCustomer360Payload(status, overrides = {}) {
  return {
    customer: {
      id: "cust-1",
      name: "Acme Corp",
      email: "owner@acme.test",
      status: "ACTIVE",
    },
    convertedLeads: [],
    interactions: [],
    intelligence: { qualifications: [], enrichments: [], scores: [] },
    followUps: { enrollments: [], executions: [] },
    segments: [],
    sourceCoverage: {
      crmProfile: "AVAILABLE",
      interactions: "EMPTY",
      leadIntelligence: "EMPTY",
      followUps: "EMPTY",
      segments: "EMPTY",
      customerIssues: "NOT_CONNECTED",
      customerFeedback: "AVAILABLE",
    },
    aiSummary:
      status === "SUCCESS"
        ? {
            summary: "Customer health is strong.",
            keyStrengths: ["High engagement"],
            potentialRisks: [],
            growthOpportunities: ["Enterprise tier"],
            recommendedNextAction: "Schedule QBR",
            aiModel: "gemini-3.5-flash-lite",
            evaluatedAt: "2026-11-10T00:00:00.000Z",
          }
        : null,
    latestWorkflowRun: {
      id: "run-1",
      status,
      startedAt: new Date().toISOString(),
      completedAt: null,
      errorMessage: status === "FAILED" ? "Provider timeout" : null,
    },
    ...overrides,
  };
}

function buildTranscriptPayload(processingStatus, overrides = {}) {
  const isDone = processingStatus === "SUCCESS" || processingStatus === "COMPLETED";
  return {
    transcriptId: "tx-1",
    processingStatus,
    redactedContent: "Customer asked about enterprise renewal.",
    sourceType: "CALL",
    summary: isDone
      ? {
          id: "sum-1",
          summaryText: "Discussed annual renewal.",
          sentiment: "POSITIVE",
          intent: "RENEWAL",
          keyPoints: ["50 seats"],
          actionItems: [],
        }
      : null,
    errorMessage: processingStatus === "FAILED" ? "LLM failed" : null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("Customer360Tab & CustomerConversationsTab UI + polling integration", () => {
  const { loadTsModule } = createTsLoader({
    "@/services/customer.service": {
      getCustomer360: async () => buildCustomer360Payload("RUNNING"),
      triggerCustomer360: async () => ({
        message: "Accepted",
        workflowRunId: "run-1",
      }),
    },
    "@/services/conversation.service": {
      createTranscript: async () => ({
        message: "Accepted",
        transcriptId: "tx-1",
        workflowRunId: "run-1",
        processingStatus: "PENDING",
      }),
      getTranscriptSummary: async () => buildTranscriptPayload("RUNNING"),
      updateActionItem: async () => ({}),
    },
    "@/services/api-client": {
      getApiErrorMessage: (err) =>
        err instanceof Error ? err.message : String(err ?? "Unknown error"),
    },
  });

  const { Customer360Tab } = loadTsModule(
    path.join(repoRoot, "components/customers/Customer360Tab.tsx"),
  );
  const { CustomerConversationsTab } = loadTsModule(
    path.join(repoRoot, "components/customers/CustomerConversationsTab.tsx"),
  );
  const pollingLib = loadTsModule(
    path.join(repoRoot, "lib/workflow-polling.ts"),
  );

  it("renders Customer360Tab RUNNING as active analyzing state and surfaces timeout/manual-refresh banner", () => {
    const qc = new QueryClient();
    qc.setQueryData(["customer-360", "cust-1"], buildCustomer360Payload("RUNNING"));

    const runningHtml = renderToStaticMarkup(
      React.createElement(
        QueryClientProvider,
        { client: qc },
        React.createElement(Customer360Tab, { customerId: "cust-1" }),
      ),
    );
    assert.match(runningHtml, /AI đang phân tích\.\.\./);
    assert.match(runningHtml, /data-testid="btn-trigger-360"[^>]*disabled/);
    assert.doesNotMatch(runningHtml, /customer-360-polling-timeout-banner/);

    const timedOutHtml = renderToStaticMarkup(
      React.createElement(
        QueryClientProvider,
        { client: qc },
        React.createElement(Customer360Tab, {
          customerId: "cust-1",
          initialPollingTimedOut: true,
        }),
      ),
    );
    assert.match(timedOutHtml, /data-testid="customer-360-polling-timeout-banner"/);
    assert.match(timedOutHtml, /Kiểm tra lại ngay/);

    qc.setQueryData(["customer-360", "cust-1"], buildCustomer360Payload("FAILED"));
    const failedHtml = renderToStaticMarkup(
      React.createElement(
        QueryClientProvider,
        { client: qc },
        React.createElement(Customer360Tab, { customerId: "cust-1" }),
      ),
    );
    assert.match(failedHtml, /data-testid="customer-360-trigger-error"/);
    assert.match(failedHtml, /Provider timeout/);

    qc.setQueryData(
      ["customer-360", "cust-1"],
      buildCustomer360Payload("CANCELLED"),
    );
    const cancelledHtml = renderToStaticMarkup(
      React.createElement(
        QueryClientProvider,
        { client: qc },
        React.createElement(Customer360Tab, { customerId: "cust-1" }),
      ),
    );
    assert.match(cancelledHtml, /data-testid="customer-360-trigger-error"/);
    assert.match(cancelledHtml, /đã bị hủy/);

    qc.setQueryData(
      ["customer-360", "cust-1"],
      buildCustomer360Payload("PARTIAL"),
    );
    const partialHtml = renderToStaticMarkup(
      React.createElement(
        QueryClientProvider,
        { client: qc },
        React.createElement(Customer360Tab, { customerId: "cust-1" }),
      ),
    );
    assert.match(partialHtml, /data-testid="customer-360-partial-banner"/);
    assert.match(partialHtml, /Phân tích lại/);
  });

  it("renders CustomerConversationsTab RUNNING as processing and reaches stuck timeout/manual-refresh state", () => {
    const qc = new QueryClient();
    qc.setQueryData(
      ["conversation-summary", "tx-1"],
      buildTranscriptPayload("RUNNING"),
    );

    const runningHtml = renderToStaticMarkup(
      React.createElement(
        QueryClientProvider,
        { client: qc },
        React.createElement(CustomerConversationsTab, {
          customerId: "cust-1",
          initialTranscriptId: "tx-1",
        }),
      ),
    );
    assert.match(runningHtml, /data-testid="transcript-processing-badge"/);
    assert.match(runningHtml, />RUNNING</);
    assert.match(runningHtml, /data-testid="transcript-processing-message"/);
    assert.match(runningHtml, /Đang chờ AI phản hồi\.\.\./);
    assert.doesNotMatch(runningHtml, /transcript-failed-badge/);
    assert.doesNotMatch(runningHtml, /transcript-polling-timeout-banner/);

    const timedOutHtml = renderToStaticMarkup(
      React.createElement(
        QueryClientProvider,
        { client: qc },
        React.createElement(CustomerConversationsTab, {
          customerId: "cust-1",
          initialTranscriptId: "tx-1",
          initialPollingTimedOut: true,
        }),
      ),
    );
    assert.match(timedOutHtml, /data-testid="transcript-polling-timeout-banner"/);
    assert.match(timedOutHtml, /Kiểm tra lại ngay/);
    assert.match(timedOutHtml, /data-testid="transcript-stuck-badge"/);
    assert.match(timedOutHtml, /data-testid="transcript-stuck-panel"/);
    assert.match(timedOutHtml, /Kiểm tra lại/);

    // RUNNING past stuck threshold reaches stuck/manual-refresh state even without initialPollingTimedOut
    qc.setQueryData(
      ["conversation-summary", "tx-1"],
      buildTranscriptPayload("RUNNING", {
        createdAt: new Date(Date.now() - 65_000).toISOString(),
      }),
    );
    const expiredRunningHtml = renderToStaticMarkup(
      React.createElement(
        QueryClientProvider,
        { client: qc },
        React.createElement(CustomerConversationsTab, {
          customerId: "cust-1",
          initialTranscriptId: "tx-1",
        }),
      ),
    );
    assert.match(
      expiredRunningHtml,
      /data-testid="transcript-polling-timeout-banner"/,
    );
    assert.match(expiredRunningHtml, /data-testid="transcript-stuck-badge"/);
    assert.match(expiredRunningHtml, /Kiểm tra lại ngay/);

    // Verify backend WorkflowStatus.SUCCESS renders done badge cleanly (not danger)
    qc.setQueryData(
      ["conversation-summary", "tx-1"],
      buildTranscriptPayload("SUCCESS"),
    );
    const successHtml = renderToStaticMarkup(
      React.createElement(
        QueryClientProvider,
        { client: qc },
        React.createElement(CustomerConversationsTab, {
          customerId: "cust-1",
          initialTranscriptId: "tx-1",
        }),
      ),
    );
    assert.match(successHtml, /data-testid="transcript-done-badge"/);
    assert.match(successHtml, />SUCCESS</);
    assert.doesNotMatch(successHtml, /transcript-failed-badge/);
  });

  it("executes TanStack Query refetchInterval through PENDING -> RUNNING -> SUCCESS/FAILED transitions", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const c360States = ["PENDING", "RUNNING", "SUCCESS"];
    let c360Call = 0;
    const c360AttemptsRef = { current: 0 };

    const c360Observer = new QueryObserver(qc, {
      queryKey: ["poll-c360"],
      queryFn: async () => buildCustomer360Payload(c360States[c360Call++]),
    });

    const recordedC360Intervals = [];
    for (let i = 0; i < c360States.length; i += 1) {
      const result = await c360Observer.refetch();
      const interval = pollingLib.evaluatePollStep({
        isQueryError: result.isError,
        isActive: pollingLib.isWorkflowRunActive(
          result.data?.latestWorkflowRun?.status,
        ),
        attemptsRef: c360AttemptsRef,
      });
      recordedC360Intervals.push(interval);
    }
    assert.deepEqual(recordedC360Intervals, [3000, 3000, false]);

    const txStates = ["PENDING", "RUNNING", "FAILED"];
    let txCall = 0;
    const txAttemptsRef = { current: 0 };
    const txObserver = new QueryObserver(qc, {
      queryKey: ["poll-tx"],
      queryFn: async () => buildTranscriptPayload(txStates[txCall++]),
    });

    const recordedTxIntervals = [];
    for (let i = 0; i < txStates.length; i += 1) {
      const result = await txObserver.refetch();
      const interval = pollingLib.evaluatePollStep({
        isQueryError: result.isError,
        isActive: pollingLib.isTranscriptProcessingActive(
          result.data?.processingStatus,
        ),
        attemptsRef: txAttemptsRef,
      });
      recordedTxIntervals.push(interval);
    }
    assert.deepEqual(recordedTxIntervals, [3000, 3000, false]);
  });
});
