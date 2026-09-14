import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  requireFirebaseAuth,
  type FirebaseAuthContext,
} from "@/integrations/firebase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Project, VFile } from "./xrolxBuilder";
import { slug as toSlug, starterFiles } from "./xrolxBuilder";

const FileSchema = z.object({
  path: z.string().min(1).max(512),
  content: z.string().max(2_000_000),
});

type Row = {
  id: string;
  owner_id: string | null;
  owner_firebase_uid: string | null;
  slug: string;
  name: string;
  entry: string;
  files: VFile[] | null;
  is_published: boolean;
  published_at: string | null;
  updated_at: string;
};

function rowToProject(r: Row): Project {
  return {
    id: r.id,
    owner_id: r.owner_firebase_uid ?? r.owner_id ?? "",
    slug: r.slug,
    name: r.name,
    entry: r.entry,
    files: (r.files ?? []) as VFile[],
    is_published: !!r.is_published,
    published_at: r.published_at,
    updated_at: r.updated_at,
  };
}

// Ensures a row in `profiles` exists for the current Firebase user.
// Called from /login on success and from getMyProfile().
async function ensureProfileRow(ctx: FirebaseAuthContext) {
  const { firebaseUid, email, name, picture } = ctx;
  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("id, username, display_name, avatar_url, email, firebase_uid")
    .eq("firebase_uid", firebaseUid)
    .maybeSingle();
  if (existing) return existing;

  // Generate unique username from email/name
  const base =
    (name || email?.split("@")[0] || "user")
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "user";
  let username = base;
  let n = 0;
  while (true) {
    const { data: clash } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (!clash) break;
    n += 1;
    username = `${base}-${n}`;
  }
  const { data: inserted, error } = await supabaseAdmin
    .from("profiles")
    .insert({
      id: crypto.randomUUID(),
      firebase_uid: firebaseUid,
      username,
      display_name: name,
      avatar_url: picture,
      email,
    })
    .select("id, username, display_name, avatar_url, email, firebase_uid")
    .single();
  if (error) throw new Error(error.message);
  return inserted;
}

export const ensureProfile = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .handler(async ({ context }) => {
    return ensureProfileRow(context as FirebaseAuthContext);
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireFirebaseAuth])
  .handler(async ({ context }) => {
    return ensureProfileRow(context as FirebaseAuthContext);
  });

export const listMyProjects = createServerFn({ method: "GET" })
  .middleware([requireFirebaseAuth])
  .handler(async ({ context }) => {
    const { firebaseUid } = context as FirebaseAuthContext;
    const { data, error } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("owner_firebase_uid", firebaseUid)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => rowToProject(r as Row));
  });

export const createProject = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input) =>
    z.object({ name: z.string().min(1).max(80) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { firebaseUid } = context as FirebaseAuthContext;
    const baseSlug = toSlug(data.name);
    let slug = baseSlug;
    let n = 0;
    while (true) {
      const { data: existing } = await supabaseAdmin
        .from("projects")
        .select("id")
        .eq("owner_firebase_uid", firebaseUid)
        .eq("slug", slug)
        .maybeSingle();
      if (!existing) break;
      n += 1;
      slug = `${baseSlug}-${n}`;
    }
    const { data: row, error } = await supabaseAdmin
      .from("projects")
      .insert({
        owner_firebase_uid: firebaseUid,
        name: data.name,
        slug,
        entry: "index.html",
        files: starterFiles(data.name),
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return rowToProject(row as Row);
  });

export const saveProject = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().min(1).max(80).optional(),
        entry: z.string().min(1).max(512).optional(),
        files: z.array(FileSchema).max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { firebaseUid } = context as FirebaseAuthContext;
    const patch: { name?: string; entry?: string; files?: VFile[] } = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.entry !== undefined) patch.entry = data.entry;
    if (data.files !== undefined) patch.files = data.files;
    const { data: row, error } = await supabaseAdmin
      .from("projects")
      .update(patch)
      .eq("id", data.id)
      .eq("owner_firebase_uid", firebaseUid)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return rowToProject(row as Row);
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { firebaseUid } = context as FirebaseAuthContext;
    const { error } = await supabaseAdmin
      .from("projects")
      .delete()
      .eq("id", data.id)
      .eq("owner_firebase_uid", firebaseUid);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setPublished = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input) =>
    z.object({ id: z.string().uuid(), published: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { firebaseUid } = context as FirebaseAuthContext;
    const { data: row, error } = await supabaseAdmin
      .from("projects")
      .update({
        is_published: data.published,
        published_at: data.published ? new Date().toISOString() : null,
      })
      .eq("id", data.id)
      .eq("owner_firebase_uid", firebaseUid)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return rowToProject(row as Row);
  });

// Public — no auth. Returns only published projects, exposing only the fields
// needed to render a preview. Never returns owner info or PII.
export const getPublishedProject = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z
      .object({
        account: z.string().min(1).max(64),
        slug: z.string().min(1).max(80),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { data: profile, error: pe } = await supabaseAdmin
      .from("profiles")
      .select("id, username, display_name, firebase_uid")
      .eq("username", data.account)
      .maybeSingle();
    if (pe) throw new Error(pe.message);
    if (!profile) return null;

    let query = supabaseAdmin
      .from("projects")
      .select("name, slug, entry, files, published_at")
      .eq("slug", data.slug)
      .eq("is_published", true);
    // Prefer Firebase uid; fall back to legacy owner_id if profile predates bridge.
    if (profile.firebase_uid) {
      query = query.eq("owner_firebase_uid", profile.firebase_uid);
    } else {
      query = query.eq("owner_id", profile.id);
    }
    const { data: row, error } = await query.maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;

    return {
      account: profile.username,
      displayName: profile.display_name,
      name: row.name as string,
      slug: row.slug as string,
      entry: row.entry as string,
      files: (row.files ?? []) as VFile[],
      publishedAt: row.published_at as string | null,
    };
  });

// Backwards-compat alias used elsewhere in the codebase
export const getMyUsername = getMyProfile;
