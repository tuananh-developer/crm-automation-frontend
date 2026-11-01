"use client";
/* Hallmark · v2.0.0 · shared workflow navigation · app shell extension */

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  BrainCircuit,
  ClipboardList,
  FileCheck2,
  LayoutGrid,
  ListChecks,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { UserNav } from "@/components/auth/UserNav";

const destinations = [
  { href: "/workflows", code: "Hub", label: "Workflow registry", icon: LayoutGrid, exact: true },
  { href: "/leads", code: "WF01", label: "Qualification", icon: BrainCircuit },
  { href: "/data-cleaning", code: "WF08", label: "Data cleaning", icon: WandSparkles, exact: true },
  { href: "/workflows/next-best-action", code: "WF10", label: "Next best action", icon: Sparkles },
  { href: "/workflows/sales-meetings", code: "WF11", label: "Sales meeting", icon: ClipboardList },
  { href: "/workflows/quotes", code: "WF12", label: "Quote & proposal", icon: FileCheck2 },
];

function isActive(pathname: string, href: string, exact = false) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function WorkflowChrome() {
  const pathname = usePathname();

  return (
    <header className="wf-topbar">
      <div className="wf-topbar__inner">
        <Link href="/" className="wf-brand" aria-label="CRM Automation dashboard">
          <span className="wf-brand__mark" aria-hidden="true"><ListChecks size={17} /></span>
          <span>
            CRM Automation
            <span className="wf-brand__meta">Workflow workspace</span>
          </span>
        </Link>
        <div className="wf-topbar__actions">
          <NotificationBell />
          <UserNav />
          <Link href="/" className="wf-action wf-action--quiet" aria-label="Open dashboard">
            <ArrowUpRight size={15} />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        </div>
      </div>
      <nav className="wf-nav" aria-label="Workflow navigation">
        {destinations.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="wf-nav__link"
              aria-current={active ? "page" : undefined}
            >
              <Icon size={15} aria-hidden="true" />
              <span className="wf-nav__code">{item.code}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

export function WorkflowPageHeading({
  code,
  title,
  description,
  children,
}: {
  code: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <header className="wf-page-head">
      <div className="wf-page-head__copy">
        <h1 className="wf-page-title">{title}</h1>
        <p className="wf-page-description">{description}</p>
      </div>
      <div className="wf-page-actions">
        <span className="wf-page-meta">{code}</span>
        {children}
      </div>
    </header>
  );
}
