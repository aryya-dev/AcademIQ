'use client';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import { Check, Plus, X } from 'lucide-react';
import type { Student, Batch, Subject } from '@/types';

interface ExistingEnrollment {
  id: string;
  batch_id: string;
  subject_id: string;
}

interface EnrollmentBlock {
  batch_id: string;
  selectedSubjectIds: string[];
}

interface StudentFormProps {
  initialData?: Partial<Student>;
  onSubmit: (data: {
    name: string;
    class: string;
    school_name: string;
    parent_phone: string;
    status: string;
    enrollments: EnrollmentBlock[];
  }) => Promise<void>;
  loading?: boolean;
  submitLabel?: string;
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
  // Group existing enrollments by batch
  const initialEnrollmentBlocks: EnrollmentBlock[] = [];
  const existingMap: Record<string, string[]> = {};
  existingEnrollments.forEach(e => {
    if (!existingMap[e.batch_id]) existingMap[e.batch_id] = [];
    existingMap[e.batch_id].push(e.subject_id);
  });
  
  Object.keys(existingMap).forEach(bid => {
    initialEnrollmentBlocks.push({ batch_id: bid, selectedSubjectIds: existingMap[bid] });
  });

  // If no enrollments, start with one empty block
  if (initialEnrollmentBlocks.length === 0 && batches.length > 0) {
    initialEnrollmentBlocks.push({ batch_id: '', selectedSubjectIds: [] });
  }

  const [form, setForm] = useState({
    name: initialData?.name || '',
    class: initialData?.class || '',
    school_name: initialData?.school_name || '',
    parent_phone: initialData?.parent_phone || '',
    status: initialData?.status || 'Not contacted',
    enrollmentBlocks: initialEnrollmentBlocks,
  });

  const setBasic = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const updateBlock = (idx: number, updates: Partial<EnrollmentBlock>) => {
    setForm(f => ({
      ...f,
      enrollmentBlocks: f.enrollmentBlocks.map((b, i) => i === idx ? { ...b, ...updates } : b)
    }));
  };

  const addBlock = () => {
    setForm(f => ({
      ...f,
      enrollmentBlocks: [...f.enrollmentBlocks, { batch_id: '', selectedSubjectIds: [] }]
    }));
  };

  const removeBlock = (idx: number) => {
    setForm(f => ({
      ...f,
      enrollmentBlocks: f.enrollmentBlocks.filter((_, i) => i !== idx)
    }));
  };

  const toggleSubject = (blockIdx: number, subjectId: string) => {
    setForm(f => ({
      ...f,
      enrollmentBlocks: f.enrollmentBlocks.map((b, i) => {
        if (i !== blockIdx) return b;
        const exists = b.selectedSubjectIds.includes(subjectId);
        return {
          ...b,
          selectedSubjectIds: exists
            ? b.selectedSubjectIds.filter(sid => sid !== subjectId)
            : [...b.selectedSubjectIds, subjectId]
        };
      })
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: form.name,
      class: form.class,
      school_name: form.school_name,
      parent_phone: form.parent_phone,
      status: form.status,
      enrollments: form.enrollmentBlocks.filter(b => b.batch_id && b.selectedSubjectIds.length > 0)
    });
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
          <label className="text-[#6b7280] text-xs font-semibold mb-1.5 block">Full Name *</label>
          <input
            placeholder="Student's full name"
            value={form.name}
            onChange={e => setBasic('name', e.target.value)}
            required
            className="w-full bg-[#0a0c14] border-[#1e2130] rounded-xl py-2.5 px-4 text-white focus:border-violet-500 transition-colors"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[#6b7280] text-xs font-semibold mb-1.5 block">Class *</label>
            <select
              value={form.class}
              onChange={e => setBasic('class', e.target.value)}
              required
              className="w-full h-11 bg-[#0a0c14] border-[#1e2130] rounded-xl px-4 text-white focus:border-violet-500 transition-colors"
            >
              <option value="">Select class</option>
              {['8','9','10','11','12'].map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[#6b7280] text-xs font-semibold mb-1.5 block">Status</label>
            <select
              value={form.status}
              onChange={e => setBasic('status', e.target.value)}
              className="w-full h-11 bg-[#0a0c14] border-[#1e2130] rounded-xl px-4 text-white focus:border-violet-500 transition-colors"
            >
              {[
                'Active',
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
            <label className="text-[#6b7280] text-xs font-semibold mb-1.5 block">School Name</label>
            <input
              placeholder="School or college"
              value={form.school_name}
              onChange={e => setBasic('school_name', e.target.value)}
              className="w-full bg-[#0a0c14] border-[#1e2130] rounded-xl py-2.5 px-4 text-white focus:border-violet-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-[#6b7280] text-xs font-semibold mb-1.5 block">Parent Phone</label>
            <input
              placeholder="+91 XXXXX XXXXX"
              value={form.parent_phone}
              onChange={e => setBasic('parent_phone', e.target.value)}
              className="w-full bg-[#0a0c14] border-[#1e2130] rounded-xl py-2.5 px-4 text-white focus:border-violet-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Enrollment Section */}
      {showEnrollment && (
        <div className="space-y-6 pt-2">
          <div className="flex items-center justify-between border-b border-[#1e2130] pb-2">
            <h3 className="text-white font-semibold text-sm">Academic Enrollment</h3>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={addBlock}
              className="text-violet-400 hover:text-violet-300 h-8"
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Batch
            </Button>
          </div>

          <div className="space-y-6">
            {form.enrollmentBlocks.map((block, idx) => (
              <div key={idx} className="relative p-4 rounded-xl border border-[#1e2130] bg-[#141722]/50 space-y-4">
                {form.enrollmentBlocks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeBlock(idx)}
                    className="absolute top-2 right-2 text-[#4b5563] hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <div>
                  <label className="text-[#6b7280] text-[10px] uppercase font-bold tracking-widest mb-2 block">Assign Batch</label>
                  <select
                    value={block.batch_id}
                    onChange={e => updateBlock(idx, { batch_id: e.target.value })}
                    className="w-full h-10 bg-[#0a0c14] border-[#1e2130] rounded-xl px-4 text-white text-sm focus:border-violet-500 transition-colors"
                  >
                    <option value="">No batch assigned</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} (Class {b.class})</option>
                    ))}
                  </select>
                </div>

                {subjects.length > 0 && (
                  <div>
                    <label className="text-[#6b7280] text-[10px] uppercase font-bold tracking-widest mb-2 block">Select Subjects</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {subjects.map(s => {
                        const selected = block.selectedSubjectIds.includes(s.id);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => toggleSubject(idx, s.id)}
                            className={`flex items-center justify-between p-2 rounded-lg border text-[11px] transition-all ${
                              selected
                                ? 'bg-violet-500/10 border-violet-500/50 text-violet-400 font-medium'
                                : 'bg-[#0a0c14] border-[#1e2130] text-[#9ca3af] hover:border-[#2a2f45]'
                            }`}
                          >
                            {s.name}
                            {selected && <Check className="w-3 h-3" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full justify-center py-3 font-semibold text-sm">
        {submitLabel || 'Save Changes'}
      </Button>
    </form>
  );
}
