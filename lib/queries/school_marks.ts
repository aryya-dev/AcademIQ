import { supabase } from '@/lib/supabase';
import type { SchoolExamMarks, SchoolExamMarksUpdate } from '@/types';

export async function getSchoolMarksByTerm(term: string) {
  const { data, error } = await supabase
    .from('school_exam_marks')
    .select('*, students(*)')
    .eq('term', term);
  if (error) throw error;
  return data as SchoolExamMarks[];
}

export async function getAllSchoolMarks() {
  const { data, error } = await supabase
    .from('school_exam_marks')
    .select('*, students(*)')
    .order('term', { ascending: false });
  if (error) throw error;
  return data as SchoolExamMarks[];
}

export async function upsertSchoolMarks(studentId: string, term: string, marks: SchoolExamMarksUpdate) {
  const { data, error } = await supabase
    .from('school_exam_marks')
    .upsert({
      student_id: studentId,
      term,
      ...marks
    }, { onConflict: 'student_id,term' })
    .select()
    .single();
  
  if (error) throw error;
  return data as SchoolExamMarks;
}
