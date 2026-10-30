"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Globe,
  Layers,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  TriangleAlert,
  UserRound,
  Users,
  FileText,
} from "lucide-react";
import { CustomerConversationsTab } from "./CustomerConversationsTab";

import { getApiErrorMessage } from "@/services/api-client";
import { getCustomer } from "@/services/customer.service";
import { ASSIGNMENT_TYPE_LABELS } from "@/types/segment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatConfidence,
  formatDateTime,
  toConfidenceNumber,
} from "@/components/segments/segment-utils";
import type {
  CustomerDetail,
  CustomerSegmentMembership,
} from "@/types/customer";

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

function CustomerDetailView({ customer }: { customer: CustomerDetail }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<"conversations" | "overview">("conversations");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={() => router.push("/customers")}>
          <ArrowLeft />
          Danh sách khách hàng
        </Button>
      </div>

      {/* Top Customer Summary Card */}
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-[#17221c]">
                {customer.name}
              </h2>
              <p className="mt-0.5 break-all font-mono text-xs text-gray-500">
                {customer.companyName ? `${customer.companyName} • ` : ""}ID: {customer.id}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={customer.status === "CONVERTED" ? "success" : "neutral"}>
                {customer.status ?? "CHƯA GÁN TRẠNG THÁI"}
              </Badge>
              <Badge tone="info">
                <Layers className="size-3.5" />
                {customer.segmentCount} segment
              </Badge>
            </div>
          </div>

          <div className="grid gap-3 border-t border-[#edf0ee] pt-3 text-xs sm:grid-cols-2 md:grid-cols-4">
            <Row icon={Mail} label="Email" value={customer.email} />
            <Row icon={Phone} label="Điện thoại" value={customer.phone ?? "—"} />
            <Row icon={Building2} label="Công ty" value={customer.companyName ?? "—"} />
            <Row icon={UserRound} label="Chức danh" value={customer.jobTitle ?? "—"} />
          </div>
        </CardContent>
      </Card>

      {/* Interactive Tabs Navigation */}
      <div
        role="tablist"
        aria-label="Customer Intelligence Tabs"
        className="flex flex-wrap items-center gap-1.5 border-b border-[#e2e8e4] pb-px text-sm"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "conversations"}
          data-testid="tab-customer-conversations"
          onClick={() => setActiveTab("conversations")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-bold transition-colors ${
            activeTab === "conversations"
              ? "border-[#173b2b] text-[#173b2b]"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <FileText className="size-4" />
          Biên bản hội thoại AI (WF09)
          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-800">
            AI
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "overview"}
          data-testid="tab-customer-overview"
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-bold transition-colors ${
            activeTab === "overview"
              ? "border-[#173b2b] text-[#173b2b]"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <UserRound className="size-4" />
          Hồ sơ chi tiết & Phân khúc
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "conversations" && (
        <section aria-label="Customer Conversations Panel">
          <CustomerConversationsTab customerId={customer.id} />
        </section>
      )}

      {activeTab === "overview" && (
        <section aria-label="Customer Profile and Segments Panel" className="space-y-6">
          <Card>
            <CardContent className="space-y-5 p-5">
              <h3 className="font-bold text-[#17221c]">Thông tin tổ chức & Liên hệ chi tiết</h3>
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
      </section>
      )}
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
