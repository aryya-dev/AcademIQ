-- Add profiles table if it-- Profiles for RBAC (links auth.users to system roles)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text check (role in ('admin', 'teacher')),
  sub_role text check (sub_role in ('king', 'queen', 'knight', 'mentor')),
  assigned_class text,
  teacher_id uuid references teachers(id) on delete set null,
  mentor_id uuid references mentors(id) on delete set null,
  created_at timestamptz default now()
);

-- Add teacher_announcements table
create table if not exists teacher_announcements (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references teachers(id) on delete cascade,
  batch_id uuid references batches(id) on delete cascade,
  subject_id uuid references subjects(id) on delete cascade,
  type text not null check (type in ('cw', 'hw', 'exam', 'announcement')),
  content text not null,
  created_at timestamptz default now()
);

-- ----------------------------------------------------------------
-- RLS POLICIES (Supabase Fix)
-- ----------------------------------------------------------------

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can see and manage their OWN profile
DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;
CREATE POLICY "Users can manage their own profile" 
ON profiles FOR ALL 
USING (auth.uid() = id);

-- Teachers: Allow authenticated users to see the list (for signup/selection)
DROP POLICY IF EXISTS "Anyone can view teacher list" ON teachers;
CREATE POLICY "Anyone can view teacher list" 
ON teachers FOR SELECT 
TO public
USING (true);

-- ----------------------------------------------------------------
-- SELF-ONBOARDING (RUN THIS ONCE WITH YOUR ID)
-- ----------------------------------------------------------------
-- 1. Go to Supabase Auth and copy your User ID (UUID)
-- 2. Uncomment and run the lines below (replace YOUR_USER_ID)

-- INSERT INTO profiles (id, full_name, role, sub_role)
-- VALUES ('YOUR_USER_ID', 'Admin', 'admin', 'king')
-- ON CONFLICT (id) DO UPDATE SET role = 'admin', sub_role = 'king';
