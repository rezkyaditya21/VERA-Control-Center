-- ==============================================================================
-- VERA PLATFORM & CONTROL CENTER — MASTER UNIFIED DATABASE SCHEMA
-- PostgreSQL Schema with Row Level Security (RLS) and RBAC
-- Target: Supabase Database (PostgreSQL 15+)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'suspended', 'banned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE content_status AS ENUM ('published', 'under_review', 'hidden', 'removed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('pending', 'reviewing', 'resolved', 'dismissed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

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

-- 3. CORE PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    decision_score INT DEFAULT 50 CHECK (decision_score >= 0 AND decision_score <= 100),
    reputation_tier VARCHAR(20) DEFAULT 'Member',
    decisions_count INT DEFAULT 0,
    experiences_count INT DEFAULT 0,
    helpful_count INT DEFAULT 0,
    status user_status DEFAULT 'active',
    suspended_until TIMESTAMPTZ,
    ban_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ROLES AND PERMISSIONS (RBAC)
CREATE TABLE IF NOT EXISTS public.roles (
    id VARCHAR(30) PRIMARY KEY, -- 'USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'
    name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.permissions (
    id VARCHAR(50) PRIMARY KEY,
    description TEXT,
    category VARCHAR(30) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id VARCHAR(30) REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id VARCHAR(50) REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id VARCHAR(30) REFERENCES public.roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

-- 5. DECISION ROOMS & POSTS
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    min_budget NUMERIC(12, 2) DEFAULT 0,
    max_budget NUMERIC(12, 2) DEFAULT 0,
    priorities JSONB DEFAULT '[]'::jsonb,
    condition_preference VARCHAR(30) DEFAULT 'Tidak masalah',
    status content_status DEFAULT 'published',
    participants_count INT DEFAULT 0,
    experiences_count INT DEFAULT 0,
    answered_percentage INT DEFAULT 0,
    top_candidate_name VARCHAR(100),
    ai_risk_score INT DEFAULT 0,
    removal_reason TEXT,
    removed_by UUID REFERENCES public.profiles(id),
    removed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    brand VARCHAR(50),
    rank INT DEFAULT 1,
    match_percentage INT DEFAULT 0,
    price_range VARCHAR(100),
    image_url TEXT,
    suitability JSONB DEFAULT '{"pros": [], "cons": []}'::jsonb,
    scores JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    usage_duration VARCHAR(50),
    sentiment VARCHAR(20) DEFAULT 'netral',
    verified_owner BOOLEAN DEFAULT FALSE,
    likes_count INT DEFAULT 0,
    status content_status DEFAULT 'published',
    removal_reason TEXT,
    removed_by UUID REFERENCES public.profiles(id),
    removed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_name VARCHAR(100) NOT NULL,
    usage_duration VARCHAR(50) NOT NULL,
    outcome_status VARCHAR(50) NOT NULL,
    ratings JSONB DEFAULT '{}'::jsonb,
    review_text TEXT NOT NULL,
    proof_photos JSONB DEFAULT '[]'::jsonb,
    invoice_url TEXT,
    verification_status verification_status DEFAULT 'pending',
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    likes_count INT DEFAULT 0,
    status content_status DEFAULT 'published',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. REPORTS & MODERATION
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_type VARCHAR(30) NOT NULL, -- 'user', 'post', 'comment', 'experience', 'progress', 'milestone', 'proof'
    target_id UUID NOT NULL,
    reason VARCHAR(50) NOT NULL,
    details TEXT,
    evidence_urls JSONB DEFAULT '[]'::jsonb,
    priority report_priority DEFAULT 'medium',
    status report_status DEFAULT 'pending',
    assigned_to UUID REFERENCES public.profiles(id),
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.moderation_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id),
    target_type VARCHAR(30) NOT NULL,
    target_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    duration_hours INT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    verification_type VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    submitted_info JSONB DEFAULT '{}'::jsonb,
    document_urls JSONB DEFAULT '[]'::jsonb,
    status verification_status DEFAULT 'pending',
    reviewer_id UUID REFERENCES public.profiles(id),
    reviewer_notes TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id),
    admin_email VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    target_type VARCHAR(50),
    target_id VARCHAR(100),
    ip_address VARCHAR(50),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES public.profiles(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PROGRESS, MILESTONE, PROOF & TIMELINE SYSTEM
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

-- 8. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_posts_status_created ON public.posts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts(category);
CREATE INDEX IF NOT EXISTS idx_reports_status_created ON public.reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_status ON public.comments(post_id, status);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_verifications_status ON public.verifications(status);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created ON public.admin_audit_logs(created_at DESC);

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

-- 9. SECURITY HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.is_admin_or_super(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = p_user_id
        AND ur.role_id IN ('ADMIN', 'SUPER_ADMIN')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = p_user_id
        AND ur.role_id IN ('MODERATOR', 'ADMIN', 'SUPER_ADMIN')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proofs ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "Public read active profiles" ON public.profiles FOR SELECT USING (status = 'active' OR public.is_staff(auth.uid()));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Posts RLS
CREATE POLICY "Public read published posts" ON public.posts FOR SELECT USING (status = 'published' OR public.is_staff(auth.uid()));
CREATE POLICY "Users insert own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Staff manage posts" ON public.posts FOR ALL USING (public.is_staff(auth.uid()));

-- Reports RLS
CREATE POLICY "Staff read all reports" ON public.reports FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Users create reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Staff update reports" ON public.reports FOR UPDATE USING (public.is_staff(auth.uid()));

-- Audit Logs RLS
CREATE POLICY "Admins read audit logs" ON public.admin_audit_logs FOR SELECT USING (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Staff insert audit logs" ON public.admin_audit_logs FOR INSERT WITH CHECK (public.is_staff(auth.uid()));

-- Follows RLS
CREATE POLICY "Public read follows" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users manage own follows" ON public.follows FOR ALL USING (auth.uid() = follower_id);

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
CREATE POLICY "Users create own progress" ON public.progresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own progress" ON public.progresses FOR UPDATE USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Users delete own progress" ON public.progresses FOR DELETE USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

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
CREATE POLICY "Users create own milestone" ON public.milestones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own milestone" ON public.milestones FOR UPDATE USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Users delete own milestone" ON public.milestones FOR DELETE USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

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
CREATE POLICY "Users create own proof" ON public.proofs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users or Staff update proof" ON public.proofs FOR UPDATE USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Users delete own proof" ON public.proofs FOR DELETE USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

-- 11. DEFAULT SEED DATA
INSERT INTO public.roles (id, name, description) VALUES
('USER', 'Regular User', 'Standard community member'),
('MODERATOR', 'Content Moderator', 'Can view, review reports, and moderate content'),
('ADMIN', 'Platform Administrator', 'Can manage users, settings, and view audit logs'),
('SUPER_ADMIN', 'Super Administrator', 'Full operational and administrative authority')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.system_settings (key, value, description) VALUES
('platform_name', '"VERA Control Center"'::jsonb, 'Platform title'),
('registration_enabled', 'true'::jsonb, 'Allow new user registrations'),
('auto_moderation_threshold', '85'::jsonb, 'Risk percentage threshold to automatically flag content'),
('max_upload_size_mb', '10'::jsonb, 'Maximum proof photo upload size in MB'),
('maintenance_mode', 'false'::jsonb, 'Restrict platform to staff only')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.permissions (id, description, category) VALUES
('users.view', 'View user accounts', 'users'),
('users.suspend', 'Suspend user accounts', 'users'),
('users.ban', 'Ban user accounts', 'users'),
('users.restore', 'Restore user accounts', 'users'),
('posts.view', 'View posts', 'posts'),
('posts.hide', 'Hide posts', 'posts'),
('posts.delete', 'Delete posts', 'posts'),
('posts.restore', 'Restore posts', 'posts'),
('reports.view', 'View reports', 'reports'),
('reports.assign', 'Assign reports', 'reports'),
('reports.resolve', 'Resolve reports', 'reports'),
('proofs.view', 'View proof verification queue', 'proofs'),
('proofs.verify', 'Approve verified proofs', 'proofs'),
('proofs.reject', 'Reject proofs', 'proofs'),
('progress.moderate', 'Moderate progress journeys', 'progress')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id) VALUES
('MODERATOR', 'posts.view'),
('MODERATOR', 'posts.hide'),
('MODERATOR', 'reports.view'),
('MODERATOR', 'reports.resolve'),
('MODERATOR', 'proofs.view'),
('MODERATOR', 'proofs.verify'),
('MODERATOR', 'proofs.reject'),
('MODERATOR', 'progress.moderate'),
('ADMIN', 'users.view'),
('ADMIN', 'users.suspend'),
('ADMIN', 'users.ban'),
('ADMIN', 'users.restore'),
('ADMIN', 'posts.view'),
('ADMIN', 'posts.hide'),
('ADMIN', 'posts.delete'),
('ADMIN', 'posts.restore'),
('ADMIN', 'reports.view'),
('ADMIN', 'reports.assign'),
('ADMIN', 'reports.resolve'),
('ADMIN', 'proofs.view'),
('ADMIN', 'proofs.verify'),
('ADMIN', 'proofs.reject'),
('ADMIN', 'progress.moderate'),
('SUPER_ADMIN', 'users.view'),
('SUPER_ADMIN', 'users.suspend'),
('SUPER_ADMIN', 'users.ban'),
('SUPER_ADMIN', 'users.restore'),
('SUPER_ADMIN', 'posts.view'),
('SUPER_ADMIN', 'posts.hide'),
('SUPER_ADMIN', 'posts.delete'),
('SUPER_ADMIN', 'posts.restore'),
('SUPER_ADMIN', 'reports.view'),
('SUPER_ADMIN', 'reports.assign'),
('SUPER_ADMIN', 'reports.resolve'),
('SUPER_ADMIN', 'proofs.view'),
('SUPER_ADMIN', 'proofs.verify'),
('SUPER_ADMIN', 'proofs.reject'),
('SUPER_ADMIN', 'progress.moderate')
ON CONFLICT (role_id, permission_id) DO NOTHING;
