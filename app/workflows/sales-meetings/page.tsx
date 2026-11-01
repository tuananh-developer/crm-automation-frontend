"use client";
/* Hallmark · v2.0.0 · redesign: full · scope: app · genre: modern-minimal · theme: Cobalt · signature: meeting review queue */

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  Users,
} from "lucide-react";
import { WorkflowPageHeading } from "@/components/workflows/WorkflowChrome";
import { leadService } from "@/services/lead.service";
import { getCustomers } from "@/services/customer.service";
import { getWorkspaceUsers } from "@/services/user.service";
import { getApiErrorMessage } from "@/services/api-client";
import { t12WorkflowService } from "@/services/t12-workflows.service";
import type { T12EntityType } from "@/types/t12-workflows";

function newIdempotencyKey() {
  return globalThis.crypto?.randomUUID?.() ?? `wf11-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function renderStructuredValue(value: Record<string, unknown>) {
  return Object.entries(value)
    .map(([key, item]) => `${key}: ${typeof item === "string" ? item : JSON.stringify(item)}`)
    .join(" · ");
}

function statusTone(status?: string) {
  if (status === "COMPLETED" || status === "CONFIRMED") return "wf-state wf-state--success";
  if (status === "FAILED" || status === "REJECTED") return "wf-state wf-state--danger";
  if (status === "PROCESSING" || status === "PENDING_CONFIRMATION") return "wf-state wf-state--warning";
  return "wf-state wf-state--info";
}

export default function SalesMeetingsPage() {
  const queryClient = useQueryClient();
  const [entityType, setEntityType] = React.useState<T12EntityType>("Lead");
  const [entityId, setEntityId] = React.useState("");
  const [attendeeIds, setAttendeeIds] = React.useState<string[]>([]);
  const [purpose, setPurpose] = React.useState("");
  const [scheduledAt, setScheduledAt] = React.useState("");
  const [transcript, setTranscript] = React.useState("");
  const [meetingId, setMeetingId] = React.useState<string | null>(null);
  const [workflowRunId, setWorkflowRunId] = React.useState<string | null>(null);
  const [meetingLookup, setMeetingLookup] = React.useState("");
  const [decisionComment, setDecisionComment] = React.useState("");

  const leadsQuery = useQuery({ queryKey: ["wf11-leads"], queryFn: () => leadService.getLeads({ page: 1, limit: 100 }), enabled: entityType === "Lead" });
  const customersQuery = useQuery({ queryKey: ["wf11-customers"], queryFn: () => getCustomers({ page: 1, limit: 100 }), enabled: entityType === "Customer" });
  const usersQuery = useQuery({ queryKey: ["wf11-users"], queryFn: getWorkspaceUsers });

  const meetingQuery = useQuery({
    queryKey: ["wf11-meeting", meetingId],
    queryFn: () => t12WorkflowService.getSalesMeeting(meetingId!),
    enabled: Boolean(meetingId),
    retry: false,
    refetchInterval: (query) => query.state.data?.meeting.status === "PROCESSING" ? 3000 : false,
  });

  const startMutation = useMutation({
    mutationFn: () => t12WorkflowService.requestSalesMeeting({
      ...(entityType === "Lead" ? { leadId: entityId } : { customerId: entityId }),
      attendeeIds,
      transcript: transcript.trim(),
      meetingPurpose: purpose.trim() || undefined,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      sourceType: "MEETING_TRANSCRIPT",
    }, newIdempotencyKey()),
    onSuccess: (result) => {
      setWorkflowRunId(result.workflowRunId);
      if (result.meetingId) {
        setMeetingId(result.meetingId);
        setMeetingLookup(result.meetingId);
      }
    },
  });

  const actionMutation = useMutation({
    mutationFn: ({ actionItemId, decision }: { actionItemId: string; decision: "CONFIRM" | "REJECT" }) =>
      t12WorkflowService.confirmMeetingActionItem(actionItemId, decision, decisionComment.trim() || undefined),
    onSuccess: async () => {
      setDecisionComment("");
      await queryClient.invalidateQueries({ queryKey: ["wf11-meeting", meetingId] });
    },
  });

  const leads = leadsQuery.data?.data ?? [];
  const customers = customersQuery.data?.data ?? [];
  const users = usersQuery.data ?? [];
  const recordLoading = entityType === "Lead" ? leadsQuery.isLoading : customersQuery.isLoading;
  const recordError = entityType === "Lead" ? leadsQuery.error : customersQuery.error;
  const hasRecords = entityType === "Lead" ? leads.length > 0 : customers.length > 0;
  const meetingData = meetingQuery.data;
  const requestError = startMutation.error || meetingQuery.error || actionMutation.error;

  function loadMeeting(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = meetingLookup.trim();
    if (id) setMeetingId(id);
  }

  return (
    <div className="wf-screen">
      <WorkflowPageHeading
        code="WF11 · T12"
        title="Sales meeting analysis"
        description="Submit meeting notes for backend redaction and AI summarization. Review extracted decisions, risks and proposed actions before confirming them."
      >
        {meetingId && <button type="button" className="wf-action wf-action--quiet" onClick={() => void meetingQuery.refetch()} disabled={meetingQuery.isFetching}><RefreshCw size={15} /> Refresh result</button>}
      </WorkflowPageHeading>

      {requestError && <div role="alert" className="wf-callout wf-callout--danger"><AlertCircle size={16} /><p>{getApiErrorMessage(requestError)}</p></div>}
      {usersQuery.error && <div role="status" className="wf-callout wf-callout--warning"><Users size={16} /><p>User directory could not be loaded. You can still submit a meeting without optional attendees. {getApiErrorMessage(usersQuery.error)}</p></div>}

      <div className="wf-work-grid">
        <section className="wf-panel" aria-labelledby="wf11-create-title">
          <div className="wf-panel__head">
            <div><h2 id="wf11-create-title" className="wf-panel__title">New meeting analysis</h2><p className="wf-panel__hint">One CRM record, optional attendees and a transcript of from 20 to 150,000 characters.</p></div>
            <CalendarClock size={17} aria-hidden="true" color="var(--wf-accent)" />
          </div>
          <div className="wf-panel__body">
            <form className="wf-stack" onSubmit={(event) => { event.preventDefault(); startMutation.mutate(); }}>
              <div className="wf-fields">
                <label className="wf-field-wrap"><span className="wf-field-label">Related record type</span><select value={entityType} onChange={(event) => { setEntityType(event.target.value as T12EntityType); setEntityId(""); }}><option value="Lead">Lead</option><option value="Customer">Customer</option></select></label>
                <label className="wf-field-wrap"><span className="wf-field-label">Lead / Customer</span><select required value={entityId} onChange={(event) => setEntityId(event.target.value)} disabled={recordLoading || Boolean(recordError)}><option value="">Choose a record</option>{entityType === "Lead" && leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.firstName} {lead.lastName} | {lead.companyName}</option>)}{entityType === "Customer" && customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} | {customer.companyName || customer.email}</option>)}</select>{recordLoading && <span className="wf-field-help">Loading records…</span>}{recordError && <span className="wf-field-help" role="alert">{getApiErrorMessage(recordError)}</span>}{!recordLoading && !recordError && !hasRecords && <span className="wf-field-help">No accessible records were returned.</span>}</label>
                <label className="wf-field-wrap"><span className="wf-field-label">Meeting purpose</span><input value={purpose} maxLength={500} onChange={(event) => setPurpose(event.target.value)} placeholder="Discovery call, product demo, renewal…" /></label>
                <label className="wf-field-wrap"><span className="wf-field-label">Meeting date and time <span className="wf-subtle">(optional)</span></span><input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} /></label>
              </div>

              <label className="wf-field-wrap"><span className="wf-field-label">Attendees <span className="wf-subtle">(optional · maximum 30)</span></span><select multiple size={Math.min(Math.max(users.length, 3), 6)} value={attendeeIds} onChange={(event) => setAttendeeIds(Array.from(event.currentTarget.selectedOptions, (option) => option.value))} aria-describedby="wf11-attendee-help">{users.map((user) => <option key={user.id} value={user.id}>{user.name} | {user.role}</option>)}</select><span id="wf11-attendee-help" className="wf-field-help">Use Ctrl/Cmd to select more than one attendee. {users.length} user(s) available.</span>{attendeeIds.length > 30 && <span className="wf-field-help" role="alert">The API accepts at most 30 attendees.</span>}</label>

              <label className="wf-field-wrap"><span className="wf-field-label">Meeting transcript</span><textarea required minLength={20} maxLength={150000} rows={10} value={transcript} onChange={(event) => setTranscript(event.target.value)} placeholder="Paste the meeting transcript or notes. Remove highly sensitive details that are not necessary for analysis." /><span className="wf-field-help">{transcript.length.toLocaleString()} / 150,000 characters · minimum 20. The original transcript is not displayed in the result view.</span></label>

              <div className="wf-callout wf-callout--warning"><ShieldCheck size={16} /><p><strong>Privacy boundary.</strong> The backend applies pattern-based redaction before dispatch. This is not certified DLP. Do not submit regulated or highly sensitive recordings until an approved retention and DLP policy is in place.</p></div>

              <div className="wf-action-row">
                <button type="submit" className="wf-action wf-action--primary" disabled={!entityId || transcript.trim().length < 20 || attendeeIds.length > 30 || startMutation.isPending || recordLoading}>
                  {startMutation.isPending ? <LoaderCircle size={16} className="animate-spin" /> : <FileText size={16} />}{startMutation.isPending ? "Submitting analysis…" : "Analyze meeting"}
                </button>
              </div>
            </form>
          </div>
        </section>

        <div className="wf-stack">
          <section className="wf-panel" aria-labelledby="wf11-run-title">
            <div className="wf-panel__head"><div><h2 id="wf11-run-title" className="wf-panel__title">Request tracking</h2><p className="wf-panel__hint">The request response includes a WorkflowRun ID and may include a meeting ID.</p></div><Clock3 size={17} aria-hidden="true" color="var(--wf-accent)" /></div>
            <div className="wf-panel__body wf-stack">
              {workflowRunId ? <><div className="wf-status wf-status--success"><CheckCircle2 size={16} /> Request accepted by backend</div><div className="wf-well"><span className="wf-field-label">WorkflowRun ID</span><p className="wf-mono mt-2">{workflowRunId}</p></div></> : <div className="wf-empty"><ClipboardList size={22} /><strong>No request in this session</strong><p>Submit a meeting transcript to create an analysis run.</p></div>}
              <form className="wf-stack" onSubmit={loadMeeting}><label className="wf-field-wrap"><span className="wf-field-label">Load meeting result by ID</span><input value={meetingLookup} onChange={(event) => setMeetingLookup(event.target.value)} placeholder="Paste meeting ID" /></label><button className="wf-action" type="submit" disabled={!meetingLookup.trim() || meetingQuery.isFetching}>Load result</button></form>
              {meetingId && <div className="wf-callout wf-callout--info"><p>Meeting ID: <span className="wf-mono">{meetingId}</span></p></div>}
              {!meetingId && workflowRunId && <p className="wf-subtle">No meeting ID was returned with this acknowledgement. The current API has no lookup by WorkflowRun ID; load the meeting once its ID is available.</p>}
            </div>
          </section>
          {meetingId && <section className="wf-panel" aria-labelledby="wf11-result-status"><div className="wf-panel__head"><div><h2 id="wf11-result-status" className="wf-panel__title">Analysis status</h2><p className="wf-panel__hint">Meeting record {meetingId}</p></div><span className={statusTone(meetingData?.meeting.status)}>{meetingData?.meeting.status ?? (meetingQuery.isLoading ? "LOADING" : "UNKNOWN")}</span></div><div className="wf-panel__body wf-stack">
            {meetingQuery.isLoading && <div className="wf-loading"><LoaderCircle size={17} className="animate-spin" /> Loading meeting result…</div>}
            {meetingQuery.error && <div role="alert" className="wf-callout wf-callout--danger"><AlertCircle size={16} /><p>{getApiErrorMessage(meetingQuery.error)}</p></div>}
            {meetingData?.meeting.status === "PROCESSING" && <div className="wf-callout wf-callout--info"><LoaderCircle size={16} className="animate-spin" /><p><strong>Analysis in progress.</strong> This record refreshes every three seconds while the backend reports PROCESSING.</p></div>}
            {meetingData?.meeting.status === "FAILED" && <div className="wf-callout wf-callout--danger"><AlertCircle size={16} /><p><strong>Workflow failed.</strong> Inspect the backend WorkflowRun and n8n execution for the failure details.</p></div>}
            {meetingData?.meeting.status === "COMPLETED" && !meetingData.summary && <div className="wf-empty"><FileText size={20} /><strong>No summary attached</strong><p>The meeting is completed, but the response contains no summary.</p></div>}
            {meetingData?.transcript && <dl className="wf-fields"><div><dt className="wf-field-label">Source type</dt><dd className="mt-1 text-sm">{meetingData.transcript.sourceType}</dd></div><div><dt className="wf-field-label">Redaction mode</dt><dd className="mt-1 text-sm">{meetingData.transcript.redactionMode}</dd></div><div><dt className="wf-field-label">Received</dt><dd className="mt-1 text-sm">{new Date(meetingData.transcript.createdAt).toLocaleString()}</dd></div></dl>}
            {meetingData?.summary && <>
              <section className="wf-result-block"><h3 className="wf-result-heading">Meeting summary</h3><p className="wf-result-copy">{meetingData.summary.summary}</p></section>
              <div className="wf-split">
                <section className="wf-result-block"><h3 className="wf-result-heading">Decisions ({meetingData.summary.decisions?.length ?? 0})</h3>{meetingData.summary.decisions?.length ? <ul className="wf-list mt-2">{meetingData.summary.decisions.map((item, index) => <li className="wf-list__item" key={index}><p className="wf-list__item-description">{renderStructuredValue(item)}</p></li>)}</ul> : <p className="wf-subtle mt-2">No decisions extracted.</p>}</section>
                <section className="wf-result-block"><h3 className="wf-result-heading">Risks ({meetingData.summary.risks?.length ?? 0})</h3>{meetingData.summary.risks?.length ? <ul className="wf-list mt-2">{meetingData.summary.risks.map((item, index) => <li className="wf-list__item" key={index}><p className="wf-list__item-description">{renderStructuredValue(item)}</p></li>)}</ul> : <p className="wf-subtle mt-2">No risks extracted.</p>}</section>
              </div>
              <section className="wf-result-block"><h3 className="wf-result-heading">Proposed action items</h3><p className="wf-field-help mt-1">AI-generated actions remain pending until an authorized user confirms or rejects them.</p>
                {meetingData.actionItems.length === 0 ? <div className="wf-empty mt-3"><strong>No action items returned</strong><p>The summary did not include proposed actions.</p></div> : <div className="wf-list mt-2">{meetingData.actionItems.map((item) => <article key={item.id} className="wf-list__item"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className="wf-list__item-title">{item.title}</h4><span className={statusTone(item.status)}>{item.status}</span></div>{item.description && <p className="wf-list__item-description">{item.description}</p>}<p className="wf-field-help mt-2">Confidence: {Math.round(Number(item.confidence) * 100)}%{item.dueDate ? ` · Due ${new Date(item.dueDate).toLocaleDateString()}` : ""}{item.evidence ? ` · Evidence: ${item.evidence}` : ""}</p>{item.confirmationNote && <p className="wf-field-help mt-1">Decision note: {item.confirmationNote}</p>}</div>
                  {item.status === "PENDING_CONFIRMATION" && <div className="wf-action-row"><button type="button" className="wf-action wf-action--primary" disabled={actionMutation.isPending} onClick={() => actionMutation.mutate({ actionItemId: item.id, decision: "CONFIRM" })}><ThumbsUp size={15} /> Confirm</button><button type="button" className="wf-action wf-action--danger" disabled={actionMutation.isPending} onClick={() => { if (window.confirm("Reject this proposed action item?")) actionMutation.mutate({ actionItemId: item.id, decision: "REJECT" }); }}><ThumbsDown size={15} /> Reject</button></div>}
                </article>)}</div>}
                <label className="wf-field-wrap mt-4"><span className="wf-field-label">Decision note <span className="wf-subtle">(optional)</span></span><input value={decisionComment} onChange={(event) => setDecisionComment(event.target.value)} maxLength={2000} placeholder="Context saved with the next decision" /></label>
              </section>
            </>}
            {actionMutation.error && <div role="alert" className="wf-callout wf-callout--danger"><AlertCircle size={16} /><p>{getApiErrorMessage(actionMutation.error)}</p></div>}
            {meetingData?.summary && <div className="wf-status wf-status--success"><CheckCircle2 size={15} /> Results are saved by backend; confirmation updates the action-item record.</div>}
          </div></section>}
        </div>
      </div>
    </div>
  );
}
