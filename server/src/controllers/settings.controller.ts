import type { Request, Response } from "express";
import { settingsService } from "../services/settings.service";
import { sendSuccess } from "../utils/response";

export const settingsController = {
  async show(_req: Request, res: Response) {
    const settings = await settingsService.get();
    return sendSuccess(res, settings);
  },

  async update(req: Request, res: Response) {
    const settings = await settingsService.update(req.body, req.authUser!.id);
    return sendSuccess(res, settings, "Settings updated successfully");
  }
};
