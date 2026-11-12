"use client";

import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import styles from "@/components/workspace/workspace.module.css";

export default function LeadsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <WorkspaceHeader />
      <main className={styles.screen}>{children}</main>
    </>
  );
}
