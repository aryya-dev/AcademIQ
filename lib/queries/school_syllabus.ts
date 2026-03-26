import { supabase } from '@/lib/supabase';
import type { SchoolTermSyllabus } from '@/types';

export async function getSchoolTermSyllabus(classFilter?: string, subjectId?: string) {
  let query = supabase
    .from('school_term_syllabus')
    .select('*, subjects(*)');

  if (classFilter) {
    query = query.eq('class', classFilter);
  }
  if (subjectId) {
    query = query.eq('subject_id', subjectId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as SchoolTermSyllabus[];
}

export async function getSchoolTermSyllabusBySchool(schoolName: string, classFilter: string) {
  const { data, error } = await supabase
    .from('school_term_syllabus')
    .select('*, subjects(*)')
    .eq('school_name', schoolName)
    .eq('class', classFilter);

  if (error) throw error;
  return data as SchoolTermSyllabus[];
}

export async function upsertSchoolTermSyllabus(entry: Omit<SchoolTermSyllabus, 'id' | 'created_at'>) {
  // Try to find if it exists
  const { data: existing } = await supabase
    .from('school_term_syllabus')
    .select('id')
    .eq('school_name', entry.school_name)
    .eq('class', entry.class)
    .eq('subject_id', entry.subject_id)
    .eq('term', entry.term)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from('school_term_syllabus')
      .update({ syllabus: entry.syllabus, exam_date: entry.exam_date })
      .eq('id', existing.id)
      .select('*, subjects(*)')
      .single();
    if (error) throw error;
    return data as SchoolTermSyllabus;
  } else {
    const { data, error } = await supabase
      .from('school_term_syllabus')
      .insert(entry)
      .select('*, subjects(*)')
      .single();
    if (error) throw error;
    return data as SchoolTermSyllabus;
  }
}
