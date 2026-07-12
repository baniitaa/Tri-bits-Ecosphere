import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const permissionKeySchema = z.string().min(3);

export const roleFormSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(255).optional().or(z.literal("")),
  permissionIds: z.array(z.string()).default([]),
  isActive: z.boolean().optional()
});

export const userFormSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  roleId: z.string().min(1),
  password: z.string().min(8).optional(),
  employeeId: z.string().optional().nullable(),
  isActive: z.boolean().optional()
});

export const departmentFormSchema = z.object({
  code: z.string().min(2).max(20),
  name: z.string().min(2).max(120),
  description: z.string().max(255).optional().or(z.literal("")),
  managerEmployeeId: z.string().optional().nullable(),
  isActive: z.boolean().optional()
});

export const employeeFormSchema = z.object({
  employeeCode: z.string().min(2).max(20),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  jobTitle: z.string().max(100).optional().or(z.literal("")),
  departmentId: z.string().min(1),
  userId: z.string().optional().nullable(),
  gender: z.enum(["Male", "Female", "Other"]).optional().nullable(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"]).optional().nullable(),
  dateOfJoining: z.string().optional().nullable(),
  isActive: z.boolean().optional()
});

export const settingsFormSchema = z.object({
  organizationName: z.string().min(2).max(120),
  legalName: z.string().max(160).optional().or(z.literal("")),
  timezone: z.string().min(1),
  currency: z.string().min(3).max(3),
  emissionCalculationEnabled: z.boolean(),
  evidenceRequired: z.boolean(),
  badgeAutoAwardEnabled: z.boolean(),
  notificationEnabled: z.boolean(),
  environmentalWeight: z.number().int().min(0).max(100),
  socialWeight: z.number().int().min(0).max(100),
  governanceWeight: z.number().int().min(0).max(100)
});

export const emissionFactorFormSchema = z.object({
  name: z.string().min(2).max(120),
  categoryId: z.string().optional().nullable(),
  scope: z.enum(["SCOPE_1", "SCOPE_2", "SCOPE_3"]),
  unit: z.string().min(1).max(40),
  co2ePerUnit: z.number().positive(),
  source: z.string().max(255).optional().or(z.literal("")),
  isActive: z.boolean().optional()
});

export const carbonTransactionFormSchema = z.object({
  title: z.string().min(2).max(120),
  activityType: z.string().min(2).max(120),
  transactionDate: z.string().min(1),
  departmentId: z.string().min(1),
  employeeId: z.string().optional().nullable(),
  productId: z.string().optional().nullable(),
  emissionFactorId: z.string().min(1),
  quantity: z.number().positive(),
  manualEmissionsKg: z.number().min(0).optional().nullable(),
  notes: z.string().max(500).optional().or(z.literal("")),
  evidenceUrl: z.string().max(255).optional().or(z.literal("")).nullable().optional()
});

export const environmentalGoalFormSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(255).optional().or(z.literal("")),
  departmentId: z.string().optional().nullable(),
  baselineEmissionsKg: z.number().min(0),
  targetEmissionsKg: z.number().min(0),
  dueDate: z.string().min(1),
  status: z.enum(["ACTIVE", "COMPLETED", "PAUSED"]).optional()
});

export const csrActivityFormSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(500).optional().or(z.literal("")),
  departmentId: z.string().optional().nullable(),
  budgetAmount: z.number().min(0).optional().nullable(),
  startDate: z.string().min(1),
  endDate: z.string().optional().nullable(),
  requiresEvidence: z.boolean().optional(),
  status: z.enum(["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED", "COMPLETED", "CANCELLED"]).optional()
});

export const csrParticipationFormSchema = z.object({
  employeeId: z.string().min(1),
  participationDate: z.string().optional(),
  volunteerHours: z.number().min(0).optional().nullable(),
  notes: z.string().max(255).optional().or(z.literal("")),
  evidenceUrl: z.string().max(255).optional().or(z.literal("")).optional(),
  status: z.enum(["ENROLLED", "ATTENDED", "COMPLETED"]).optional()
});

export const trainingSessionFormSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(500).optional().or(z.literal("")),
  departmentId: z.string().optional().nullable(),
  trainingDate: z.string().min(1),
  dueDate: z.string().optional().nullable(),
  trainerName: z.string().max(120).optional().or(z.literal("")),
  status: z.enum(["PLANNED", "ONGOING", "COMPLETED", "CANCELLED"]).optional(),
  isMandatory: z.boolean().optional()
});

export const trainingParticipationFormSchema = z.object({
  employeeId: z.string().min(1),
  participationStatus: z.enum(["ENROLLED", "ATTENDED", "COMPLETED"]).optional(),
  completedAt: z.string().optional().nullable(),
  score: z.number().min(0).max(100).optional().nullable(),
  evidenceUrl: z.string().max(255).optional().or(z.literal("")).optional(),
  notes: z.string().max(255).optional().or(z.literal(""))
});

export const policyFormSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(500).optional().or(z.literal("")),
  category: z.string().max(120).optional().or(z.literal("")),
  version: z.string().max(20).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  effectiveDate: z.string().optional().nullable(),
  reviewDate: z.string().optional().nullable()
});

export const policyAcknowledgementFormSchema = z.object({
  employeeId: z.string().min(1)
});

export const auditFormSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(500).optional().or(z.literal("")),
  auditType: z.string().min(2).max(120),
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  scheduledDate: z.string().min(1),
  completedDate: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  auditorName: z.string().max(120).optional().or(z.literal(""))
});

export const complianceIssueFormSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(500).optional().or(z.literal("")),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "OVERDUE"]).optional(),
  policyId: z.string().optional().nullable(),
  auditId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  assignedToUserId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  closureNotes: z.string().max(500).optional().or(z.literal(""))
});

export const challengeFormSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(500).optional().or(z.literal("")),
  type: z.enum(["INDIVIDUAL", "TEAM"]).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]).optional(),
  startDate: z.string().min(1),
  endDate: z.string().optional().nullable(),
  targetValue: z.number().int().min(0),
  xpReward: z.number().int().min(0),
  badgeId: z.string().optional().nullable(),
  isAutoBadge: z.boolean().optional()
});

export const challengeParticipationFormSchema = z.object({
  employeeId: z.string().min(1),
  status: z.enum(["ENROLLED", "ATTENDED", "COMPLETED"]).optional(),
  progressValue: z.number().int().min(0).optional(),
  completedAt: z.string().optional().nullable(),
  awardedXp: z.number().int().min(0).optional()
});

export const badgeFormSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional().or(z.literal("")),
  icon: z.string().max(120).optional().or(z.literal("")),
  xpThreshold: z.number().int().min(0),
  isActive: z.boolean().optional()
});

export const rewardFormSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional().or(z.literal("")),
  xpCost: z.number().int().min(0),
  isActive: z.boolean().optional()
});

export const rewardRedemptionFormSchema = z.object({
  employeeId: z.string().min(1),
  status: z.enum(["REQUESTED", "APPROVED", "FULFILLED", "REJECTED"]).optional(),
  notes: z.string().max(255).optional().or(z.literal(""))
});

export const customReportFormSchema = z.object({
  title: z.string().min(2).max(120).optional().or(z.literal("")),
  reportType: z.enum(["ESG_SUMMARY", "ENVIRONMENTAL", "SOCIAL", "GOVERNANCE"]),
  fromDate: z.string().optional().nullable(),
  toDate: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  format: z.enum(["JSON", "CSV", "XLSX", "PDF"]).optional(),
  sections: z.array(z.enum(["summary", "details", "charts"])).default(["summary"])
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RoleFormInput = z.infer<typeof roleFormSchema>;
export type UserFormInput = z.infer<typeof userFormSchema>;
export type DepartmentFormInput = z.infer<typeof departmentFormSchema>;
export type EmployeeFormInput = z.infer<typeof employeeFormSchema>;
export type SettingsFormInput = z.infer<typeof settingsFormSchema>;
export type EmissionFactorFormInput = z.infer<typeof emissionFactorFormSchema>;
export type CarbonTransactionFormInput = z.infer<typeof carbonTransactionFormSchema>;
export type EnvironmentalGoalFormInput = z.infer<typeof environmentalGoalFormSchema>;
export type CsrActivityFormInput = z.infer<typeof csrActivityFormSchema>;
export type CsrParticipationFormInput = z.infer<typeof csrParticipationFormSchema>;
export type TrainingSessionFormInput = z.infer<typeof trainingSessionFormSchema>;
export type TrainingParticipationFormInput = z.infer<typeof trainingParticipationFormSchema>;
export type PolicyFormInput = z.infer<typeof policyFormSchema>;
export type PolicyAcknowledgementFormInput = z.infer<typeof policyAcknowledgementFormSchema>;
export type AuditFormInput = z.infer<typeof auditFormSchema>;
export type ComplianceIssueFormInput = z.infer<typeof complianceIssueFormSchema>;
export type ChallengeFormInput = z.infer<typeof challengeFormSchema>;
export type ChallengeParticipationFormInput = z.infer<typeof challengeParticipationFormSchema>;
export type BadgeFormInput = z.infer<typeof badgeFormSchema>;
export type RewardFormInput = z.infer<typeof rewardFormSchema>;
export type RewardRedemptionFormInput = z.infer<typeof rewardRedemptionFormSchema>;
export type CustomReportFormInput = z.infer<typeof customReportFormSchema>;
