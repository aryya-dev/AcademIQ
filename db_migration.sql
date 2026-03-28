
-- ----------------------------------------------------------------
-- TEACHER BATCHES
-- ----------------------------------------------------------------
create table if not exists teacher_batches (
  teacher_id uuid not null references teachers(id) on delete cascade,
  batch_id uuid not null references batches(id) on delete cascade,
  primary key (teacher_id, batch_id)
);
