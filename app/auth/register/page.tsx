"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@/lib/zod-resolver";
import { z } from "zod";
import { Eye, EyeOff, Loader2, AlertCircle, Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/components/providers/AuthProvider";
import { toast } from "@/hooks/use-toast";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(150, "Name too long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100, "Password too long"),
  confirmPassword: z.string(),
  role: z.enum(["SALES", "ADMIN"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register: registerUser, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const redirect = searchParams.get("redirect") || "/leads";

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "SALES" as const,
    },
  });

  const password = useWatch({ control, name: "password" });

  const onSubmit = async (data: RegisterForm) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await registerUser(data.name, data.email, data.password, data.role);
      toast({ title: "Account created!", description: "You have successfully registered." });
      router.push(redirect);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setError(message);
      toast({ title: "Registration failed", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrength = (pwd: string): { label: string; color: string; width: number } => {
    if (!pwd) return { label: "", color: "bg-gray-200", width: 0 };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { label: "Weak", color: "bg-red-500", width: 33 };
    if (score <= 3) return { label: "Fair", color: "bg-yellow-500", width: 66 };
    return { label: "Strong", color: "bg-emerald-500", width: 100 };
  };

  const strength = getPasswordStrength(password);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8faf9] px-4 py-12">
      <Card className="w-full max-w-md shadow-sm border-gray-200">
        <CardHeader className="text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-emerald-700 text-white font-bold text-lg mb-4">
            CRM
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Create account</CardTitle>
          <CardDescription className="text-gray-500">Sign up to access the CRM platform</CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2" role="alert">
              <AlertCircle className="size-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" aria-hidden="true" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  className="pl-10"
                  {...register("name")}
                  disabled={isSubmitting || authLoading}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "name-error" : undefined}
                />
              </div>
              {errors.name && (
                <p id="name-error" className="text-xs text-red-600" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" aria-hidden="true" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  className="pl-10"
                  {...register("email")}
                  disabled={isSubmitting || authLoading}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="text-xs text-red-600" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" aria-hidden="true" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  {...register("password")}
                  disabled={isSubmitting || authLoading}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {password && (
                <div className="space-y-1">
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden" role="progressbar" aria-valuenow={strength.width} aria-valuemin={0} aria-valuemax={100}>
                    <div className={`h-full ${strength.color} transition-all duration-300`} style={{ width: `${strength.width}%` }} />
                  </div>
                  <p className="text-xs text-gray-500">Password strength: <span className="font-medium">{strength.label}</span></p>
                </div>
              )}
              {errors.password && (
                <p id="password-error" className="text-xs text-red-600" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" aria-hidden="true" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10"
                  {...register("confirmPassword")}
                  disabled={isSubmitting || authLoading}
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={errors.confirmPassword ? "confirm-error" : undefined}
                />
              </div>
              {errors.confirmPassword && (
                <p id="confirm-error" className="text-xs text-red-600" role="alert">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                id="role"
                {...register("role")}
                disabled={isSubmitting || authLoading}
                aria-invalid={!!errors.role}
              >
                <option value="SALES">Sales Representative</option>
                <option value="ADMIN">Administrator</option>
              </Select>
              {errors.role && (
                <p className="text-xs text-red-600" role="alert">{errors.role.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5"
              disabled={isSubmitting || authLoading}
            >
              {isSubmitting || authLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Creating account...
                </span>
              ) : (
                "Create account"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 border-t-0 pt-0">
          <p className="text-xs text-center text-gray-500">
            Already have an account?{" "}
            <Link href={`/auth/login?redirect=${encodeURIComponent(redirect)}`} className="text-emerald-700 hover:text-emerald-800 font-medium underline underline-offset-2">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f6f8f7]">
          <Loader2 className="h-8 w-8 animate-spin text-[#173b2b]" />
        </div>
      }
    >
      <RegisterFormContent />
    </React.Suspense>
  );
}