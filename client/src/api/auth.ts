import { apiRequest } from "@/lib/api";
import type { LoginInput } from "@shared/schemas";

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  role: {
    id: string;
    name: string;
    description?: string | null;
    isSystem: boolean;
    permissions: Array<{
      id: string;
      key: string;
      name: string;
      module: string;
    }>;
  };
  employee: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    department?: {
      id: string;
      name: string;
    };
  } | null;
};

export const authApi = {
  login: (input: LoginInput) => apiRequest<{ token: string; user: AuthUser }>("/auth/login", { method: "POST", body: JSON.stringify(input) }),
  me: async () => {
    const response = await apiRequest<AuthUser>("/auth/me");
    return response.data;
  },
  logout: () => apiRequest<null>("/auth/logout", { method: "POST" })
};
