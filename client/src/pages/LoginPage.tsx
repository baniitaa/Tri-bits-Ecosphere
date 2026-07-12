import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { loginSchema, type LoginInput } from "@shared/schemas";
import { authApi } from "@/api/auth";
import { authStorage } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";

export function LoginPage() {
  const navigate = useNavigate();
  const auth = useAuth();

  useEffect(() => {
    if (auth.user) {
      navigate("/", { replace: true });
    }
  }, [auth.user, navigate]);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@ecosphere.local",
      password: "Admin@12345"
    }
  });

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (payload) => {
      authStorage.setToken(payload.data.token);
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      navigate("/", { replace: true });
    }
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_35%),linear-gradient(180deg,#f8fafc_0%,#e2e8f0_100%)] px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section className="space-y-6 text-slate-900">
          <div className="inline-flex rounded-full border border-emerald-200 bg-white/70 px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm backdrop-blur">
            EcoSphere ESG Management Platform
          </div>
          <h1 className="max-w-2xl text-5xl font-semibold tracking-tight sm:text-6xl">
            Executive-grade ESG operations in one clean workspace.
          </h1>
          <p className="max-w-xl text-lg leading-8 text-slate-600">
            Track environmental performance, manage governance controls, run social initiatives, and keep leadership aligned with a single secure platform.
          </p>
        </section>

        <Card className="mx-auto w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Use the seeded admin account to get started.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            >
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...form.register("email")} />
                {form.formState.errors.email ? <p className="mt-1 text-xs text-rose-600">{form.formState.errors.email.message}</p> : null}
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" {...form.register("password")} />
                {form.formState.errors.password ? <p className="mt-1 text-xs text-rose-600">{form.formState.errors.password.message}</p> : null}
              </div>
              {mutation.error ? <p className="text-sm text-rose-600">{mutation.error.message}</p> : null}
              <Button className="w-full" type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
