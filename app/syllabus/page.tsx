'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge, { statusBadge } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { Plus, CheckCircle, Clock, BookMarked } from 'lucide-react';
import { getSyllabus, addSyllabusChapter, updateSyllabusStatus, deleteSyllabusChapter } from '@/lib/queries/syllabus';
import { getSubjects } from '@/lib/queries/subjects';
import { getBatches } from '@/lib/queries/batches';
import type { SyllabusTracker } from '@/types';

export default function SyllabusPage() {
  const router = useRouter();
  const [syllabus, setSyllabus] = useState<SyllabusTracker[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterBatch, setFilterBatch] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [form, setForm] = useState({ subject_id: '', batch_id: '', chapter: '', status: 'pending' as const });

  async function load() {
    try {
      const [s, sub, b] = await Promise.all([getSyllabus(), getSubjects(), getBatches()]);
      setSyllabus(s); setSubjects(sub); setBatches(b);
    } catch {} finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subject_id || !form.batch_id || !form.chapter) return;
    setSaving(true);
    try {
      await addSyllabusChapter(form);
      router.refresh();
      setOpen(false); setForm({ subject_id: '', batch_id: '', chapter: '', status: 'pending' });
      await load();
    } catch {} finally { setSaving(false); }
  }

  async function cycleStatus(item: SyllabusTracker) {
    const next = item.status === 'pending' ? 'in_progress' : item.status === 'in_progress' ? 'completed' : 'pending';
    const completedDate = next === 'completed' ? new Date().toISOString().split('T')[0] : undefined;
    await updateSyllabusStatus(item.id, next as any, completedDate);
    router.refresh();
    await load();
  }

  const filtered = syllabus.filter(s => {
    if (filterClass !== 'all' && (s as any).batches?.class !== filterClass) return false;
    if (filterSubject !== 'all' && (s as any).subject_id !== filterSubject) return false;
    if (filterBatch !== 'all' && (s as any).batch_id !== filterBatch) return false;
    return true;
  });

  const completed = filtered.filter(s => s.status === 'completed').length;
  const pct = filtered.length ? Math.round((completed / filtered.length) * 100) : 0;
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      <Header title="Syllabus Tracker" subtitle="Track chapter-by-chapter completion" />
      <div className="p-6 space-y-5">
        {/* Progress Bar */}
        {filtered.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#9ca3af] text-sm">Overall Completion</span>
              <span className={`text-lg font-bold ${pct >= 80 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{pct}%</span>
            </div>
            <div className="w-full h-2 bg-[#1e2130] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex gap-4 mt-3 text-xs text-[#6b7280]">
              <span><span className="text-emerald-400 font-bold">{completed}</span> completed</span>
              <span><span className="text-amber-400 font-bold">{filtered.filter(s => s.status === 'in_progress').length}</span> in progress</span>
              <span><span className="text-[#9ca3af] font-bold">{filtered.filter(s => s.status === 'pending').length}</span> pending</span>
            </div>
          </Card>
        )}

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-3">
            <select value={filterClass} onChange={e => setFilterClass(e.target.value)} style={{ width: 'auto' }}>
              <option value="all">All Classes</option>
              <option value="11">Class 11</option>
              <option value="12">Class 12</option>
            </select>
            <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} style={{ width: 'auto' }}>
              <option value="all">All Subjects</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={filterBatch} onChange={e => setFilterBatch(e.target.value)} style={{ width: 'auto' }}>
              <option value="all">All Batches</option>
              {batches
                .filter(b => filterClass === 'all' || b.class === filterClass)
                .map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setOpen(true)}>Add Chapter</Button>
        </div>

        {loading ? (
          <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-14 bg-[#141722] border border-[#1e2130] rounded-xl animate-pulse" />)}</div>
        ) : (
          <div className="space-y-2">
            {filtered.map(item => (
              <div key={item.id} className="flex items-center gap-4 p-4 bg-[#141722] border border-[#1e2130] rounded-xl hover:border-violet-500/30 transition-colors">
                <button onClick={() => cycleStatus(item)} className="shrink-0">
                  {item.status === 'completed'
                    ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                    : item.status === 'in_progress'
                    ? <Clock className="w-5 h-5 text-amber-400" />
                    : <div className="w-5 h-5 rounded-full border-2 border-[#4b5563]" />}
                </button>
                <div className="flex-1">
                  <p className={`font-medium text-sm ${item.status === 'completed' ? 'line-through text-[#6b7280]' : 'text-[#d1d5db]'}`}>
                    {item.chapter}
                  </p>
                  <p className="text-[#4b5563] text-xs mt-0.5">
                    {(item as any).subjects?.name} • {(item as any).batches?.name}
                    {item.completed_date && ` • Completed ${item.completed_date}`}
                  </p>
                </div>
                <Badge variant={statusBadge(item.status)}>{item.status.replace('_', ' ')}</Badge>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-[#4b5563]">No chapters added yet. Start tracking your syllabus!</div>
            )}
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Chapter" size="sm">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label>Chapter Name *</label>
            <input placeholder="e.g. Chapter 4: Thermodynamics" value={form.chapter} onChange={e => set('chapter', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Subject *</label>
              <select value={form.subject_id} onChange={e => set('subject_id', e.target.value)}>
                <option value="">Select</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label>Batch *</label>
              <select value={form.batch_id} onChange={e => set('batch_id', e.target.value)}>
                <option value="">Select</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label>Initial Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Add Chapter</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
