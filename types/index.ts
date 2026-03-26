// ============================================================
// CORE ENTITY TYPES
// ============================================================

export type StudentStatus = 
  | 'April Joinee'
  | 'Not contacted'
  | "Contacted hasn't been confirmed for continuity"
  | 'Contacted, has confirmed'
  | 'Discontinue/permanent Inactive'
  | 'Active' | 'active' | 'inactive' | 'on_leave';

export interface Student {
  id: string;
  name: string;
  class: string;
  school_name: string;
  parent_phone: string;
  status: string; // Changed to string for maximum flexibility since we have many custom statuses now.
  mentor_id?: string;
  created_at?: string;
  // Joined via enrollments → batches
  enrollments?: { batches: { id: string; name: string } | null }[];
}

export interface Batch {
  id: string;
  name: string;
  class: string;
  created_at?: string;
}

export interface Subject {
  id: string;
  name: string;
  created_at?: string;
}

export type TeacherRole = 'primary' | 'secondary';

export interface Teacher {
  id: string;
  name: string;
  email?: string;
  created_at?: string;
}

export interface Mentor {
  id: string;
  name: string;
  email?: string;
  created_at?: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  batch_id: string;
  subject_id: string;
  teacher_id?: string;
  role: TeacherRole;
  created_at?: string;
  // Joined fields
  student?: Student;
  batch?: Batch;
  subject?: Subject;
  teacher?: Teacher;
}

// ============================================================
// ATTENDANCE
// ============================================================

export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface Attendance {
  id: string;
  student_id: string;
  subject_id: string;
  batch_id: string;
  date: string;
  status: AttendanceStatus;
  created_at?: string;
  student?: Student;
  subject?: Subject;
}

// ============================================================
// TESTS & MARKS
// ============================================================

export type TestType = 'weekly' | 'class_test' | 'mock' | 'assignment';

export interface Test {
  id: string;
  subject_id: string;
  batch_id: string;
  type: TestType;
  title: string;
  scheduled_date: string;
  eval_deadline: string;
  max_marks: number;
  created_at?: string;
  subject?: Subject;
  batch?: Batch;
}

export interface TestMark {
  id: string;
  test_id: string;
  student_id: string;
  marks_obtained: number | null;
  evaluated_at?: string;
  created_at?: string;
  test?: Test;
  student?: Student;
}

// ============================================================
// SYLLABUS
// ============================================================

export type SyllabusStatus = 'pending' | 'in_progress' | 'completed';

export interface SyllabusTracker {
  id: string;
  subject_id: string;
  batch_id: string;
  teacher_id?: string;
  chapter: string;
  status: SyllabusStatus;
  completed_date?: string;
  created_at?: string;
  subject?: Subject;
  batch?: Batch;
  teacher?: Teacher;
}

export interface SchoolTermSyllabus {
  id: string;
  school_name: string;
  class: string;
  subject_id: string;
  term: string;
  syllabus: string;
  exam_date: string;
  created_at?: string;
  subject?: Subject;
}

// ============================================================
// COMMUNICATION
// ============================================================

export interface ParentCommunicationLog {
  id: string;
  student_id: string;
  mentor_id: string;
  contacted_at: string;
  notes?: string;
  created_at?: string;
  student?: Student;
  mentor?: Mentor;
}

export interface MentoringMessage {
  id: string;
  mentor_id: string;
  student_id: string;
  message_date: string;
  type: 'first' | 'mid'; // 1st or 15th of month
  content?: string;
  created_at?: string;
  student?: Student;
  mentor?: Mentor;
}

// ============================================================
// MERIT / DEMERIT
// ============================================================

export type ActorType = 'mentor' | 'teacher';

export interface MeritDemertiLog {
  id: string;
  actor_id: string;
  actor_type: ActorType;
  reason: string;
  points: number; // positive = merit, negative = demerit
  created_at?: string;
}

// ============================================================
// DASHBOARD / AGGREGATED
// ============================================================

export interface DashboardStats {
  total_students: number;
  active_students: number;
  weak_students: number;
  total_batches: number;
  pending_parent_contacts: number;
  pending_mentoring_messages: number;
  overdue_evaluations: number;
}

export interface StudentPerformance {
  student: Student;
  avg_score: number;
  attendance_pct: number;
  enrollment_count: number;
}
export interface SchoolExamMarks {
  id: string;
  student_id: string;
  term: string;
  physics: number;
  chemistry: number;
  math: number;
  biology: number;
  computer: number;
  created_at?: string;
  student?: Student;
}

export type SchoolExamMarksUpdate = Partial<Omit<SchoolExamMarks, 'id' | 'student_id' | 'created_at'>>;
