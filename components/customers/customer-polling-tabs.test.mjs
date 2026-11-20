import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import Module from 'node:module';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const frontendRoot = path.resolve(import.meta.dirname, '../..');

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const ReactQuery = require('@tanstack/react-query');
const jsxRuntime = require('react/jsx-runtime');

function createStorageMock() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

function setupMockWindow() {
  const localStorage = createStorageMock();
  const sessionStorage = createStorageMock();
  globalThis.window = {
    localStorage,
    sessionStorage,
    location: { search: '', protocol: 'http:' },
  };
  return { localStorage, sessionStorage };
}

function resolveWithExtension(candidatePath) {
  for (const ext of ['', '.ts', '.tsx', '.js', '.jsx']) {
    const withExt = `${candidatePath}${ext}`;
    if (fs.existsSync(withExt) && fs.statSync(withExt).isFile()) {
      return withExt;
    }
  }
  const indexCandidate = path.join(candidatePath, 'index.ts');
  if (fs.existsSync(indexCandidate)) return indexCandidate;
  return candidatePath;
}

const originalTsHandler = require.extensions['.ts'];
const originalTsxHandler = require.extensions['.tsx'];

function compileTsFile(mod, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  });
  mod._compile(compiled.outputText, filename);
}

function loadFrontendModule(relativePath) {
  const originalResolve = Module._resolveFilename;
  require.extensions['.ts'] = compileTsFile;
  require.extensions['.tsx'] = compileTsFile;

  Module._resolveFilename = function (request, parent, isMain, options) {
    if (request.startsWith('@/')) {
      const target = resolveWithExtension(path.join(frontendRoot, request.slice(2)));
      return originalResolve.call(this, target, parent, isMain, options);
    }
    if ((request.startsWith('./') || request.startsWith('../')) && parent?.filename) {
      const baseDir = path.dirname(parent.filename);
      const target = resolveWithExtension(path.resolve(baseDir, request));
      return originalResolve.call(this, target, parent, isMain, options);
    }
    return originalResolve.call(this, request, parent, isMain, options);
  };

  try {
    const targetPath = resolveWithExtension(path.join(frontendRoot, relativePath));
    delete require.cache[targetPath];
    return require(targetPath);
  } finally {
    Module._resolveFilename = originalResolve;
    if (originalTsHandler) require.extensions['.ts'] = originalTsHandler;
    if (originalTsxHandler) require.extensions['.tsx'] = originalTsxHandler;
  }
}

function build360Payload(status, aiSummary = null, errorMessage = null) {
  return {
    customer: { id: 'cust-360', name: 'Acme Corp' },
    convertedLeads: [],
    interactions: [],
    intelligence: { qualifications: [], enrichments: [], scores: [] },
    followUps: { enrollments: [], executions: [] },
    segments: [],
    sourceCoverage: {
      crmProfile: 'AVAILABLE',
      interactions: 'EMPTY',
      leadIntelligence: 'EMPTY',
      followUps: 'EMPTY',
      segments: 'EMPTY',
      customerIssues: 'EMPTY',
      customerFeedback: 'EMPTY',
    },
    aiSummary,
    latestWorkflowRun: status
      ? {
          id: 'run-1',
          status,
          errorMessage,
        }
      : null,
  };
}

function renderWithQuerySpy(elementFn) {
  const capturedQueries = [];
  const capturedMutations = [];
  const capturedElements = [];

  const originalUseQuery = ReactQuery.useQuery;
  const originalUseMutation = ReactQuery.useMutation;
  const originalJsx = jsxRuntime.jsx;
  const originalJsxs = jsxRuntime.jsxs;

  ReactQuery.useQuery = (options) => {
    capturedQueries.push(options);
    return originalUseQuery(options);
  };
  ReactQuery.useMutation = (options) => {
    capturedMutations.push(options);
    return originalUseMutation(options);
  };
  jsxRuntime.jsx = (type, props, key) => {
    if (props && props['data-testid']) {
      capturedElements.push({ type, props });
    }
    return originalJsx(type, props, key);
  };
  jsxRuntime.jsxs = (type, props, key) => {
    if (props && props['data-testid']) {
      capturedElements.push({ type, props });
    }
    return originalJsxs(type, props, key);
  };

  try {
    const html = elementFn();
    return { html, capturedQueries, capturedMutations, capturedElements };
  } finally {
    ReactQuery.useQuery = originalUseQuery;
    ReactQuery.useMutation = originalUseMutation;
    jsxRuntime.jsx = originalJsx;
    jsxRuntime.jsxs = originalJsxs;
  }
}

test('Customer360Tab keeps polling across PENDING -> RUNNING -> SUCCESS/FAILED and keeps controls disabled on RUNNING', () => {
  setupMockWindow();
  const { Customer360Tab } = loadFrontendModule('components/customers/Customer360Tab.tsx');

  const queryClient = new ReactQuery.QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(
    ['customer-360', 'cust-360'],
    build360Payload('RUNNING'),
  );

  const runningRender = renderWithQuerySpy(() =>
    ReactDOMServer.renderToStaticMarkup(
      React.createElement(
        ReactQuery.QueryClientProvider,
        { client: queryClient },
        React.createElement(Customer360Tab, { customerId: 'cust-360' }),
      ),
    ),
  );

  const triggerBtn = runningRender.capturedElements.find(
    (el) => el.props['data-testid'] === 'btn-trigger-360',
  );
  assert.ok(triggerBtn, 'Expected trigger button to be rendered');
  assert.equal(triggerBtn.props.disabled, true);
  assert.match(runningRender.html, /AI đang phân tích\.\.\./);

  const queryOptions = runningRender.capturedQueries.find(
    (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'customer-360',
  );
  assert.ok(queryOptions?.refetchInterval);

  assert.equal(
    queryOptions.refetchInterval({
      state: { status: 'success', data: build360Payload('PENDING') },
    }),
    3000,
  );
  assert.equal(
    queryOptions.refetchInterval({
      state: { status: 'success', data: build360Payload('RUNNING') },
    }),
    3000,
  );
  assert.equal(
    queryOptions.refetchInterval({
      state: {
        status: 'success',
        data: build360Payload('SUCCESS', {
          summary: 'All healthy',
          keyStrengths: ['Strong retention'],
          potentialRisks: [],
          growthOpportunities: [],
          recommendedNextAction: 'Schedule QBR',
        }),
      },
    }),
    false,
  );
  assert.equal(
    queryOptions.refetchInterval({
      state: {
        status: 'success',
        data: build360Payload('FAILED', null, 'n8n timeout'),
      },
    }),
    false,
  );

  // Verify FAILED render displays error banner and re-enables trigger button
  queryClient.setQueryData(
    ['customer-360', 'cust-360'],
    build360Payload('FAILED', null, 'n8n timeout'),
  );
  const failedRender = renderWithQuerySpy(() =>
    ReactDOMServer.renderToStaticMarkup(
      React.createElement(
        ReactQuery.QueryClientProvider,
        { client: queryClient },
        React.createElement(Customer360Tab, { customerId: 'cust-360' }),
      ),
    ),
  );
  const failedTriggerBtn = failedRender.capturedElements.find(
    (el) => el.props['data-testid'] === 'btn-trigger-360',
  );
  assert.equal(failedTriggerBtn?.props.disabled, false);
  assert.match(failedRender.html, /customer-360-trigger-error/);
  assert.match(failedRender.html, /n8n timeout/);
});

test('CustomerConversationsTab polls RUNNING, renders SUCCESS badge properly, and rejects action items without status=CANCELLED', async () => {
  setupMockWindow();
  const apiClientMod = loadFrontendModule('services/api-client.ts');
  const patchCalls = [];
  const originalPatch = apiClientMod.apiClient.patch;
  apiClientMod.apiClient.patch = async (url, body) => {
    patchCalls.push({ url, body });
    return { data: { id: 'ai-1', approvalState: 'REJECTED', status: 'PENDING' } };
  };

  try {
    const pollingMod = loadFrontendModule('lib/workflow-polling.ts');
    pollingMod.setPersistedTranscriptId('cust-conv', 'tx-running');

    const { CustomerConversationsTab } = loadFrontendModule(
      'components/customers/CustomerConversationsTab.tsx',
    );
    const queryClient = new ReactQuery.QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const runningTranscript = {
      transcriptId: 'tx-running',
      processingStatus: 'RUNNING',
      redactedContent: 'Call notes',
      sourceType: 'CALL',
      summary: null,
      createdAt: new Date().toISOString(),
    };
    queryClient.setQueryData(
      ['conversation-summary', 'tx-running'],
      runningTranscript,
    );

    const runningRender = renderWithQuerySpy(() =>
      ReactDOMServer.renderToStaticMarkup(
        React.createElement(
          ReactQuery.QueryClientProvider,
          { client: queryClient },
          React.createElement(CustomerConversationsTab, {
            customerId: 'cust-conv',
          }),
        ),
      ),
    );
    assert.match(runningRender.html, /RUNNING/);
    assert.match(runningRender.html, /animate-spin/);

    const convQuery = runningRender.capturedQueries.find(
      (q) =>
        Array.isArray(q.queryKey) && q.queryKey[0] === 'conversation-summary',
    );
    assert.equal(convQuery?.enabled, true);
    assert.equal(
      convQuery?.refetchInterval({
        state: { status: 'success', data: runningTranscript },
      }),
      3000,
    );

    // Transition to SUCCESS with one PROPOSED action item
    const successTranscript = {
      transcriptId: 'tx-running',
      processingStatus: 'SUCCESS',
      redactedContent: 'Call notes',
      sourceType: 'CALL',
      summary: {
        id: 'sum-1',
        summaryText: 'Discussed enterprise renewal',
        sentiment: 'POSITIVE',
        actionItems: [
          {
            id: 'ai-1',
            title: 'Send contract',
            status: 'PENDING',
            approvalState: 'PROPOSED',
          },
        ],
      },
      createdAt: new Date().toISOString(),
    };
    queryClient.setQueryData(
      ['conversation-summary', 'tx-running'],
      successTranscript,
    );

    const successRender = renderWithQuerySpy(() =>
      ReactDOMServer.renderToStaticMarkup(
        React.createElement(
          ReactQuery.QueryClientProvider,
          { client: queryClient },
          React.createElement(CustomerConversationsTab, {
            customerId: 'cust-conv',
          }),
        ),
      ),
    );
    assert.equal(
      convQuery?.refetchInterval({
        state: { status: 'success', data: successTranscript },
      }),
      false,
    );
    // Badge uses success tone (emerald), never red danger tone
    assert.match(successRender.html, /bg-emerald-50[^>]*>SUCCESS<\/span>|bg-emerald-100[^>]*>SUCCESS<\/span>|>SUCCESS<\/span>/);
    assert.doesNotMatch(successRender.html, /text-red-\d+[^>]*>SUCCESS/);

    // Trigger Reject button click handler directly and inspect outgoing PATCH payload
    const rejectBtn = successRender.capturedElements.find(
      (el) => el.props['data-testid'] === 'btn-reject-action-item-ai-1',
    );
    assert.ok(rejectBtn?.props.onClick, 'Expected reject button onClick');
    await rejectBtn.props.onClick();

    assert.equal(patchCalls.length, 1);
    assert.deepEqual(patchCalls[0], {
      url: '/conversation-action-items/ai-1',
      body: { approvalState: 'REJECTED' },
    });
    assert.equal('status' in patchCalls[0].body, false);

    // After refetch returns approvalState: 'REJECTED', completion toggle stays disabled
    const rejectedTranscript = {
      ...successTranscript,
      summary: {
        ...successTranscript.summary,
        actionItems: [
          {
            id: 'ai-1',
            title: 'Send contract',
            status: 'PENDING',
            approvalState: 'REJECTED',
          },
        ],
      },
    };
    queryClient.setQueryData(
      ['conversation-summary', 'tx-running'],
      rejectedTranscript,
    );
    const rejectedRender = renderWithQuerySpy(() =>
      ReactDOMServer.renderToStaticMarkup(
        React.createElement(
          ReactQuery.QueryClientProvider,
          { client: queryClient },
          React.createElement(CustomerConversationsTab, {
            customerId: 'cust-conv',
          }),
        ),
      ),
    );
    const toggleBtn = rejectedRender.capturedElements.find(
      (el) => el.props['data-testid'] === 'btn-toggle-action-item-ai-1',
    );
    assert.equal(toggleBtn?.props.disabled, true);
  } finally {
    apiClientMod.apiClient.patch = originalPatch;
  }
});

test('CustomerConversationsTab restores persisted lastTranscriptId across tab remount and page reload', async () => {
  setupMockWindow();
  const apiClientMod = loadFrontendModule('services/api-client.ts');
  const originalPost = apiClientMod.apiClient.post;
  apiClientMod.apiClient.post = async () => ({
    data: {
      transcriptId: 'tx-persisted-777',
      processingStatus: 'PENDING',
    },
  });

  try {
    const { CustomerConversationsTab } = loadFrontendModule(
      'components/customers/CustomerConversationsTab.tsx',
    );

    // 1. Mount tab and simulate transcript submission onSuccess
    const queryClient1 = new ReactQuery.QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const firstRender = renderWithQuerySpy(() =>
      ReactDOMServer.renderToStaticMarkup(
        React.createElement(
          ReactQuery.QueryClientProvider,
          { client: queryClient1 },
          React.createElement(CustomerConversationsTab, {
            customerId: 'cust-persist',
          }),
        ),
      ),
    );
    assert.equal(
      firstRender.capturedQueries.find(
        (q) => q.queryKey?.[0] === 'conversation-summary',
      )?.enabled,
      false,
    );

    const submitMutation = firstRender.capturedMutations[0];
    assert.ok(submitMutation?.onSuccess);
    submitMutation.onSuccess({
      transcriptId: 'tx-persisted-777',
      processingStatus: 'PENDING',
    });

    // 2. Simulate unmounting tab / reloading page with fresh React state and QueryClient
    const queryClient2 = new ReactQuery.QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient2.setQueryData(['conversation-summary', 'tx-persisted-777'], {
      transcriptId: 'tx-persisted-777',
      processingStatus: 'RUNNING',
      redactedContent: 'Restored content',
      sourceType: 'CALL',
      summary: null,
      createdAt: new Date().toISOString(),
    });

    const remountRender = renderWithQuerySpy(() =>
      ReactDOMServer.renderToStaticMarkup(
        React.createElement(
          ReactQuery.QueryClientProvider,
          { client: queryClient2 },
          React.createElement(CustomerConversationsTab, {
            customerId: 'cust-persist',
          }),
        ),
      ),
    );
    const restoredQuery = remountRender.capturedQueries.find(
      (q) => q.queryKey?.[0] === 'conversation-summary',
    );
    assert.deepEqual(restoredQuery?.queryKey, [
      'conversation-summary',
      'tx-persisted-777',
    ]);
    assert.equal(restoredQuery?.enabled, true);
    assert.match(remountRender.html, /RUNNING/);
  } finally {
    apiClientMod.apiClient.post = originalPost;
  }
});
