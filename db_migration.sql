-- Migration to support new Trackers features
-- Run this in your Supabase SQL Editor

-- 1. Add 'remarks' to students table if not exists
alter table students 
add column if not exists remarks text;

-- 2. Add 'teacher_id' to syllabus_tracker to support per-teacher tracking
alter table syllabus_tracker 
add column if not exists teacher_id uuid references teachers(id) on delete set null;

-- 3. Update sample data for syllabus_tracker to link teachers (Optional)
-- This logic assumes you have teachers and chapters already.
-- Example: update syllabus_tracker set teacher_id = (select id from teachers limit 1) where teacher_id is null;
