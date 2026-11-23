"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  Building2,
  FileText,
  Globe,
  HeartPulse,
  Layers,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  ShieldAlert,
  Star,
  TriangleAlert,
  UserRound,
  Users,
} from "lucide-react";

import { getApiErrorMessage } from "@/services/api-client";
import {
  getCustomer,
  getCustomerChurnAssessments,
  getCustomerHealthSnapshots,
} from "@/services/customer.service";
import { listContracts } from "@/services/renewal.service";
import { ASSIGNMENT_TYPE_LABELS } from "@/types/segment";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatConfidence,
  formatDateTime,
  toConfidenceNumber,
} from "@/components/segments/segment-utils";
import type {
  AccountHealthSnapshot,
  CustomerChurnAssessment,
  CustomerDetail,
  CustomerSegmentMembership,
} from "@/types/customer";
import type { CustomerContract } from "@/types/renewal";

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-gray-400" />
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {label}
        </p>
        <div className="mt-0.5 break-words text-sm text-[#17221c]">{value}</div>
      </div>
    </div>
  );
}

function SegmentMembershipCard({
  membership,
}: {
  membership: CustomerSegmentMembership;
}) {
  const label =
    ASSIGNMENT_TYPE_LABELS[
      membership.assignmentType as keyof typeof ASSIGNMENT_TYPE_LABELS
    ] ?? membership.assignmentType;
  const confidence = toConfidenceNumber(membership.confidence);

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-[#173b2b]" />
            <span className="font-bold text-[#17221c]">
              {membership.segment?.name ?? membership.segmentId.slice(0, 8)}
            </span>
          </div>

          <Badge tone={membership.assignmentType === "AI" ? "info" : "neutral"}>
            {label}
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Confidence
            </p>
            <p className="mt-0.5 text-sm text-[#17221c]">
              {formatConfidence(membership.confidence)}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Assigned at
            </p>
            <p className="mt-0.5 text-sm text-[#17221c]">
              {formatDateTime(membership.assignedAt)}
            </p>
          </div>
        </div>

        {confidence !== null ? (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e2e8e4]">
            <div
              className="h-full rounded-full bg-[#173b2b]"
              style={{
                width: `${Math.min(100, Math.max(0, confidence <= 1 ? confidence * 100 : confidence))}%`,
              }}
            />
          </div>
        ) : null}

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Reason
          </p>
          <p className="mt-0.5 text-sm break-words text-[#17221c]">
            {membership.assignedReason ?? "Không có lý do được lưu."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          {membership.segment?.isActive === false ? (
            <Badge tone="warning">Segment đang tắt</Badge>
          ) : null}
          {membership.assignedByUser?.name ? (
            <span>Người gán: {membership.assignedByUser.name}</span>
          ) : null}
          <Link
            href={`/segments/${membership.segmentId}`}
            className="font-semibold text-[#173b2b] underline-offset-2 hover:underline"
          >
            Mở segment
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function churnRiskTone(level: string): BadgeTone {
  const normalized = level.toUpperCase();
  if (normalized === "HIGH") return "danger";
  if (normalized === "MEDIUM") return "warning";
  if (normalized === "LOW") return "success";
  return "neutral";
}

function healthStatusTone(status: string): BadgeTone {
  const normalized = status.toUpperCase();
  if (normalized === "HEALTHY") return "success";
  if (normalized === "AT_RISK") return "warning";
  if (normalized === "CRITICAL") return "danger";
  return "neutral";
}

function contractStatusTone(status: string): BadgeTone {
  const normalized = status.toUpperCase();
  if (normalized === "ACTIVE" || normalized === "RENEWED") return "success";
  if (normalized === "PENDING_RENEWAL") return "warning";
  if (normalized === "EXPIRED" || normalized === "CANCELLED") return "danger";
  return "info";
}

function formatContractAmount(amount: string | number | null): string {
  if (amount === null || amount === undefined || amount === "") return "—";
  const num = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(num)) return String(amount);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(num);
}

function ChurnAssessmentCard({
  assessment,
}: {
  assessment: CustomerChurnAssessment;
}) {
  const evidenceItems = Array.isArray(assessment.evidence)
    ? assessment.evidence
    : [];
  const explanation =
    typeof assessment.metadata?.explanation === "string"
      ? assessment.metadata.explanation
      : null;

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-[#173b2b]" />
            <span className="font-bold text-[#17221c]">
              Score:{" "}
              {assessment.score !== null && assessment.score !== undefined
                ? `${assessment.score} / 100`
                : "Insufficient data"}
            </span>
          </div>

          <Badge tone={churnRiskTone(assessment.riskLevel)}>
            {assessment.riskLevel}
          </Badge>
        </div>

        {assessment.score !== null && assessment.score !== undefined ? (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e2e8e4]">
            <div
              className="h-full rounded-full bg-[#173b2b]"
              style={{
                width: `${Math.min(100, Math.max(0, assessment.score))}%`,
              }}
            />
          </div>
        ) : null}

        <div className="grid gap-3 text-xs text-gray-500 sm:grid-cols-3">
          <div>
            <p className="font-semibold uppercase tracking-wide">As of date</p>
            <p className="mt-0.5 text-sm text-[#17221c]">
              {assessment.asOfDate ?? "—"}
            </p>
          </div>
          <div>
            <p className="font-semibold uppercase tracking-wide">
              Policy version
            </p>
            <p className="mt-0.5 text-sm text-[#17221c]">
              {assessment.policyVersion || "v1"}
            </p>
          </div>
          <div>
            <p className="font-semibold uppercase tracking-wide">Assessed at</p>
            <p className="mt-0.5 text-sm text-[#17221c]">
              {formatDateTime(assessment.assessedAt)}
            </p>
          </div>
        </div>

        {explanation ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              AI Explanation
            </p>
            <p className="mt-1 text-sm text-[#17221c]">{explanation}</p>
          </div>
        ) : null}

        {evidenceItems.length > 0 ? (
          <div className="space-y-1.5 border-t border-[#edf0ee] pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Canonical DB Evidence ({evidenceItems.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {evidenceItems.map((item, idx) => (
                <span
                  key={`${assessment.id}-ev-${idx}`}
                  className="inline-flex items-center gap-1 rounded-md border border-[#e2e8e4] bg-[#f6f8f7] px-2 py-1 text-xs text-[#17221c]"
                >
                  <span className="font-semibold">
                    {String(item.source ?? "signal")}:
                  </span>
                  <span>{String(item.signal ?? "metric")}</span>
                  {item.value !== undefined && item.value !== null ? (
                    <span className="font-mono text-gray-600">
                      ({String(item.value)})
                    </span>
                  ) : null}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function HealthSnapshotCard({ snapshot }: { snapshot: AccountHealthSnapshot }) {
  const breakdown = snapshot.breakdown ?? {};
  const missingData = Array.isArray(snapshot.missingData)
    ? snapshot.missingData
    : [];

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <HeartPulse className="size-4 text-[#173b2b]" />
            <span className="font-bold text-[#17221c]">
              Health Score: {snapshot.score} / 100
            </span>
          </div>

          <Badge tone={healthStatusTone(snapshot.status)}>
            {snapshot.status}
          </Badge>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e2e8e4]">
          <div
            className="h-full rounded-full bg-[#173b2b]"
            style={{
              width: `${Math.min(100, Math.max(0, snapshot.score))}%`,
            }}
          />
        </div>

        <div className="grid gap-3 rounded-xl border border-[#edf0ee] bg-[#f6f8f7] p-3 text-xs sm:grid-cols-4">
          <div>
            <p className="font-semibold uppercase tracking-wide text-gray-500">
              Engagement (30%)
            </p>
            <p className="mt-0.5 text-sm font-semibold text-[#17221c]">
              {breakdown.engagement ?? "—"}
            </p>
          </div>
          <div>
            <p className="font-semibold uppercase tracking-wide text-gray-500">
              Feedback (25%)
            </p>
            <p className="mt-0.5 text-sm font-semibold text-[#17221c]">
              {breakdown.feedback ?? "—"}
            </p>
          </div>
          <div>
            <p className="font-semibold uppercase tracking-wide text-gray-500">
              Open Issues (25%)
            </p>
            <p className="mt-0.5 text-sm font-semibold text-[#17221c]">
              {breakdown.openIssues ?? "—"}
            </p>
          </div>
          <div>
            <p className="font-semibold uppercase tracking-wide text-gray-500">
              Follow-ups (20%)
            </p>
            <p className="mt-0.5 text-sm font-semibold text-[#17221c]">
              {breakdown.followUpCompletion ?? "—"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
          <span>Assessed at: {formatDateTime(snapshot.assessedAt)}</span>
          {missingData.length > 0 ? (
            <span>Missing inputs: {missingData.join(", ")}</span>
          ) : (
            <span>Full component coverage</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CustomerContractCard({ contract }: { contract: CustomerContract }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-[#173b2b]" />
            <span className="font-bold text-[#17221c]">
              {contract.contractNumber}
            </span>
          </div>

          <Badge tone={contractStatusTone(contract.status)}>
            {contract.status}
          </Badge>
        </div>

        <div className="grid gap-3 text-xs text-gray-500 sm:grid-cols-3">
          <div>
            <p className="font-semibold uppercase tracking-wide">Value</p>
            <p className="mt-0.5 text-sm font-semibold text-[#17221c]">
              {formatContractAmount(contract.amount)}
            </p>
          </div>
          <div>
            <p className="font-semibold uppercase tracking-wide">
              Renewal date
            </p>
            <p className="mt-0.5 text-sm text-[#17221c]">
              {contract.renewalDate
                ? formatDateTime(contract.renewalDate)
                : "—"}
            </p>
          </div>
          <div>
            <p className="font-semibold uppercase tracking-wide">End date</p>
            <p className="mt-0.5 text-sm text-[#17221c]">
              {formatDateTime(contract.endDate)}
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button asChild variant="outline" size="sm">
            <Link href={`/renewals?contractId=${encodeURIComponent(contract.id)}`}>
              Quản lý gia hạn &amp; phê duyệt (WF13)
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CustomerDetailView({ customer }: { customer: CustomerDetail }) {
  const router = useRouter();

  const churnQuery = useQuery({
    queryKey: ["customers", customer.id, "churn-assessments"],
    queryFn: () => getCustomerChurnAssessments(customer.id),
  });

  const healthQuery = useQuery({
    queryKey: ["customers", customer.id, "health-snapshots"],
    queryFn: () => getCustomerHealthSnapshots(customer.id),
  });

  const contractsQuery = useQuery({
    queryKey: ["customer-contracts", { customerId: customer.id }],
    queryFn: () => listContracts({ customerId: customer.id }),
  });

  const churnAssessments = churnQuery.data ?? [];
  const healthSnapshots = healthQuery.data ?? [];
  const contracts = contractsQuery.data ?? [];

  return (
    <div className="space-y-4">
      <Button type="button" variant="ghost" onClick={() => router.push("/customers")}>
        <ArrowLeft />
        Danh sách khách hàng
      </Button>

      <Card>
        <CardContent className="space-y-5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-[#17221c]">
                {customer.name}
              </h2>
              <p className="mt-1 break-all font-mono text-xs text-gray-500">
                {customer.id}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {customer.isStrategic ? (
                <Badge tone="warning">
                  <Star className="size-3 fill-current" />
                  Strategic Account
                </Badge>
              ) : null}
              <Badge tone={customer.status === "CONVERTED" ? "success" : "neutral"}>
                {customer.status ?? "CHƯA GÁN TRẠNG THÁI"}
              </Badge>
              <Badge tone="info">
                <Layers />
                {customer.segmentCount} segment
              </Badge>
            </div>
          </div>

          <div className="grid gap-4 border-t border-[#edf0ee] pt-4 sm:grid-cols-2">
            <Row icon={Mail} label="Email" value={customer.email} />
            <Row icon={Phone} label="Điện thoại" value={customer.phone ?? "—"} />
            <Row icon={UserRound} label="Chức danh" value={customer.jobTitle ?? "—"} />
            <Row
              icon={Building2}
              label="Công ty"
              value={customer.companyName ?? "—"}
            />
            <Row
              icon={Globe}
              label="Website"
              value={
                customer.companyWebsite ? (
                  <a
                    href={customer.companyWebsite}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2"
                  >
                    {customer.companyWebsite}
                  </a>
                ) : (
                  "—"
                )
              }
            />
            <Row
              icon={Users}
              label="Quy mô công ty"
              value={customer.companySize ?? "—"}
            />
            <Row icon={Users} label="Ngành nghề" value={customer.industry ?? "—"} />
            <Row
              icon={UserRound}
              label="Người tạo"
              value={customer.creator?.name ?? customer.createdBy}
            />
          </div>

          {customer.notes ? (
            <div className="border-t border-[#edf0ee] pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Ghi chú
              </p>
              <p className="mt-1 text-sm break-words text-[#17221c]">
                {customer.notes}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          <h3 className="font-bold text-[#17221c]">Lead đã chuyển đổi</h3>

          {customer.convertedLeads?.length ? (
            <ul className="space-y-2">
              {customer.convertedLeads.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#e2e8e4] bg-[#f6f8f7] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#17221c]">
                      {[item.firstName, item.lastName].filter(Boolean).join(" ")}
                    </p>
                    <p className="break-all text-xs text-gray-500">
                      {item.email} · Lead ID {item.id.slice(0, 8)}
                    </p>
                  </div>
                  <Badge tone="neutral">{item.status}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">
              Khách hàng này không liên kết với lead nào.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="font-bold text-[#17221c]">
          Segment đang thuộc ({customer.segmentCount})
        </h3>

        {customer.customerSegments?.length ? (
          <ul className="space-y-3">
            {customer.customerSegments.map((membership) => (
              <li key={membership.segmentId}>
                <SegmentMembershipCard membership={membership} />
              </li>
            ))}
          </ul>
        ) : (
          <Card>
            <CardContent className="px-5 py-8 text-center">
              <p className="text-sm text-gray-500">
                Khách hàng chưa thuộc segment nào. Chạy một segment để gán tự
                động.
              </p>
              <Button asChild variant="outline" className="mt-3">
                <Link href="/segments">Mở Segments</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* WF06 - Churn Risk Monitoring History */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-[#173b2b]" />
            <h3 className="font-bold text-[#17221c]">
              Lịch sử đánh giá rủi ro rời bỏ — Churn Monitoring (WF06) (
              {churnAssessments.length})
            </h3>
          </div>
          <Badge tone="neutral">Canonical Backend Policy</Badge>
        </div>

        {churnQuery.isLoading ? (
          <Card>
            <CardContent className="flex items-center gap-2 p-5 text-sm text-gray-500">
              <Loader2 className="size-4 animate-spin text-[#173b2b]" />
              Đang tải lịch sử đánh giá churn…
            </CardContent>
          </Card>
        ) : churnAssessments.length > 0 ? (
          <ul className="space-y-3">
            {churnAssessments.map((assessment) => (
              <li key={assessment.id}>
                <ChurnAssessmentCard assessment={assessment} />
              </li>
            ))}
          </ul>
        ) : (
          <Card>
            <CardContent className="px-5 py-6 text-center text-sm text-gray-500">
              Chưa có bản ghi đánh giá rủi ro rời bỏ (Churn Assessment) nào cho
              khách hàng này. Khi workflow WF06 chạy định kỳ, điểm rủi ro (0–100
              hoặc INSUFFICIENT_DATA) và bằng chứng tương tác sẽ hiển thị tại
              đây.
            </CardContent>
          </Card>
        )}
      </div>

      {/* WF15 - Strategic Account Health Snapshots */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-[#173b2b]" />
            <h3 className="font-bold text-[#17221c]">
              Sức khỏe tài khoản chiến lược — Account Health (WF15) (
              {healthSnapshots.length})
            </h3>
          </div>
          <Badge tone={customer.isStrategic ? "warning" : "neutral"}>
            {customer.isStrategic
              ? "Strategic Cohort (30/25/25/20)"
              : "Standard Account"}
          </Badge>
        </div>

        {healthQuery.isLoading ? (
          <Card>
            <CardContent className="flex items-center gap-2 p-5 text-sm text-gray-500">
              <Loader2 className="size-4 animate-spin text-[#173b2b]" />
              Đang tải lịch sử Account Health…
            </CardContent>
          </Card>
        ) : healthSnapshots.length > 0 ? (
          <ul className="space-y-3">
            {healthSnapshots.map((snapshot) => (
              <li key={snapshot.id}>
                <HealthSnapshotCard snapshot={snapshot} />
              </li>
            ))}
          </ul>
        ) : (
          <Card>
            <CardContent className="px-5 py-6 text-center text-sm text-gray-500">
              {customer.isStrategic
                ? "Khách hàng này thuộc diện Strategic Account nhưng chưa có bản ghi Account Health Snapshot từ lần quét hàng tuần của WF15."
                : "Khách hàng này chưa được gắn cờ Strategic Account. WF15 chỉ đánh giá tự động các tài khoản có isStrategic = true."}
            </CardContent>
          </Card>
        )}
      </div>

      {/* WF13 - Customer Contracts & Renewal Management */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-[#173b2b]" />
            <h3 className="font-bold text-[#17221c]">
              Hợp đồng &amp; Gia hạn — Renewal Management (WF13) (
              {contracts.length})
            </h3>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link
              href={`/renewals?customerId=${encodeURIComponent(customer.id)}`}
            >
              Mở Contract Renewals Workbench
            </Link>
          </Button>
        </div>

        {contractsQuery.isLoading ? (
          <Card>
            <CardContent className="flex items-center gap-2 p-5 text-sm text-gray-500">
              <Loader2 className="size-4 animate-spin text-[#173b2b]" />
              Đang tải danh sách hợp đồng…
            </CardContent>
          </Card>
        ) : contracts.length > 0 ? (
          <ul className="space-y-3">
            {contracts.map((contract) => (
              <li key={contract.id}>
                <CustomerContractCard contract={contract} />
              </li>
            ))}
          </ul>
        ) : (
          <Card>
            <CardContent className="px-5 py-6 text-center">
              <p className="text-sm text-gray-500">
                Khách hàng này chưa có hợp đồng nào được đăng ký.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link
                  href={`/renewals?customerId=${encodeURIComponent(customer.id)}`}
                >
                  Tạo hợp đồng mới
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export function CustomerDetailPanel() {
  const params = useParams<{ id: string }>();
  const customerId = params.id;

  const query = useQuery({
    queryKey: ["customers", customerId],
    queryFn: () => getCustomer(customerId),
    enabled: Boolean(customerId),
  });

  if (query.isLoading) {
    return (
      <div
        className="flex items-center justify-center gap-3 py-16 text-sm text-gray-500"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="size-5 animate-spin text-[#173b2b]" />
        Đang tải khách hàng…
      </div>
    );
  }

  if (query.isError) {
    return (
      <div
        className="flex flex-col items-center gap-3 py-16 text-center"
        role="alert"
      >
        <div className="rounded-xl bg-red-50 p-3 text-red-600">
          <TriangleAlert className="size-5" />
        </div>
        <div>
          <p className="font-semibold text-[#17221c]">
            Không tải được khách hàng
          </p>
          <p className="mt-1 max-w-md text-sm text-gray-500">
            {getApiErrorMessage(query.error)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => query.refetch()}>
            <RefreshCw />
            Thử lại
          </Button>
          <Button asChild variant="ghost">
            <Link href="/customers">
              <ArrowLeft />
              Danh sách
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!query.data) {
    return (
      <div className="py-16 text-center text-sm text-gray-500">
        Không có dữ liệu khách hàng.
      </div>
    );
  }

  return <CustomerDetailView customer={query.data} />;
}
