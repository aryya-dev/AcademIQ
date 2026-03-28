import { supabase } from '@/lib/supabase';

export interface TeacherFeedback {
  id?: string;
  student_id: string;
  teacher_id: string;
  rating: number | null;
  remarks: string | null;
  created_at?: string;
}

export async function getAllTeacherFeedbacks() {
  const { data, error } = await supabase
    .from('teacher_feedbacks')
    .select('*');

  if (error) throw error;
  return data as TeacherFeedback[];
}

export async function upsertTeacherFeedback(studentId: string, teacherId: string, payload: { rating?: number | null, remarks?: string | null }) {
  // Try to find existing first because Supabase upsert on unique constraints sometimes needs precise conflict targets 
  // if not using primary key. Let's do a select then insert/update.
  const { data: existing } = await supabase
    .from('teacher_feedbacks')
    .select('id')
    .eq('student_id', studentId)
    .eq('teacher_id', teacherId)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from('teacher_feedbacks')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('teacher_feedbacks')
      .insert({ student_id: studentId, teacher_id: teacherId, ...payload })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
export async function getFeedbacksForTeacher(teacherId: string) {
  const { data, error } = await supabase
    .from('teacher_feedbacks')
    .select('*')
    .eq('teacher_id', teacherId);

  if (error) throw error;
  return data as TeacherFeedback[];
}
