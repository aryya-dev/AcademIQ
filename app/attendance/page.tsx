'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { markAttendance, getAbsenteeReport } from '@/lib/queries/attendance';
import { getBatches } from '@/lib/queries/batches';
import { getEnrollmentsByBatch } from '@/lib/queries/enrollments';
import { getStudents } from '@/lib/queries/students';
import { Search, UserPlus } from 'lucide-react';

type AttendanceStatus = 'present' | 'absent' | 'no_class';

export default function AttendancePage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [batchFilter, setBatchFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>({});
  const [absentees, setAbsentees] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [extraStudents, setExtraStudents] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load batches once on mount
  useEffect(() => {
    Promise.all([getBatches(), getStudents()])
      .then(([b, s]) => {
        setBatches(b);
        setAllStudents(s.filter(st => st.status !== 'Discontinue/permanent Inactive'));
      })
      .catch(() => {})
      .finally(() => setLoadingBatches(false));
  }, []);

  // Load enrollments when batch changes
  useEffect(() => {
    if (!batchFilter) {
      setEnrollments([]);
      setSubjectFilter('');
      setRecords({});
      setExtraStudents([]);
      setAbsentees([]);
      return;
    }
    setLoadingStudents(true);
    setSubjectFilter('');
    setRecords({});
    setExtraStudents([]);
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
    const baseStudents = relevant.reduce<any[]>((acc, e) => {
      if (e.students && !seen.has(e.students.id) && e.students.status !== 'Discontinue/permanent Inactive') {
        seen.add(e.students.id);
        acc.push(e.students);
      }
      return acc;
    }, []);

    // Merge with manually added students
    const merged = [...baseStudents];
    extraStudents.forEach(es => {
      if (!merged.find(m => m.id === es.id)) {
        merged.push({ ...es, isExtra: true });
      }
    });

    return merged;
  })();

  const addExtraStudent = (student: any) => {
    if (!student) return;
    if (filteredStudents.find(s => s.id === student.id)) {
      alert('Student is already in the list.');
      return;
    }
    setExtraStudents(prev => [...prev, student]);
    setStudentSearch('');
  };

  // Cycle: no_class → present → absent → no_class
  function toggle(id: string) {
    setRecords((r) => {
      const cur = r[id] ?? 'no_class';
      const next: AttendanceStatus =
        cur === 'no_class' ? 'present' : cur === 'present' ? 'absent' : 'no_class';
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
      // Save all records (including no_class)
      const toSave = filteredStudents.map((s) => ({
        student_id: s.id,
        subject_id: subjectFilter,
        batch_id: batchFilter,
        date,
        status: records[s.id] || 'no_class',
      }));
      
      if (toSave.length === 0) {
        alert('No students found to mark attendance for.');
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
    no_class: {
      label: '— No Class',
      color: 'bg-[#1e2130] border-[#2a2f45] text-[#4b5563]',
      dot: 'bg-[#4b5563]',
    },
    extra: {
      label: 'Guest / Extra',
      color: 'bg-violet-500/10 border-violet-500/30 text-violet-400',
      dot: 'bg-violet-500',
    }
  };

  const getStyle = (id: string, isExtra?: boolean) => {
    const s = records[id] ?? 'no_class';
    return statusStyle[s];
  };

  const presentCount = filteredStudents.filter((s) => records[s.id] === 'present').length;
  const absentCount = filteredStudents.filter((s) => records[s.id] === 'absent').length;
  const noClassCount = filteredStudents.filter((s) => (records[s.id] || 'no_class') === 'no_class').length;

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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium text-sm flex items-center gap-2">
                Student List <span className="text-[#4b5563] font-normal text-xs">({filteredStudents.length} total)</span>
              </h3>
              
              {/* Extra Student Search */}
              <div className="relative w-64 group print:hidden">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4b5563]" />
                <input
                  placeholder="Add extra student..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  className="pl-9 h-9 text-xs py-1"
                />
                {studentSearch && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#141722] border border-[#1e2130] rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                    {allStudents
                      .filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()))
                      .filter(s => !filteredStudents.find(fs => fs.id === s.id))
                      .slice(0, 10)
                      .map(s => (
                        <button
                          key={s.id}
                          className="w-full text-left px-4 py-2 hover:bg-[#1e2130] text-sm text-[#d1d5db] flex items-center justify-between group"
                          onClick={() => addExtraStudent(s)}
                        >
                          <span>{s.name} <span className="text-[#4b5563] text-xs">({s.school_name})</span></span>
                          <UserPlus className="w-3.5 h-3.5 text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    {allStudents.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase())).length === 0 && (
                      <div className="px-4 py-3 text-xs text-[#4b5563] text-center italic">No students found</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredStudents.map((s) => {
                const style = getStyle(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggle(s.id)}
                    className={`border rounded-xl p-4 text-left transition-all hover:scale-[1.02] relative group ${style.color}`}
                  >
                    {s.isExtra && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-violet-600/20 text-violet-400 text-[8px] font-bold uppercase border border-violet-600/30">
                        Extra
                      </span>
                    )}
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-sm font-bold mb-2">
                      {s.name.charAt(0)}
                    </div>
                    <p className="font-medium text-sm truncate">{s.name}</p>
                    <p className="text-xs opacity-70 mt-0.5">{style.label}</p>
                  </button>
                );
              })}
            </div>
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
