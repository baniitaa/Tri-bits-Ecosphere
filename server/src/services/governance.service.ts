import { prisma as prismaClient } from "../config/prisma";
import { AppError } from "../utils/app-error";
import { notificationsService } from "./notifications.service";
import type {
  AuditFormInput,
  ComplianceIssueFormInput,
  PolicyAcknowledgementFormInput,
  PolicyFormInput
} from "../../../shared/src/schemas";

const prisma = prismaClient as any;

const policySelect = {
  id: true,
  title: true,
  description: true,
  category: true,
  version: true,
  status: true,
  effectiveDate: true,
  reviewDate: true,
  createdAt: true,
  updatedAt: true,
  createdByUser: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true
    }
  },
  _count: {
    select: {
      acknowledgements: true,
      issues: true
    }
  }
} as const;

const acknowledgementSelect = {
  id: true,
  acknowledgedAt: true,
  policy: {
    select: {
      id: true,
      title: true,
      category: true
    }
  },
  employee: {
    select: {
      id: true,
      employeeCode: true,
      firstName: true,
      lastName: true,
      department: {
        select: {
          id: true,
          name: true
        }
      }
    }
  }
} as const;

const auditSelect = {
  id: true,
  title: true,
  description: true,
  auditType: true,
  status: true,
  scheduledDate: true,
  completedDate: true,
  auditorName: true,
  createdAt: true,
  updatedAt: true,
  department: {
    select: {
      id: true,
      code: true,
      name: true
    }
  },
  _count: {
    select: {
      issues: true
    }
  }
} as const;

const issueSelect = {
  id: true,
  title: true,
  description: true,
  severity: true,
  status: true,
  dueDate: true,
  closedAt: true,
  closureNotes: true,
  createdAt: true,
  updatedAt: true,
  policy: {
    select: {
      id: true,
      title: true
    }
  },
  audit: {
    select: {
      id: true,
      title: true
    }
  },
  department: {
    select: {
      id: true,
      code: true,
      name: true
    }
  },
  assignedToUser: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true
    }
  },
  raisedByUser: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true
    }
  }
} as const;

const toDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const governanceService = {
  async dashboard() {
    const [policies, acknowledgements, audits, issues, employees, recentPolicies, recentAudits, recentIssues] =
      await Promise.all([
        prisma.policy.findMany({ select: { status: true } }),
        prisma.policyAcknowledgement.findMany({ select: { id: true } }),
        prisma.audit.findMany({ select: { status: true } }),
        prisma.complianceIssue.findMany({ select: { status: true, dueDate: true } }),
        prisma.employee.findMany({ select: { id: true } }),
        prisma.policy.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: policySelect }),
        prisma.audit.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: auditSelect }),
        prisma.complianceIssue.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: issueSelect })
      ]);

    const overdueIssues = issues.filter((issue: { status: string; dueDate: Date | null }) => {
      if (!issue.dueDate) return false;
      return issue.status !== "RESOLVED" && issue.status !== "CLOSED" && new Date(issue.dueDate) < new Date();
    });

    const acknowledgedPolicyIds = new Set(acknowledgements.map((item: { id: string }) => item.id));
    const acknowledgementRate = policies.length === 0 ? 0 : (acknowledgements.length / Math.max(1, employees.length)) * 100;

    return {
      policyCount: policies.length,
      activePolicyCount: policies.filter((policy: { status: string }) => policy.status === "ACTIVE").length,
      acknowledgmentCount: acknowledgements.length,
      acknowledgmentRate: Number(acknowledgementRate.toFixed(1)),
      auditCount: audits.length,
      issueCount: issues.length,
      overdueIssueCount: overdueIssues.length,
      resolvedIssueCount: issues.filter((issue: { status: string }) => issue.status === "RESOLVED" || issue.status === "CLOSED").length,
      recentPolicies,
      recentAudits,
      recentIssues,
      acknowledgedPolicyIds: Array.from(acknowledgedPolicyIds)
    };
  },

  async policies() {
    return prisma.policy.findMany({
      orderBy: { createdAt: "desc" },
      select: policySelect
    });
  },

  async createPolicy(input: PolicyFormInput, userId: string) {
    return prisma.policy.create({
      data: {
        title: input.title,
        description: input.description || null,
        category: input.category || null,
        version: input.version || "1.0",
        status: input.status ?? "DRAFT",
        effectiveDate: toDate(input.effectiveDate),
        reviewDate: toDate(input.reviewDate),
        createdByUserId: userId
      },
      select: policySelect
    });
  },

  async updatePolicy(id: string, input: Partial<PolicyFormInput>) {
    const policy = await prisma.policy.findUnique({ where: { id } });
    if (!policy) {
      throw new AppError("Policy not found", 404, "POLICY_NOT_FOUND");
    }

    return prisma.policy.update({
      where: { id },
      data: {
        ...(input.title ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description || null } : {}),
        ...(input.category !== undefined ? { category: input.category || null } : {}),
        ...(input.version !== undefined ? { version: input.version || "1.0" } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.effectiveDate !== undefined ? { effectiveDate: toDate(input.effectiveDate) } : {}),
        ...(input.reviewDate !== undefined ? { reviewDate: toDate(input.reviewDate) } : {})
      },
      select: policySelect
    });
  },

  async deletePolicy(id: string) {
    const policy = await prisma.policy.findUnique({ where: { id } });
    if (!policy) {
      throw new AppError("Policy not found", 404, "POLICY_NOT_FOUND");
    }
    await prisma.policy.delete({ where: { id } });
  },

  async acknowledgePolicy(policyId: string, input: PolicyAcknowledgementFormInput, userId: string) {
    const [policy, employee] = await Promise.all([
      prisma.policy.findUnique({ where: { id: policyId } }),
      prisma.employee.findUnique({ where: { id: input.employeeId } })
    ]);

    if (!policy) {
      throw new AppError("Policy not found", 404, "POLICY_NOT_FOUND");
    }
    if (!employee) {
      throw new AppError("Employee not found", 404, "EMPLOYEE_NOT_FOUND");
    }

    return prisma.policyAcknowledgement.upsert({
      where: {
        policyId_employeeId: {
          policyId,
          employeeId: input.employeeId
        }
      },
      update: {
        acknowledgedAt: new Date(),
        acknowledgedByUserId: userId
      },
      create: {
        policyId,
        employeeId: input.employeeId,
        acknowledgedByUserId: userId
      },
      select: acknowledgementSelect
    });
  },

  async audits() {
    return prisma.audit.findMany({
      orderBy: { createdAt: "desc" },
      select: auditSelect
    });
  },

  async createAudit(input: AuditFormInput) {
    return prisma.audit.create({
      data: {
        title: input.title,
        description: input.description || null,
        auditType: input.auditType,
        status: input.status ?? "SCHEDULED",
        scheduledDate: toDate(input.scheduledDate) ?? new Date(),
        completedDate: toDate(input.completedDate),
        departmentId: input.departmentId || null,
        auditorName: input.auditorName || null
      },
      select: auditSelect
    });
  },

  async updateAudit(id: string, input: Partial<AuditFormInput>) {
    const audit = await prisma.audit.findUnique({ where: { id } });
    if (!audit) {
      throw new AppError("Audit not found", 404, "AUDIT_NOT_FOUND");
    }

    return prisma.audit.update({
      where: { id },
      data: {
        ...(input.title ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description || null } : {}),
        ...(input.auditType ? { auditType: input.auditType } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.scheduledDate ? { scheduledDate: toDate(input.scheduledDate) ?? new Date() } : {}),
        ...(input.completedDate !== undefined ? { completedDate: toDate(input.completedDate) } : {}),
        ...(input.departmentId !== undefined ? { departmentId: input.departmentId || null } : {}),
        ...(input.auditorName !== undefined ? { auditorName: input.auditorName || null } : {})
      },
      select: auditSelect
    });
  },

  async deleteAudit(id: string) {
    const audit = await prisma.audit.findUnique({ where: { id } });
    if (!audit) {
      throw new AppError("Audit not found", 404, "AUDIT_NOT_FOUND");
    }
    await prisma.audit.delete({ where: { id } });
  },

  async issues() {
    return prisma.complianceIssue.findMany({
      orderBy: { createdAt: "desc" },
      select: issueSelect
    });
  },

  async createIssue(input: ComplianceIssueFormInput, userId: string) {
    const created = await prisma.complianceIssue.create({
      data: {
        title: input.title,
        description: input.description || null,
        severity: input.severity ?? "MEDIUM",
        status: input.status ?? "OPEN",
        policyId: input.policyId || null,
        auditId: input.auditId || null,
        departmentId: input.departmentId || null,
        assignedToUserId: input.assignedToUserId || null,
        raisedByUserId: userId,
        dueDate: toDate(input.dueDate),
        closureNotes: input.closureNotes || null
      },
      select: issueSelect
    });

    await notificationsService.notifyPermission("governance.manage", {
      type: "COMPLIANCE_ISSUE_RAISED",
      title: `Compliance issue raised: ${input.title}`,
      message: "A new compliance issue needs review in EcoSphere.",
      link: "/governance"
    });

    return created;
  },

  async updateIssue(id: string, input: Partial<ComplianceIssueFormInput>) {
    const issue = await prisma.complianceIssue.findUnique({ where: { id } });
    if (!issue) {
      throw new AppError("Compliance issue not found", 404, "ISSUE_NOT_FOUND");
    }

    return prisma.complianceIssue.update({
      where: { id },
      data: {
        ...(input.title ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description || null } : {}),
        ...(input.severity ? { severity: input.severity } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.policyId !== undefined ? { policyId: input.policyId || null } : {}),
        ...(input.auditId !== undefined ? { auditId: input.auditId || null } : {}),
        ...(input.departmentId !== undefined ? { departmentId: input.departmentId || null } : {}),
        ...(input.assignedToUserId !== undefined ? { assignedToUserId: input.assignedToUserId || null } : {}),
        ...(input.dueDate !== undefined ? { dueDate: toDate(input.dueDate) } : {}),
        ...(input.closureNotes !== undefined ? { closureNotes: input.closureNotes || null } : {}),
        ...(input.status === "RESOLVED" || input.status === "CLOSED" ? { closedAt: new Date() } : {})
      },
      select: issueSelect
    });
  },

  async deleteIssue(id: string) {
    const issue = await prisma.complianceIssue.findUnique({ where: { id } });
    if (!issue) {
      throw new AppError("Compliance issue not found", 404, "ISSUE_NOT_FOUND");
    }
    await prisma.complianceIssue.delete({ where: { id } });
  }
};
