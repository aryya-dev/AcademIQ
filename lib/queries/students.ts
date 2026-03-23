import { supabase } from '@/lib/supabase';
import type { Student } from '@/types';

export async function getStudents() {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('name');
  if (error) throw error;
  return data as Student[];
}

export async function getStudentById(id: string) {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Student;
}

export async function createStudent(student: Omit<Student, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('students')
    .insert(student)
    .select()
    .single();
  if (error) throw error;
  return data as Student;
}

export async function updateStudent(id: string, updates: Partial<Student>) {
  const { data, error } = await supabase
    .from('students')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Student;
}

export async function deleteStudent(id: string) {
  const { error } = await supabase.from('students').delete().eq('id', id);
  if (error) throw error;
}

export async function getStudentWithEnrollments(id: string) {
  const { data: student, error: se } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single();
  if (se) throw se;

  const { data: enrollments, error: ee } = await supabase
    .from('enrollments')
    .select('*, batches(*), subjects(*), teachers(*)')
    .eq('student_id', id);
  if (ee) throw ee;

  return { student: student as Student, enrollments: enrollments || [] };
}

export async function getWeakStudents(threshold = 40) {
  // Join test_marks → tests → students and find avg < threshold
  const { data, error } = await supabase.rpc('get_weak_students', { threshold });
  if (error) {
    // Fallback: return students with status active
    const { data: all } = await supabase.from('students').select('*').eq('status', 'active');
    return all as Student[];
  }
  return data as Student[];
}
