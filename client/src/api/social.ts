import { apiRequest } from "@/lib/api";
import type {
  CsrActivityFormInput,
  CsrParticipationFormInput,
  TrainingParticipationFormInput,
  TrainingSessionFormInput
} from "@shared/schemas";

export type SocialDashboard = {
  activityCount: number;
  pendingActivities: number;
  approvedActivities: number;
  csrParticipationCount: number;
  trainingCount: number;
  trainingCompletionRate: number;
  genderCounts: Record<string, number>;
  employmentCounts: Record<string, number>;
  participationTrend: Array<{ label: string; value: number }>;
  recentActivities: Array<{
    id: string;
    title: string;
    status: string;
    startDate: string;
    department?: { id: string; code: string; name: string } | null;
    _count: { participations: number };
  }>;
  recentTrainings: Array<{
    id: string;
    title: string;
    status: string;
    trainingDate: string;
    department?: { id: string; code: string; name: string } | null;
    _count: { participations: number };
  }>;
};

export type CsrActivityRow = {
  id: string;
  title: string;
  description?: string | null;
  budgetAmount?: number | null;
  startDate: string;
  endDate?: string | null;
  status: string;
  requiresEvidence: boolean;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  department?: { id: string; code: string; name: string } | null;
  createdByUser?: { id: string; firstName: string; lastName: string; email: string } | null;
  approvedByUser?: { id: string; firstName: string; lastName: string; email: string } | null;
  _count: { participations: number };
};

export type TrainingSessionRow = {
  id: string;
  title: string;
  description?: string | null;
  trainingDate: string;
  dueDate?: string | null;
  trainerName?: string | null;
  status: string;
  isMandatory: boolean;
  department?: { id: string; code: string; name: string } | null;
  createdByUser?: { id: string; firstName: string; lastName: string; email: string } | null;
  _count: { participations: number };
};

export const socialApi = {
  dashboard: () => apiRequest<SocialDashboard>("/social/dashboard"),
  activities: () => apiRequest<CsrActivityRow[]>("/social/csr-activities"),
  createActivity: (input: CsrActivityFormInput) => apiRequest<CsrActivityRow>("/social/csr-activities", { method: "POST", body: JSON.stringify(input) }),
  updateActivity: (id: string, input: Partial<CsrActivityFormInput>) =>
    apiRequest<CsrActivityRow>(`/social/csr-activities/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  approveActivity: (id: string) => apiRequest<CsrActivityRow>(`/social/csr-activities/${id}/approve`, { method: "POST" }),
  removeActivity: (id: string) => apiRequest<null>(`/social/csr-activities/${id}`, { method: "DELETE" }),
  addCsrParticipation: (id: string, input: CsrParticipationFormInput) =>
    apiRequest(`/social/csr-activities/${id}/participations`, { method: "POST", body: JSON.stringify(input) }),
  trainings: () => apiRequest<TrainingSessionRow[]>("/social/trainings"),
  createTraining: (input: TrainingSessionFormInput) => apiRequest<TrainingSessionRow>("/social/trainings", { method: "POST", body: JSON.stringify(input) }),
  updateTraining: (id: string, input: Partial<TrainingSessionFormInput>) =>
    apiRequest<TrainingSessionRow>(`/social/trainings/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  removeTraining: (id: string) => apiRequest<null>(`/social/trainings/${id}`, { method: "DELETE" }),
  addTrainingParticipation: (id: string, input: TrainingParticipationFormInput) =>
    apiRequest(`/social/trainings/${id}/participations`, { method: "POST", body: JSON.stringify(input) })
};
