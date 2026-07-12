import type { Request, Response } from "express";
import { departmentsService } from "../services/departments.service";
import { getPagination } from "../utils/pagination";
import { sendPaginated, sendSuccess } from "../utils/response";

export const departmentsController = {
  async index(req: Request, res: Response) {
    const pagination = getPagination(req.query as Record<string, unknown>);
    const { rows, total } = await departmentsService.list({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: typeof req.query.search === "string" ? req.query.search : undefined
    });

    return sendPaginated(res, rows, { ...pagination, total });
  },

  async store(req: Request, res: Response) {
    const department = await departmentsService.create(req.body);
    return sendSuccess(res, department, "Department created successfully");
  },

  async update(req: Request, res: Response) {
    const department = await departmentsService.update(String(req.params.id), req.body);
    return sendSuccess(res, department, "Department updated successfully");
  },

  async destroy(req: Request, res: Response) {
    await departmentsService.remove(String(req.params.id));
    return sendSuccess(res, null, "Department deleted successfully");
  }
};
