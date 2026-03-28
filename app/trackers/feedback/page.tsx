'use client';
import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Printer, Search, Download } from 'lucide-react';
import { getStudents } from '@/lib/queries/students';
import { getTeachers } from '@/lib/queries/teachers';
import { getAllTeacherFeedbacks, upsertTeacherFeedback, TeacherFeedback } from '@/lib/queries/teacher_feedback';
import type { Student, Teacher } from '@/types';

const BATCH_ORDER = [
  '12 JEE A', '12 JEE B', '12 NEET', '12 Boards',
  '11 JEE A', '11 JEE B', '11 NEET', '11 Boards'
];

function FeedbackCell({ 
  initialRating, 
  initialRemarks, 
  onChange 
}: { 
  initialRating: number | null, 
  initialRemarks: string | null, 
  onChange: (r: number | null, rem: string | null) => void 
}) {
  const [rating, setRating] = useState<string>(initialRating !== null ? String(initialRating) : '');
  const [remarks, setRemarks] = useState<string>(initialRemarks || '');

  useEffect(() => {
    setRating(initialRating !== null ? String(initialRating) : '');
    setRemarks(initialRemarks || '');
  }, [initialRating, initialRemarks]);

  const handleBlur = () => {
    const rNum = rating ? parseFloat(rating) : null;
    const rText = remarks.trim() ? remarks : null;
    
    // Only fire if changed
    if (rNum !== initialRating || rText !== initialRemarks) {
      if (rating && isNaN(rNum as number)) return; // Invalid number
      onChange(rNum, rText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLElement).blur();
    }
  };

  return (
    <div className="flex flex-col gap-1.5 w-24">
      <input 
        type="text"
        pattern="[0-9.]*"
        inputMode="decimal"
        placeholder="Rating"
        value={rating}
        onChange={e => setRating(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full bg-[#1e2130] border-none text-center text-xs p-1 focus:ring-1 focus:ring-pink-500 rounded text-pink-400 font-medium"
      />
      <input 
        type="text"
        placeholder="Remark"
        value={remarks}
        onChange={e => setRemarks(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full bg-[#141722] border border-[#1e2130] text-center text-[10px] p-1 focus:ring-1 focus:ring-pink-500 rounded text-[#9ca3af]"
      />
    </div>
  );
}

export default function FeedbackTrackerPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [feedbacks, setFeedbacks] = useState<TeacherFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');

  async function loadData() {
    setLoading(true);
    try {
      const [sData, tData, fData] = await Promise.all([
        getStudents(),
        getTeachers(),
        getAllTeacherFeedbacks()
      ]);

      const visibleStudents = sData.filter(s => s.status !== 'Discontinue/permanent Inactive');
      
      visibleStudents.sort((a, b) => {
        const aBatch = a.enrollments?.[0]?.batches?.name || '';
        const bBatch = b.enrollments?.[0]?.batches?.name || '';
        
        const aIdx = BATCH_ORDER.indexOf(aBatch);
        const bIdx = BATCH_ORDER.indexOf(bBatch);
        
        const aVal = aIdx === -1 ? 999 : aIdx;
        const bVal = bIdx === -1 ? 999 : bIdx;
        
        if (aVal !== bVal) return aVal - bVal;
        return a.name.localeCompare(b.name);
      });

      setStudents(visibleStudents);
      setTeachers(tData);
      setFeedbacks(fData);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('does not exist')) {
        alert('Table "teacher_feedbacks" is missing. Please review backend migrations.');
      } else {
        alert('Failed to load feedback data: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleFeedbackChange = async (studentId: string, teacherId: string, rating: number | null, remarks: string | null) => {
    try {
      await upsertTeacherFeedback(studentId, teacherId, { rating, remarks });
      
      setFeedbacks(prev => {
        const existingIdx = prev.findIndex(f => f.student_id === studentId && f.teacher_id === teacherId);
        if (existingIdx > -1) {
          const updated = [...prev];
          updated[existingIdx] = { ...updated[existingIdx], rating, remarks };
          return updated;
        } else {
          return [...prev, { student_id: studentId, teacher_id: teacherId, rating, remarks }];
        }
      });
    } catch (error) {
      console.error(error);
    }
  };

  const getFeedback = (studentId: string, teacherId: string) => {
    return feedbacks.find(f => f.student_id === studentId && f.teacher_id === teacherId);
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.enrollments?.[0]?.batches?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    const studentBatches = Array.from(new Set(s.enrollments?.map((e: any) => e.batches?.name))).filter(Boolean);
    const matchesBatch = selectedBatch === '' || studentBatches.includes(selectedBatch);
    const matchesClass = selectedClass === '' || s.class === selectedClass;
    
    return matchesSearch && matchesBatch && matchesClass;
  });

  function handlePrint() {
    window.print();
  }

  function handleExport() {
    const headings = ['SL#', 'Name', 'Class', 'Batch', ...teachers.map(t => `${t.name} (Rating)`), ...teachers.map(t => `${t.name} (Remark)`)];
    
    const rows = filteredStudents.map((s, i) => {
      const row = [
        i + 1,
        s.name,
        s.class,
        Array.from(new Set(s.enrollments?.map((e: any) => e.batches?.name))).filter(Boolean).join(', '),
      ];

      // Add ratings
      teachers.forEach(t => {
        const f = getFeedback(s.id, t.id!);
        row.push(f?.rating !== null && f?.rating !== undefined ? f.rating : '');
      });

      // Add remarks
      teachers.forEach(t => {
        const f = getFeedback(s.id, t.id!);
        row.push(f?.remarks || '');
      });

      return row;
    });

    const csvContent = [
      headings.join(','),
      ...rows.map(row => row.map(cell => String(cell).includes(',') ? `"${cell}"` : cell).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Teacher_Feedback_Tracker_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  return (
    <div>
      <Header title="Feedback Tracker" subtitle="Manage student feedbacks and remarks for teachers" />
      
      <div className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4 print:hidden">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4b5563]" />
              <input 
                placeholder="Search students..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 h-10 w-full"
              />
            </div>
            <select
              value={selectedClass}
              onChange={e => { setSelectedClass(e.target.value); setSelectedBatch(''); }}
              className="h-10 bg-[#141722] border border-[#1e2130] rounded-lg px-3 text-sm text-[#d1d5db] focus:ring-1 focus:ring-pink-500 w-full sm:w-36 outline-none"
            >
              <option value="">All Classes</option>
              <option value="11">Class 11</option>
              <option value="12">Class 12</option>
            </select>
            <select
              value={selectedBatch}
              onChange={e => setSelectedBatch(e.target.value)}
              className="h-10 bg-[#141722] border border-[#1e2130] rounded-lg px-3 text-sm text-[#d1d5db] focus:ring-1 focus:ring-pink-500 w-full sm:w-48 outline-none"
            >
              <option value="">All Batches</option>
              {BATCH_ORDER
                .filter(b => selectedClass === '' || b.startsWith(selectedClass))
                .map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <Button variant="secondary" icon={<Printer className="w-4 h-4" />} onClick={handlePrint}>Print</Button>
            <Button variant="secondary" icon={<Download className="w-4 h-4" />} onClick={handleExport}>Export</Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 pt-4">
            {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-[#141722] border border-[#1e2130] rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-xl border border-[#1e2130] bg-[#0f1117] print-table">
            <table className="w-full text-sm border-collapse min-w-max">
              <thead>
                <tr className="border-b border-[#1e2130] bg-[#141722]">
                  <th className="text-left text-[#6b7280] font-medium text-xs uppercase tracking-wider px-4 py-3">SL#</th>
                  <th className="text-left text-[#6b7280] font-medium text-xs uppercase tracking-wider px-4 py-3">Name</th>
                  <th className="text-left text-[#6b7280] font-medium text-xs uppercase tracking-wider px-4 py-3">Batch</th>
                  {teachers.map(t => (
                    <th key={t.id} className="text-center text-[#6b7280] font-medium text-xs tracking-wider px-2 py-3 border-l border-[#1e2130]">
                      <div className="w-24 px-1 truncate" title={t.name}>{t.name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={teachers.length + 3} className="text-center text-[#4b5563] py-12">No students found.</td>
                  </tr>
                ) : (
                  filteredStudents.map((s, i) => {
                    return (
                      <tr key={s.id} className="border-b border-[#1e2130] last:border-0 hover:bg-[#1a1f30] transition-colors group">
                        <td className="px-4 py-3 text-[#d1d5db]">{i + 1}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-white whitespace-nowrap">{s.name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 min-w-[80px]">
                            {Array.from(new Set(s.enrollments?.map((e: any) => e.batches?.name))).filter(Boolean).map((batchName) => (
                              <Badge key={batchName as string} variant="violet">{batchName as string}</Badge>
                            ))}
                          </div>
                        </td>
                        {teachers.map(t => {
                          const f = getFeedback(s.id, t.id!);
                          return (
                            <td key={t.id} className="px-2 py-2 text-center border-l border-[#1e2130]/50 align-top">
                              <FeedbackCell 
                                initialRating={f?.rating ?? null}
                                initialRemarks={f?.remarks ?? null}
                                onChange={(r, rem) => handleFeedbackChange(s.id, t.id!, r, rem)}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print-table, .print-table * { visibility: visible; }
          .print-table { position: absolute; left: 0; top: 0; width: 100%; }
          .print-table table { border-collapse: collapse; width: 100%; }
          .print-table th, .print-table td { border: 1px solid #ddd; padding: 4px; font-size: 10px; color: black !important; text-align: left; }
          .print-table th { background-color: #f2f2f2 !important; }
          input { border: 1px solid #ccc !important; background: transparent !important; color: black !important; width: 100% !important; margin-bottom: 2px; }
          .badge { background: none !important; border: 1px solid #ccc !important; color: black !important; padding: 1px 4px !important; }
        }
      `}</style>
    </div>
  );
}
