import { supabase } from '@/lib/supabase';
import type { Enrollment } from '@/types';

export async function getEnrollments() {
  const { data, error } = await supabase
    .from('enrollments')
    .select('*, students(*), batches(*), subjects(*), teachers(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createEnrollment(enrollment: Omit<Enrollment, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('enrollments')
    .insert(enrollment)
    .select('*, students(*), batches(*), subjects(*), teachers(*)')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEnrollment(id: string) {
  const { error } = await supabase.from('enrollments').delete().eq('id', id);
  if (error) throw error;
}

export async function updateEnrollment(id: string, updates: Partial<Enrollment>) {
  const { data, error } = await supabase
    .from('enrollments')
    .update(updates)
    .eq('id', id)
    .select('*, students(*), batches(*), subjects(*), teachers(*)')
    .single();
  if (error) throw error;
  return data;
}

export async function getEnrollmentsByStudent(studentId: string) {
  const { data, error } = await supabase
    .from('enrollments')
    .select('*, batches(*), subjects(*), teachers(*)')
    .eq('student_id', studentId);
  if (error) throw error;
  return data || [];
}

export async function getEnrollmentsByBatch(batchId: string) {
  const { data, error } = await supabase
    .from('enrollments')
    .select('*, students(*), subjects(*), teachers(*)')
    .eq('batch_id', batchId);
  if (error) throw error;
  return data || [];
}
