import { apiRequest } from "@/lib/api";

export type DashboardOverview = {
  users: number;
  roles: number;
  departments: number;
  employees: number;
  activeEmployees: number;
  settings: {
    organizationName: string;
    environmentalWeight: number;
    socialWeight: number;
    governanceWeight: number;
  } | null;
  overallEsgScore: number;
  environmentalScore: number;
  socialScore: number;
  governanceScore: number;
  carbonTrend: Array<{ label: string; value: number; department: string; date: string }>;
  participationTrend: Array<{ label: string; value: number }>;
  challengeCompletionRate: number;
  challengeCount: number;
  activeChallengeCount: number;
  complianceIssues: { total: number; open: number; overdue: number };
  leaderboard: Array<{ id: string; firstName: string; lastName: string; xpPoints: number; department?: { id: string; code: string; name: string } | null }>;
  departmentRanking: Array<{ id: string; code: string; name: string; environmentalScore: number; socialScore: number; governanceScore: number; overallScore: number }>;
  recentActivities: {
    carbon: Array<{ id: string; title: string; calculatedEmissionsKg: number; transactionDate: string; department?: { id: string; name: string } | null }>;
    csr: Array<{ id: string; title: string; status: string; createdAt: string; department?: { id: string; name: string } | null }>;
    training: Array<{ id: string; title: string; status: string; createdAt: string; department?: { id: string; name: string } | null }>;
    governance: Array<{ id: string; title: string; status: string; severity: string; dueDate?: string | null; department?: { id: string; name: string } | null }>;
  };
  notifications: { unreadCount: number; recent: Array<{ id: string; type: string; title: string; message: string; isRead: boolean; createdAt: string }> };
  summary: { badgeCount: number; rewardCount: number };
};

export const dashboardApi = {
  overview: () => apiRequest<DashboardOverview>("/dashboard/overview")
};
