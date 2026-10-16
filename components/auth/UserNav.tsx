"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, Shield, User, ChevronDown } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserNav() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    router.push("/login");
  };

  if (!isAuthenticated || !user) {
    return (
      <Button
        asChild
        size="sm"
        variant="outline"
        className="h-8 gap-1.5 border-emerald-600/30 text-emerald-800 hover:bg-emerald-50 text-xs font-semibold"
      >
        <Link href="/login">
          <LogIn className="size-3.5" />
          <span>Đăng nhập</span>
        </Link>
      </Button>
    );
  }

  const initials = getInitials(user.name);
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-gray-200 bg-white p-1 pr-2.5 shadow-2xs hover:border-emerald-300 hover:bg-gray-50/80 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={`${user.name} (${user.role})`}
      >
        <div
          className={`flex size-7 items-center justify-center rounded-full text-xs font-bold text-white shadow-xs ${
            isAdmin
              ? "bg-gradient-to-tr from-emerald-700 to-teal-800"
              : "bg-gradient-to-tr from-blue-600 to-indigo-700"
          }`}
        >
          {initials}
        </div>
        <div className="hidden sm:flex flex-col text-left leading-tight">
          <span className="text-xs font-semibold text-gray-900 max-w-[110px] truncate">
            {user.name}
          </span>
          <span className="text-[10px] font-medium text-emerald-700">
            {user.role}
          </span>
        </div>
        <ChevronDown className="size-3 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-2xl border border-gray-100 bg-white p-2 text-gray-900 shadow-xl ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95">
          {/* User Info Header */}
          <div className="px-3 py-2.5 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
            <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                  isAdmin
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                <Shield className="size-2.5" />
                {user.role}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 border border-gray-200">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                {user.status}
              </span>
            </div>
          </div>

          {/* Quick Menu */}
          <div className="py-1">
            <div className="px-3 py-1.5 text-[11px] text-gray-400 font-medium flex items-center gap-1.5">
              <User className="size-3" />
              <span>Tài khoản hệ thống</span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-1">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              <LogOut className="size-3.5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
