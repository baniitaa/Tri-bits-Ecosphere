import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Bell, Leaf, ShieldCheck, Trophy, Users } from "lucide-react";
import { dashboardApi } from "@/api/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table } from "@/components/ui/table";
import { Page } from "@/components/layout/Page";

const formatNumber = (value: number) => new Intl.NumberFormat("en-US").format(value);

export function DashboardPage() {
  const overview = useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: dashboardApi.overview
  });

  const data = overview.data?.data;
  const settings = data?.settings;
  const departmentRanking = data?.departmentRanking ?? [];
  const notifications = data?.notifications.recent ?? [];
  const carbonActivities = data?.recentActivities.carbon ?? [];
  const csrActivities = data?.recentActivities.csr ?? [];

  const cards = [
    { label: "Overall ESG", value: data?.overallEsgScore ?? 0, icon: ShieldCheck },
    { label: "Environmental", value: data?.environmentalScore ?? 0, icon: Leaf },
    { label: "Social", value: data?.socialScore ?? 0, icon: Users },
    { label: "Governance", value: data?.governanceScore ?? 0, icon: Trophy }
  ];

  const secondaryCards = [
    { label: "Employees", value: data?.employees ?? 0 },
    { label: "Active employees", value: data?.activeEmployees ?? 0 },
    { label: "Open issues", value: data?.complianceIssues.open ?? 0 },
    { label: "Unread notifications", value: data?.notifications.unreadCount ?? 0 }
  ];

  return (
    <Page title="Dashboard" description="Executive ESG view for the single organization setup.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</p>
                </div>
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {secondaryCards.map((card) => (
          <Card key={card.label}>
            <CardContent>
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{formatNumber(card.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Carbon trend</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.carbonTrend ?? []}>
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#0f172a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organization settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Organization</span>
              <span className="font-medium text-slate-900">{settings?.organizationName ?? "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Environmental weight</span>
              <span className="font-medium text-slate-900">{settings?.environmentalWeight ?? 0}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Social weight</span>
              <span className="font-medium text-slate-900">{settings?.socialWeight ?? 0}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Governance weight</span>
              <span className="font-medium text-slate-900">{settings?.governanceWeight ?? 0}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Emission calculation</span>
              <span className="font-medium text-slate-900">{settings?.emissionCalculationEnabled ? "On" : "Off"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Badge auto-award</span>
              <span className="font-medium text-slate-900">{settings?.badgeAutoAwardEnabled ? "On" : "Off"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Department ranking</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Department</th>
                  <th className="py-3 pr-4">Environmental</th>
                  <th className="py-3 pr-4">Social</th>
                  <th className="py-3 pr-4">Governance</th>
                  <th className="py-3 pr-4">Overall</th>
                </tr>
              </thead>
              <tbody>
                {departmentRanking.map((department) => (
                  <tr key={department.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-medium text-slate-900">{department.name}</td>
                    <td className="py-3 pr-4">{department.environmentalScore}</td>
                    <td className="py-3 pr-4">{department.socialScore}</td>
                    <td className="py-3 pr-4">{department.governanceScore}</td>
                    <td className="py-3 pr-4">{department.overallScore}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.map((notification) => (
              <div key={notification.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900">{notification.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                  </div>
                  <Badge className={notification.isRead ? "bg-slate-100 text-slate-600" : "bg-emerald-100 text-emerald-700"}>
                    {notification.type}
                  </Badge>
                </div>
              </div>
            ))}
            {!notifications.length ? <p className="py-8 text-center text-sm text-slate-500">No notifications yet.</p> : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data?.leaderboard ?? []).map((employee, index) => (
              <div key={employee.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                <div>
                  <p className="font-medium text-slate-900">
                    #{index + 1} {employee.firstName} {employee.lastName}
                  </p>
                  <p className="text-xs text-slate-500">{employee.department?.name ?? "-"}</p>
                </div>
                <Badge className="bg-slate-100 text-slate-700">{employee.xpPoints} XP</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {carbonActivities.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="font-medium text-slate-900">{item.title}</p>
                <p className="text-slate-600">{item.department?.name ?? "-"} · {item.calculatedEmissionsKg} kg</p>
              </div>
            ))}
            {csrActivities.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="font-medium text-slate-900">{item.title}</p>
                <p className="text-slate-600">{item.department?.name ?? "-"} · {item.status}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Module summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Challenges</span>
              <span className="font-medium text-slate-900">{data?.challengeCount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Active challenges</span>
              <span className="font-medium text-slate-900">{data?.activeChallengeCount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Open compliance issues</span>
              <span className="font-medium text-slate-900">{data?.complianceIssues.open ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Overdue compliance issues</span>
              <span className="font-medium text-slate-900">{data?.complianceIssues.overdue ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Badge count</span>
              <span className="font-medium text-slate-900">{data?.summary.badgeCount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Reward count</span>
              <span className="font-medium text-slate-900">{data?.summary.rewardCount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Unread notifications</span>
              <span className="font-medium text-slate-900">{data?.notifications.unreadCount ?? 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
