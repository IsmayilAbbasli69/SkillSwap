-- ==============================================================================
-- SkillSwap Database Schema for Supabase PostgreSQL
-- Run this script in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. Authentication identities are owned by Supabase Auth (auth.users).

-- 2. Institutions (Universities / Organizations)
CREATE TABLE IF NOT EXISTS public.institutions (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Institution Units (Faculties / Departments / Schools)
CREATE TABLE IF NOT EXISTS public.institution_units (
  id UUID PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Profiles (User application profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES public.institution_units(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  department TEXT,
  academic_year INT,
  role TEXT DEFAULT 'STUDENT',
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Skills (Catalog of available skills)
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. User Skills (Offered and Wanted skills for each user profile)
CREATE TABLE IF NOT EXISTS public.user_skills (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('OFFER', 'WANT')),
  level TEXT CHECK (level IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, skill_id, type)
);

-- 7. Swap Requests (Skill exchange proposals between users)
CREATE TABLE IF NOT EXISTS public.swap_requests (
  id UUID PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  offered_skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Sessions (Scheduled skill swapping sessions)
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY,
  swap_request_id UUID NOT NULL REFERENCES public.swap_requests(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration INT NOT NULL,
  meeting_type TEXT NOT NULL,
  meeting_url TEXT,
  location_note TEXT,
  status TEXT DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Reviews (Feedback and ratings after session completion)
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, reviewer_id)
);

-- ==============================================================================
-- MIGRATION: If tables already exist, run these ALTER statements
-- (Only needed if you created the schema BEFORE v1.1)
-- ==============================================================================
-- ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS meeting_url TEXT;
-- ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS location_note TEXT;

