"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Lightbulb,
  Loader2,
  PhoneCall,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  UserCheck,
} from "lucide-react";

import { getCustomer360, triggerCustomer360 } from "@/services/customer.service";
import { getApiErrorMessage } from "@/services/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/components/segments/segment-utils";
import type { SourceCoverageStatus } from "@/types/customer-360";

import type { BadgeTone } from "@/components/ui/badge";

interface CoverageMeta {
  tone: BadgeTone;
  label: string;
  tooltip?: string;
}

function getSourceCoverageMeta(status?: SourceCoverageStatus | string): CoverageMeta {
  switch (status) {
    case "AVAILABLE":
      return {
        tone: "success",
        label: "Có dữ liệu",
        tooltip: "Nguồn dữ liệu đã kết nối và có bản ghi được nạp",
      };
    case "EMPTY":
      return {
        tone: "neutral",
        label: "Chưa có dữ liệu",
        tooltip: "Nguồn dữ liệu đã kết nối nhưng hiện tại chưa có bản ghi",
      };
    case "NOT_CONNECTED":
      return {
        tone: "warning",
        label: "Chưa kết nối",
        tooltip: "Hệ thống hoặc module bên ngoài chưa tích hợp",
      };
    case "UNAVAILABLE":
      return {
        tone: "danger",
        label: "Không khả dụng",
        tooltip: "Không thể kết nối dịch vụ trong lần quét gần nhất",
      };
    default:
      return {
        tone: "neutral",
        label: "Chưa có dữ liệu",
        tooltip: "Trạng thái không xác định",
      };
  }
}

interface Customer360TabProps {
  customerId: string;
}

export function Customer360Tab({ customerId }: Customer360TabProps) {
  const queryClient = useQueryClient();

  const {
    data: data360,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["customer-360", customerId],
    queryFn: () => getCustomer360(customerId),
    refetchInterval: (query) => {
      // Auto-poll if a workflow run is actively PENDING
      const runStatus = query.state.data?.latestWorkflowRun?.status;
      return runStatus === "PENDING" ? 3000 : false;
    },
  });

  const [triggerError, setTriggerError] = React.useState<string | null>(null);

  const triggerMutation = useMutation({
    mutationFn: () => triggerCustomer360(customerId),
    onMutate: () => {
      setTriggerError(null);
    },
    onSuccess: () => {
      setTriggerError(null);
      queryClient.invalidateQueries({ queryKey: ["customer-360", customerId] });
    },
    onError: (err: unknown) => {
      const msg =
        getApiErrorMessage(err) ||
        "Không thể kích hoạt quy trình AI Customer 360. Vui lòng kiểm tra kết nối và thử lại.";
      setTriggerError(msg);
    },
  });

  if (isLoading) {
    return (
      <div
        data-testid="customer-360-loading"
        className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-gray-500"
      >
        <Loader2 className="size-8 animate-spin text-[#173b2b]" />
        <p className="text-sm font-medium">Đang tổng hợp dữ liệu Customer 360...</p>
      </div>
    );
  }

  if (isError || !data360) {
    return (
      <Card data-testid="customer-360-error" className="border-red-200 bg-red-50/50">
        <CardContent className="flex flex-col items-center justify-center gap-3 p-6 text-center">
          <AlertTriangle className="size-8 text-red-600" />
          <p className="text-sm font-medium text-red-800">
            {getApiErrorMessage(error) || "Không thể tải dữ liệu Customer 360"}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-2"
          >
            <RefreshCw className="size-4" />
            Thử lại
          </Button>
        </CardContent>
      </Card>
    );
  }

  const {
    convertedLeads,
    interactions,
    sourceCoverage,
    aiSummary,
    latestWorkflowRun,
  } = data360;

  const isAnalyzing = triggerMutation.isPending || latestWorkflowRun?.status === "PENDING";

  return (
    <div data-testid="customer-360-container" className="space-y-6">
      {/* Action Header & Workflow Run Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#e2e8e4] bg-[#f9faf9] p-4">
        <div>
          <div className="flex items-center gap-2">
            <BrainCircuit className="size-5 text-[#173b2b]" />
            <h3 className="text-base font-bold text-[#17221c]">
              Hồ sơ tổng hợp AI Customer 360 (T12-WF05)
            </h3>
            {aiSummary?.aiModel && (
              <Badge tone="info" className="font-mono text-[11px]">
                {aiSummary.aiModel}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            Tổng hợp đa nguồn: Vòng đời Lead, Tương tác thực tế, Lead Intelligence, Chiến dịch và Phân khúc.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            data-testid="btn-trigger-360"
            onClick={() => triggerMutation.mutate()}
            disabled={isAnalyzing}
            className="bg-[#173b2b] text-white hover:bg-[#123023] disabled:opacity-60"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                AI đang phân tích...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Cập nhật phân tích AI 360
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Trigger or Run Failure Alert Banner */}
      {(triggerError || (latestWorkflowRun?.status === "FAILED" && !aiSummary)) && (
        <div
          data-testid="customer-360-trigger-error"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50/70 p-4 text-sm text-red-900"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">
                {triggerError
                  ? "Kích hoạt phân tích thất bại"
                  : "Quy trình phân tích Customer 360 gặp sự cố"}
              </p>
              <p className="mt-0.5 text-xs text-red-700">
                {triggerError ||
                  latestWorkflowRun?.errorMessage ||
                  "Dịch vụ n8n hoặc AI synthesis không thể hoàn thành tổng hợp dữ liệu. Vui lòng thử lại."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setTriggerError(null);
                triggerMutation.mutate();
              }}
              disabled={isAnalyzing}
              className="border-red-300 bg-white text-red-800 hover:bg-red-50 hover:text-red-900"
            >
              <RefreshCw className={`size-3.5 ${triggerMutation.isPending ? "animate-spin" : ""}`} />
              Thử lại ngay
            </Button>
            {triggerError && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setTriggerError(null)}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Đóng
              </Button>
            )}
          </div>
        </div>
      )}

      {/* AI 360 Executive Summary Card */}
      {aiSummary ? (
        <Card data-testid="customer-360-ai-summary" className="overflow-hidden border-[#173b2b]/20 shadow-sm">
          <div className="bg-gradient-to-r from-[#173b2b] to-[#255740] px-5 py-3 text-white">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-semibold">
                <Sparkles className="size-4 text-emerald-300" />
                Bản tóm lược Chiến lược Khách hàng (AI Executive Summary)
              </div>
              {aiSummary.evaluatedAt && (
                <span className="flex items-center gap-1 text-xs text-emerald-100">
                  <Clock className="size-3.5" />
                  Đánh giá: {formatDateTime(aiSummary.evaluatedAt)}
                </span>
              )}
            </div>
          </div>

          <CardContent className="space-y-5 p-5">
            <p className="text-sm leading-relaxed text-[#17221c]">
              {aiSummary.summary}
            </p>

            {/* 4 Pillars Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Key Strengths */}
              <div
                data-testid="360-strengths"
                className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-4"
              >
                <div className="flex items-center gap-2 font-semibold text-emerald-800">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  Điểm mạnh cốt lõi
                </div>
                <ul className="mt-2.5 space-y-1.5 text-xs text-emerald-950">
                  {aiSummary.keyStrengths?.length ? (
                    aiSummary.keyStrengths.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))
                  ) : (
                    <li className="italic text-gray-500">Chưa ghi nhận điểm mạnh đặc thù.</li>
                  )}
                </ul>
              </div>

              {/* Potential Risks */}
              <div
                data-testid="360-risks"
                className="rounded-lg border border-amber-100 bg-amber-50/40 p-4"
              >
                <div className="flex items-center gap-2 font-semibold text-amber-800">
                  <ShieldAlert className="size-4 text-amber-600" />
                  Rủi ro & Tín hiệu rời bỏ (Churn)
                </div>
                <ul className="mt-2.5 space-y-1.5 text-xs text-amber-950">
                  {aiSummary.potentialRisks?.length ? (
                    aiSummary.potentialRisks.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))
                  ) : (
                    <li className="italic text-gray-500">Không có rủi ro nghiêm trọng.</li>
                  )}
                </ul>
              </div>

              {/* Growth Opportunities */}
              <div
                data-testid="360-opportunities"
                className="rounded-lg border border-blue-100 bg-blue-50/40 p-4"
              >
                <div className="flex items-center gap-2 font-semibold text-blue-800">
                  <TrendingUp className="size-4 text-blue-600" />
                  Cơ hội mở rộng (Upsell / Expansion)
                </div>
                <ul className="mt-2.5 space-y-1.5 text-xs text-blue-950">
                  {aiSummary.growthOpportunities?.length ? (
                    aiSummary.growthOpportunities.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-blue-500 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))
                  ) : (
                    <li className="italic text-gray-500">Chưa xác định cơ hội mở rộng.</li>
                  )}
                </ul>
              </div>

              {/* Recommended Next Action */}
              <div
                data-testid="360-next-action"
                className="rounded-lg border border-purple-100 bg-purple-50/40 p-4"
              >
                <div className="flex items-center gap-2 font-semibold text-purple-800">
                  <Lightbulb className="size-4 text-purple-600" />
                  Hành động đề xuất tiếp theo
                </div>
                <p className="mt-2.5 text-xs font-medium leading-relaxed text-purple-950">
                  {aiSummary.recommendedNextAction || "Duy trì tần suất chăm sóc khách hàng định kỳ."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-gray-300 bg-gray-50/50 p-6 text-center">
          <Bot className="mx-auto size-8 text-gray-400" />
          <h4 className="mt-2 text-sm font-semibold text-gray-700">Chưa có phân tích AI 360</h4>
          <p className="mt-1 text-xs text-gray-500">
            Bấm nút &quot;Cập nhật phân tích AI 360&quot; ở trên để n8n & Google Gemini tổng hợp thông tin khách hàng.
          </p>
        </Card>
      )}

      {/* Source Coverage Matrix (Tech Lead Compliance) */}
      <Card data-testid="source-coverage-card">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Độ phủ dữ liệu nguồn (Data Source Provenance - Topic 12)
            </h4>
            <span className="text-[11px] text-gray-400">
              Quy tắc minh bạch: Không làm giả nguồn chưa tích hợp
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {/* 1. CRM Profile */}
            {(() => {
              const meta = getSourceCoverageMeta(sourceCoverage?.crmProfile);
              return (
                <div className="flex items-center justify-between rounded-lg border border-[#e2e8e4] p-2.5 text-xs">
                  <span className="text-gray-700 font-medium">Hồ sơ CRM</span>
                  <Badge tone={meta.tone} title={meta.tooltip}>
                    {meta.label}
                  </Badge>
                </div>
              );
            })()}

            {/* 2. Interactions */}
            {(() => {
              const meta = getSourceCoverageMeta(sourceCoverage?.interactions);
              return (
                <div className="flex items-center justify-between rounded-lg border border-[#e2e8e4] p-2.5 text-xs">
                  <span className="text-gray-700 font-medium">Lịch sử tương tác</span>
                  <Badge tone={meta.tone} title={meta.tooltip}>
                    {meta.label}
                  </Badge>
                </div>
              );
            })()}

            {/* 3. Lead Intelligence */}
            {(() => {
              const meta = getSourceCoverageMeta(sourceCoverage?.leadIntelligence);
              return (
                <div className="flex items-center justify-between rounded-lg border border-[#e2e8e4] p-2.5 text-xs">
                  <span className="text-gray-700 font-medium">Trí tuệ nhân tạo Lead</span>
                  <Badge tone={meta.tone} title={meta.tooltip}>
                    {meta.label}
                  </Badge>
                </div>
              );
            })()}

            {/* 4. Follow-up sequences */}
            {(() => {
              const meta = getSourceCoverageMeta(sourceCoverage?.followUps);
              return (
                <div className="flex items-center justify-between rounded-lg border border-[#e2e8e4] p-2.5 text-xs">
                  <span className="text-gray-700 font-medium">Kịch bản chăm sóc</span>
                  <Badge tone={meta.tone} title={meta.tooltip}>
                    {meta.label}
                  </Badge>
                </div>
              );
            })()}

            {/* 5. Customer Segments */}
            {(() => {
              const meta = getSourceCoverageMeta(sourceCoverage?.segments);
              return (
                <div className="flex items-center justify-between rounded-lg border border-[#e2e8e4] p-2.5 text-xs">
                  <span className="text-gray-700 font-medium">Phân khúc khách hàng</span>
                  <Badge tone={meta.tone} title={meta.tooltip}>
                    {meta.label}
                  </Badge>
                </div>
              );
            })()}

            {/* 6. Support Tickets */}
            {(() => {
              const meta = getSourceCoverageMeta(sourceCoverage?.customerIssues);
              return (
                <div className="flex items-center justify-between rounded-lg border border-amber-200/80 bg-amber-50/20 p-2.5 text-xs">
                  <span className="text-gray-700 font-medium">Ticket / Vấn đề hỗ trợ</span>
                  <Badge tone={meta.tone} title={meta.tooltip}>
                    {meta.label}
                  </Badge>
                </div>
              );
            })()}

            {/* 7. Feedback */}
            {(() => {
              const meta = getSourceCoverageMeta(sourceCoverage?.customerFeedback);
              return (
                <div className="flex items-center justify-between rounded-lg border border-[#e2e8e4] p-2.5 text-xs">
                  <span className="text-gray-700 font-medium">Ý kiến phản hồi (Feedback)</span>
                  <Badge tone={meta.tone} title={meta.tooltip}>
                    {meta.label}
                  </Badge>
                </div>
              );
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Converted Leads & Timeline Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Converted Leads */}
        <Card data-testid="converted-leads-card">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2 border-b border-[#edf0ee] pb-3">
              <UserCheck className="size-4 text-[#173b2b]" />
              <h4 className="text-sm font-bold text-[#17221c]">
                Lead chuyển đổi liên kết ({convertedLeads.length})
              </h4>
            </div>

            {convertedLeads.length > 0 ? (
              <div className="space-y-3">
                {convertedLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#e2e8e4] p-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#17221c]">
                        {lead.firstName} {lead.lastName || ""}
                      </p>
                      <p className="text-gray-500">{lead.email} • {lead.jobTitle || "N/A"}</p>
                    </div>
                    {lead.convertedAt && (
                      <span className="text-[11px] text-gray-400">
                        Chuyển đổi: {formatDateTime(lead.convertedAt)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs italic text-gray-500">Khách hàng tạo trực tiếp (không qua phễu chuyển đổi lead).</p>
            )}
          </CardContent>
        </Card>

        {/* Interaction History Timeline */}
        <Card data-testid="interaction-history-card">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2 border-b border-[#edf0ee] pb-3">
              <Activity className="size-4 text-[#173b2b]" />
              <h4 className="text-sm font-bold text-[#17221c]">
                Nhật ký tương tác gần đây ({interactions.length})
              </h4>
            </div>

            {interactions.length > 0 ? (
              <div className="space-y-3">
                {interactions.slice(0, 5).map((inter) => (
                  <div
                    key={inter.id}
                    className="flex items-start gap-2.5 rounded-lg border border-[#edf0ee] bg-[#fcfdfc] p-3 text-xs"
                  >
                    <PhoneCall className="mt-0.5 size-3.5 shrink-0 text-emerald-700" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-[#17221c]">{inter.type}</span>
                        {inter.occurredAt && (
                          <span className="text-[10px] text-gray-400">
                            {formatDateTime(inter.occurredAt)}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-gray-600 line-clamp-2">
                        {inter.subject || inter.content || "Ghi nhận trao đổi kinh doanh"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs italic text-gray-500">Chưa có lịch sử cuộc gọi/email trực tiếp.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

