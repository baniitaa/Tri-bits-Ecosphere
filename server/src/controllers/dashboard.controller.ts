import type { Request, Response } from "express";
import { dashboardService } from "../services/dashboard.service";
import { sendSuccess } from "../utils/response";

export const dashboardController = {
  async overview(_req: Request, res: Response) {
    const data = await dashboardService.overview();
    return sendSuccess(res, data);
  }
};
