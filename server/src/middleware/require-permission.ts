import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/app-error";

export const requirePermission = (permissionKey: string) => (req: Request, _res: Response, next: NextFunction) => {
  const user = req.authUser;
  if (!user) {
    return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
  }

  if (user.role.isSystem || user.role.name === "Admin") {
    return next();
  }

  const permissions = user.role.permissions.map((item: { permission: { key: string } }) => item.permission.key);
  if (!permissions.includes(permissionKey)) {
    return next(new AppError("Forbidden", 403, "FORBIDDEN"));
  }

  next();
};
