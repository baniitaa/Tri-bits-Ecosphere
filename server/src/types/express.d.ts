import type { AuthUserPayload } from "./auth";

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUserPayload;
    }
  }
}

export {};
