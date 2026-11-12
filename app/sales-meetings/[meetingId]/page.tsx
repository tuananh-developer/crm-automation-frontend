"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, Check, Clock3, ShieldCheck, X } from "lucide-react";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { getApiErrorMessage } from "@/services/api-client";
import { t12WorkflowService } from "@/services/t12-workflow.service";
import type { MeetingActionItem } from "@/types/t12-workflows";
import styles from "@/components/workspace/workspace.module.css";

function statusClass(status: string) {
  if (status === "COMPLETED" || status === "CONFIRMED") return styles.statusGreen;
  if (status === "FAILED" || status === "REJECTED") return styles.statusRed;
  return styles.statusAmber;
}

export default function SalesMeetingDetailPage() {
  const params = useParams<{ meetingId: string }>();
  const meetingId = params.meetingId;
  const queryClient = useQueryClient();
  const [comments, setComments] = useState<Record<string, string>>({});
  const meetingQuery = useQuery({
    queryKey: ["sales-meeting", meetingId],
    queryFn: () => t12WorkflowService.getSalesMeeting(meetingId),
    enabled: Boolean(meetingId),
    refetchInterval: (query) =>
      query.state.data?.meeting.status === "PROCESSING" ? 2500 : false,
  });

  const confirmationMutation = useMutation({
    mutationFn: ({ itemId, decision }: { itemId: string; decision: "CONFIRM" | "REJECT" }) =>
      t12WorkflowService.confirmMeetingActionItem(itemId, {
        decision,
        comment: comments[itemId]?.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-meeting", meetingId] });
    },
  });

  const detail = meetingQuery.data;
  const meeting = detail?.meeting;
  const actionItems = useMemo(() => detail?.actionItems ?? [], [detail?.actionItems]);
  const pendingCount = actionItems.filter((item) => item.status === "PENDING_CONFIRMATION").length;

  const updateComment = (item: MeetingActionItem, value: string) => {
    setComments((current) => ({ ...current, [item.id]: value }));
  };

  const handleDecision = (item: MeetingActionItem, decision: "CONFIRM" | "REJECT") => {
    confirmationMutation.mutate({ itemId: item.id, decision });
  };

  return (
    <>
      <WorkspaceHeader />
      <main className={styles.screen}>
        <header className={styles.screenHead}>
          <div className={styles.screenHeadCopy}>
            <h1 className={styles.screenTitle}>Meeting intelligence.</h1>
            <p className={styles.screenDescription}>Review the generated summary and decide which proposed actions should become commitments.</p>
          </div>
          <Link href="/sales-meetings" className={styles.secondaryButton}><ArrowLeft size={15} /> New meeting</Link>
        </header>

        {meetingQuery.isLoading && <div className={styles.loadingState}>Loading meeting record…</div>}
        {meetingQuery.isError && (
          <div className={styles.errorPanel} role="alert"><AlertCircle size={17} />{getApiErrorMessage(meetingQuery.error)}</div>
        )}
        {meeting && (
          <>
            <section className={styles.meetingOverview}>
              <div>
                <span className={styles.meta}>Meeting / {meeting.id}</span>
                <h2>{meeting.meetingPurpose || "Sales meeting"}</h2>
                <p>{meeting.leadId ? `Lead ${meeting.leadId}` : `Customer ${meeting.customerId}`}</p>
              </div>
              <span className={`${styles.status} ${statusClass(meeting.status)}`}>{meeting.status.toLowerCase().replaceAll("_", " ")}</span>
            </section>

            <section className={styles.statStrip} aria-label="Meeting processing status">
              <div className={styles.statCell}>
                <span className={styles.statLabel}>Action items</span>
                <div className={styles.statValue}>{actionItems.length}</div>
                <span className={styles.statFoot}>Proposed by the workflow</span>
              </div>
              <div className={styles.statCell}>
                <span className={styles.statLabel}>Awaiting confirmation</span>
                <div className={styles.statValue}>{pendingCount}</div>
                <span className={styles.statFoot}>Explicit decision still required</span>
              </div>
              <div className={styles.statCell}>
                <span className={styles.statLabel}>Scheduled</span>
                <div className={styles.statValue} style={{ fontSize: "1.1rem", letterSpacing: "-0.03em" }}>
                  {meeting.scheduledAt ? new Date(meeting.scheduledAt).toLocaleString() : "Not set"}
                </div>
                <span className={styles.statFoot}>Meeting time</span>
              </div>
            </section>

            {meeting.status === "PROCESSING" && (
              <div className={styles.infoPanel} style={{ marginTop: "1.2rem" }}>
                <Clock3 size={17} />
                <span>The workflow is still processing. This page refreshes the server record every few seconds and will show the summary when it is ready.</span>
              </div>
            )}
            {meeting.status === "FAILED" && (
              <div className={styles.errorPanel} style={{ marginTop: "1.2rem" }}>
                <AlertCircle size={17} /><span>The meeting workflow failed. Check the workflow run in the backend logs for the safe failure category.</span>
              </div>
            )}

            <div className={styles.meetingResultGrid}>
              <section className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div>
                    <h2 className={styles.panelTitle}>Meeting summary</h2>
                    <p className={styles.panelHint}>Generated summary from the redacted transcript.</p>
                  </div>
                  <ShieldCheck size={18} />
                </div>
                <div className={styles.panelBody}>
                  {detail.summary ? (
                    <>
                      <p className={styles.summaryText}>{detail.summary.summary}</p>
                      <div className={styles.summaryLists}>
                        <div>
                          <h3 className={styles.subsectionTitle}>Decisions</h3>
                          {detail.summary.decisions.length ? (
                            <ul className={styles.bulletList}>
                              {detail.summary.decisions.map((decision, index) => <li key={index}>{String(decision.description ?? decision.decision ?? decision.text ?? JSON.stringify(decision))}</li>)}
                            </ul>
                          ) : <p className={styles.fieldHelp}>No decisions were returned.</p>}
                        </div>
                        <div>
                          <h3 className={styles.subsectionTitle}>Risks</h3>
                          {detail.summary.risks.length ? (
                            <ul className={styles.bulletList}>
                              {detail.summary.risks.map((risk, index) => <li key={index}>{String(risk.description ?? risk.risk ?? risk.text ?? JSON.stringify(risk))}</li>)}
                            </ul>
                          ) : <p className={styles.fieldHelp}>No risks were returned.</p>}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className={styles.emptyState}>
                      <Clock3 size={20} />
                      <strong>Summary not available yet</strong>
                      <p>The summary and action items will appear after the workflow has finished processing.</p>
                    </div>
                  )}
                </div>
              </section>

              <section className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div>
                    <h2 className={styles.panelTitle}>Transcript provenance</h2>
                    <p className={styles.panelHint}>Only redaction metadata is returned to the browser.</p>
                  </div>
                </div>
                <div className={styles.panelBody}>
                  {detail.transcript ? (
                    <div className={styles.fieldStack}>
                      <div><span className={styles.meta}>Redaction mode</span><p className={styles.rowTitle}>{detail.transcript.redactionMode}</p></div>
                      <div><span className={styles.meta}>Source</span><p className={styles.rowTitle}>{detail.transcript.sourceType}</p></div>
                      <div><span className={styles.meta}>Content hash</span><p className={styles.codeText}>{detail.transcript.contentHash}</p></div>
                      <div><span className={styles.meta}>Persisted</span><p className={styles.rowTitle}>{new Date(detail.transcript.createdAt).toLocaleString()}</p></div>
                    </div>
                  ) : <p className={styles.fieldHelp}>Transcript metadata will appear when the backend has persisted the redacted transcript.</p>}
                </div>
              </section>
            </div>

            <section className={styles.panel} style={{ marginTop: "1.2rem" }}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.panelTitle}>Action items</h2>
                  <p className={styles.panelHint}>Every proposed commitment stays pending until an attendee or Admin confirms it.</p>
                </div>
                <span className={styles.status}>{pendingCount} pending</span>
              </div>
              <div className={styles.panelBody}>
                {actionItems.length === 0 ? (
                  <div className={styles.emptyState}>
                    <ClipboardCheckIcon />
                    <strong>No action items returned</strong>
                    <p>When the workflow proposes tasks, each one will appear here with evidence and a confirmation decision.</p>
                  </div>
                ) : (
                  <div className={styles.actionItemList}>
                    {actionItems.map((item) => (
                      <article className={styles.actionItem} key={item.id}>
                        <div className={styles.actionItemHeading}>
                          <div>
                            <h3>{item.title}</h3>
                            <p>{item.description || "No additional description returned."}</p>
                          </div>
                          <span className={`${styles.status} ${statusClass(item.status)}`}>{item.status.toLowerCase().replaceAll("_", " ")}</span>
                        </div>
                        {item.evidence && <blockquote>{item.evidence}</blockquote>}
                        <div className={styles.actionItemMeta}>
                          <span>Confidence {Math.round(Number(item.confidence) * 100)}%</span>
                          <span>{item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "No due date"}</span>
                          {item.ownerAttendeeId && <span>Owner ID {item.ownerAttendeeId}</span>}
                        </div>
                        {item.status === "PENDING_CONFIRMATION" && (
                          <div className={styles.actionDecision}>
                            <label className={styles.field}>
                              <span className={styles.fieldLabel}>Decision note (optional)</span>
                              <input className={styles.textInput} value={comments[item.id] ?? ""} onChange={(event) => updateComment(item, event.target.value)} maxLength={2000} placeholder="Add a short note for the record" />
                            </label>
                            <div className={styles.decisionButtons}>
                              <button className={styles.primaryButton} type="button" onClick={() => handleDecision(item, "CONFIRM")} disabled={confirmationMutation.isPending}>
                                <Check size={15} /> Confirm action
                              </button>
                              <button className={styles.dangerButton} type="button" onClick={() => handleDecision(item, "REJECT")} disabled={confirmationMutation.isPending}>
                                <X size={15} /> Reject
                              </button>
                            </div>
                          </div>
                        )}
                        {item.confirmationNote && <p className={styles.fieldHelp}>Decision note: {item.confirmationNote}</p>}
                      </article>
                    ))}
                  </div>
                )}
                {confirmationMutation.isError && <div className={styles.errorPanel} role="alert">{getApiErrorMessage(confirmationMutation.error)}</div>}
                {confirmationMutation.isSuccess && <div className={styles.successPanel}>Decision saved. The meeting action list has been refreshed.</div>}
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}

function ClipboardCheckIcon() {
  return <ShieldCheck size={21} aria-hidden="true" />;
}
