"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Table from '@/components/ui/Table';
import Badge, { statusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { getStudents, updateStudent, deleteStudent } from '@/lib/queries/students';
import { getBatches } from '@/lib/queries/batches';
import { getSubjects } from '@/lib/queries/subjects';
import { getEnrollmentsByStudent, createEnrollment, deleteEnrollment } from '@/lib/queries/enrollments';
import type { Student, Batch, Subject } from '@/types';
import Link from 'next/link';
import Modal from '@/components/ui/Modal';
import StudentForm from '@/components/forms/StudentForm';
import { Edit2, Plus, Search, User, Trash2 } from 'lucide-react';

interface EnrollmentEntry {
  id: string;
  batch_id: string;
  subject_id: string;
}

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filtered, setFiltered] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedEnrollments, setSelectedEnrollments] = useState<EnrollmentEntry[]>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    Promise.all([getStudents(), getBatches(), getSubjects()])
      .then(([studentData, batchData, subjectData]) => {
        setStudents(studentData);
        setFiltered(studentData);
        setBatches(batchData);
        setSubjects(subjectData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let data = students;
    if (classFilter !== 'all') data = data.filter(s => s.class === classFilter);
    if (statusFilter !== 'all') data = data.filter(s => s.status === statusFilter);
    if (batchFilter !== 'all') {
      data = data.filter(s =>
        s.enrollments?.some(e => e.batches?.id === batchFilter)
      );
    }
    if (search) data = data.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.school_name?.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(data);
  }, [students, search, classFilter, statusFilter, batchFilter]);

  // Helper: get unique batches for a student
  function getStudentBatches(s: Student) {
    if (!s.enrollments || s.enrollments.length === 0) return [];
    const seen = new Set<string>();
    return s.enrollments
      .filter(e => e.batches !== null)
      .filter(e => {
        if (seen.has(e.batches!.id)) return false;
        seen.add(e.batches!.id);
        return true;
      })
      .map(e => e.batches!);
  }

  async function openEditModal(s: Student) {
    setSelectedStudent(s);
    setSelectedEnrollments([]);
    setEnrollmentsLoading(true);
    setEditModalOpen(true);
    try {
      const enrollments = await getEnrollmentsByStudent(s.id);
      setSelectedEnrollments(
        enrollments.map((e: any) => ({ id: e.id, batch_id: e.batch_id, subject_id: e.subject_id }))
      );
    } catch {
      // ignore — form will still work without pre-filled enrollment
    } finally {
      setEnrollmentsLoading(false);
    }
  }

  async function handleDelete(studentId: string, studentName: string) {
    if (!confirm(`Are you sure you want to delete ${studentName}?`)) return;
    try {
      await deleteStudent(studentId);
      setStudents(prev => prev.filter(s => s.id !== studentId));
    } catch (err) {
      alert('Failed to delete student');
    }
  }

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
    {
      key: 'batches', header: 'Batch',
      render: (s: Student) => {
        const batchList = getStudentBatches(s);
        if (batchList.length === 0) return <span className="text-[#4b5563]">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {batchList.map(b => (
              <Badge key={b.id} variant="purple">{b.name}</Badge>
            ))}
          </div>
        );
      }
    },
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
            onClick={() => openEditModal(s)}
          >
            Edit
          </Button>
          <Link href={`/students/${s.id}`}>
            <Button variant="ghost" size="sm" icon={<User className="w-3.5 h-3.5" />}>Profile</Button>
          </Link>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10" 
            onClick={() => handleDelete(s.id, s.name)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )
    },
  ];

  async function handleUpdate(updates: {
    name: string; class: string; school_name: string;
    parent_phone: string; status: string;
    enrollments: { batch_id: string; selectedSubjectIds: string[] }[];
  }) {
    if (!selectedStudent) return;
    setUpdating(true);
    try {
      // 1. Update basic student fields
      await updateStudent(selectedStudent.id, {
        name: updates.name,
        class: updates.class,
        school_name: updates.school_name,
        parent_phone: updates.parent_phone,
        status: updates.status as any,
      });

      // 2. Sync enrollments
      // Get current enrollments to identify what to delete
      const currentEnrollments = await getEnrollmentsByStudent(selectedStudent.id);
      
      // Delete all existing enrollments for this student (simplest sync approach)
      await Promise.all(currentEnrollments.map((e: any) => deleteEnrollment(e.id)));

      // Create new enrollments from the blocks
      const createPromises = updates.enrollments.flatMap(block => 
        block.selectedSubjectIds.map(sid => 
          createEnrollment({
            student_id: selectedStudent.id,
            batch_id: block.batch_id,
            subject_id: sid,
            role: 'primary',
          })
        )
      );
      await Promise.all(createPromises);

      setEditModalOpen(false);
      // Refresh the list
      const data = await getStudents();
      setStudents(data);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to update student');
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
          <div className="flex gap-3 flex-1 max-w-2xl flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4b5563]" />
              <input
                placeholder="Search students..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
              className="h-10 bg-[#0a0c14] border-[#1e2130] rounded-xl px-4 text-white text-sm"
            >
              <option value="all">All Classes</option>
              <option value="11">Class 11</option>
              <option value="12">Class 12</option>
            </select>
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
              className="h-10 bg-[#0a0c14] border-[#1e2130] rounded-xl px-4 text-white text-sm min-w-[150px]"
            >
              <option value="all">All Statuses</option>
              {[
                'Active',
                'April Joinee',
                'Not contacted',
                "Contacted hasn't been confirmed for continuity",
                'Contacted, has confirmed',
                'Discontinue/permanent Inactive'
              ].map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)} style={{ width: 'auto' }}>
              <option value="all">All Batches</option>
              {batches
                .filter(b => classFilter === 'all' || b.class === classFilter)
                .map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
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
          enrollmentsLoading ? (
            <div className="space-y-3 py-4">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-[#141722] rounded-xl animate-pulse border border-[#1e2130]" />)}
            </div>
          ) : (
            <StudentForm
              initialData={selectedStudent}
              onSubmit={handleUpdate}
              loading={updating}
              submitLabel="Update Student"
              batches={batches}
              subjects={subjects}
              existingEnrollments={selectedEnrollments}
            />
          )
        )}
      </Modal>
    </div>
  );
}
