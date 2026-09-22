// ─── Domain Entities ─────────────────────────────────────────────
export interface MadrasaInfo {
  nameBangla: string; nameEnglish: string; nameArabic: string;
  eiin: string; slogan: string; address: string;
  hotline: string; guardianSupport: string; email: string;
  principalName: string; principalDesignation: string;
  welcomeMessage: string; history: string; mission: string; vision: string;
  bankAccounts: string; logoUrl: string; signatureUrl: string;
}
export interface Institution {
  id: string; nameBangla: string; nameEnglish: string; shortCode: string;
  targetGrades: string[]; gender: 'boys' | 'girls' | 'co-ed';
  admissionFee: number; monthlyTuitionFee: number; headName: string; features: string[];
}
export interface Student {
  id: string; roll: number; nameBangla: string; nameEnglish: string;
  institutionId: string; classId: string; className: string;
  fatherName: string; motherName: string; guardianPhone: string; address: string;
  dob: string; bloodGroup: string; admissionDate: string;
  residentialStatus: 'residential' | 'non-residential' | 'day-care';
  monthlyTuitionFee: number; status: 'active' | 'graduated' | 'suspended'; password: string;
}
export interface Teacher {
  id: string; nameBangla: string; nameEnglish: string; designation: string;
  qualification: string; phone: string; email: string; joiningDate: string;
  baseSalary: number; assignedSubjectIds: string[]; assignedClassIds: string[];
  status: 'active' | 'on_leave'; bio: string; photoUrl: string; password: string;
}
export interface SubjectDef { subjectName: string; arabicName: string; fullMarks: number; passMarks: number; isQuranicSubject: boolean; kitabAuthor: string; }
export interface PeriodDef { periodNumber: number; timeRange: string; subjectName: string; teacherName: string; }
export interface AcademicClass {
  id: string; name: string; arabicName: string; code: string; institutionId: string;
  section: string; shift: string; assignedTeacherName: string; monthlyFee: number;
  subjects: SubjectDef[]; periods: PeriodDef[];
}
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export interface AttendanceRecord {
  id: string; studentId: string; studentName: string; classId: string; className: string;
  date: string; periodNumber: number; status: AttendanceStatus; recordedBy: string; smsAlertSent: boolean;
}
export interface Homework {
  id: string; classId: string; className: string; subjectName: string; date: string;
  assignedBy: string; title: string; description: string; submissionDeadline: string; completedBy?: string[];
}
export interface FeePayment {
  id: string; studentId: string; studentName: string; classId: string; className: string;
  voucherNumber: string; amountPaid: number; paymentType: 'monthly_tuition' | 'admission' | 'exam_fee' | 'hostel_mess' | 'books' | 'donation';
  monthCovered: string; paymentDate: string; paymentMethod: 'cash' | 'bkash' | 'nagad' | 'bank';
  receivedBy: string; status: 'paid' | 'partial' | 'due';
}
export interface FinancialTransaction {
  id: string; date: string; type: 'income' | 'expense'; category: string;
  amount: number; title: string; description: string; receiptVoucherNo: string; accountMethod: string;
}
export interface SubjectMark { marksObtained: number; totalMarks: number; grade: string; gpa: number; }
export interface ExamResult {
  id: string; examName: string; academicYear: string; studentId: string; studentName: string;
  classId: string; className: string; roll: number; marks: Record<string, SubjectMark>;
  totalObtained: number; percentage: number; gpa: number; grade: string; meritPosition: number; comments: string;
}
export interface SyllabusTopic { id: string; topicName: string; pageRangeOrChapters: string; targetDate: string; isCompleted: boolean; completedAt: string; }
export interface Syllabus { id: string; classId: string; className: string; subjectName: string; academicYear: string; topics: SyllabusTopic[]; }
export interface PrayerTimes { Fajr: string; Zuhr: string; Asr: string; Maghrib: string; Isha: string; Jummah: string; }
export interface Notice {
  id: string; title: string; publishDate: string; category: 'academic' | 'exam' | 'holiday' | 'urgency';
  targetAudience: 'all' | 'students' | 'teachers'; content: string; attachmentUrl: string;
}
export interface AdmissionApplication {
  id: string; applicationNumber: string; institutionId: string;
  applicantNameBangla: string; applicantNameEnglish: string; fatherName: string; motherName: string;
  guardianPhone: string; previousInstitute: string; desiredClass: string; presentAddress: string;
  paymentMethod: string; transactionId: string; status: 'pending' | 'verified' | 'accepted' | 'rejected'; appliedAt: string;
}
export interface Grievance { id: string; studentId: string; studentName: string; date: string; subject: string; message: string; status: 'open' | 'resolved'; reply?: string; }
export interface SalaryRecord { id: string; teacherId: string; teacherName: string; month: string; basic: number; housing: number; deductions: number; net: number; status: 'paid' | 'unpaid'; paidDate: string; }

export type Role = 'public' | 'student' | 'teacher' | 'admin';
export interface Session { role: Role; studentId?: string; teacherId?: string; }
