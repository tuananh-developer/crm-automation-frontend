"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Shield,
  Sparkles,
  User,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/services/api-client";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, isLoading } = useAuth();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<"ADMIN" | "SALES">("SALES");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Redirect if already authenticated and initial verification has finished
  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMessage("Vui lòng nhập họ và tên (tối thiểu 2 ký tự).");
      return;
    }
    if (!email.trim()) {
      setErrorMessage("Vui lòng nhập địa chỉ email hợp lệ.");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Mật khẩu phải có độ dài tối thiểu 8 ký tự.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });
      router.replace("/");
    } catch (err) {
      setErrorMessage(
        getApiErrorMessage(err) || "Đăng ký không thành công. Vui lòng thử lại.",
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
            Tạo tài khoản mới
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Tham gia vận hành hệ thống CRM Automation Platform
          </p>
        </div>

        {/* Register Form Card */}
        <div className="mt-8 rounded-3xl border border-gray-200/80 bg-white p-6 shadow-xl shadow-emerald-950/5 sm:p-8">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900">Đăng ký thành viên</h3>
            <p className="text-xs text-gray-500">
              Điền thông tin bên dưới để tạo tài khoản truy cập
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
                htmlFor="name"
                className="block text-xs font-semibold text-gray-700 mb-1.5"
              >
                Họ và tên
              </label>
              <div className="relative">
                <Input
                  id="name"
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9 text-xs"
                  disabled={isSubmitting}
                />
                <User className="absolute left-3 top-3 size-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

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
                  placeholder="nguyenvana@crm.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 text-xs"
                  disabled={isSubmitting}
                />
                <Mail className="absolute left-3 top-3 size-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-gray-700 mb-1.5"
              >
                Mật khẩu (tối thiểu 8 ký tự)
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
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

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Vai trò (Role)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("SALES")}
                  className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all ${
                    role === "SALES"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-2xs"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <UserCheck className="size-4 text-emerald-700" />
                  <div className="text-xs">
                    <div>Sales Rep</div>
                    <div className="text-[10px] text-gray-400 font-normal">
                      Nhân viên bán hàng
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("ADMIN")}
                  className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all ${
                    role === "ADMIN"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-2xs"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Shield className="size-4 text-emerald-700" />
                  <div className="text-xs">
                    <div>Admin</div>
                    <div className="text-[10px] text-gray-400 font-normal">
                      Quản trị toàn diện
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 mt-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  Đang khởi tạo tài khoản...
                </>
              ) : (
                <>
                  <UserPlus className="size-3.5 mr-1.5" />
                  Tạo tài khoản
                </>
              )}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center text-xs text-gray-500">
            Đã có tài khoản hệ thống?{" "}
            <Link
              href="/login"
              className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              Đăng nhập tại đây
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
