// Shared types + pure helpers for the Xrolx Builder.
// Persistence lives in Supabase via src/lib/projects.functions.ts — no localStorage.

export type VFile = { path: string; content: string };

export type Project = {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  entry: string;
  files: VFile[];
  is_published: boolean;
  published_at: string | null;
  updated_at: string;
};

export function slug(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "untitled"
  );
}

export function extOf(path: string): string {
  const i = path.lastIndexOf(".");
  return i >= 0 ? path.slice(i + 1).toLowerCase() : "";
}

export function langOf(path: string): string {
  return (
    {
      js: "javascript",
      mjs: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      json: "json",
      html: "html",
      htm: "html",
      css: "css",
      md: "markdown",
      py: "python",
      go: "go",
      rs: "rust",
      java: "java",
      c: "c",
      cpp: "cpp",
      cs: "csharp",
      kt: "kotlin",
      sh: "shell",
      yml: "yaml",
      yaml: "yaml",
      xml: "xml",
      svg: "xml",
    }[extOf(path)] || "plaintext"
  );
}

// Inline linked css/js into an html entry so the preview is self-contained.
export function bundlePreview(p: { entry: string; files: VFile[] }): string {
  const entry = p.files.find((f) => f.path === p.entry);
  if (!entry) {
    return `<!doctype html><html><body style="font-family:system-ui;padding:24px;color:#555">Entry file <b>${p.entry}</b> not found.</body></html>`;
  }
  const e = extOf(p.entry);

  if (e === "html" || e === "htm") {
    let html = entry.content;
    for (const f of p.files) {
      if (f.path === p.entry) continue;
      const fe = extOf(f.path);
      const esc = f.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (fe === "css") {
        html = html.replace(
          new RegExp(`<link[^>]*href=["']\\.?/?${esc}["'][^>]*>`, "g"),
          `<style>\n${f.content}\n</style>`,
        );
      } else if (fe === "js") {
        html = html.replace(
          new RegExp(`<script[^>]*src=["']\\.?/?${esc}["'][^>]*></script>`, "g"),
          `<script>\n${f.content}\n<\/script>`,
        );
      }
    }
    return html;
  }

  if (e === "js" || e === "mjs") {
    return `<!doctype html><html><body><pre id="o" style="font:13px ui-monospace,Menlo,monospace;color:#0f172a;background:#f8fafc;padding:16px;margin:0;min-height:100vh;white-space:pre-wrap"></pre><script>
const out=document.getElementById('o');
const log=(...a)=>{out.textContent+=a.map(x=>typeof x==='object'?JSON.stringify(x,null,2):String(x)).join(' ')+'\\n'};
const _c=console; console.log=(...a)=>{log(...a);_c.log(...a)};
console.error=(...a)=>{log('ERR',...a);_c.error(...a)};
try{${entry.content}}catch(e){log('Error:',e && e.message ? e.message : e)}
<\/script></body></html>`;
  }

  if (e === "md") {
    return `<!doctype html><html><body style="font-family:ui-sans-serif,system-ui;max-width:780px;margin:40px auto;padding:0 20px;color:#0f172a;line-height:1.6"><pre style="white-space:pre-wrap;font-family:inherit">${entry.content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")}</pre></body></html>`;
  }

  return `<!doctype html><html><body><pre style="padding:16px;font:13px ui-monospace,Menlo,monospace">${entry.content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")}</pre></body></html>`;
}

// Parse multi-file code blocks like:  ```html path="index.html" ... ```
export function parseProposedFiles(text: string): VFile[] {
  const out: VFile[] = [];
  const re = /```([a-zA-Z0-9]*)\s+(?:path|file|name)=["']([^"']+)["'][^\n]*\n([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out.push({ path: m[2].trim(), content: m[3] });
  }
  return out;
}

export function starterFiles(name: string): VFile[] {
  return [
    {
      path: "index.html",
      content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${name}</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <main>
      <h1>${name}</h1>
      <p>Start building. Edit files on the left, click Run to preview.</p>
    </main>
    <script src="main.js"></script>
  </body>
</html>
`,
    },
    {
      path: "styles.css",
      content: `:root { color-scheme: light dark; }
body { font: 16px/1.5 ui-sans-serif, system-ui; margin: 0; padding: 40px; }
main { max-width: 720px; margin: 0 auto; }
h1 { margin-top: 0; }
`,
    },
    { path: "main.js", content: `console.log("${name} ready");\n` },
  ];
}
