-- ==============================================================================
-- VERA SOCIAL PROGRESS PLATFORM — PROGRESS, MILESTONE, PROOF & TIMELINE
-- Migration: 20260908_vera_progress_system.sql
-- Target: Supabase Database (PostgreSQL 15+)
-- ==============================================================================

-- 1. EXTENSIONS & ENUMS
DO $$ BEGIN
    CREATE TYPE progress_status AS ENUM ('active', 'paused', 'completed', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE item_visibility AS ENUM ('public', 'followers', 'private');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE proof_type AS ENUM ('github', 'website', 'certificate', 'image', 'video', 'document', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE proof_status AS ENUM ('unverified', 'verified', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. FOLLOWERS RELATIONSHIP TABLE (If not already present)
CREATE TABLE IF NOT EXISTS public.follows (
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

CREATE OR REPLACE FUNCTION public.is_follower(p_user_id UUID, p_target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.follows
        WHERE follower_id = p_user_id AND following_id = p_target_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. PROGRESSES TABLE
CREATE TABLE IF NOT EXISTS public.progresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'Other',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    status progress_status NOT NULL DEFAULT 'active',
    visibility item_visibility NOT NULL DEFAULT 'public',
    cover_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT chk_progress_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

-- 4. MILESTONES TABLE
CREATE TABLE IF NOT EXISTS public.milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    progress_id UUID NOT NULL REFERENCES public.progresses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    milestone_date DATE NOT NULL DEFAULT CURRENT_DATE,
    media_url TEXT,
    visibility item_visibility NOT NULL DEFAULT 'public',
    is_shared_to_feed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 5. PROOFS TABLE
CREATE TABLE IF NOT EXISTS public.proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id UUID REFERENCES public.milestones(id) ON DELETE SET NULL,
    progress_id UUID REFERENCES public.progresses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type proof_type NOT NULL DEFAULT 'other',
    title VARCHAR(200) NOT NULL,
    description TEXT,
    external_url TEXT,
    media_url TEXT,
    visibility item_visibility NOT NULL DEFAULT 'public',
    verification_status proof_status NOT NULL DEFAULT 'unverified',
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 6. INDEXES FOR HIGH-THROUGHPUT QUERIES
CREATE INDEX IF NOT EXISTS idx_progresses_user_status ON public.progresses(user_id, status);
CREATE INDEX IF NOT EXISTS idx_progresses_visibility ON public.progresses(visibility);
CREATE INDEX IF NOT EXISTS idx_progresses_deleted_at ON public.progresses(deleted_at);

CREATE INDEX IF NOT EXISTS idx_milestones_progress_date ON public.milestones(progress_id, milestone_date DESC);
CREATE INDEX IF NOT EXISTS idx_milestones_user ON public.milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_deleted_at ON public.milestones(deleted_at);

CREATE INDEX IF NOT EXISTS idx_proofs_milestone ON public.proofs(milestone_id);
CREATE INDEX IF NOT EXISTS idx_proofs_progress ON public.proofs(progress_id);
CREATE INDEX IF NOT EXISTS idx_proofs_user ON public.proofs(user_id);
CREATE INDEX IF NOT EXISTS idx_proofs_verification ON public.proofs(verification_status);
CREATE INDEX IF NOT EXISTS idx_proofs_deleted_at ON public.proofs(deleted_at);

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proofs ENABLE ROW LEVEL SECURITY;

-- Follows RLS
CREATE POLICY "Public read follows" ON public.follows
    FOR SELECT USING (true);

CREATE POLICY "Users manage own follows" ON public.follows
    FOR ALL USING (auth.uid() = follower_id);

-- Progresses RLS
CREATE POLICY "View progresses by visibility" ON public.progresses
    FOR SELECT USING (
        deleted_at IS NULL AND (
            auth.uid() = user_id
            OR public.is_staff(auth.uid())
            OR visibility = 'public'
            OR (visibility = 'followers' AND public.is_follower(auth.uid(), user_id))
        )
    );

CREATE POLICY "Users create own progress" ON public.progresses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own progress" ON public.progresses
    FOR UPDATE USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

CREATE POLICY "Users delete own progress" ON public.progresses
    FOR DELETE USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

-- Milestones RLS
CREATE POLICY "View milestones by visibility" ON public.milestones
    FOR SELECT USING (
        deleted_at IS NULL AND (
            auth.uid() = user_id
            OR public.is_staff(auth.uid())
            OR visibility = 'public'
            OR (visibility = 'followers' AND public.is_follower(auth.uid(), user_id))
        )
    );

CREATE POLICY "Users create own milestone" ON public.milestones
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own milestone" ON public.milestones
    FOR UPDATE USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

CREATE POLICY "Users delete own milestone" ON public.milestones
    FOR DELETE USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

-- Proofs RLS
CREATE POLICY "View proofs by visibility" ON public.proofs
    FOR SELECT USING (
        deleted_at IS NULL AND (
            auth.uid() = user_id
            OR public.is_staff(auth.uid())
            OR visibility = 'public'
            OR (visibility = 'followers' AND public.is_follower(auth.uid(), user_id))
        )
    );

CREATE POLICY "Users create own proof" ON public.proofs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users or Staff update proof" ON public.proofs
    FOR UPDATE USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

CREATE POLICY "Users delete own proof" ON public.proofs
    FOR DELETE USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

-- 8. RBAC PERMISSIONS FOR PROGRESS & PROOFS
INSERT INTO public.permissions (id, description, category) VALUES
('proofs.view', 'View proof verification queue and evidence submissions', 'proofs'),
('proofs.verify', 'Approve and grant verified status to submitted proofs', 'proofs'),
('proofs.reject', 'Reject proof submissions with administrative feedback', 'proofs'),
('progress.moderate', 'Moderate, hide, or restore progress journeys and milestones', 'progress')
ON CONFLICT (id) DO NOTHING;

-- Grant permissions to MODERATOR, ADMIN, SUPER_ADMIN
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
('MODERATOR', 'proofs.view'),
('MODERATOR', 'proofs.verify'),
('MODERATOR', 'proofs.reject'),
('MODERATOR', 'progress.moderate'),
('ADMIN', 'proofs.view'),
('ADMIN', 'proofs.verify'),
('ADMIN', 'proofs.reject'),
('ADMIN', 'progress.moderate'),
('SUPER_ADMIN', 'proofs.view'),
('SUPER_ADMIN', 'proofs.verify'),
('SUPER_ADMIN', 'proofs.reject'),
('SUPER_ADMIN', 'progress.moderate')
ON CONFLICT (role_id, permission_id) DO NOTHING;
