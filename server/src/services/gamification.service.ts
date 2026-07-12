import { prisma as prismaClient } from "../config/prisma";
import { AppError } from "../utils/app-error";
import { notificationsService } from "./notifications.service";
import type {
  BadgeFormInput,
  ChallengeFormInput,
  ChallengeParticipationFormInput,
  RewardFormInput,
  RewardRedemptionFormInput
} from "../../../shared/src/schemas";

const prisma = prismaClient as any;

const challengeSelect = {
  id: true,
  title: true,
  description: true,
  type: true,
  status: true,
  startDate: true,
  endDate: true,
  targetValue: true,
  xpReward: true,
  isAutoBadge: true,
  createdAt: true,
  updatedAt: true,
  badge: {
    select: {
      id: true,
      name: true,
      description: true,
      icon: true
    }
  },
  _count: {
    select: {
      participations: true
    }
  }
} as const;

const participationSelect = {
  id: true,
  status: true,
  progressValue: true,
  completedAt: true,
  awardedXp: true,
  createdAt: true,
  updatedAt: true,
  employee: {
    select: {
      id: true,
      employeeCode: true,
      firstName: true,
      lastName: true,
      xpPoints: true,
      department: {
        select: {
          id: true,
          name: true
        }
      }
    }
  }
} as const;

const badgeSelect = {
  id: true,
  name: true,
  description: true,
  icon: true,
  xpThreshold: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      awards: true
    }
  }
} as const;

const rewardSelect = {
  id: true,
  name: true,
  description: true,
  xpCost: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      redemptions: true
    }
  }
} as const;

const redemptionSelect = {
  id: true,
  status: true,
  requestedAt: true,
  fulfilledAt: true,
  notes: true,
  employee: {
    select: {
      id: true,
      employeeCode: true,
      firstName: true,
      lastName: true,
      xpPoints: true
    }
  },
  reward: {
    select: {
      id: true,
      name: true,
      xpCost: true
    }
  }
} as const;

const toDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toNumber = (value: unknown) => (typeof value === "number" ? value : Number(value ?? 0));

const applyXp = async (employeeId: string, delta: number) => {
  if (!delta) return;
  await prisma.employee.update({
    where: { id: employeeId },
    data: {
      xpPoints: {
        increment: delta
      }
    }
  });
};

const maybeAwardBadge = async (employeeId: string, badgeId?: string | null, sourceType?: string, sourceId?: string) => {
  if (!badgeId) return;

  const existing = await prisma.badgeAward.findUnique({
    where: {
      badgeId_employeeId: {
        badgeId,
        employeeId
      }
    }
  });

  if (existing) return;

  await prisma.badgeAward.create({
    data: {
      badgeId,
      employeeId,
      sourceType: sourceType ?? null,
      sourceId: sourceId ?? null
    }
  });

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      user: {
        select: { id: true }
      },
      firstName: true,
      lastName: true
    }
  });

  if (employee?.user?.id) {
    await notificationsService.create({
      userId: employee.user.id,
      type: "BADGE_UNLOCKED",
      title: "Badge unlocked",
      message: `You unlocked a new badge in EcoSphere.`,
      link: "/gamification",
      metadata: { badgeId }
    });
  }
};

export const gamificationService = {
  async dashboard() {
    const [challenges, participations, badges, rewards, redemptions, leaderboard] = await Promise.all([
      prisma.challenge.findMany({ select: { status: true } }),
      prisma.challengeParticipation.findMany({ select: { status: true, awardedXp: true } }),
      prisma.badge.findMany({ select: { id: true } }),
      prisma.reward.findMany({ select: { id: true } }),
      prisma.rewardRedemption.findMany({ select: { status: true } }),
      prisma.employee.findMany({
        orderBy: { xpPoints: "desc" },
        take: 10,
        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          lastName: true,
          xpPoints: true,
          department: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })
    ]);

    const completedParticipations = participations.filter((item: { status: string }) => item.status === "COMPLETED").length;
    const completionRate = participations.length === 0 ? 0 : (completedParticipations / participations.length) * 100;

    return {
      challengeCount: challenges.length,
      activeChallengeCount: challenges.filter((item: { status: string }) => item.status === "ACTIVE").length,
      badgeCount: badges.length,
      rewardCount: rewards.length,
      redemptionCount: redemptions.length,
      completedParticipationCount: completedParticipations,
      completionRate: Number(completionRate.toFixed(1)),
      leaderboard,
      recentRedemptions: await prisma.rewardRedemption.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: redemptionSelect
      }),
      recentChallenges: await prisma.challenge.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: challengeSelect
      })
    };
  },

  async leaderboard() {
    return prisma.employee.findMany({
      orderBy: { xpPoints: "desc" },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        xpPoints: true,
        department: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  },

  async challenges() {
    return prisma.challenge.findMany({
      orderBy: { createdAt: "desc" },
      select: challengeSelect
    });
  },

  async createChallenge(input: ChallengeFormInput) {
    return prisma.challenge.create({
      data: {
        title: input.title,
        description: input.description || null,
        type: input.type ?? "INDIVIDUAL",
        status: input.status ?? "DRAFT",
        startDate: toDate(input.startDate) ?? new Date(),
        endDate: toDate(input.endDate),
        targetValue: input.targetValue,
        xpReward: input.xpReward,
        badgeId: input.badgeId || null,
        isAutoBadge: input.isAutoBadge ?? true
      },
      select: challengeSelect
    });
  },

  async updateChallenge(id: string, input: Partial<ChallengeFormInput>) {
    const challenge = await prisma.challenge.findUnique({ where: { id } });
    if (!challenge) {
      throw new AppError("Challenge not found", 404, "CHALLENGE_NOT_FOUND");
    }

    return prisma.challenge.update({
      where: { id },
      data: {
        ...(input.title ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description || null } : {}),
        ...(input.type ? { type: input.type } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.startDate ? { startDate: toDate(input.startDate) ?? new Date() } : {}),
        ...(input.endDate !== undefined ? { endDate: toDate(input.endDate) } : {}),
        ...(input.targetValue !== undefined ? { targetValue: toNumber(input.targetValue) } : {}),
        ...(input.xpReward !== undefined ? { xpReward: toNumber(input.xpReward) } : {}),
        ...(input.badgeId !== undefined ? { badgeId: input.badgeId || null } : {}),
        ...(input.isAutoBadge !== undefined ? { isAutoBadge: input.isAutoBadge } : {})
      },
      select: challengeSelect
    });
  },

  async deleteChallenge(id: string) {
    const challenge = await prisma.challenge.findUnique({ where: { id } });
    if (!challenge) {
      throw new AppError("Challenge not found", 404, "CHALLENGE_NOT_FOUND");
    }
    await prisma.challenge.delete({ where: { id } });
  },

  async addParticipation(challengeId: string, input: ChallengeParticipationFormInput) {
    const [challenge, employee, settings] = await Promise.all([
      prisma.challenge.findUnique({ where: { id: challengeId } }),
      prisma.employee.findUnique({ where: { id: input.employeeId } }),
      prisma.organizationSetting.findUnique({ where: { id: "default" } })
    ]);

    if (!challenge) {
      throw new AppError("Challenge not found", 404, "CHALLENGE_NOT_FOUND");
    }
    if (!employee) {
      throw new AppError("Employee not found", 404, "EMPLOYEE_NOT_FOUND");
    }

    const previous = await prisma.challengeParticipation.findUnique({
      where: {
        challengeId_employeeId: {
          challengeId,
          employeeId: input.employeeId
        }
      }
    });

    const awardedXp = input.awardedXp ?? challenge.xpReward;
    const progressValue = input.progressValue ?? previous?.progressValue ?? 0;
    const status = input.status ?? (progressValue >= challenge.targetValue ? "COMPLETED" : "ENROLLED");

    const record = await prisma.challengeParticipation.upsert({
      where: {
        challengeId_employeeId: {
          challengeId,
          employeeId: input.employeeId
        }
      },
      update: {
        status,
        progressValue,
        completedAt: toDate(input.completedAt),
        awardedXp
      },
      create: {
        challengeId,
        employeeId: input.employeeId,
        status,
        progressValue,
        completedAt: toDate(input.completedAt),
        awardedXp
      },
      select: participationSelect
    });

    const xpDelta = awardedXp - (previous?.awardedXp ?? 0);
    await applyXp(input.employeeId, xpDelta);

    const shouldAwardBadge = Boolean(settings?.badgeAutoAwardEnabled) && (challenge.isAutoBadge || status === "COMPLETED");
    if (shouldAwardBadge) {
      await maybeAwardBadge(input.employeeId, challenge.badgeId, "CHALLENGE", challengeId);
    }

    return record;
  },

  async badges() {
    return prisma.badge.findMany({
      orderBy: { createdAt: "desc" },
      select: badgeSelect
    });
  },

  async createBadge(input: BadgeFormInput) {
    return prisma.badge.create({
      data: {
        name: input.name,
        description: input.description || null,
        icon: input.icon || null,
        xpThreshold: input.xpThreshold,
        isActive: input.isActive ?? true
      },
      select: badgeSelect
    });
  },

  async updateBadge(id: string, input: Partial<BadgeFormInput>) {
    const badge = await prisma.badge.findUnique({ where: { id } });
    if (!badge) {
      throw new AppError("Badge not found", 404, "BADGE_NOT_FOUND");
    }

    return prisma.badge.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description || null } : {}),
        ...(input.icon !== undefined ? { icon: input.icon || null } : {}),
        ...(input.xpThreshold !== undefined ? { xpThreshold: toNumber(input.xpThreshold) } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {})
      },
      select: badgeSelect
    });
  },

  async deleteBadge(id: string) {
    const badge = await prisma.badge.findUnique({ where: { id } });
    if (!badge) {
      throw new AppError("Badge not found", 404, "BADGE_NOT_FOUND");
    }
    await prisma.badge.delete({ where: { id } });
  },

  async awardBadge(badgeId: string, employeeId: string) {
    return maybeAwardBadge(employeeId, badgeId, "MANUAL", badgeId);
  },

  async rewards() {
    return prisma.reward.findMany({
      orderBy: { createdAt: "desc" },
      select: rewardSelect
    });
  },

  async createReward(input: RewardFormInput) {
    return prisma.reward.create({
      data: {
        name: input.name,
        description: input.description || null,
        xpCost: input.xpCost,
        isActive: input.isActive ?? true
      },
      select: rewardSelect
    });
  },

  async updateReward(id: string, input: Partial<RewardFormInput>) {
    const reward = await prisma.reward.findUnique({ where: { id } });
    if (!reward) {
      throw new AppError("Reward not found", 404, "REWARD_NOT_FOUND");
    }

    return prisma.reward.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description || null } : {}),
        ...(input.xpCost !== undefined ? { xpCost: toNumber(input.xpCost) } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {})
      },
      select: rewardSelect
    });
  },

  async deleteReward(id: string) {
    const reward = await prisma.reward.findUnique({ where: { id } });
    if (!reward) {
      throw new AppError("Reward not found", 404, "REWARD_NOT_FOUND");
    }
    await prisma.reward.delete({ where: { id } });
  },

  async redeemReward(rewardId: string, input: RewardRedemptionFormInput) {
    const [reward, employee] = await Promise.all([
      prisma.reward.findUnique({ where: { id: rewardId } }),
      prisma.employee.findUnique({ where: { id: input.employeeId } })
    ]);

    if (!reward) {
      throw new AppError("Reward not found", 404, "REWARD_NOT_FOUND");
    }
    if (!employee) {
      throw new AppError("Employee not found", 404, "EMPLOYEE_NOT_FOUND");
    }

    if ((input.status ?? "REQUESTED") !== "REQUESTED" && employee.xpPoints < reward.xpCost) {
      throw new AppError("Not enough XP for redemption", 400, "INSUFFICIENT_XP");
    }

    const redemption = await prisma.rewardRedemption.create({
      data: {
        rewardId,
        employeeId: input.employeeId,
        status: input.status ?? "REQUESTED",
        notes: input.notes || null,
        fulfilledAt: input.status === "FULFILLED" ? new Date() : null
      },
      select: redemptionSelect
    });

    if (redemption.status === "APPROVED" || redemption.status === "FULFILLED") {
      await applyXp(input.employeeId, -reward.xpCost);
    }

    const user = await prisma.employee.findUnique({
      where: { id: input.employeeId },
      select: { user: { select: { id: true } } }
    });

    if (user?.user?.id) {
      await notificationsService.create({
        userId: user.user.id,
        type: "REWARD_REDEEMED",
        title: "Reward redemption updated",
        message: `Your redemption request for ${reward.name} is now ${redemption.status.toLowerCase()}.`,
        link: "/gamification",
        metadata: { rewardId }
      });
    }

    return redemption;
  }
};
