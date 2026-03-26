'use client';
import { useEffect, useState, useMemo } from 'react';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Printer, Search, Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getStudents } from '@/lib/queries/students';
import { getAllSchoolMarks, upsertSchoolMarks } from '@/lib/queries/school_marks';
import type { Student, SchoolExamMarks } from '@/types';

const BATCH_ORDER = [
  '12 JEE A', '12 JEE B', '12 NEET', '12 Boards',
  '11 JEE A', '11 JEE B', '11 NEET', '11 Boards'
];

const EXAM_NAME = "Annual Terminal Examination-2026";

export default function MarksTrackerPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [allMarks, setAllMarks] = useState<SchoolExamMarks[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  async function loadData() {
    setLoading(true);
    try {
      const [sData, mData] = await Promise.all([
        getStudents(),
        getAllSchoolMarks()
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
      setAllMarks(mData);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('relation "school_exam_marks" does not exist')) {
        alert('Table "school_exam_marks" is missing from Supabase. Please run the SQL in schema.sql (lines 142-153) first!');
      } else {
        alert('Failed to load marks data: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkChange = async (studentId: string, subject: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) && value !== '') return;

    try {
      const marksUpdate = { [subject]: isNaN(numValue) ? null : numValue };
      await upsertSchoolMarks(studentId, EXAM_NAME, marksUpdate);
      
      setAllMarks(prev => {
        const existingIdx = prev.findIndex(m => m.student_id === studentId && m.term === EXAM_NAME);
        if (existingIdx > -1) {
          const updated = [...prev];
          updated[existingIdx] = { ...updated[existingIdx], ...marksUpdate };
          return updated;
        } else {
          return [...prev, { student_id: studentId, term: EXAM_NAME, ...marksUpdate } as any];
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const getStudentMarks = (studentId: string) => {
    return allMarks.find(m => m.student_id === studentId && m.term === EXAM_NAME);
  };

  const calculateAvg = (marks?: SchoolExamMarks) => {
    if (!marks) return 0;
    const vals = [marks.physics, marks.chemistry, marks.math, marks.biology, marks.computer].filter(v => v !== null && v !== undefined);
    if (vals.length === 0) return 0;
    return vals.reduce((a, b) => a + (b || 0), 0) / vals.length;
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.enrollments?.[0]?.batches?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { key: 'sl', header: 'SL#', render: (_: any, i: number) => <span>{i + 1}</span> },
    { key: 'name', header: 'Name', render: (s: any) => <span className="font-semibold text-white">{s.name}</span> },
    { key: 'class', header: 'Class', render: (s: any) => <span>{s.class}</span> },
    { key: 'batch', header: 'Batch', render: (s: any) => (
      <div className="flex flex-wrap gap-1">
        {s.enrollments?.map((e: any) => (
          <Badge key={e.batches?.id} variant="violet">{e.batches?.name}</Badge>
        ))}
      </div>
    )},
    { 
      key: 'subject_group', 
      header: <div className="text-center w-full border-b border-[#1e2130] pb-1 mb-1">Subject</div>,
      columns: [
        { key: 'physics', header: 'P', render: (s: any) => {
          const m = getStudentMarks(s.id);
          return (
            <input 
              type="number"
              value={m?.physics ?? ''}
              placeholder="—"
              onChange={(e) => handleMarkChange(s.id, 'physics', e.target.value)}
              className="w-12 bg-[#1e2130] border-none text-center text-xs p-1 focus:ring-1 focus:ring-violet-500 rounded"
            />
          );
        }},
        { key: 'chemistry', header: 'C', render: (s: any) => {
          const m = getStudentMarks(s.id);
          return (
            <input 
              type="number"
              value={m?.chemistry ?? ''}
              placeholder="—"
              onChange={(e) => handleMarkChange(s.id, 'chemistry', e.target.value)}
              className="w-12 bg-[#1e2130] border-none text-center text-xs p-1 focus:ring-1 focus:ring-violet-500 rounded"
            />
          );
        }},
        { key: 'math', header: 'M', render: (s: any) => {
          const m = getStudentMarks(s.id);
          return (
            <input 
              type="number"
              value={m?.math ?? ''}
              placeholder="—"
              onChange={(e) => handleMarkChange(s.id, 'math', e.target.value)}
              className="w-12 bg-[#1e2130] border-none text-center text-xs p-1 focus:ring-1 focus:ring-violet-500 rounded"
            />
          );
        }},
        { key: 'biology', header: 'B', render: (s: any) => {
          const m = getStudentMarks(s.id);
          return (
            <input 
              type="number"
              value={m?.biology ?? ''}
              placeholder="—"
              onChange={(e) => handleMarkChange(s.id, 'biology', e.target.value)}
              className="w-12 bg-[#1e2130] border-none text-center text-xs p-1 focus:ring-1 focus:ring-violet-500 rounded"
            />
          );
        }},
        { key: 'computer', header: 'Com', render: (s: any) => {
          const m = getStudentMarks(s.id);
          return (
            <input 
              type="number"
              value={m?.computer ?? ''}
              placeholder="—"
              onChange={(e) => handleMarkChange(s.id, 'computer', e.target.value)}
              className="w-12 bg-[#1e2130] border-none text-center text-xs p-1 focus:ring-1 focus:ring-violet-500 rounded"
            />
          );
        }},
      ]
    },
    { key: 'total', header: 'Total', render: (s: any) => {
      const m = getStudentMarks(s.id);
      if (!m) return <span>—</span>;
      const total = (m.physics || 0) + (m.chemistry || 0) + (m.math || 0) + (m.biology || 0) + (m.computer || 0);
      return <span className="font-bold text-violet-400">{total}</span>;
    }},
  ];

  function handlePrint() {
    window.print();
  }

  function handleExport() {
    const headings = ['SL#', 'Name', 'Class', 'Batch', 'P', 'C', 'M', 'B', 'Com', 'Total'];
    const rows = filteredStudents.map((s, i) => {
      const m = getStudentMarks(s.id);
      const total = (m?.physics || 0) + (m?.chemistry || 0) + (m?.math || 0) + (m?.biology || 0) + (m?.computer || 0);
      return [
        i + 1,
        s.name,
        s.class,
        s.enrollments?.map((e: any) => e.batches?.name).join(', '),
        m?.physics ?? '-',
        m?.chemistry ?? '-',
        m?.math ?? '-',
        m?.biology ?? '-',
        m?.computer ?? '-',
        total || '-'
      ];
    });

    const csvContent = [
      headings.join(','),
      ...rows.map(row => row.map(cell => String(cell).includes(',') ? `"${cell}"` : cell).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Marks_Tracker_Annual_2026_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  return (
    <div>
      <Header title="Marks Tracker" subtitle={EXAM_NAME} />
      
      <div className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4 print:hidden">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4b5563]" />
            <input 
              placeholder="Search students..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 h-10 w-full"
            />
          </div>

          <div className="flex gap-2">
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
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#1e2130]">
                  <th rowSpan={2} className="text-left text-[#6b7280] font-medium text-xs uppercase tracking-wider px-4 py-3">SL#</th>
                  <th rowSpan={2} className="text-left text-[#6b7280] font-medium text-xs uppercase tracking-wider px-4 py-3">Name</th>
                  <th rowSpan={2} className="text-left text-[#6b7280] font-medium text-xs uppercase tracking-wider px-4 py-3">Class</th>
                  <th rowSpan={2} className="text-left text-[#6b7280] font-medium text-xs uppercase tracking-wider px-4 py-3">Batch</th>
                  <th colSpan={5} className="text-center text-[#6b7280] font-medium text-xs uppercase tracking-wider px-4 py-2 border-b border-[#1e2130]">Subject</th>
                  <th rowSpan={2} className="text-center text-[#6b7280] font-medium text-xs uppercase tracking-wider px-4 py-3">Total</th>
                </tr>
                <tr className="border-b border-[#1e2130]">
                  <th className="text-center text-[#6b7280] font-medium text-[10px] uppercase tracking-wider px-2 py-2">P</th>
                  <th className="text-center text-[#6b7280] font-medium text-[10px] uppercase tracking-wider px-2 py-2">C</th>
                  <th className="text-center text-[#6b7280] font-medium text-[10px] uppercase tracking-wider px-2 py-2">M</th>
                  <th className="text-center text-[#6b7280] font-medium text-[10px] uppercase tracking-wider px-2 py-2">B</th>
                  <th className="text-center text-[#6b7280] font-medium text-[10px] uppercase tracking-wider px-2 py-2">Com</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center text-[#4b5563] py-12">No students found.</td>
                  </tr>
                ) : (
                  filteredStudents.map((s, i) => {
                    const m = getStudentMarks(s.id);
                    const total = (m?.physics || 0) + (m?.chemistry || 0) + (m?.math || 0) + (m?.biology || 0) + (m?.computer || 0);
                    
                    return (
                      <tr key={s.id} className="border-b border-[#1e2130] last:border-0 hover:bg-[#1a1f30] transition-colors">
                        <td className="px-4 py-3 text-[#d1d5db]">{i + 1}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-white">{s.name}</span>
                        </td>
                        <td className="px-4 py-3 text-[#d1d5db]">{s.class}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {Array.from(new Set(s.enrollments?.map((e: any) => e.batches?.name))).filter(Boolean).map((batchName) => (
                              <Badge key={batchName as string} variant="violet">{batchName as string}</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-2 py-3 text-center">
                          <input 
                            type="number"
                            value={m?.physics ?? ''}
                            placeholder="—"
                            onChange={(e) => handleMarkChange(s.id, 'physics', e.target.value)}
                            className="w-12 bg-[#1e2130] border-none text-center text-xs p-1 focus:ring-1 focus:ring-violet-500 rounded"
                          />
                        </td>
                        <td className="px-2 py-3 text-center">
                          <input 
                            type="number"
                            value={m?.chemistry ?? ''}
                            placeholder="—"
                            onChange={(e) => handleMarkChange(s.id, 'chemistry', e.target.value)}
                            className="w-12 bg-[#1e2130] border-none text-center text-xs p-1 focus:ring-1 focus:ring-violet-500 rounded"
                          />
                        </td>
                        <td className="px-2 py-3 text-center">
                          <input 
                            type="number"
                            value={m?.math ?? ''}
                            placeholder="—"
                            onChange={(e) => handleMarkChange(s.id, 'math', e.target.value)}
                            className="w-12 bg-[#1e2130] border-none text-center text-xs p-1 focus:ring-1 focus:ring-violet-500 rounded"
                          />
                        </td>
                        <td className="px-2 py-3 text-center">
                          <input 
                            type="number"
                            value={m?.biology ?? ''}
                            placeholder="—"
                            onChange={(e) => handleMarkChange(s.id, 'biology', e.target.value)}
                            className="w-12 bg-[#1e2130] border-none text-center text-xs p-1 focus:ring-1 focus:ring-violet-500 rounded"
                          />
                        </td>
                        <td className="px-2 py-3 text-center">
                          <input 
                            type="number"
                            value={m?.computer ?? ''}
                            placeholder="—"
                            onChange={(e) => handleMarkChange(s.id, 'computer', e.target.value)}
                            className="w-12 bg-[#1e2130] border-none text-center text-xs p-1 focus:ring-1 focus:ring-violet-500 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={total > 0 ? "font-bold text-violet-400" : "text-[#4b5563]"}>
                            {total || '—'}
                          </span>
                        </td>
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
          input { border: none !important; background: transparent !important; color: black !important; width: 30px !important; }
          .badge { background: none !important; border: 1px solid #ccc !important; color: black !important; padding: 1px 4px !important; }
        }
      `}</style>
    </div>
  );
}
