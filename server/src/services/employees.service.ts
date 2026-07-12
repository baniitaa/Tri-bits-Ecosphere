import { prisma } from "../config/prisma";
import { AppError } from "../utils/app-error";
import { employeeListSelect } from "./selects";
import type { EmployeeFormInput } from "../../../shared/src/schemas";

const toDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const employeesService = {
  async list(query: { page: number; pageSize: number; search?: string; departmentId?: string }) {
    const where = {
      ...(query.departmentId ? { departmentId: query.departmentId } : {}),
      ...(query.search
        ? {
            OR: [
              { employeeCode: { contains: query.search, mode: "insensitive" as const } },
              { firstName: { contains: query.search, mode: "insensitive" as const } },
              { lastName: { contains: query.search, mode: "insensitive" as const } },
              { email: { contains: query.search, mode: "insensitive" as const } }
            ]
          }
        : {})
    };

    const [total, rows] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: employeeListSelect
      })
    ]);

    return { rows, total };
  },

  async create(input: EmployeeFormInput) {
    const [department, user] = await Promise.all([
      prisma.department.findUnique({ where: { id: input.departmentId } }),
      input.userId ? prisma.user.findUnique({ where: { id: input.userId } }) : Promise.resolve(null)
    ]);

    if (!department) {
      throw new AppError("Department not found", 404, "DEPARTMENT_NOT_FOUND");
    }

    if (input.userId && !user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    if (user?.employeeId) {
      throw new AppError("User is already linked to an employee", 400, "USER_IN_USE");
    }

    const employee = await prisma.employee.create({
      data: {
        employeeCode: input.employeeCode.toUpperCase(),
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email.toLowerCase(),
        jobTitle: input.jobTitle || null,
        departmentId: input.departmentId,
        gender: input.gender || null,
        employmentType: input.employmentType || null,
        dateOfJoining: toDate(input.dateOfJoining),
        isActive: input.isActive !== false
      },
      select: employeeListSelect
    });

    if (input.userId) {
      await prisma.user.update({
        where: { id: input.userId },
        data: { employeeId: employee.id }
      });
    }

    return prisma.employee.findUnique({
      where: { id: employee.id },
      select: employeeListSelect
    });
  },

  async update(id: string, input: Partial<EmployeeFormInput>) {
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      throw new AppError("Employee not found", 404, "EMPLOYEE_NOT_FOUND");
    }

    if (input.departmentId) {
      const department = await prisma.department.findUnique({ where: { id: input.departmentId } });
      if (!department) {
        throw new AppError("Department not found", 404, "DEPARTMENT_NOT_FOUND");
      }
    }

    const currentUser = await prisma.user.findFirst({
      where: { employeeId: id }
    });

    const nextUserId = input.userId !== undefined ? input.userId || null : undefined;

    if (nextUserId) {
      const user = await prisma.user.findUnique({ where: { id: nextUserId } });
      if (!user) {
        throw new AppError("User not found", 404, "USER_NOT_FOUND");
      }
      if (user.employeeId && user.employeeId !== id) {
        throw new AppError("User is already linked to another employee", 400, "USER_IN_USE");
      }
    }

    await prisma.employee.update({
      where: { id },
      data: {
        ...(input.employeeCode ? { employeeCode: input.employeeCode.toUpperCase() } : {}),
        ...(input.firstName ? { firstName: input.firstName } : {}),
        ...(input.lastName ? { lastName: input.lastName } : {}),
        ...(input.email ? { email: input.email.toLowerCase() } : {}),
        ...(input.jobTitle !== undefined ? { jobTitle: input.jobTitle || null } : {}),
        ...(input.departmentId ? { departmentId: input.departmentId } : {}),
        ...(input.gender !== undefined ? { gender: input.gender || null } : {}),
        ...(input.employmentType !== undefined ? { employmentType: input.employmentType || null } : {}),
        ...(input.dateOfJoining !== undefined ? { dateOfJoining: toDate(input.dateOfJoining) } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {})
      },
      select: employeeListSelect
    });

    if (nextUserId !== undefined) {
      if (currentUser && currentUser.id !== nextUserId) {
        await prisma.user.update({
          where: { id: currentUser.id },
          data: { employeeId: null }
        });
      }

      if (nextUserId) {
        await prisma.user.update({
          where: { id: nextUserId },
          data: { employeeId: id }
        });
      }
    }

    return prisma.employee.findUnique({
      where: { id },
      select: employeeListSelect
    });
  },

  async remove(id: string) {
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      throw new AppError("Employee not found", 404, "EMPLOYEE_NOT_FOUND");
    }

    await prisma.employee.delete({ where: { id } });
  }
};
