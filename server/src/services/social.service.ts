import { prisma as prismaClient } from "../config/prisma";
import { AppError } from "../utils/app-error";
import type {
  CsrActivityFormInput,
  CsrParticipationFormInput,
  TrainingParticipationFormInput,
  TrainingSessionFormInput
} from "../../../shared/src/schemas";

const prisma = prismaClient as any;

const activitySelect = {
  id: true,
  title: true,
  description: true,
  budgetAmount: true,
  startDate: true,
  endDate: true,
  status: true,
  requiresEvidence: true,
  approvedAt: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
  department: {
    select: {
      id: true,
      code: true,
      name: true
    }
  },
  createdByUser: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true
    }
  },
  approvedByUser: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true
    }
  },
  _count: {
    select: {
      participations: true
    }
  }
} as const;

const trainingSelect = {
  id: true,
  title: true,
  description: true,
  trainingDate: true,
  dueDate: true,
  trainerName: true,
  status: true,
  isMandatory: true,
  createdAt: true,
  updatedAt: true,
  department: {
    select: {
      id: true,
      code: true,
      name: true
    }
  },
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
      participations: true
    }
  }
} as const;

const csrParticipationSelect = {
  id: true,
  participationDate: true,
  volunteerHours: true,
  notes: true,
  evidenceUrl: true,
  status: true,
  createdAt: true,
  updatedAt: true,
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

const trainingParticipationSelect = {
  id: true,
  participationStatus: true,
  completedAt: true,
  score: true,
  evidenceUrl: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
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

const toDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getSettings = async () => prisma.organizationSetting.findUnique({ where: { id: "default" } });

const toNumber = (value: unknown) => (typeof value === "number" ? value : Number(value ?? 0));

export const socialService = {
  async dashboard() {
    const [activities, trainings, csrParticipations, trainingParticipations, employees, recentActivities, recentTrainings] =
      await Promise.all([
        prisma.csrActivity.findMany({
          select: { status: true }
        }),
        prisma.trainingSession.findMany({
          select: { status: true }
        }),
        prisma.csrParticipation.findMany({
          select: { status: true }
        }),
        prisma.trainingParticipation.findMany({
          select: { participationStatus: true }
        }),
        prisma.employee.findMany({
          select: {
            gender: true,
            employmentType: true,
            departmentId: true,
            isActive: true
          }
        }),
        prisma.csrActivity.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: activitySelect
        }),
        prisma.trainingSession.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: trainingSelect
        })
      ]);

    const employeeRows = employees as Array<{ gender: string | null; employmentType: string | null }>;
    const trainingRows = trainingParticipations as Array<{ participationStatus: string }>;
    const activityRows = activities as Array<{ status: string }>;

    const genderCounts = employeeRows.reduce<Record<string, number>>((acc, employee) => {
      const key = employee.gender ?? "Unspecified";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const employmentCounts = employeeRows.reduce<Record<string, number>>((acc, employee) => {
      const key = employee.employmentType ?? "Unspecified";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const participationTrend = [
      {
        label: "CSR",
        value: csrParticipations.length
      },
      {
        label: "Training",
        value: trainingParticipations.length
      }
    ];

    const completedTrainingCount = trainingRows.filter((item) => item.participationStatus === "COMPLETED").length;
    const completionRate =
      trainingRows.length === 0 ? 0 : (completedTrainingCount / trainingRows.length) * 100;

    return {
      activityCount: activityRows.length,
      pendingActivities: activityRows.filter((activity) => activity.status === "PENDING_APPROVAL").length,
      approvedActivities: activityRows.filter((activity) => activity.status === "APPROVED").length,
      csrParticipationCount: csrParticipations.length,
      trainingCount: trainings.length,
      trainingCompletionRate: Number(completionRate.toFixed(1)),
      genderCounts,
      employmentCounts,
      participationTrend,
      recentActivities,
      recentTrainings
    };
  },

  async activities() {
    return prisma.csrActivity.findMany({
      orderBy: { createdAt: "desc" },
      select: activitySelect
    });
  },

  async createActivity(input: CsrActivityFormInput, userId: string) {
    const department = input.departmentId ? await prisma.department.findUnique({ where: { id: input.departmentId } }) : null;
    if (input.departmentId && !department) {
      throw new AppError("Department not found", 404, "DEPARTMENT_NOT_FOUND");
    }

    return prisma.csrActivity.create({
      data: {
        title: input.title,
        description: input.description || null,
        departmentId: input.departmentId || null,
        budgetAmount: input.budgetAmount ?? null,
        startDate: toDate(input.startDate) ?? new Date(),
        endDate: toDate(input.endDate),
        status: input.status ?? "PENDING_APPROVAL",
        requiresEvidence: input.requiresEvidence ?? true,
        createdByUserId: userId
      },
      select: activitySelect
    });
  },

  async updateActivity(id: string, input: Partial<CsrActivityFormInput>) {
    const activity = await prisma.csrActivity.findUnique({ where: { id } });
    if (!activity) {
      throw new AppError("CSR activity not found", 404, "ACTIVITY_NOT_FOUND");
    }

    if (input.departmentId) {
      const department = await prisma.department.findUnique({ where: { id: input.departmentId } });
      if (!department) {
        throw new AppError("Department not found", 404, "DEPARTMENT_NOT_FOUND");
      }
    }

    return prisma.csrActivity.update({
      where: { id },
      data: {
        ...(input.title ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description || null } : {}),
        ...(input.departmentId !== undefined ? { departmentId: input.departmentId || null } : {}),
        ...(input.budgetAmount !== undefined ? { budgetAmount: input.budgetAmount ?? null } : {}),
        ...(input.startDate ? { startDate: toDate(input.startDate) ?? new Date() } : {}),
        ...(input.endDate !== undefined ? { endDate: toDate(input.endDate) } : {}),
        ...(input.requiresEvidence !== undefined ? { requiresEvidence: input.requiresEvidence } : {}),
        ...(input.status ? { status: input.status } : {})
      },
      select: activitySelect
    });
  },

  async approveActivity(id: string, userId: string) {
    const activity = await prisma.csrActivity.findUnique({ where: { id } });
    if (!activity) {
      throw new AppError("CSR activity not found", 404, "ACTIVITY_NOT_FOUND");
    }

    return prisma.csrActivity.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedByUserId: userId,
        approvedAt: new Date(),
        rejectionReason: null
      },
      select: activitySelect
    });
  },

  async deleteActivity(id: string) {
    const activity = await prisma.csrActivity.findUnique({ where: { id } });
    if (!activity) {
      throw new AppError("CSR activity not found", 404, "ACTIVITY_NOT_FOUND");
    }

    await prisma.csrActivity.delete({ where: { id } });
  },

  async addCsrParticipation(activityId: string, input: CsrParticipationFormInput) {
    const [activity, employee, settings] = await Promise.all([
      prisma.csrActivity.findUnique({ where: { id: activityId } }),
      prisma.employee.findUnique({ where: { id: input.employeeId } }),
      getSettings()
    ]);

    if (!activity) {
      throw new AppError("CSR activity not found", 404, "ACTIVITY_NOT_FOUND");
    }

    if (!employee) {
      throw new AppError("Employee not found", 404, "EMPLOYEE_NOT_FOUND");
    }

    const needsEvidence = Boolean(settings?.evidenceRequired) || activity.requiresEvidence;
    if (needsEvidence && !input.evidenceUrl) {
      throw new AppError("Evidence is required for this participation", 400, "EVIDENCE_REQUIRED");
    }

    return prisma.csrParticipation.upsert({
      where: {
        csrActivityId_employeeId: {
          csrActivityId: activityId,
          employeeId: input.employeeId
        }
      },
      create: {
        csrActivityId: activityId,
        employeeId: input.employeeId,
        participationDate: toDate(input.participationDate) ?? new Date(),
        volunteerHours: input.volunteerHours ?? null,
        notes: input.notes || null,
        evidenceUrl: input.evidenceUrl || null,
        status: input.status ?? "ATTENDED"
      },
      update: {
        participationDate: toDate(input.participationDate) ?? new Date(),
        volunteerHours: input.volunteerHours ?? null,
        notes: input.notes || null,
        evidenceUrl: input.evidenceUrl || null,
        status: input.status ?? "ATTENDED"
      },
      select: csrParticipationSelect
    });
  },

  async trainings() {
    return prisma.trainingSession.findMany({
      orderBy: { createdAt: "desc" },
      select: trainingSelect
    });
  },

  async createTraining(input: TrainingSessionFormInput, userId: string) {
    const department = input.departmentId ? await prisma.department.findUnique({ where: { id: input.departmentId } }) : null;
    if (input.departmentId && !department) {
      throw new AppError("Department not found", 404, "DEPARTMENT_NOT_FOUND");
    }

    return prisma.trainingSession.create({
      data: {
        title: input.title,
        description: input.description || null,
        departmentId: input.departmentId || null,
        trainingDate: toDate(input.trainingDate) ?? new Date(),
        dueDate: toDate(input.dueDate),
        trainerName: input.trainerName || null,
        status: input.status ?? "PLANNED",
        isMandatory: input.isMandatory ?? false,
        createdByUserId: userId
      },
      select: trainingSelect
    });
  },

  async updateTraining(id: string, input: Partial<TrainingSessionFormInput>) {
    const training = await prisma.trainingSession.findUnique({ where: { id } });
    if (!training) {
      throw new AppError("Training session not found", 404, "TRAINING_NOT_FOUND");
    }

    if (input.departmentId) {
      const department = await prisma.department.findUnique({ where: { id: input.departmentId } });
      if (!department) {
        throw new AppError("Department not found", 404, "DEPARTMENT_NOT_FOUND");
      }
    }

    return prisma.trainingSession.update({
      where: { id },
      data: {
        ...(input.title ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description || null } : {}),
        ...(input.departmentId !== undefined ? { departmentId: input.departmentId || null } : {}),
        ...(input.trainingDate ? { trainingDate: toDate(input.trainingDate) ?? new Date() } : {}),
        ...(input.dueDate !== undefined ? { dueDate: toDate(input.dueDate) } : {}),
        ...(input.trainerName !== undefined ? { trainerName: input.trainerName || null } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.isMandatory !== undefined ? { isMandatory: input.isMandatory } : {})
      },
      select: trainingSelect
    });
  },

  async deleteTraining(id: string) {
    const training = await prisma.trainingSession.findUnique({ where: { id } });
    if (!training) {
      throw new AppError("Training session not found", 404, "TRAINING_NOT_FOUND");
    }

    await prisma.trainingSession.delete({ where: { id } });
  },

  async addTrainingParticipation(trainingSessionId: string, input: TrainingParticipationFormInput) {
    const [training, employee, settings] = await Promise.all([
      prisma.trainingSession.findUnique({ where: { id: trainingSessionId } }),
      prisma.employee.findUnique({ where: { id: input.employeeId } }),
      getSettings()
    ]);

    if (!training) {
      throw new AppError("Training session not found", 404, "TRAINING_NOT_FOUND");
    }

    if (!employee) {
      throw new AppError("Employee not found", 404, "EMPLOYEE_NOT_FOUND");
    }

    const evidenceRequired = Boolean(settings?.evidenceRequired) && input.participationStatus === "COMPLETED";
    if (evidenceRequired && !input.evidenceUrl) {
      throw new AppError("Evidence is required for completed training", 400, "EVIDENCE_REQUIRED");
    }

    return prisma.trainingParticipation.upsert({
      where: {
        trainingSessionId_employeeId: {
          trainingSessionId,
          employeeId: input.employeeId
        }
      },
      create: {
        trainingSessionId,
        employeeId: input.employeeId,
        participationStatus: input.participationStatus ?? "ENROLLED",
        completedAt: toDate(input.completedAt),
        score: input.score ?? null,
        evidenceUrl: input.evidenceUrl || null,
        notes: input.notes || null
      },
      update: {
        participationStatus: input.participationStatus ?? "ENROLLED",
        completedAt: toDate(input.completedAt),
        score: input.score ?? null,
        evidenceUrl: input.evidenceUrl || null,
        notes: input.notes || null
      },
      select: trainingParticipationSelect
    });
  }
};
