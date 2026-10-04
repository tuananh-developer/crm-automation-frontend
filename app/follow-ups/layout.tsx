"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Link from "next/link";
import {
  Clock3,
  Layers,
  LayoutDashboard,
  Target,
  Users,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";

/**
 * Layout for UC05 (Follow-up Sequences & Step Builder) and UC06 (Follow-up Execution History).
 */
export default function FollowUpsLayout({
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
        <header className="border-b border-[#e2e8e4] bg-white sticky top-0 z-40">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-800 p-2.5 text-white shadow-xs">
                <Clock3 className="size-5" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    UC05 &amp; UC06 · Follow-Up Studio
                  </p>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                    FE-06
                  </span>
                </div>
                <h1 className="text-lg font-bold text-gray-900">
                  Sequences &amp; Cadence Builder
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <NotificationBell />

              <Button asChild variant="outline" className="text-xs h-9">
                <Link href="/">
                  <LayoutDashboard className="size-3.5 mr-1" />
                  Dashboard
                </Link>
              </Button>

              <Button asChild variant="outline" className="text-xs h-9">
                <Link href="/leads">
                  <Target className="size-3.5 mr-1" />
                  Leads
                </Link>
              </Button>

              <Button
                asChild
                variant="default"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs h-9 shadow-2xs"
              >
                <Link href="/follow-ups">
                  <Clock3 className="size-3.5 mr-1" />
                  Cadences
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

        <main className="mx-auto w-full max-w-7xl space-y-6 px-5 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </QueryClientProvider>
  );
}