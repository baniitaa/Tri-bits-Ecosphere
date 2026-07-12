import { apiRequest } from "@/lib/api";
import type { DepartmentFormInput } from "@shared/schemas";

export type DepartmentRow = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  status: string;
  _count: {
    employees: number;
  };
  managerEmployee: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
  } | null;
};

export const departmentsApi = {
  list: (params = "") => apiRequest<DepartmentRow[]>(`/departments${params}`),
  create: (input: DepartmentFormInput) => apiRequest<DepartmentRow>("/departments", { method: "POST", body: JSON.stringify(input) }),
  update: (id: string, input: Partial<DepartmentFormInput>) =>
    apiRequest<DepartmentRow>(`/departments/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  remove: (id: string) => apiRequest<null>(`/departments/${id}`, { method: "DELETE" })
};
