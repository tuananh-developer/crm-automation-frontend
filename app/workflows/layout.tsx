/* Hallmark · v2.0.0 · app shell · preserve project navigation and account controls */
import "./workflows.css";
import type { ReactNode } from "react";
import { WorkflowChrome } from "@/components/workflows/WorkflowChrome";

export default function WorkflowsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="wf-app">
      <WorkflowChrome />
      <main className="wf-main">{children}</main>
    </div>
  );
}
