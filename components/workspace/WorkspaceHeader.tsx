"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BadgeCheck,
  BrainCircuit,
  ClipboardList,
  FileText,
  Home,
  ScanSearch,
  Users,
} from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { UserNav } from "@/components/auth/UserNav";
import styles from "./workspace.module.css";

const navigation = [
  { href: "/", label: "Overview", icon: Home, match: (path: string) => path === "/" },
  { href: "/qualification", label: "Qualification", icon: BadgeCheck, match: (path: string) => path.startsWith("/qualification") },
  { href: "/data-cleaning", label: "Data cleaning", icon: ScanSearch, match: (path: string) => path.startsWith("/data-cleaning") },
  { href: "/next-best-actions", label: "Next best action", icon: BrainCircuit, match: (path: string) => path.startsWith("/next-best-actions") },
  { href: "/sales-meetings", label: "Sales meetings", icon: ClipboardList, match: (path: string) => path.startsWith("/sales-meetings") },
  { href: "/quotes", label: "Quotes", icon: FileText, match: (path: string) => path.startsWith("/quotes") },
  { href: "/leads", label: "Leads", icon: Users, match: (path: string) => path.startsWith("/leads") },
];

export function WorkspaceHeader() {
  const pathname = usePathname();

  return (
    <header className={styles.topbar}>
      <div className={styles.topbarInner}>
        <Link href="/" className={styles.brand} aria-label="CRM Signal Desk overview">
          <span className={styles.brandMark} aria-hidden="true">
            <Activity size={19} strokeWidth={2.2} />
          </span>
          <span className={styles.brandCopy}>
            <strong>Signal Desk</strong>
            <span>CRM · Revenue operations</span>
          </span>
        </Link>

        <nav className={styles.navigation} aria-label="Owned workflow navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = item.match(pathname);
            return (
              <Link
                href={item.href}
                key={item.href}
                className={active ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={15} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.accountTools}>
          <NotificationBell />
          <span className={styles.accountDivider} aria-hidden="true" />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
