import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { OrbitLogo } from "@/components/xrolx/OrbitLogo";
import { useAuth } from "@/integrations/firebase/useAuth";
import { toast } from "sonner";
import { useEffect } from "react";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : "/",
    mode: s.mode === "signup" ? "signup" : "login",
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Xrolx" },
      { name: "description", content: "Sign in with your Xakteir account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect, mode } = Route.useSearch();
  const navigate = useNavigate();
  const auth = useAuth();
  const [tab, setTab] = useState<"login" | "signup">(mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (auth.user) navigate({ to: redirect, replace: true });
  }, [auth.user, navigate, redirect]);

  async function onEmail(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (tab === "signup") {
        await auth.signUpEmail(email, password, name || undefined);
        toast.success("Welcome to Xrolx — your Xakteir account is ready.");
      } else {
        await auth.signInEmail(email, password);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setBusy(false);
    }
  }

  async function withProvider(fn: () => Promise<void>, label: string) {
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      toast.error(`${label} sign-in failed: ${err instanceof Error ? err.message : ""}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md glass-strong rounded-2xl p-8 shadow-soft">
        <div className="flex flex-col items-center text-center mb-6">
          <OrbitLogo size={48} />
          <h1 className="text-2xl font-semibold mt-3 mint-gradient-text">
            {tab === "signup" ? "Create your Xakteir account" : "Sign in with Xakteir"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            One Xakteir account · works across Xrolx and xakteir.com.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <ProviderButton
            label="Google"
            disabled={busy}
            onClick={() => withProvider(auth.signInGoogle, "Google")}
            icon={<GoogleIcon />}
          />
          <ProviderButton
            label="GitHub"
            disabled={busy}
            onClick={() => withProvider(auth.signInGithub, "GitHub")}
            icon={<GithubIcon />}
          />
          <ProviderButton
            label="Microsoft"
            disabled={busy}
            onClick={() => withProvider(auth.signInMicrosoft, "Microsoft")}
            icon={<MicrosoftIcon />}
          />
        </div>
        <p className="text-[10px] text-muted-foreground text-center mb-3">
          Each provider must be enabled in your Firebase console first.
        </p>

        <div className="flex items-center gap-3 my-4 text-[10px] uppercase tracking-widest text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> or email <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={onEmail} className="space-y-3">
          {tab === "signup" && (
            <div>
              <label className="text-xs text-muted-foreground">Display name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full h-10 rounded-lg bg-background border border-border px-3 text-sm focus:outline-none focus:border-mint"
                placeholder="Your name"
                autoComplete="name"
              />
            </div>
          )}
          <div>
            <label className="text-xs text-muted-foreground">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full h-10 rounded-lg bg-background border border-border px-3 text-sm focus:outline-none focus:border-mint"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full h-10 rounded-lg bg-background border border-border px-3 text-sm focus:outline-none focus:border-mint"
              autoComplete={tab === "signup" ? "new-password" : "current-password"}
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full h-10 rounded-lg bg-mint text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "…" : tab === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        <div className="text-center text-xs text-muted-foreground mt-5">
          {tab === "signup" ? (
            <>
              Already have an account?{" "}
              <button onClick={() => setTab("login")} className="text-mint hover:underline">
                Sign in
              </button>
            </>
          ) : (
            <>
              New to Xakteir?{" "}
              <button onClick={() => setTab("signup")} className="text-mint hover:underline">
                Create an account
              </button>
            </>
          )}
        </div>

        <div className="text-center text-[10px] text-muted-foreground mt-4">
          <Link to="/" className="hover:underline">
            ← back
          </Link>
        </div>
      </div>
    </div>
  );
}

function ProviderButton({
  label,
  icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-10 rounded-lg border border-border bg-background hover:bg-accent/40 text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-50"
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.5 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 8 3l5.7-5.7C34.2 6 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 8 3l5.7-5.7C34.2 7 29.4 5 24 5 16.3 5 9.7 9.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.3 0 10.1-2 13.7-5.3l-6.3-5.2C29.3 35 26.8 36 24 36c-5.2 0-9.6-3.4-11.2-8.1l-6.5 5C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.4 4.3-4.6 5.7l6.3 5.2C40 35.3 44 30.1 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}
function GithubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.6.5.5 5.7.5 12.1c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2.9-.3 1.9-.4 2.9-.4s2 .1 2.9.4c2.3-1.5 3.3-1.2 3.3-1.2.7 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.9 7.9-10.9C23.5 5.7 18.4.5 12 .5z" />
    </svg>
  );
}
function MicrosoftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
      <rect x="2" y="2" width="9" height="9" fill="#F25022" />
      <rect x="13" y="2" width="9" height="9" fill="#7FBA00" />
      <rect x="2" y="13" width="9" height="9" fill="#00A4EF" />
      <rect x="13" y="13" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}
