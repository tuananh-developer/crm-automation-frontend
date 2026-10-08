"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Link from "next/link";
import {
  ClipboardCheck,
  Clock3,
  Layers,
  Users,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export default function LeadsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 15_000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-[#f8faf9] text-[#17221c]">
        {/* Navigation Header */}
        <header className="border-b border-[#e2e8e4] bg-white sticky top-0 z-40">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm">
                <Target className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    UC03 &amp; UC04 · Lead Intelligence
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                    FE-05
                  </span>
                </div>
                <h1 className="text-lg font-bold text-gray-900">
                  AI Enrichment &amp; Lead Scoring
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <NotificationBell />

              <Button
                asChild
                variant="default"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs h-9 shadow-2xs"
              >
                <Link href="/leads">
                  <Target className="size-3.5 mr-1" />
                  Leads
                </Link>
              </Button>

              <Button asChild variant="outline" className="text-xs h-9">
                <Link href="/follow-ups">
                  <Clock3 className="size-3.5 mr-1" />
                  Follow-ups
                </Link>
              </Button>

              <Button asChild variant="outline" className="text-xs h-9">
                <Link href="/customers">
                  <Users className="size-3.5 mr-1" />
                  Customers
                </Link>
              </Button>

              <Button asChild variant="outline" className="text-xs h-9">
                <Link href="/segments">
                  <Layers className="size-3.5 mr-1" />
                  Segments
                </Link>
              </Button>

              <Button asChild variant="outline" className="text-xs h-9">
                <Link href="/review">
                  <ClipboardCheck className="size-3.5 mr-1" />
                  Review Center
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="mx-auto w-full max-w-7xl space-y-6 px-5 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </QueryClientProvider>
  );
}
