import { z } from "zod";
import {
  badgeFormSchema,
  challengeFormSchema,
  challengeParticipationFormSchema,
  rewardFormSchema,
  rewardRedemptionFormSchema
} from "../../../shared/src/schemas";

export const gamificationIdParamSchema = z.object({
  id: z.string().min(1)
});

export const createChallengeSchema = challengeFormSchema;
export const updateChallengeSchema = challengeFormSchema.partial();
export const createChallengeParticipationSchema = challengeParticipationFormSchema;

export const createBadgeSchema = badgeFormSchema;
export const updateBadgeSchema = badgeFormSchema.partial();
export const createRewardSchema = rewardFormSchema;
export const updateRewardSchema = rewardFormSchema.partial();
export const createRewardRedemptionSchema = rewardRedemptionFormSchema;
