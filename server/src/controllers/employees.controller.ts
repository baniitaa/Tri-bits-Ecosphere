import type { Request, Response } from "express";
import { employeesService } from "../services/employees.service";
import { getPagination } from "../utils/pagination";
import { sendPaginated, sendSuccess } from "../utils/response";

export const employeesController = {
  async index(req: Request, res: Response) {
    const pagination = getPagination(req.query as Record<string, unknown>);
    const { rows, total } = await employeesService.list({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      departmentId: typeof req.query.departmentId === "string" ? req.query.departmentId : undefined
    });

    return sendPaginated(res, rows, { ...pagination, total });
  },

  async store(req: Request, res: Response) {
    const employee = await employeesService.create(req.body);
    return sendSuccess(res, employee, "Employee created successfully");
  },

  async update(req: Request, res: Response) {
    const employee = await employeesService.update(String(req.params.id), req.body);
    return sendSuccess(res, employee, "Employee updated successfully");
  },

  async destroy(req: Request, res: Response) {
    await employeesService.remove(String(req.params.id));
    return sendSuccess(res, null, "Employee deleted successfully");
  }
};
