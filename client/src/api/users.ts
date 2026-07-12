import { apiRequest } from "@/lib/api";
import type { UserFormInput } from "@shared/schemas";

export type UserRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  createdAt: string;
  role: {
    id: string;
    name: string;
  };
  employee: {
    id: string;
    employeeCode: string;
    department: {
      id: string;
      name: string;
    };
  } | null;
};

export const usersApi = {
  list: (params = "") => apiRequest<UserRow[]>(`/users${params}`),
  create: (input: UserFormInput & { password: string }) => apiRequest<UserRow>("/users", { method: "POST", body: JSON.stringify(input) }),
  update: (id: string, input: Partial<UserFormInput> & { password?: string }) =>
    apiRequest<UserRow>(`/users/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  remove: (id: string) => apiRequest<null>(`/users/${id}`, { method: "DELETE" })
};
