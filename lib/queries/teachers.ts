import { supabase } from '@/lib/supabase';
import type { Teacher } from '@/types';

export async function getTeachers() {
  const { data, error } = await supabase.from('teachers').select('*').order('name');
  if (error) throw error;
  return data as Teacher[];
}

export async function createTeacher(teacher: Omit<Teacher, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('teachers').insert(teacher).select().single();
  if (error) throw error;
  return data as Teacher;
}

export async function updateTeacher(id: string, updates: Partial<Teacher>) {
  const { data, error } = await supabase
    .from('teachers').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as Teacher;
}

export async function deleteTeacher(id: string) {
  const { error } = await supabase.from('teachers').delete().eq('id', id);
  if (error) throw error;
}

export async function getTeachersBySubject(subjectId: string) {
  const { data, error } = await supabase
    .from('teacher_subjects')
    .select('*, teachers(*)')
    .eq('subject_id', subjectId);
  if (error) throw error;
  return (data || []).map((d: any) => d.teachers) as Teacher[];
}

// ------------------------------------------------------------------
// EXTENDED PROFILE QUERIES
// ------------------------------------------------------------------

export async function getTeachersWithDetails() {
  const { data, error } = await supabase
    .from('teachers')
    .select(`
      *,
      teacher_subjects(subject_id, subjects(*)),
      teacher_batches(batch_id, batches(*))
    `)
    .order('name');
  if (error) throw error;
  return data as Teacher[];
}

export async function getTeacherById(id: string) {
  const { data, error } = await supabase
    .from('teachers')
    .select(`
      *,
      teacher_subjects(subject_id, subjects(*)),
      teacher_batches(batch_id, batches(*))
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Teacher;
}

// Subject Assignment
export async function assignSubjectToTeacher(teacherId: string, subjectId: string) {
  const { error } = await supabase
    .from('teacher_subjects')
    .insert({ teacher_id: teacherId, subject_id: subjectId });
  if (error) throw error;
}

export async function removeSubjectFromTeacher(teacherId: string, subjectId: string) {
  const { error } = await supabase
    .from('teacher_subjects')
    .delete()
    .eq('teacher_id', teacherId)
    .eq('subject_id', subjectId);
  if (error) throw error;
}

// Batch Assignment
export async function assignBatchToTeacher(teacherId: string, batchId: string) {
  const { error } = await supabase
    .from('teacher_batches')
    .insert({ teacher_id: teacherId, batch_id: batchId });
  if (error) throw error;
}

export async function removeBatchFromTeacher(teacherId: string, batchId: string) {
  const { error } = await supabase
    .from('teacher_batches')
    .delete()
    .eq('teacher_id', teacherId)
    .eq('batch_id', batchId);
  if (error) throw error;
}
export async function getUnlinkedTeachers() {
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .not('id', 'in', 
      supabase.from('profiles').select('teacher_id').filter('teacher_id', 'not.is', null)
    )
    .order('name');
  
  // Alternative simpler approach if the above nested filter is tricky with current supabase-js:
  // Just fetch all teachers and all profiles and filter in JS if needed, but let's try a better SQL way.
  
  const { data: linkedIds } = await supabase.from('profiles').select('teacher_id').not('teacher_id', 'is', null);
  const ids = (linkedIds || []).map((l: { teacher_id: string | null }) => l.teacher_id);
  
  const { data: unlinked } = await supabase
    .from('teachers')
    .select('*')
    .not('id', 'in', `(${ids.join(',') || '00000000-0000-0000-0000-000000000000'})`)
    .order('name');

  return unlinked as Teacher[];
}
