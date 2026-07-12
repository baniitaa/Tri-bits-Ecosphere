import { z } from "zod";
import {
  auditFormSchema,
  complianceIssueFormSchema,
  policyAcknowledgementFormSchema,
  policyFormSchema
} from "../../../shared/src/schemas";

export const governanceIdParamSchema = z.object({
  id: z.string().min(1)
});

export const createPolicySchema = policyFormSchema;
export const updatePolicySchema = policyFormSchema.partial();

export const createAcknowledgementSchema = policyAcknowledgementFormSchema;

export const createAuditSchema = auditFormSchema;
export const updateAuditSchema = auditFormSchema.partial();

export const createComplianceIssueSchema = complianceIssueFormSchema;
export const updateComplianceIssueSchema = complianceIssueFormSchema.partial();
