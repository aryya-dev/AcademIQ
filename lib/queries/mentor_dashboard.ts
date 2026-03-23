import { supabase } from '@/lib/supabase';

export interface MentorDashboardData {
  weakStudents: { id: string; name: string; avg_score: number }[];
  lowAttendance: { id: string; name: string; attendance_pct: number }[];
  upcomingExams: { id: string; student_id: string; student_name: string; subject: string; exam_date: string; notes: string | null }[];
  uncontactedParents: { id: string; name: string }[];
  missingMessages: { student_id: string; name: string; missing: string[] }[];
}

export async function getMentorDashboardData(mentorId: string): Promise<MentorDashboardData> {
  // 1. Get all active students assigned to this mentor
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id, name')
    .eq('mentor_id', mentorId)
    .eq('status', 'active');

  if (studentsError) throw studentsError;
  const studentIds = (students || []).map((s: any) => s.id);

  if (studentIds.length === 0) {
    return { weakStudents: [], lowAttendance: [], upcomingExams: [], uncontactedParents: [], missingMessages: [] };
  }

  // 2. Fetch Weak Students (<40% avg)
  const { data: marks } = await supabase.from('student_test_marks').select('student_id, marks_obtained, test_evaluations(total_marks)').in('student_id', studentIds);
  const studentMarks: Record<string, { total_obtained: number; total_max: number }> = {};
  
  marks?.forEach((m: any) => {
    if (m.marks_obtained !== null && m.test_evaluations?.total_marks) {
      if (!studentMarks[m.student_id]) studentMarks[m.student_id] = { total_obtained: 0, total_max: 0 };
      studentMarks[m.student_id].total_obtained += m.marks_obtained;
      studentMarks[m.student_id].total_max += m.test_evaluations.total_marks;
    }
  });

  const weakStudents = Object.entries(studentMarks)
    .map(([id, stats]) => ({
      id,
      name: students?.find((s: any) => s.id === id)?.name || '',
      avg_score: Math.round((stats.total_obtained / stats.total_max) * 100)
    }))
    .filter((s: any) => s.avg_score < 40);

  // 3. Low Attendance (<75%)
  const { data: attendance } = await supabase.from('attendance').select('student_id, status').in('student_id', studentIds);
  const studentAtt: Record<string, { present: number; total: number }> = {};
  attendance?.forEach((a: any) => {
    if (!studentAtt[a.student_id]) studentAtt[a.student_id] = { present: 0, total: 0 };
    studentAtt[a.student_id].total++;
    if (a.status === 'present') studentAtt[a.student_id].present++;
  });

  const lowAttendance = Object.entries(studentAtt)
    .map(([id, stats]) => ({
      id,
      name: students?.find((s: any) => s.id === id)?.name || '',
      attendance_pct: Math.round((stats.present / stats.total) * 100)
    }))
    .filter((s: any) => s.attendance_pct < 75);

  // 4. Upcoming Exams
  const today = new Date().toISOString().split('T')[0];
  const { data: exams } = await supabase
    .from('student_school_exams')
    .select('id, student_id, subject, exam_date, notes, students(name)')
    .in('student_id', studentIds)
    .gte('exam_date', today)
    .order('exam_date', { ascending: true });

  const upcomingExams = (exams || []).map((e: any) => ({
    id: e.id,
    student_id: e.student_id,
    student_name: e.students?.name || '',
    subject: e.subject,
    exam_date: e.exam_date,
    notes: e.notes
  }));

  // 5. Uncontacted Parents
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data: logs } = await supabase.from('parent_communication_logs').select('student_id').eq('mentor_id', mentorId).gte('contacted_at', monthStart.toISOString());
  const contactedIds = new Set((logs || []).map((l: any) => l.student_id));
  const uncontactedParents = (students || []).filter((s: any) => !contactedIds.has(s.id));

  // 6. Missing Mentoring Messages
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const { data: sentMsg } = await supabase.from('mentoring_messages').select('student_id, type').eq('mentor_id', mentorId)
    .gte('message_date', `${year}-${String(month).padStart(2,'0')}-01`)
    .lte('message_date', `${year}-${String(month).padStart(2,'0')}-31`);
  const sentSet = new Set((sentMsg || []).map((s: any) => `${s.student_id}:${s.type}`));
  
  const missingMessages = (students || []).map((s: any) => {
    const missing: string[] = [];
    if (!sentSet.has(`${s.id}:first`)) missing.push('1st msg');
    if (!sentSet.has(`${s.id}:mid`)) missing.push('15th msg');
    return { student_id: s.id, name: s.name, missing };
  }).filter((s: any) => s.missing.length > 0);

  return {
    weakStudents,
    lowAttendance,
    upcomingExams,
    uncontactedParents,
    missingMessages
  };
}
