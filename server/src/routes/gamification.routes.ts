import { Router } from "express";
import { gamificationController } from "../controllers/gamification.controller";
import { asyncHandler } from "../middleware/async-handler";
import { requireAuth } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/require-permission";
import { validate } from "../middleware/validate.middleware";
import {
  createBadgeSchema,
  createChallengeParticipationSchema,
  createChallengeSchema,
  createRewardRedemptionSchema,
  createRewardSchema,
  gamificationIdParamSchema,
  updateBadgeSchema,
  updateChallengeSchema,
  updateRewardSchema
} from "../validators/gamification.schema";

export const gamificationRouter = Router();

gamificationRouter.get("/dashboard", requireAuth, requirePermission("gamification.manage"), asyncHandler(gamificationController.dashboard));
gamificationRouter.get("/leaderboard", requireAuth, requirePermission("gamification.manage"), asyncHandler(gamificationController.leaderboard));

gamificationRouter.get("/challenges", requireAuth, requirePermission("gamification.manage"), asyncHandler(gamificationController.challenges));
gamificationRouter.post("/challenges", requireAuth, requirePermission("gamification.manage"), validate(createChallengeSchema), asyncHandler(gamificationController.createChallenge));
gamificationRouter.put("/challenges/:id", requireAuth, requirePermission("gamification.manage"), validate(gamificationIdParamSchema, "params"), validate(updateChallengeSchema), asyncHandler(gamificationController.updateChallenge));
gamificationRouter.delete("/challenges/:id", requireAuth, requirePermission("gamification.manage"), validate(gamificationIdParamSchema, "params"), asyncHandler(gamificationController.deleteChallenge));
gamificationRouter.post("/challenges/:id/participations", requireAuth, requirePermission("gamification.manage"), validate(gamificationIdParamSchema, "params"), validate(createChallengeParticipationSchema), asyncHandler(gamificationController.addParticipation));

gamificationRouter.get("/badges", requireAuth, requirePermission("gamification.manage"), asyncHandler(gamificationController.badges));
gamificationRouter.post("/badges", requireAuth, requirePermission("gamification.manage"), validate(createBadgeSchema), asyncHandler(gamificationController.createBadge));
gamificationRouter.put("/badges/:id", requireAuth, requirePermission("gamification.manage"), validate(gamificationIdParamSchema, "params"), validate(updateBadgeSchema), asyncHandler(gamificationController.updateBadge));
gamificationRouter.delete("/badges/:id", requireAuth, requirePermission("gamification.manage"), validate(gamificationIdParamSchema, "params"), asyncHandler(gamificationController.deleteBadge));
gamificationRouter.post("/badges/:id/award", requireAuth, requirePermission("gamification.manage"), validate(gamificationIdParamSchema, "params"), asyncHandler(gamificationController.awardBadge));

gamificationRouter.get("/rewards", requireAuth, requirePermission("gamification.manage"), asyncHandler(gamificationController.rewards));
gamificationRouter.post("/rewards", requireAuth, requirePermission("gamification.manage"), validate(createRewardSchema), asyncHandler(gamificationController.createReward));
gamificationRouter.put("/rewards/:id", requireAuth, requirePermission("gamification.manage"), validate(gamificationIdParamSchema, "params"), validate(updateRewardSchema), asyncHandler(gamificationController.updateReward));
gamificationRouter.delete("/rewards/:id", requireAuth, requirePermission("gamification.manage"), validate(gamificationIdParamSchema, "params"), asyncHandler(gamificationController.deleteReward));
gamificationRouter.post("/rewards/:id/redemptions", requireAuth, requirePermission("gamification.manage"), validate(gamificationIdParamSchema, "params"), validate(createRewardRedemptionSchema), asyncHandler(gamificationController.redeemReward));
