export const DEFAULT_ROLE_NAMES = ["Admin", "ESG Manager", "Department Manager", "Employee"] as const;

export const PERMISSION_DEFINITIONS = [
  { key: "dashboard.view", name: "View dashboard", module: "Dashboard" },
  { key: "users.manage", name: "Manage users", module: "Access" },
  { key: "roles.manage", name: "Manage roles", module: "Access" },
  { key: "departments.manage", name: "Manage departments", module: "Master Data" },
  { key: "employees.manage", name: "Manage employees", module: "Master Data" },
  { key: "settings.manage", name: "Manage settings", module: "System" },
  { key: "environmental.manage", name: "Manage environmental data", module: "Environmental" },
  { key: "social.manage", name: "Manage social data", module: "Social" },
  { key: "governance.manage", name: "Manage governance data", module: "Governance" },
  { key: "gamification.manage", name: "Manage gamification data", module: "Gamification" },
  { key: "reports.manage", name: "Manage reports", module: "Reports" }
] as const;

export const DEFAULT_SETTINGS = {
  organizationName: "EcoSphere",
  legalName: "EcoSphere Private Limited",
  timezone: "Asia/Kolkata",
  currency: "INR",
  emissionCalculationEnabled: true,
  evidenceRequired: true,
  badgeAutoAwardEnabled: true,
  notificationEnabled: true,
  environmentalWeight: 40,
  socialWeight: 30,
  governanceWeight: 30
} as const;
