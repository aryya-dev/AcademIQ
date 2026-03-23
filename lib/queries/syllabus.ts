import { supabase } from '@/lib/supabase';
import type { SyllabusTracker } from '@/types';

export async function getSyllabus(subjectId?: string, batchId?: string) {
  let query = supabase
    .from('syllabus_tracker')
    .select('*, subjects(*), batches(*)')
    .order('created_at');
  if (subjectId) query = query.eq('subject_id', subjectId);
  if (batchId) query = query.eq('batch_id', batchId);
  const { data, error } = await query;
  if (error) throw error;
  return data as SyllabusTracker[];
}

export async function addSyllabusChapter(entry: Omit<SyllabusTracker, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('syllabus_tracker')
    .insert(entry)
    .select('*, subjects(*), batches(*)')
    .single();
  if (error) throw error;
  return data as SyllabusTracker;
}

export async function updateSyllabusStatus(id: string, status: SyllabusTracker['status'], completedDate?: string) {
  const updates: Partial<SyllabusTracker> = { status };
  if (completedDate) updates.completed_date = completedDate;
  const { data, error } = await supabase
    .from('syllabus_tracker')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as SyllabusTracker;
}

export async function deleteSyllabusChapter(id: string) {
  const { error } = await supabase.from('syllabus_tracker').delete().eq('id', id);
  if (error) throw error;
}

export async function getSyllabusCompletionPct(subjectId: string, batchId: string) {
  const { data, error } = await supabase
    .from('syllabus_tracker')
    .select('status')
    .eq('subject_id', subjectId)
    .eq('batch_id', batchId);
  if (error) throw error;
  if (!data || data.length === 0) return 0;
  const done = data.filter((r: any) => r.status === 'completed').length;
  return Math.round((done / data.length) * 100);
}
