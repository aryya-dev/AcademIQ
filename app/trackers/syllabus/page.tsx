'use client';
import { useEffect, useState, useMemo, Fragment } from 'react';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Printer, Download, Save, Loader2, Filter } from 'lucide-react';
import { getSubjects } from '@/lib/queries/subjects';
import { getBatches } from '@/lib/queries/batches';
import { getEnrollments } from '@/lib/queries/enrollments';
import { getSchoolTermSyllabus, upsertSchoolTermSyllabus } from '@/lib/queries/school_syllabus';
import type { Subject, Batch, SchoolTermSyllabus } from '@/types';

const TERMS = ['UT-1', 'Half Yearly', 'UT-2', 'Annual Term'];

export default function SyllabusTrackerPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [classFilter, setClassFilter] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [syllabusData, setSyllabusData] = useState<SchoolTermSyllabus[]>([]);
  const [localEdits, setLocalEdits] = useState<Record<string, any>>({});

  async function loadInitial() {
    try {
      const [s, b] = await Promise.all([getSubjects(), getBatches()]);
      setSubjects(s);
      setBatches(b);
      if (s.length > 0) setSelectedSubject(s[0].id);
      if (b.length > 0) setSelectedBatch(b[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadInitial(); }, []);

  const selectedBatchObj = useMemo(() => batches.find(b => b.id === selectedBatch), [batches, selectedBatch]);
  const selectedSubjectObj = useMemo(() => subjects.find(s => s.id === selectedSubject), [subjects, selectedSubject]);

  async function loadData() {
    if (!selectedBatch || !selectedSubject) return;
    setLoading(true);
    try {
      // Get all enrollments for this batch and subject
      const allEnrollments = await getEnrollments();
      const filtered = allEnrollments.filter((e: any) => 
        e.batch_id === selectedBatch && 
        e.subject_id === selectedSubject &&
        e.students?.status !== 'Discontinue/permanent Inactive'
      );
      setEnrollments(filtered);

      // Get existing syllabus for this class and subject
      if (selectedBatchObj) {
        const existing = await getSchoolTermSyllabus(selectedBatchObj.class, selectedSubject);
        setSyllabusData(existing);
        
        // Populate local edits
        const edits: Record<string, any> = {};
        existing.forEach(item => {
          const key = `${item.school_name}-${item.term}`;
          edits[`${key}-syllabus`] = item.syllabus;
          edits[`${key}-date`] = item.exam_date;
        });
        setLocalEdits(edits);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [selectedBatch, selectedSubject, selectedBatchObj]);

  // Group students by school
    const groupedData = useMemo(() => {
      const groups: Record<string, Record<string, any>> = {};
      enrollments.forEach(e => {
        const school = e.students?.school_name || 'No School';
        const sid = e.students?.id;
        if (sid) {
          if (!groups[school]) groups[school] = {};
          groups[school][sid] = e.students;
        }
      });
      
      // Sort schools alphabetically
      return Object.keys(groups).sort().map(school => ({
        school,
        students: Object.values(groups[school]).sort((a, b) => a.name.localeCompare(b.name))
      }));
    }, [enrollments]);

  const handleEdit = (school: string, term: string, field: 'syllabus' | 'date', value: string) => {
    setLocalEdits(prev => ({
      ...prev,
      [`${school}-${term}-${field}`]: value
    }));
  };

  const handleSave = async () => {
    if (!selectedBatchObj || !selectedSubject) return;
    setSaving(true);
    try {
      const schools = groupedData.map(g => g.school);
      const promises: Promise<any>[] = [];

      schools.forEach(school => {
        TERMS.forEach(term => {
          const syllabus = localEdits[`${school}-${term}-syllabus`];
          const date = localEdits[`${school}-${term}-date`];
          
          if (syllabus !== undefined || date !== undefined) {
            promises.push(upsertSchoolTermSyllabus({
              school_name: school,
              class: selectedBatchObj.class,
              subject_id: selectedSubject,
              term,
              syllabus: syllabus || '',
              exam_date: date || null
            }));
          }
        });
      });

      await Promise.all(promises);
      await loadData();
      alert('Syllabus updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => window.print();

  const handleExport = () => {
    const headings = ['SL No.', 'School', 'Student Name', ...TERMS.flatMap(t => [`${t} Syllabus`, `${t} Date`])];
    const rows: any[] = [];
    let slNo = 1;

    groupedData.forEach(group => {
      group.students.forEach((student, idx) => {
        const row = [
          slNo++,
          idx === 0 ? group.school : '',
          student.name,
          ...TERMS.flatMap(term => [
            localEdits[`${group.school}-${term}-syllabus`] || '',
            localEdits[`${group.school}-${term}-date`] || ''
          ])
        ];
        rows.push(row);
      });
    });

    const csvContent = [
      headings.join(','),
      ...rows.map(row => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Syllabus_Tracker_${selectedBatchObj?.name}_${selectedSubjectObj?.name}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#0a0c10]">
      <Header title="Syllabus Tracker" subtitle="Manage school-wise exam syllabus and dates" />

      <div className="p-6 space-y-6">
        {/* Filters and Actions */}
        <Card className="p-4 flex flex-wrap items-center justify-between gap-4 border-[#1e2130] bg-[#141722] print:hidden">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#9ca3af]" />
              <span className="text-sm text-[#9ca3af] font-medium">Filters:</span>
            </div>
            
            <div className="space-y-1">
              <p className="text-[10px] uppercase text-[#4b5563] font-bold ml-1">Class</p>
              <select
                value={classFilter}
                onChange={e => { setClassFilter(e.target.value); setSelectedBatch(''); }}
                className="bg-[#0f1117] border-[#1e2130] rounded-lg h-9 px-3 text-xs text-white focus:border-violet-500 outline-none min-w-[100px]"
              >
                <option value="">All</option>
                <option value="11">Class 11</option>
                <option value="12">Class 12</option>
              </select>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] uppercase text-[#4b5563] font-bold ml-1">Batch</p>
              <select
                value={selectedBatch}
                onChange={e => setSelectedBatch(e.target.value)}
                className="bg-[#0f1117] border-[#1e2130] rounded-lg h-9 px-3 text-xs text-white focus:border-violet-500 outline-none min-w-[140px]"
              >
                <option value="">Select batch</option>
                {batches
                  .filter(b => classFilter === '' || b.class === classFilter)
                  .map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] uppercase text-[#4b5563] font-bold ml-1">Subject</p>
              <select
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                className="bg-[#0f1117] border-[#1e2130] rounded-lg h-9 px-3 text-xs text-white focus:border-violet-500 outline-none min-w-[140px]"
              >
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] uppercase text-[#4b5563] font-bold ml-1">Faculty</p>
              <div className="bg-[#0f1117] border border-[#1e2130] rounded-lg h-9 px-3 flex items-center text-xs text-[#4b5563] min-w-[120px]">
                (Unfilled)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-5">
            <Button variant="secondary" size="sm" icon={<Printer className="w-4 h-4" />} onClick={handlePrint}>Print</Button>
            <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />} onClick={handleExport}>Export</Button>
            <Button variant="primary" size="sm" icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </Card>

        {/* Table */}
        <div className="bg-[#141722] border border-[#1e2130] rounded-xl overflow-hidden shadow-2xl overflow-x-auto">
          <table className="w-full border-collapse text-xs text-left">
            <thead>
              <tr className="bg-[#1e2130]/50 text-[#9ca3af] border-b border-[#1e2130]">
                <th rowSpan={2} className="p-3 border-r border-[#1e2130] w-12 text-center">SI No.</th>
                <th rowSpan={2} className="p-3 border-r border-[#1e2130] min-w-[150px]">School</th>
                <th rowSpan={2} className="p-3 border-r border-[#1e2130] min-w-[150px]">Student Name</th>
                {TERMS.map(term => (
                  <th key={term} colSpan={2} className="p-3 border-r border-[#1e2130] text-center bg-violet-500/5 text-violet-400 font-bold uppercase tracking-wider">{term}</th>
                ))}
              </tr>
              <tr className="bg-[#1e2130]/30 text-[#6b7280] border-b border-[#1e2130]">
                {TERMS.map(term => (
                  <Fragment key={`${term}-headers`}>
                    <th className="p-2 border-r border-[#1e2130] text-center font-medium">Syllabus</th>
                    <th className="p-2 border-r border-[#1e2130] text-center font-medium">Date</th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3 + TERMS.length * 2} className="p-10 text-center text-[#4b5563]">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Loading data...
                  </td>
                </tr>
              ) : groupedData.length === 0 ? (
                <tr>
                  <td colSpan={3 + TERMS.length * 2} className="p-10 text-center text-[#4b5563]">
                    No students found for this batch and subject.
                  </td>
                </tr>
              ) : (
                groupedData.map((group) => (
                  group.students.map((student, sIdx) => {
                    const isFirst = sIdx === 0;
                    const slNo = groupedData.slice(0, groupedData.indexOf(group)).reduce((acc, curr) => acc + curr.students.length, 0) + sIdx + 1;
                    
                    return (
                      <tr key={student.id} className="border-b border-[#1e2130] hover:bg-[#1a1f30] transition-colors group">
                        <td className="p-2 border-r border-[#1e2130] text-center text-[#9ca3af]">{slNo}</td>
                        {isFirst ? (
                          <td rowSpan={group.students.length} className="p-3 border-r border-[#1e2130] bg-[#141722] font-semibold text-white align-top">
                            {group.school}
                          </td>
                        ) : null}
                        <td className="p-3 border-r border-[#1e2130] text-[#d1d5db]">{student.name}</td>
                        {TERMS.map(term => (
                          <Fragment key={`${student.id}-${term}`}>
                            <td className="p-0 border-r border-[#1e2130]">
                              <textarea
                                value={localEdits[`${group.school}-${term}-syllabus`] || ''}
                                onChange={e => handleEdit(group.school, term, 'syllabus', e.target.value)}
                                className="w-full bg-transparent p-2 resize-none focus:bg-violet-500/5 focus:outline-none min-h-[40px] text-[11px] text-[#9ca3af]"
                                placeholder="Enter syllabus..."
                                rows={2}
                              />
                            </td>
                            <td className="p-0 border-r border-[#1e2130]">
                              <input
                                type="date"
                                value={localEdits[`${group.school}-${term}-date`] || ''}
                                onChange={e => handleEdit(group.school, term, 'date', e.target.value)}
                                className="w-full bg-transparent p-2 focus:bg-violet-500/5 focus:outline-none text-[10px] text-[#9ca3af] [color-scheme:dark]"
                              />
                            </td>
                          </Fragment>
                        ))}
                      </tr>
                    );
                  })
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .min-h-screen, .min-h-screen * { visibility: visible; }
          .print\:hidden { display: none !important; }
          table { border-collapse: collapse !important; width: 100% !important; }
          th, td { border: 1px solid #333 !important; color: black !important; background: white !important; }
          th { background: #f0f0f0 !important; }
          textarea, input { color: black !important; border: none !important; }
        }
      `}</style>
    </div>
  );
}
