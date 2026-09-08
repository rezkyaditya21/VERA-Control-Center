-- ==============================================================================
-- VERA PLATFORM — SOCIAL FOLLOW, COMMENTS & PROFILE SYNC MIGRATION
-- Run this migration in Supabase SQL Editor if policies need to be ensured
-- ==============================================================================

-- 1. Ensure columns on profiles
ALTER TABLE IF EXISTS public.profiles 
    ADD COLUMN IF NOT EXISTS specialty VARCHAR(100) DEFAULT 'Penimbang Komunitas',
    ADD COLUMN IF NOT EXISTS followers_count INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS following_count INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- 2. Ensure follows table exists
CREATE TABLE IF NOT EXISTS public.follows (
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

-- 3. Ensure comments table exists
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    target_id TEXT, -- supports flexible room/experience/product IDs
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    author_name VARCHAR(100) NOT NULL,
    author_avatar TEXT,
    content TEXT NOT NULL,
    usage_duration VARCHAR(50),
    sentiment VARCHAR(20) DEFAULT 'netral',
    verified_owner BOOLEAN DEFAULT FALSE,
    likes_count INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'published',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 5. Policies for Follows
DROP POLICY IF EXISTS "Public read follows" ON public.follows;
CREATE POLICY "Public read follows" ON public.follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users insert follows" ON public.follows;
CREATE POLICY "Authenticated users insert follows" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users delete follows" ON public.follows;
CREATE POLICY "Authenticated users delete follows" ON public.follows FOR DELETE USING (auth.uid() = follower_id OR auth.uid() IS NOT NULL);

-- 6. Policies for Comments
DROP POLICY IF EXISTS "Public read comments" ON public.comments;
CREATE POLICY "Public read comments" ON public.comments FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Public insert comments" ON public.comments;
CREATE POLICY "Public insert comments" ON public.comments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update comments" ON public.comments;
CREATE POLICY "Public update comments" ON public.comments FOR UPDATE USING (true);
