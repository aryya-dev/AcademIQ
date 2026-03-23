'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge, { statusBadge } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { Plus, FileText, Clock, CheckCircle, AlertTriangle, Edit2 } from 'lucide-react';
import { getTests, createTest, updateTest, getOverdueEvaluations, getTestMarks, upsertTestMarks } from '@/lib/queries/tests';
import { getSubjects } from '@/lib/queries/subjects';
import { getBatches } from '@/lib/queries/batches';
import { getEnrollmentsByBatch } from '@/lib/queries/enrollments';

export default function TestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [openNew, setOpenNew] = useState(false);
  const [marksModal, setMarksModal] = useState<any | null>(null);
  const [marksData, setMarksData] = useState<any[]>([]);
  const [batchStudents, setBatchStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTest, setSelectedTest] = useState<any | null>(null);
  const [form, setForm] = useState({
    title: '', subject_id: '', batch_id: '', type: 'weekly',
    scheduled_date: '', eval_deadline: '', max_marks: 100
  });

  async function load() {
    try {
      const [t, s, b, o] = await Promise.all([getTests(), getSubjects(), getBatches(), getOverdueEvaluations()]);
      setTests(t); setSubjects(s); setBatches(b); setOverdueCount(o.length);
    } catch {} finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (selectedTest) {
        await updateTest(selectedTest.id, form as any);
      } else {
        await createTest(form as any);
      }
      router.refresh();
      setOpenNew(false);
      setForm({ title: '', subject_id: '', batch_id: '', type: 'weekly', scheduled_date: '', eval_deadline: '', max_marks: 100 });
      setSelectedTest(null);
      await load();
    } catch {} finally { setSaving(false); }
  }

  function openEdit(test: any) {
    setSelectedTest(test);
    setForm({
      title: test.title,
      subject_id: test.subject_id,
      batch_id: test.batch_id,
      type: test.type,
      scheduled_date: test.scheduled_date,
      eval_deadline: test.eval_deadline,
      max_marks: test.max_marks
    });
    setOpenNew(true);
  }

  function openCreate() {
    setSelectedTest(null);
    setForm({ title: '', subject_id: '', batch_id: '', type: 'weekly', scheduled_date: '', eval_deadline: '', max_marks: 100 });
    setOpenNew(true);
  }

  async function openMarks(test: any) {
    setMarksModal(test);
    const [existing, students] = await Promise.all([getTestMarks(test.id), getEnrollmentsByBatch(test.batch_id)]);
    const uniqueStudents = Array.from(new Map(students.map((e: any) => [e.students?.id, e.students])).values());
    const existingMap: Record<string, number> = {};
    existing.forEach((m: any) => { existingMap[m.student_id] = m.marks_obtained; });
    setMarksData(uniqueStudents.map((s: any) => ({ student_id: s?.id, name: s?.name, marks: existingMap[s?.id] ?? '' })));
    setBatchStudents(uniqueStudents);
  }

  async function saveMarks() {
    if (!marksModal) return;
    setSaving(true);
    try {
      await upsertTestMarks(marksData.filter(m => m.marks !== '').map(m => ({
        test_id: marksModal.id, student_id: m.student_id, marks_obtained: Number(m.marks), evaluated_at: new Date().toISOString()
      })));
      router.refresh();
      setMarksModal(null);
    } catch {} finally { setSaving(false); }
  }

  const typeColors: Record<string, any> = { weekly: 'info', class_test: 'purple', mock: 'warning', assignment: 'default' };
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      <Header title="Tests & Marks" subtitle="Manage tests and student evaluations" />
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          {overdueCount > 0 && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4" /> {overdueCount} overdue evaluations
            </div>
          )}
          <div className="ml-auto">
            <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate}>Create Test</Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-36 bg-[#141722] border border-[#1e2130] rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tests.map(t => {
              const isOverdue = new Date(t.eval_deadline) < new Date();
              return (
                <Card key={t.id} className={`${isOverdue ? 'border-red-500/30' : ''} hover:border-violet-500/40 transition-colors group relative`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={typeColors[t.type] || 'default'}>{t.type.replace('_', ' ')}</Badge>
                      <button 
                        onClick={(e) => { e.stopPropagation(); openEdit(t); }}
                        className="p-1 rounded-lg hover:bg-white/5 text-[#4b5563] hover:text-white transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                    {isOverdue ? <span className="text-red-400 text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> Overdue</span>
                      : <span className="text-emerald-400 text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> On track</span>}
                  </div>
                  <h3 className="text-white font-semibold mt-3">{t.title}</h3>
                  <p className="text-[#6b7280] text-xs mt-1">{t.subjects?.name} • {t.batches?.name}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1e2130]">
                    <div className="text-xs text-[#6b7280]">
                      <p>Scheduled: {t.scheduled_date}</p>
                      <p>Eval deadline: {t.eval_deadline}</p>
                    </div>
                    <Button size="sm" variant="secondary" icon={<FileText className="w-3.5 h-3.5" />} onClick={() => openMarks(t)}>
                      Marks
                    </Button>
                  </div>
                </Card>
              );
            })}
            {tests.length === 0 && (
              <div className="col-span-3 text-center py-12 text-[#4b5563]">No tests yet. Create your first test!</div>
            )}
          </div>
        )}
      </div>

      {/* Create Test Modal */}
      <Modal open={openNew} onClose={() => setOpenNew(false)} title={selectedTest ? 'Edit Test' : 'Create New Test'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label>Test Title *</label>
            <input placeholder="e.g. Chapter 3 Weekly Test" value={form.title} onChange={e => set('title', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Subject *</label>
              <select value={form.subject_id} onChange={e => set('subject_id', e.target.value)}>
                <option value="">Select subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label>Batch *</label>
              <select value={form.batch_id} onChange={e => set('batch_id', e.target.value)}>
                <option value="">Select batch</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="weekly">Weekly Test</option>
                <option value="class_test">Class Test</option>
                <option value="mock">Mock Test</option>
                <option value="assignment">Assignment</option>
              </select>
            </div>
            <div>
              <label>Max Marks</label>
              <input type="number" value={form.max_marks} onChange={e => set('max_marks', Number(e.target.value))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Scheduled Date *</label>
              <input type="date" value={form.scheduled_date} onChange={e => set('scheduled_date', e.target.value)} />
            </div>
            <div>
              <label>Eval Deadline *</label>
              <input type="date" value={form.eval_deadline} onChange={e => set('eval_deadline', e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setOpenNew(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{selectedTest ? 'Update Test' : 'Create Test'}</Button>
          </div>
        </form>
      </Modal>

      {/* Marks Entry Modal */}
      <Modal open={!!marksModal} onClose={() => setMarksModal(null)} title={`Enter Marks — ${marksModal?.title}`} size="md">
        {marksModal && (
          <div className="space-y-4">
            <p className="text-[#6b7280] text-sm">Max marks: <strong className="text-white">{marksModal.max_marks}</strong></p>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {marksData.map((m, i) => (
                <div key={m.student_id} className="flex items-center gap-3">
                  <div className="flex-1 text-[#d1d5db] text-sm">{m.name}</div>
                  <input
                    type="number" min={0} max={marksModal.max_marks}
                    placeholder="—"
                    value={m.marks}
                    onChange={e => setMarksData(d => d.map((x, j) => j === i ? { ...x, marks: e.target.value } : x))}
                    style={{ width: '80px' }}
                  />
                </div>
              ))}
              {marksData.length === 0 && <p className="text-[#4b5563] text-sm text-center py-4">No students in this batch</p>}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setMarksModal(null)}>Cancel</Button>
              <Button loading={saving} onClick={saveMarks}>Save Marks</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
