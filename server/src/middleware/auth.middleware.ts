import type { NextFunction, Request, Response } from "express";
import type { AuthUserPayload } from "../types/auth";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/app-error";
import { verifyJwt } from "../utils/jwt";

const permissionSelect = {
  role: {
    include: {
      permissions: {
        include: {
          permission: true
        }
      }
    }
  }
} as const;

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
  }

  try {
    const token = header.slice(7);
    const payload = verifyJwt(token);
    const user = (await prisma.user.findUnique({
      where: { id: payload.userId },
      include: permissionSelect
    })) as AuthUserPayload | null;

    if (!user || user.status !== "ACTIVE") {
      return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    }

    req.authUser = user;
    next();
  } catch {
    next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
  }
};

export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next();
  }

  try {
    const token = header.slice(7);
    const payload = verifyJwt(token);
    const user = (await prisma.user.findUnique({
      where: { id: payload.userId },
      include: permissionSelect
    })) as AuthUserPayload | null;

    if (user && user.status === "ACTIVE") {
      req.authUser = user;
    }
  } catch {
    // ignore optional auth errors
  }

  next();
};
