import type { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { sendSuccess } from "../utils/response";

export const authController = {
  async login(req: Request, res: Response) {
    const result = await authService.login(req.body);
    return sendSuccess(res, result, "Logged in successfully");
  },

  async me(req: Request, res: Response) {
    const user = await authService.me(req.authUser!.id);
    return sendSuccess(res, user);
  },

  async logout(_req: Request, res: Response) {
    return sendSuccess(res, null, "Logged out successfully");
  }
};
