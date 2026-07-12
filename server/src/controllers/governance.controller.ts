import type { Request, Response } from "express";
import { governanceService } from "../services/governance.service";
import { sendSuccess } from "../utils/response";

export const governanceController = {
  async dashboard(_req: Request, res: Response) {
    return sendSuccess(res, await governanceService.dashboard());
  },

  async policies(_req: Request, res: Response) {
    return sendSuccess(res, await governanceService.policies());
  },

  async createPolicy(req: Request, res: Response) {
    return sendSuccess(res, await governanceService.createPolicy(req.body, req.authUser!.id), "Policy created successfully");
  },

  async updatePolicy(req: Request, res: Response) {
    return sendSuccess(res, await governanceService.updatePolicy(String(req.params.id), req.body), "Policy updated successfully");
  },

  async deletePolicy(req: Request, res: Response) {
    await governanceService.deletePolicy(String(req.params.id));
    return sendSuccess(res, null, "Policy deleted successfully");
  },

  async acknowledgePolicy(req: Request, res: Response) {
    return sendSuccess(
      res,
      await governanceService.acknowledgePolicy(String(req.params.id), req.body, req.authUser!.id),
      "Policy acknowledged successfully"
    );
  },

  async audits(_req: Request, res: Response) {
    return sendSuccess(res, await governanceService.audits());
  },

  async createAudit(req: Request, res: Response) {
    return sendSuccess(res, await governanceService.createAudit(req.body), "Audit created successfully");
  },

  async updateAudit(req: Request, res: Response) {
    return sendSuccess(res, await governanceService.updateAudit(String(req.params.id), req.body), "Audit updated successfully");
  },

  async deleteAudit(req: Request, res: Response) {
    await governanceService.deleteAudit(String(req.params.id));
    return sendSuccess(res, null, "Audit deleted successfully");
  },

  async issues(_req: Request, res: Response) {
    return sendSuccess(res, await governanceService.issues());
  },

  async createIssue(req: Request, res: Response) {
    return sendSuccess(res, await governanceService.createIssue(req.body, req.authUser!.id), "Compliance issue created successfully");
  },

  async updateIssue(req: Request, res: Response) {
    return sendSuccess(res, await governanceService.updateIssue(String(req.params.id), req.body), "Compliance issue updated successfully");
  },

  async deleteIssue(req: Request, res: Response) {
    await governanceService.deleteIssue(String(req.params.id));
    return sendSuccess(res, null, "Compliance issue deleted successfully");
  }
};
