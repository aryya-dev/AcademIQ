'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import { StatCard } from '@/components/ui/Card';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge, { statusBadge } from '@/components/ui/Badge';
import {
  Users, Layers, AlertTriangle, MessageCircle, Bell, CheckCircle, Clock, TrendingDown, Calendar, AlertCircle, CalendarRange
} from 'lucide-react';
import { getStudents, getWeakStudents } from '@/lib/queries/students';
import { getBatches } from '@/lib/queries/batches';
import { getOverdueEvaluations } from '@/lib/queries/tests';
import { getMentorDashboardData, type MentorDashboardData } from '@/lib/queries/mentor_dashboard';
import type { Student } from '@/types';
import { useRole } from '@/hooks/useRole';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const { profile, loading: roleLoading } = useRole();
  const [students, setStudents] = useState<Student[]>([]);
  const [batchCount, setBatchCount] = useState(0);
  const [overdueTests, setOverdueTests] = useState<any[]>([]);
  const [mentorData, setMentorData] = useState<MentorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (roleLoading) return;
    if (!profile) {
      router.push('/login');
      return;
    }

    async function load() {
      try {
        const [s, b, o] = await Promise.all([
          getStudents().catch(() => []),
          getBatches().catch(() => []),
          getOverdueEvaluations().catch(() => []),
        ]);
        setStudents(s);
        setBatchCount(b.length);
        setOverdueTests(o);

        if (profile?.role === 'mentor' || profile?.role === 'knight') {
          const mData = await getMentorDashboardData(profile.id).catch(() => null);
          setMentorData(mData);
        }
      } catch {
        // Handle errors
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [profile, roleLoading, router]);

  const activeCount = students.filter(s => s.status === 'active').length;
  const inactiveCount = students.filter(s => s.status === 'inactive').length;

  return (
    <div>
      <Header title="Dashboard" subtitle="Mentor overview — today's snapshot" />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Students"
            value={loading ? '—' : students.length}
            icon={<Users className="w-8 h-8" />}
            color="violet"
            trend={`${activeCount} active`}
          />
          <StatCard
            label="Active Batches"
            value={loading ? '—' : batchCount}
            icon={<Layers className="w-8 h-8" />}
            color="blue"
          />
          <StatCard
            label="Overdue Evals"
            value={loading ? '—' : overdueTests.length}
            icon={<AlertTriangle className="w-8 h-8" />}
            color={overdueTests.length > 0 ? 'red' : 'emerald'}
            trend="Tests past deadline"
          />
          <StatCard
            label="Inactive Students"
            value={loading ? '—' : inactiveCount}
            icon={<Bell className="w-8 h-8" />}
            color="amber"
            trend="Need attention"
          />
                {/* Recent Students */}
          <Card h-full>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Recent Students</h2>
              <a href="/students" className="text-violet-400 text-xs hover:underline">View all →</a>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-10 bg-[#1e2130] rounded-lg animate-pulse" />
                ))}
              </div>
            ) : students.length === 0 ? (
              <p className="text-[#4b5563] text-sm py-8 text-center">No students yet. <a href="/students/new" className="text-violet-400">Add one →</a></p>
            ) : (
              <div className="space-y-2">
                {students.slice(0, 5).map(s => (
                  <a key={s.id} href={`/students/${s.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-[#1e2130] transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[#d1d5db] text-sm font-medium group-hover:text-white transition-colors">{s.name}</p>
                        <p className="text-[#6b7280] text-xs">Class {s.class} • {s.school_name}</p>
                      </div>
                    </div>
                    <Badge variant={statusBadge(s.status)}>{s.status}</Badge>
                  </a>
                ))}
              </div>
            )}
          </Card>

          {/* Missing Info Alerts [NEW] */}
          <Card className="border-red-500/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" /> Data Completion Alerts
              </h2>
              <a href="/trackers/information" className="text-violet-400 text-xs hover:underline">Full Tracker →</a>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-10 bg-[#1e2130] rounded-lg animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                {students.filter(s => {
                  const hasEnrollments = (s as any).enrollment_count > 0;
                  return !s.parent_phone || !s.school_name || !s.class || !hasEnrollments;
                }).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-emerald-500/50 bg-emerald-500/5 rounded-xl border border-dashed border-emerald-500/20">
                    <CheckCircle className="w-8 h-8 mb-2" />
                    <p className="text-xs">All profiles are fully updated!</p>
                  </div>
                ) : (
                  students.filter(s => {
                    const hasEnrollments = s.enrollments && s.enrollments.length > 0;
                    return !s.parent_phone || !s.school_name || !s.class || !hasEnrollments;
                  }).slice(0, 8).map(s => (
                    <a key={s.id} href={`/students/${s.id}`} className="flex items-center justify-between p-3 rounded-lg bg-[#0f1117] border border-[#1e2130] hover:border-red-500/30 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                        <div>
                          <p className="text-[#d1d5db] text-sm font-medium group-hover:text-white">{s.name}</p>
                          <p className="text-[#6b7280] text-[10px]">
                            Missing: {[
                              !s.parent_phone && 'Phone',
                              !s.school_name && 'School',
                              !s.class && 'Class',
                              !(s.enrollments && s.enrollments.length > 0) && 'Batch'
                            ].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 text-[10px] font-bold">
                        !
                      </div>
                    </a>
                  ))
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Overdue Evaluations */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" /> Overdue Evaluations
              </h2>
              <a href="/tests" className="text-violet-400 text-xs hover:underline">Manage tests →</a>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1,2].map(i => <div key={i} className="h-10 bg-[#1e2130] rounded-lg animate-pulse" />)}
              </div>
            ) : overdueTests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 rounded-xl">
                <CheckCircle className="w-8 h-8" />
                <p className="text-sm font-medium">All evaluations on track!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {overdueTests.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                    <div>
                      <p className="text-[#d1d5db] text-sm font-medium">{t.title}</p>
                      <p className="text-[#6b7280] text-xs capitalize">{t.subjects?.name || 'Subject'} • Deadline: {t.eval_deadline}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-red-400 text-xs font-semibold px-2 py-1 bg-red-500/10 rounded-md">
                      Overdue
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

        {/* Quick Actions */}
        <Card>
          <h2 className="text-white font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Add Student', href: '/students/new', icon: '👤', color: 'from-violet-500/20 to-violet-600/10 border-violet-500/30' },
              { label: 'New Test', href: '/tests/new', icon: '📝', color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30' },
              { label: 'Log Parent Contact', href: '/communications', icon: '📞', color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30' },
              { label: 'Update Syllabus', href: '/syllabus', icon: '📚', color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30' },
            ].map(action => (
              <a key={action.href} href={action.href}
                className={`bg-gradient-to-br ${action.color} border rounded-xl p-4 flex flex-col gap-2 hover:scale-[1.02] transition-transform cursor-pointer`}>
                <span className="text-2xl">{action.icon}</span>
                <span className="text-[#d1d5db] text-sm font-medium">{action.label}</span>
              </a>
            ))}
          </div>
        </Card>

        {/* MASSIVE MENTOR TRACKER */}
        {mentorData && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-[#1e2130] pb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">My Mentorship Watchlist</h2>
                <p className="text-[#9ca3af] text-sm">Actionable tracking and warnings for your assigned students</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Weak Students */}
              <Card className="border-red-500/20 flex flex-col h-[350px]">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1e2130]">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-400" /> Weak Academic Performance
                  </h3>
                  <Badge variant="danger">{mentorData.weakStudents.length}</Badge>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                  {mentorData.weakStudents.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-emerald-400">
                      <CheckCircle className="w-8 h-8 mb-2" />
                      <p className="text-sm text-center">No students performing<br/>below 40% threshold.</p>
                    </div>
                  ) : mentorData.weakStudents.map(s => (
                    <a key={s.id} href={`/students/${s.id}`} className="flex items-center justify-between p-3 rounded-lg bg-[#141722] border border-[#1e2130] hover:border-red-500/50 transition-colors">
                      <span className="text-[#d1d5db] text-sm">{s.name}</span>
                      <span className="text-red-400 font-bold text-sm bg-red-500/10 px-2 py-1 rounded-md">{s.avg_score}% Avg</span>
                    </a>
                  ))}
                </div>
              </Card>

              {/* Low Attendance */}
              <Card className="border-amber-500/20 flex flex-col h-[350px]">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1e2130]">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" /> Low Attendance List
                  </h3>
                  <Badge variant="warning">{mentorData.lowAttendance.length}</Badge>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                  {mentorData.lowAttendance.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-emerald-400">
                      <CheckCircle className="w-8 h-8 mb-2" />
                      <p className="text-sm text-center">All your students<br/>have &gt;75% attendance!</p>
                    </div>
                  ) : mentorData.lowAttendance.map(s => (
                    <a key={s.id} href={`/students/${s.id}`} className="flex items-center justify-between p-3 rounded-lg bg-[#141722] border border-[#1e2130] hover:border-amber-500/50 transition-colors">
                      <span className="text-[#d1d5db] text-sm">{s.name}</span>
                      <span className="text-amber-400 font-bold text-sm bg-amber-500/10 px-2 py-1 rounded-md">{s.attendance_pct}% Att.</span>
                    </a>
                  ))}
                </div>
              </Card>

              {/* Upcoming Exams & Communications */}
              <Card className="border-blue-500/20 flex flex-col h-[350px]">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1e2130]">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <CalendarRange className="w-4 h-4 text-blue-400" /> Upcoming School Exams
                  </h3>
                  <Badge variant="info">{mentorData.upcomingExams.length}</Badge>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                  {mentorData.upcomingExams.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-[#6b7280]">
                      <Calendar className="w-8 h-8 mb-2 opacity-20" />
                      <p className="text-sm text-center">No upcoming school<br/>exams scheduled.</p>
                      <Button variant="ghost" size="sm" className="mt-4" onClick={() => router.push('/students')}>+ Add Exam Schedule</Button>
                    </div>
                  ) : mentorData.upcomingExams.map(e => (
                    <div key={e.id} className="p-3 rounded-lg bg-[#141722] border border-[#1e2130]">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-white text-sm font-medium">{e.student_name}</span>
                        <span className="text-blue-400 text-xs font-bold">{new Date(e.exam_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <p className="text-[#9ca3af] text-xs capitalize">Exam: {e.subject}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Warnings Row: Mentoring & Parents */}
              <Card className="md:col-span-2 lg:col-span-3 border-[#1e2130] bg-[#141722]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-[#1e2130]">
                  <div className="pr-4">
                     <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                      <AlertCircle className="w-4 h-4 text-orange-400" /> Pending Mentoring (1st/15th)
                    </h3>
                    <div className="space-y-2">
                      {mentorData.missingMessages.length === 0 ? (
                        <p className="text-sm text-emerald-400 flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Messages up to date!</p>
                      ) : mentorData.missingMessages.map(s => (
                        <div key={'msg'+s.student_id} className="text-sm flex justify-between justify-items-center">
                          <span className="text-[#d1d5db]">{s.name}</span>
                          <span className="text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded text-xs">{s.missing.join(', ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4 md:pt-0 md:pl-6">
                    <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                      <Bell className="w-4 h-4 text-violet-400" /> Uncontacted Parents (Month)
                    </h3>
                    <div className="space-y-2">
                       {mentorData.uncontactedParents.length === 0 ? (
                        <p className="text-sm text-emerald-400 flex items-center gap-2"><CheckCircle className="w-4 h-4"/> All parents contacted!</p>
                      ) : mentorData.uncontactedParents.map(s => (
                        <div key={'par'+s.id} className="text-sm flex justify-between justify-items-center">
                          <span className="text-[#d1d5db]">{s.name}</span>
                          <a href="/communications" className="text-violet-400 hover:text-violet-300 ml-2">Log call</a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
