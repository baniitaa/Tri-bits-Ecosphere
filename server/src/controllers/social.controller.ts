import type { Request, Response } from "express";
import { socialService } from "../services/social.service";
import { sendSuccess } from "../utils/response";

export const socialController = {
  async dashboard(_req: Request, res: Response) {
    const data = await socialService.dashboard();
    return sendSuccess(res, data);
  },

  async activities(_req: Request, res: Response) {
    const rows = await socialService.activities();
    return sendSuccess(res, rows);
  },

  async createActivity(req: Request, res: Response) {
    const activity = await socialService.createActivity(req.body, req.authUser!.id);
    return sendSuccess(res, activity, "CSR activity created successfully");
  },

  async updateActivity(req: Request, res: Response) {
    const activity = await socialService.updateActivity(String(req.params.id), req.body);
    return sendSuccess(res, activity, "CSR activity updated successfully");
  },

  async approveActivity(req: Request, res: Response) {
    const activity = await socialService.approveActivity(String(req.params.id), req.authUser!.id);
    return sendSuccess(res, activity, "CSR activity approved successfully");
  },

  async deleteActivity(req: Request, res: Response) {
    await socialService.deleteActivity(String(req.params.id));
    return sendSuccess(res, null, "CSR activity deleted successfully");
  },

  async addCsrParticipation(req: Request, res: Response) {
    const participation = await socialService.addCsrParticipation(String(req.params.id), req.body);
    return sendSuccess(res, participation, "CSR participation recorded successfully");
  },

  async trainings(_req: Request, res: Response) {
    const rows = await socialService.trainings();
    return sendSuccess(res, rows);
  },

  async createTraining(req: Request, res: Response) {
    const training = await socialService.createTraining(req.body, req.authUser!.id);
    return sendSuccess(res, training, "Training created successfully");
  },

  async updateTraining(req: Request, res: Response) {
    const training = await socialService.updateTraining(String(req.params.id), req.body);
    return sendSuccess(res, training, "Training updated successfully");
  },

  async deleteTraining(req: Request, res: Response) {
    await socialService.deleteTraining(String(req.params.id));
    return sendSuccess(res, null, "Training deleted successfully");
  },

  async addTrainingParticipation(req: Request, res: Response) {
    const participation = await socialService.addTrainingParticipation(String(req.params.id), req.body);
    return sendSuccess(res, participation, "Training participation recorded successfully");
  }
};
