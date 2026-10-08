"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Building2,
  ChevronRight,
  Inbox,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  TriangleAlert,
  Users,
} from "lucide-react";

import { getApiErrorMessage } from "@/services/api-client";
import { getCustomers } from "@/services/customer.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Customer } from "@/types/customer";

const PAGE_SIZE = 20;

function formatDate(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/** `customers.status` is a free-form column, so render whatever exists. */
function CustomerStatusBadge({ status }: { status?: string | null }) {
  if (!status) {
    return (
      <Badge tone="neutral">
        <Users />
        Chưa gán
      </Badge>
    );
  }

  return (
    <Badge tone={status === "CONVERTED" ? "success" : "neutral"}>{status}</Badge>
  );
}

function CustomerCard({
  customer,
  onOpen,
}: {
  customer: Customer;
  onOpen: (id: string) => void;
}) {
  return (
    <Card className="transition hover:border-[#173b2b]/40 hover:shadow-md">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-bold text-[#17221c]">{customer.name}</p>
            <div className="mt-1 flex flex-col gap-1 text-xs text-gray-500 sm:flex-row sm:flex-wrap sm:gap-3">
              <span className="inline-flex items-center gap-1 break-all">
                <Mail className="size-3 shrink-0" />
                {customer.email}
              </span>
              {customer.phone ? (
                <span className="inline-flex items-center gap-1">
                  <Phone className="size-3 shrink-0" />
                  {customer.phone}
                </span>
              ) : null}
            </div>
          </div>

          <CustomerStatusBadge status={customer.status} />
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="inline-flex min-w-0 items-center gap-1">
            <Building2 className="size-3 shrink-0" />
            <span className="truncate">
              {customer.companyName ?? "Không có công ty"}
            </span>
          </span>
          <span className="shrink-0">{formatDate(customer.createdAt)}</span>
        </div>

        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpen(customer.id)}>
            Chi tiết
            <ChevronRight />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function CustomerList() {
  const router = useRouter();

  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [page, setPage] = React.useState(1);

  const params = React.useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: search.trim() || undefined,
      status: status || undefined,
    }),
    [page, search, status],
  );

  const query = useQuery({
    queryKey: ["customers", params],
    queryFn: () => getCustomers(params),
  });

  const customers = query.data?.data ?? [];
  const meta = query.data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const openCustomer = (id: string) => router.push(`/customers/${id}`);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-0">
          <div className="flex flex-col gap-3 border-b border-[#edf0ee] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-bold text-[#17221c]">Customers</h2>
              <p className="text-sm text-gray-500">
                Khách hàng đã chuyển đổi từ lead (UC08).{" "}
                {meta ? `${meta.total} bản ghi.` : ""}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                className="sm:w-64"
                placeholder="Tìm theo tên, email, công ty…"
                aria-label="Tìm khách hàng"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />

              <Select
                className="sm:w-40"
                aria-label="Lọc theo trạng thái"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="CONVERTED">CONVERTED</option>
              </Select>

              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Tải lại danh sách"
                onClick={() => query.refetch()}
              >
                <RefreshCw className={query.isFetching ? "animate-spin" : ""} />
              </Button>
            </div>
          </div>

          {query.isLoading ? (
            <div
              className="flex items-center justify-center gap-3 px-5 py-14 text-sm text-gray-500"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="size-5 animate-spin text-[#173b2b]" />
              Đang tải khách hàng…
            </div>
          ) : query.isError ? (
            <div
              className="flex flex-col items-center gap-3 px-5 py-14 text-center"
              role="alert"
            >
              <div className="rounded-xl bg-red-50 p-3 text-red-600">
                <TriangleAlert className="size-5" />
              </div>
              <div>
                <p className="font-semibold text-[#17221c]">
                  Không tải được danh sách khách hàng
                </p>
                <p className="mt-1 max-w-md text-sm text-gray-500">
                  {getApiErrorMessage(query.error)}
                </p>
              </div>
              <Button type="button" variant="outline" onClick={() => query.refetch()}>
                Thử lại
              </Button>
            </div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
              <div className="rounded-xl bg-[#edf4ef] p-3 text-[#173b2b]">
                <Inbox className="size-5" />
              </div>
              <div>
                <p className="font-semibold text-[#17221c]">
                  {search || status
                    ? "Không có khách hàng khớp bộ lọc"
                    : "Chưa có khách hàng nào"}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {search || status
                    ? "Thử xoá bộ lọc hoặc tìm từ khoá khác."
                    : "Khách hàng xuất hiện sau khi một lead được chuyển đổi."}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[#edf0ee] text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Tên</th>
                      <th className="px-5 py-3 font-semibold">Email</th>
                      <th className="px-5 py-3 font-semibold">Điện thoại</th>
                      <th className="px-5 py-3 font-semibold">Công ty</th>
                      <th className="px-5 py-3 font-semibold">Trạng thái</th>
                      <th className="px-5 py-3 font-semibold">Ngày tạo</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f4f2]">
                    {customers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-[#f6f8f7]">
                        <td className="px-5 py-3 font-semibold text-[#17221c]">
                          {customer.name}
                        </td>
                        <td className="px-5 py-3 text-gray-600">
                          {customer.email}
                        </td>
                        <td className="px-5 py-3 text-gray-600">
                          {customer.phone ?? "—"}
                        </td>
                        <td className="px-5 py-3 text-gray-600">
                          {customer.companyName ?? "—"}
                        </td>
                        <td className="px-5 py-3">
                          <CustomerStatusBadge status={customer.status} />
                        </td>
                        <td className="px-5 py-3 text-gray-500">
                          {formatDate(customer.createdAt)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => openCustomer(customer.id)}
                          >
                            Xem
                            <ChevronRight />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="space-y-3 p-4 lg:hidden">
                {customers.map((customer) => (
                  <li key={customer.id}>
                    <CustomerCard customer={customer} onOpen={openCustomer} />
                  </li>
                ))}
              </ul>

              {totalPages > 1 ? (
                <div className="flex items-center justify-between border-t border-[#edf0ee] px-5 py-3 text-sm text-gray-500">
                  <span>
                    Trang {meta?.page ?? page} / {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((previous) => Math.max(1, previous - 1))}
                    >
                      Trước
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((previous) => previous + 1)}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
