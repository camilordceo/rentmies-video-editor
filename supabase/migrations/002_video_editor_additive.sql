-- =============================================================
-- MIGRATION 002 — Video Editor Additive
-- Rentmies Video Editor
-- Solo operaciones ADITIVAS. NUNCA DROP, NUNCA ALTER para quitar
-- columnas, NUNCA DELETE masivo.
-- =============================================================

-- -------------------------------------------------------------
-- 1. Agregar empresa_id a tablas existentes
-- -------------------------------------------------------------

ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS empresa_id uuid
  REFERENCES public.empresas(id);

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS empresa_id uuid
  REFERENCES public.empresas(id);

ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS empresa_id uuid
  REFERENCES public.empresas(id);

ALTER TABLE public.content_ideas
  ADD COLUMN IF NOT EXISTS empresa_id uuid
  REFERENCES public.empresas(id);

ALTER TABLE public.hooks
  ADD COLUMN IF NOT EXISTS empresa_id uuid
  REFERENCES public.empresas(id);

-- -------------------------------------------------------------
-- 2. Agregar canon_grade a videos
-- -------------------------------------------------------------

ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS canon_grade text
  DEFAULT 'canon'
  CHECK (canon_grade IN ('canon', 'cinematic', 'warm', 'raw'));

-- -------------------------------------------------------------
-- 3. Tabla de renders (nueva)
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.video_renders (
  id                   uuid        NOT NULL DEFAULT gen_random_uuid(),
  created_at           timestamptz          DEFAULT now(),
  updated_at           timestamptz          DEFAULT now(),
  user_id              uuid        REFERENCES auth.users(id),
  empresa_id           uuid        REFERENCES public.empresas(id),
  video_id             uuid        REFERENCES public.videos(id),
  project_id           uuid        REFERENCES public.projects(id),
  composition_id       text        NOT NULL,
  status               text                 DEFAULT 'queued'
    CHECK (status IN ('queued', 'rendering', 'completed', 'failed')),
  progress             integer              DEFAULT 0,
  output_url           text,
  error_message        text,
  render_started_at    timestamptz,
  render_completed_at  timestamptz,
  duration_seconds     integer,
  file_size_mb         numeric,
  props                jsonb                DEFAULT '{}',
  CONSTRAINT video_renders_pkey PRIMARY KEY (id)
);

-- -------------------------------------------------------------
-- 4. Tabla de suscripciones del video editor (nueva)
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.video_editor_subscriptions (
  id                       uuid        NOT NULL DEFAULT gen_random_uuid(),
  created_at               timestamptz          DEFAULT now(),
  user_id                  uuid        NOT NULL REFERENCES auth.users(id),
  empresa_id               uuid        REFERENCES public.empresas(id),
  plan                     text        NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  status                   text                 DEFAULT 'active'
    CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  renders_used             integer              DEFAULT 0,
  renders_limit            integer              DEFAULT 3,
  storage_used_mb          numeric              DEFAULT 0,
  storage_limit_mb         numeric              DEFAULT 500,
  current_period_start     timestamptz          DEFAULT now(),
  current_period_end       timestamptz          DEFAULT (now() + interval '30 days'),
  wompi_subscription_id    text,
  CONSTRAINT video_editor_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT video_editor_subscriptions_user_id_key UNIQUE (user_id)
);

-- -------------------------------------------------------------
-- 5. Empresa Rentmies para admins (si no existe)
-- -------------------------------------------------------------

INSERT INTO public.empresas (id, nombre, plan, activa, configuracion)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Rentmies',
  'enterprise',
  true,
  '{"is_internal": true, "video_editor_access": true}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------------
-- 6. RLS en tablas nuevas
-- -------------------------------------------------------------

ALTER TABLE public.video_renders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_editor_subscriptions ENABLE ROW LEVEL SECURITY;

-- Admins ven y modifican todo en video_renders
CREATE POLICY IF NOT EXISTS "admins_all_renders"
  ON public.video_renders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Cada user ve y modifica sus propios renders
CREATE POLICY IF NOT EXISTS "users_own_renders"
  ON public.video_renders FOR ALL
  USING (user_id = auth.uid());

-- Empresas ven renders de su empresa (solo lectura)
CREATE POLICY IF NOT EXISTS "empresa_renders"
  ON public.video_renders FOR SELECT
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- Admins ven y modifican todo en suscripciones
CREATE POLICY IF NOT EXISTS "admins_all_subscriptions"
  ON public.video_editor_subscriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Cada user ve y modifica su propia suscripción
CREATE POLICY IF NOT EXISTS "users_own_subscription"
  ON public.video_editor_subscriptions FOR ALL
  USING (user_id = auth.uid());

-- -------------------------------------------------------------
-- 7. Función helper: get_user_empresa_id()
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_user_empresa_id()
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT empresa_id FROM public.profiles WHERE id = auth.uid();
$$;

-- -------------------------------------------------------------
-- 8. Índices para performance
-- -------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_videos_empresa_id
  ON public.videos(empresa_id);

CREATE INDEX IF NOT EXISTS idx_projects_empresa_id
  ON public.projects(empresa_id);

CREATE INDEX IF NOT EXISTS idx_assets_empresa_id
  ON public.assets(empresa_id);

CREATE INDEX IF NOT EXISTS idx_content_ideas_empresa_id
  ON public.content_ideas(empresa_id);

CREATE INDEX IF NOT EXISTS idx_hooks_empresa_id
  ON public.hooks(empresa_id);

CREATE INDEX IF NOT EXISTS idx_video_renders_user_id
  ON public.video_renders(user_id);

CREATE INDEX IF NOT EXISTS idx_video_renders_empresa_id
  ON public.video_renders(empresa_id);

CREATE INDEX IF NOT EXISTS idx_video_renders_status
  ON public.video_renders(status);

CREATE INDEX IF NOT EXISTS idx_video_renders_project_id
  ON public.video_renders(project_id);

CREATE INDEX IF NOT EXISTS idx_video_editor_subscriptions_user_id
  ON public.video_editor_subscriptions(user_id);
