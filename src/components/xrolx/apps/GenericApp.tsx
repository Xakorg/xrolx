import { APP_BY_ID, type XApp } from "../apps";
import { Construction, ArrowRight } from "lucide-react";

export function GenericApp({ id }: { id: string }) {
  const app: XApp = APP_BY_ID[id] ?? APP_BY_ID["command"];
  return (
    <div className="h-full grid-bg relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div className="max-w-xl w-full glass-strong rounded-3xl p-10 text-center relative">
          <div
            className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center ring-1 ring-mint/30"
            style={{
              background: `radial-gradient(circle at 30% 20%, ${app.hue}40, transparent 70%), oklch(0.22 0.045 225)`,
            }}
          >
            <app.icon className="w-10 h-10" style={{ color: app.hue }} />
          </div>
          <div className="text-[10px] uppercase tracking-widest text-mint mt-5">
            {app.category} · Xrolx
          </div>
          <h2 className="text-2xl font-medium mt-2">{app.name}</h2>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            {app.blurb}
          </p>

          <div className="mt-6 inline-flex items-center gap-2 text-xs glass rounded-full px-3 py-1.5 text-foreground/80">
            <Construction className="w-3.5 h-3.5 text-mint" />
            Preview surface — ask Lovable to flesh this one out next
          </div>

          <div className="mt-8 grid grid-cols-2 gap-2 text-left">
            {features(app.id).map((f) => (
              <div
                key={f}
                className="glass rounded-lg px-3 py-2 text-xs text-foreground/80 flex items-center gap-2"
              >
                <ArrowRight className="w-3 h-3 text-mint shrink-0" />
                <span className="truncate">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function features(id: string): string[] {
  const map: Record<string, string[]> = {
    gallery: ["Albums & folders", "Cloud sync", "Cartoonify", "AI search"],
    design: ["Canvas + layers", "AI UI generation", "Export to Builder", "Templates"],
    audio: ["Text-to-speech", "AI music", "SFX library", "Podcast tools"],
    files: ["Cloud storage", "AI search", "Relationship graph", "Versioning"],
    feed: ["Following", "Projects", "Communities", "Trending"],
    discover: ["Today's picks", "Learns interests", "Friend signals", "World feed"],
    world: ["Nearby", "Events", "Hackathons", "Privacy controls"],
    spaces: ["Chat & voice", "Shared projects", "Files", "AI helper"],
    live: ["Voice rooms", "Shared screens", "Shared projects", "Meeting summaries"],
    learn: ["Lessons", "Quizzes", "Classrooms", "Study groups"],
    flows: ["Triggers", "Actions", "AI logic", "Templates"],
    market: ["Plugins", "Themes", "Workflows", "MCP servers"],
    knowledge: ["Connected notes", "Linked files", "Linked chats", "Graph view"],
    analyst: ["Usage", "Projects", "Trends", "AI predictions"],
    coach: ["Screen aware", "Auto clip", "Performance", "Suggestions"],
    teams: ["Members", "Roles", "Shared projects", "Pooled storage"],
    family: ["Parental PIN", "AI restrictions", "Time controls", "Multi-parent"],
    xcp: ["Auth", "Database", "Realtime", "Payments"],
    hosting: ["Temp URLs", "Custom domains", "Netlify link", "Vercel link"],
  };
  return map[id] ?? ["Coming soon", "Coming soon", "Coming soon", "Coming soon"];
}
