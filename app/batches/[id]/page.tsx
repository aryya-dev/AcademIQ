'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Card, StatCard } from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  ArrowLeft, 
  BookOpen, 
  ChevronRight,
  ClipboardList,
  AlertCircle
} from 'lucide-react';
import { getBatchById, getStudentsInBatch } from '@/lib/queries/batches';
import { getTests, getBatchTestMarks } from '@/lib/queries/tests';
import type { Batch } from '@/types';

export default function BatchDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({ strength: 0, condition: 0 });

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const [b, s, t, marksData] = await Promise.all([
          getBatchById(id as string),
          getStudentsInBatch(id as string),
          getTests(id as string),
          getBatchTestMarks(id as string)
        ]);

        // Group students and aggregate subjects
        const groupedMap: Record<string, any> = {};
        s.forEach((en: any) => {
          const sid = en.students?.id;
          if (!sid) return;
          if (!groupedMap[sid]) {
            groupedMap[sid] = {
              ...en,
              subjects: [en.subjects?.name].filter(Boolean)
            };
          } else {
            if (en.subjects?.name && !groupedMap[sid].subjects.includes(en.subjects.name)) {
              groupedMap[sid].subjects.push(en.subjects.name);
            }
          }
        });
        const groupedStudents = Object.values(groupedMap);

        setBatch(b);
        setStudents(groupedStudents);
        setTests(t);

        // Calculate metrics
        const strength = groupedStudents.length;
        
        let totalMarks = 0;
        let totalMax = 0;
        
        marksData.forEach((m: any) => {
          if (m.marks_obtained !== null && m.marks_obtained !== undefined) {
            totalMarks += Number(m.marks_obtained);
            totalMax += Number(m.tests?.max_marks || 0);
          }
        });

        const condition = totalMax > 0 ? Math.round((totalMarks / totalMax) * 100) : 0;
        setMetrics({ strength, condition });

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col h-screen">
        <Header title="Loading..." />
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {[1,2,3].map(i => <div key={i} className="h-28 bg-[#141722] border border-[#1e2130] rounded-xl animate-pulse" />)}
          </div>
          <div className="h-64 bg-[#141722] border border-[#1e2130] rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-[#4b5563]">
        <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
        <p>Batch not found</p>
        <Button className="mt-4" onClick={() => router.push('/batches')}>Back to Batches</Button>
      </div>
    );
  }

  const studentColumns = [
    { 
      key: 'name', 
      header: 'Student Name', 
      render: (en: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 text-xs font-bold">
            {en.students?.name?.charAt(0)}
          </div>
          <span className="font-medium text-white">{en.students?.name}</span>
        </div>
      )
    },
    { 
      key: 'subjects', 
      header: 'Subjects', 
      render: (en: any) => (
        <div className="flex flex-wrap gap-1">
          {en.subjects.map((sub: string) => (
            <Badge key={sub} variant="secondary">{sub}</Badge>
          ))}
        </div>
      )
    },
    { 
      key: 'class', 
      header: 'Class', 
      render: (en: any) => <span className="text-[#9ca3af]">Class {en.students?.class}</span> 
    },
  ];

  const testColumns = [
    { key: 'title', header: 'Test Title', render: (t: any) => <span className="text-white font-medium">{t.title}</span> },
    { key: 'type', header: 'Type', render: (t: any) => <Badge variant={t.type === 'weekly' ? 'violet' : 'amber'}>{t.type}</Badge> },
    { key: 'subject', header: 'Subject', render: (t: any) => <span>{t.subjects?.name}</span> },
    { key: 'date', header: 'Date', render: (t: any) => <span className="text-[#6b7280]">{new Date(t.scheduled_date).toLocaleDateString()}</span> },
  ];

  return (
    <div>
      <Header 
        title={batch.name} 
        subtitle={`Class ${batch.class} • Management`} 
        action={
          <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => router.push('/batches')}>
            Back
          </Button>
        }
      />
      
      <div className="p-6 space-y-8">
        {/* Metric Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            label="Strength" 
            value={metrics.strength} 
            icon={<Users className="w-6 h-6" />} 
            color="violet"
            trend={`${metrics.strength} active students`}
          />
          <StatCard 
            label="Condition" 
            value={`${metrics.condition}%`} 
            icon={<TrendingUp className="w-6 h-6" />} 
            color={metrics.condition >= 75 ? 'emerald' : metrics.condition >= 50 ? 'amber' : 'red'}
            trend="Avg. Academic Score"
          />
          <StatCard 
            label="Total Tests" 
            value={tests.length} 
            icon={<ClipboardList className="w-6 h-6" />} 
            color="blue"
            trend={`${tests.filter(t => new Date(t.scheduled_date) < new Date()).length} completed`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Students List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-[#4b5563]" /> Enrolled Students
              </h3>
              <Button variant="secondary" size="sm" onClick={() => router.push('/enrollments')}>Manage</Button>
            </div>
            <Card className="p-0 overflow-hidden border-[#1e2130]">
              <Table 
                columns={studentColumns} 
                data={students} 
                onRowClick={(en) => router.push(`/students/${en.students?.id}`)}
              />
              {students.length === 0 && (
                <div className="text-center py-12 text-[#4b5563]">No students enrolled in this batch yet.</div>
              )}
            </Card>
          </div>

          {/* Tests List & Sidebar */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#4b5563]" /> Recent Tests
                </h3>
                <Button variant="secondary" size="sm" onClick={() => router.push('/tests')}>All Tests</Button>
              </div>
              <div className="space-y-3">
                {tests.slice(0, 5).map(t => (
                  <Card 
                    key={t.id} 
                    className="p-4 hover:border-violet-500/30 transition-all cursor-pointer group"
                    onClick={() => router.push(`/tests/${t.id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white text-sm font-medium group-hover:text-violet-400 transition-colors">{t.title}</p>
                        <p className="text-[#6b7280] text-xs mt-1">{t.subjects?.name} • {new Date(t.scheduled_date).toLocaleDateString()}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#4b5563] group-hover:text-violet-400 transition-all" />
                    </div>
                  </Card>
                ))}
                {tests.length === 0 && (
                   <div className="text-center py-8 bg-[#141722] border border-[#1e2130] rounded-xl text-[#4b5563] text-sm italic">
                    No tests scheduled yet
                   </div>
                )}
              </div>
            </div>

            {/* Batch Info Card */}
            <Card className="bg-violet-500/5 border-violet-500/20">
               <h4 className="text-violet-400 font-bold text-sm uppercase tracking-wider">Batch Details</h4>
               <div className="mt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6b7280]">Created On</span>
                    <span className="text-[#d1d5db]">{new Date(batch.created_at || '').toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6b7280]">Course Level</span>
                    <span className="text-[#d1d5db]">Class {batch.class} Academic</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6b7280]">Batch Status</span>
                    <Badge variant="emerald">Ongoing</Badge>
                  </div>
               </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
