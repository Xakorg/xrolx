import { motion } from "motion/react";
import {
  Inbox,
  Star,
  Send,
  Clock,
  Pencil,
  Sparkles,
  Reply,
} from "lucide-react";

const MAIL = [
  {
    from: "Anya Volkov",
    subject: "Mint tokens for Design Hub",
    preview: "I exported the OKLCH set. Want me to also generate Tailwind…",
    time: "8m",
    priority: "AI ★",
    unread: true,
  },
  {
    from: "XCP Billing",
    subject: "Invoice · November",
    preview: "Your XCP usage this period was $24.30 across 3 projects…",
    time: "1h",
    priority: "Low",
    unread: false,
  },
  {
    from: "Lovable Hackathon",
    subject: "You're confirmed for Berlin",
    preview: "See you Saturday at 10:00. Doors open from 09:00 with…",
    time: "3h",
    priority: "Important",
    unread: true,
  },
  {
    from: "GitHub",
    subject: "PR #482 merged in space-arena",
    preview: "Add matchmaking fallback to eu-central. Merged by xrolx-bot.",
    time: "Yesterday",
    priority: "Low",
    unread: false,
  },
];

export function Mail() {
  return (
    <div className="h-full grid grid-cols-[200px_320px_1fr]">
      <aside className="border-r border-border glass p-3 text-sm space-y-1">
        <button className="w-full mb-3 flex items-center justify-center gap-2 bg-mint text-primary-foreground rounded-lg py-2 text-sm font-medium">
          <Pencil className="w-4 h-4" /> Compose
        </button>
        <Item icon={Inbox} label="Inbox" count={3} active />
        <Item icon={Star} label="Important" count={1} />
        <Item icon={Sparkles} label="AI Priority" count={2} />
        <Item icon={Clock} label="Scheduled" />
        <Item icon={Send} label="Sent" />
        <div className="pt-4 mt-4 border-t border-border text-[10px] uppercase tracking-widest text-muted-foreground">
          Accounts
        </div>
        <div className="text-xs text-foreground/80 mt-2 space-y-1">
          <div>hello@xakteir.com</div>
          <div className="text-muted-foreground">anya@gmail.com</div>
        </div>
      </aside>

      <div className="border-r border-border overflow-y-auto scrollbar-thin">
        {MAIL.map((m, i) => (
          <button
            key={i}
            className={`w-full text-left px-4 py-3 border-b border-border hover:bg-mint/5 transition ${
              i === 0 ? "bg-mint/10" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-sm truncate ${
                  m.unread ? "text-foreground font-medium" : "text-foreground/70"
                }`}
              >
                {m.from}
              </span>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {m.time}
              </span>
            </div>
            <div className="text-sm truncate mt-0.5">{m.subject}</div>
            <div className="text-xs text-muted-foreground truncate mt-0.5">
              {m.preview}
            </div>
            <div className="text-[10px] mt-1.5">
              <span
                className={
                  m.priority.includes("★")
                    ? "text-mint"
                    : m.priority === "Important"
                      ? "text-mint-glow"
                      : "text-muted-foreground"
                }
              >
                {m.priority}
              </span>
            </div>
          </button>
        ))}
      </div>

      <section className="overflow-y-auto scrollbar-thin p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-medium">Mint tokens for Design Hub</h2>
            <div className="text-sm text-muted-foreground mt-1">
              Anya Volkov &lt;anya@gmail.com&gt; · to me · 8 minutes ago
            </div>
          </div>
          <button className="text-xs px-3 py-1.5 rounded-lg glass hover:bg-mint/10 flex items-center gap-1.5">
            <Reply className="w-3.5 h-3.5" /> Reply
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 glass rounded-xl p-3 text-xs flex items-start gap-2"
        >
          <Sparkles className="w-3.5 h-3.5 text-mint mt-0.5" />
          <div>
            <span className="text-mint">AI summary —</span> Anya sent the OKLCH
            mint palette and proposes exporting matching Tailwind tokens. Quick
            replies below.
          </div>
        </motion.div>

        <div className="mt-6 text-sm leading-relaxed text-foreground/90 space-y-3">
          <p>Hey —</p>
          <p>
            I exported the full OKLCH set we landed on for the Neon Mint
            direction. Want me to also generate Tailwind tokens so Builder can
            pull them straight into <code className="text-mint">space-arena</code>?
          </p>
          <p>— Anya</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {[
            "Yes please, send Tailwind tokens",
            "Send to Builder directly",
            "Let's review on a Live Room",
          ].map((s) => (
            <button
              key={s}
              className="text-xs px-3 py-1.5 rounded-full glass hover:bg-mint/10 transition"
            >
              <Sparkles className="w-3 h-3 inline mr-1 text-mint" />
              {s}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function Item({
  icon: Icon,
  label,
  count,
  active,
}: {
  icon: typeof Inbox;
  label: string;
  count?: number;
  active?: boolean;
}) {
  return (
    <button
      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm ${
        active ? "bg-mint/15 text-mint" : "text-foreground/80 hover:bg-mint/10"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="flex-1 text-left">{label}</span>
      {count && (
        <span className="text-[10px] bg-mint/20 text-mint rounded px-1.5 py-0.5">
          {count}
        </span>
      )}
    </button>
  );
}
