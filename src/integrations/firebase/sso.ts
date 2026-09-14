import { signInWithCustomToken } from "firebase/auth";
import { getFirebaseAuth } from "./client";

// Minimal SSO bridge for when Xrolx is embedded in xrolx.xakteir.com.
// Parent posts: { type: "xakteir-sso", customToken: "<firebase custom token>" }
// We accept it and sign in. For ID tokens (not custom tokens) we would need
// a different flow — custom tokens are the clean way to do cross-origin SSO.
export function installXakteirSsoListener() {
  if (typeof window === "undefined") return;
  window.addEventListener("message", async (ev) => {
    const data = ev.data;
    if (!data || typeof data !== "object") return;
    if (data.type !== "xakteir-sso") return;
    // Only accept from xakteir.com origins
    try {
      const host = new URL(ev.origin).hostname;
      if (!host.endsWith("xakteir.com")) return;
    } catch {
      return;
    }
    if (typeof data.customToken === "string") {
      try {
        await signInWithCustomToken(getFirebaseAuth(), data.customToken);
      } catch (err) {
        console.error("Xakteir SSO failed:", err);
      }
    }
  });
  // Announce we're ready to receive a token.
  try {
    window.parent?.postMessage({ type: "xrolx-ready" }, "*");
  } catch {}
}
