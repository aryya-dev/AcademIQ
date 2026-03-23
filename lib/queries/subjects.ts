import { supabase } from '@/lib/supabase';
import type { Subject } from '@/types';

export async function getSubjects() {
  const { data, error } = await supabase.from('subjects').select('*').order('name');
  if (error) throw error;
  return data as Subject[];
}

export async function createSubject(name: string) {
  const { data, error } = await supabase
    .from('subjects').insert({ name }).select().single();
  if (error) throw error;
  return data as Subject;
}

export async function deleteSubject(id: string) {
  const { error } = await supabase.from('subjects').delete().eq('id', id);
  if (error) throw error;
}
