import type { Request, Response } from "express";
import { gamificationService } from "../services/gamification.service";
import { sendSuccess } from "../utils/response";

export const gamificationController = {
  async dashboard(_req: Request, res: Response) {
    return sendSuccess(res, await gamificationService.dashboard());
  },

  async leaderboard(_req: Request, res: Response) {
    return sendSuccess(res, await gamificationService.leaderboard());
  },

  async challenges(_req: Request, res: Response) {
    return sendSuccess(res, await gamificationService.challenges());
  },

  async createChallenge(req: Request, res: Response) {
    return sendSuccess(res, await gamificationService.createChallenge(req.body), "Challenge created successfully");
  },

  async updateChallenge(req: Request, res: Response) {
    return sendSuccess(res, await gamificationService.updateChallenge(String(req.params.id), req.body), "Challenge updated successfully");
  },

  async deleteChallenge(req: Request, res: Response) {
    await gamificationService.deleteChallenge(String(req.params.id));
    return sendSuccess(res, null, "Challenge deleted successfully");
  },

  async addParticipation(req: Request, res: Response) {
    return sendSuccess(res, await gamificationService.addParticipation(String(req.params.id), req.body), "Participation recorded successfully");
  },

  async badges(_req: Request, res: Response) {
    return sendSuccess(res, await gamificationService.badges());
  },

  async createBadge(req: Request, res: Response) {
    return sendSuccess(res, await gamificationService.createBadge(req.body), "Badge created successfully");
  },

  async updateBadge(req: Request, res: Response) {
    return sendSuccess(res, await gamificationService.updateBadge(String(req.params.id), req.body), "Badge updated successfully");
  },

  async deleteBadge(req: Request, res: Response) {
    await gamificationService.deleteBadge(String(req.params.id));
    return sendSuccess(res, null, "Badge deleted successfully");
  },

  async awardBadge(req: Request, res: Response) {
    await gamificationService.awardBadge(String(req.params.id), req.body.employeeId);
    return sendSuccess(res, null, "Badge awarded successfully");
  },

  async rewards(_req: Request, res: Response) {
    return sendSuccess(res, await gamificationService.rewards());
  },

  async createReward(req: Request, res: Response) {
    return sendSuccess(res, await gamificationService.createReward(req.body), "Reward created successfully");
  },

  async updateReward(req: Request, res: Response) {
    return sendSuccess(res, await gamificationService.updateReward(String(req.params.id), req.body), "Reward updated successfully");
  },

  async deleteReward(req: Request, res: Response) {
    await gamificationService.deleteReward(String(req.params.id));
    return sendSuccess(res, null, "Reward deleted successfully");
  },

  async redeemReward(req: Request, res: Response) {
    return sendSuccess(res, await gamificationService.redeemReward(String(req.params.id), req.body), "Reward redemption created successfully");
  }
};
