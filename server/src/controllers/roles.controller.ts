import type { Request, Response } from "express";
import { rolesService } from "../services/roles.service";
import { sendSuccess, sendPaginated } from "../utils/response";
import { getPagination } from "../utils/pagination";

export const rolesController = {
  async index(_req: Request, res: Response) {
    const data = await rolesService.list();
    return sendSuccess(res, data);
  },

  async permissions(_req: Request, res: Response) {
    const data = await rolesService.permissions();
    return sendSuccess(res, data);
  },

  async store(req: Request, res: Response) {
    const role = await rolesService.create(req.body);
    return sendSuccess(res, role, "Role created successfully");
  },

  async update(req: Request, res: Response) {
    const role = await rolesService.update(String(req.params.id), req.body);
    return sendSuccess(res, role, "Role updated successfully");
  },

  async destroy(req: Request, res: Response) {
    await rolesService.remove(String(req.params.id));
    return sendSuccess(res, null, "Role deleted successfully");
  },

  async updatePermissions(req: Request, res: Response) {
    const role = await rolesService.updatePermissions(String(req.params.id), req.body.permissionIds);
    return sendSuccess(res, role, "Role permissions updated successfully");
  }
};
