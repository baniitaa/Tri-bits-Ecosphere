import { Prisma } from "@prisma/client";
import { prisma as prismaClient } from "../config/prisma";
import { AppError } from "../utils/app-error";
import type {
  CarbonTransactionFormInput,
  EmissionFactorFormInput,
  EnvironmentalGoalFormInput
} from "../../../shared/src/schemas";

type EnvironmentalSetting = {
  emissionCalculationEnabled: boolean;
};

type DashboardGoal = {
  baselineEmissionsKg: number;
  targetEmissionsKg: number;
  currentEmissionsKg: number;
  status: string;
};

type DashboardDepartmentScore = {
  departmentId: string;
  environmentalScore: number;
  emissionsKg: number;
  department: {
    id: string;
    code: string;
    name: string;
  };
};

const prisma = prismaClient as any;

const factorSelect = {
  id: true,
  name: true,
  scope: true,
  unit: true,
  co2ePerUnit: true,
  source: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
      group: true
    }
  }
} as const;

const transactionSelect = {
  id: true,
  title: true,
  activityType: true,
  transactionDate: true,
  quantity: true,
  manualEmissionsKg: true,
  calculatedEmissionsKg: true,
  notes: true,
  evidenceUrl: true,
  createdAt: true,
  updatedAt: true,
  department: {
    select: {
      id: true,
      code: true,
      name: true
    }
  },
  employee: {
    select: {
      id: true,
      employeeCode: true,
      firstName: true,
      lastName: true
    }
  },
  product: {
    select: {
      id: true,
      sku: true,
      name: true
    }
  },
  emissionFactor: {
    select: {
      id: true,
      name: true,
      unit: true,
      co2ePerUnit: true
    }
  }
} as const;

const goalSelect = {
  id: true,
  title: true,
  description: true,
  baselineEmissionsKg: true,
  targetEmissionsKg: true,
  currentEmissionsKg: true,
  dueDate: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  department: {
    select: {
      id: true,
      code: true,
      name: true
    }
  }
} as const;

const categorySelect = {
  id: true,
  name: true,
  group: true,
  description: true
} as const;

const productSelect = {
  id: true,
  sku: true,
  name: true,
  description: true,
  department: {
    select: {
      id: true,
      code: true,
      name: true
    }
  }
} as const;

const departmentScoreSelect = {
  id: true,
  departmentId: true,
  environmentalScore: true,
  socialScore: true,
  governanceScore: true,
  overallScore: true,
  emissionsKg: true,
  department: {
    select: {
      id: true,
      code: true,
      name: true
    }
  }
} as const;

const monthLabel = (date: Date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit"
  });

const toDate = (value: string) => new Date(value);

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const calculateEmissions = (
  settings: EnvironmentalSetting,
  factor: { co2ePerUnit: number },
  quantity: number,
  manualEmissionsKg?: number | null
) => {
  if (!settings.emissionCalculationEnabled && manualEmissionsKg !== undefined && manualEmissionsKg !== null) {
    return manualEmissionsKg;
  }

  return Number((quantity * factor.co2ePerUnit).toFixed(3));
};

const goalProgress = (goal: { baselineEmissionsKg: number; targetEmissionsKg: number; currentEmissionsKg: number }) => {
  if (goal.baselineEmissionsKg === goal.targetEmissionsKg) {
    return goal.currentEmissionsKg <= goal.targetEmissionsKg ? 100 : 0;
  }

  const progress =
    ((goal.baselineEmissionsKg - goal.currentEmissionsKg) /
      (goal.baselineEmissionsKg - goal.targetEmissionsKg)) *
    100;

  return clamp(Number(progress.toFixed(1)), 0, 100);
};

const scoreFromEmissions = (emissionsKg: number) => clamp(Number((100 - emissionsKg / 20).toFixed(1)), 0, 100);

async function getSettings() {
  const settings = await prisma.organizationSetting.findUnique({ where: { id: "default" } });
  return {
    emissionCalculationEnabled: settings?.emissionCalculationEnabled ?? true
  };
}

async function refreshDepartmentScore(departmentId: string) {
  const [aggregate] = await Promise.all([
    prisma.carbonTransaction.aggregate({
      where: { departmentId },
      _sum: { calculatedEmissionsKg: true }
    }),
    prisma.departmentScore.upsert({
      where: { departmentId },
      update: {},
      create: {
        departmentId,
        emissionsKg: 0
      }
    })
  ]);

  const emissionsKg = aggregate._sum.calculatedEmissionsKg ?? 0;
  const environmentalScore = scoreFromEmissions(emissionsKg);
  const overallScore = environmentalScore;

  return prisma.departmentScore.upsert({
    where: { departmentId },
    update: {
      emissionsKg,
      environmentalScore,
      overallScore
    },
    create: {
      departmentId,
      emissionsKg,
      environmentalScore,
      overallScore
    },
    select: departmentScoreSelect
  });
}

async function refreshAllGoals() {
  const goals = await prisma.environmentalGoal.findMany();
  const totalOrg = await prisma.carbonTransaction.aggregate({
    _sum: { calculatedEmissionsKg: true }
  });
  const orgEmissions = totalOrg._sum.calculatedEmissionsKg ?? 0;

  for (const goal of goals) {
    const aggregate = goal.departmentId
      ? await prisma.carbonTransaction.aggregate({
          where: { departmentId: goal.departmentId },
          _sum: { calculatedEmissionsKg: true }
        })
      : totalOrg;

    const currentEmissionsKg = aggregate._sum.calculatedEmissionsKg ?? 0;
    const progress = goalProgress({
      baselineEmissionsKg: goal.baselineEmissionsKg,
      targetEmissionsKg: goal.targetEmissionsKg,
      currentEmissionsKg
    });

    await prisma.environmentalGoal.update({
      where: { id: goal.id },
      data: {
        currentEmissionsKg,
        status: currentEmissionsKg <= goal.targetEmissionsKg ? "COMPLETED" : goal.status === "PAUSED" ? "PAUSED" : "ACTIVE"
      }
    });
  }

  return orgEmissions;
}

async function refreshSnapshotsForDepartment(departmentId: string) {
  await Promise.all([refreshDepartmentScore(departmentId), refreshAllGoals()]);
}

const resolveGoalStatus = (status?: string) => {
  if (!status) return "ACTIVE";
  return status;
};

export const environmentalService = {
  async categories(query: { group?: string }) {
    const categories = await prisma.category.findMany({
      where: query.group ? { group: query.group } : undefined,
      orderBy: [{ group: "asc" }, { name: "asc" }],
      select: categorySelect
    });

    return categories;
  },

  async products() {
    return prisma.product.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: productSelect
    });
  },

  async factors() {
    return prisma.emissionFactor.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: factorSelect
    });
  },

  async createFactor(input: EmissionFactorFormInput) {
    if (input.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
      if (!category) {
        throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
      }
    }

    return prisma.emissionFactor.create({
      data: {
        name: input.name,
        categoryId: input.categoryId || null,
        scope: input.scope,
        unit: input.unit,
        co2ePerUnit: input.co2ePerUnit,
        source: input.source || null,
        isActive: input.isActive !== false
      },
      select: factorSelect
    });
  },

  async updateFactor(id: string, input: Partial<EmissionFactorFormInput>) {
    const factor = await prisma.emissionFactor.findUnique({ where: { id } });
    if (!factor) {
      throw new AppError("Emission factor not found", 404, "FACTOR_NOT_FOUND");
    }

    if (input.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
      if (!category) {
        throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
      }
    }

    return prisma.emissionFactor.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId || null } : {}),
        ...(input.scope ? { scope: input.scope } : {}),
        ...(input.unit ? { unit: input.unit } : {}),
        ...(input.co2ePerUnit !== undefined ? { co2ePerUnit: input.co2ePerUnit } : {}),
        ...(input.source !== undefined ? { source: input.source || null } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {})
      },
      select: factorSelect
    });
  },

  async deleteFactor(id: string) {
    const factor = await prisma.emissionFactor.findUnique({
      where: { id },
      include: { carbonTransactions: true }
    });

    if (!factor) {
      throw new AppError("Emission factor not found", 404, "FACTOR_NOT_FOUND");
    }

    if (factor.carbonTransactions.length > 0) {
      throw new AppError("Emission factor is in use", 400, "FACTOR_IN_USE");
    }

    await prisma.emissionFactor.delete({ where: { id } });
  },

  async transactions() {
    return prisma.carbonTransaction.findMany({
      orderBy: { transactionDate: "desc" },
      take: 50,
      select: transactionSelect
    });
  },

  async createTransaction(input: CarbonTransactionFormInput, userId: string) {
    const [department, employee, product, factor, settings] = await Promise.all([
      prisma.department.findUnique({ where: { id: input.departmentId } }),
      input.employeeId ? prisma.employee.findUnique({ where: { id: input.employeeId } }) : Promise.resolve(null),
      input.productId ? prisma.product.findUnique({ where: { id: input.productId } }) : Promise.resolve(null),
      prisma.emissionFactor.findUnique({ where: { id: input.emissionFactorId } }),
      getSettings()
    ]);

    if (!department) {
      throw new AppError("Department not found", 404, "DEPARTMENT_NOT_FOUND");
    }

    if (input.employeeId && !employee) {
      throw new AppError("Employee not found", 404, "EMPLOYEE_NOT_FOUND");
    }

    if (input.productId && !product) {
      throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
    }

    if (!factor) {
      throw new AppError("Emission factor not found", 404, "FACTOR_NOT_FOUND");
    }

    const calculatedEmissionsKg = calculateEmissions(settings, factor, input.quantity, input.manualEmissionsKg);

    const transaction = await prisma.carbonTransaction.create({
      data: {
        title: input.title,
        activityType: input.activityType,
        transactionDate: toDate(input.transactionDate),
        quantity: input.quantity,
        manualEmissionsKg: input.manualEmissionsKg ?? null,
        calculatedEmissionsKg,
        notes: input.notes || null,
        evidenceUrl: input.evidenceUrl || null,
        departmentId: input.departmentId,
        employeeId: input.employeeId || null,
        productId: input.productId || null,
        emissionFactorId: input.emissionFactorId,
        createdByUserId: userId
      },
      select: transactionSelect
    });

    await refreshSnapshotsForDepartment(department.id);

    return transaction;
  },

  async updateTransaction(id: string, input: Partial<CarbonTransactionFormInput>) {
    const existing = await prisma.carbonTransaction.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Transaction not found", 404, "TRANSACTION_NOT_FOUND");
    }

    const [department, employee, product, factor, settings] = await Promise.all([
      input.departmentId ? prisma.department.findUnique({ where: { id: input.departmentId } }) : Promise.resolve(null),
      input.employeeId ? prisma.employee.findUnique({ where: { id: input.employeeId } }) : Promise.resolve(null),
      input.productId ? prisma.product.findUnique({ where: { id: input.productId } }) : Promise.resolve(null),
      input.emissionFactorId ? prisma.emissionFactor.findUnique({ where: { id: input.emissionFactorId } }) : Promise.resolve(null),
      getSettings()
    ]);

    if (input.departmentId && !department) {
      throw new AppError("Department not found", 404, "DEPARTMENT_NOT_FOUND");
    }
    if (input.employeeId && !employee) {
      throw new AppError("Employee not found", 404, "EMPLOYEE_NOT_FOUND");
    }
    if (input.productId && !product) {
      throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
    }
    if (input.emissionFactorId && !factor) {
      throw new AppError("Emission factor not found", 404, "FACTOR_NOT_FOUND");
    }

    const nextDepartmentId = input.departmentId ?? existing.departmentId;
    const nextFactor = factor ?? (await prisma.emissionFactor.findUnique({ where: { id: existing.emissionFactorId ?? "" } }));

    const calculatedEmissionsKg =
      nextFactor && (input.quantity !== undefined || input.manualEmissionsKg !== undefined || input.emissionFactorId)
        ? calculateEmissions(
            settings,
            { co2ePerUnit: nextFactor.co2ePerUnit },
            input.quantity ?? existing.quantity,
            input.manualEmissionsKg !== undefined ? input.manualEmissionsKg : existing.manualEmissionsKg
          )
        : existing.calculatedEmissionsKg;

    const updated = await prisma.carbonTransaction.update({
      where: { id },
      data: {
        ...(input.title ? { title: input.title } : {}),
        ...(input.activityType ? { activityType: input.activityType } : {}),
        ...(input.transactionDate ? { transactionDate: toDate(input.transactionDate) } : {}),
        ...(input.quantity !== undefined ? { quantity: input.quantity } : {}),
        ...(input.manualEmissionsKg !== undefined ? { manualEmissionsKg: input.manualEmissionsKg } : {}),
        calculatedEmissionsKg,
        ...(input.notes !== undefined ? { notes: input.notes || null } : {}),
        ...(input.evidenceUrl !== undefined ? { evidenceUrl: input.evidenceUrl || null } : {}),
        ...(input.departmentId ? { departmentId: input.departmentId } : {}),
        ...(input.employeeId !== undefined ? { employeeId: input.employeeId || null } : {}),
        ...(input.productId !== undefined ? { productId: input.productId || null } : {}),
        ...(input.emissionFactorId ? { emissionFactorId: input.emissionFactorId } : {})
      },
      select: transactionSelect
    });

    await refreshSnapshotsForDepartment(nextDepartmentId);
    if (existing.departmentId !== nextDepartmentId) {
      await refreshSnapshotsForDepartment(existing.departmentId);
    }

    return updated;
  },

  async deleteTransaction(id: string) {
    const existing = await prisma.carbonTransaction.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Transaction not found", 404, "TRANSACTION_NOT_FOUND");
    }

    await prisma.carbonTransaction.delete({ where: { id } });
    await refreshSnapshotsForDepartment(existing.departmentId);
  },

  async goals() {
    return prisma.environmentalGoal.findMany({
      orderBy: { createdAt: "desc" },
      select: goalSelect
    });
  },

  async createGoal(input: EnvironmentalGoalFormInput) {
    if (input.departmentId) {
      const department = await prisma.department.findUnique({ where: { id: input.departmentId } });
      if (!department) {
        throw new AppError("Department not found", 404, "DEPARTMENT_NOT_FOUND");
      }
    }

    const total = input.departmentId
      ? await prisma.carbonTransaction.aggregate({
          where: { departmentId: input.departmentId },
          _sum: { calculatedEmissionsKg: true }
        })
      : await prisma.carbonTransaction.aggregate({
          _sum: { calculatedEmissionsKg: true }
        });

    const currentEmissionsKg = total._sum.calculatedEmissionsKg ?? 0;

    const goal = await prisma.environmentalGoal.create({
      data: {
        title: input.title,
        description: input.description || null,
        departmentId: input.departmentId || null,
        baselineEmissionsKg: input.baselineEmissionsKg,
        targetEmissionsKg: input.targetEmissionsKg,
        currentEmissionsKg,
        dueDate: toDate(input.dueDate),
        status: resolveGoalStatus(input.status)
      },
      select: goalSelect
    });

    return goal;
  },

  async updateGoal(id: string, input: Partial<EnvironmentalGoalFormInput>) {
    const goal = await prisma.environmentalGoal.findUnique({ where: { id } });
    if (!goal) {
      throw new AppError("Goal not found", 404, "GOAL_NOT_FOUND");
    }

    if (input.departmentId) {
      const department = await prisma.department.findUnique({ where: { id: input.departmentId } });
      if (!department) {
        throw new AppError("Department not found", 404, "DEPARTMENT_NOT_FOUND");
      }
    }

    return prisma.environmentalGoal.update({
      where: { id },
      data: {
        ...(input.title ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description || null } : {}),
        ...(input.departmentId !== undefined ? { departmentId: input.departmentId || null } : {}),
        ...(input.baselineEmissionsKg !== undefined ? { baselineEmissionsKg: input.baselineEmissionsKg } : {}),
        ...(input.targetEmissionsKg !== undefined ? { targetEmissionsKg: input.targetEmissionsKg } : {}),
        ...(input.dueDate ? { dueDate: toDate(input.dueDate) } : {}),
        ...(input.status ? { status: input.status } : {})
      },
      select: goalSelect
    });
  },

  async deleteGoal(id: string) {
    const goal = await prisma.environmentalGoal.findUnique({ where: { id } });
    if (!goal) {
      throw new AppError("Goal not found", 404, "GOAL_NOT_FOUND");
    }

    await prisma.environmentalGoal.delete({ where: { id } });
  },

  async dashboard() {
    const [totalEmissionsAgg, transactionCount, goals, factors, recentTransactions, departmentScores, categories] =
      await Promise.all([
        prisma.carbonTransaction.aggregate({
          _sum: { calculatedEmissionsKg: true },
          _count: true
        }),
        prisma.carbonTransaction.count(),
        prisma.environmentalGoal.findMany({
          select: {
            id: true,
            baselineEmissionsKg: true,
            targetEmissionsKg: true,
            currentEmissionsKg: true,
            status: true
          }
        }),
        prisma.emissionFactor.count({ where: { isActive: true } }),
        prisma.carbonTransaction.findMany({
          orderBy: { transactionDate: "desc" },
          take: 5,
          select: transactionSelect
        }),
        prisma.departmentScore.findMany({
          select: departmentScoreSelect,
          orderBy: { environmentalScore: "desc" }
        }),
        prisma.category.findMany({
          select: categorySelect
        })
      ]);

    const goalRows = goals as DashboardGoal[];
    const departmentScoreRows = departmentScores as DashboardDepartmentScore[];

    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      return {
        start: new Date(date.getFullYear(), date.getMonth(), 1),
        label: monthLabel(date),
        emissions: 0
      };
    });

    const rawTrend = (await prisma.$queryRaw(Prisma.sql`
      SELECT date_trunc('month', "transactionDate") AS month,
             COALESCE(SUM("calculatedEmissionsKg"), 0)::float AS emissions
      FROM "CarbonTransaction"
      WHERE "transactionDate" >= date_trunc('month', CURRENT_DATE) - interval '5 months'
      GROUP BY 1
      ORDER BY 1
    `)) as Array<{ month: Date; emissions: number }>;

    const trend = months.map((bucket) => {
      const match = rawTrend.find(
        (item: { month: Date; emissions: number }) =>
          item.month.getFullYear() === bucket.start.getFullYear() && item.month.getMonth() === bucket.start.getMonth()
      );
      return {
        label: bucket.label,
        emissions: match?.emissions ?? 0
      };
    });

    const departments = await prisma.department.findMany({
      select: {
        id: true,
        code: true,
        name: true
      },
      orderBy: { name: "asc" }
    });

    const scoreMap = new Map<string, DashboardDepartmentScore>(
      departmentScoreRows.map((score) => [score.departmentId, score])
    );
    const departmentRanking = departments
      .map((department: { id: string; code: string; name: string }) => {
        const score = scoreMap.get(department.id);
        return {
          ...department,
          environmentalScore: score?.environmentalScore ?? 0,
          emissionsKg: score?.emissionsKg ?? 0
        };
      })
      .sort(
        (a: { environmentalScore: number }, b: { environmentalScore: number }) =>
          b.environmentalScore - a.environmentalScore
      )
      .slice(0, 5);

    const activeGoals = goalRows.filter((goal) => goal.status !== "COMPLETED").length;
    const averageGoalProgress =
      goalRows.length === 0
        ? 0
        : goalRows.reduce((sum: number, goal: DashboardGoal) => sum + goalProgress(goal), 0) / goalRows.length;

    return {
      totalEmissionsKg: totalEmissionsAgg._sum.calculatedEmissionsKg ?? 0,
      transactionCount,
      activeGoals,
      averageGoalProgress: Number(averageGoalProgress.toFixed(1)),
      activeFactors: factors,
      categoriesCount: categories.length,
      departmentRanking,
      trend,
      recentTransactions
    };
  }
};
