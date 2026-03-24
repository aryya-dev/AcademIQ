'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { BookMarked, CheckCircle, Clock, AlertCircle, Filter } from 'lucide-react';
import { getSyllabus } from '@/lib/queries/syllabus';
import { getTeachers } from '@/lib/queries/teachers';
import { getBatches } from '@/lib/queries/batches';
import type { SyllabusTracker, Teacher, Batch } from '@/types';

export default function SyllabusTrackerPage() {
  const [syllabus, setSyllabus] = useState<SyllabusTracker[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedTeacher, setSelectedTeacher] = useState('all');
  const [selectedBatch, setSelectedBatch] = useState('all');

  async function load() {
    setLoading(true);
    try {
      const [s, t, b] = await Promise.all([
        getSyllabus(),
        getTeachers(),
        getBatches()
      ]);
      setSyllabus(s);
      setTeachers(t);
      setBatches(b);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = syllabus.filter(item => {
    if (selectedTeacher !== 'all' && item.teacher_id !== selectedTeacher) return false;
    if (selectedBatch !== 'all' && item.batch_id !== selectedBatch) return false;
    return true;
  });

  const stats = {
    total: filtered.length,
    completed: filtered.filter(i => i.status === 'completed').length,
    inProgress: filtered.filter(i => i.status === 'in_progress').length,
    pending: filtered.filter(i => i.status === 'pending').length,
  };

  const completionPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div>
      <Header title="Syllabus Status Tracker" subtitle="Monitor course completion across all teachers and batches" />

      <div className="p-6 space-y-6">
        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-violet-600/10 to-transparent">
            <span className="text-3xl font-bold text-violet-400">{completionPct}%</span>
            <span className="text-[#6b7280] text-xs uppercase tracking-wider mt-1 font-medium">Total Completion</span>
          </Card>
          <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 border-l-4 border-l-emerald-500">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <div>
                  <div className="text-xl font-bold text-white">{stats.completed}</div>
                  <div className="text-xs text-[#6b7280]">Chapters Done</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 border-l-4 border-l-amber-500">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-500" />
                <div>
                  <div className="text-xl font-bold text-white">{stats.inProgress}</div>
                  <div className="text-xs text-[#6b7280]">In Progress</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 border-l-4 border-l-[#1e2130]">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-[#4b5563]" />
                <div>
                  <div className="text-xl font-bold text-white">{stats.pending}</div>
                  <div className="text-xs text-[#6b7280]">Pending</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center bg-[#141722] p-4 rounded-xl border border-[#1e2130]">
          <div className="flex items-center gap-2 text-[#9ca3af] text-sm mr-2">
            <Filter className="w-4 h-4" />
            <span>Filters:</span>
          </div>
          <select
            className="bg-[#0f1117] border-[#1e2130] w-auto h-9 text-xs"
            value={selectedTeacher}
            onChange={e => setSelectedTeacher(e.target.value)}
          >
            <option value="all">All Teachers</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select
            className="bg-[#0f1117] border-[#1e2130] w-auto h-9 text-xs"
            value={selectedBatch}
            onChange={e => setSelectedBatch(e.target.value)}
          >
            <option value="all">All Batches</option>
            {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-[#141722] border border-[#1e2130] rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filtered.map(item => (
              <div
                key={item.id}
                className="group flex items-center gap-4 p-4 bg-[#141722] border border-[#1e2130] rounded-xl hover:border-violet-500/30 transition-all hover:bg-[#1a1f30]"
              >
                <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${item.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                    item.status === 'in_progress' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-[#1e2130] text-[#4b5563]'
                  }`}>
                  {item.status === 'completed' ? <CheckCircle className="w-5 h-5" /> :
                    item.status === 'in_progress' ? <Clock className="w-5 h-5" /> :
                      <BookMarked className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-semibold text-sm truncate ${item.status === 'completed' ? 'text-[#6b7280] line-through' : 'text-white'}`}>
                    {item.chapter}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-[#4b5563] mt-0.5">
                    <span className="text-[#9ca3af] font-medium">{item.teacher?.name || 'Unassigned'}</span>
                    <span>•</span>
                    <span>{item.subject?.name}</span>
                    <span>•</span>
                    <span>{item.batch?.name}</span>
                  </div>
                </div>
                <Badge variant={
                  item.status === 'completed' ? 'emerald' :
                    item.status === 'in_progress' ? 'amber' : 'secondary'
                } className="text-[10px] h-6">
                  {item.status.replace('_', ' ')}
                </Badge>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[#1e2130] rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookMarked className="w-8 h-8 text-[#4b5563]" />
                </div>
                <p className="text-[#6b7280]">No chapters found matching these filters.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
