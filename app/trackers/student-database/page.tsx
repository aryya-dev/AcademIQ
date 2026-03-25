'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Printer, Search, Download } from 'lucide-react';
import { getEnrollments } from '@/lib/queries/enrollments';
import { updateStudent } from '@/lib/queries/students';

// Custom batch order as requested
const BATCH_ORDER = [
  '12 JEE A', '12 JEE B', '12 NEET', '12 Boards',
  '11 JEE A', '11 JEE B', '11 NEET', '11 Boards'
];

const STATUS_OPTIONS = [
  'Active',
  'April Joinee',
  'Not contacted',
  "Contacted hasn't been confirmed for continuity",
  'Contacted, has confirmed',
  'Discontinue/permanent Inactive'
];

export default function StudentDatabaseTracker() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  async function load() {
    setLoading(true);
    try {
      const enrollments = await getEnrollments();
      
      // Group by student
      const studentMap: Record<string, any> = {};
      enrollments.forEach((en: any) => {
        const sid = en.student_id;
        if (!studentMap[sid]) {
          studentMap[sid] = {
            ...en.students,
            batches: [en.batches?.name].filter(Boolean),
            subjects: [en.subjects?.name].filter(Boolean),
          };
        } else {
          if (en.batches?.name && !studentMap[sid].batches.includes(en.batches.name)) {
            studentMap[sid].batches.push(en.batches.name);
          }
          if (en.subjects?.name && !studentMap[sid].subjects.includes(en.subjects.name)) {
            studentMap[sid].subjects.push(en.subjects.name);
          }
        }
      });

      let students = Object.values(studentMap);

      // Sorting logic: Primary by custom batch order, Secondary by name
      students.sort((a, b) => {
        const aBatch = a.batches[0] || '';
        const bBatch = b.batches[0] || '';
        
        const aIdx = BATCH_ORDER.indexOf(aBatch);
        const bIdx = BATCH_ORDER.indexOf(bBatch);
        
        const aVal = aIdx === -1 ? 999 : aIdx;
        const bVal = bIdx === -1 ? 999 : bIdx;
        
        if (aVal !== bVal) return aVal - bVal;
        return a.name.localeCompare(b.name);
      });

      setData(students);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleStatusChange(studentId: string, status: string) {
    try {
      await updateStudent(studentId, { status } as any);
      setData(prev => prev.map(s => s.id === studentId ? { ...s, status } : s));
    } catch (err) {
      alert('Failed to update status');
    }
  }

  async function handleRemarksChange(studentId: string, remarks: string) {
    try {
      // Assuming remarks might be a new field, we ignore if update fails due to schema
      await updateStudent(studentId, { remarks } as any);
      setData(prev => prev.map(s => s.id === studentId ? { ...s, remarks } : s));
    } catch (err) {}
  }

  const filteredData = data.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.school_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.batches.some((b: string) => b.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const columns = [
    { key: 'sl', header: 'SL#', render: (_: any, i: number) => <span>{i + 1}</span> },
    { key: 'name', header: 'Name', render: (s: any) => <span className="font-semibold text-white">{s.name}</span> },
    { key: 'school', header: 'School Name', render: (s: any) => <span className="text-sm">{s.school_name || '—'}</span> },
    { key: 'class', header: 'Class', render: (s: any) => <span>{s.class}</span> },
    { key: 'batch', header: 'Batch', render: (s: any) => (
      <div className="flex flex-wrap gap-1">
        {s.batches.map((b: string) => <Badge key={b} variant="violet">{b}</Badge>)}
      </div>
    )},
    { key: 'subject', header: 'Subject', render: (s: any) => (
      <span className="text-xs text-[#9ca3af]">{s.subjects.join(', ')}</span>
    )},
    { key: 'status', header: 'Status', render: (s: any) => (
      <select 
        value={s.status || ''} 
        onChange={(e) => handleStatusChange(s.id, e.target.value)}
        className="bg-[#1e2130] border border-[#2a2f45] text-xs rounded px-2 py-1 focus:outline-none focus:border-violet-500"
      >
        <option value="">Select Status</option>
        {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    )},
    { key: 'remarks', header: 'Remarks', render: (s: any) => (
      <input 
        value={s.remarks || ''} 
        placeholder="Add remarks..."
        onBlur={(e) => handleRemarksChange(s.id, e.target.value)}
        onChange={(e) => setData(prev => prev.map(item => item.id === s.id ? { ...item, remarks: e.target.value } : item))}
        className="bg-transparent border-b border-transparent hover:border-[#2a2f45] focus:border-violet-500 transition-colors text-xs w-full px-1"
      />
    )},
  ];

  function handlePrint() {
    window.print();
  }

  function handleExport() {
    const headings = ['SL#', 'Name', 'School Name', 'Class', 'Batch', 'Subject', 'Status', 'Remarks'];
    const rows = filteredData.map((s, i) => [
      i + 1,
      s.name || '-',
      s.school_name || '-',
      s.class || '-',
      (s.batches || []).join(', ') || '-',
      (s.subjects || []).join(', ') || '-',
      s.status || '-',
      s.remarks || '-'
    ]);

    // Format content for CSV (handle commas and quotes)
    const csvContent = [
      headings.join(','),
      ...rows.map(row => row.map(cell => {
        const str = String(cell);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Student_Database_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div>
      <Header title="Student Database" subtitle="Master roster with custom tracking" />
      
      <div className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4 print:hidden">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4b5563]" />
            <input 
              placeholder="Search by name, batch, school..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" icon={<Printer className="w-4 h-4" />} onClick={handlePrint}>Print Report</Button>
            <Button variant="secondary" icon={<Download className="w-4 h-4" />} onClick={handleExport}>Export Excel</Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 pt-4">
            {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-[#141722] border border-[#1e2130] rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="print-table overflow-x-auto">
            <Table 
              columns={columns} 
              data={filteredData} 
              emptyMessage="No students found matching your criteria."
            />
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print-table, .print-table * { visibility: visible; }
          .print-table { position: absolute; left: 0; top: 0; width: 100%; }
          .print-table table { border-collapse: collapse; }
          .print-table th, .print-table td { border: 1px solid #ddd; padding: 8px; font-size: 10px; color: black !important; }
          .print-table th { background-color: #f2f2f2 !important; }
          input, select { border: none !important; appearance: none; background: transparent !important; }
        }
      `}</style>
    </div>
  );
}
