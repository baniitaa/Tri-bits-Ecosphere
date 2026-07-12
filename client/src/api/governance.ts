import { apiRequest } from "@/lib/api";
import type {
  AuditFormInput,
  ComplianceIssueFormInput,
  PolicyAcknowledgementFormInput,
  PolicyFormInput
} from "@shared/schemas";

export type GovernanceDashboard = {
  policyCount: number;
  activePolicyCount: number;
  acknowledgmentCount: number;
  acknowledgmentRate: number;
  auditCount: number;
  issueCount: number;
  overdueIssueCount: number;
  resolvedIssueCount: number;
  recentPolicies: Array<any>;
  recentAudits: Array<any>;
  recentIssues: Array<any>;
};

export type PolicyRow = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  version: string;
  status: string;
  effectiveDate?: string | null;
  reviewDate?: string | null;
  createdByUser?: { id: string; firstName: string; lastName: string; email: string } | null;
  _count: { acknowledgements: number; issues: number };
};

export type AuditRow = {
  id: string;
  title: string;
  description?: string | null;
  auditType: string;
  status: string;
  scheduledDate: string;
  completedDate?: string | null;
  auditorName?: string | null;
  department?: { id: string; code: string; name: string } | null;
  _count: { issues: number };
};

export type ComplianceIssueRow = {
  id: string;
  title: string;
  description?: string | null;
  severity: string;
  status: string;
  dueDate?: string | null;
  closedAt?: string | null;
  closureNotes?: string | null;
  policy?: { id: string; title: string } | null;
  audit?: { id: string; title: string } | null;
  department?: { id: string; code: string; name: string } | null;
  assignedToUser?: { id: string; firstName: string; lastName: string; email: string } | null;
  raisedByUser?: { id: string; firstName: string; lastName: string; email: string } | null;
};

export const governanceApi = {
  dashboard: () => apiRequest<GovernanceDashboard>("/governance/dashboard"),
  policies: () => apiRequest<PolicyRow[]>("/governance/policies"),
  createPolicy: (input: PolicyFormInput) => apiRequest<PolicyRow>("/governance/policies", { method: "POST", body: JSON.stringify(input) }),
  updatePolicy: (id: string, input: Partial<PolicyFormInput>) =>
    apiRequest<PolicyRow>(`/governance/policies/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  deletePolicy: (id: string) => apiRequest<null>(`/governance/policies/${id}`, { method: "DELETE" }),
  acknowledgePolicy: (id: string, input: PolicyAcknowledgementFormInput) =>
    apiRequest(`/governance/policies/${id}/acknowledgements`, { method: "POST", body: JSON.stringify(input) }),
  audits: () => apiRequest<AuditRow[]>("/governance/audits"),
  createAudit: (input: AuditFormInput) => apiRequest<AuditRow>("/governance/audits", { method: "POST", body: JSON.stringify(input) }),
  updateAudit: (id: string, input: Partial<AuditFormInput>) =>
    apiRequest<AuditRow>(`/governance/audits/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  deleteAudit: (id: string) => apiRequest<null>(`/governance/audits/${id}`, { method: "DELETE" }),
  issues: () => apiRequest<ComplianceIssueRow[]>("/governance/issues"),
  createIssue: (input: ComplianceIssueFormInput) => apiRequest<ComplianceIssueRow>("/governance/issues", { method: "POST", body: JSON.stringify(input) }),
  updateIssue: (id: string, input: Partial<ComplianceIssueFormInput>) =>
    apiRequest<ComplianceIssueRow>(`/governance/issues/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  deleteIssue: (id: string) => apiRequest<null>(`/governance/issues/${id}`, { method: "DELETE" })
};
