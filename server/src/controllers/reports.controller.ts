import type { Request, Response } from "express";
import { reportsService } from "../services/reports.service";
import { sendSuccess } from "../utils/response";

export const reportsController = {
  async summary(_req: Request, res: Response) {
    return sendSuccess(res, await reportsService.summary());
  },

  async build(req: Request, res: Response) {
    return sendSuccess(res, await reportsService.build(req.body));
  },

  async export(req: Request, res: Response) {
    const file = await reportsService.export(req.body);
    res.setHeader("Content-Type", file.contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
    return res.send(file.buffer);
  }
};
