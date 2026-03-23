import { supabase } from '@/lib/supabase';

export interface StudentFeedback {
  id: string;
  student_id: string;
  mentor_id: string;
  feedback_text: string;
  rating: number;
  created_at?: string;
  students?: { name: string };
  mentors?: { name: string; full_name: string };
}

export async function getStudentFeedback(mentorId?: string) {
  let query = supabase
    .from('student_feedback')
    .select('*, students(name), mentors:profiles(full_name)')
    .order('created_at', { ascending: false });

  if (mentorId) {
    query = query.eq('mentor_id', mentorId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as StudentFeedback[];
}

export async function logStudentFeedback(feedback: Omit<StudentFeedback, 'id' | 'created_at' | 'students' | 'mentors'>) {
  const { data, error } = await supabase
    .from('student_feedback')
    .insert(feedback)
    .select('*, students(name), mentors:profiles(full_name)')
    .single();

  if (error) throw error;
  return data as StudentFeedback;
}
