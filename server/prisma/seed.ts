import "dotenv/config";
import { prisma } from "../src/config/prisma";
import { hashPassword } from "../src/utils/password";
import { DEFAULT_ROLE_NAMES, DEFAULT_SETTINGS, PERMISSION_DEFINITIONS } from "../../shared/src/constants";
import { environmentalService } from "../src/services/environmental.service";

async function main() {
  for (const permission of PERMISSION_DEFINITIONS) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: {
        name: permission.name,
        module: permission.module
      },
      create: {
        key: permission.key,
        name: permission.name,
        module: permission.module
      }
    });
  }

  const permissions = await prisma.permission.findMany();
  const permissionIds = permissions.map((permission) => permission.id);

  const roleMap = new Map<string, string>();
  for (const roleName of DEFAULT_ROLE_NAMES) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {
        isSystem: true,
        isActive: true
      },
      create: {
        name: roleName,
        description: `${roleName} role`,
        isSystem: true,
        isActive: true
      }
    });

    roleMap.set(roleName, role.id);
  }

  const adminRoleId = roleMap.get("Admin");
  const esgManagerRoleId = roleMap.get("ESG Manager");
  const deptManagerRoleId = roleMap.get("Department Manager");
  const employeeRoleId = roleMap.get("Employee");

  if (adminRoleId) {
    await prisma.rolePermission.deleteMany({ where: { roleId: adminRoleId } });
    await prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({ roleId: adminRoleId, permissionId }))
    });
  }

  const managerPermissions = permissions.filter((permission) =>
    [
      "dashboard.view",
      "departments.manage",
      "employees.manage",
      "environmental.manage",
      "social.manage",
      "governance.manage",
      "gamification.manage",
      "reports.manage"
    ].includes(permission.key)
  );

  if (esgManagerRoleId) {
    await prisma.rolePermission.deleteMany({ where: { roleId: esgManagerRoleId } });
    await prisma.rolePermission.createMany({
      data: managerPermissions.map((permission) => ({ roleId: esgManagerRoleId!, permissionId: permission.id }))
    });
  }

  if (deptManagerRoleId) {
    await prisma.rolePermission.deleteMany({ where: { roleId: deptManagerRoleId } });
    await prisma.rolePermission.createMany({
      data: permissions
        .filter((permission) =>
          ["dashboard.view", "departments.manage", "employees.manage", "reports.manage"].includes(permission.key)
        )
        .map((permission) => ({ roleId: deptManagerRoleId!, permissionId: permission.id }))
    });
  }

  if (employeeRoleId) {
    await prisma.rolePermission.deleteMany({ where: { roleId: employeeRoleId } });
    await prisma.rolePermission.createMany({
      data: permissions
        .filter((permission) => ["dashboard.view", "reports.manage"].includes(permission.key))
        .map((permission) => ({ roleId: employeeRoleId!, permissionId: permission.id }))
    });
  }

  const adminPasswordHash = await hashPassword("Admin@12345");

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@ecosphere.local" },
    update: {
      firstName: "System",
      lastName: "Admin",
      roleId: adminRoleId!,
      passwordHash: adminPasswordHash,
      status: "ACTIVE"
    },
    create: {
      email: "admin@ecosphere.local",
      firstName: "System",
      lastName: "Admin",
      roleId: adminRoleId!,
      passwordHash: adminPasswordHash,
      status: "ACTIVE"
    }
  });

  const engineering = await prisma.department.upsert({
    where: { code: "ENG" },
    update: {
      name: "Engineering",
      status: "ACTIVE"
    },
    create: {
      code: "ENG",
      name: "Engineering",
      description: "Product and platform engineering",
      status: "ACTIVE"
    }
  });

  const operations = await prisma.department.upsert({
    where: { code: "OPS" },
    update: {
      name: "Operations",
      status: "ACTIVE"
    },
    create: {
      code: "OPS",
      name: "Operations",
      description: "Corporate operations",
      status: "ACTIVE"
    }
  });

  const employeePasswordHash = await hashPassword("Employee@12345");

  const john = await prisma.employee.upsert({
    where: { employeeCode: "EMP-001" },
    update: {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@ecosphere.local",
      departmentId: engineering.id,
      jobTitle: "Sustainability Analyst",
      isActive: true
    },
    create: {
      employeeCode: "EMP-001",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@ecosphere.local",
      departmentId: engineering.id,
      jobTitle: "Sustainability Analyst",
      isActive: true
    }
  });

  const jane = await prisma.employee.upsert({
    where: { employeeCode: "EMP-002" },
    update: {
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@ecosphere.local",
      departmentId: operations.id,
      jobTitle: "Operations Manager",
      isActive: true
    },
    create: {
      employeeCode: "EMP-002",
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@ecosphere.local",
      departmentId: operations.id,
      jobTitle: "Operations Manager",
      isActive: true
    }
  });

  await prisma.user.upsert({
    where: { email: "esg.manager@ecosphere.local" },
    update: {
      firstName: "Maya",
      lastName: "Patel",
      roleId: esgManagerRoleId!,
      passwordHash: employeePasswordHash,
      employeeId: john.id,
      status: "ACTIVE"
    },
    create: {
      email: "esg.manager@ecosphere.local",
      firstName: "Maya",
      lastName: "Patel",
      roleId: esgManagerRoleId!,
      passwordHash: employeePasswordHash,
      employeeId: john.id,
      status: "ACTIVE"
    }
  });

  await prisma.user.upsert({
    where: { email: "dept.manager@ecosphere.local" },
    update: {
      firstName: "Aman",
      lastName: "Rao",
      roleId: deptManagerRoleId!,
      passwordHash: employeePasswordHash,
      employeeId: jane.id,
      status: "ACTIVE"
    },
    create: {
      email: "dept.manager@ecosphere.local",
      firstName: "Aman",
      lastName: "Rao",
      roleId: deptManagerRoleId!,
      passwordHash: employeePasswordHash,
      employeeId: jane.id,
      status: "ACTIVE"
    }
  });

  await prisma.organizationSetting.upsert({
    where: { id: "default" },
    update: {
      ...DEFAULT_SETTINGS,
      updatedByUserId: null
    },
    create: {
      id: "default",
      ...DEFAULT_SETTINGS
    }
  });

  const environmentalCategories = await Promise.all([
    prisma.category.upsert({
      where: { name: "Electricity" },
      update: {
        group: "ENVIRONMENTAL",
        description: "Electricity-based emission factors"
      },
      create: {
        name: "Electricity",
        group: "ENVIRONMENTAL",
        description: "Electricity-based emission factors"
      }
    }),
    prisma.category.upsert({
      where: { name: "Fuel" },
      update: {
        group: "ENVIRONMENTAL",
        description: "Fuel and combustion related emissions"
      },
      create: {
        name: "Fuel",
        group: "ENVIRONMENTAL",
        description: "Fuel and combustion related emissions"
      }
    }),
    prisma.category.upsert({
      where: { name: "Travel" },
      update: {
        group: "ENVIRONMENTAL",
        description: "Travel and logistics emissions"
      },
      create: {
        name: "Travel",
        group: "ENVIRONMENTAL",
        description: "Travel and logistics emissions"
      }
    })
  ]);

  const [electricityCategory, fuelCategory, travelCategory] = environmentalCategories;

  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: "PROD-001" },
      update: {
        name: "EcoSphere Laptop",
        description: "Standard employee laptop",
        departmentId: engineering.id
      },
      create: {
        sku: "PROD-001",
        name: "EcoSphere Laptop",
        description: "Standard employee laptop",
        departmentId: engineering.id
      }
    }),
    prisma.product.upsert({
      where: { sku: "PROD-002" },
      update: {
        name: "Fleet Vehicle Service",
        description: "Operations fleet servicing",
        departmentId: operations.id
      },
      create: {
        sku: "PROD-002",
        name: "Fleet Vehicle Service",
        description: "Operations fleet servicing",
        departmentId: operations.id
      }
    })
  ]);

  const [laptopProduct, fleetProduct] = products;

  const electricityFactor = await environmentalService.createFactor({
    name: "Grid Electricity",
    categoryId: electricityCategory.id,
    scope: "SCOPE_2",
    unit: "kWh",
    co2ePerUnit: 0.82,
    source: "Demo factor",
    isActive: true
  });

  const dieselFactor = await environmentalService.createFactor({
    name: "Diesel Combustion",
    categoryId: fuelCategory.id,
    scope: "SCOPE_1",
    unit: "litre",
    co2ePerUnit: 2.68,
    source: "Demo factor",
    isActive: true
  });

  const travelFactor = await environmentalService.createFactor({
    name: "Air Travel",
    categoryId: travelCategory.id,
    scope: "SCOPE_3",
    unit: "km",
    co2ePerUnit: 0.18,
    source: "Demo factor",
    isActive: true
  });

  await environmentalService.createTransaction(
    {
      title: "Office Electricity - June",
      activityType: "Electricity Consumption",
      transactionDate: new Date().toISOString(),
      departmentId: engineering.id,
      employeeId: john.id,
      productId: laptopProduct.id,
      emissionFactorId: electricityFactor.id,
      quantity: 420,
      manualEmissionsKg: null,
      notes: "Monthly electricity usage",
      evidenceUrl: ""
    },
    adminUser.id
  );

  await environmentalService.createTransaction(
    {
      title: "Fleet Fuel - June",
      activityType: "Fuel Consumption",
      transactionDate: new Date().toISOString(),
      departmentId: operations.id,
      employeeId: jane.id,
      productId: fleetProduct.id,
      emissionFactorId: dieselFactor.id,
      quantity: 180,
      manualEmissionsKg: null,
      notes: "Fleet refueling data",
      evidenceUrl: ""
    },
    adminUser.id
  );

  await environmentalService.createTransaction(
    {
      title: "Client Visit Travel",
      activityType: "Business Travel",
      transactionDate: new Date().toISOString(),
      departmentId: engineering.id,
      employeeId: john.id,
      productId: "",
      emissionFactorId: travelFactor.id,
      quantity: 1200,
      manualEmissionsKg: null,
      notes: "Demo travel emission",
      evidenceUrl: ""
    },
    adminUser.id
  );

  await environmentalService.createGoal({
    title: "Reduce engineering emissions by 15%",
    description: "Engineering department reduction target for the current cycle",
    departmentId: engineering.id,
    baselineEmissionsKg: 1200,
    targetEmissionsKg: 1020,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString(),
    status: "ACTIVE"
  });

  await environmentalService.createGoal({
    title: "Organization emissions below 2,000 kg",
    description: "Overall organization carbon target",
    departmentId: null,
    baselineEmissionsKg: 2600,
    targetEmissionsKg: 2000,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 240).toISOString(),
    status: "ACTIVE"
  });

  const csrActivity = await prisma.csrActivity.create({
    data: {
      title: "Community clean-up drive",
      description: "City park clean-up with volunteer hours tracked in-app",
      departmentId: operations.id,
      budgetAmount: 25000,
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
      endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 13),
      status: "APPROVED",
      requiresEvidence: true,
      createdByUserId: adminUser.id,
      approvedByUserId: adminUser.id,
      approvedAt: new Date()
    }
  });

  await prisma.csrParticipation.createMany({
    data: [
      {
        csrActivityId: csrActivity.id,
        employeeId: john.id,
        participationDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
        volunteerHours: 4,
        notes: "Park clean-up shift",
        evidenceUrl: "https://example.com/evidence/csr-john"
      },
      {
        csrActivityId: csrActivity.id,
        employeeId: jane.id,
        participationDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
        volunteerHours: 5,
        notes: "Litter collection and sorting",
        evidenceUrl: "https://example.com/evidence/csr-jane"
      }
    ]
  });

  const trainingSession = await prisma.trainingSession.create({
    data: {
      title: "ESG awareness onboarding",
      description: "Baseline training for sustainability practices and policy acknowledgements",
      departmentId: engineering.id,
      trainingDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21),
      trainerName: "Maya Patel",
      status: "ONGOING",
      isMandatory: true,
      createdByUserId: adminUser.id
    }
  });

  await prisma.trainingParticipation.createMany({
    data: [
      {
        trainingSessionId: trainingSession.id,
        employeeId: john.id,
        participationStatus: "COMPLETED",
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
        score: 92,
        evidenceUrl: "https://example.com/evidence/training-john",
        notes: "Completed with distinction"
      },
      {
        trainingSessionId: trainingSession.id,
        employeeId: jane.id,
        participationStatus: "ATTENDED",
        completedAt: null,
        score: null,
        evidenceUrl: null,
        notes: "Attended live session"
      }
    ]
  });

  const policy = await prisma.policy.create({
    data: {
      title: "Code of Conduct",
      description: "Baseline governance and ethics policy for all employees.",
      category: "Governance",
      version: "1.0",
      status: "ACTIVE",
      effectiveDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      reviewDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180),
      departmentId: operations.id,
      createdByUserId: adminUser.id
    }
  });

  await prisma.policyAcknowledgement.createMany({
    data: [
      {
        policyId: policy.id,
        employeeId: john.id,
        acknowledgedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
        acknowledgedByUserId: adminUser.id
      },
      {
        policyId: policy.id,
        employeeId: jane.id,
        acknowledgedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
        acknowledgedByUserId: adminUser.id
      }
    ]
  });

  await prisma.audit.create({
    data: {
      title: "Quarterly governance review",
      description: "Internal governance spot-check",
      auditType: "Internal",
      status: "COMPLETED",
      scheduledDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
      completedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9),
      departmentId: operations.id,
      auditorName: "Internal Control Team"
    }
  });

  await prisma.complianceIssue.create({
    data: {
      title: "Missing supplier evidence",
      description: "Procurement file lacks updated supplier declaration.",
      severity: "HIGH",
      status: "OPEN",
      departmentId: operations.id,
      assignedToUserId: adminUser.id,
      raisedByUserId: adminUser.id,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14)
    }
  });

  const badge = await prisma.badge.create({
    data: {
      name: "Volunteer Star",
      description: "Awarded for active community participation",
      icon: "star",
      xpThreshold: 50,
      isActive: true
    }
  });

  const challenge = await prisma.challenge.create({
    data: {
      title: "Finish ESG onboarding",
      description: "Complete the ESG and governance onboarding sequence",
      type: "INDIVIDUAL",
      status: "ACTIVE",
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21),
      targetValue: 1,
      xpReward: 40,
      badgeId: badge.id,
      isAutoBadge: true
    }
  });

  await prisma.challengeParticipation.create({
    data: {
      challengeId: challenge.id,
      employeeId: john.id,
      status: "COMPLETED",
      progressValue: 1,
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      awardedXp: 40
    }
  });

  await prisma.employee.update({
    where: { id: john.id },
    data: {
      xpPoints: {
        increment: 40
      }
    }
  });

  const reward = await prisma.reward.create({
    data: {
      name: "Coffee voucher",
      description: "Redeemable cafeteria voucher",
      xpCost: 20,
      isActive: true
    }
  });

  await prisma.rewardRedemption.create({
    data: {
      rewardId: reward.id,
      employeeId: john.id,
      status: "FULFILLED",
      fulfilledAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      notes: "Redeemed after challenge completion"
    }
  });

  await prisma.employee.update({
    where: { id: john.id },
    data: {
      xpPoints: {
        decrement: 20
      }
    }
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: adminUser.id,
        type: "COMPLIANCE_ISSUE_RAISED",
        title: "Compliance issue raised",
        message: "A supplier evidence issue needs review."
      },
      {
        userId: adminUser.id,
        type: "BADGE_UNLOCKED",
        title: "Badge unlocked",
        message: "John Doe unlocked Volunteer Star."
      }
    ]
  });

  console.log("Seed completed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
