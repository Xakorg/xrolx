import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  requireFirebaseAuth,
  type FirebaseAuthContext,
} from "@/integrations/firebase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BUCKET = "gallery";
const SIGNED_URL_TTL = 60 * 60; // 1 hour

export type GalleryItem = {
  id: string;
  name: string;
  path: string;
  url: string;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  mime_type: string | null;
  tags: string[];
  created_at: string;
};

async function signOne(path: string): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (error || !data?.signedUrl) return "";
  return data.signedUrl;
}

export const listGallery = createServerFn({ method: "GET" })
  .middleware([requireFirebaseAuth])
  .handler(async ({ context }): Promise<GalleryItem[]> => {
    const { firebaseUid } = context as FirebaseAuthContext;
    const { data, error } = await supabaseAdmin
      .from("gallery_items")
      .select("*")
      .eq("owner_firebase_uid", firebaseUid)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    const urls = await Promise.all(rows.map((r) => signOne(r.path as string)));
    return rows.map((r, i) => ({
      id: r.id as string,
      name: r.name as string,
      path: r.path as string,
      url: urls[i],
      width: (r.width as number | null) ?? null,
      height: (r.height as number | null) ?? null,
      size_bytes: (r.size_bytes as number | null) ?? null,
      mime_type: (r.mime_type as string | null) ?? null,
      tags: (r.tags as string[] | null) ?? [],
      created_at: r.created_at as string,
    }));
  });

const MAX_BYTES = 8 * 1024 * 1024; // 8MB per upload

export const uploadGalleryItem = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input) =>
    z
      .object({
        name: z.string().min(1).max(255),
        mimeType: z.string().min(1).max(128).regex(/^[\w.+-]+\/[\w.+-]+$/),
        dataBase64: z.string().min(1).max(12_000_000), // ~9MB base64
        width: z.number().int().positive().nullable().optional(),
        height: z.number().int().positive().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<GalleryItem> => {
    const { firebaseUid } = context as FirebaseAuthContext;
    const bytes = Buffer.from(data.dataBase64, "base64");
    if (bytes.byteLength > MAX_BYTES) {
      throw new Error("File too large (max 8MB)");
    }
    const safeName = data.name.replace(/[^\w.\-]/g, "_").slice(0, 200);
    const path = `${firebaseUid}/${crypto.randomUUID()}-${safeName}`;
    const { error: upErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, bytes, {
        contentType: data.mimeType,
        upsert: false,
      });
    if (upErr) throw new Error(upErr.message);

    const { data: row, error } = await supabaseAdmin
      .from("gallery_items")
      .insert({
        owner_firebase_uid: firebaseUid,
        path,
        name: data.name,
        width: data.width ?? null,
        height: data.height ?? null,
        size_bytes: bytes.byteLength,
        mime_type: data.mimeType,
      })
      .select("*")
      .single();
    if (error) {
      await supabaseAdmin.storage.from(BUCKET).remove([path]).catch(() => {});
      throw new Error(error.message);
    }
    const url = await signOne(path);
    return {
      id: row.id as string,
      name: row.name as string,
      path: row.path as string,
      url,
      width: (row.width as number | null) ?? null,
      height: (row.height as number | null) ?? null,
      size_bytes: (row.size_bytes as number | null) ?? null,
      mime_type: (row.mime_type as string | null) ?? null,
      tags: (row.tags as string[] | null) ?? [],
      created_at: row.created_at as string,
    };
  });

export const deleteGalleryItem = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { firebaseUid } = context as FirebaseAuthContext;
    const { data: row, error: re } = await supabaseAdmin
      .from("gallery_items")
      .select("path")
      .eq("id", data.id)
      .eq("owner_firebase_uid", firebaseUid)
      .maybeSingle();
    if (re) throw new Error(re.message);
    if (!row) return { ok: true };
    await supabaseAdmin.storage.from(BUCKET).remove([row.path as string]);
    const { error } = await supabaseAdmin
      .from("gallery_items")
      .delete()
      .eq("id", data.id)
      .eq("owner_firebase_uid", firebaseUid);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateGalleryItem = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        tags: z.array(z.string().min(1).max(40)).max(20).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { firebaseUid } = context as FirebaseAuthContext;
    const patch: { name?: string; tags?: string[] } = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.tags !== undefined) patch.tags = data.tags;
    const { error } = await supabaseAdmin
      .from("gallery_items")
      .update(patch)
      .eq("id", data.id)
      .eq("owner_firebase_uid", firebaseUid);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
