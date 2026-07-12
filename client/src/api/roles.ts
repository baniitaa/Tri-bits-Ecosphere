import { apiRequest } from "@/lib/api";
import type { RoleFormInput } from "@shared/schemas";

export type Permission = {
  id: string;
  key: string;
  name: string;
  module: string;
};

export type RoleRow = {
  id: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  isActive: boolean;
  permissions: Permission[];
};

export const rolesApi = {
  list: () => apiRequest<{ roles: RoleRow[]; permissions: Permission[] }>("/roles"),
  permissions: () => apiRequest<{ permissions: Permission[]; grouped: Record<string, Permission[]> }>("/roles/permissions"),
  create: (input: RoleFormInput) => apiRequest<RoleRow>("/roles", { method: "POST", body: JSON.stringify(input) }),
  update: (id: string, input: Partial<RoleFormInput>) => apiRequest<RoleRow>(`/roles/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  updatePermissions: (id: string, permissionIds: string[]) =>
    apiRequest<RoleRow>(`/roles/${id}/permissions`, { method: "PUT", body: JSON.stringify({ permissionIds }) }),
  remove: (id: string) => apiRequest<null>(`/roles/${id}`, { method: "DELETE" })
};
