import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  updateProfile,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "./client";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signInGithub: () => Promise<void>;
  signInMicrosoft: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const auth = getFirebaseAuth();
    // resolve any pending redirect sign-in (Google/etc on iframes)
    getRedirectResult(auth).catch(() => {});
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const value = useMemo<AuthCtx>(() => {
    async function withErr<T>(fn: () => Promise<T>): Promise<void> {
      setError(null);
      try {
        await fn();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Auth failed");
        throw e;
      }
    }
    return {
      user,
      loading,
      error,
      signInEmail: (email, password) =>
        withErr(async () => {
          await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
        }),
      signUpEmail: (email, password, displayName) =>
        withErr(async () => {
          const cred = await createUserWithEmailAndPassword(
            getFirebaseAuth(),
            email,
            password,
          );
          if (displayName) {
            await updateProfile(cred.user, { displayName });
          }
        }),
      signInGoogle: () =>
        withErr(async () => {
          const provider = new GoogleAuthProvider();
          await trySignIn(provider);
        }),
      signInGithub: () =>
        withErr(async () => {
          const provider = new GithubAuthProvider();
          await trySignIn(provider);
        }),
      signInMicrosoft: () =>
        withErr(async () => {
          const provider = new OAuthProvider("microsoft.com");
          await trySignIn(provider);
        }),
      signOut: () =>
        withErr(async () => {
          await fbSignOut(getFirebaseAuth());
        }),
    };
  }, [user, loading, error]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

async function trySignIn(provider: Parameters<typeof signInWithPopup>[1]) {
  const auth = getFirebaseAuth();
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    // Popups are blocked in third-party iframes; fall back to redirect.
    if (
      err instanceof Error &&
      /popup-blocked|popup-closed|operation-not-supported/.test(err.message)
    ) {
      await signInWithRedirect(auth, provider);
      return;
    }
    throw err;
  }
}

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
