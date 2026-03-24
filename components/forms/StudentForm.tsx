'use client';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import { Check } from 'lucide-react';
import type { Student, Batch, Subject } from '@/types';

interface ExistingEnrollment {
  id: string;
  batch_id: string;
  subject_id: string;
}

interface StudentFormProps {
  initialData?: Partial<Student>;
  onSubmit: (data: {
    name: string;
    class: string;
    school_name: string;
    parent_phone: string;
    status: string;
    batch_id: string;
    selectedSubjectIds: string[];
    existingEnrollments?: ExistingEnrollment[];
  }) => Promise<void>;
  loading?: boolean;
  submitLabel?: string;
  // For enrollment editing
  batches?: Batch[];
  subjects?: Subject[];
  existingEnrollments?: ExistingEnrollment[];
}

export default function StudentForm({
  initialData,
  onSubmit,
  loading,
  submitLabel,
  batches = [],
  subjects = [],
  existingEnrollments = [],
}: StudentFormProps) {
  // Derive current batch & subjects from existing enrollments
  const initialBatchId = existingEnrollments[0]?.batch_id || '';
  const initialSubjectIds = existingEnrollments.map(e => e.subject_id);

  const [form, setForm] = useState({
    name: initialData?.name || '',
    class: initialData?.class || '',
    school_name: initialData?.school_name || '',
    parent_phone: initialData?.parent_phone || '',
    status: initialData?.status || 'Not contacted',
    batch_id: initialBatchId,
    selectedSubjectIds: initialSubjectIds,
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const toggleSubject = (id: string) => {
    setForm(f => ({
      ...f,
      selectedSubjectIds: f.selectedSubjectIds.includes(id)
        ? f.selectedSubjectIds.filter(sid => sid !== id)
        : [...f.selectedSubjectIds, id],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, existingEnrollments });
  };

  const showEnrollment = batches.length > 0 || subjects.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        {showEnrollment && (
          <h3 className="text-white font-semibold text-sm border-b border-[#1e2130] pb-2">Basic Information</h3>
        )}
        <div>
          <label>Full Name *</label>
          <input
            placeholder="Student's full name"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            required
            className="w-full bg-[#0a0c14] border-[#1e2130] rounded-xl py-3 text-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>Class *</label>
            <select
              value={form.class}
              onChange={e => set('class', e.target.value)}
              required
              className="w-full bg-[#0a0c14] border-[#1e2130] rounded-xl py-3 text-white"
            >
              <option value="">Select class</option>
              {['8','9','10','11','12'].map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>
          <div>
            <label>Status</label>
            <select
              value={form.status}
              onChange={e => set('status', e.target.value)}
              className="w-full bg-[#0a0c14] border-[#1e2130] rounded-xl py-3 text-white"
            >
              {[
                'April Joinee',
                'Not contacted',
                "Contacted hasn't been confirmed for continuity",
                'Contacted, has confirmed',
                'Discontinue/permanent Inactive'
              ].map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>School Name</label>
            <input
              placeholder="School or college"
              value={form.school_name}
              onChange={e => set('school_name', e.target.value)}
              className="w-full bg-[#0a0c14] border-[#1e2130] rounded-xl py-3 text-white"
            />
          </div>
          <div>
            <label>Parent Phone</label>
            <input
              placeholder="+91 XXXXX XXXXX"
              value={form.parent_phone}
              onChange={e => set('parent_phone', e.target.value)}
              className="w-full bg-[#0a0c14] border-[#1e2130] rounded-xl py-3 text-white"
            />
          </div>
        </div>
      </div>

      {/* Enrollment Section — only shown when batches/subjects are passed */}
      {showEnrollment && (
        <div className="space-y-4 pt-2">
          <h3 className="text-white font-semibold text-sm border-b border-[#1e2130] pb-2">Academic Enrollment</h3>
          {batches.length > 0 && (
            <div>
              <label>Batch</label>
              <select
                value={form.batch_id}
                onChange={e => set('batch_id', e.target.value)}
                className="w-full bg-[#0a0c14] border-[#1e2130] rounded-xl py-3 text-white"
              >
                <option value="">No batch assigned</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.name} (Class {b.class})</option>
                ))}
              </select>
            </div>
          )}
          {subjects.length > 0 && (
            <div>
              <label className="mb-2 block">Subjects Taken</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {subjects.map(s => {
                  const selected = form.selectedSubjectIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSubject(s.id)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-all ${
                        selected
                          ? 'bg-violet-500/20 border-violet-500 text-white'
                          : 'bg-[#141722] border-[#1e2130] text-[#9ca3af]'
                      }`}
                    >
                      {s.name}
                      {selected && <Check className="w-3 h-3 text-violet-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full justify-center py-3">
        {submitLabel || 'Save Changes'}
      </Button>
    </form>
  );
}
