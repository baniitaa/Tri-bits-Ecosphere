import { prisma } from "../config/prisma";
import { AppError } from "../utils/app-error";
import { comparePassword } from "../utils/password";
import { signJwt } from "../utils/jwt";
import { userAuthInclude } from "./selects";
import type { AuthUserPayload } from "../types/auth";
import type { LoginInput } from "../../../shared/src/schemas";

type PermissionShape = {
  id: string;
  key: string;
  name: string;
  module: string;
  description: string | null;
};

const toSafeUser = (user: AuthUserPayload | null) => {
  if (!user) {
    return null;
  }

  const permissions = user.role.permissions.map((item: { permission: PermissionShape }) => item.permission);

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    status: user.status,
    role: {
      id: user.role.id,
      name: user.role.name,
      description: user.role.description,
      isSystem: user.role.isSystem,
      permissions
    },
    employee: user.employee
      ? {
          id: user.employee.id,
          employeeCode: user.employee.employeeCode,
          firstName: user.employee.firstName,
          lastName: user.employee.lastName,
          department: user.employee.department
        }
      : null
  };
};

export const authService = {
  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: userAuthInclude
    }) as AuthUserPayload | null;

    if (!user || user.status !== "ACTIVE") {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    const validPassword = await comparePassword(input.password, user.passwordHash);
    if (!validPassword) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    return {
      token: signJwt({ userId: user.id }),
      user: toSafeUser(user)
    };
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: userAuthInclude
    }) as AuthUserPayload | null;

    if (!user || user.status !== "ACTIVE") {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    return toSafeUser(user);
  }
};
