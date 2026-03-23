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
