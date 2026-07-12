import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function PermissionGate({ permission, children }: { permission: string; children: ReactNode }) {
  const auth = useAuth();

  if (auth.isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">Checking access...</div>;
  }

  const hasPermission = auth.user?.role?.name === "Admin" || auth.permissions.includes(permission);
  if (!hasPermission) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
