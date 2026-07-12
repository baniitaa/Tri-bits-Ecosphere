import { prisma } from "../config/prisma";
import { DEFAULT_SETTINGS } from "../../../shared/src/constants";
import { AppError } from "../utils/app-error";
import type { SettingsFormInput } from "../../../shared/src/schemas";

export const settingsService = {
  async get() {
    const settings = await prisma.organizationSetting.findUnique({
      where: { id: "default" }
    });

    if (settings) {
      return settings;
    }

    return prisma.organizationSetting.create({
      data: {
        id: "default",
        ...DEFAULT_SETTINGS
      }
    });
  },

  async update(input: SettingsFormInput, userId: string) {
    const total = input.environmentalWeight + input.socialWeight + input.governanceWeight;
    if (total !== 100) {
      throw new AppError("ESG weights must total 100", 400, "INVALID_WEIGHTAGE");
    }

    const current = await prisma.organizationSetting.findUnique({ where: { id: "default" } });

    if (!current) {
      return prisma.organizationSetting.create({
        data: {
          id: "default",
          ...input,
          updatedByUserId: userId
        }
      });
    }

    return prisma.organizationSetting.update({
      where: { id: "default" },
      data: {
        ...input,
        updatedByUserId: userId
      }
    });
  }
};
