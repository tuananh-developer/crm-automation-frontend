"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, RefreshCw, ShieldCheck, UserRound, UserX } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/components/providers/AuthProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getApiErrorMessage } from "@/services/api-client";
import {
  createManagedUser,
  disableManagedUser,
  listManagedUsers,
  updateManagedUser,
  type UserRole,
  type UserStatus,
} from "@/services/user.service";

const usersKey = ["admin", "users"] as const;

function AdminUsersContent() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<UserRole>("SALES");
  const [notice, setNotice] = React.useState("");

  React.useEffect(() => {
    if (!isAuthLoading && user && user.role !== "ADMIN") router.replace("/");
  }, [isAuthLoading, router, user]);

  const usersQuery = useQuery({ queryKey: usersKey, queryFn: listManagedUsers, enabled: user?.role === "ADMIN" });
  const refresh = () => queryClient.invalidateQueries({ queryKey: usersKey });
  const createMutation = useMutation({
    mutationFn: createManagedUser,
    onSuccess: async () => {
      setName(""); setEmail(""); setPassword(""); setRole("SALES");
      setNotice("Đã tạo tài khoản."); await refresh();
    },
  });
  const updateMutation = useMutation({ mutationFn: ({ id, role: nextRole, status }: { id: string; role: UserRole; status: UserStatus }) => updateManagedUser(id, { role: nextRole, status }), onSuccess: refresh });
  const disableMutation = useMutation({ mutationFn: disableManagedUser, onSuccess: refresh });

  if (isAuthLoading || !user || user.role !== "ADMIN") {
    return <div className="flex min-h-56 items-center justify-center text-sm text-gray-500"><Loader2 className="mr-2 size-4 animate-spin" />Đang kiểm tra quyền truy cập…</div>;
  }

  const onCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setNotice("");
    createMutation.mutate({ name: name.trim(), email: email.trim(), password, role });
  };

  return (
    <AuthGuard>
      <div className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Quản lý người dùng</h1>
            <p className="mt-1 text-sm text-gray-500">Tạo tài khoản, cập nhật vai trò và trạng thái truy cập.</p>
          </div>
          <Button variant="outline" onClick={() => usersQuery.refetch()} disabled={usersQuery.isFetching}>
            <RefreshCw className={usersQuery.isFetching ? "animate-spin" : ""} /> Làm mới
          </Button>
        </header>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="size-4 text-emerald-700" />Tạo người dùng</CardTitle><CardDescription>Thông tin đăng nhập và vai trò ban đầu.</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={onCreate} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <label className="space-y-1.5 text-xs font-medium">Họ tên<Input required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
              <label className="space-y-1.5 text-xs font-medium">Email<Input required type="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
              <label className="space-y-1.5 text-xs font-medium">Mật khẩu (tối thiểu 12 ký tự)<Input required type="password" minLength={12} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" /></label>
              <label className="space-y-1.5 text-xs font-medium">Vai trò<Select value={role} onChange={(e) => setRole(e.target.value as UserRole)}><option value="SALES">Sales</option><option value="ADMIN">Admin</option></Select></label>
              <div className="flex items-end"><Button type="submit" disabled={createMutation.isPending} className="w-full bg-emerald-700 text-white hover:bg-emerald-800">{createMutation.isPending ? <Loader2 className="animate-spin" /> : <Plus />} Tạo tài khoản</Button></div>
            </form>
            {notice && <p role="status" className="mt-3 text-sm text-emerald-700">{notice}</p>}
            {createMutation.isError && <p role="alert" className="mt-3 text-sm text-red-700">Không thể tạo tài khoản: {getApiErrorMessage(createMutation.error)}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Danh sách tài khoản</CardTitle><CardDescription>{usersQuery.data ? `${usersQuery.data.length} người dùng` : "Tài khoản trong workspace"}</CardDescription></CardHeader>
          <CardContent className="p-0">
            {usersQuery.isLoading ? <div className="flex items-center justify-center gap-2 p-10 text-sm text-gray-500"><Loader2 className="size-4 animate-spin" />Đang tải danh sách…</div>
              : usersQuery.isError ? <div className="p-6 text-sm text-red-700" role="alert">Không thể tải người dùng: {getApiErrorMessage(usersQuery.error)} <Button variant="outline" size="sm" className="ml-2" onClick={() => usersQuery.refetch()}>Thử lại</Button></div>
              : !usersQuery.data?.length ? <div className="p-10 text-center text-sm text-gray-500"><UserRound className="mx-auto mb-2 size-6" />Chưa có người dùng nào.</div>
              : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-gray-50 text-xs text-gray-500"><tr><th className="px-5 py-3 font-semibold">Người dùng</th><th className="px-5 py-3 font-semibold">Vai trò</th><th className="px-5 py-3 font-semibold">Trạng thái</th><th className="px-5 py-3 font-semibold">Đăng nhập gần nhất</th><th className="px-5 py-3 font-semibold">Thao tác</th></tr></thead><tbody className="divide-y divide-gray-100">
                {usersQuery.data.map((member) => <UserRow key={`${member.id}:${member.role}:${member.status}`} member={member} isCurrentUser={member.id === user.id} onSave={(nextRole, status) => updateMutation.mutate({ id: member.id, role: nextRole, status })} onDisable={() => { if (window.confirm(`Vô hiệu hóa tài khoản ${member.email}?`)) disableMutation.mutate(member.id); }} saving={updateMutation.isPending && updateMutation.variables?.id === member.id} disabling={disableMutation.isPending && disableMutation.variables === member.id} />)}
              </tbody></table></div>}
            {(updateMutation.isError || disableMutation.isError) && <p role="alert" className="border-t border-red-100 p-4 text-sm text-red-700">Không thể cập nhật tài khoản: {getApiErrorMessage(updateMutation.error ?? disableMutation.error)}</p>}
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}

function UserRow({ member, isCurrentUser, onSave, onDisable, saving, disabling }: { member: { id: string; name: string; email: string; role: UserRole; status: UserStatus; lastLoginAt: string | null }; isCurrentUser: boolean; onSave: (role: UserRole, status: UserStatus) => void; onDisable: () => void; saving: boolean; disabling: boolean }) {
  const [role, setRole] = React.useState<UserRole>(member.role);
  const [status, setStatus] = React.useState<UserStatus>(member.status);
  const dirty = role !== member.role || status !== member.status;
  const statusTone = member.status === "ACTIVE" ? "success" : member.status === "LOCKED" ? "danger" : "neutral";
  return <tr><td className="px-5 py-4"><div className="font-semibold text-gray-900">{member.name}</div><div className="text-xs text-gray-500">{member.email}</div></td>
    <td className="px-5 py-4"><Select aria-label={`Vai trò của ${member.name}`} className="h-9 w-32" value={role} disabled={isCurrentUser} onChange={(e) => setRole(e.target.value as UserRole)}><option value="ADMIN">Admin</option><option value="SALES">Sales</option></Select></td>
    <td className="px-5 py-4"><div className="flex items-center gap-2"><Badge tone={statusTone}>{member.status}</Badge><Select aria-label={`Trạng thái của ${member.name}`} className="h-9 w-36" value={status} disabled={isCurrentUser} onChange={(e) => setStatus(e.target.value as UserStatus)}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="LOCKED">Locked</option></Select></div></td>
    <td className="px-5 py-4 text-xs text-gray-500">{member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleString() : "Chưa đăng nhập"}</td>
    <td className="px-5 py-4"><div className="flex gap-2"><Button size="sm" variant="outline" disabled={isCurrentUser || !dirty || saving || disabling} onClick={() => onSave(role, status)}>{saving ? <Loader2 className="animate-spin" /> : <ShieldCheck />}Lưu</Button><Button size="sm" variant="destructive" disabled={isCurrentUser || member.status === "INACTIVE" || disabling || saving} onClick={onDisable}>{disabling ? <Loader2 className="animate-spin" /> : <UserX />}Vô hiệu hóa</Button></div></td></tr>;
}

export default function AdminUsersPage() { return <AdminUsersContent />; }
