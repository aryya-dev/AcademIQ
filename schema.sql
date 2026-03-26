-- ================================================================
-- ACADEMIC MANAGEMENT SYSTEM - DATABASE SCHEMA (v2 - with Relations)
-- Run this in Supabase SQL Editor to enable joins and RPC features
-- ================================================================

-- ----------------------------------------------------------------
-- CORE ENTITIES
-- ----------------------------------------------------------------

create table if not exists mentors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  created_at timestamptz default now()
);

create table if not exists teachers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  created_at timestamptz default now()
);

create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

-- Mapping for which teachers teach which subjects
create table if not exists teacher_subjects (
  teacher_id uuid not null references teachers(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  primary key (teacher_id, subject_id)
);

create table if not exists batches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  class text not null,
  created_at timestamptz default now()
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  class text not null,
  school_name text,
  parent_phone text,
  status text default 'active',
  mentor_id uuid references mentors(id) on delete set null,
  created_at timestamptz default now()
);

-- ----------------------------------------------------------------
-- ENROLLMENT ENGINE
-- ----------------------------------------------------------------

create table if not exists enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  batch_id uuid not null references batches(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  teacher_id uuid references teachers(id) on delete cascade,   -- nullable for now
  role text default 'primary',
  created_at timestamptz default now()
);

-- ----------------------------------------------------------------
-- ATTENDANCE
-- ----------------------------------------------------------------

create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  batch_id uuid not null references batches(id) on delete cascade,
  date date not null,
  status text not null default 'present',
  created_at timestamptz default now(),
  unique(student_id, subject_id, date)
);

-- ----------------------------------------------------------------
-- TESTS
-- ----------------------------------------------------------------

create table if not exists tests (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  batch_id uuid not null references batches(id) on delete cascade,
  type text not null,
  title text not null,
  scheduled_date date not null,
  eval_deadline date not null,
  max_marks numeric not null default 100,
  answer_key_shared boolean default false,
  mistakes_discussed boolean default false,
  created_at timestamptz default now()
);

create table if not exists test_marks (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references tests(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  marks_obtained numeric,
  evaluated_at timestamptz,
  created_at timestamptz default now(),
  unique(test_id, student_id)
);

-- ----------------------------------------------------------------
-- SYLLABUS TRACKER
-- ----------------------------------------------------------------

create table if not exists syllabus_tracker (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  batch_id uuid not null references batches(id) on delete cascade,
  chapter text not null,
  status text default 'pending',
  completed_date date,
  created_at timestamptz default now()
);

-- ----------------------------------------------------------------
-- SCHOOL TERM SYLLABUS
-- ----------------------------------------------------------------

create table if not exists school_term_syllabus (
  id uuid primary key default gen_random_uuid(),
  school_name text not null,
  class text not null,
  subject_id uuid not null references subjects(id) on delete cascade,
  term text not null, -- 'UT-1', 'Half Yearly', 'UT-2', 'Annual Term'
  syllabus text,
  exam_date date,
  created_at timestamptz default now(),
  unique(school_name, class, subject_id, term)
);

create table if not exists school_exam_marks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  term text not null, -- 'UT-1', 'Half Yearly', 'UT-2', 'Annual'
  physics numeric,
  chemistry numeric,
  math numeric,
  biology numeric,
  computer numeric,
  created_at timestamptz default now(),
  unique(student_id, term)
);

-- ----------------------------------------------------------------
-- PARENT COMMUNICATION
-- ----------------------------------------------------------------

create table if not exists parent_communication_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  mentor_id uuid not null references mentors(id) on delete cascade,
  contacted_at timestamptz not null,
  notes text,
  created_at timestamptz default now()
);

-- ----------------------------------------------------------------
-- MENTORING MESSAGES
-- ----------------------------------------------------------------

create table if not exists mentoring_messages (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references mentors(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  message_date date not null,
  type text not null,
  content text,
  created_at timestamptz default now()
);

-- ----------------------------------------------------------------
-- MERIT / DEMERIT LOGS
-- ----------------------------------------------------------------

create table if not exists merit_demerit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null,
  actor_type text not null,
  reason text not null,
  points integer not null,
  created_at timestamptz default now()
);

-- ----------------------------------------------------------------
-- RPC FUNCTIONS
-- ----------------------------------------------------------------

create or replace function get_weak_students(threshold numeric)
returns setof students
language sql
as $$
  select * from students
  where id in (
    select student_id
    from test_marks m
    join tests t on m.test_id = t.id
    group by student_id
    having avg((m.marks_obtained / t.max_marks) * 100) < threshold
  )
  and status = 'active';
$$;

-- ----------------------------------------------------------------
-- SEED DATA
-- ----------------------------------------------------------------

insert into subjects (name) values
  ('Mathematics'), ('Physics'), ('Chemistry'), ('Biology'), ('Computer')
on conflict (name) do nothing;

insert into batches (name, class) values
  ('11 JEE A', '11'), ('11 JEE B', '11'), ('11 NEET', '11'), ('11 Boards', '11'),
  ('12 JEE A', '12'), ('12 JEE B', '12'), ('12 NEET', '12'), ('12 Boards', '12')
on conflict do nothing;

insert into mentors (id, name, email) values
  ('00000000-0000-0000-0000-000000000001', 'Head Mentor', 'mentor@example.com')
on conflict (id) do nothing;

-- Seed Teachers (Names from the user request)
insert into teachers (name)
values
  ('Arghya Sir'), ('Shanku Sir'), ('Kanchan Sir'),
  ('Nilanjan Sir'), ('Binayak Sir'), ('Shouvik Sir'),
  ('Avi Sir'), ('Payel Ma''am'),
  ('Arnick Sir'), ('Suvankar Sir'),
  ('Nirmala Ma''am')
on conflict do nothing;

-- Mapping teachers to subjects (Manual insertion based on names)
insert into teacher_subjects (teacher_id, subject_id)
select t.id, s.id from teachers t, subjects s
where (t.name = 'Arghya Sir' and s.name in ('Physics', 'Mathematics'))
   or (t.name = 'Shanku Sir' and s.name = 'Physics')
   or (t.name = 'Kanchan Sir' and s.name = 'Physics')
   or (t.name = 'Nilanjan Sir' and s.name = 'Chemistry')
   or (t.name = 'Binayak Sir' and s.name = 'Chemistry')
   or (t.name = 'Shouvik Sir' and s.name = 'Chemistry')
   or (t.name = 'Avi Sir' and s.name = 'Biology')
   or (t.name = 'Payel Ma''am' and s.name = 'Biology')
   or (t.name = 'Arnick Sir' and s.name = 'Mathematics')
   or (t.name = 'Suvankar Sir' and s.name = 'Mathematics')
   or (t.name = 'Nirmala Ma''am' and s.name = 'Computer')
on conflict do nothing;
