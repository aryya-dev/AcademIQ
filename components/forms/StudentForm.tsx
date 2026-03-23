'use client';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import type { Student } from '@/types';

interface StudentFormProps {
  initialData?: Partial<Student>;
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
  submitLabel?: string;
}

export default function StudentForm({ initialData, onSubmit, loading, submitLabel }: StudentFormProps) {
  const [form, setForm] = useState({
    name: initialData?.name || '',
    class: initialData?.class || '',
    school_name: initialData?.school_name || '',
    parent_phone: initialData?.parent_phone || '',
    status: initialData?.status || 'active',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
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
              onChange={e => set('status', e.target.value as any)}
              className="w-full bg-[#0a0c14] border-[#1e2130] rounded-xl py-3 text-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
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

      <Button type="submit" loading={loading} className="w-full justify-center py-3">
        {submitLabel || 'Save Changes'}
      </Button>
    </form>
  );
}
