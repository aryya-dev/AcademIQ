'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge, { statusBadge } from '@/components/ui/Badge';
import { Search, AlertTriangle, CheckCircle2, UserPlus, Info } from 'lucide-react';
import { getStudents } from '@/lib/queries/students';
import { getEnrollments } from '@/lib/queries/enrollments';

const STATUS_FILTERS = [
  'April Joinee',
  'Not contacted',
  "Contacted hasn't been confirmed for continuity",
  'Contacted, has confirmed',
  'Discontinue/permanent Inactive'
];

export default function InformationTrackerPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  async function load() {
    setLoading(true);
    try {
      const [students, enrollments] = await Promise.all([
        getStudents(),
        getEnrollments()
      ]);

      // Calculate missing fields for each student
      const richStudents = students.map(s => {
        const studentEnrollments = enrollments.filter((e: any) => e.student_id === s.id);
        const missing = [];
        if (!s.parent_phone) missing.push('Phone');
        if (!s.school_name) missing.push('School');
        if (!s.class) missing.push('Class');
        if (studentEnrollments.length === 0) missing.push('Batch/Subjects');
        
        const firstEnrollment = studentEnrollments[0];
        const batchName = firstEnrollment?.batches?.name || 'Unassigned';

        return {
          ...s,
          batchName,
          missingCount: missing.length,
          missingFields: missing,
          isComplete: missing.length === 0
        };
      });

      setData(richStudents);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filteredData = data.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (s.batchName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    { 
      key: 'name', 
      header: 'Student', 
      render: (s: any) => (
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-[#1e2130] flex items-center justify-center text-violet-400 font-bold border border-[#2a2f45]">
              {s.name.charAt(0)}
            </div>
            {s.missingCount > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold border-2 border-[#0f1117] animate-pulse">
                {s.missingCount}
              </div>
            )}
          </div>
          <div>
            <div className="font-semibold text-white">{s.name}</div>
            <div className="text-[10px] text-[#4b5563]">{s.batchName}</div>
          </div>
        </div>
      )
    },
    { 
      key: 'status_bar', 
      header: 'Continuity', 
      render: (s: any) => (
        <div className="flex items-center gap-2">
          <div className={`h-1.5 w-12 rounded-full ${s.status === 'Discontinue/permanent Inactive' ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
            <div className={`h-full rounded-full ${s.status === 'Discontinue/permanent Inactive' ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: s.status === 'Discontinue/permanent Inactive' ? '100%' : '100%' }} />
          </div>
          <span className="text-[10px] uppercase tracking-wider text-[#6b7280] font-bold">
            {s.status === 'Discontinue/permanent Inactive' ? 'Inactive' : 'Active'}
          </span>
        </div>
      )
    },
    { 
      key: 'missing', 
      header: 'Missing Information', 
      render: (s: any) => (
        <div className="flex flex-wrap gap-1">
          {s.missingCount === 0 ? (
            <Badge variant="success">
              <CheckCircle2 className="w-3 h-3 mr-1" /> All details filled
            </Badge>
          ) : (
            s.missingFields.map((f: string) => (
              <Badge key={f} variant="danger" className="text-[10px]">
                {f}
              </Badge>
            ))
          )}
        </div>
      )
    },
    { 
      key: 'category', 
      header: 'Current Status', 
      render: (s: any) => (
        <Badge variant={statusBadge(s.status)} className="whitespace-nowrap">
          {s.status || 'Not set'}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: '',
      render: (s: any) => (
        <Button variant="ghost" size="sm" icon={<UserPlus className="w-3 h-3" />} onClick={() => window.location.href = `/students/${s.id}`}>
          Edit Info
        </Button>
      )
    }
  ];

  return (
    <div>
      <Header title="Information Tracker" subtitle="Identify and fill missing student details" />
      
      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-red-500/5 border-red-500/20">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-red-500/10 text-red-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{data.filter(s => !s.isComplete).length}</div>
                <div className="text-sm text-[#9ca3af]">Students with missing info</div>
              </div>
            </div>
          </Card>
          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{data.filter(s => s.isComplete).length}</div>
                <div className="text-sm text-[#9ca3af]">Fully documented</div>
              </div>
            </div>
          </Card>
          <Card className="bg-violet-500/5 border-violet-500/20">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-violet-500/10 text-violet-500">
                <Info className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white tracking-tight">{(data.filter(s => s.isComplete).length / Math.max(data.length, 1) * 100).toFixed(0)}%</div>
                <div className="text-sm text-[#9ca3af]">Overall Data Integrity</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#141722] p-4 rounded-xl border border-[#1e2130]">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4b5563]" />
            <input 
              placeholder="Search by student or batch..." 
              value={searchTerm} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 w-full"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs text-[#6b7280] hidden sm:inline">Filter Status:</span>
            <select 
              value={statusFilter} 
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
              className="bg-[#0f1117] border-[#1e2130] text-xs h-10 w-full sm:w-64"
            >
              <option value="all">All Statuses</option>
              {STATUS_FILTERS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="space-y-4">
            {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-[#141722] animate-pulse rounded-xl" />)}
          </div>
        ) : (
          <Table 
            columns={columns} 
            data={filteredData} 
            emptyMessage="No students found matching your criteria."
          />
        )}
      </div>
    </div>
  );
}
