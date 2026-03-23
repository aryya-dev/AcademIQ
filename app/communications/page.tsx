'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Table from '@/components/ui/Table';
import { Plus, Phone, MessageCircle, AlertCircle, MessageSquareQuote } from 'lucide-react';
import { getParentLogs, logParentContact, getPendingMentoringMessages, logMentoringMessage } from '@/lib/queries/communications';
import { getStudentFeedback, logStudentFeedback, type StudentFeedback } from '@/lib/queries/feedback';
import { getStudents } from '@/lib/queries/students';
import { useRole } from '@/hooks/useRole';

export default function CommunicationsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [pendingMessages, setPendingMessages] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<StudentFeedback[]>([]);
  const [openParent, setOpenParent] = useState(false);
  const [openMessage, setOpenMessage] = useState(false);
  const [openFeedback, setOpenFeedback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parentForm, setParentForm] = useState({ student_id: '', notes: '' });
  const [msgForm, setMsgForm] = useState({ student_id: '', type: 'first', content: '' });
  const [feedbackForm, setFeedbackForm] = useState({ student_id: '', feedback_text: '', rating: 5 });
  const { profile, isKingOrKnight, loading: roleLoading } = useRole();

  async function load() {
    if (!profile) return;
    try {
      const [l, s, p, f] = await Promise.all([
        getParentLogs(isKingOrKnight ? undefined : profile.id),
        getStudents(),
        getPendingMentoringMessages(profile.id).catch(() => []),
        getStudentFeedback(isKingOrKnight ? undefined : profile.id).catch(() => []),
      ]);
      setLogs(l); setStudents(s); setPendingMessages(p); setFeedbacks(f);
    } catch {} finally { setLoading(false); }
  }
  useEffect(() => {
    if (!roleLoading && profile) {
      load();
    }
  }, [roleLoading, profile, isKingOrKnight]);

  async function handleParentLog(e: React.FormEvent) {
    e.preventDefault();
    if (!parentForm.student_id || !profile) return;
    setSaving(true);
    try {
      await logParentContact({ ...parentForm, mentor_id: profile.id, contacted_at: new Date().toISOString() });
      router.refresh();
      setOpenParent(false); setParentForm({ student_id: '', notes: '' });
      await load();
    } catch {} finally { setSaving(false); }
  }

  async function handleMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!msgForm.student_id || !profile) return;
    setSaving(true);
    try {
      await logMentoringMessage({
        ...msgForm,
        mentor_id: profile.id,
        message_date: new Date().toISOString().split('T')[0],
        type: msgForm.type as 'first' | 'mid',
      });
      router.refresh();
      setOpenMessage(false); setMsgForm({ student_id: '', type: 'first', content: '' });
      await load();
    } catch {} finally { setSaving(false); }
  }

  async function handleFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!feedbackForm.student_id || !profile) return;
    setSaving(true);
    try {
      await logStudentFeedback({ ...feedbackForm, mentor_id: profile.id });
      setOpenFeedback(false); setFeedbackForm({ student_id: '', feedback_text: '', rating: 5 });
      await load();
    } catch {} finally { setSaving(false); }
  }

  const logColumns = [
    { key: 'student', header: 'Student', render: (r: any) => <span className="font-medium text-white">{r.students?.name}</span> },
    { key: 'contacted_at', header: 'Contacted At', render: (r: any) => (
      <span className="text-[#9ca3af] text-xs">{r.contacted_at ? new Date(r.contacted_at).toLocaleString() : '—'}</span>
    )},
    { key: 'notes', header: 'Notes', render: (r: any) => <span className="text-[#6b7280] text-xs">{r.notes || '—'}</span> },
  ];

  const feedbackColumns = [
    { key: 'student', header: 'Student', render: (r: any) => <span className="font-medium text-white">{r.students?.name}</span> },
    { key: 'rating', header: 'Rating (1-5)', render: (r: any) => (
      <span className={`font-bold ${r.rating >= 4 ? 'text-emerald-400' : r.rating <= 2 ? 'text-red-400' : 'text-amber-400'}`}>{r.rating}/5</span>
    )},
    { key: 'feedback_text', header: 'Feedback', render: (r: any) => <span className="text-[#9ca3af] text-xs italic">"{r.feedback_text}"</span> },
    { key: 'created_at', header: 'Date', render: (r: any) => <span className="text-[#6b7280] text-xs">{new Date(r.created_at).toLocaleDateString()}</span> },
  ];

  return (
    <div>
      <Header title="Communications" subtitle="Parent contacts & mentoring messages" />
      <div className="p-6 space-y-6">
        {/* Pending Mentoring Messages Alert */}
        {pendingMessages.length > 0 && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-amber-300 font-medium text-sm">Pending Mentoring Messages ({pendingMessages.length} students)</p>
                <div className="mt-2 space-y-1">
                  {pendingMessages.slice(0, 5).map(p => (
                    <p key={p.student_id} className="text-[#9ca3af] text-xs">
                      <strong className="text-[#d1d5db]">{p.name}</strong> — missing: {p.missing.join(', ')}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button icon={<Phone className="w-4 h-4" />} onClick={() => setOpenParent(true)}>Log Parent Contact</Button>
          <Button variant="secondary" icon={<MessageCircle className="w-4 h-4" />} onClick={() => setOpenMessage(true)}>Log Mentoring Message</Button>
          <Button variant="ghost" className="bg-[#1e2130]" icon={<MessageSquareQuote className="w-4 h-4" />} onClick={() => setOpenFeedback(true)}>Log Student Feedback</Button>
        </div>

        {/* Parent Communication Logs */}
        <div>
          <h2 className="text-white font-semibold mb-3">Parent Communication Logs</h2>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-[#141722] border border-[#1e2130] rounded-xl animate-pulse" />)}</div>
          ) : (
            <Table columns={logColumns} data={logs} emptyMessage="No parent contacts logged yet." getKey={(r: any) => r.id} />
          )}
        </div>

        {/* Student Class Feedback */}
        <div>
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <MessageSquareQuote className="w-4 h-4 text-emerald-400" /> Student Class Feedback
          </h2>
          {loading ? (
            <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-12 bg-[#141722] border border-[#1e2130] rounded-xl animate-pulse" />)}</div>
          ) : (
            <Table columns={feedbackColumns} data={feedbacks} emptyMessage="No student feedback logged yet." getKey={(r: any) => r.id} />
          )}
        </div>
      </div>

      {/* Parent Log Modal */}
      <Modal open={openParent} onClose={() => setOpenParent(false)} title="Log Parent Contact" size="sm">
        <form onSubmit={handleParentLog} className="space-y-4">
          <div>
            <label>Student *</label>
            <select value={parentForm.student_id} onChange={e => setParentForm(f => ({ ...f, student_id: e.target.value }))}>
              <option value="">Select student</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} — {s.parent_phone || 'No phone'}</option>)}
            </select>
          </div>
          <div>
            <label>Notes</label>
            <textarea placeholder="What was discussed..." value={parentForm.notes} onChange={e => setParentForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setOpenParent(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Log Contact</Button>
          </div>
        </form>
      </Modal>

      {/* Mentoring Message Modal */}
      <Modal open={openMessage} onClose={() => setOpenMessage(false)} title="Log Mentoring Message" size="sm">
        <form onSubmit={handleMessage} className="space-y-4">
          <div>
            <label>Student *</label>
            <select value={msgForm.student_id} onChange={e => setMsgForm(f => ({ ...f, student_id: e.target.value }))}>
              <option value="">Select student</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label>Message Type</label>
            <select value={msgForm.type} onChange={e => setMsgForm(f => ({ ...f, type: e.target.value }))}>
              <option value="first">1st of Month</option>
              <option value="mid">15th of Month</option>
            </select>
          </div>
          <div>
            <label>Content</label>
            <textarea placeholder="Message content..." value={msgForm.content} onChange={e => setMsgForm(f => ({ ...f, content: e.target.value }))} rows={3} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setOpenMessage(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Log Message</Button>
          </div>
        </form>
      </Modal>

      {/* Student Feedback Modal */}
      <Modal open={openFeedback} onClose={() => setOpenFeedback(false)} title="Log Student Feedback" size="sm">
        <form onSubmit={handleFeedback} className="space-y-4">
          <div>
            <label>Student *</label>
            <select required value={feedbackForm.student_id} onChange={e => setFeedbackForm(f => ({ ...f, student_id: e.target.value }))}>
              <option value="">Select student</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label>Happiness Rating (1-5)</label>
            <input 
              type="number" 
              min="1" max="5" 
              required
              value={feedbackForm.rating} 
              onChange={e => setFeedbackForm(f => ({ ...f, rating: parseInt(e.target.value) || 5 }))}
              className="w-full bg-[#141722] border border-[#2a2f45] rounded-xl px-4 py-2.5 text-white"
            />
          </div>
          <div>
            <label>Feedback Details</label>
            <textarea required placeholder="Any issues with classes or progress?" value={feedbackForm.feedback_text} onChange={e => setFeedbackForm(f => ({ ...f, feedback_text: e.target.value }))} rows={3} className="w-full bg-[#141722] border border-[#2a2f45] rounded-xl px-4 py-2.5 text-white" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setOpenFeedback(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save Feedback</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
