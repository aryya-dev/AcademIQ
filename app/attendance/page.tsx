'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge, { statusBadge } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { CalendarCheck, CheckCircle } from 'lucide-react';
import { markAttendance, getAttendanceByDate, getAbsenteeReport } from '@/lib/queries/attendance';
import { getStudents } from '@/lib/queries/students';
import { getBatches } from '@/lib/queries/batches';
import { getSubjects } from '@/lib/queries/subjects';

export default function AttendancePage() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [batchFilter, setBatchFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [records, setRecords] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [absentees, setAbsentees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getStudents(), getBatches(), getSubjects()])
      .then(([s, b, sub]) => { setStudents(s); setBatches(b); setSubjects(sub); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (batchFilter) {
      getAbsenteeReport(batchFilter).then(setAbsentees).catch(() => {});
    }
  }, [batchFilter]);

  const filteredStudents = students; // in real app, filter by batch

  function toggle(id: string) {
    setRecords(r => {
      const cur = r[id] || 'absent';
      const next = cur === 'absent' ? 'present' : cur === 'present' ? 'late' : 'absent';
      return { ...r, [id]: next };
    });
  }

  async function handleSave() {
    if (!subjectFilter || !batchFilter) {
      alert('Please select a batch and subject first.');
      return;
    }
    setSaving(true);
    try {
      const toSave = filteredStudents.map(s => ({
        student_id: s.id, subject_id: subjectFilter, batch_id: batchFilter,
        date, status: records[s.id] || 'absent',
      }));
      await markAttendance(toSave as any);
      router.refresh();
      alert('Attendance saved!');
    } catch (e: any) {
      alert(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const statusCycle: Record<string, { label: string; color: string }> = {
    present: { label: '✓ Present', color: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' },
    absent: { label: '✗ Absent', color: 'bg-red-500/20 border-red-500/40 text-red-400' },
    late: { label: '~ Late', color: 'bg-amber-500/20 border-amber-500/40 text-amber-400' },
  };

  return (
    <div>
      <Header title="Attendance" subtitle="Mark and track student attendance" />
      <div className="p-6 space-y-5">
        {/* Controls */}
        <Card>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label>Batch</label>
              <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)}>
                <option value="">Select batch</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label>Subject</label>
              <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}>
                <option value="">Select subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <Button className="w-full justify-center" loading={saving} onClick={handleSave}>
                Save Attendance
              </Button>
            </div>
          </div>
          <p className="text-[#4b5563] text-xs mt-3">💡 Click on a student to cycle: Absent → Present → Late</p>
        </Card>

        {/* Legend */}
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-emerald-400"><span className="w-3 h-3 rounded bg-emerald-500/30 inline-block" /> Present</span>
          <span className="flex items-center gap-1.5 text-red-400"><span className="w-3 h-3 rounded bg-red-500/30 inline-block" /> Absent</span>
          <span className="flex items-center gap-1.5 text-amber-400"><span className="w-3 h-3 rounded bg-amber-500/30 inline-block" /> Late</span>
        </div>

        {/* Student Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-20 bg-[#141722] border border-[#1e2130] rounded-xl animate-pulse" />)}
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12 text-[#4b5563]">No students. <a href="/students/new" className="text-violet-400">Add students first.</a></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredStudents.map(s => {
              const status = records[s.id] || 'absent';
              const style = statusCycle[status];
              return (
                <button
                  key={s.id}
                  onClick={() => toggle(s.id)}
                  className={`border rounded-xl p-4 text-left transition-all hover:scale-[1.02] ${style.color}`}
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-sm font-bold mb-2">
                    {s.name.charAt(0)}
                  </div>
                  <p className="font-medium text-sm truncate">{s.name}</p>
                  <p className="text-xs opacity-80 mt-0.5">{style.label}</p>
                </button>
              );
            })}
          </div>
        )}

        {/* Absentee Report */}
        {absentees.length > 0 && (
          <Card className="border-red-500/20">
            <h3 className="text-white font-semibold mb-3">⚠️ Low Attendance Students (&lt;75%)</h3>
            <div className="space-y-2">
              {absentees.map(a => (
                <div key={a.student_id} className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                  <span className="text-[#d1d5db] text-sm">{a.name}</span>
                  <Badge variant="danger">{a.pct}%</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
