'use client';
import { useEffect, useState, use } from 'react';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Badge, { statusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { getStudentById, updateStudent, deleteStudent, getStudentWithEnrollments } from '@/lib/queries/students';
import Modal from '@/components/ui/Modal';
import StudentForm from '@/components/forms/StudentForm';
import { ArrowLeft, BookOpen, Calendar, TrendingUp, MessageCircle, Edit2, CalendarRange, Plus, Trash2 } from 'lucide-react';
import { getEnrollmentsByStudent, createEnrollment, deleteEnrollment } from '@/lib/queries/enrollments';
import { getStudentMarks } from '@/lib/queries/tests';
import { getAttendanceByStudent } from '@/lib/queries/attendance';
import { getParentLogsByStudent, getMentoringMessagesByStudent } from '@/lib/queries/communications';
import { getSchoolExamsByStudent, addSchoolExam, type SchoolExam } from '@/lib/queries/exams';
import { getSchoolTermSyllabusBySchool } from '@/lib/queries/school_syllabus';
import type { Student, SchoolTermSyllabus } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [student, setStudent] = useState<Student | null>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [parentLogs, setParentLogs] = useState<any[]>([]);
  const [mentoringMsgs, setMentoringMsgs] = useState<any[]>([]);
  const [exams, setExams] = useState<SchoolExam[]>([]);
  const [syncedSyllabus, setSyncedSyllabus] = useState<SchoolTermSyllabus[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [newExam, setNewExam] = useState({ subject: '', exam_date: '', notes: '' });

  useEffect(() => {
    Promise.all([
      getStudentById(id),
      getEnrollmentsByStudent(id).catch(() => []),
      getStudentMarks(id).catch(() => []),
      getAttendanceByStudent(id).catch(() => []),
      getParentLogsByStudent(id).catch(() => []),
      getMentoringMessagesByStudent(id).catch(() => []),
      getSchoolExamsByStudent(id).catch(() => []),
    ]).then(async ([s, e, m, a, p, mm, ex]) => {
      setStudent(s); setEnrollments(e); setMarks(m); setAttendance(a); setParentLogs(p); setMentoringMsgs(mm); setExams(ex);
      
      // Fetch synced syllabus if student has school and class
      if (s?.school_name && s?.class) {
        try {
          const sy = await getSchoolTermSyllabusBySchool(s.school_name, s.class);
          setSyncedSyllabus(sy);
        } catch (err) {
          console.error('Failed to load synced syllabus:', err);
        }
      }
    }).catch((err) => {
      console.error('Failed to load student data:', err);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleUpdate = async (updates: any) => {
    setUpdating(true);
    try {
      // 1. Update basic student fields
      await updateStudent(id, {
        name: updates.name,
        class: updates.class,
        school_name: updates.school_name,
        parent_phone: updates.parent_phone,
        status: updates.status as any,
      });

      // 2. Sync enrollments
      const currentEnrollments = await getEnrollmentsByStudent(id);
      await Promise.all(currentEnrollments.map((e: any) => deleteEnrollment(e.id)));

      const createPromises = updates.enrollments.flatMap((block: any) => 
        block.selectedSubjectIds.map((sid: string) => 
          createEnrollment({
            student_id: id,
            batch_id: block.batch_id,
            subject_id: sid,
            role: 'primary',
          })
        )
      );
      await Promise.all(createPromises);

      // Refresh data
      const { student: refreshedStudent, enrollments: refreshedEnrollments } = await getStudentWithEnrollments(id);
      setStudent(refreshedStudent);
      setEnrollments(refreshedEnrollments);
      
      setEditModalOpen(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to update student');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!student) return;
    if (!confirm(`Are you sure you want to delete ${student.name}? This action cannot be undone.`)) return;
    setUpdating(true);
    try {
      await deleteStudent(id);
      router.push('/students');
    } catch (err) {
      console.error(err);
      alert('Failed to delete student');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExam.subject || !newExam.exam_date) return;
    setUpdating(true);
    try {
      const added = await addSchoolExam({ student_id: id, ...newExam });
      setExams([...exams, added].sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()));
      setExamModalOpen(false);
      setNewExam({ subject: '', exam_date: '', notes: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const avgScore = marks.length
    ? Math.round(marks.reduce((sum: number, m: any) => sum + (m.marks_obtained || 0), 0) / marks.length)
    : null;

  const presentCount = attendance.filter(a => a.status === 'present').length;
  const lateCount = attendance.filter(a => a.status === 'late').length;
  const absentCount = attendance.filter(a => a.status === 'absent').length;
  const attendancePct = attendance.length ? Math.round((presentCount / attendance.length) * 100) : null;

  if (loading) return (
    <div>
      <Header title="Student Profile" />
      <div className="p-6 grid gap-4">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-[#141722] rounded-xl animate-pulse border border-[#1e2130]" />)}
      </div>
    </div>
  );

  if (!student) return (
    <div>
      <Header title="Not Found" />
      <div className="p-6 text-[#6b7280]">Student not found.</div>
    </div>
  );

  return (
    <div>
      <Header title={student.name} subtitle={`Class ${student.class} • ${student.school_name}`} />
      <div className="p-6 space-y-5">
        <Link href="/students">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>Back</Button>
        </Link>

        {/* Profile Card */}
        <Card>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                {student.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-white text-xl font-bold">{student.name}</h2>
                <p className="text-[#9ca3af] text-sm">Class {student.class} • {student.school_name}</p>
                <p className="text-[#9ca3af] text-sm">📱 {student.parent_phone || 'No phone on file'}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={statusBadge(student.status)} className="text-sm px-3 py-1">{student.status}</Badge>
              <Button
                variant="ghost"
                size="sm"
                icon={<Edit2 className="w-3.5 h-3.5" />}
                onClick={() => setEditModalOpen(true)}
              >
                Edit Profile
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                icon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-[#1e2130]">
            <div className="text-center">
              <p className="text-[#6b7280] text-xs uppercase tracking-wider">Avg Score</p>
              <p className={`text-2xl font-bold mt-1 ${avgScore !== null ? (avgScore >= 85 ? 'text-emerald-400' : avgScore >= 40 ? 'text-amber-400' : 'text-red-400') : 'text-[#4b5563]'}`}>
                {avgScore !== null ? `${avgScore}%` : '—'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[#6b7280] text-xs uppercase tracking-wider">Attendance</p>
              <p className={`text-2xl font-bold mt-1 ${attendancePct !== null ? (attendancePct >= 75 ? 'text-emerald-400' : 'text-red-400') : 'text-[#4b5563]'}`}>
                {attendancePct !== null ? `${attendancePct}%` : '—'}
              </p>
              <div className="flex justify-center gap-2 mt-1 text-[10px]">
                <span className="text-emerald-400">P:{presentCount}</span>
                <span className="text-red-400">A:{absentCount}</span>
                <span className="text-amber-400">L:{lateCount}</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-[#6b7280] text-xs uppercase tracking-wider">Subjects</p>
              <p className="text-2xl font-bold mt-1 text-violet-400">{enrollments.length}</p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Enrollments */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-violet-400" />
              <h3 className="text-white font-semibold">Enrolled Subjects</h3>
            </div>
            {enrollments.length === 0 ? (
              <p className="text-[#4b5563] text-sm py-4 text-center">No enrollments yet</p>
            ) : (
              <div className="space-y-2">
                {enrollments.map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between p-3 bg-[#1e2130] rounded-lg">
                    <div>
                      <p className="text-[#d1d5db] text-sm font-medium">{e.subjects?.name}</p>
                      <p className="text-[#6b7280] text-xs">{e.batches?.name} • {e.teachers?.name}</p>
                    </div>
                    <Badge variant={e.role === 'primary' ? 'purple' : 'default'}>{e.role}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Marks */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h3 className="text-white font-semibold">Recent Test Marks</h3>
            </div>
            {marks.length === 0 ? (
              <p className="text-[#4b5563] text-sm py-4 text-center">No test records yet</p>
            ) : (
              <div className="space-y-2">
                {marks.slice(0, 6).map((m: any) => {
                  const pct = m.tests?.max_marks ? Math.round((m.marks_obtained / m.tests.max_marks) * 100) : null;
                  return (
                    <div key={m.id} className="flex items-center justify-between p-3 bg-[#1e2130] rounded-lg">
                      <div>
                        <p className="text-[#d1d5db] text-sm font-medium">{m.tests?.title}</p>
                        <p className="text-[#6b7280] text-xs">{m.tests?.subjects?.name} • {m.tests?.type}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-sm ${pct !== null ? (pct >= 85 ? 'text-emerald-400' : pct >= 40 ? 'text-amber-400' : 'text-red-400') : 'text-[#6b7280]'}`}>
                          {m.marks_obtained}/{m.tests?.max_marks}
                        </p>
                        {pct !== null && <p className="text-[#6b7280] text-xs">{pct}%</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Parent Feedback & Communication History */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <h3 className="text-white font-semibold">Communication & Feedback History</h3>
          </div>
          <div className="space-y-6">
            {/* Parent Logs */}
            <div>
              <p className="text-[#6b7280] text-xs uppercase tracking-wider mb-2">Parent Contacts</p>
              {parentLogs.length === 0 ? (
                <p className="text-[#4b5563] text-sm py-2">No communication history found</p>
              ) : (
                <div className="space-y-3">
                  {parentLogs.map((log: any) => (
                    <div key={log.id} className="p-3 bg-[#1e2130] rounded-xl border border-[#2a2f45]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[#9ca3af] text-[10px] uppercase font-bold">
                          {new Date(log.contacted_at).toLocaleDateString()}
                        </span>
                        <Badge variant="info">Mentor: {log.mentors?.name || 'Mentor'}</Badge>
                      </div>
                      <p className="text-[#d1d5db] text-xs italic">"{log.notes}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mentoring Messages */}
            <div>
              <p className="text-[#6b7280] text-xs uppercase tracking-wider mb-2">Mentoring Messages</p>
              {mentoringMsgs.length === 0 ? (
                <p className="text-[#4b5563] text-sm py-2">No mentoring messages logged yet.</p>
              ) : (
                <div className="space-y-3">
                  {mentoringMsgs.map((msg: any) => (
                    <div key={msg.id} className="p-3 bg-[#1e2130] rounded-xl border border-[#2a2f45]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[#9ca3af] text-[10px] uppercase font-bold">
                          {new Date(msg.message_date).toLocaleDateString()}
                        </span>
                        <Badge variant={msg.type === 'first' ? 'purple' : 'info'}>{msg.type === 'first' ? '1st Month' : '15th Month'}</Badge>
                      </div>
                      <p className="text-[#d1d5db] text-xs">"{msg.content}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Recent Attendance */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-blue-400" />
            <h3 className="text-white font-semibold">Recent Attendance</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {attendance.slice(0, 30).map((a: any) => (
              <div key={a.id} className="flex flex-col items-center gap-1">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold
                  ${a.status === 'present' ? 'bg-emerald-500/20 text-emerald-400' :
                    a.status === 'absent' ? 'bg-red-500/20 text-red-400' :
                      'bg-amber-500/20 text-amber-400'}`}>
                  {a.status === 'present' ? '✓' : a.status === 'absent' ? '✗' : 'L'}
                </div>
                <p className="text-[#4b5563] text-[10px]">{a.date?.slice(5)}</p>
              </div>
            ))}
            {attendance.length === 0 && <p className="text-[#4b5563] text-sm py-4">No attendance records</p>}
          </div>
        </Card>

        {/* School Exams Tracking */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarRange className="w-4 h-4 text-blue-400" />
              <h3 className="text-white font-semibold">School Exams</h3>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setExamModalOpen(true)} className="text-blue-400" icon={<Plus className="w-3.5 h-3.5" />}>Add Exam</Button>
          </div>
          <div>
            {exams.length === 0 ? (
              <p className="text-[#4b5563] text-sm py-4 text-center">No school exams documented.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {exams.map(ex => {
                  const isPast = new Date(ex.exam_date) < new Date();
                  return (
                    <div key={ex.id} className={`p-4 rounded-xl border ${isPast ? 'bg-[#141722] border-[#1e2130] opacity-60' : 'bg-blue-500/10 border-blue-500/30'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-sm font-semibold ${isPast ? 'text-[#9ca3af]' : 'text-blue-300'}`}>{ex.subject}</span>
                        <Badge variant={isPast ? 'default' : 'info'}>
                          {new Date(ex.exam_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </Badge>
                      </div>
                      {ex.notes && <p className="text-[#9ca3af] text-xs italic">"{ex.notes}"</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Synced School Syllabus */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <h3 className="text-white font-semibold">Synced Exam Syllabus ({student.school_name})</h3>
          </div>
          {syncedSyllabus.length === 0 ? (
            <p className="text-[#4b5563] text-sm py-4 text-center">No synced syllabus available for this school/class.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {['UT-1', 'Half Yearly', 'UT-2', 'Annual Term'].map(term => {
                const termSyllabus = syncedSyllabus.filter(s => s.term === term);
                if (termSyllabus.length === 0) return null;
                
                return (
                        <div key={term} className="space-y-3">
                    <h4 className="text-violet-400 text-[10px] uppercase font-bold tracking-widest border-b border-[#1e2130] pb-1">{term}</h4>
                    <div className="space-y-2">
                      {termSyllabus
                        .filter(s => enrollments.some(e => e.subject_id === s.subject_id))
                        .map(s => (
                          <div key={s.id} className="p-3 bg-[#1e2130] rounded-xl border border-[#2a2f45]">
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <span className="text-white text-[11px] font-bold">{s.subject?.name}</span>
                              {s.exam_date && (
                                <span className="text-[#9ca3af] text-[9px] bg-[#141722] px-1.5 py-0.5 rounded border border-[#1e2130]">
                                  {new Date(s.exam_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </div>
                            <p className="text-[#9ca3af] text-[10px] leading-relaxed whitespace-pre-wrap">{s.syllabus || 'No syllabus details'}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Profile: ${student.name}`}
        size="md"
      >
        <StudentForm
          initialData={student}
          onSubmit={handleUpdate}
          loading={updating}
          submitLabel="Update Profile"
        />
      </Modal>

      <Modal open={examModalOpen} onClose={() => setExamModalOpen(false)} title="Add School Exam">
        <form onSubmit={handleAddExam} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">Subject / Exam Name</label>
            <input
              required
              type="text"
              value={newExam.subject}
              onChange={e => setNewExam({ ...newExam, subject: e.target.value })}
              className="w-full bg-[#141722] border border-[#2a2f45] rounded-xl px-4 py-2.5 text-white"
              placeholder="e.g. Physics Mid-Term"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">Exam Date</label>
            <input
              required
              type="date"
              value={newExam.exam_date}
              onChange={e => setNewExam({ ...newExam, exam_date: e.target.value })}
              className="w-full bg-[#141722] border border-[#2a2f45] rounded-xl px-4 py-2.5 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">Notes (Optional)</label>
            <textarea
              value={newExam.notes}
              onChange={e => setNewExam({ ...newExam, notes: e.target.value })}
              className="w-full bg-[#141722] border border-[#2a2f45] rounded-xl px-4 py-2.5 text-white resize-none"
              rows={3}
              placeholder="Need extra revision classes for chapters 3 and 4..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" type="button" onClick={() => setExamModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={updating}>Save Exam</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
