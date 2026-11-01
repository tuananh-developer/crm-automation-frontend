/* Hallmark · v2.0.0 · component · scope: app · theme: Cobalt · scan lifecycle state */
import { AlertCircle, CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";

interface ScanStatusBadgeProps {
  status: string;
}

export function ScanStatusBadge({ status }: ScanStatusBadgeProps) {
  if (status === "PENDING") return <span className="wf-state wf-state--warning"><Clock size={14} /> Pending</span>;
  if (status === "RUNNING") return <span className="wf-state wf-state--info"><Loader2 size={14} className="animate-spin" /> Scanning</span>;
  if (status === "SUCCESS") return <span className="wf-state wf-state--success"><CheckCircle2 size={14} /> Completed</span>;
  if (status === "PARTIAL") return <span className="wf-state wf-state--warning"><AlertCircle size={14} /> Partially completed</span>;
  if (status === "FAILED" || status === "CANCELLED") return <span className="wf-state wf-state--danger"><XCircle size={14} /> {status === "FAILED" ? "Failed" : "Cancelled"}</span>;
  return <span className="wf-state wf-state--info">{status}</span>;
}
