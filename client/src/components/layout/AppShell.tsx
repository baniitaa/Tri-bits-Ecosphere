import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BarChart3, Building2, Users, ShieldCheck, Settings, LogOut, Leaf, HeartHandshake, Scale, Trophy, FileText, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authStorage } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { queryClient } from "@/lib/queryClient";

const navItems = [
  { label: "Dashboard", to: "/", icon: BarChart3, permission: "dashboard.view" },
  { label: "Departments", to: "/departments", icon: Building2, permission: "departments.manage" },
  { label: "Employees", to: "/employees", icon: Users, permission: "employees.manage" },
  { label: "Users", to: "/users", icon: Users, permission: "users.manage" },
  { label: "Roles", to: "/roles", icon: ShieldCheck, permission: "roles.manage" },
  { label: "Environmental", to: "/environmental", icon: Leaf, permission: "environmental.manage" },
  { label: "Social", to: "/social", icon: HeartHandshake, permission: "social.manage" },
  { label: "Governance", to: "/governance", icon: Scale, permission: "governance.manage" },
  { label: "Gamification", to: "/gamification", icon: Trophy, permission: "gamification.manage" },
  { label: "Reports", to: "/reports", icon: FileText, permission: "reports.manage" },
  { label: "Notifications", to: "/notifications", icon: Bell, permission: "dashboard.view" },
  { label: "Settings", to: "/settings", icon: Settings, permission: "settings.manage" }
];

export function AppShell() {
  const auth = useAuth();
  const navigate = useNavigate();
  const permissions = new Set(auth.permissions);

  const visibleNavItems = navItems.filter((item) => permissions.has(item.permission) || auth.user?.role?.name === "Admin");

  const handleLogout = () => {
    authStorage.clear();
    queryClient.clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-slate-200/70 bg-slate-950 text-white">
          <div className="flex h-full flex-col p-5">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white">
                <Leaf className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-400">EcoSphere</p>
                <p className="text-lg font-semibold">ESG Platform</p>
              </div>
            </div>

            <nav className="flex-1 space-y-1">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                        isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
                      )
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <p className="mb-2 font-medium text-white">Signed in</p>
              <p>{auth.user?.firstName} {auth.user?.lastName}</p>
              <p className="text-xs text-slate-400">{auth.user?.role?.name}</p>
              <Button variant="secondary" size="sm" className="mt-4 w-full justify-center" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </aside>

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <header className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500">Single organization ESG management</p>
                  <h1 className="text-2xl font-semibold tracking-tight">{auth.user?.role?.name ?? "Workspace"} workspace</h1>
                </div>
                <div className="text-sm text-slate-600">
                  {auth.user?.email}
                </div>
              </div>
            </header>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
