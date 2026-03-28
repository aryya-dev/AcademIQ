'use client';
import { useEffect, useState, use } from 'react';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { 
  ArrowLeft, 
  Mail, 
  Calendar, 
  Plus, 
  Trash2, 
  Star, 
  MessageSquare,
  TrendingUp,
  Save,
  User
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { 
  getTeacherById, 
  updateTeacher, 
  assignSubjectToTeacher, 
  removeSubjectFromTeacher,
  assignBatchToTeacher,
  removeBatchFromTeacher
} from '@/lib/queries/teachers';
import { getSubjects } from '@/lib/queries/subjects';
import { getBatches } from '@/lib/queries/batches';
import { getFeedbacksForTeacher, TeacherFeedback } from '@/lib/queries/teacher_feedback';
import type { Teacher, Subject, Batch } from '@/types';

export default function TeacherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [feedbacks, setFeedbacks] = useState<TeacherFeedback[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [allBatches, setAllBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  
  // Selection state
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');

  async function loadData() {
    try {
      const [tData, fData, sData, bData] = await Promise.all([
        getTeacherById(id),
        getFeedbacksForTeacher(id),
        getSubjects(),
        getBatches()
      ]);
      setTeacher(tData);
      setFeedbacks(fData);
      setAllSubjects(sData);
      setAllBatches(bData);
      setEditName(tData.name);
      setEditEmail(tData.email || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  const handleUpdateProfile = async () => {
    try {
      const updated = await updateTeacher(id, { name: editName, email: editEmail });
      setTeacher(prev => prev ? { ...prev, name: updated.name, email: updated.email } : null);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSubject = async () => {
    if (!selectedSubject) return;
    try {
      await assignSubjectToTeacher(id, selectedSubject);
      const updated = await getTeacherById(id);
      setTeacher(updated);
      setSelectedSubject('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveSubject = async (subId: string) => {
    try {
      await removeSubjectFromTeacher(id, subId);
      const updated = await getTeacherById(id);
      setTeacher(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddBatch = async () => {
    if (!selectedBatch) return;
    try {
      await assignBatchToTeacher(id, selectedBatch);
      const updated = await getTeacherById(id);
      setTeacher(updated);
      setSelectedBatch('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveBatch = async (batchId: string) => {
    try {
      await removeBatchFromTeacher(id, batchId);
      const updated = await getTeacherById(id);
      setTeacher(updated);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-[#141722] animate-pulse rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-[#141722] animate-pulse rounded-xl" />
            <div className="h-96 bg-[#141722] animate-pulse rounded-xl" />
          </div>
          <div className="h-96 bg-[#141722] animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  if (!teacher) return <div className="p-6 text-white">Teacher not found.</div>;

  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((acc, curr) => acc + (curr.rating || 0), 0) / feedbacks.filter(f => f.rating !== null).length).toFixed(1)
    : null;
    
  const performancePct = avgRating ? (parseFloat(avgRating) * 10) : 0;
  
  const subjects = teacher.teacher_subjects?.map(ts => ts.subjects).filter(Boolean) as Subject[];
  const batches = teacher.teacher_batches?.map(tb => tb.batches).filter(Boolean) as Batch[];
  const remarks = feedbacks.map(f => f.remarks).filter(Boolean);

  return (
    <div>
      <Header 
        title={teacher.name} 
        subtitle="Staff Profile & Performance Analytics"
        backButton={true}
      />
      
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Info & Assignments */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Profile Card */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button icon={<Save className="w-4 h-4" />} onClick={handleUpdateProfile}>Save</Button>
                  </div>
                ) : (
                  <Button variant="secondary" onClick={() => setIsEditing(true)}>Edit Profile</Button>
                )}
              </div>

              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <User className="w-10 h-10 text-violet-400" />
                </div>
                {isEditing ? (
                  <div className="space-y-3 flex-1">
                    <input 
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="bg-[#1e2130] border-none text-xl font-bold p-2 w-full focus:ring-1 focus:ring-violet-500 rounded"
                    />
                    <div className="flex items-center gap-2 text-[#9ca3af]">
                      <Mail className="w-4 h-4" />
                      <input 
                        value={editEmail}
                        onChange={e => setEditEmail(e.target.value)}
                        className="bg-[#1e2130] border-none text-sm p-2 w-full focus:ring-1 focus:ring-violet-500 rounded"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-bold text-white">{teacher.name}</h2>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2 text-[#9ca3af] text-sm">
                        <Mail className="w-4 h-4" />
                        {teacher.email || 'No email provided'}
                      </div>
                      <div className="flex items-center gap-2 text-[#9ca3af] text-sm border-l border-[#1e2130] pl-4">
                        <Calendar className="w-4 h-4" />
                        Joined {new Date(teacher.created_at!).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Subjects */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[#6b7280] uppercase tracking-wider">Assigned Subjects</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {subjects.map(s => (
                      <Badge key={s.id} variant="info" className="pr-1.5 py-1.5 pl-3 gap-2">
                        {s.name}
                        <button 
                          onClick={() => handleRemoveSubject(s.id)}
                          className="hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <select 
                      value={selectedSubject}
                      onChange={e => setSelectedSubject(e.target.value)}
                      className="bg-[#141722] border border-[#1e2130] rounded-lg px-3 py-1.5 text-xs text-[#d1d5db] focus:ring-1 focus:ring-violet-500 outline-none flex-1"
                    >
                      <option value="">Add Subject...</option>
                      {allSubjects.filter(s => !subjects.find(as => as.id === s.id)).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={handleAddSubject}>{null}</Button>
                  </div>
                </div>

                {/* Batches */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[#6b7280] uppercase tracking-wider">Assigned Batches</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {batches.map(b => (
                      <Badge key={b.id} variant="violet" className="pr-1.5 py-1.5 pl-3 gap-2">
                        {b.name}
                        <button 
                          onClick={() => handleRemoveBatch(b.id)}
                          className="hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <select 
                      value={selectedBatch}
                      onChange={e => setSelectedBatch(e.target.value)}
                      className="bg-[#141722] border border-[#1e2130] rounded-lg px-3 py-1.5 text-xs text-[#d1d5db] focus:ring-1 focus:ring-violet-500 outline-none flex-1"
                    >
                      <option value="">Add Batch...</option>
                      {allBatches.filter(b => !batches.find(ab => ab.id === b.id)).map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                    <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={handleAddBatch}>{null}</Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Performance Bar Card */}
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Performance Metrics</h3>
                  <p className="text-[#6b7280] text-xs">Based on current student feedback data</p>
                </div>
              </div>

              <div className="space-y-8 py-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-sm text-[#9ca3af]">Overall Feedback Score</span>
                    <span className="text-2xl font-bold text-white">{avgRating || 'N/A'}<span className="text-sm text-[#4b5563] ml-1">/ 10</span></span>
                  </div>
                  <div className="h-4 bg-[#141722] rounded-full overflow-hidden border border-[#1e2130]">
                    <div 
                      className={`h-full transition-all duration-1000 ease-out rounded-full bg-gradient-to-r ${
                        performancePct >= 80 ? 'from-emerald-600 to-emerald-400' : 
                        performancePct >= 60 ? 'from-amber-600 to-amber-400' : 
                        'from-rose-600 to-rose-400'
                      }`}
                      style={{ width: `${performancePct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-[#4b5563] font-medium uppercase tracking-tighter">
                    <span>Needs Improvement</span>
                    <span>Satisfactory</span>
                    <span>Excellent</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#141722] p-4 rounded-xl border border-[#1e2130]">
                    <p className="text-[#6b7280] text-[10px] uppercase font-bold tracking-wider mb-1">Total Responses</p>
                    <p className="text-xl font-bold text-white">{feedbacks.length}</p>
                  </div>
                  <div className="bg-[#141722] p-4 rounded-xl border border-[#1e2130]">
                    <p className="text-[#6b7280] text-[10px] uppercase font-bold tracking-wider mb-1">Positive Remarks</p>
                    <p className="text-xl font-bold text-white">{remarks.length}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar: Remarks */}
          <div className="space-y-6">
            <Card className="flex flex-col h-full max-h-[600px]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-pink-400" />
                </div>
                <h3 className="text-white font-semibold">Student Remarks</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {remarks.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 rounded-full border border-[#1e2130] flex items-center justify-center mx-auto mb-3">
                      <MessageSquare className="w-6 h-6 text-[#1e2130]" />
                    </div>
                    <p className="text-[#4b5563] text-sm italic">No remarks provided yet.</p>
                  </div>
                ) : (
                  remarks.map((remark, i) => (
                    <div key={i} className="bg-[#141722] p-4 rounded-lg border border-[#1e2130] relative group">
                      <div className="absolute top-0 right-0 p-2 opacity-10">
                        <MessageSquare className="w-8 h-8 rotate-12" />
                      </div>
                      <p className="text-sm text-[#d1d5db] leading-relaxed relative z-10 italic">"{remark}"</p>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-violet-600/10 to-indigo-600/10 border-violet-500/20">
              <div className="flex items-center gap-3 mb-4">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <h4 className="text-white font-medium text-sm">Actionable Insight</h4>
              </div>
              <p className="text-xs text-[#9ca3af] leading-relaxed">
                {avgRating && parseFloat(avgRating) >= 8.5 
                  ? "This teacher is highly rated by students. Consider them for mentorship roles or leading advanced batches." 
                  : avgRating && parseFloat(avgRating) < 6 
                  ? "Student ratings are below average. We recommend reviewing behavioral remarks and discussing session improvements." 
                  : "Performance is steady. Encourage students to leave more specific remarks for more detailed insights."}
              </p>
            </Card>
          </div>

        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e2130;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #2a2f45;
        }
      `}</style>
    </div>
  );
}
