import type { Prisma } from "@prisma/client";

export type AuthUserPayload = Prisma.UserGetPayload<{
  include: {
    role: {
      include: {
        permissions: {
          include: {
            permission: true;
          };
        };
      };
    };
    employee: {
      include: {
        department: true;
      };
    };
  };
}>;
