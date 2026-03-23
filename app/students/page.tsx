"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Table from '@/components/ui/Table';
import Badge, { statusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { getStudents, updateStudent } from '@/lib/queries/students';
import type { Student } from '@/types';
import Link from 'next/link';
import Modal from '@/components/ui/Modal';
import StudentForm from '@/components/forms/StudentForm';
import { Edit2, Plus, Search, User } from 'lucide-react';

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [filtered, setFiltered] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    getStudents()
      .then(data => { setStudents(data); setFiltered(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let data = students;
    if (statusFilter !== 'all') data = data.filter(s => s.status === statusFilter);
    if (search) data = data.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.school_name?.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(data);
  }, [students, search, statusFilter]);

  const columns = [
    {
      key: 'name', header: 'Student',
      render: (s: Student) => (
        <Link href={`/students/${s.id}`} className="flex items-center gap-3 hover:text-violet-400 transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {s.name.charAt(0)}
          </div>
          <span className="font-medium">{s.name}</span>
        </Link>
      )
    },
    { key: 'class', header: 'Class', render: (s: Student) => <span>Class {s.class}</span> },
    { key: 'school_name', header: 'School' },
    { key: 'parent_phone', header: 'Parent Phone', render: (s: Student) => <span className="font-mono text-sm">{s.parent_phone || '—'}</span> },
    { key: 'status', header: 'Status', render: (s: Student) => <Badge variant={statusBadge(s.status)}>{s.status}</Badge> },
    {
      key: 'actions', header: '',
      render: (s: Student) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            icon={<Edit2 className="w-3.5 h-3.5" />}
            onClick={() => { setSelectedStudent(s); setEditModalOpen(true); }}
          >
            Edit
          </Button>
          <Link href={`/students/${s.id}`}>
            <Button variant="ghost" size="sm" icon={<User className="w-3.5 h-3.5" />}>Profile</Button>
          </Link>
        </div>
      )
    },
  ];

  async function handleUpdate(updates: any) {
    if (!selectedStudent) return;
    setUpdating(true);
    try {
      await updateStudent(selectedStudent.id, updates);
      setEditModalOpen(false);
      const data = await getStudents();
      setStudents(data);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div>
      <Header title="Students" subtitle={`${students.length} total students`} />
      <div className="p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-3 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4b5563]" />
              <input
                placeholder="Search students..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 'auto' }}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
            </select>
          </div>
          <Link href="/students/new">
            <Button icon={<Plus className="w-4 h-4" />}>Add Student</Button>
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-[#141722] rounded-xl animate-pulse border border-[#1e2130]" />)}
          </div>
        ) : (
          <Table
            columns={columns as any}
            data={filtered as any}
            emptyMessage="No students found. Add your first student!"
            getKey={(s: any) => s.id}
          />
        )}
      </div>

      <Modal 
        open={editModalOpen} 
        onClose={() => setEditModalOpen(false)} 
        title={`Edit Student: ${selectedStudent?.name}`}
        size="md"
      >
        {selectedStudent && (
          <StudentForm 
            initialData={selectedStudent} 
            onSubmit={handleUpdate} 
            loading={updating}
            submitLabel="Update Student"
          />
        )}
      </Modal>
    </div>
  );
}
