'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { createStudent } from '@/lib/queries/students';
import { getBatches } from '@/lib/queries/batches';
import { getSubjects } from '@/lib/queries/subjects';
import { createEnrollment } from '@/lib/queries/enrollments';
import { ArrowLeft, UserPlus, Check } from 'lucide-react';
import Link from 'next/link';
import type { Batch, Subject } from '@/types';

export default function NewStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  
  const [batches, setBatches] = useState<Batch[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  const [form, setForm] = useState({
    name: '', class: '', school_name: '', parent_phone: '', status: 'active' as const,
    batch_id: '',
    selectedSubjectIds: [] as string[],
  });

  useEffect(() => {
    Promise.all([getBatches(), getSubjects()])
      .then(([b, s]) => { setBatches(b); setSubjects(s); })
      .catch(() => setError('Failed to load batches or subjects.'))
      .finally(() => setFetching(false));
  }, []);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const toggleSubject = (id: string) => {
    setForm(f => ({
      ...f,
      selectedSubjectIds: f.selectedSubjectIds.includes(id)
        ? f.selectedSubjectIds.filter(sid => sid !== id)
        : [...f.selectedSubjectIds, id]
    }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.class) { setError('Name and class are required.'); return; }
    if (!form.batch_id) { setError('Please select a batch.'); return; }
    if (form.selectedSubjectIds.length === 0) { setError('Please select at least one subject.'); return; }
    
    setLoading(true); setError('');
    try {
      // 1. Create Student
      const student = await createStudent({
        name: form.name,
        class: form.class,
        school_name: form.school_name,
        parent_phone: form.parent_phone,
        status: form.status,
      });

      // 2. Create Enrollments for each subject
      // teacher_id is null for now as per user request
      await Promise.all(form.selectedSubjectIds.map(sid => 
        createEnrollment({
          student_id: student.id,
          batch_id: form.batch_id,
          subject_id: sid,
          teacher_id: undefined as any, // Nullable in schema now
          role: 'primary'
        })
      ));

      router.refresh(); 
      router.push(`/students/${student.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create student and enrollments.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Header title="Add Student" subtitle="Create record & enroll in subjects" />
      <div className="p-6 max-w-2xl">
        <Link href="/students" className="inline-block mb-4">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>Back</Button>
        </Link>
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>
            )}

            <div className="space-y-4">
              <h3 className="text-white font-semibold text-sm border-b border-[#1e2130] pb-2">Basic Information</h3>
              <div>
                <label>Full Name *</label>
                <input placeholder="Student's full name" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Class *</label>
                  <select value={form.class} onChange={e => set('class', e.target.value)}>
                    <option value="">Select class</option>
                    {['8','9','10','11','12'].map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
                <div>
                  <label>Status</label>
                  <select value={form.status} onChange={e => set('status', e.target.value as any)}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on_leave">On Leave</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>School Name</label>
                  <input placeholder="School or college" value={form.school_name} onChange={e => set('school_name', e.target.value)} />
                </div>
                <div>
                  <label>Parent Phone</label>
                  <input placeholder="+91 XXXXX XXXXX" value={form.parent_phone} onChange={e => set('parent_phone', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h3 className="text-white font-semibold text-sm border-b border-[#1e2130] pb-2">Academic Enrollment</h3>
              <div>
                <label>Target Batch *</label>
                <select value={form.batch_id} onChange={e => set('batch_id', e.target.value)} disabled={fetching}>
                  <option value="">Select batch</option>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.name} (Class {b.class})</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2 block">Subjects Taken *</label>
                {fetching ? (
                  <div className="h-20 bg-[#141722] animate-pulse rounded-lg" />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {subjects.map(s => {
                      const selected = form.selectedSubjectIds.includes(s.id);
                      return (
                        <button
                          key={s.id} type="button"
                          onClick={() => toggleSubject(s.id)}
                          className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-all ${
                            selected ? 'bg-violet-500/20 border-violet-500 text-white' : 'bg-[#141722] border-[#1e2130] text-[#9ca3af]'
                          }`}
                        >
                          {s.name}
                          {selected && <Check className="w-3 h-3 text-violet-400" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" loading={loading} icon={<UserPlus className="w-4 h-4" />} className="w-full justify-center py-3">
              {loading ? 'Creating Student & Enrolling...' : 'Create Student & Enroll'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
