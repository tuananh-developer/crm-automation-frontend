"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Shield,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/services/api-client";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading } = useAuth();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const rawFrom = searchParams.get("from");
  const returnUrl =
    rawFrom && !rawFrom.startsWith("/login") && !rawFrom.startsWith("/register")
      ? rawFrom
      : "/";

  // Redirect if already authenticated and initial verification has finished
  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(returnUrl);
    }
  }, [isAuthenticated, isLoading, router, returnUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await login({ email: email.trim(), password });
      router.replace(returnUrl);
    } catch (err) {
      setErrorMessage(
        getApiErrorMessage(err) || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await login({ email: demoEmail, password: demoPass });
      router.replace(returnUrl);
    } catch (err) {
      setErrorMessage(
        getApiErrorMessage(err) || "Đăng nhập thất bại với tài khoản mẫu.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[#f7f9f8] px-4 py-12 sm:px-6 lg:px-8">
      {/* Background Glow */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center opacity-30">
        <div className="h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="h-96 w-96 rounded-full bg-teal-500/20 blur-3xl" />
      </div>

      <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-md">
            <Sparkles className="size-6" />
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-gray-900">
            CRM Automation Platform
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Hệ thống AI Tự động hóa Bán hàng &amp; Chăm sóc Khách hàng
          </p>
        </div>

        {/* Login Form Card */}
        <div className="mt-8 rounded-3xl border border-gray-200/80 bg-white p-6 shadow-xl shadow-emerald-950/5 sm:p-8">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900">Đăng nhập hệ thống</h3>
            <p className="text-xs text-gray-500">
              Nhập thông tin xác thực để truy cập bảng điều khiển CRM
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50/80 p-3.5 text-xs text-red-700 animate-in fade-in-50"
            >
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-gray-700 mb-1.5"
              >
                Địa chỉ Email
              </label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="admin@crm.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 text-xs"
                  disabled={isSubmitting}
                />
                <Mail className="absolute left-3 top-3 size-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-gray-700"
                >
                  Mật khẩu
                </label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-9 text-xs"
                  disabled={isSubmitting}
                />
                <Lock className="absolute left-3 top-3 size-4 text-gray-400 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                  tabIndex={-1}
                  title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 mt-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  Đang xác thực...
                </>
              ) : (
                <>
                  <KeyRound className="size-3.5 mr-1.5" />
                  Đăng nhập
                </>
              )}
            </Button>
          </form>

          {/* Quick Demo Login Section */}
          <div className="mt-6 border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                <Sparkles className="size-3" />
                Đăng nhập 1-Click (Demo)
              </span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                Tài khoản mẫu
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleQuickLogin("admin@crm.local", "Password123!")}
                className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-2.5 text-left hover:bg-emerald-100/70 hover:border-emerald-300 transition-all group disabled:opacity-60"
              >
                <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-700 text-white shadow-2xs group-hover:scale-105 transition-transform">
                  <Shield className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-emerald-950 truncate">
                    System Admin
                  </p>
                  <p className="text-[10px] text-emerald-700 truncate">
                    Role: ADMIN
                  </p>
                </div>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleQuickLogin("sales@crm.local", "Password123!")}
                className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/50 p-2.5 text-left hover:bg-blue-100/70 hover:border-blue-300 transition-all group disabled:opacity-60"
              >
                <div className="flex size-7 items-center justify-center rounded-lg bg-blue-700 text-white shadow-2xs group-hover:scale-105 transition-transform">
                  <UserCheck className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-blue-950 truncate">
                    Alex Sales
                  </p>
                  <p className="text-[10px] text-blue-700 truncate">
                    Role: SALES
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center text-xs text-gray-500">
            Chưa có tài khoản thành viên?{" "}
            <Link
              href="/register"
              className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f7f9f8]">
          <Loader2 className="size-8 animate-spin text-emerald-700" />
        </div>
      }
    >
      <LoginFormContent />
    </React.Suspense>
  );
}
