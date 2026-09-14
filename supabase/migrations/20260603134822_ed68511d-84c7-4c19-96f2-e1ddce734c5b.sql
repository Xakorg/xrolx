-- 1. profiles: add firebase_uid for Firebase-auth bridge
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS firebase_uid TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
CREATE INDEX IF NOT EXISTS profiles_firebase_uid_idx ON public.profiles(firebase_uid);

-- 2. projects: track Firebase owner. Keep owner_id (UUID) for back-compat; new code uses owner_firebase_uid.
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS owner_firebase_uid TEXT;
CREATE INDEX IF NOT EXISTS projects_owner_firebase_uid_idx ON public.projects(owner_firebase_uid);
ALTER TABLE public.projects ALTER COLUMN owner_id DROP NOT NULL;

-- Lock direct client access; all writes go through server fns w/ verified Firebase token + service role
DROP POLICY IF EXISTS "Owners can view their projects" ON public.projects;
DROP POLICY IF EXISTS "Owners can insert their projects" ON public.projects;
DROP POLICY IF EXISTS "Owners can update their projects" ON public.projects;
DROP POLICY IF EXISTS "Owners can delete their projects" ON public.projects;
-- Keep public read of published projects so public route loaders can read directly if needed
-- (already exists: "Published projects are viewable by everyone")

-- 3. gallery_items
CREATE TABLE IF NOT EXISTS public.gallery_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_firebase_uid TEXT NOT NULL,
  path TEXT NOT NULL,
  name TEXT NOT NULL,
  width INT,
  height INT,
  size_bytes BIGINT,
  mime_type TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gallery_items_owner_idx ON public.gallery_items(owner_firebase_uid);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_items TO authenticated;
GRANT ALL ON public.gallery_items TO service_role;

ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
-- Lock client direct access; access via verified server fns
CREATE POLICY "No direct client access to gallery_items"
  ON public.gallery_items FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE TRIGGER update_gallery_items_updated_at
  BEFORE UPDATE ON public.gallery_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. design_palettes
CREATE TABLE IF NOT EXISTS public.design_palettes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_firebase_uid TEXT NOT NULL,
  name TEXT NOT NULL,
  swatches JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS design_palettes_owner_idx ON public.design_palettes(owner_firebase_uid);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.design_palettes TO authenticated;
GRANT ALL ON public.design_palettes TO service_role;

ALTER TABLE public.design_palettes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No direct client access to design_palettes"
  ON public.design_palettes FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE TRIGGER update_design_palettes_updated_at
  BEFORE UPDATE ON public.design_palettes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. design_type_pairs
CREATE TABLE IF NOT EXISTS public.design_type_pairs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_firebase_uid TEXT NOT NULL,
  name TEXT NOT NULL,
  heading_font TEXT NOT NULL,
  body_font TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS design_type_pairs_owner_idx ON public.design_type_pairs(owner_firebase_uid);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.design_type_pairs TO authenticated;
GRANT ALL ON public.design_type_pairs TO service_role;

ALTER TABLE public.design_type_pairs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No direct client access to design_type_pairs"
  ON public.design_type_pairs FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE TRIGGER update_design_type_pairs_updated_at
  BEFORE UPDATE ON public.design_type_pairs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
