import { z } from "zod";
import { roleFormSchema } from "../../../shared/src/schemas";

export const roleIdParamSchema = z.object({
  id: z.string().min(1)
});

export const updateRolePermissionsSchema = z.object({
  permissionIds: z.array(z.string())
});

export const createRoleSchema = roleFormSchema;
export const updateRoleSchema = roleFormSchema.partial().extend({
  permissionIds: z.array(z.string()).optional()
});
