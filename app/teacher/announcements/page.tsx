'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useRole } from '@/hooks/useRole';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Send } from 'lucide-react';

function AnnouncementsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialType = searchParams.get('type') || 'announcement';
  const { profile, loading: roleLoading, isTeacher } = useRole();
  const [batches, setBatches] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [type, setType] = useState(initialType);
  const [batchId, setBatchId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (roleLoading) return;
    if (!profile || !isTeacher) {
      router.push('/login');
      return;
    }

    async function loadData() {
      try {
        const [batchRes, subjectRes] = await Promise.all([
          supabase.from('teacher_batches').select('*, batches(*)').eq('teacher_id', profile?.teacher_id),
          supabase.from('teacher_subjects').select('*, subjects(*)').eq('teacher_id', profile?.teacher_id)
        ]);

        setBatches(batchRes.data || []);
        setSubjects(subjectRes.data || []);
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    }

    if (profile.teacher_id) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [profile, roleLoading, isTeacher, router, supabase]);

  async function handlePost() {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('teacher_announcements').insert({
        teacher_id: profile?.teacher_id,
        batch_id: batchId || null,
        subject_id: subjectId || null,
        type: type,
        content: content.trim(),
      });

      if (error) throw error;
      alert('Announcement posted successfully!');
      router.push('/teacher');
    } catch (err: any) {
      alert(err.message || 'Failed to post');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card className="p-8">
        <div className="space-y-6">
          {/* Type Selector */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['announcement', 'cw', 'hw', 'exam'].map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`py-3 rounded-xl border font-bold text-sm transition-all ${
                  type === t
                    ? 'bg-violet-600/20 border-violet-500 text-violet-400'
                    : 'bg-[#141722] border-[#1e2130] text-[#4b5563] hover:border-[#2a2f45]'
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#4b5563] uppercase tracking-wider">Select Batch (Optional)</label>
              <select 
                className="w-full bg-[#0a0c14] border-[#1e2130] rounded-xl text-white py-2.5 px-4"
                value={batchId}
                onChange={e => setBatchId(e.target.value)}
              >
                <option value="">All Batches</option>
                {batches.map(b => (
                  <option key={b.batch_id} value={b.batch_id}>{b.batches?.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#4b5563] uppercase tracking-wider">Select Subject (Optional)</label>
              <select 
                className="w-full bg-[#0a0c14] border-[#1e2130] rounded-xl text-white py-2.5 px-4"
                value={subjectId}
                onChange={e => setSubjectId(e.target.value)}
              >
                <option value="">All Subjects</option>
                {subjects.map(s => (
                  <option key={s.subject_id} value={s.subject_id}>{s.subjects?.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[#4b5563] uppercase tracking-wider">Content</label>
            <textarea
              className="w-full bg-[#0a0c14] border-[#1e2130] rounded-2xl text-white p-6 min-h-[200px] focus:border-violet-500/50 transition-all outline-none text-lg leading-relaxed placeholder-[#4b5563]"
              placeholder={
                type === 'cw' ? "What was covered in class today?" :
                type === 'hw' ? "Enter the homework details and deadline..." :
                type === 'exam' ? "Enter exam title, date, and syllabus..." :
                "General announcement..."
              }
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button
              className="px-10 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl font-bold shadow-lg shadow-violet-900/20 flex items-center gap-2 group"
              loading={saving}
              onClick={handlePost}
              disabled={!content.trim()}
            >
              Post {type.charAt(0).toUpperCase() + type.slice(1)}
              <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function AnnouncementsPage() {
  return (
    <div className="min-h-screen bg-[#0b0d14]">
      <Header title="Create Update" subtitle="Post classwork, homework, or alerts for your batches" />
      <Suspense fallback={<div className="p-6 text-[#6b7280]">Loading...</div>}>
        <AnnouncementsContent />
      </Suspense>
    </div>
  );
}
