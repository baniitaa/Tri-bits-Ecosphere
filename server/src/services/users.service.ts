import { prisma } from "../config/prisma";
import { AppError } from "../utils/app-error";
import { hashPassword } from "../utils/password";
import { userListSelect } from "./selects";
import type { UserFormInput } from "../../../shared/src/schemas";

export const usersService = {
  async list(query: { page: number; pageSize: number; search?: string }) {
    const where = query.search
      ? {
          OR: [
            { email: { contains: query.search, mode: "insensitive" as const } },
            { firstName: { contains: query.search, mode: "insensitive" as const } },
            { lastName: { contains: query.search, mode: "insensitive" as const } }
          ]
        }
      : {};

    const [total, rows] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: userListSelect
      })
    ]);

    return { rows, total };
  },

  async create(input: UserFormInput & { password: string }) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() }
    });

    if (existing) {
      throw new AppError("Email already exists", 400, "DUPLICATE_EMAIL");
    }

    const role = await prisma.role.findUnique({ where: { id: input.roleId } });
    if (!role) {
      throw new AppError("Role not found", 404, "ROLE_NOT_FOUND");
    }

    const passwordHash = await hashPassword(input.password);

    return prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        firstName: input.firstName,
        lastName: input.lastName,
        passwordHash,
        roleId: input.roleId,
        employeeId: input.employeeId || null,
        status: input.isActive === false ? "INACTIVE" : "ACTIVE"
      },
      select: userListSelect
    });
  },

  async update(id: string, input: Partial<UserFormInput> & { password?: string }) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    if (input.roleId) {
      const role = await prisma.role.findUnique({ where: { id: input.roleId } });
      if (!role) {
        throw new AppError("Role not found", 404, "ROLE_NOT_FOUND");
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(input.email ? { email: input.email.toLowerCase() } : {}),
        ...(input.firstName ? { firstName: input.firstName } : {}),
        ...(input.lastName ? { lastName: input.lastName } : {}),
        ...(input.roleId ? { roleId: input.roleId } : {}),
        ...(input.employeeId !== undefined ? { employeeId: input.employeeId || null } : {}),
        ...(input.isActive !== undefined ? { status: input.isActive ? "ACTIVE" : "INACTIVE" } : {}),
        ...(input.password ? { passwordHash: await hashPassword(input.password) } : {})
      },
      select: userListSelect
    });

    return updated;
  },

  async remove(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    await prisma.user.delete({ where: { id } });
  }
};
