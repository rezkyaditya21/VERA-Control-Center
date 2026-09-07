-- ==============================================================================
-- VERA SOCIAL DECISION PLATFORM & CONTROL CENTER DATABASE SCHEMA
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
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'users.suspend', 'posts.hide'
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

-- 5. DECISION ROOMS (POSTS)
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

-- Candidates inside Decision Rooms
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

-- 6. OPINIONS & COMMENTS
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    usage_duration VARCHAR(50),
    sentiment VARCHAR(20) DEFAULT 'netral', -- 'positif', 'negatif', 'netral'
    verified_owner BOOLEAN DEFAULT FALSE,
    likes_count INT DEFAULT 0,
    status content_status DEFAULT 'published',
    removal_reason TEXT,
    removed_by UUID REFERENCES public.profiles(id),
    removed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. DETAILED VERIFIED EXPERIENCES
CREATE TABLE IF NOT EXISTS public.user_experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_name VARCHAR(100) NOT NULL,
    usage_duration VARCHAR(50) NOT NULL,
    outcome_status VARCHAR(50) NOT NULL, -- e.g. '100% Sesuai Ekspektasi', 'Puas', 'Kecewa'
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

-- 8. REPORT SYSTEM
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_type VARCHAR(30) NOT NULL, -- 'user', 'post', 'comment', 'experience'
    target_id UUID NOT NULL,
    reason VARCHAR(50) NOT NULL, -- 'spam', 'harassment', 'hate', 'scam', 'sexual_content', 'violence', 'misinformation', 'impersonation', 'other'
    details TEXT,
    evidence_urls JSONB DEFAULT '[]'::jsonb,
    priority report_priority DEFAULT 'medium',
    status report_status DEFAULT 'pending',
    assigned_to UUID REFERENCES public.profiles(id),
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. MODERATION ACTIONS (AUDIT ENFORCEMENT)
CREATE TABLE IF NOT EXISTS public.moderation_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id),
    target_type VARCHAR(30) NOT NULL,
    target_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'warn', 'hide_post', 'delete_post', 'restore_post', 'suspend_user', 'ban_user', 'restore_user', 'delete_comment'
    reason TEXT NOT NULL,
    duration_hours INT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. VERIFICATION REQUESTS
CREATE TABLE IF NOT EXISTS public.verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    verification_type VARCHAR(50) NOT NULL, -- 'purchase_invoice', 'product_serial', 'id_card', 'creator'
    title VARCHAR(150) NOT NULL,
    submitted_info JSONB DEFAULT '{}'::jsonb,
    document_urls JSONB DEFAULT '[]'::jsonb,
    status verification_status DEFAULT 'pending',
    reviewer_id UUID REFERENCES public.profiles(id),
    reviewer_notes TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

-- 11. IMMUTABLE ADMIN AUDIT LOGS
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

-- 12. SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS public.system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES public.profiles(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PERFORMANCE INDEXES (High-throughput query optimization)
CREATE INDEX IF NOT EXISTS idx_posts_status_created ON public.posts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts(category);
CREATE INDEX IF NOT EXISTS idx_reports_status_created ON public.reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_status ON public.comments(post_id, status);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_verifications_status ON public.verifications(status);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created ON public.admin_audit_logs(created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

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

-- Helper security functions
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

-- Profiles: Public can read active profiles; Staff can read all; Users can update own profile
CREATE POLICY "Public read active profiles" ON public.profiles
    FOR SELECT USING (status = 'active' OR public.is_staff(auth.uid()));

CREATE POLICY "Users update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Posts: Public read published; Staff read all
CREATE POLICY "Public read published posts" ON public.posts
    FOR SELECT USING (status = 'published' OR public.is_staff(auth.uid()));

CREATE POLICY "Users insert own posts" ON public.posts
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Staff manage posts" ON public.posts
    FOR ALL USING (public.is_staff(auth.uid()));

-- Reports: Only staff or reporter can view
CREATE POLICY "Staff read all reports" ON public.reports
    FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "Users create reports" ON public.reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Staff update reports" ON public.reports
    FOR UPDATE USING (public.is_staff(auth.uid()));

-- Audit logs: Read-only for Admin / Super Admin, NO updates/deletes permitted
CREATE POLICY "Admins read audit logs" ON public.admin_audit_logs
    FOR SELECT USING (public.is_admin_or_super(auth.uid()));

CREATE POLICY "Staff insert audit logs" ON public.admin_audit_logs
    FOR INSERT WITH CHECK (public.is_staff(auth.uid()));

-- System settings: Staff can read, Admin/Super Admin can update
CREATE POLICY "Staff read settings" ON public.system_settings
    FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins update settings" ON public.system_settings
    FOR ALL USING (public.is_admin_or_super(auth.uid()));

-- ==============================================================================
-- DEFAULT SEED DATA
-- ==============================================================================

-- Seed Roles
INSERT INTO public.roles (id, name, description) VALUES
('USER', 'Regular User', 'Standard community member'),
('MODERATOR', 'Content Moderator', 'Can view, review reports, and moderate content'),
('ADMIN', 'Platform Administrator', 'Can manage users, settings, and view audit logs'),
('SUPER_ADMIN', 'Super Administrator', 'Full operational and administrative authority')
ON CONFLICT (id) DO NOTHING;

-- Seed Settings
INSERT INTO public.system_settings (key, value, description) VALUES
('platform_name', '"VERA Control Center"'::jsonb, 'Platform title'),
('registration_enabled', 'true'::jsonb, 'Allow new user registrations'),
('auto_moderation_threshold', '85'::jsonb, 'Risk percentage threshold to automatically flag content'),
('max_upload_size_mb', '10'::jsonb, 'Maximum proof photo upload size in MB'),
('maintenance_mode', 'false'::jsonb, 'Restrict platform to staff only')
ON CONFLICT (key) DO NOTHING;
