import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { PermissionGate } from "@/components/layout/PermissionGate";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { DepartmentsPage } from "@/pages/DepartmentsPage";
import { EmployeesPage } from "@/pages/EmployeesPage";
import { UsersPage } from "@/pages/UsersPage";
import { RolesPage } from "@/pages/RolesPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { EnvironmentalPage } from "@/pages/EnvironmentalPage";
import { SocialPage } from "@/pages/SocialPage";
import { GovernancePage } from "@/pages/GovernancePage";
import { GamificationPage } from "@/pages/GamificationPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { NotificationsPage } from "@/pages/NotificationsPage";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/departments" element={<PermissionGate permission="departments.manage"><DepartmentsPage /></PermissionGate>} />
          <Route path="/employees" element={<PermissionGate permission="employees.manage"><EmployeesPage /></PermissionGate>} />
          <Route path="/users" element={<PermissionGate permission="users.manage"><UsersPage /></PermissionGate>} />
          <Route path="/roles" element={<PermissionGate permission="roles.manage"><RolesPage /></PermissionGate>} />
          <Route path="/environmental" element={<PermissionGate permission="environmental.manage"><EnvironmentalPage /></PermissionGate>} />
          <Route path="/social" element={<PermissionGate permission="social.manage"><SocialPage /></PermissionGate>} />
          <Route path="/governance" element={<PermissionGate permission="governance.manage"><GovernancePage /></PermissionGate>} />
          <Route path="/gamification" element={<PermissionGate permission="gamification.manage"><GamificationPage /></PermissionGate>} />
          <Route path="/reports" element={<PermissionGate permission="reports.manage"><ReportsPage /></PermissionGate>} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<PermissionGate permission="settings.manage"><SettingsPage /></PermissionGate>} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
