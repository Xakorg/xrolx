import { motion } from "motion/react";
import {
  Send,
  Mic,
  Sparkles,
  History,
  Pin,
  Folder,
  Plus,
  Wand2,
  Loader2,
} from "lucide-react";
import { useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

const HISTORY = [
  { icon: Pin, label: "Build multiplayer game" },
  { icon: History, label: "Yesterday's Space Arena" },
  { icon: Folder, label: "Mail / triage rules" },
  { icon: Sparkles, label: "Find RPG communities" },
];

const STARTERS = [
  "Build a multiplayer game",
  "Explain what Xrolx can do for me",
  "Draft a workflow: new email → save attachment → notify me",
  "Find game-dev communities near me",
];

export function CommandCenter() {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi — I'm your Xrolx AI. I can build, debug, find people, run workflows and control any app in your ecosystem. What should we make?",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;

    const next: Msg[] = [...messages, { role: "user", content: t }];
    setMessages(next);
    setInput("");
    setBusy(true);

    let acc = "";
    const appendDelta = (chunk: string) => {
      acc += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: acc } : m,
          );
        }
        return [...prev, { role: "assistant", content: acc }];
      });
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      });
    };

    try {
      const resp = await fetch("/api/public/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        appendDelta(`⚠️ ${err.error ?? "Something went wrong."}`);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;

      while (!done) {
        const { done: rDone, value } = await reader.read();
        if (rDone) break;
        buf += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) appendDelta(c);
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      appendDelta(
        `⚠️ ${e instanceof Error ? e.message : "Network error"}`,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="h-full grid grid-cols-[260px_1fr]">
      {/* Sidebar */}
      <aside className="glass border-r border-border flex flex-col">
        <button
          onClick={() =>
            setMessages([
              {
                role: "assistant",
                content: "New chat started. What are we building?",
              },
            ])
          }
          className="m-3 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-mint text-primary-foreground text-sm font-medium hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" /> New chat
        </button>
        <div className="px-3 text-[10px] uppercase tracking-widest text-muted-foreground mt-2 mb-1">
          Memory Timeline
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin px-2">
          {HISTORY.map((h, i) => (
            <button
              key={i}
              className="w-full flex items-center gap-2 text-left px-2 py-2 rounded-lg hover:bg-mint/10 text-sm text-foreground/90"
            >
              <h.icon className="w-3.5 h-3.5 text-mint" />
              <span className="truncate">{h.label}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Chat */}
      <section className="flex flex-col min-w-0">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-4"
        >
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-mint text-primary-foreground rounded-br-sm"
                    : "glass rounded-bl-sm"
                }`}
              >
                {m.content || (busy ? "…" : "")}
              </div>
            </motion.div>
          ))}

          {messages.length <= 1 && !busy && (
            <div className="pt-6 grid sm:grid-cols-2 gap-2 max-w-2xl">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="glass rounded-xl px-4 py-3 text-left text-sm text-foreground/90 hover:bg-mint/10 transition flex items-start gap-2"
                >
                  <Wand2 className="w-4 h-4 text-mint mt-0.5 shrink-0" />
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border">
          <div className="glass-strong rounded-2xl flex items-end gap-2 p-2">
            <button
              type="button"
              className="w-9 h-9 rounded-lg hover:bg-mint/10 flex items-center justify-center text-muted-foreground"
            >
              <Mic className="w-4 h-4" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder="Ask Xrolx to build, find, automate, anything…"
              className="flex-1 bg-transparent outline-none text-sm resize-none py-2 px-1 max-h-40"
              disabled={busy}
            />
            <button
              onClick={() => send(input)}
              disabled={busy}
              className="w-9 h-9 rounded-lg bg-mint text-primary-foreground flex items-center justify-center hover:opacity-90 disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <div className="text-[10px] text-muted-foreground mt-2 text-center">
            Xrolx AI · powered by Lovable AI · streaming
          </div>
        </div>
      </section>
    </div>
  );
}
