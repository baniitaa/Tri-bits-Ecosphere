import type { Request, Response } from "express";
import { environmentalService } from "../services/environmental.service";
import { sendSuccess } from "../utils/response";

export const environmentalController = {
  async categories(req: Request, res: Response) {
    const categories = await environmentalService.categories({
      group: typeof req.query.group === "string" ? req.query.group : undefined
    });
    return sendSuccess(res, categories);
  },

  async products(_req: Request, res: Response) {
    const products = await environmentalService.products();
    return sendSuccess(res, products);
  },

  async factors(_req: Request, res: Response) {
    const factors = await environmentalService.factors();
    return sendSuccess(res, factors);
  },

  async createFactor(req: Request, res: Response) {
    const factor = await environmentalService.createFactor(req.body);
    return sendSuccess(res, factor, "Emission factor created successfully");
  },

  async updateFactor(req: Request, res: Response) {
    const factor = await environmentalService.updateFactor(String(req.params.id), req.body);
    return sendSuccess(res, factor, "Emission factor updated successfully");
  },

  async deleteFactor(req: Request, res: Response) {
    await environmentalService.deleteFactor(String(req.params.id));
    return sendSuccess(res, null, "Emission factor deleted successfully");
  },

  async transactions(_req: Request, res: Response) {
    const transactions = await environmentalService.transactions();
    return sendSuccess(res, transactions);
  },

  async createTransaction(req: Request, res: Response) {
    const transaction = await environmentalService.createTransaction(req.body, req.authUser!.id);
    return sendSuccess(res, transaction, "Carbon transaction created successfully");
  },

  async updateTransaction(req: Request, res: Response) {
    const transaction = await environmentalService.updateTransaction(String(req.params.id), req.body);
    return sendSuccess(res, transaction, "Carbon transaction updated successfully");
  },

  async deleteTransaction(req: Request, res: Response) {
    await environmentalService.deleteTransaction(String(req.params.id));
    return sendSuccess(res, null, "Carbon transaction deleted successfully");
  },

  async goals(_req: Request, res: Response) {
    const goals = await environmentalService.goals();
    return sendSuccess(res, goals);
  },

  async createGoal(req: Request, res: Response) {
    const goal = await environmentalService.createGoal(req.body);
    return sendSuccess(res, goal, "Environmental goal created successfully");
  },

  async updateGoal(req: Request, res: Response) {
    const goal = await environmentalService.updateGoal(String(req.params.id), req.body);
    return sendSuccess(res, goal, "Environmental goal updated successfully");
  },

  async deleteGoal(req: Request, res: Response) {
    await environmentalService.deleteGoal(String(req.params.id));
    return sendSuccess(res, null, "Environmental goal deleted successfully");
  },

  async dashboard(_req: Request, res: Response) {
    const data = await environmentalService.dashboard();
    return sendSuccess(res, data);
  }
};
