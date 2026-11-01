/* Hallmark · v2.0.0 · redesign: full · scope: app · genre: modern-minimal · theme: Cobalt · signature: workflow registry */
import Link from "next/link";
import {
  ArrowUpRight,
  BrainCircuit,
  ClipboardList,
  FileCheck2,
  ListChecks,
  ShieldCheck,
  WandSparkles,
} from "lucide-react";
import { WorkflowPageHeading } from "@/components/workflows/WorkflowChrome";

const workflows = [
  {
    id: "WF01",
    title: "AI Lead Qualification",
    task: "Assess lead intent and confidence; route uncertain results to review.",
    route: "/leads",
    entry: "Lead detail",
    state: "Available",
    icon: BrainCircuit,
  },
  {
    id: "WF08",
    title: "AI Data Cleaning",
    task: "Scan lead records, inspect findings and apply approved corrections.",
    route: "/data-cleaning",
    entry: "Cleaning workspace",
    state: "Available",
    icon: WandSparkles,
  },
  {
    id: "WF10",
    title: "Next Best Action",
    task: "Request ranked, evidence-backed actions for an authorized record.",
    route: "/workflows/next-best-action",
    entry: "Lead or customer",
    state: "Available · result lookup needs recommendation ID",
    icon: ListChecks,
  },
  {
    id: "WF11",
    title: "Sales Meeting",
    task: "Summarize a redacted transcript and review proposed action items.",
    route: "/workflows/sales-meetings",
    entry: "Meeting transcript",
    state: "Available",
    icon: ClipboardList,
  },
  {
    id: "WF12",
    title: "Quote & Proposal",
    task: "Create a proposal from catalog items and process Admin approval.",
    route: "/workflows/quotes",
    entry: "Lead or customer",
    state: "Available",
    icon: FileCheck2,
  },
];

export default function WorkflowHubPage() {
  return (
    <div className="wf-screen">
      <WorkflowPageHeading
        code="5 owned workflows"
        title="Workflow registry"
        description="Operational entry points for the workflows in this delivery scope. Business rules, authorization and data mutations remain on the backend."
      />

      <section className="wf-panel" aria-labelledby="wf-registry-title">
        <div className="wf-panel__head">
          <div>
            <h2 id="wf-registry-title" className="wf-panel__title">Workflow index</h2>
            <p className="wf-panel__hint">Select a workflow to open its working screen.</p>
          </div>
          <span className="wf-status"><ShieldCheck size={15} /> Backend-authoritative</span>
        </div>
        <div className="wf-table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="wf-table" style={{ minWidth: 760 }}>
            <thead>
              <tr>
                <th scope="col">Workflow</th>
                <th scope="col">Purpose</th>
                <th scope="col">Entry</th>
                <th scope="col">Frontend status</th>
                <th scope="col"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {workflows.map((workflow) => {
                const Icon = workflow.icon;
                return (
                  <tr key={workflow.id}>
                    <td>
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="wf-brand__mark" aria-hidden="true"><Icon size={16} /></span>
                        <span className="min-w-0">
                          <span className="wf-mono block">{workflow.id}</span>
                          <span className="wf-table__primary block">{workflow.title}</span>
                        </span>
                      </div>
                    </td>
                    <td>{workflow.task}</td>
                    <td>{workflow.entry}</td>
                    <td>
                      <span className={workflow.id === "WF10" ? "wf-state wf-state--warning" : "wf-state wf-state--success"}>
                        {workflow.state}
                      </span>
                    </td>
                    <td className="text-right">
                      <Link href={workflow.route} className="wf-inline-link inline-flex items-center gap-1">
                        Open <ArrowUpRight size={14} aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="wf-callout wf-callout--info">
        <ShieldCheck size={16} aria-hidden="true" />
        <p>
          <strong>Permission boundary.</strong> The UI requests actions from NestJS. It does not execute AI recommendations, calculate quote prices, apply data corrections or approve items on its own.
        </p>
      </div>
    </div>
  );
}
