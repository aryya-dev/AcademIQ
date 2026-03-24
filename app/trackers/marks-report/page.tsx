'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Printer, TrendingUp, TrendingDown, Minus, AlertCircle, Search } from 'lucide-react';
import { getAllTestMarks } from '@/lib/queries/tests';
import { getEnrollments } from '@/lib/queries/enrollments';

const SUBJECTS = ['Physics', 'Chemistry', 'Maths', 'Computer', 'Biology'];

export default function MarksReportTracker() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [marksData, enrollmentData] = await Promise.all([
        getAllTestMarks(),
        getEnrollments()
      ]);

      // Map enrollments to get student batches
      const studentBatchMap: Record<string, string> = {};
      enrollmentData.forEach((en: any) => {
        studentBatchMap[en.student_id] = en.batches?.name || 'Unassigned';
      });

      // Group marks by student and subject
      const studentMarks: Record<string, any> = {};
      marksData.forEach((m: any) => {
        const sid = m.student_id;
        if (!studentMarks[sid]) {
          studentMarks[sid] = {
            id: sid,
            name: m.students?.name,
            batch: studentBatchMap[sid] || 'Unassigned',
            marks: {}, // subject -> list of marks sorted by date
          };
        }

        const subjectName = m.tests?.subjects?.name;
        if (subjectName && SUBJECTS.includes(subjectName)) {
          if (!studentMarks[sid].marks[subjectName]) {
            studentMarks[sid].marks[subjectName] = [];
          }
          studentMarks[sid].marks[subjectName].push({
            obtained: m.marks_obtained,
            max: m.tests.max_marks,
            date: m.tests.scheduled_date,
            percent: (m.marks_obtained / m.tests.max_marks) * 100
          });
        }
      });

      // Process trends & categories
      const processed = Object.values(studentMarks).map((s: any) => {
        const summary: Record<string, any> = {};
        let totalAvg = 0;
        let subjectsWithMarks = 0;
        let trendScore = 0; // Negative if declining, positive if improving

        SUBJECTS.forEach(sub => {
          const mList = s.marks[sub] || [];
          mList.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
          const last = mList[mList.length - 1];
          const prev = mList[mList.length - 2];
          
          if (last) {
            totalAvg += last.percent;
            subjectsWithMarks++;
            
            let trend = 'neutral';
            if (prev) {
              const diff = last.percent - prev.percent;
              if (diff > 5) { trend = 'up'; trendScore += 1; }
              else if (diff < -5) { trend = 'down'; trendScore -= 1; }
            }
            
            summary[sub] = { last: last.percent, trend };
          }
        });

        const avg = subjectsWithMarks > 0 ? totalAvg / subjectsWithMarks : 0;
        let category = 'Stable';
        if (avg < 40 || trendScore < -1) category = 'Needs Care';
        else if (trendScore > 1) category = 'Improving';
        else if (trendScore < -0.5) category = 'Declining';

        return { ...s, summary, avg, category };
      });

      // Sort by batch then name
      processed.sort((a, b) => {
        if (a.batch !== b.batch) return a.batch.localeCompare(b.batch);
        return a.name.localeCompare(b.name);
      });

      setData(processed);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filteredData = data.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.batch.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3 text-emerald-400" />;
    if (trend === 'down') return <TrendingDown className="w-3 h-3 text-red-400" />;
    return <Minus className="w-3 h-3 text-[#4b5563]" />;
  };

  const columns = [
    { key: 'name', header: 'Student', render: (s: any) => (
      <div>
        <div className="font-semibold text-white text-sm">{s.name}</div>
        <div className="text-[10px] text-[#6b7280]">{s.batch}</div>
      </div>
    )},
    ...SUBJECTS.map(sub => ({
      key: sub,
      header: sub,
      render: (s: any) => {
        const info = s.summary[sub];
        if (!info) return <span className="text-[#4b5563] text-xs">—</span>;
        return (
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-medium ${info.last < 40 ? 'text-red-400' : 'text-[#d1d5db]'}`}>
              {Math.round(info.last)}%
            </span>
            {getTrendIcon(info.trend)}
          </div>
        );
      }
    })),
    { key: 'avg', header: 'Overall', render: (s: any) => (
      <span className="font-bold text-violet-400 text-xs">{Math.round(s.avg)}%</span>
    )},
    { key: 'status', header: 'Status', render: (s: any) => {
      let color = 'secondary';
      if (s.category === 'Improving') color = 'emerald';
      if (s.category === 'Declining') color = 'amber';
      if (s.category === 'Needs Care') color = 'red';
      return (
        <Badge variant={color as any} className="text-[10px] py-0 px-2 h-5">
          {s.category === 'Needs Care' && <AlertCircle className="w-2.5 h-2.5 mr-1" />}
          {s.category}
        </Badge>
      );
    }},
  ];

  return (
    <div>
      <Header title="Marks Report Tracker" subtitle="Academic performance and trend analysis" />
      
      <div className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4 print:hidden">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4b5563]" />
            <input 
              placeholder="Search by student or batch..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <Button variant="secondary" icon={<Printer className="w-4 h-4" />} onClick={() => window.print()}>
            Print Report
          </Button>
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
              emptyMessage="No performance data available yet."
            />
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print-table, .print-table * { visibility: visible; }
          .print-table { position: absolute; left: 0; top: 0; width: 100%; border: 1px solid black; }
          .print-table table { border-collapse: collapse; width: 100%; }
          .print-table th, .print-table td { 
            border: 1px solid #000 !important; 
            padding: 4px 8px; 
            font-size: 10px; 
            color: black !important;
            white-space: nowrap;
          }
          .print-table th { background-color: #f2f2f2 !important; font-weight: bold; }
          .print-table tr { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
