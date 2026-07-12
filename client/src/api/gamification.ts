import { apiRequest } from "@/lib/api";
import type {
  BadgeFormInput,
  ChallengeFormInput,
  ChallengeParticipationFormInput,
  RewardFormInput,
  RewardRedemptionFormInput
} from "@shared/schemas";

export type GamificationDashboard = {
  challengeCount: number;
  activeChallengeCount: number;
  badgeCount: number;
  rewardCount: number;
  redemptionCount: number;
  completedParticipationCount: number;
  completionRate: number;
  leaderboard: Array<any>;
  recentRedemptions: Array<any>;
  recentChallenges: Array<any>;
};

export type ChallengeRow = {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  status: string;
  startDate: string;
  endDate?: string | null;
  targetValue: number;
  xpReward: number;
  isAutoBadge: boolean;
  badge?: { id: string; name: string; description?: string | null; icon?: string | null } | null;
  _count: { participations: number };
};

export type BadgeRow = {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  xpThreshold: number;
  isActive: boolean;
  _count: { awards: number };
};

export type RewardRow = {
  id: string;
  name: string;
  description?: string | null;
  xpCost: number;
  isActive: boolean;
  _count: { redemptions: number };
};

export const gamificationApi = {
  dashboard: () => apiRequest<GamificationDashboard>("/gamification/dashboard"),
  leaderboard: () => apiRequest<Array<any>>("/gamification/leaderboard"),
  challenges: () => apiRequest<ChallengeRow[]>("/gamification/challenges"),
  createChallenge: (input: ChallengeFormInput) => apiRequest<ChallengeRow>("/gamification/challenges", { method: "POST", body: JSON.stringify(input) }),
  updateChallenge: (id: string, input: Partial<ChallengeFormInput>) =>
    apiRequest<ChallengeRow>(`/gamification/challenges/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  deleteChallenge: (id: string) => apiRequest<null>(`/gamification/challenges/${id}`, { method: "DELETE" }),
  addParticipation: (id: string, input: ChallengeParticipationFormInput) =>
    apiRequest(`/gamification/challenges/${id}/participations`, { method: "POST", body: JSON.stringify(input) }),
  badges: () => apiRequest<BadgeRow[]>("/gamification/badges"),
  createBadge: (input: BadgeFormInput) => apiRequest<BadgeRow>("/gamification/badges", { method: "POST", body: JSON.stringify(input) }),
  updateBadge: (id: string, input: Partial<BadgeFormInput>) => apiRequest<BadgeRow>(`/gamification/badges/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  deleteBadge: (id: string) => apiRequest<null>(`/gamification/badges/${id}`, { method: "DELETE" }),
  awardBadge: (id: string, employeeId: string) => apiRequest<null>(`/gamification/badges/${id}/award`, { method: "POST", body: JSON.stringify({ employeeId }) }),
  rewards: () => apiRequest<RewardRow[]>("/gamification/rewards"),
  createReward: (input: RewardFormInput) => apiRequest<RewardRow>("/gamification/rewards", { method: "POST", body: JSON.stringify(input) }),
  updateReward: (id: string, input: Partial<RewardFormInput>) => apiRequest<RewardRow>(`/gamification/rewards/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  deleteReward: (id: string) => apiRequest<null>(`/gamification/rewards/${id}`, { method: "DELETE" }),
  redeemReward: (id: string, input: RewardRedemptionFormInput) =>
    apiRequest(`/gamification/rewards/${id}/redemptions`, { method: "POST", body: JSON.stringify(input) })
};
