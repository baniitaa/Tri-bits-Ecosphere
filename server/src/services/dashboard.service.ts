import { prisma as prismaClient } from "../config/prisma";

const prisma = prismaClient as any;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const dashboardService = {
  async overview() {
    const [
      users,
      roles,
      departments,
      employees,
      activeEmployees,
      settings,
      carbonTotals,
      csrParticipationCount,
      trainingParticipationCount,
      trainingCompletions,
      policies,
      acknowledgements,
      issues,
      challenges,
      badges,
      rewards,
      unreadNotificationsCount,
      leaderboard,
      departmentRankingRows,
      recentCarbonTransactions,
      recentCsrActivities,
      recentTrainings,
      recentIssues,
      recentNotifications
    ] = await Promise.all([
      prisma.user.count(),
      prisma.role.count(),
      prisma.department.count(),
      prisma.employee.count(),
      prisma.employee.count({ where: { isActive: true } }),
      prisma.organizationSetting.findUnique({ where: { id: "default" } }),
      prisma.carbonTransaction.aggregate({ _sum: { calculatedEmissionsKg: true } }),
      prisma.csrParticipation.count(),
      prisma.trainingParticipation.count(),
      prisma.trainingParticipation.count({ where: { participationStatus: "COMPLETED" } }),
      prisma.policy.findMany({ select: { id: true, status: true } }),
      prisma.policyAcknowledgement.findMany({ select: { id: true } }),
      prisma.complianceIssue.findMany({ select: { id: true, status: true, dueDate: true, departmentId: true } }),
      prisma.challenge.findMany({ select: { status: true } }),
      prisma.badge.count(),
      prisma.reward.count(),
      prisma.notification.count({ where: { isRead: false } }),
      prisma.employee.findMany({
        orderBy: { xpPoints: "desc" },
        take: 5,
        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          lastName: true,
          xpPoints: true,
          department: {
            select: { id: true, code: true, name: true }
          }
        }
      }),
      prisma.department.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          code: true,
          name: true,
          _count: {
            select: {
              employees: true,
              csrActivities: true,
              trainingSessions: true,
              complianceIssues: true,
              policies: true,
              audits: true
            }
          }
        }
      }),
      prisma.carbonTransaction.findMany({
        orderBy: { transactionDate: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          calculatedEmissionsKg: true,
          transactionDate: true,
          department: { select: { id: true, name: true } }
        }
      }),
      prisma.csrActivity.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          department: { select: { id: true, name: true } }
        }
      }),
      prisma.trainingSession.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          department: { select: { id: true, name: true } }
        }
      }),
      prisma.complianceIssue.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          severity: true,
          dueDate: true,
          department: { select: { id: true, name: true } }
        }
      }),
      prisma.notification.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          isRead: true,
          createdAt: true
        }
      })
    ]);

    const emissionTotal = carbonTotals._sum.calculatedEmissionsKg ?? 0;
    const activeChallengeCount = challenges.filter((item: { status: string }) => item.status === "ACTIVE").length;
    const openIssues = issues.filter((issue: { status: string; dueDate: Date | null }) =>
      issue.status !== "RESOLVED" && issue.status !== "CLOSED"
    );
    const overdueIssues = issues.filter((issue: { status: string; dueDate: Date | null }) =>
      issue.dueDate ? new Date(issue.dueDate) < new Date() && issue.status !== "RESOLVED" && issue.status !== "CLOSED" : false
    );

    const csrScore = employees === 0 ? 0 : clamp((csrParticipationCount / employees) * 100, 0, 100);
    const trainingScore = employees === 0 ? 0 : clamp((trainingCompletions / employees) * 100, 0, 100);
    const socialScore = Number(((csrScore + trainingScore) / 2).toFixed(1));
    const governanceScore = Number(
      clamp(100 - openIssues.length * 12 + (acknowledgements.length / Math.max(1, employees)) * 20, 0, 100).toFixed(1)
    );
    const environmentalScore = Number(clamp(100 - emissionTotal / 20, 0, 100).toFixed(1));
    const overallEsgScore = Number(
      (
        environmentalScore * ((settings?.environmentalWeight ?? 40) / 100) +
        socialScore * ((settings?.socialWeight ?? 30) / 100) +
        governanceScore * ((settings?.governanceWeight ?? 30) / 100)
      ).toFixed(1)
    );

    const departmentRanking = (departmentRankingRows as Array<{ id: string; code: string; name: string; _count: { employees: number; csrActivities: number; trainingSessions: number; complianceIssues: number; policies: number; audits: number } }>)
      .map((department) => {
        const social = clamp(((department._count.csrActivities + department._count.trainingSessions) / Math.max(1, department._count.employees)) * 100, 0, 100);
        const governance = clamp(100 - department._count.complianceIssues * 10 + (department._count.policies + department._count.audits) * 3, 0, 100);
        const environmental = environmentalScore;
        const overall = Number(
          (
            environmental * ((settings?.environmentalWeight ?? 40) / 100) +
            social * ((settings?.socialWeight ?? 30) / 100) +
            governance * ((settings?.governanceWeight ?? 30) / 100)
          ).toFixed(1)
        );

        return {
          id: department.id,
          code: department.code,
          name: department.name,
          environmentalScore: Number(environmental.toFixed(1)),
          socialScore: Number(social.toFixed(1)),
          governanceScore: Number(governance.toFixed(1)),
          overallScore: overall
        };
      })
      .sort((left: { overallScore: number }, right: { overallScore: number }) => right.overallScore - left.overallScore)
      .slice(0, 5);

    return {
      users,
      roles,
      departments,
      employees,
      activeEmployees,
      settings,
      overallEsgScore,
      environmentalScore,
      socialScore,
      governanceScore,
      carbonTrend: recentCarbonTransactions.map((item: { title: string; calculatedEmissionsKg: number; transactionDate: Date; department: { name: string } }) => ({
        label: item.title,
        value: item.calculatedEmissionsKg,
        department: item.department?.name ?? "-",
        date: item.transactionDate
      })),
      participationTrend: [
        { label: "CSR", value: csrParticipationCount },
        { label: "Training", value: trainingParticipationCount }
      ],
      challengeCompletionRate: trainingParticipationCount === 0 ? 0 : Number(((trainingCompletions / trainingParticipationCount) * 100).toFixed(1)),
      challengeCount: challenges.length,
      activeChallengeCount,
      complianceIssues: {
        total: issues.length,
        open: openIssues.length,
        overdue: overdueIssues.length
      },
      leaderboard,
      departmentRanking,
      recentActivities: {
        carbon: recentCarbonTransactions,
        csr: recentCsrActivities,
        training: recentTrainings,
        governance: recentIssues
      },
      notifications: {
        unreadCount: unreadNotificationsCount,
        recent: recentNotifications
      },
      summary: {
        badgeCount: badges,
        rewardCount: rewards
      }
    };
  }
};
