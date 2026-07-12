import type { Request, Response } from "express";
import { usersService } from "../services/users.service";
import { getPagination } from "../utils/pagination";
import { sendPaginated, sendSuccess } from "../utils/response";

export const usersController = {
  async index(req: Request, res: Response) {
    const pagination = getPagination(req.query as Record<string, unknown>);
    const { rows, total } = await usersService.list({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: typeof req.query.search === "string" ? req.query.search : undefined
    });

    return sendPaginated(res, rows, { ...pagination, total });
  },

  async store(req: Request, res: Response) {
    const user = await usersService.create(req.body);
    return sendSuccess(res, user, "User created successfully");
  },

  async update(req: Request, res: Response) {
    const user = await usersService.update(String(req.params.id), req.body);
    return sendSuccess(res, user, "User updated successfully");
  },

  async destroy(req: Request, res: Response) {
    await usersService.remove(String(req.params.id));
    return sendSuccess(res, null, "User deleted successfully");
  }
};
