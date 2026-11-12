"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { CalendarClock, FileAudio, Users } from "lucide-react";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { leadService } from "@/services/lead.service";
import { getCustomers } from "@/services/customer.service";
import { getApiErrorMessage } from "@/services/api-client";
import { createIdempotencyKey, t12WorkflowService } from "@/services/t12-workflow.service";
import styles from "@/components/workspace/workspace.module.css";

export default function SalesMeetingsPage() {
  const router = useRouter();
  const [entityType, setEntityType] = useState<"Lead" | "Customer">("Lead");
  const [entityId, setEntityId] = useState("");
  const [meetingPurpose, setMeetingPurpose] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [transcript, setTranscript] = useState("");
  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);
  const [acceptedRun, setAcceptedRun] = useState<string | null>(null);

  const leadsQuery = useQuery({
    queryKey: ["leads", "sales-meeting"],
    queryFn: () => leadService.getLeads({ limit: 100, page: 1 }),
    enabled: entityType === "Lead",
  });
  const customersQuery = useQuery({
    queryKey: ["customers", "sales-meeting"],
    queryFn: () => getCustomers({ limit: 100, page: 1 }),
    enabled: entityType === "Customer",
  });
  const assigneesQuery = useQuery({
    queryKey: ["users", "assignees"],
    queryFn: t12WorkflowService.getAssignees,
  });

  const entityOptions = useMemo(() => {
    if (entityType === "Lead") {
      return (leadsQuery.data?.data ?? []).map((lead) => ({
        id: lead.id,
        label: `${[lead.firstName, lead.lastName].filter(Boolean).join(" ")} · ${lead.companyName || lead.email}`,
      }));
    }
    return (customersQuery.data?.data ?? []).map((customer) => ({
      id: customer.id,
      label: `${customer.name} · ${customer.companyName || customer.email}`,
    }));
  }, [entityType, leadsQuery.data?.data, customersQuery.data?.data]);

  const requestMutation = useMutation({
    mutationFn: () =>
      t12WorkflowService.requestSalesMeeting(
        {
          ...(entityType === "Lead" ? { leadId: entityId } : { customerId: entityId }),
          attendeeIds,
          transcript,
          meetingPurpose: meetingPurpose.trim() || undefined,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
          sourceType: "MEETING_TRANSCRIPT",
        },
        createIdempotencyKey(),
      ),
    onSuccess: (result) => {
      if (result.meetingId) {
        router.push(`/sales-meetings/${result.meetingId}`);
      } else {
        setAcceptedRun(result.workflowRunId);
      }
    },
  });

  const toggleAttendee = (id: string) => {
    setAttendeeIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!entityId || transcript.trim().length < 20) return;
    requestMutation.mutate();
  };

  return (
    <>
      <WorkspaceHeader />
      <main className={styles.screen}>
        <header className={styles.screenHead}>
          <div className={styles.screenHeadCopy}>
            <div className={styles.kicker}>T12 · WF11 / Conversation intelligence</div>
            <h1 className={styles.screenTitle}>Bring the meeting into focus.</h1>
            <p className={styles.screenDescription}>
              Submit a transcript with its Lead or Customer context. The backend redacts the transcript before it is persisted and dispatched for analysis.
            </p>
          </div>
          <div className={styles.headMetric}>
            <span className={styles.meta}>INPUT LIMIT</span>
            <strong>150k</strong>
            <span>characters maximum</span>
          </div>
        </header>

        {acceptedRun && (
          <div className={styles.successPanel}>
            <CalendarClock size={17} />
            <span>Request accepted. Workflow run: <code className={styles.codeText}>{acceptedRun}</code>. The backend did not return a meeting ID, so open the meeting from its result when available.</span>
          </div>
        )}
        {requestMutation.isError && (
          <div className={styles.errorPanel} role="alert">{getApiErrorMessage(requestMutation.error)}</div>
        )}

        <form className={styles.meetingForm} onSubmit={submit}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Meeting context</h2>
                <p className={styles.panelHint}>The request must belong to exactly one Lead or Customer.</p>
              </div>
              <CalendarClock size={19} />
            </div>
            <div className={styles.panelBody}>
              <div className={styles.fieldStack}>
                <div className={styles.segmentControl} role="group" aria-label="Meeting entity type">
                  <button type="button" className={entityType === "Lead" ? styles.segmentActive : styles.segment} onClick={() => { setEntityType("Lead"); setEntityId(""); }}>Lead</button>
                  <button type="button" className={entityType === "Customer" ? styles.segmentActive : styles.segment} onClick={() => { setEntityType("Customer"); setEntityId(""); }}>Customer</button>
                </div>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>{entityType} record</span>
                  <select className={styles.selectInput} value={entityId} onChange={(event) => setEntityId(event.target.value)} required>
                    <option value="">Choose a {entityType.toLowerCase()}</option>
                    {entityOptions.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
                  </select>
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Meeting purpose</span>
                  <input className={styles.textInput} value={meetingPurpose} onChange={(event) => setMeetingPurpose(event.target.value)} maxLength={500} placeholder="e.g. Discovery call, renewal review, solution walkthrough" />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Scheduled time</span>
                  <input className={styles.textInput} type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
                </label>
              </div>
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Attendees</h2>
                <p className={styles.panelHint}>Optional. Only active workspace assignees are selectable.</p>
              </div>
              <Users size={19} />
            </div>
            <div className={styles.panelBody}>
              {assigneesQuery.isLoading ? (
                <p className={styles.loadingState}>Loading active assignees…</p>
              ) : assigneesQuery.isError ? (
                <div className={styles.errorPanel} role="alert">{getApiErrorMessage(assigneesQuery.error)}</div>
              ) : (assigneesQuery.data ?? []).length === 0 ? (
                <p className={styles.fieldHelp}>No active assignees were returned.</p>
              ) : (
                <div className={styles.checkList}>
                  {(assigneesQuery.data ?? []).map((assignee) => (
                    <label className={styles.checkItem} key={assignee.id}>
                      <input type="checkbox" checked={attendeeIds.includes(assignee.id)} onChange={() => toggleAttendee(assignee.id)} />
                      <span>{assignee.name}</span>
                      <span className={styles.meta}>{assignee.role}</span>
                    </label>
                  ))}
                </div>
              )}
              <p className={styles.fieldHelp}>{attendeeIds.length} attendee(s) selected. The meeting owner is included by the backend.</p>
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Transcript</h2>
                <p className={styles.panelHint}>Paste the meeting text. Raw transcript content is sent only to the backend ingress, where redaction happens before AI dispatch.</p>
              </div>
              <FileAudio size={19} />
            </div>
            <div className={styles.panelBody}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Meeting transcript · required</span>
                <textarea
                  className={styles.textArea}
                  value={transcript}
                  onChange={(event) => setTranscript(event.target.value)}
                  minLength={20}
                  maxLength={150000}
                  required
                  placeholder="Paste the transcript or meeting notes here. Include enough context for decisions, risks, and action items to be identified."
                />
                <span className={styles.fieldHelp}>{transcript.length.toLocaleString()} / 150,000 characters · minimum 20</span>
              </label>
              <div className={styles.formFooter}>
                <span className={styles.fieldHelp}>No summary or action item is treated as confirmed until a participant reviews it.</span>
                <button className={styles.primaryButton} type="submit" disabled={!entityId || transcript.trim().length < 20 || requestMutation.isPending}>
                  {requestMutation.isPending ? "Sending to workflow…" : "Analyze meeting"}
                </button>
              </div>
            </div>
          </section>
        </form>
      </main>
    </>
  );
}
