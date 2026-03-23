'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Table from '@/components/ui/Table';
import { Plus, TrendingUp, TrendingDown, Award } from 'lucide-react';
import { getMeritLogs, logMerit, getTotalScore, MERIT_RULES, DEMERIT_RULES } from '@/lib/queries/merit';
import { getTeachers } from '@/lib/queries/teachers';
import type { ActorType } from '@/types';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/lib/supabase';

export default function MeritPage() {
  const router = useRouter();
  const { profile, isKingOrKnight } = useRole();
  const [logs, setLogs] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ actor_type: 'mentor' as ActorType, actor_id: '', reason: '', points: 0 });

  async function load() {
    try {
      const { data: mentorsData } = await supabase.from('profiles').select('id, full_name').eq('role', 'mentor');
      const [l, t] = await Promise.all([getMeritLogs(), getTeachers()]);
      setLogs(l); setTeachers(t); setMentors(mentorsData || []);
    } catch {} finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (profile?.id && form.actor_id === '') {
      setForm(f => ({ ...f, actor_id: (!isKingOrKnight && profile.role === 'mentor') ? profile.id : '' }));
    }
  }, [profile, isKingOrKnight, form.actor_id]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.reason || form.points === 0 || !form.actor_id) return;
    setSaving(true);
    try {
      await logMerit(form);
      setOpen(false); 
      setForm({ actor_type: 'mentor', actor_id: (!isKingOrKnight && profile?.role === 'mentor') ? profile.id : '', reason: '', points: 0 });
      await load();
    } catch {} finally { setSaving(false); }
  }

  const allRules = [
    ...Object.entries(MERIT_RULES).map(([k, v]) => ({ label: k.replace(/_/g, ' '), points: v })),
    ...Object.entries(DEMERIT_RULES).map(([k, v]) => ({ label: k.replace(/_/g, ' '), points: v })),
  ];

  const columns = [
    { key: 'actor_type', header: 'Type', render: (r: any) => <Badge variant={r.actor_type === 'mentor' ? 'purple' : 'info'}>{r.actor_type}</Badge> },
    { key: 'reason', header: 'Reason', render: (r: any) => <span className="capitalize text-[#d1d5db]">{r.reason.replace(/_/g, ' ')}</span> },
    { key: 'points', header: 'Points', render: (r: any) => (
      <span className={`font-bold ${r.points > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {r.points > 0 ? '+' : ''}{r.points}
      </span>
    )},
    { key: 'created_at', header: 'Date', render: (r: any) => (
      <span className="text-[#6b7280] text-xs">{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</span>
    )},
  ];

  const meritTotal = logs.filter(l => l.points > 0).reduce((s: number, l: any) => s + l.points, 0);
  const demeritTotal = logs.filter(l => l.points < 0).reduce((s: number, l: any) => s + l.points, 0);
  const net = meritTotal + demeritTotal;

  return (
    <div>
      <Header title="Merit & Demerit" subtitle="Track performance points for mentors and faculty" />
      <div className="p-6 space-y-5">
        {/* Score Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="text-center">
            <TrendingUp className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-[#9ca3af] text-xs uppercase tracking-wider">Total Merits Granted</p>
            <p className="text-3xl font-bold text-emerald-400 mt-1">+{loading ? '—' : meritTotal}</p>
          </Card>
          <Card className="text-center">
            <TrendingDown className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-[#9ca3af] text-xs uppercase tracking-wider">Total Demerits Logged</p>
            <p className="text-3xl font-bold text-red-400 mt-1">{loading ? '—' : demeritTotal}</p>
          </Card>
          <Card className={`text-center border-2 ${net >= 0 ? 'border-emerald-500/40' : 'border-red-500/40'}`}>
            <Award className={`w-8 h-8 mx-auto mb-2 ${net >= 0 ? 'text-violet-400' : 'text-red-400'}`} />
            <p className="text-[#9ca3af] text-xs uppercase tracking-wider">System Net Focus</p>
            <p className={`text-3xl font-bold mt-1 ${net >= 0 ? 'text-violet-400' : 'text-red-400'}`}>{loading ? '—' : net}</p>
          </Card>
        </div>

        {/* Merit Rules Reference */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Merit Rules
            </h3>
            <div className="space-y-1.5">
              {Object.entries(MERIT_RULES).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af] capitalize">{k.replace(/_/g, ' ')}</span>
                  <span className="text-emerald-400 font-bold">+{v}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-400" /> Demerit Rules
            </h3>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {Object.entries(DEMERIT_RULES).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af] capitalize">{k.replace(/_/g, ' ')}</span>
                  <span className="text-red-400 font-bold">{v}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Log Table */}
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold">Points Log</h2>
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setOpen(true)}>Add Entry</Button>
        </div>
        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-[#141722] border border-[#1e2130] rounded-xl animate-pulse" />)}</div>
        ) : (
          <Table columns={columns} data={logs} emptyMessage="No merit/demerit entries yet." getKey={(r: any) => r.id} />
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Merit/Demerit Entry" size="sm">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Actor Type</label>
              <select value={form.actor_type} onChange={e => setForm(f => ({ ...f, actor_type: e.target.value as ActorType }))}>
                <option value="mentor">Mentor</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>
            {form.actor_type === 'teacher' && (
              <div>
                <label>Teacher</label>
                <select value={form.actor_id} onChange={e => setForm(f => ({ ...f, actor_id: e.target.value }))}>
                  <option value="">Select teacher</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            )}
            {form.actor_type === 'mentor' && (
              <div>
                <label>Mentor</label>
                <select 
                  value={form.actor_id} 
                  onChange={e => setForm(f => ({ ...f, actor_id: e.target.value }))}
                  disabled={!isKingOrKnight && profile?.role === 'mentor'}
                >
                  <option value="">Select mentor</option>
                  {mentors.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
              </div>
            )}
          </div>
          <div>
            <label>Reason (Rule)</label>
            <select value={form.reason} onChange={e => {
              const rule = allRules.find(r => r.label === e.target.value);
              setForm(f => ({ ...f, reason: e.target.value, points: rule?.points || 0 }));
            }}>
              <option value="">Select a rule</option>
              <optgroup label="Merit">
                {Object.entries(MERIT_RULES).map(([k, v]) => (
                  <option key={k} value={k.replace(/_/g, ' ')}>{k.replace(/_/g, ' ')} (+{v})</option>
                ))}
              </optgroup>
              <optgroup label="Demerit">
                {Object.entries(DEMERIT_RULES).map(([k, v]) => (
                  <option key={k} value={k.replace(/_/g, ' ')}>{k.replace(/_/g, ' ')} ({v})</option>
                ))}
              </optgroup>
            </select>
          </div>
          <div>
            <label>Points (auto-filled from rule)</label>
            <input type="number" value={form.points} onChange={e => setForm(f => ({ ...f, points: Number(e.target.value) }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Add Entry</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
