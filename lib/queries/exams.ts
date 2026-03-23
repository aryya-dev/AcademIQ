import { supabase } from '@/lib/supabase';

export interface SchoolExam {
  id: string;
  student_id: string;
  subject: string;
  exam_date: string;
  notes: string;
  created_at?: string;
}

export async function getSchoolExamsByStudent(studentId: string) {
  const { data, error } = await supabase
    .from('student_school_exams')
    .select('*')
    .eq('student_id', studentId)
    .order('exam_date', { ascending: true });
    
  if (error) throw error;
  return data as SchoolExam[];
}

export async function addSchoolExam(exam: Omit<SchoolExam, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('student_school_exams')
    .insert(exam)
    .select()
    .single();
    
  if (error) throw error;
  return data as SchoolExam;
}
