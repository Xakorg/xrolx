import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  requireFirebaseAuth,
  type FirebaseAuthContext,
} from "@/integrations/firebase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const HexColor = z.string().regex(/^#?[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/);

export const listPalettes = createServerFn({ method: "GET" })
  .middleware([requireFirebaseAuth])
  .handler(async ({ context }) => {
    const { firebaseUid } = context as FirebaseAuthContext;
    const { data, error } = await supabaseAdmin
      .from("design_palettes")
      .select("*")
      .eq("owner_firebase_uid", firebaseUid)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const savePalette = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().min(1).max(80),
        swatches: z.array(HexColor).min(1).max(16),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { firebaseUid } = context as FirebaseAuthContext;
    if (data.id) {
      const { data: row, error } = await supabaseAdmin
        .from("design_palettes")
        .update({ name: data.name, swatches: data.swatches })
        .eq("id", data.id)
        .eq("owner_firebase_uid", firebaseUid)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return row;
    }
    const { data: row, error } = await supabaseAdmin
      .from("design_palettes")
      .insert({
        owner_firebase_uid: firebaseUid,
        name: data.name,
        swatches: data.swatches,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deletePalette = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { firebaseUid } = context as FirebaseAuthContext;
    const { error } = await supabaseAdmin
      .from("design_palettes")
      .delete()
      .eq("id", data.id)
      .eq("owner_firebase_uid", firebaseUid);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listTypePairs = createServerFn({ method: "GET" })
  .middleware([requireFirebaseAuth])
  .handler(async ({ context }) => {
    const { firebaseUid } = context as FirebaseAuthContext;
    const { data, error } = await supabaseAdmin
      .from("design_type_pairs")
      .select("*")
      .eq("owner_firebase_uid", firebaseUid)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveTypePair = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().min(1).max(80),
        heading_font: z.string().min(1).max(80),
        body_font: z.string().min(1).max(80),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { firebaseUid } = context as FirebaseAuthContext;
    if (data.id) {
      const { data: row, error } = await supabaseAdmin
        .from("design_type_pairs")
        .update({
          name: data.name,
          heading_font: data.heading_font,
          body_font: data.body_font,
        })
        .eq("id", data.id)
        .eq("owner_firebase_uid", firebaseUid)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return row;
    }
    const { data: row, error } = await supabaseAdmin
      .from("design_type_pairs")
      .insert({
        owner_firebase_uid: firebaseUid,
        name: data.name,
        heading_font: data.heading_font,
        body_font: data.body_font,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteTypePair = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { firebaseUid } = context as FirebaseAuthContext;
    const { error } = await supabaseAdmin
      .from("design_type_pairs")
      .delete()
      .eq("id", data.id)
      .eq("owner_firebase_uid", firebaseUid);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
