import { supabase } from '@/lib/supabase';
import type { Test, TestMark } from '@/types';

export async function getTests(batchId?: string) {
  let query = supabase
    .from('tests')
    .select('*, subjects(*), batches(*)')
    .order('scheduled_date', { ascending: false });
  if (batchId) query = query.eq('batch_id', batchId);
  const { data, error } = await query;
  if (error) throw error;
  return data as Test[];
}

export async function createTest(test: Omit<Test, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('tests').insert(test).select('*, subjects(*), batches(*)').single();
  if (error) throw error;
  return data as Test;
}

export async function updateTest(id: string, updates: Partial<Test>) {
  const { data, error } = await supabase
    .from('tests').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as Test;
}

export async function deleteTest(id: string) {
  const { error } = await supabase.from('tests').delete().eq('id', id);
  if (error) throw error;
}

export async function getTestMarks(testId: string) {
  const { data, error } = await supabase
    .from('test_marks')
    .select('*, students(*)')
    .eq('test_id', testId);
  if (error) throw error;
  return data as TestMark[];
}

export async function upsertTestMarks(marks: { test_id: string; student_id: string; marks_obtained: number; evaluated_at?: string }[]) {
  const { data, error } = await supabase
    .from('test_marks')
    .upsert(marks, { onConflict: 'test_id,student_id' })
    .select();
  if (error) throw error;
  return data;
}

export async function getStudentMarks(studentId: string) {
  const { data, error } = await supabase
    .from('test_marks')
    .select('*, tests(title, type, max_marks, subjects(name))')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getBatchTestMarks(batchId: string) {
  const { data, error } = await supabase
    .from('test_marks')
    .select('*, tests!inner(batch_id, max_marks)')
    .eq('tests.batch_id', batchId);
  if (error) throw error;
  return data || [];
}

export async function getOverdueEvaluations() {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('tests')
    .select('*, subjects(*), batches(*)')
    .lt('eval_deadline', today)
    .is('answer_key_shared', false);
  if (error) throw error;
  return data as Test[];
}

export async function getAllTestMarks() {
  const { data, error } = await supabase
    .from('test_marks')
    .select('*, students(*), tests(*, subjects(*), batches(*))');
  if (error) throw error;
  return data || [];
}
