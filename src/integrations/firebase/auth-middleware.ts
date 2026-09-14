import { createMiddleware } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { firebaseProjectId } from "./config";

// Firebase ID tokens are signed with Google's securetoken keys (JWKS).
const FIREBASE_JWKS_URL = new URL(
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
);
let _jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function jwks() {
  if (!_jwks) _jwks = createRemoteJWKSet(FIREBASE_JWKS_URL);
  return _jwks;
}

export type FirebaseAuthContext = {
  firebaseUid: string;
  email: string | null;
  name: string | null;
  picture: string | null;
};

// Server-side middleware. Add to any createServerFn that requires the
// caller to be a signed-in Firebase user.
export const requireFirebaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const auth = getRequestHeader("authorization") || getRequestHeader("Authorization");
    if (!auth || !auth.toLowerCase().startsWith("bearer ")) {
      throw new Error("Unauthorized: missing bearer token");
    }
    const token = auth.slice(7).trim();
    let payload;
    try {
      ({ payload } = await jwtVerify(token, jwks(), {
        issuer: `https://securetoken.google.com/${firebaseProjectId}`,
        audience: firebaseProjectId,
      }));
    } catch (err) {
      throw new Error(
        `Unauthorized: ${err instanceof Error ? err.message : "invalid token"}`,
      );
    }
    const sub = typeof payload.sub === "string" ? payload.sub : null;
    if (!sub) throw new Error("Unauthorized: token missing subject");

    const ctx: FirebaseAuthContext = {
      firebaseUid: sub,
      email: typeof payload.email === "string" ? payload.email : null,
      name: typeof payload.name === "string" ? payload.name : null,
      picture: typeof payload.picture === "string" ? payload.picture : null,
    };
    return next({ context: ctx });
  },
);
