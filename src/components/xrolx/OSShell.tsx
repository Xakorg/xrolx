import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Bell,
  LayoutGrid,
  Plus,
  X,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/integrations/firebase/useAuth";
import { getMyProfile } from "@/lib/projects.functions";
import { APP_BY_ID, APPS, type XApp } from "./apps";
import { OrbitLogo } from "./OrbitLogo";
import { UniversalSearch } from "./UniversalSearch";
import { AppLauncher } from "./AppLauncher";
import { CommandCenter } from "./apps/CommandCenter";
import { Builder } from "./apps/Builder";
import { Mail } from "./apps/Mail";
import { Gallery } from "./apps/Gallery";
import { DesignHub } from "./apps/DesignHub";
import { GenericApp } from "./apps/GenericApp";

type Tab = { id: string; appId: string };

const DOCK_IDS = ["command", "builder", "mail", "gallery", "design", "world", "feed", "files"];

function renderApp(id: string) {
  if (id === "command") return <CommandCenter />;
  if (id === "builder") return <Builder />;
  if (id === "mail") return <Mail />;
  if (id === "gallery") return <Gallery />;
  if (id === "design") return <DesignHub />;
  return <GenericApp id={id} />;
}

export function OSShell() {
  const { user, signOut } = useAuth();
  const profileQ = useQuery({
    queryKey: ["me", "profile", user?.uid],
    queryFn: () => getMyProfile(),
    enabled: !!user,
  });
  const profile = profileQ.data;
  const displayName =
    profile?.display_name || user?.displayName || profile?.username || user?.email || "You";
  const initials = displayName
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const [tabs, setTabs] = useState<Tab[]>([
    { id: "t1", appId: "command" },
    { id: "t2", appId: "builder" },
  ]);
  const [activeId, setActiveId] = useState("t1");
  const [searchOpen, setSearchOpen] = useState(false);
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [bootDone, setBootDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBootDone(true), 900);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function openApp(appId: string) {
    const existing = tabs.find((t) => t.appId === appId);
    if (existing) {
      setActiveId(existing.id);
    } else {
      const id = `t${Date.now()}`;
      setTabs((t) => [...t, { id, appId }]);
      setActiveId(id);
    }
    setLauncherOpen(false);
  }

  function closeTab(id: string) {
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      const next = prev.filter((t) => t.id !== id);
      if (id === activeId && next.length) {
        setActiveId(next[Math.max(0, idx - 1)].id);
      }
      return next;
    });
  }

  const activeTab = tabs.find((t) => t.id === activeId);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col">
      <AnimatePresence>
        {!bootDone && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-deep"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex flex-col items-center gap-4">
              <OrbitLogo size={72} />
              <div className="text-xs uppercase tracking-[0.4em] text-mint/80">Xrolx</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-1 px-3 pt-2 select-none">
        <div className="flex items-center gap-1 mr-2 text-mint">
          <div className="w-2.5 h-2.5 rounded-full bg-mint/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-mint-glow/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-foreground/20" />
        </div>

        <AnimatePresence initial={false}>
          {tabs.map((t) => {
            const app = APP_BY_ID[t.appId];
            const active = t.id === activeId;
            return (
              <motion.button
                key={t.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                onClick={() => setActiveId(t.id)}
                className={`group relative flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-t-lg text-xs max-w-[200px] transition ${
                  active
                    ? "glass-strong text-foreground border-b-0"
                    : "text-foreground/60 hover:text-foreground hover:bg-mint/10"
                }`}
              >
                <app.icon className="w-3.5 h-3.5 shrink-0" style={{ color: app.hue }} />
                <span className="truncate">{app.name}</span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(t.id);
                  }}
                  className="w-4 h-4 rounded hover:bg-foreground/10 inline-flex items-center justify-center opacity-50 group-hover:opacity-100"
                >
                  <X className="w-3 h-3" />
                </span>
                {active && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute -bottom-px left-2 right-2 h-px bg-mint"
                  />
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>

        <button
          onClick={() => setLauncherOpen(true)}
          className="ml-1 w-7 h-7 rounded-lg hover:bg-mint/10 flex items-center justify-center text-mint/80"
          title="New app"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <header className="glass-strong border-y border-border flex items-center gap-3 px-4 h-12 shrink-0">
        <button
          onClick={() => setLauncherOpen(true)}
          className="flex items-center gap-2 group"
        >
          <OrbitLogo size={22} />
          <span className="font-medium text-sm tracking-tight">Xrolx</span>
        </button>

        <button
          onClick={() => setSearchOpen(true)}
          className="flex-1 max-w-2xl mx-auto flex items-center gap-2 px-3 py-1.5 rounded-lg glass text-left text-sm text-muted-foreground hover:bg-mint/10 transition"
        >
          <Search className="w-4 h-4 text-mint" />
          <span className="flex-1 truncate">Search everything…</span>
          <kbd className="text-[10px] border border-border rounded px-1 py-0.5">⌘K</kbd>
        </button>

        <button
          onClick={() => setLauncherOpen(true)}
          className="w-9 h-9 rounded-lg hover:bg-mint/10 flex items-center justify-center"
          title="Apps"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>

        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen((v) => !v);
              setProfileOpen(false);
            }}
            className="w-9 h-9 rounded-lg hover:bg-mint/10 flex items-center justify-center relative"
          >
            <Bell className="w-4 h-4" />
          </button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute right-0 top-11 w-80 glass-strong rounded-xl p-4 z-50 shadow-soft text-sm text-muted-foreground"
              >
                No notifications yet.
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 pl-1 pr-2 h-9 rounded-lg hover:bg-mint/10"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-mint to-mint-glow text-primary-foreground flex items-center justify-center text-xs font-semibold">
                {initials}
              </div>
            )}
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute right-0 top-11 w-64 glass-strong rounded-xl p-2 z-50 shadow-soft text-sm"
              >
                <div className="px-3 py-2">
                  <div className="font-medium truncate">{displayName}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {user?.email ?? (profile?.username ? `@${profile.username}` : "")}
                  </div>
                </div>
                <div className="h-px bg-border my-1" />
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    signOut().catch(() => {});
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-mint/10 text-foreground/90 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <main className="flex-1 min-h-0 relative">
        <AnimatePresence mode="wait">
          {activeTab && (
            <motion.div
              key={activeTab.id}
              initial={{ opacity: 0, scale: 0.995 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0"
            >
              {renderApp(activeTab.appId)}
            </motion.div>
          )}
          {!activeTab && <EmptyState key="empty" onOpen={openApp} />}
        </AnimatePresence>
      </main>

      <div className="shrink-0 flex justify-center pb-3 pt-2">
        <div className="glass-strong rounded-2xl px-3 py-2 flex items-center gap-1 shadow-soft">
          {DOCK_IDS.map((id) => {
            const a = APP_BY_ID[id];
            const isOpen = tabs.some((t) => t.appId === id);
            return (
              <button
                key={id}
                onClick={() => openApp(id)}
                title={a.name}
                className="relative w-11 h-11 rounded-xl flex items-center justify-center hover:bg-mint/10 transition group"
                style={{
                  background: `radial-gradient(circle at 30% 20%, ${a.hue}22, transparent 70%)`,
                }}
              >
                <a.icon className="w-5 h-5" style={{ color: a.hue }} />
                {isOpen && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-mint" />
                )}
                <span className="absolute -top-9 opacity-0 group-hover:opacity-100 transition pointer-events-none text-[10px] px-2 py-1 rounded-md glass-strong whitespace-nowrap">
                  {a.name}
                </span>
              </button>
            );
          })}
          <div className="w-px h-7 bg-border mx-1" />
          <button
            onClick={() => setLauncherOpen(true)}
            className="w-11 h-11 rounded-xl flex items-center justify-center hover:bg-mint/10 transition"
            title="All apps"
          >
            <LayoutGrid className="w-5 h-5 text-mint" />
          </button>
        </div>
      </div>

      <UniversalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <AppLauncher open={launcherOpen} onClose={() => setLauncherOpen(false)} onOpen={openApp} />

      {(notifOpen || profileOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setNotifOpen(false);
            setProfileOpen(false);
          }}
        />
      )}
    </div>
  );
}

function EmptyState({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <div className="absolute inset-0 grid-bg flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <OrbitLogo size={56} />
        <h2 className="text-3xl font-semibold mt-6 mint-gradient-text">
          One account. One AI. One ecosystem.
        </h2>
        <p className="text-muted-foreground mt-3 text-sm">
          No tabs open. Pick an app from the dock or hit{" "}
          <kbd className="text-xs border border-border rounded px-1.5 py-0.5">⌘K</kbd> to search.
        </p>
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          {["command", "builder", "design"].map((id) => {
            const a = APP_BY_ID[id];
            return (
              <button
                key={id}
                onClick={() => onOpen(id)}
                className="glass rounded-lg px-3 py-2 text-xs hover:bg-mint/10 flex items-center gap-1.5"
              >
                <a.icon className="w-3.5 h-3.5" style={{ color: a.hue }} />
                {a.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

void APPS;
