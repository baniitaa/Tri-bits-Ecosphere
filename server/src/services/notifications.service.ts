import { prisma as prismaClient } from "../config/prisma";

const prisma = prismaClient as any;

const notificationSelect = {
  id: true,
  type: true,
  title: true,
  message: true,
  isRead: true,
  readAt: true,
  link: true,
  metadata: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true
    }
  }
} as const;

type NotificationInput = {
  userId: string;
  type?: string;
  title: string;
  message: string;
  link?: string | null;
  metadata?: unknown;
};

export const notificationsService = {
  async create(input: NotificationInput) {
    return prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type ?? "GENERIC",
        title: input.title,
        message: input.message,
        link: input.link ?? null,
        metadata: input.metadata ?? undefined
      },
      select: notificationSelect
    });
  },

  async notifyPermission(permissionKey: string, input: Omit<NotificationInput, "userId">) {
    const users = await prisma.user.findMany({
      where: {
        status: "ACTIVE",
        role: {
          permissions: {
            some: {
              permission: { key: permissionKey }
            }
          }
        }
      },
      select: { id: true }
    });

    if (!users.length) {
      return [];
    }

    return prisma.notification.createMany({
      data: users.map((user: { id: string }) => ({
        userId: user.id,
        type: input.type ?? "GENERIC",
        title: input.title,
        message: input.message,
        link: input.link ?? null,
        metadata: input.metadata ?? undefined
      }))
    });
  },

  async list(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: notificationSelect
    });
  },

  async unreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, isRead: false }
    });
  },

  async markRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });
  },

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });
  }
};
