import { apiRequest } from "@/lib/api";
import type {
  CarbonTransactionFormInput,
  EmissionFactorFormInput,
  EnvironmentalGoalFormInput
} from "@shared/schemas";

export type CategoryRow = {
  id: string;
  name: string;
  group: string;
  description?: string | null;
};

export type ProductRow = {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  department?: {
    id: string;
    code: string;
    name: string;
  } | null;
};

export type EmissionFactorRow = {
  id: string;
  name: string;
  scope: string;
  unit: string;
  co2ePerUnit: number;
  source?: string | null;
  isActive: boolean;
  category?: {
    id: string;
    name: string;
    group: string;
  } | null;
};

export type CarbonTransactionRow = {
  id: string;
  title: string;
  activityType: string;
  transactionDate: string;
  quantity: number;
  manualEmissionsKg?: number | null;
  calculatedEmissionsKg: number;
  notes?: string | null;
  evidenceUrl?: string | null;
  department: { id: string; code: string; name: string };
  employee?: { id: string; employeeCode: string; firstName: string; lastName: string } | null;
  product?: { id: string; sku: string; name: string } | null;
  emissionFactor?: { id: string; name: string; unit: string; co2ePerUnit: number } | null;
};

export type EnvironmentalGoalRow = {
  id: string;
  title: string;
  description?: string | null;
  baselineEmissionsKg: number;
  targetEmissionsKg: number;
  currentEmissionsKg: number;
  dueDate: string;
  status: string;
  department?: { id: string; code: string; name: string } | null;
};

export type EnvironmentalDashboard = {
  totalEmissionsKg: number;
  transactionCount: number;
  activeGoals: number;
  averageGoalProgress: number;
  activeFactors: number;
  categoriesCount: number;
  departmentRanking: Array<{
    id: string;
    code: string;
    name: string;
    environmentalScore: number;
    emissionsKg: number;
  }>;
  trend: Array<{ label: string; emissions: number }>;
  recentTransactions: CarbonTransactionRow[];
};

export const environmentalApi = {
  categories: (params = "") => apiRequest<CategoryRow[]>(`/environmental/categories${params}`),
  products: () => apiRequest<ProductRow[]>("/environmental/products"),
  factors: () => apiRequest<EmissionFactorRow[]>("/environmental/emission-factors"),
  createFactor: (input: EmissionFactorFormInput) => apiRequest<EmissionFactorRow>("/environmental/emission-factors", { method: "POST", body: JSON.stringify(input) }),
  updateFactor: (id: string, input: Partial<EmissionFactorFormInput>) =>
    apiRequest<EmissionFactorRow>(`/environmental/emission-factors/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  removeFactor: (id: string) => apiRequest<null>(`/environmental/emission-factors/${id}`, { method: "DELETE" }),
  transactions: () => apiRequest<CarbonTransactionRow[]>("/environmental/carbon-transactions"),
  createTransaction: (input: CarbonTransactionFormInput) =>
    apiRequest<CarbonTransactionRow>("/environmental/carbon-transactions", { method: "POST", body: JSON.stringify(input) }),
  updateTransaction: (id: string, input: Partial<CarbonTransactionFormInput>) =>
    apiRequest<CarbonTransactionRow>(`/environmental/carbon-transactions/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  removeTransaction: (id: string) => apiRequest<null>(`/environmental/carbon-transactions/${id}`, { method: "DELETE" }),
  goals: () => apiRequest<EnvironmentalGoalRow[]>("/environmental/goals"),
  createGoal: (input: EnvironmentalGoalFormInput) =>
    apiRequest<EnvironmentalGoalRow>("/environmental/goals", { method: "POST", body: JSON.stringify(input) }),
  updateGoal: (id: string, input: Partial<EnvironmentalGoalFormInput>) =>
    apiRequest<EnvironmentalGoalRow>(`/environmental/goals/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  removeGoal: (id: string) => apiRequest<null>(`/environmental/goals/${id}`, { method: "DELETE" }),
  dashboard: () => apiRequest<EnvironmentalDashboard>("/environmental/dashboard")
};
