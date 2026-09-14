import { createMiddleware } from "@tanstack/react-start";
import { getFirebaseAuth } from "./client";

// Client-side TanStack function middleware. Attaches the current Firebase
// user's ID token as `Authorization: Bearer ...` on every server-fn call.
// The matching server middleware (`requireFirebaseAuth`) verifies it.
export const attachFirebaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    if (typeof window === "undefined") return next();
    try {
      const user = getFirebaseAuth().currentUser;
      if (!user) return next();
      const token = await user.getIdToken();
      return next({ headers: { Authorization: `Bearer ${token}` } });
    } catch {
      return next();
    }
  },
);
