import { prisma } from "../config/prisma";
import { AppError } from "../utils/app-error";
import { departmentListSelect } from "./selects";
import type { DepartmentFormInput } from "../../../shared/src/schemas";

export const departmentsService = {
  async list(query: { page: number; pageSize: number; search?: string }) {
    const where = query.search
      ? {
          OR: [
            { code: { contains: query.search, mode: "insensitive" as const } },
            { name: { contains: query.search, mode: "insensitive" as const } }
          ]
        }
      : {};

    const [total, rows] = await Promise.all([
      prisma.department.count({ where }),
      prisma.department.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: departmentListSelect
      })
    ]);

    return { rows, total };
  },

  async create(input: DepartmentFormInput) {
    if (input.managerEmployeeId) {
      const manager = await prisma.employee.findUnique({ where: { id: input.managerEmployeeId } });
      if (!manager) {
        throw new AppError("Manager employee not found", 404, "EMPLOYEE_NOT_FOUND");
      }
    }

    return prisma.department.create({
      data: {
        code: input.code.toUpperCase(),
        name: input.name,
        description: input.description || null,
        managerEmployeeId: input.managerEmployeeId || null,
        status: input.isActive === false ? "INACTIVE" : "ACTIVE"
      },
      select: departmentListSelect
    });
  },

  async update(id: string, input: Partial<DepartmentFormInput>) {
    const department = await prisma.department.findUnique({ where: { id } });
    if (!department) {
      throw new AppError("Department not found", 404, "DEPARTMENT_NOT_FOUND");
    }

    if (input.managerEmployeeId) {
      const manager = await prisma.employee.findUnique({ where: { id: input.managerEmployeeId } });
      if (!manager) {
        throw new AppError("Manager employee not found", 404, "EMPLOYEE_NOT_FOUND");
      }
    }

    return prisma.department.update({
      where: { id },
      data: {
        ...(input.code ? { code: input.code.toUpperCase() } : {}),
        ...(input.name ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description || null } : {}),
        ...(input.managerEmployeeId !== undefined ? { managerEmployeeId: input.managerEmployeeId || null } : {}),
        ...(input.isActive !== undefined ? { status: input.isActive ? "ACTIVE" : "INACTIVE" } : {})
      },
      select: departmentListSelect
    });
  },

  async remove(id: string) {
    const department = await prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { employees: true } } }
    });

    if (!department) {
      throw new AppError("Department not found", 404, "DEPARTMENT_NOT_FOUND");
    }

    if (department._count.employees > 0) {
      throw new AppError("Department has employees assigned", 400, "DEPARTMENT_IN_USE");
    }

    await prisma.department.delete({ where: { id } });
  }
};
