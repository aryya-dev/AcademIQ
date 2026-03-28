'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Search, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getTeachersWithDetails } from '@/lib/queries/teachers';
import { getAllTeacherFeedbacks, TeacherFeedback } from '@/lib/queries/teacher_feedback';
import type { Teacher } from '@/types';

export default function TeachersPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [feedbacks, setFeedbacks] = useState<TeacherFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [tData, fData] = await Promise.all([
          getTeachersWithDetails(),
          getAllTeacherFeedbacks()
        ]);
        setTeachers(tData);
        setFeedbacks(fData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getAvgRating = (teacherId: string) => {
    const fbs = feedbacks.filter(f => f.teacher_id === teacherId && f.rating !== null);
    if (fbs.length === 0) return null;
    const sum = fbs.reduce((acc, curr) => acc + (curr.rating || 0), 0);
    return (sum / fbs.length).toFixed(1);
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <Header 
        title="Teachers" 
        subtitle="Manage teaching staff profiles and assignments"
      />
      
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4b5563]" />
            <input 
              placeholder="Search teachers..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 h-10 w-full"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-[#141722] border border-[#1e2130] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeachers.map(teacher => {
              const avg = getAvgRating(teacher.id);
              const isExcellent = avg && parseFloat(avg) >= 8.5;
              const subjects = teacher.teacher_subjects?.map(ts => ts.subjects?.name).filter(Boolean) || [];
              const batches = teacher.teacher_batches?.map(tb => tb.batches?.name).filter(Boolean) || [];

              return (
                <Card 
                  key={teacher.id} 
                  className="hover:border-violet-500/40 transition-all cursor-pointer group flex flex-col"
                  onClick={() => router.push(`/teachers/${teacher.id}`)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-white font-semibold text-lg group-hover:text-violet-400 transition-colors">
                        {teacher.name}
                      </h3>
                      {teacher.email && (
                        <p className="text-[#9ca3af] text-sm mt-0.5">{teacher.email}</p>
                      )}
                    </div>
                    {avg ? (
                      <div className={`flex flex-col items-end`}>
                        <span className={`text-xl font-bold ${isExcellent ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {avg}
                        </span>
                        <span className="text-[10px] text-[#6b7280] uppercase tracking-wider font-semibold">
                          Avg Rating
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-[#4b5563] bg-white/5 px-2 py-1 rounded">No Ratings</span>
                    )}
                  </div>

                  <div className="space-y-4 flex-1">
                    <div>
                      <p className="text-xs text-[#6b7280] uppercase tracking-wider font-semibold mb-2">Subjects</p>
                      <div className="flex flex-wrap gap-1">
                        {subjects.length > 0 ? (
                          subjects.map(s => <Badge key={s} variant="info">{s}</Badge>)
                        ) : (
                          <span className="text-xs text-[#4b5563]">None assigned</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-[#6b7280] uppercase tracking-wider font-semibold mb-2">Batches</p>
                      <div className="flex flex-wrap gap-1">
                        {batches.length > 0 ? (
                          batches.map(b => <Badge key={b} variant="violet">{b}</Badge>)
                        ) : (
                          <span className="text-xs text-[#4b5563]">None assigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
            
            {filteredTeachers.length === 0 && (
              <div className="col-span-full text-center py-12 text-[#4b5563]">
                No teachers found. 
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
