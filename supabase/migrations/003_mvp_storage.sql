-- =============================================================
-- MIGRATION 003 — MVP Storage Buckets + Source Video Tracking
-- Solo aditivo. Idempotente.
-- =============================================================

-- -------------------------------------------------------------
-- 1. Columnas en projects para tracking del video fuente
-- -------------------------------------------------------------

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS source_video_url text;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS source_video_path text;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS source_video_duration_seconds numeric;

-- transcript jsonb — se llena cuando Whisper procesa el video
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS transcript jsonb;

-- brand_id para que el render sepa qué tokens aplicar (rentmies, nocomiss, etc.)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS brand text DEFAULT 'rentmies';

-- grade preset (canon/cinematic/warm/raw) — del PRD
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS grade text DEFAULT 'canon'
  CHECK (grade IN ('canon', 'cinematic', 'warm', 'raw'));

-- -------------------------------------------------------------
-- 2. Buckets de Supabase Storage
-- -------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('source-videos',   'source-videos',   false, 524288000,  ARRAY['video/mp4','video/webm','video/quicktime','video/x-matroska']),
  ('rendered-videos', 'rendered-videos', true,  1073741824, ARRAY['video/mp4']),
  ('thumbnails',      'thumbnails',      true,  5242880,    ARRAY['image/jpeg','image/png','image/webp']),
  ('assets',          'assets',          false, 52428800,   ARRAY['image/jpeg','image/png','image/svg+xml','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------------
-- 3. Storage RLS — users CRUD su propia carpeta {user_id}/...
-- Postgres no soporta CREATE POLICY IF NOT EXISTS, usar DO $$
-- -------------------------------------------------------------

-- source-videos: insert
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'users_upload_own_source_videos'
      AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "users_upload_own_source_videos"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'source-videos'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- source-videos: read own
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'users_read_own_source_videos'
      AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "users_read_own_source_videos"
      ON storage.objects FOR SELECT
      USING (
        bucket_id = 'source-videos'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- source-videos: update own (para upsert)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'users_update_own_source_videos'
      AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "users_update_own_source_videos"
      ON storage.objects FOR UPDATE
      USING (
        bucket_id = 'source-videos'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- source-videos: delete own
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'users_delete_own_source_videos'
      AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "users_delete_own_source_videos"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'source-videos'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- assets: ALL en su propia carpeta
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'users_manage_own_assets'
      AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "users_manage_own_assets"
      ON storage.objects FOR ALL
      USING (
        bucket_id = 'assets'
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
      WITH CHECK (
        bucket_id = 'assets'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- thumbnails: users escriben su propia carpeta
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'users_write_own_thumbnails'
      AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "users_write_own_thumbnails"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'thumbnails'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- thumbnails: lectura pública
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'public_read_thumbnails'
      AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "public_read_thumbnails"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'thumbnails');
  END IF;
END $$;

-- rendered-videos: solo el sistema (service-role) escribe, todos leen
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'public_read_rendered_videos'
      AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "public_read_rendered_videos"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'rendered-videos');
  END IF;
END $$;

-- Admins bypass — pueden todo en cualquier bucket
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'admins_all_storage'
      AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "admins_all_storage"
      ON storage.objects FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND rol = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND rol = 'admin'
        )
      );
  END IF;
END $$;
