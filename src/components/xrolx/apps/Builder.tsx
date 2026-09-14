import { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import JSZip from "jszip";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Folder,
  FileCode2,
  Play,
  GitBranch,
  Sparkles,
  Terminal as TerminalIcon,
  Plus,
  Trash2,
  Send,
  Loader2,
  Eye,
  X,
  Rocket,
  Wand2,
  Download,
  Maximize2,
  FolderPlus,
  ChevronDown,
  Check,
  Globe,
  CloudOff,
} from "lucide-react";
import { toast } from "sonner";
import {
  bundlePreview,
  langOf,
  parseProposedFiles,
  type Project,
  type VFile,
} from "@/lib/xrolxBuilder";
import {
  listMyProjects,
  createProject as createProjectFn,
  saveProject,
  deleteProject as deleteProjectFn,
  setPublished,
  getMyUsername,
} from "@/lib/projects.functions";

export function Builder() {
  const qc = useQueryClient();
  const projectsQ = useQuery({
    queryKey: ["builder", "projects"],
    queryFn: () => listMyProjects(),
  });
  const meQ = useQuery({
    queryKey: ["me", "profile"],
    queryFn: () => getMyUsername(),
  });

  const projects = projectsQ.data ?? [];
  const [activeId, setActiveId] = useState<string | null>(null);
  useEffect(() => {
    if (!activeId && projects.length) setActiveId(projects[0].id);
    if (activeId && !projects.find((p) => p.id === activeId)) {
      setActiveId(projects[0]?.id ?? null);
    }
  }, [projects, activeId]);

  const remote = useMemo(
    () => projects.find((p) => p.id === activeId) ?? null,
    [projects, activeId],
  );

  // Local working copy (so autosave can debounce edits)
  const [draft, setDraft] = useState<Project | null>(null);
  useEffect(() => {
    setDraft(remote ? { ...remote, files: remote.files.map((f) => ({ ...f })) } : null);
  }, [remote?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const [activePath, setActivePath] = useState<string>("");
  useEffect(() => {
    if (!draft) return setActivePath("");
    if (!draft.files.find((f) => f.path === activePath)) {
      setActivePath(draft.files[0]?.path ?? "");
    }
  }, [draft?.id, draft?.files.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeFile = draft?.files.find((f) => f.path === activePath) ?? null;

  const [showPreview, setShowPreview] = useState(false);
  const [previewTick, setPreviewTick] = useState(0);
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [termLines, setTermLines] = useState<string[]>(["xrolx@web ~ $ ready"]);
  const [termInput, setTermInput] = useState("");

  // Save state
  const [saveState, setSaveState] = useState<"idle" | "dirty" | "saving" | "saved">("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveMut = useMutation({
    mutationFn: (input: { id: string; files?: VFile[]; entry?: string; name?: string }) =>
      saveProject({ data: input }),
    onSuccess: (row) => {
      qc.setQueryData<Project[]>(["builder", "projects"], (old) =>
        (old ?? []).map((p) => (p.id === row.id ? row : p)),
      );
      setSaveState("saved");
    },
    onError: (e) => {
      setSaveState("dirty");
      toast.error(e instanceof Error ? e.message : "Save failed");
    },
  });

  // Debounced autosave whenever draft changes (after first edit)
  useEffect(() => {
    if (!draft || !remote) return;
    const same =
      draft.entry === remote.entry &&
      draft.name === remote.name &&
      draft.files.length === remote.files.length &&
      draft.files.every((f, i) => {
        const r = remote.files[i];
        return r && r.path === f.path && r.content === f.content;
      });
    if (same) return;
    setSaveState("dirty");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setSaveState("saving");
      saveMut.mutate({
        id: draft.id,
        files: draft.files,
        entry: draft.entry,
        name: draft.name,
      });
    }, 700);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [draft, remote]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mutations
  const createMut = useMutation({
    mutationFn: (name: string) => createProjectFn({ data: { name } }),
    onSuccess: (row) => {
      qc.setQueryData<Project[]>(["builder", "projects"], (old) => [row, ...(old ?? [])]);
      setActiveId(row.id);
      toast.success(`Created "${row.name}"`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Create failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteProjectFn({ data: { id } }),
    onSuccess: (_r, id) => {
      qc.setQueryData<Project[]>(["builder", "projects"], (old) =>
        (old ?? []).filter((p) => p.id !== id),
      );
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  const publishMut = useMutation({
    mutationFn: (v: { id: string; published: boolean }) =>
      setPublished({ data: v }),
    onSuccess: (row) => {
      qc.setQueryData<Project[]>(["builder", "projects"], (old) =>
        (old ?? []).map((p) => (p.id === row.id ? row : p)),
      );
      if (row.is_published && meQ.data?.username) {
        const url = `${window.location.origin}/p/${meQ.data.username}/${row.slug}`;
        navigator.clipboard?.writeText(url).catch(() => {});
        toast.success("Published — link copied to clipboard", { description: url });
      } else {
        toast.success("Unpublished");
      }
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Publish failed"),
  });

  function patch(fn: (p: Project) => Project) {
    setDraft((d) => (d ? fn(d) : d));
  }

  function createProject() {
    const name = prompt("Project name (e.g. landing-page)")?.trim();
    if (!name) return;
    createMut.mutate(name);
    setProjectPickerOpen(false);
  }

  function deleteProject(id: string) {
    const p = projects.find((x) => x.id === id);
    if (!p || !confirm(`Delete project "${p.name}"? This cannot be undone.`)) return;
    deleteMut.mutate(id);
    if (activeId === id) setActiveId(null);
  }

  function selectProject(id: string) {
    setActiveId(id);
    setProjectPickerOpen(false);
  }

  function updateFile(path: string, content: string) {
    patch((p) => ({ ...p, files: p.files.map((f) => (f.path === path ? { ...f, content } : f)) }));
  }

  function addFile() {
    const name = prompt("New file path (e.g. utils.js, components/Header.tsx)")?.trim();
    if (!name || !draft) return;
    if (draft.files.some((f) => f.path === name)) return alert("File already exists.");
    patch((p) => ({ ...p, files: [...p.files, { path: name, content: "" }] }));
    setActivePath(name);
  }

  function deleteFile(path: string) {
    if (!draft || !confirm("Delete " + path + "?")) return;
    patch((p) => ({ ...p, files: p.files.filter((f) => f.path !== path) }));
  }

  function setEntry(path: string) {
    patch((p) => ({ ...p, entry: path }));
    setTermLines((t) => [...t, `$ entry → ${path}`]);
  }

  function runProject() {
    setShowPreview(true);
    setPreviewTick((t) => t + 1);
    setTermLines((t) => [...t, "$ run → preview refreshed"]);
  }

  function openFullPreview() {
    if (!draft || !meQ.data?.username) return;
    const url = `/p/${meQ.data.username}/${draft.slug}`;
    window.open(url, "_blank", "noopener");
  }

  function publish() {
    if (!draft) return;
    publishMut.mutate({ id: draft.id, published: !draft.is_published });
  }

  async function downloadZip() {
    if (!draft) return;
    const zip = new JSZip();
    for (const f of draft.files) zip.file(f.path, f.content);
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${draft.slug}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setTermLines((t) => [...t, `$ download → ${draft.slug}.zip`]);
  }

  function handleTerm(cmd: string) {
    const c = cmd.trim();
    setTermLines((t) => [...t, "$ " + c]);
    if (!c) return;
    if (c === "clear") return setTermLines([]);
    if (!draft) return setTermLines((t) => [...t, "no project open"]);
    if (c === "ls") return setTermLines((t) => [...t, draft.files.map((f) => f.path).join("  ")]);
    if (c.startsWith("cat ")) {
      const f = draft.files.find((x) => x.path === c.slice(4).trim());
      return setTermLines((t) => [...t, f ? f.content : "no such file"]);
    }
    if (c.startsWith("touch ")) {
      const name = c.slice(6).trim();
      if (draft.files.some((f) => f.path === name)) return setTermLines((t) => [...t, "exists"]);
      patch((p) => ({ ...p, files: [...p.files, { path: name, content: "" }] }));
      return;
    }
    if (c.startsWith("rm ")) return deleteFile(c.slice(3).trim());
    if (c === "run") return runProject();
    if (c === "help")
      return setTermLines((t) => [
        ...t,
        "commands: ls, cat <f>, touch <f>, rm <f>, run, clear, help",
      ]);
    setTermLines((t) => [...t, "xrolx: command not found: " + c.split(" ")[0]]);
  }

  // ---------- AI ----------
  type Msg = { role: "user" | "assistant"; content: string };
  const [chat, setChat] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "I'm your Builder copilot. Describe what you want to build or change and I'll write/modify the files for you.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chat, streaming]);

  async function streamChat(userText: string) {
    if (!draft) {
      setChat((c) => [
        ...c,
        { role: "user", content: userText },
        { role: "assistant", content: "Create or open a project first." },
      ]);
      return;
    }
    const filesDump = draft.files
      .map((f) => "```" + langOf(f.path) + ` path="${f.path}"\n` + f.content + "\n```")
      .join("\n\n");
    const sys = `You are Xrolx Builder Copilot, an expert full-stack engineer. You are working inside a virtual file system for the project "${draft.name}". You can create, modify, or delete any file.

CURRENT PROJECT FILES:
${filesDump}

ENTRY FILE: ${draft.entry}
USER IS EDITING: ${activePath}

RULES:
- When you propose code changes, return the COMPLETE NEW CONTENT of each affected file inside a fenced code block tagged with a path attribute, like:
  \`\`\`html path="index.html"
  <full new file content>
  \`\`\`
- You may include multiple file blocks in one reply. Only include files you are changing or creating.
- Never use diff/patch syntax. Always full replacement.
- Keep code production-quality, accessible, and self-contained (no external CDNs unless necessary).
- Briefly explain the change above the code blocks. Be concise.`;

    const next: Msg[] = [...chat, { role: "user", content: userText }];
    setChat(next);
    setStreaming(true);
    setChat((c) => [...c, { role: "assistant", content: "" }]);
    try {
      const res = await fetch("/api/public/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next, system: sys, model: "google/gemini-2.5-pro" }),
      });
      if (!res.ok || !res.body) {
        const e = await res.json().catch(() => ({ error: "Error" }));
        setChat((c) => {
          const copy = [...c];
          copy[copy.length - 1] = { role: "assistant", content: "⚠️ " + (e.error || "Failed") };
          return copy;
        });
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let full = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n");
        buf = parts.pop() || "";
        for (const line of parts) {
          const l = line.trim();
          if (!l.startsWith("data:")) continue;
          const data = l.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const j = JSON.parse(data);
            const delta = j.choices?.[0]?.delta?.content;
            if (delta) {
              full += delta;
              setChat((c) => {
                const copy = [...c];
                copy[copy.length - 1] = { role: "assistant", content: full };
                return copy;
              });
            }
          } catch {}
        }
      }
    } catch (e) {
      setChat((c) => {
        const copy = [...c];
        copy[copy.length - 1] = {
          role: "assistant",
          content: "⚠️ " + (e instanceof Error ? e.message : "Network error"),
        };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  }

  function sendChat() {
    if (!chatInput.trim() || streaming) return;
    streamChat(chatInput.trim());
    setChatInput("");
  }

  const lastAssistant = [...chat].reverse().find((m) => m.role === "assistant");
  const proposedFiles: VFile[] = useMemo(
    () => (lastAssistant ? parseProposedFiles(lastAssistant.content) : []),
    [lastAssistant],
  );

  function applyProposed() {
    if (!draft || proposedFiles.length === 0) return;
    patch((p) => {
      const map = new Map(p.files.map((f) => [f.path, f] as const));
      for (const pf of proposedFiles) map.set(pf.path, pf);
      return { ...p, files: Array.from(map.values()) };
    });
    setTermLines((t) => [...t, `$ ai apply → ${proposedFiles.map((f) => f.path).join(", ")}`]);
    setPreviewTick((t) => t + 1);
  }

  // ---------- Loading / Empty states ----------
  if (projectsQ.isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-deep/40 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-foreground p-8 text-center bg-deep/40">
        <Folder className="w-12 h-12 text-mint/60 mb-4" />
        <h2 className="text-xl font-semibold mb-1">No projects yet</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Create your first Xrolx Builder project to start writing, previewing, and shipping web
          apps.
        </p>
        <button
          onClick={createProject}
          disabled={createMut.isPending}
          className="px-4 py-2 rounded-lg bg-mint text-primary-foreground text-sm flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
        >
          <FolderPlus className="w-4 h-4" /> New project
        </button>
      </div>
    );
  }

  const previewSrc = bundlePreview(draft);

  return (
    <div className="h-full grid grid-rows-[auto_1fr_auto] bg-deep/40 text-foreground">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border glass shrink-0 gap-2">
        <div className="flex items-center gap-2 text-sm min-w-0 relative">
          <button
            onClick={() => setProjectPickerOpen((v) => !v)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-mint/10 min-w-0"
          >
            <Folder className="w-4 h-4 text-mint shrink-0" />
            <span className="truncate max-w-[140px]">{draft.name}</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>
          <span className="text-muted-foreground">/</span>
          <span className="truncate text-foreground/90">{activePath}</span>
          <span className="ml-2 hidden sm:inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-mint/80">
            <GitBranch className="w-3 h-3" /> main
          </span>
          <SaveBadge state={saveState} />

          {projectPickerOpen && (
            <div className="absolute top-full left-0 mt-1 z-30 w-64 rounded-lg border border-border bg-popover shadow-xl p-1.5 text-sm">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground px-2 pt-1 pb-1.5">
                Projects
              </div>
              <div className="max-h-60 overflow-y-auto scrollbar-thin">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className={`group flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-mint/10 cursor-pointer ${
                      p.id === activeId ? "bg-mint/15" : ""
                    }`}
                    onClick={() => selectProject(p.id)}
                  >
                    {p.id === activeId ? (
                      <Check className="w-3.5 h-3.5 text-mint" />
                    ) : (
                      <Folder className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                    <span className="flex-1 truncate text-xs">{p.name}</span>
                    {p.is_published && <Globe className="w-3 h-3 text-mint" />}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProject(p.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={createProject}
                className="w-full mt-1 text-xs flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-mint/10 text-mint"
              >
                <FolderPlus className="w-3.5 h-3.5" /> New project
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <button
            onClick={() => setShowPreview((v) => !v)}
            className="text-xs px-2.5 py-1.5 rounded-lg glass hover:bg-mint/10 flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" /> {showPreview ? "Hide" : "Preview"}
          </button>
          <button
            onClick={runProject}
            className="text-xs px-3 py-1.5 rounded-lg bg-mint text-primary-foreground flex items-center gap-1.5 hover:opacity-90"
          >
            <Play className="w-3.5 h-3.5" /> Run
          </button>
          <button
            onClick={openFullPreview}
            className="text-xs px-2.5 py-1.5 rounded-lg glass hover:bg-mint/10 flex items-center gap-1.5"
            title="Open fullscreen preview in new tab"
          >
            <Maximize2 className="w-3.5 h-3.5" /> Fullscreen
          </button>
          <button
            onClick={downloadZip}
            className="text-xs px-2.5 py-1.5 rounded-lg glass hover:bg-mint/10 flex items-center gap-1.5"
            title="Download as .zip"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </button>
          <button
            onClick={publish}
            disabled={publishMut.isPending}
            className={`text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 ${
              draft.is_published
                ? "bg-mint/20 text-mint hover:bg-mint/30"
                : "glass hover:bg-mint/10"
            } disabled:opacity-50`}
          >
            {draft.is_published ? (
              <>
                <Globe className="w-3.5 h-3.5" /> Published
              </>
            ) : (
              <>
                <Rocket className="w-3.5 h-3.5" /> Publish
              </>
            )}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-[180px_1fr_320px] min-h-0">
        {/* Files */}
        <div className="border-r border-border flex flex-col min-h-0">
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-border">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Files
            </span>
            <button
              onClick={addFile}
              className="w-5 h-5 rounded hover:bg-mint/10 flex items-center justify-center text-mint"
              title="New file"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin py-1 text-sm">
            {draft.files.map((f) => (
              <div
                key={f.path}
                className={`group flex items-center gap-1.5 px-2 py-1 cursor-pointer hover:bg-mint/10 ${
                  f.path === activePath ? "bg-mint/15 text-mint" : "text-foreground/80"
                }`}
                onClick={() => setActivePath(f.path)}
                onDoubleClick={() => setEntry(f.path)}
                title="Double-click to set as entry"
              >
                <FileCode2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate flex-1 text-xs">{f.path}</span>
                {f.path === draft.entry && (
                  <span className="text-[9px] uppercase tracking-wider text-mint/80">entry</span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFile(f.path);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-400"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Editor + preview */}
        <div className="min-w-0 min-h-0 flex flex-col">
          <div
            className="flex-1 min-h-0 grid"
            style={{ gridTemplateColumns: showPreview ? "1fr 1fr" : "1fr" }}
          >
            <div className="min-w-0 min-h-0">
              {activeFile ? (
                <Editor
                  height="100%"
                  theme="vs-dark"
                  language={langOf(activeFile.path)}
                  value={activeFile.content}
                  onChange={(v) => updateFile(activeFile.path, v ?? "")}
                  options={{
                    fontSize: 13,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    wordWrap: "on",
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  No file selected
                </div>
              )}
            </div>
            {showPreview && (
              <div className="border-l border-border bg-white min-w-0 min-h-0 relative">
                <button
                  onClick={() => setShowPreview(false)}
                  className="absolute top-1 right-1 z-10 w-6 h-6 rounded bg-black/40 text-white hover:bg-black/60 flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
                <iframe
                  key={previewTick}
                  title="preview"
                  sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
                  srcDoc={previewSrc}
                  className="w-full h-full border-0"
                />
              </div>
            )}
          </div>
        </div>

        {/* AI */}
        <div className="border-l border-border flex flex-col min-h-0 glass">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="w-4 h-4 text-mint" /> AI Copilot
            </div>
            {proposedFiles.length > 0 && (
              <button
                onClick={applyProposed}
                className="text-[10px] uppercase tracking-widest px-2 py-1 rounded bg-mint text-primary-foreground hover:opacity-90"
                title={proposedFiles.map((f) => f.path).join(", ")}
              >
                Apply {proposedFiles.length} file{proposedFiles.length > 1 ? "s" : ""}
              </button>
            )}
          </div>
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3 text-xs"
          >
            {chat.map((m, i) => (
              <div
                key={i}
                className={`rounded-lg p-2.5 leading-relaxed whitespace-pre-wrap break-words ${
                  m.role === "user"
                    ? "bg-mint/15 text-foreground ml-4"
                    : "glass text-foreground/90 mr-4"
                }`}
              >
                {m.content || (streaming && i === chat.length - 1 ? "…" : "")}
              </div>
            ))}
          </div>
          <div className="p-2 border-t border-border space-y-2">
            <div className="flex flex-wrap gap-1">
              {["Build a landing page", "Add a contact form", "Make it responsive", "Fix bugs"].map(
                (q) => (
                  <button
                    key={q}
                    onClick={() => !streaming && setChatInput(q)}
                    className="text-[10px] px-2 py-1 rounded-md glass hover:bg-mint/10 flex items-center gap-1"
                  >
                    <Wand2 className="w-3 h-3 text-mint" />
                    {q}
                  </button>
                ),
              )}
            </div>
            <div className="flex items-end gap-1.5">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendChat();
                  }
                }}
                rows={2}
                placeholder={`Ask AI to change ${draft.name}…`}
                className="flex-1 resize-none bg-transparent border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-mint"
              />
              <button
                onClick={sendChat}
                disabled={streaming || !chatInput.trim()}
                className="w-8 h-8 rounded-lg bg-mint text-primary-foreground flex items-center justify-center disabled:opacity-40"
              >
                {streaming ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal */}
      <div className="border-t border-border bg-deep/70 shrink-0">
        <div
          className="flex items-center gap-2 px-3 py-1.5 text-[10px] uppercase tracking-widest text-mint/80 cursor-pointer"
          onClick={() => setTerminalOpen((v) => !v)}
        >
          <TerminalIcon className="w-3 h-3" /> Terminal
          <span className="ml-auto text-muted-foreground normal-case tracking-normal">
            {terminalOpen ? "hide" : "show"}
          </span>
        </div>
        {terminalOpen && (
          <div className="px-3 pb-2 font-mono text-[11px] text-foreground/85">
            <div className="max-h-32 overflow-y-auto scrollbar-thin space-y-0.5">
              {termLines.map((l, i) => (
                <div key={i} className="whitespace-pre-wrap">
                  {l}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-mint">$</span>
              <input
                value={termInput}
                onChange={(e) => setTermInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleTerm(termInput);
                    setTermInput("");
                  }
                }}
                placeholder="type 'help'"
                className="flex-1 bg-transparent outline-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SaveBadge({ state }: { state: "idle" | "dirty" | "saving" | "saved" }) {
  if (state === "idle") return null;
  return (
    <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
      {state === "saving" && (
        <>
          <Loader2 className="w-3 h-3 animate-spin" /> Saving…
        </>
      )}
      {state === "saved" && (
        <>
          <Check className="w-3 h-3 text-mint" /> Saved
        </>
      )}
      {state === "dirty" && (
        <>
          <CloudOff className="w-3 h-3" /> Unsaved
        </>
      )}
    </span>
  );
}
