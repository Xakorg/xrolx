import { useEffect, useMemo, useState } from "react";
import { Search, ArrowRight, Hash } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { APPS } from "./apps";

const QUICK = [
  { type: "Person", label: "Anya Volkov", meta: "Friend · online" },
  { type: "Project", label: "Space Arena", meta: "Builder · multiplayer" },
  { type: "Message", label: "from #design-systems", meta: "Mint tokens proposal" },
  { type: "Community", label: "RPG Devs", meta: "12.4k members" },
  { type: "Event", label: "Lovable Hackathon", meta: "Sat · Berlin" },
  { type: "File", label: "PlayerModel.png", meta: "Used in 2 projects" },
  { type: "Plugin", label: "Three.js Scene Pack", meta: "Marketplace" },
  { type: "Email", label: "Invoice from XCP", meta: "Yesterday" },
];

export function UniversalSearch({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    const apps = APPS.filter(
      (a) =>
        !s ||
        a.name.toLowerCase().includes(s) ||
        a.short.toLowerCase().includes(s),
    ).slice(0, 6);
    const quick = QUICK.filter(
      (r) => !s || r.label.toLowerCase().includes(s) || r.type.toLowerCase().includes(s),
    ).slice(0, 6);
    return { apps, quick };
  }, [q]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-deep/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: -12, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative w-full max-w-2xl glass-strong rounded-2xl shadow-soft overflow-hidden"
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
              <Search className="w-5 h-5 text-mint" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search people, projects, messages, files, apps…"
                className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-base"
              />
              <kbd className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">
                Esc
              </kbd>
            </div>

            <div className="max-h-[55vh] overflow-y-auto scrollbar-thin">
              {results.apps.length > 0 && (
                <Section title="Apps">
                  {results.apps.map((a) => (
                    <Row
                      key={a.id}
                      icon={<a.icon className="w-4 h-4" style={{ color: a.hue }} />}
                      label={a.name}
                      meta={a.short}
                    />
                  ))}
                </Section>
              )}

              {results.quick.length > 0 && (
                <Section title="Everything else">
                  {results.quick.map((r, i) => (
                    <Row
                      key={i}
                      icon={<Hash className="w-4 h-4 text-mint-glow" />}
                      label={r.label}
                      meta={`${r.type} · ${r.meta}`}
                    />
                  ))}
                </Section>
              )}

              {results.apps.length === 0 && results.quick.length === 0 && (
                <div className="p-10 text-center text-muted-foreground text-sm">
                  No matches. Try something like “space arena” or “hackathon”.
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
              <span>One search across the whole ecosystem.</span>
              <span className="flex items-center gap-1">
                <kbd className="border border-border rounded px-1.5 py-0.5">↵</kbd>
                open
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-2">
      <div className="px-5 pt-2 pb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
        {title}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Row({
  icon,
  label,
  meta,
}: {
  icon: React.ReactNode;
  label: string;
  meta: string;
}) {
  return (
    <button className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-mint/10 transition text-left group">
      <div className="w-7 h-7 rounded-md glass flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-foreground truncate">{label}</div>
        <div className="text-xs text-muted-foreground truncate">{meta}</div>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
    </button>
  );
}
