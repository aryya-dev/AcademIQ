import { supabase } from '@/lib/supabase';
import type { Batch } from '@/types';

export async function getBatches() {
  const { data, error } = await supabase.from('batches').select('*').order('name');
  if (error) throw error;
  return data as Batch[];
}

export async function getBatchById(id: string) {
  const { data, error } = await supabase
    .from('batches').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Batch;
}

export async function createBatch(batch: Omit<Batch, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('batches').insert(batch).select().single();
  if (error) throw error;
  return data as Batch;
}

export async function updateBatch(id: string, updates: Partial<Batch>) {
  const { data, error } = await supabase
    .from('batches').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as Batch;
}

export async function deleteBatch(id: string) {
  const { error } = await supabase.from('batches').delete().eq('id', id);
  if (error) throw error;
}

export async function getBatchStudentCount(batchId: string) {
  const { data, error } = await supabase
    .from('enrollments')
    .select('student_id')
    .eq('batch_id', batchId);
  if (error) throw error;
  
  const uniqueStudents = new Set((data || []).map((d: any) => d.student_id));
  return uniqueStudents.size;
}

export async function getStudentsInBatch(batchId: string) {
  const { data, error } = await supabase
    .from('enrollments')
    .select('students(*), subjects(*), teachers(*), role')
    .eq('batch_id', batchId);
  if (error) throw error;
  return data || [];
}
