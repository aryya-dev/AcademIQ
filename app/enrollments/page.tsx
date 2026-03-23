'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import { Plus, GitMerge, Trash2, Edit2 } from 'lucide-react';
import { getEnrollments, createEnrollment, deleteEnrollment, updateEnrollment } from '@/lib/queries/enrollments';
import { getStudents } from '@/lib/queries/students';
import { getBatches } from '@/lib/queries/batches';
import { getSubjects } from '@/lib/queries/subjects';
import { getTeachers, getTeachersBySubject } from '@/lib/queries/teachers';

export default function EnrollmentsPage() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);
  const [form, setForm] = useState({ student_id: '', batch_id: '', subject_id: '', teacher_id: '', role: 'primary' });
  const [filteredTeachers, setFilteredTeachers] = useState<any[]>([]);

  useEffect(() => {
    if (form.subject_id) {
      getTeachersBySubject(form.subject_id).then(setFilteredTeachers);
    } else {
      setFilteredTeachers([]);
    }
  }, [form.subject_id]);

  async function load() {
    try {
      const [e, s, b, sub, t] = await Promise.all([
        getEnrollments(), getStudents(), getBatches(), getSubjects(), getTeachers()
      ]);
      setEnrollments(e); setStudents(s); setBatches(b); setSubjects(sub); setTeachers(t);
    } catch {} finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.student_id || !form.batch_id || !form.subject_id || !form.teacher_id) return;
    setSaving(true);
    try {
      if (selectedEnrollment) {
        await updateEnrollment(selectedEnrollment.id, form as any);
      } else {
        await createEnrollment(form as any);
      }
      router.refresh();
      setOpen(false);
      setForm({ student_id: '', batch_id: '', subject_id: '', teacher_id: '', role: 'primary' });
      setSelectedEnrollment(null);
      await load();
    } catch {} finally { setSaving(false); }
  }

  function openEdit(r: any) {
    setSelectedEnrollment(r);
    setForm({
      student_id: r.student_id,
      batch_id: r.batch_id,
      subject_id: r.subject_id,
      teacher_id: r.teacher_id,
      role: r.role || 'primary'
    });
    setOpen(true);
  }

  function openCreate() {
    setSelectedEnrollment(null);
    setForm({ student_id: '', batch_id: '', subject_id: '', teacher_id: '', role: 'primary' });
    setOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this enrollment?')) return;
    await deleteEnrollment(id);
    router.refresh();
    await load();
  }

  const columns = [
    { key: 'student', header: 'Student', render: (r: any) => <span className="font-medium text-white">{r.students?.name}</span> },
    { key: 'batch', header: 'Batch', render: (r: any) => <span>{r.batches?.name}</span> },
    { key: 'subject', header: 'Subject', render: (r: any) => <Badge variant="purple">{r.subjects?.name}</Badge> },
    { key: 'teacher', header: 'Teacher', render: (r: any) => <span>{r.teachers?.name}</span> },
    { key: 'role', header: 'Role', render: (r: any) => <Badge variant={r.role === 'primary' ? 'info' : 'default'}>{r.role}</Badge> },
    { key: 'actions', header: '', render: (r: any) => (
      <div className="flex gap-2 justify-end">
        <Button variant="secondary" size="sm" icon={<Edit2 className="w-3.5 h-3.5" />} onClick={() => openEdit(r)}>Edit</Button>
        <Button variant="danger" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => handleDelete(r.id)}>Remove</Button>
      </div>
    )},
  ];

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      <Header title="Enrollment Engine" subtitle="Link students to batches, subjects, and teachers" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#9ca3af] text-sm">
            <GitMerge className="w-4 h-4 text-violet-400" />
            {enrollments.length} active enrollments
          </div>
          <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate}>New Enrollment</Button>
        </div>

        {loading ? (
          <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-12 bg-[#141722] border border-[#1e2130] rounded-xl animate-pulse" />)}</div>
        ) : (
          <Table columns={columns} data={enrollments} emptyMessage="No enrollments yet." getKey={(r: any) => r.id} />
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={selectedEnrollment ? "Edit Enrollment" : "Add Enrollment"} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label>Student *</label>
            <select value={form.student_id} onChange={e => set('student_id', e.target.value)}>
              <option value="">Select student</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} — Class {s.class}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Batch *</label>
              <select value={form.batch_id} onChange={e => set('batch_id', e.target.value)}>
                <option value="">Select batch</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label>Subject *</label>
              <select value={form.subject_id} onChange={e => set('subject_id', e.target.value)}>
                <option value="">Select subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Teacher *</label>
              <select value={form.teacher_id} onChange={e => set('teacher_id', e.target.value)} disabled={!form.subject_id}>
                <option value="">{form.subject_id ? 'Select teacher' : 'Select subject first'}</option>
                {filteredTeachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label>Role</label>
              <select value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{selectedEnrollment ? 'Update' : 'Enroll'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
