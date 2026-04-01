'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { markAttendance } from '@/lib/queries/attendance';
import { getEnrollmentsByBatch } from '@/lib/queries/enrollments';
import { useRole } from '@/hooks/useRole';
import { createClient } from '@/lib/supabase/client';
import { Loader2, CheckCircle, XCircle, MinusCircle } from 'lucide-react';

type AttendanceStatus = 'present' | 'absent' | 'no_class';

function AttendanceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const batchId = searchParams.get('batch');
  const { profile, loading: roleLoading, isTeacher } = useRole();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [subjectId, setSubjectId] = useState('');
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [batchInfo, setBatchInfo] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    if (roleLoading) return;
    if (!profile || !isTeacher) {
      router.push('/login');
      return;
    }

    if (!batchId) {
      router.push('/teacher');
      return;
    }

    async function loadBatchData() {
      setLoading(true);
      try {
        // Verify teacher is assigned to this batch
        const { data: assignment } = await supabase
          .from('teacher_batches')
          .select('*, batches(*)')
          .eq('teacher_id', profile?.teacher_id)
          .eq('batch_id', batchId as string)
          .single();

        if (!assignment) {
          alert('You are not assigned to this batch.');
          router.push('/teacher');
          return;
        }

        setBatchInfo(assignment.batches);

        // Load enrollments for this batch
        const e = await getEnrollmentsByBatch(batchId as string);
        setEnrollments(e || []);
      } catch (err) {
        console.error('Error loading attendance data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadBatchData();
  }, [batchId, profile, roleLoading, isTeacher, router, supabase]);

  // Derive unique subjects for this teacher in this batch
  const batchSubjects = enrollments.reduce<any[]>((acc, e) => {
    if (e.subjects && !acc.find((s: any) => s.id === e.subjects.id)) {
      // Basic check: is this teacher teaching this subject? 
      // (In real app, we'd check teacher_subjects table or enrollment.teacher_id)
      acc.push(e.subjects);
    }
    return acc;
  }, []);

  const filteredStudents = enrollments
    .filter(e => !subjectId || e.subjects?.id === subjectId)
    .map(e => e.students)
    .filter((s, index, self) => s && self.findIndex(t => t.id === s.id) === index && s.status === 'active');

  function toggle(id: string) {
    setRecords((prev) => {
      const cur = prev[id] ?? 'no_class';
      const next: AttendanceStatus =
        cur === 'no_class' ? 'present' : cur === 'present' ? 'absent' : 'no_class';
      return { ...prev, [id]: next };
    });
  }

  async function handleSave() {
    if (!subjectId) {
      alert('Please select a subject first.');
      return;
    }
    setSaving(true);
    try {
      const toSave = filteredStudents.map((s) => ({
        student_id: s.id,
        subject_id: subjectId,
        batch_id: batchId,
        date,
        status: records[s.id] || 'no_class',
      }));

      await markAttendance(toSave as any);
      alert('Attendance saved successfully!');
      router.push('/teacher');
    } catch (err: any) {
      alert(err.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-4" />
        <p className="text-[#6b7280]">Loading class roster...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#4b5563] uppercase tracking-wider">Class / Batch</label>
            <p className="text-white font-bold text-lg">{batchInfo?.name || 'Loading...'}</p>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#4b5563] uppercase tracking-wider">Select Date</label>
            <input 
              type="date" 
              className="w-full bg-[#0a0c14] border-[#1e2130] rounded-xl text-white py-2 px-3"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#4b5563] uppercase tracking-wider">Select Subject</label>
            <select 
              className="w-full bg-[#0a0c14] border-[#1e2130] rounded-xl text-white py-2 px-3"
              value={subjectId}
              onChange={e => setSubjectId(e.target.value)}
            >
              <option value="">Select subject</option>
              {batchSubjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {!subjectId ? (
        <div className="text-center py-20 bg-[#141722]/50 border-2 border-dashed border-[#1e2130] rounded-3xl">
          <p className="text-[#4b5563]">Please select a subject to load the student list.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredStudents.map(s => {
              const status = records[s.id] || 'no_class';
              return (
                <button
                  key={s.id}
                  onClick={() => toggle(s.id)}
                  className={`p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] relative group ${
                    status === 'present' 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : status === 'absent'
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-[#141722] border-[#1e2130] grayscale hover:grayscale-0'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      status === 'present' ? 'bg-emerald-500 text-white' : 
                      status === 'absent' ? 'bg-red-500 text-white' : 
                      'bg-[#1e2130] text-[#4b5563]'
                    }`}>
                      {s.name.charAt(0)}
                    </div>
                    {status === 'present' && <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto" />}
                    {status === 'absent' && <XCircle className="w-4 h-4 text-red-500 ml-auto" />}
                    {status === 'no_class' && <MinusCircle className="w-4 h-4 text-[#4b5563] ml-auto" />}
                  </div>
                  <p className="text-white font-medium text-sm truncate">{s.name}</p>
                  <p className={`text-[10px] font-bold uppercase mt-1 ${
                    status === 'present' ? 'text-emerald-400' : 
                    status === 'absent' ? 'text-red-400' : 
                    'text-[#4b5563]'
                  }`}>
                    {status.replace('_', ' ')}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end pt-6 border-t border-[#1e2130]">
            <Button 
              className="px-8 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl font-bold shadow-lg shadow-violet-900/20"
              loading={saving}
              onClick={handleSave}
            >
              Save Attendance
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeacherAttendancePage() {
  return (
    <div className="min-h-screen bg-[#0b0d14]">
      <Header title="Class Attendance" subtitle="Mark student presence for today's session" />
      <Suspense fallback={<div className="p-6 text-[#6b7280]">Loading...</div>}>
        <AttendanceContent />
      </Suspense>
    </div>
  );
}
