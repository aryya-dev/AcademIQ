import { supabase } from '@/lib/supabase';
import type { Attendance } from '@/types';

export async function getAttendanceByDate(date: string, batchId?: string) {
  let query = supabase.from('attendance').select('*, students(*), subjects(*)').eq('date', date);
  if (batchId) query = query.eq('batch_id', batchId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getAttendanceByStudent(studentId: string) {
  const { data, error } = await supabase
    .from('attendance')
    .select('*, subjects(*)')
    .eq('student_id', studentId)
    .order('date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function markAttendance(records: Omit<Attendance, 'id' | 'created_at'>[]) {
  const { data, error } = await supabase
    .from('attendance')
    .upsert(records, { onConflict: 'student_id,subject_id,date' })
    .select();
  if (error) throw error;
  return data || [];
}

export async function getStudentAttendancePct(studentId: string, subjectId: string) {
  const { data, error } = await supabase
    .from('attendance')
    .select('status')
    .eq('student_id', studentId)
    .eq('subject_id', subjectId);
  if (error) throw error;
  if (!data || data.length === 0) return null;
  const present = data.filter(r => r.status === 'present').length;
  return Math.round((present / data.length) * 100);
}

export async function getAbsenteeReport(batchId: string, thresholdPct = 75) {
  const { data, error } = await supabase
    .from('attendance')
    .select('student_id, status, students(name)')
    .eq('batch_id', batchId);
  if (error) throw error;

  // Group by student
  const map: Record<string, { name: string; total: number; present: number }> = {};
  for (const row of data || []) {
    const sid = row.student_id;
    if (!map[sid]) map[sid] = { name: (row.students as any)?.name || '', total: 0, present: 0 };
    map[sid].total++;
    if (row.status === 'present') map[sid].present++;
  }
  return Object.entries(map)
    .map(([id, v]) => ({ student_id: id, name: v.name, pct: Math.round((v.present / v.total) * 100) }))
    .filter(s => s.pct < thresholdPct);
}
