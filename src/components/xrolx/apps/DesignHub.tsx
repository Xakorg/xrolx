import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Palette as PaletteIcon, Type, Loader2 } from "lucide-react";
import {
  listPalettes,
  savePalette,
  deletePalette,
  listTypePairs,
  saveTypePair,
  deleteTypePair,
} from "@/lib/design.functions";
import { toast } from "sonner";

type Tab = "palettes" | "type";

export function DesignHub() {
  const [tab, setTab] = useState<Tab>("palettes");
  return (
    <div className="h-full flex flex-col bg-background">
      <header className="flex items-center gap-3 px-4 h-12 border-b border-border">
        <h1 className="text-sm font-semibold">Design Hub</h1>
        <div className="flex items-center gap-1 ml-4">
          <TabBtn active={tab === "palettes"} onClick={() => setTab("palettes")}>
            <PaletteIcon className="w-3.5 h-3.5" /> Palettes
          </TabBtn>
          <TabBtn active={tab === "type"} onClick={() => setTab("type")}>
            <Type className="w-3.5 h-3.5" /> Typography
          </TabBtn>
        </div>
      </header>
      <div className="flex-1 overflow-auto p-4">
        {tab === "palettes" ? <Palettes /> : <TypePairs />}
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-7 px-3 rounded-md text-xs flex items-center gap-1.5 ${
        active ? "bg-mint/15 text-foreground" : "text-muted-foreground hover:bg-mint/10"
      }`}
    >
      {children}
    </button>
  );
}

function Palettes() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["palettes"], queryFn: () => listPalettes() });
  const [name, setName] = useState("");
  const [colors, setColors] = useState<string[]>([
    "#0a0a1a",
    "#141432",
    "#1e1e5a",
    "#4f46e5",
  ]);

  const save = useMutation({
    mutationFn: (input: { name: string; swatches: string[] }) =>
      savePalette({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["palettes"] });
      setName("");
      toast.success("Palette saved");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });
  const del = useMutation({
    mutationFn: (id: string) => deletePalette({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["palettes"] }),
  });

  return (
    <div className="space-y-6">
      <div className="glass rounded-lg p-4">
        <h2 className="text-xs uppercase tracking-widest text-mint mb-3">New palette</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Palette name"
          className="w-full h-9 px-3 rounded-md bg-background border border-border text-sm mb-3"
        />
        <div className="flex flex-wrap gap-2 mb-3">
          {colors.map((c, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <input
                type="color"
                value={c}
                onChange={(e) => {
                  const next = [...colors];
                  next[i] = e.target.value;
                  setColors(next);
                }}
                className="w-10 h-10 rounded-md border border-border cursor-pointer"
              />
              <button
                onClick={() => setColors(colors.filter((_, j) => j !== i))}
                className="text-[10px] text-muted-foreground hover:text-red-400"
              >
                remove
              </button>
            </div>
          ))}
          {colors.length < 16 && (
            <button
              onClick={() => setColors([...colors, "#888888"])}
              className="w-10 h-10 rounded-md border border-dashed border-border flex items-center justify-center hover:bg-mint/10"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          disabled={!name.trim() || save.isPending}
          onClick={() => save.mutate({ name: name.trim(), swatches: colors })}
          className="h-8 px-3 rounded-md bg-mint text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-50"
        >
          {save.isPending ? "…" : "Save palette"}
        </button>
      </div>

      <div>
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
          Your palettes
        </h2>
        {q.isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        ) : (q.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No palettes yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(q.data ?? []).map((p: any) => (
              <div key={p.id} className="glass rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium">{p.name}</div>
                  <button
                    onClick={() => del.mutate(p.id)}
                    className="text-muted-foreground hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex h-8 rounded-md overflow-hidden">
                  {((p.swatches as string[]) ?? []).map((c, i) => (
                    <div key={i} className="flex-1" style={{ background: c }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TypePairs() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["typepairs"], queryFn: () => listTypePairs() });
  const [name, setName] = useState("");
  const [heading, setHeading] = useState("Space Grotesk");
  const [body, setBody] = useState("Inter");

  const save = useMutation({
    mutationFn: () =>
      saveTypePair({
        data: { name: name.trim(), heading_font: heading, body_font: body },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["typepairs"] });
      setName("");
      toast.success("Pair saved");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteTypePair({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["typepairs"] }),
  });

  return (
    <div className="space-y-6">
      <div className="glass rounded-lg p-4 space-y-3">
        <h2 className="text-xs uppercase tracking-widest text-mint">New type pair</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Pair name (e.g. Editorial)"
          className="w-full h-9 px-3 rounded-md bg-background border border-border text-sm"
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Heading font
            </label>
            <input
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              className="mt-1 w-full h-9 px-3 rounded-md bg-background border border-border text-sm"
              style={{ fontFamily: heading }}
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Body font
            </label>
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="mt-1 w-full h-9 px-3 rounded-md bg-background border border-border text-sm"
              style={{ fontFamily: body }}
            />
          </div>
        </div>
        <button
          disabled={!name.trim() || save.isPending}
          onClick={() => save.mutate()}
          className="h-8 px-3 rounded-md bg-mint text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-50"
        >
          {save.isPending ? "…" : "Save pair"}
        </button>
      </div>

      <div>
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
          Your pairs
        </h2>
        {q.isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        ) : (q.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No pairs yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {(q.data ?? []).map((p: any) => (
              <div key={p.id} className="glass rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="text-xs text-muted-foreground">{p.name}</div>
                  <button
                    onClick={() => del.mutate(p.id)}
                    className="text-muted-foreground hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-2xl" style={{ fontFamily: p.heading_font }}>
                  {p.heading_font}
                </div>
                <div className="text-sm text-muted-foreground" style={{ fontFamily: p.body_font }}>
                  The quick brown fox jumps over the lazy dog. — {p.body_font}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
