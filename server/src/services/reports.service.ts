import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import * as XLSX from "xlsx";
import { prisma as prismaClient } from "../config/prisma";
import type { CustomReportFormInput } from "../../../shared/src/schemas";

const prisma = prismaClient as any;

const toDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const dateRangeFilter = (field: string, fromDate?: string | null, toDateValue?: string | null) => {
  const from = toDate(fromDate);
  const to = toDate(toDateValue);
  return {
    ...(from || to
      ? {
          [field]: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {})
          }
        }
      : {})
  };
};

const buildEnvironmental = async (input: CustomReportFormInput) => {
  const where = {
    ...(input.departmentId ? { departmentId: input.departmentId } : {}),
    ...dateRangeFilter("transactionDate", input.fromDate, input.toDate)
  };

  const [transactions, goals, factors] = await Promise.all([
    prisma.carbonTransaction.findMany({
      where,
      orderBy: { transactionDate: "desc" },
      select: {
        id: true,
        title: true,
        activityType: true,
        transactionDate: true,
        quantity: true,
        calculatedEmissionsKg: true,
        department: { select: { name: true } }
      }
    }),
    prisma.environmentalGoal.findMany({
      where: input.departmentId ? { departmentId: input.departmentId } : {},
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        baselineEmissionsKg: true,
        targetEmissionsKg: true,
        currentEmissionsKg: true,
        department: { select: { name: true } }
      }
    }),
    prisma.emissionFactor.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, scope: true, unit: true, co2ePerUnit: true }
    })
  ]);

  const totalEmissions = transactions.reduce((sum: number, item: { calculatedEmissionsKg: number }) => sum + (item.calculatedEmissionsKg ?? 0), 0);

  return {
    title: input.title || "Environmental Report",
    reportType: input.reportType,
    summary: {
      transactionCount: transactions.length,
      totalEmissionsKg: Number(totalEmissions.toFixed(2)),
      goalCount: goals.length,
      activeGoalCount: goals.filter((goal: { status: string }) => goal.status === "ACTIVE").length,
      factorCount: factors.length
    },
    details: {
      transactions,
      goals,
      factors
    }
  };
};

const buildSocial = async (input: CustomReportFormInput) => {
  const [activities, trainings, csrParticipations, trainingParticipations] = await Promise.all([
    prisma.csrActivity.findMany({
      where: input.departmentId ? { departmentId: input.departmentId } : {},
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        startDate: true,
        department: { select: { name: true } },
        _count: { select: { participations: true } }
      }
    }),
    prisma.trainingSession.findMany({
      where: input.departmentId ? { departmentId: input.departmentId } : {},
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        trainingDate: true,
        department: { select: { name: true } },
        _count: { select: { participations: true } }
      }
    }),
    prisma.csrParticipation.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, status: true, volunteerHours: true, participationDate: true }
    }),
    prisma.trainingParticipation.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, participationStatus: true, score: true, completedAt: true }
    })
  ]);

  return {
    title: input.title || "Social Report",
    reportType: input.reportType,
    summary: {
      activityCount: activities.length,
      trainingCount: trainings.length,
      participationCount: csrParticipations.length + trainingParticipations.length,
      completedTrainings: trainingParticipations.filter((item: { participationStatus: string }) => item.participationStatus === "COMPLETED").length
    },
    details: {
      activities,
      trainings,
      csrParticipations,
      trainingParticipations
    }
  };
};

const buildGovernance = async (input: CustomReportFormInput) => {
  const [policies, audits, issues, acknowledgements] = await Promise.all([
    prisma.policy.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, status: true, category: true, effectiveDate: true }
    }),
    prisma.audit.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, status: true, auditType: true, scheduledDate: true }
    }),
    prisma.complianceIssue.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, status: true, severity: true, dueDate: true }
    }),
    prisma.policyAcknowledgement.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, acknowledgedAt: true }
    })
  ]);

  return {
    title: input.title || "Governance Report",
    reportType: input.reportType,
    summary: {
      policyCount: policies.length,
      auditCount: audits.length,
      issueCount: issues.length,
      acknowledgedCount: acknowledgements.length
    },
    details: {
      policies,
      audits,
      issues,
      acknowledgements
    }
  };
};

export const reportsService = {
  async summary() {
    const [environmental, social, governance] = await Promise.all([
      buildEnvironmental({ reportType: "ENVIRONMENTAL", sections: ["summary"] }),
      buildSocial({ reportType: "SOCIAL", sections: ["summary"] }),
      buildGovernance({ reportType: "GOVERNANCE", sections: ["summary"] })
    ]);

    return {
      environmental,
      social,
      governance,
      overall: {
        environmentalScore: environmental.summary.totalEmissionsKg ? Math.max(0, 100 - environmental.summary.totalEmissionsKg / 20) : 100,
        socialScore: social.summary.participationCount * 10,
        governanceScore: Math.max(0, 100 - governance.summary.issueCount * 10)
      }
    };
  },

  async build(input: CustomReportFormInput) {
    if (input.reportType === "ENVIRONMENTAL") return buildEnvironmental(input);
    if (input.reportType === "SOCIAL") return buildSocial(input);
    if (input.reportType === "GOVERNANCE") return buildGovernance(input);

    const [environmental, social, governance, scores] = await Promise.all([
      buildEnvironmental(input),
      buildSocial(input),
      buildGovernance(input),
      prisma.departmentScore.findMany({
        orderBy: { overallScore: "desc" },
        select: {
          department: { select: { id: true, name: true, code: true } },
          overallScore: true,
          environmentalScore: true,
          socialScore: true,
          governanceScore: true
        }
      })
    ]);

    return {
      title: input.title || "ESG Summary Report",
      reportType: input.reportType,
      summary: {
        environmental: environmental.summary,
        social: social.summary,
        governance: governance.summary,
        departmentScores: scores
      },
      details: {
        environmental: environmental.details,
        social: social.details,
        governance: governance.details
      }
    };
  },

  async export(input: CustomReportFormInput) {
    const report = await this.build(input);
    const format = input.format ?? "JSON";

    if (format === "CSV") {
      const rows = [
        ["Section", "Key", "Value"],
        ["Summary", "reportType", report.reportType],
        ["Summary", "title", report.title]
      ];
      const sheet = XLSX.utils.aoa_to_sheet(rows);
      return {
        contentType: "text/csv",
        filename: `${report.title.replace(/\s+/g, "-").toLowerCase()}.csv`,
        buffer: Buffer.from(XLSX.utils.sheet_to_csv(sheet), "utf-8")
      };
    }

    if (format === "XLSX") {
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([report.summary]), "Summary");
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([report.details]), "Details");
      const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;
      return {
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename: `${report.title.replace(/\s+/g, "-").toLowerCase()}.xlsx`,
        buffer
      };
    }

    if (format === "PDF") {
      const pdf = await PDFDocument.create();
      const page = pdf.addPage([595, 842]);
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      page.drawText(report.title, { x: 48, y: 790, size: 20, font, color: rgb(0.06, 0.09, 0.15) });
      page.drawText(`Type: ${report.reportType}`, { x: 48, y: 760, size: 12, font });
      page.drawText(`Generated: ${new Date().toLocaleString()}`, { x: 48, y: 740, size: 12, font });
      page.drawText(`Summary: ${JSON.stringify(report.summary, null, 2)}`, { x: 48, y: 700, size: 10, font, lineHeight: 12 });
      const bytes = await pdf.save();
      return {
        contentType: "application/pdf",
        filename: `${report.title.replace(/\s+/g, "-").toLowerCase()}.pdf`,
        buffer: Buffer.from(bytes)
      };
    }

    return {
      contentType: "application/json",
      filename: `${report.title.replace(/\s+/g, "-").toLowerCase()}.json`,
      buffer: Buffer.from(JSON.stringify(report, null, 2), "utf-8")
    };
  }
};
