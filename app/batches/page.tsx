'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Plus, Layers, Edit2 } from 'lucide-react';
import { getBatches, createBatch, getBatchStudentCount, updateBatch } from '@/lib/queries/batches';
import type { Batch } from '@/types';

export default function BatchesPage() {
  const router = useRouter();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [form, setForm] = useState({ name: '', class: '' });

  async function load() {
    try {
      const b = await getBatches();
      setBatches(b);
      const c: Record<string, number> = {};
      await Promise.all(b.map(async (batch) => {
        c[batch.id] = await getBatchStudentCount(batch.id);
      }));
      setCounts(c);
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.class) return;
    setSaving(true);
    try {
      if (selectedBatch) {
        await updateBatch(selectedBatch.id, form);
      } else {
        await createBatch(form);
      }
      router.refresh();
      setOpen(false); 
      setForm({ name: '', class: '' });
      setSelectedBatch(null);
      await load();
    } catch {} finally { setSaving(false); }
  }

  function openEdit(b: Batch) {
    setSelectedBatch(b);
    setForm({ name: b.name, class: b.class });
    setOpen(true);
  }

  function openCreate() {
    setSelectedBatch(null);
    setForm({ name: '', class: '' });
    setOpen(true);
  }

  const columns = [
    { key: 'name', header: 'Batch Name', render: (b: Batch) => <span className="font-medium text-white">{b.name}</span> },
    { key: 'class', header: 'Class', render: (b: Batch) => <span>Class {b.class}</span> },
    { key: 'students', header: 'Students', render: (b: Batch) => (
      <span className="text-violet-400 font-bold">{counts[b.id] ?? '—'}</span>
    )},
    { key: 'created_at', header: 'Created', render: (b: Batch) => (
      <span className="text-[#6b7280] text-xs">{b.created_at ? new Date(b.created_at).toLocaleDateString() : '—'}</span>
    )},
  ];

  return (
    <div>
      <Header title="Batches" subtitle="Manage teaching batches" />
      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate}>Create Batch</Button>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-[#141722] border border-[#1e2130] rounded-xl animate-pulse" />)}</div>
        ) : (
          <>
            {/* Batch Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {batches.map(b => (
                <Card key={b.id} className="hover:border-violet-500/40 transition-colors relative group">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                      <Layers className="w-5 h-5 text-violet-400" />
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[#6b7280] text-xs">Class {b.class}</span>
                       <button 
                        onClick={(e) => { e.stopPropagation(); openEdit(b); }}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-[#4b5563] hover:text-white transition-all opacity-0 group-hover:opacity-100"
                       >
                        <Edit2 className="w-3.5 h-3.5" />
                       </button>
                    </div>
                  </div>
                  <p className="text-white font-semibold mt-3">{b.name}</p>
                  <p className="text-[#9ca3af] text-sm mt-1">
                    <span className="text-violet-400 font-bold">{counts[b.id] ?? 0}</span> students enrolled
                  </p>
                </Card>
              ))}
              {batches.length === 0 && (
                <div className="col-span-3 text-center py-12 text-[#4b5563]">No batches yet. Create your first batch!</div>
              )}
            </div>
          </>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={selectedBatch ? 'Edit Batch' : 'Create New Batch'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label>Batch Name *</label>
            <input placeholder="e.g. Batch A - Class 11" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label>Class *</label>
            <select value={form.class} onChange={e => setForm(f => ({ ...f, class: e.target.value }))}>
              <option value="">Select class</option>
              {['8','9','10','11','12'].map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{selectedBatch ? 'Update Batch' : 'Create Batch'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
