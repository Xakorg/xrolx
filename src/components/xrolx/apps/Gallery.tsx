import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, Trash2, ImageOff, Loader2 } from "lucide-react";
import {
  listGallery,
  uploadGalleryItem,
  deleteGalleryItem,
} from "@/lib/gallery.functions";
import { toast } from "sonner";

export function Gallery() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["gallery"], queryFn: () => listGallery() });
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  const del = useMutation({
    mutationFn: (id: string) => deleteGalleryItem({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gallery"] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  async function onFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const buf = await file.arrayBuffer();
        const dataBase64 = btoa(
          String.fromCharCode(...new Uint8Array(buf)),
        );
        await uploadGalleryItem({
          data: {
            name: file.name,
            mimeType: file.type || "application/octet-stream",
            dataBase64,
          },
        });
      }
      qc.invalidateQueries({ queryKey: ["gallery"] });
      toast.success("Uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const items = q.data ?? [];

  return (
    <div className="h-full flex flex-col bg-background">
      <header className="flex items-center justify-between px-4 h-12 border-b border-border">
        <div>
          <h1 className="text-sm font-semibold">Gallery</h1>
          <p className="text-[10px] text-muted-foreground">
            {items.length} item{items.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="h-8 px-3 rounded-md bg-mint text-primary-foreground text-xs font-medium flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            Upload
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4">
        {q.isLoading ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
            <ImageOff className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-sm">No images yet.</p>
            <p className="text-[11px] mt-1">Upload your first image to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {items.map((it) => (
              <div
                key={it.id}
                className="group relative aspect-square rounded-lg overflow-hidden glass cursor-pointer"
                onClick={() => setActive(it.url)}
              >
                {it.url ? (
                  <img
                    src={it.url}
                    alt={it.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <ImageOff className="w-6 h-6" />
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete ${it.name}?`)) del.mutate(it.id);
                  }}
                  className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 w-7 h-7 rounded-md bg-black/60 text-white flex items-center justify-center hover:bg-red-600"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/70 to-transparent text-[10px] text-white truncate">
                  {it.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"
          onClick={() => setActive(null)}
        >
          <img src={active} className="max-w-full max-h-full rounded-lg" alt="" />
        </div>
      )}
    </div>
  );
}
