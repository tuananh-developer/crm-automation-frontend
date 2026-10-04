import Link from "next/link";
import {
  ClipboardCheck,
  Clock3,
  Sparkles,
  Target,
  Users,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f8faf9] text-[#17221c]">
      {/* Header */}
      <header className="border-b border-[#e2e8e4] bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm font-bold text-lg">
              CRM
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">
                CRM Intelligent Automation Platform
              </h1>
              <p className="text-xs text-gray-500">
                AI Pipeline · Lead Scoring · Automated Cadences
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              asChild
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs h-9"
            >
              <Link href="/leads">
                <Target className="size-4 mr-1.5" />
                Go to Leads Intelligence
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Hub */}
      <main className="mx-auto w-full max-w-7xl px-6 py-10 space-y-10">
        {/* Hero banner */}
        <div className="rounded-3xl bg-gradient-to-br from-emerald-800 via-teal-900 to-[#17221c] p-8 md:p-12 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200 border border-emerald-400/20">
              <Sparkles className="size-3.5" />
              <span>UC03 &amp; UC04 Modules Active</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              AI-Powered Lead Enrichment &amp; Predictive Scoring
            </h2>
            <p className="text-sm md:text-base text-emerald-100/80 leading-relaxed">
              Instantly discover verified firmographics, employee counts,
              LinkedIn company pages, and compute intelligent HOT / WARM / COLD
              lead scores to accelerate your sales pipeline.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-white text-emerald-950 hover:bg-emerald-50 font-bold text-sm shadow-md"
              >
                <Link href="/leads">
                  Explore Leads Intelligence
                  <ArrowRight className="size-4 ml-2" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 font-medium text-sm"
              >
                <Link href="/follow-ups">Follow-up Sequences</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Core Modules Grid */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Platform Modules
          </h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Module 1: FE-05 Leads Intelligence */}
            <Card className="group border-emerald-200/80 hover:border-emerald-500 hover:shadow-md transition-all bg-white overflow-hidden">
              <CardContent className="p-6 space-y-4 flex flex-col justify-between h-full">
                <div className="space-y-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <Target className="size-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                      FE-05 · UC03 &amp; UC04
                    </span>
                    <h4 className="text-base font-bold text-gray-900 mt-0.5">
                      AI Lead Intelligence
                    </h4>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Company profile enrichment, employee sizes, verified contact
                    links, and real-time AI scoring (HOT/WARM/COLD).
                  </p>
                </div>
                <Button
                  asChild
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  <Link href="/leads">Open Leads Pipeline</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Module 2: Follow-ups */}
            <Card className="group hover:border-gray-300 hover:shadow-md transition-all bg-white overflow-hidden">
              <CardContent className="p-6 space-y-4 flex flex-col justify-between h-full">
                <div className="space-y-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    <Clock3 className="size-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      FE-08 · UC06
                    </span>
                    <h4 className="text-base font-bold text-gray-900 mt-0.5">
                      Follow-up Cadences
                    </h4>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Track automated execution logs, multi-step email outreach,
                    delays, and re-trigger individual sequence steps.
                  </p>
                </div>
                <Button asChild variant="outline" className="w-full text-xs font-semibold">
                  <Link href="/follow-ups">Open Follow-ups</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Module 3: Customers & Segments */}
            <Card className="group hover:border-gray-300 hover:shadow-md transition-all bg-white overflow-hidden">
              <CardContent className="p-6 space-y-4 flex flex-col justify-between h-full">
                <div className="space-y-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <Users className="size-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      FE-10 · UC09
                    </span>
                    <h4 className="text-base font-bold text-gray-900 mt-0.5">
                      Customers &amp; Segments
                    </h4>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Customer directories, rule-based audience segmentation, and
                    targeted dynamic cohorts.
                  </p>
                </div>
                <Button asChild variant="outline" className="w-full text-xs font-semibold">
                  <Link href="/customers">Open Customers</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Module 4: Human Review Center */}
            <Card className="group hover:border-gray-300 hover:shadow-md transition-all bg-white overflow-hidden">
              <CardContent className="p-6 space-y-4 flex flex-col justify-between h-full">
                <div className="space-y-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                    <ClipboardCheck className="size-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      FE-09 · UC07
                    </span>
                    <h4 className="text-base font-bold text-gray-900 mt-0.5">
                      Review &amp; Notifications
                    </h4>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Human-in-the-loop task queues, confidence flagging, approval
                    workflows, and in-app alerts.
                  </p>
                </div>
                <Button asChild variant="outline" className="w-full text-xs font-semibold">
                  <Link href="/review">Open Review Center</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
