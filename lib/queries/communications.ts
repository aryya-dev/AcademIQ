import { supabase } from '@/lib/supabase';
import type { ParentCommunicationLog, MentoringMessage } from '@/types';

// ── Parent Communications ──────────────────────────────────────

export async function getParentLogs(mentorId?: string) {
  let q = supabase
    .from('parent_communication_logs')
    .select('*, students(*)')
    .order('contacted_at', { ascending: false });
  if (mentorId) q = q.eq('mentor_id', mentorId);
  const { data, error } = await q;
  if (error) throw error;
  return data as ParentCommunicationLog[];
}

export async function getParentLogsByStudent(studentId: string) {
  const { data, error } = await supabase
    .from('parent_communication_logs')
    .select('*, mentors(name)')
    .eq('student_id', studentId)
    .order('contacted_at', { ascending: false });
  if (error) throw error;
  return data as any[];
}

export async function logParentContact(log: Omit<ParentCommunicationLog, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('parent_communication_logs')
    .insert(log)
    .select('*, students(*)')
    .single();
  if (error) throw error;
  return data as ParentCommunicationLog;
}

export async function getStudentsNotContactedThisMonth(mentorId: string) {
  // Get all students assigned to this mentor
  const { data: students, error: se } = await supabase
    .from('students')
    .select('id, name, parent_phone')
    .eq('mentor_id', mentorId)
    .eq('status', 'active');
  if (se) throw se;

  // Get contacts this month
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data: logs, error: le } = await supabase
    .from('parent_communication_logs')
    .select('student_id')
    .eq('mentor_id', mentorId)
    .gte('contacted_at', monthStart.toISOString());
  if (le) throw le;

  const contactedIds = new Set((logs || []).map(l => l.student_id));
  return (students || []).filter(s => !contactedIds.has(s.id));
}

// ── Mentoring Messages ─────────────────────────────────────────

export async function getMentoringMessages(mentorId?: string) {
  let q = supabase
    .from('mentoring_messages')
    .select('*, students(*)')
    .order('message_date', { ascending: false });
  if (mentorId) q = q.eq('mentor_id', mentorId);
  const { data, error } = await q;
  if (error) throw error;
  return data as MentoringMessage[];
}

export async function getMentoringMessagesByStudent(studentId: string) {
  const { data, error } = await supabase
    .from('mentoring_messages')
    .select('*, mentors(name)')
    .eq('student_id', studentId)
    .order('message_date', { ascending: false });
  if (error) throw error;
  return data as any[];
}

export async function logMentoringMessage(msg: Omit<MentoringMessage, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('mentoring_messages')
    .insert(msg)
    .select()
    .single();
  if (error) throw error;
  return data as MentoringMessage;
}

export async function getPendingMentoringMessages(mentorId: string) {
  // Mentors must send 1st and 15th messages each month
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const { data: students, error: se } = await supabase
    .from('students')
    .select('id, name')
    .eq('mentor_id', mentorId)
    .eq('status', 'active');
  if (se) throw se;

  const { data: sent, error: me } = await supabase
    .from('mentoring_messages')
    .select('student_id, type')
    .eq('mentor_id', mentorId)
    .gte('message_date', `${year}-${String(month).padStart(2,'0')}-01`)
    .lte('message_date', `${year}-${String(month).padStart(2,'0')}-31`);
  if (me) throw me;

  const sentSet = new Set((sent || []).map(s => `${s.student_id}:${s.type}`));
  const pending: { student_id: string; name: string; missing: string[] }[] = [];

  for (const s of students || []) {
    const missing: string[] = [];
    if (!sentSet.has(`${s.id}:first`)) missing.push('1st message');
    if (!sentSet.has(`${s.id}:mid`)) missing.push('15th message');
    if (missing.length > 0) pending.push({ student_id: s.id, name: s.name, missing });
  }
  return pending;
}
