import { apiRequest } from "@/lib/api";
import type { EmployeeFormInput } from "@shared/schemas";

export type EmployeeRow = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle?: string | null;
  gender?: string | null;
  employmentType?: string | null;
  dateOfJoining?: string | null;
  isActive: boolean;
  department: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    email: string;
  } | null;
};

export const employeesApi = {
  list: (params = "") => apiRequest<EmployeeRow[]>(`/employees${params}`),
  create: (input: EmployeeFormInput) => apiRequest<EmployeeRow>("/employees", { method: "POST", body: JSON.stringify(input) }),
  update: (id: string, input: Partial<EmployeeFormInput>) =>
    apiRequest<EmployeeRow>(`/employees/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  remove: (id: string) => apiRequest<null>(`/employees/${id}`, { method: "DELETE" })
};
