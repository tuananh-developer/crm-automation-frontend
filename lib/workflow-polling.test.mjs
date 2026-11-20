import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import Module from 'node:module';
import ts from 'typescript';

const frontendRoot = path.resolve(import.meta.dirname, '..');

function loadTsModule(relativePath) {
  const fullPath = path.join(frontendRoot, relativePath);
  const source = fs.readFileSync(fullPath, 'utf8');
  const compiled = ts.transpileModule(source, {
    fileName: fullPath,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  });

  const mod = new Module(fullPath);
  mod.filename = fullPath;
  mod.paths = Module._nodeModulePaths(path.dirname(fullPath));

  const originalResolve = Module._resolveFilename;
  Module._resolveFilename = function (request, parent, isMain, options) {
    if (request.startsWith('@/')) {
      const target = path.join(frontendRoot, request.slice(2));
      return originalResolve.call(this, target, parent, isMain, options);
    }
    return originalResolve.call(this, request, parent, isMain, options);
  };

  try {
    mod._compile(compiled.outputText, fullPath);
  } finally {
    Module._resolveFilename = originalResolve;
  }

  return mod.exports;
}

const {
  checkTranscriptStuck,
  evaluatePollingInterval,
  getPersistedTranscriptId,
  getTranscriptStatusBadgeTone,
  isTranscriptProcessingActive,
  isTranscriptProcessingDone,
  isTranscriptProcessingFailed,
  isWorkflowRunActive,
  isWorkflowRunFailed,
  MAX_POLL_ATTEMPTS,
  POLL_INTERVAL_MS,
  setPersistedTranscriptId,
} = loadTsModule('lib/workflow-polling.ts');

test('isWorkflowRunActive and isWorkflowRunFailed handle backend WorkflowStatus values', () => {
  assert.equal(isWorkflowRunActive('PENDING'), true);
  assert.equal(isWorkflowRunActive('RUNNING'), true);
  assert.equal(isWorkflowRunActive('SUCCESS'), false);
  assert.equal(isWorkflowRunActive('PARTIAL'), false);
  assert.equal(isWorkflowRunActive('FAILED'), false);
  assert.equal(isWorkflowRunActive('CANCELLED'), false);

  assert.equal(isWorkflowRunFailed('FAILED'), true);
  assert.equal(isWorkflowRunFailed('CANCELLED'), true);
  assert.equal(isWorkflowRunFailed('RUNNING'), false);
  assert.equal(isWorkflowRunFailed('SUCCESS'), false);
});

test('evaluatePollingInterval continues through PENDING -> RUNNING and stops on SUCCESS or FAILED', () => {
  const pendingStep = evaluatePollingInterval({
    queryStatus: 'success',
    workflowStatus: 'PENDING',
    isActive: isWorkflowRunActive,
    pollAttempts: 0,
  });
  assert.deepEqual(pendingStep, {
    nextInterval: POLL_INTERVAL_MS,
    nextAttempts: 1,
    timedOut: false,
  });

  const runningStep = evaluatePollingInterval({
    queryStatus: 'success',
    workflowStatus: 'RUNNING',
    isActive: isWorkflowRunActive,
    pollAttempts: pendingStep.nextAttempts,
  });
  assert.deepEqual(runningStep, {
    nextInterval: POLL_INTERVAL_MS,
    nextAttempts: 2,
    timedOut: false,
  });

  const successStep = evaluatePollingInterval({
    queryStatus: 'success',
    workflowStatus: 'SUCCESS',
    isActive: isWorkflowRunActive,
    pollAttempts: runningStep.nextAttempts,
  });
  assert.deepEqual(successStep, {
    nextInterval: false,
    nextAttempts: 0,
    timedOut: false,
  });

  const failedStep = evaluatePollingInterval({
    queryStatus: 'success',
    workflowStatus: 'FAILED',
    isActive: isWorkflowRunActive,
    pollAttempts: runningStep.nextAttempts,
  });
  assert.deepEqual(failedStep, {
    nextInterval: false,
    nextAttempts: 0,
    timedOut: false,
  });

  const timedOutStep = evaluatePollingInterval({
    queryStatus: 'success',
    workflowStatus: 'RUNNING',
    isActive: isWorkflowRunActive,
    pollAttempts: MAX_POLL_ATTEMPTS,
  });
  assert.deepEqual(timedOutStep, {
    nextInterval: false,
    nextAttempts: MAX_POLL_ATTEMPTS,
    timedOut: true,
  });
});

test('transcript helpers and checkTranscriptStuck support RUNNING, SUCCESS, PARTIAL, COMPLETED, FAILED, CANCELLED', () => {
  assert.equal(isTranscriptProcessingActive('PENDING'), true);
  assert.equal(isTranscriptProcessingActive('RUNNING'), true);
  assert.equal(isTranscriptProcessingActive('PROCESSING'), true);
  assert.equal(isTranscriptProcessingActive('SUCCESS'), false);

  assert.equal(isTranscriptProcessingDone('COMPLETED'), true);
  assert.equal(isTranscriptProcessingDone('SUCCESS'), true);
  assert.equal(isTranscriptProcessingDone('PARTIAL'), true);
  assert.equal(isTranscriptProcessingDone('RUNNING'), false);

  assert.equal(isTranscriptProcessingFailed('FAILED'), true);
  assert.equal(isTranscriptProcessingFailed('CANCELLED'), true);

  assert.equal(getTranscriptStatusBadgeTone('RUNNING', false), 'info');
  assert.equal(getTranscriptStatusBadgeTone('RUNNING', true), 'warning');
  assert.equal(getTranscriptStatusBadgeTone('SUCCESS'), 'success');
  assert.equal(getTranscriptStatusBadgeTone('COMPLETED'), 'success');
  assert.equal(getTranscriptStatusBadgeTone('PARTIAL'), 'warning');
  assert.equal(getTranscriptStatusBadgeTone('FAILED'), 'danger');
  assert.equal(getTranscriptStatusBadgeTone('CANCELLED'), 'danger');

  assert.equal(
    checkTranscriptStuck(
      {
        transcriptId: 'tx-1',
        processingStatus: 'RUNNING',
        redactedContent: '',
        sourceType: 'CALL',
        summary: null,
        createdAt: new Date(1_000).toISOString(),
      },
      false,
      'tx-1',
      65_000,
    ),
    true,
  );

  assert.equal(
    checkTranscriptStuck(
      {
        transcriptId: 'tx-1',
        processingStatus: 'SUCCESS',
        redactedContent: '',
        sourceType: 'CALL',
        summary: null,
        createdAt: new Date(1_000).toISOString(),
      },
      true,
      'tx-1',
      120_000,
    ),
    false,
  );
});

test('persist and restore lastTranscriptId per customerId across remount/reload and URL param override', () => {
  const store = new Map();
  const mockStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
  };

  setPersistedTranscriptId('cust-1', 'transcript-123', mockStorage);
  setPersistedTranscriptId('cust-2', 'transcript-999', mockStorage);

  assert.equal(
    getPersistedTranscriptId('cust-1', { storage: mockStorage }),
    'transcript-123',
  );
  assert.equal(
    getPersistedTranscriptId('cust-2', { storage: mockStorage }),
    'transcript-999',
  );
  assert.equal(
    getPersistedTranscriptId('cust-1', {
      storage: mockStorage,
      search: '?tab=conversations&transcriptId=transcript-from-url',
    }),
    'transcript-from-url',
  );

  setPersistedTranscriptId('cust-1', null, mockStorage);
  assert.equal(
    getPersistedTranscriptId('cust-1', { storage: mockStorage }),
    null,
  );
});
