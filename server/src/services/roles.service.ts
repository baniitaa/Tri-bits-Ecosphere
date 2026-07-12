import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/app-error";
import { roleWithPermissionsInclude } from "./selects";
import type { RoleFormInput } from "../../../shared/src/schemas";

const permissionSelect = {
  id: true,
  key: true,
  name: true,
  module: true,
  description: true
} as const;

type PermissionRow = {
  id: string;
  key: string;
  name: string;
  module: string;
  description: string | null;
};

type RoleWithPermissions = Prisma.RoleGetPayload<{
  include: typeof roleWithPermissionsInclude.include;
}>;

const toRole = (role: RoleWithPermissions | null) => {
  if (!role) {
    return null;
  }

  return {
    ...role,
    permissions: role.permissions.map((item: { permission: PermissionRow }) => item.permission)
  };
};

export const rolesService = {
  async list() {
    const [roles, permissions] = await Promise.all([
      prisma.role.findMany({
        orderBy: { createdAt: "asc" },
        include: roleWithPermissionsInclude.include
      }),
      prisma.permission.findMany({
        select: permissionSelect,
        orderBy: [{ module: "asc" }, { name: "asc" }]
      })
    ]);

    return {
      roles: (roles as RoleWithPermissions[]).map((role) => ({
        ...role,
        permissions: role.permissions.map((item: { permission: PermissionRow }) => item.permission)
      })),
      permissions
    };
  },

  async create(input: RoleFormInput) {
    const role = await prisma.role.create({
      data: {
        name: input.name,
        description: input.description || null,
        isActive: input.isActive ?? true,
        permissions: {
          create: input.permissionIds.map((permissionId) => ({
            permissionId
          }))
        }
      },
      include: roleWithPermissionsInclude.include
    });

    return toRole(role as RoleWithPermissions);
  },

  async update(id: string, input: Partial<RoleFormInput>) {
    const existing = await prisma.role.findUnique({
      where: { id },
      include: roleWithPermissionsInclude.include
    });

    if (!existing) {
      throw new AppError("Role not found", 404, "ROLE_NOT_FOUND");
    }

    const role = await prisma.role.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description || null } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {})
      },
      include: roleWithPermissionsInclude.include
    });

    if (input.permissionIds) {
      await prisma.rolePermission.deleteMany({
        where: { roleId: id }
      });

      if (input.permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: input.permissionIds.map((permissionId) => ({
            roleId: id,
            permissionId
          }))
        });
      }
    }

    const refreshed = await prisma.role.findUnique({
      where: { id },
      include: roleWithPermissionsInclude.include
    });

    return toRole((refreshed ?? role) as RoleWithPermissions);
  },

  async remove(id: string) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        users: true
      }
    });

    if (!role) {
      throw new AppError("Role not found", 404, "ROLE_NOT_FOUND");
    }

    if (role.isSystem) {
      throw new AppError("System roles cannot be deleted", 400, "SYSTEM_ROLE");
    }

    if (role.users.length > 0) {
      throw new AppError("Role is assigned to users", 400, "ROLE_IN_USE");
    }

    await prisma.role.delete({ where: { id } });
  },

  async permissions() {
    const permissions: PermissionRow[] = await prisma.permission.findMany({
      select: permissionSelect,
      orderBy: [{ module: "asc" }, { name: "asc" }]
    });

    const grouped = permissions.reduce<Record<string, PermissionRow[]>>((acc, permission) => {
      acc[permission.module] ??= [];
      acc[permission.module].push(permission);
      return acc;
    }, {});

    return { permissions, grouped };
  },

  async updatePermissions(id: string, permissionIds: string[]) {
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new AppError("Role not found", 404, "ROLE_NOT_FOUND");
    }

    await prisma.rolePermission.deleteMany({ where: { roleId: id } });
    if (permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId: id, permissionId }))
      });
    }

    return prisma.role.findUnique({
      where: { id },
      include: roleWithPermissionsInclude.include
    }) as Promise<RoleWithPermissions | null>;
  }
};
