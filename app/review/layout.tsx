"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Link from "next/link";
import { ClipboardCheck, Clock3, LayoutDashboard, Layers } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Layout for UC07 - Human Review Center (FE-09).
 * The QueryClient lives in this nested layout so the shared root layout
 * stays untouched.
 */
export default function ReviewLayout({
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
      <div className="min-h-screen bg-[#f6f8f7] text-[#17221c]">
        <header className="border-b border-[#e2e8e4] bg-white">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#173b2b] p-2.5 text-white">
                <ClipboardCheck className="size-5" />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  UC07 · Human Review
                </p>
                <h1 className="text-xl font-bold">Review Center</h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="ghost">
                <Link href="/">
                  <LayoutDashboard />
                  Dashboard
                </Link>
              </Button>

              <Button asChild variant="outline">
                <Link href="/follow-ups">
                  <Clock3 />
                  Follow-up
                </Link>
              </Button>

              <Button asChild variant="outline">
                <Link href="/segments">
                  <Layers />
                  Segments
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
