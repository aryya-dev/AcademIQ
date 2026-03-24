'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { markAttendance, getAbsenteeReport } from '@/lib/queries/attendance';
import { getBatches } from '@/lib/queries/batches';
import { getEnrollmentsByBatch } from '@/lib/queries/enrollments';

type AttendanceStatus = 'present' | 'absent' | null;

export default function AttendancePage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [batchFilter, setBatchFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>({});
  const [absentees, setAbsentees] = useState<any[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load batches once on mount
  useEffect(() => {
    getBatches()
      .then(setBatches)
      .catch(() => {})
      .finally(() => setLoadingBatches(false));
  }, []);

  // Load enrollments when batch changes
  useEffect(() => {
    if (!batchFilter) {
      setEnrollments([]);
      setSubjectFilter('');
      setRecords({});
      setAbsentees([]);
      return;
    }
    setLoadingStudents(true);
    setSubjectFilter('');
    setRecords({});
    Promise.all([
      getEnrollmentsByBatch(batchFilter),
      getAbsenteeReport(batchFilter),
    ])
      .then(([e, a]) => {
        setEnrollments(e);
        setAbsentees(a);
      })
      .catch(() => {})
      .finally(() => setLoadingStudents(false));
  }, [batchFilter]);

  // Derive unique subjects from enrollments in the selected batch
  const batchSubjects = enrollments.reduce<any[]>((acc, e) => {
    if (e.subjects && !acc.find((s: any) => s.id === e.subjects.id)) {
      acc.push(e.subjects);
    }
    return acc;
  }, []);

  // Derive unique students enrolled in the selected batch + subject
  const filteredStudents: any[] = (() => {
    if (!batchFilter) return [];
    const relevant = subjectFilter
      ? enrollments.filter((e) => e.subjects?.id === subjectFilter)
      : enrollments;
    const seen = new Set<string>();
    return relevant.reduce<any[]>((acc, e) => {
      if (e.students && !seen.has(e.students.id)) {
        seen.add(e.students.id);
        acc.push(e.students);
      }
      return acc;
    }, []);
  })();

  // Cycle: null → present → absent → null
  function toggle(id: string) {
    setRecords((r) => {
      const cur = r[id] ?? null;
      const next: AttendanceStatus =
        cur === null ? 'present' : cur === 'present' ? 'absent' : null;
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
      // Only save non-null records (null = no class, skip entirely)
      const toSave = filteredStudents
        .filter((s) => records[s.id] !== null && records[s.id] !== undefined)
        .map((s) => ({
          student_id: s.id,
          subject_id: subjectFilter,
          batch_id: batchFilter,
          date,
          status: records[s.id] as string,
        }));
      if (toSave.length === 0) {
        alert('No attendance marked — all students are set to "No Class". Nothing to save.');
        return;
      }
      await markAttendance(toSave as any);
      alert(`Attendance saved for ${toSave.length} student(s)!`);
    } catch (e: any) {
      alert(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const statusStyle: Record<string, { label: string; color: string; dot: string }> = {
    present: {
      label: '✓ Present',
      color: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
      dot: 'bg-emerald-500',
    },
    absent: {
      label: '✗ Absent',
      color: 'bg-red-500/20 border-red-500/40 text-red-400',
      dot: 'bg-red-500',
    },
    null: {
      label: '— No Class',
      color: 'bg-[#1e2130] border-[#2a2f45] text-[#4b5563]',
      dot: 'bg-[#4b5563]',
    },
  };

  const getStyle = (id: string) => {
    const s = records[id] ?? null;
    return statusStyle[s === null ? 'null' : s];
  };

  const presentCount = filteredStudents.filter((s) => records[s.id] === 'present').length;
  const absentCount = filteredStudents.filter((s) => records[s.id] === 'absent').length;
  const noClassCount = filteredStudents.filter((s) => (records[s.id] ?? null) === null).length;

  return (
    <div>
      <Header title="Attendance" subtitle="Mark and track student attendance" />
      <div className="p-6 space-y-5">

        {/* Controls */}
        <Card>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label>Batch</label>
              <select value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)}>
                <option value="">Select batch</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Subject</label>
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                disabled={!batchFilter || batchSubjects.length === 0}
              >
                <option value="">All subjects</option>
                {batchSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button className="w-full justify-center" loading={saving} onClick={handleSave}>
                Save Attendance
              </Button>
            </div>
          </div>
          <p className="text-[#4b5563] text-xs mt-3">
            💡 Click a student card to cycle: <span className="text-[#6b7280]">No Class</span> →{' '}
            <span className="text-emerald-400">Present</span> →{' '}
            <span className="text-red-400">Absent</span> → No Class
          </p>
        </Card>

        {/* Legend + Stats */}
        {batchFilter && filteredStudents.length > 0 && (
          <div className="flex flex-wrap gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-[#6b7280]">
              <span className="w-3 h-3 rounded bg-[#2a2f45] inline-block border border-[#3a3f55]" />
              No Class ({noClassCount})
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-3 h-3 rounded bg-emerald-500/30 inline-block" /> Present ({presentCount})
            </span>
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="w-3 h-3 rounded bg-red-500/30 inline-block" /> Absent ({absentCount})
            </span>
          </div>
        )}

        {/* Prompt when no batch selected */}
        {!batchFilter && (
          <div className="text-center py-16 text-[#4b5563]">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-medium text-[#6b7280]">Select a batch to load students</p>
            <p className="text-xs mt-1">Only students enrolled in the chosen batch will appear</p>
          </div>
        )}

        {/* Loading skeleton */}
        {batchFilter && loadingStudents && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-20 bg-[#141722] border border-[#1e2130] rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state after loading */}
        {batchFilter && !loadingStudents && filteredStudents.length === 0 && (
          <div className="text-center py-12 text-[#4b5563]">
            No students enrolled in this batch
            {subjectFilter && ' for the selected subject'}.{' '}
            <a href="/enrollments" className="text-violet-400">
              Manage enrollments →
            </a>
          </div>
        )}

        {/* Student Grid */}
        {!loadingStudents && filteredStudents.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredStudents.map((s) => {
              const style = getStyle(s.id);
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
                  <p className="text-xs opacity-70 mt-0.5">{style.label}</p>
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
              {absentees.map((a) => (
                <div
                  key={a.student_id}
                  className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/20 rounded-lg"
                >
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
