import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AcademicClass, AdmissionApplication, AttendanceRecord, ExamResult, FeePayment, FinancialTransaction, Grievance, Homework, Institution, MadrasaInfo, Notice, PrayerTimes, SalaryRecord, Student, Syllabus, Teacher } from '../types';
import { db, firebaseEnabled } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export interface DB {
  madrasa: MadrasaInfo;
  institutions: Institution[];
  students: Student[];
  teachers: Teacher[];
  classes: AcademicClass[];
  attendances: AttendanceRecord[];
  homework: Homework[];
  feePayments: FeePayment[];
  transactions: FinancialTransaction[];
  examResults: ExamResult[];
  syllabuses: Syllabus[];
  prayerTimes: PrayerTimes;
  notices: Notice[];
  applications: AdmissionApplication[];
  grievances: Grievance[];
  salaries: SalaryRecord[];
}

const seed = (): DB => ({
  madrasa: {
    nameBangla: 'দারুল উলূম ইসলামিয়া মাদরাসা', nameEnglish: 'Darul Uloom Islamia Madrasa', nameArabic: 'دار العلوم الإسلامية',
    eiin: 'DA-786', slogan: 'ইলম • আমল • আখলাক', address: 'মাদরাসা রোড, ঢাকা-১২১৬',
    hotline: '09611-786786', guardianSupport: '01711-000000', email: 'info@darululoom.edu.bd',
    principalName: 'মুফতি আব্দুল্লাহ আল মামুন', principalDesignation: 'মুহতামিম ও প্রিন্সিপাল',
    welcomeMessage: 'আসসালামু আলাইকুম। দীনি ও আধুনিক শিক্ষার সমন্বয়ে আদর্শ প্রজন্ম গড়াই আমাদের অঙ্গীকার।',
    history: '১৯৯৫ সালে প্রতিষ্ঠিত এই প্রতিষ্ঠানে বর্তমানে ৪টি ক্যাম্পাসে ১২০০+ শিক্ষার্থী অধ্যয়নরত।',
    mission: 'কুরআন-সুন্নাহ ভিত্তিক যুগোপযোগী শিক্ষা প্রদান।', vision: 'তাকওয়াবান, দক্ষ ও দেশপ্রেমিক আলেম প্রজন্ম।',
    bankAccounts: 'বিকাশ: 01711-000000 | নগদ: 01811-000000 | ব্যাংক: IBBL A/C 1234-567890',
    logoUrl: '', signatureUrl: ''
  },
  institutions: [
    { id: 'madrasa_main', nameBangla: 'মূল মাদরাসা', nameEnglish: 'Main Madrasa', shortCode: 'MM', targetGrades: ['Noorani', 'Hifz', 'Kitab'], gender: 'boys', admissionFee: 2000, monthlyTuitionFee: 1200, headName: 'মুফতি আব্দুল্লাহ', features: ['হিফজ বিভাগ', 'কিতাব বিভাগ', 'আবাসিক হল'] },
    { id: 'boys_madrasa', nameBangla: 'বালক শাখা', nameEnglish: 'Boys Branch', shortCode: 'BM', targetGrades: ['Noorani', 'Hifz'], gender: 'boys', admissionFee: 1500, monthlyTuitionFee: 1000, headName: 'মাওলানা রফিকুল ইসলাম', features: ['নূরানী', 'নাজেরা'] },
    { id: 'girls_madrasa', nameBangla: 'বালিকা শাখা', nameEnglish: 'Girls Branch', shortCode: 'GM', targetGrades: ['Noorani', 'Hifz', 'Kitab'], gender: 'girls', admissionFee: 1500, monthlyTuitionFee: 1000, headName: 'উস্তাযা ফাতেমা খাতুন', features: ['মহিলা উস্তাযা', 'নিরাপদ আবাসন'] },
    { id: 'general_school', nameBangla: 'জেনারেল স্কুল', nameEnglish: 'General School', shortCode: 'GS', targetGrades: ['General'], gender: 'co-ed', admissionFee: 2500, monthlyTuitionFee: 1500, headName: 'জনাব কামরুল হাসান', features: ['বিজ্ঞান ল্যাব', 'কম্পিউটার ল্যাব'] },
  ],
  students: [
    { id: 'DA-2026-101', roll: 1, nameBangla: 'মুহাম্মদ আব্দুল্লাহ', nameEnglish: 'Muhammad Abdullah', institutionId: 'madrasa_main', classId: 'c-hifz-1', className: 'হিফজ ১ম বর্ষ', fatherName: 'মোঃ ইব্রাহিম', motherName: 'আমিনা বেগম', guardianPhone: '01711111111', address: 'ঢাকা', dob: '2014-03-12', bloodGroup: 'O+', admissionDate: '2024-01-05', residentialStatus: 'residential', monthlyTuitionFee: 1200, status: 'active', password: '1234' },
    { id: 'DA-2026-102', roll: 2, nameBangla: 'আহমাদ হাসান', nameEnglish: 'Ahmad Hasan', institutionId: 'madrasa_main', classId: 'c-hifz-1', className: 'হিফজ ১ম বর্ষ', fatherName: 'মোঃ করিম', motherName: 'সালমা', guardianPhone: '01722222222', address: 'নারায়ণগঞ্জ', dob: '2015-06-20', bloodGroup: 'B+', admissionDate: '2024-01-06', residentialStatus: 'non-residential', monthlyTuitionFee: 1200, status: 'active', password: '1234' },
    { id: 'DA-2026-103', roll: 1, nameBangla: 'ফাতেমা আক্তার', nameEnglish: 'Fatema Akter', institutionId: 'girls_madrasa', classId: 'c-noorani-g', className: 'নূরানী শিশু', fatherName: 'মোঃ জামাল', motherName: 'নাসরিন', guardianPhone: '01733333333', address: 'ঢাকা', dob: '2017-01-10', bloodGroup: 'A+', admissionDate: '2024-01-07', residentialStatus: 'day-care', monthlyTuitionFee: 1000, status: 'active', password: '1234' },
  ],
  teachers: [
    { id: 'T-101', nameBangla: 'মুফতি আব্দুল্লাহ আল মামুন', nameEnglish: 'Mufti Abdullah Al Mamun', designation: 'মুহতামিম', qualification: 'দাওরায়ে হাদিস, ইফতা', phone: '01710000001', email: 'muhtamim@edu.bd', joiningDate: '2010-01-01', baseSalary: 45000, assignedSubjectIds: ['আকাইদ'], assignedClassIds: ['c-dawra'], status: 'active', bio: 'প্রতিষ্ঠাতা মুহতামিম', photoUrl: '', password: '1234' },
    { id: 'T-102', nameBangla: 'ক্বারী সাইফুল ইসলাম', nameEnglish: 'Qari Saiful Islam', designation: 'হিফজ প্রশিক্ষক', qualification: 'হাফেজ, ক্বারী', phone: '01710000002', email: 'saiful@edu.bd', joiningDate: '2018-03-01', baseSalary: 22000, assignedSubjectIds: ['হিফজ'], assignedClassIds: ['c-hifz-1'], status: 'active', bio: 'সিনিয়র হাফেজ', photoUrl: '', password: '1234' },
  ],
  classes: [
    { id: 'c-hifz-1', name: 'হিফজ ১ম বর্ষ', arabicName: 'السنة الأولى للحفظ', code: 'HIFZ-1', institutionId: 'madrasa_main', section: 'ক', shift: 'সকাল', assignedTeacherName: 'ক্বারী সাইফুল ইসলাম', monthlyFee: 1200,
      subjects: [
        { subjectName: 'হিফজ (সবক)', arabicName: 'الحفظ', fullMarks: 100, passMarks: 40, isQuranicSubject: true, kitabAuthor: '—' },
        { subjectName: 'নাজেরা ও তাজবীদ', arabicName: 'التجويد', fullMarks: 100, passMarks: 40, isQuranicSubject: true, kitabAuthor: '—' },
        { subjectName: 'আকাইদ ও মাসনূন দোয়া', arabicName: 'العقائد', fullMarks: 50, passMarks: 20, isQuranicSubject: false, kitabAuthor: 'বেহেশতী জেওর' },
      ],
      periods: [
        { periodNumber: 1, timeRange: '08:00-08:45', subjectName: 'হিফজ (সবক)', teacherName: 'ক্বারী সাইফুল ইসলাম' },
        { periodNumber: 2, timeRange: '08:45-09:30', subjectName: 'নাজেরা ও তাজবীদ', teacherName: 'ক্বারী সাইফুল ইসলাম' },
      ] },
    { id: 'c-noorani-g', name: 'নূরানী শিশু', arabicName: 'نوراني', code: 'NR-G', institutionId: 'girls_madrasa', section: 'ক', shift: 'সকাল', assignedTeacherName: 'উস্তাযা ফাতেমা', monthlyFee: 1000,
      subjects: [
        { subjectName: 'কায়দা ও আমপারা', arabicName: 'القاعدة', fullMarks: 100, passMarks: 40, isQuranicSubject: true, kitabAuthor: 'নূরানী কায়দা' },
        { subjectName: 'বাংলা', arabicName: '', fullMarks: 100, passMarks: 40, isQuranicSubject: false, kitabAuthor: 'NCTB' },
      ],
      periods: [{ periodNumber: 1, timeRange: '09:00-09:40', subjectName: 'কায়দা ও আমপারা', teacherName: 'উস্তাযা ফাতেমা' }] },
    { id: 'c-dawra', name: 'দাওরায়ে হাদিস', arabicName: 'دورة الحديث', code: 'DAWRA', institutionId: 'madrasa_main', section: 'ক', shift: 'সকাল', assignedTeacherName: 'মুফতি আব্দুল্লাহ আল মামুন', monthlyFee: 1500,
      subjects: [
        { subjectName: 'সহীহ বুখারী', arabicName: 'صحيح البخاري', fullMarks: 100, passMarks: 40, isQuranicSubject: true, kitabAuthor: 'ইমাম বুখারী' },
        { subjectName: 'সহীহ মুসলিম', arabicName: 'صحيح مسلم', fullMarks: 100, passMarks: 40, isQuranicSubject: true, kitabAuthor: 'ইমাম মুসলিম' },
      ],
      periods: [{ periodNumber: 1, timeRange: '08:00-09:00', subjectName: 'সহীহ বুখারী', teacherName: 'মুফতি আব্দুল্লাহ আল মামুন' }] },
  ],
  attendances: [
    { id: 'A-1', studentId: 'DA-2026-101', studentName: 'মুহাম্মদ আব্দুল্লাহ', classId: 'c-hifz-1', className: 'হিফজ ১ম বর্ষ', date: new Date().toISOString().slice(0, 10), periodNumber: 1, status: 'present', recordedBy: 'T-102', smsAlertSent: false },
  ],
  homework: [
    { id: 'H-1', classId: 'c-hifz-1', className: 'হিফজ ১ম বর্ষ', subjectName: 'হিফজ (সবক)', date: new Date().toISOString().slice(0, 10), assignedBy: 'ক্বারী সাইফুল ইসলাম', title: 'সবক: সূরা মূলক ১-১২', description: 'সূরা আল-মূলক আয়াত ১-১২ মুখস্থ, সাবকী: সূরা কালাম সম্পূর্ণ', submissionDeadline: new Date().toISOString().slice(0, 10) },
  ],
  feePayments: [
    { id: 'F-1', studentId: 'DA-2026-101', studentName: 'মুহাম্মদ আব্দুল্লাহ', classId: 'c-hifz-1', className: 'হিফজ ১ম বর্ষ', voucherNumber: 'V-202601-1001', amountPaid: 1200, paymentType: 'monthly_tuition', monthCovered: '2026-01', paymentDate: '2026-01-05', paymentMethod: 'cash', receivedBy: 'অফিস', status: 'paid' },
  ],
  transactions: [
    { id: 'T-1', date: '2026-01-05', type: 'income', category: 'Student Fees', amount: 1200, title: 'টিউশন ফি — জানুয়ারি', description: 'DA-2026-101', receiptVoucherNo: 'V-202601-1001', accountMethod: 'cash' },
    { id: 'T-2', date: '2026-01-06', type: 'expense', category: 'Teacher Salaries', amount: 22000, title: 'বেতন — ক্বারী সাইফুল', description: 'জানুয়ারি বেতন', receiptVoucherNo: 'S-202601-01', accountMethod: 'bank' },
  ],
  examResults: [
    { id: 'R-1', examName: '১ম সাময়িক', academicYear: '2026', studentId: 'DA-2026-101', studentName: 'মুহাম্মদ আব্দুল্লাহ', classId: 'c-hifz-1', className: 'হিফজ ১ম বর্ষ', roll: 1,
      marks: { 'হিফজ (সবক)': { marksObtained: 85, totalMarks: 100, grade: 'Mumtaz (A+)', gpa: 5 }, 'নাজেরা ও তাজবীদ': { marksObtained: 78, totalMarks: 100, grade: 'Jayyid Jiddan (A)', gpa: 4 }, 'আকাইদ ও মাসনূন দোয়া': { marksObtained: 42, totalMarks: 50, grade: 'Mumtaz (A+)', gpa: 5 } },
      totalObtained: 205, percentage: 82, gpa: 4.67, grade: 'Mumtaz (A+)', meritPosition: 1, comments: 'মাশাআল্লাহ চমৎকার' },
  ],
  syllabuses: [
    { id: 'S-1', classId: 'c-hifz-1', className: 'হিফজ ১ম বর্ষ', subjectName: 'হিফজ (সবক)', academicYear: '2026', topics: [
      { id: 't1', topicName: 'পারা ২৯ — সূরা মূলক', pageRangeOrChapters: 'পৃঃ ১-২০', targetDate: '2026-02-01', isCompleted: true, completedAt: '2026-01-20' },
      { id: 't2', topicName: 'পারা ২৯ — সূরা কালাম', pageRangeOrChapters: 'পৃঃ ২১-৪০', targetDate: '2026-03-01', isCompleted: false, completedAt: '' },
    ] },
  ],
  prayerTimes: { Fajr: '05:10 / 05:30', Zuhr: '12:00 / 12:30', Asr: '15:45 / 16:00', Maghrib: '17:35 / 17:40', Isha: '19:00 / 19:30', Jummah: '12:30 / 13:00' },
  notices: [
    { id: 'N-1', title: 'বার্ষিক মাহফিল ও দস্তারবন্দী', publishDate: '2026-02-01', category: 'academic', targetAudience: 'all', content: 'আগামী ১৫ ফেব্রুয়ারি বার্ষিক ওয়াজ মাহফিল ও হাফেজদের দস্তারবন্দী অনুষ্ঠিত হবে ইনশাআল্লাহ।', attachmentUrl: '' },
    { id: 'N-2', title: 'অর্ধ-বার্ষিক পরীক্ষার রুটিন', publishDate: '2026-05-20', category: 'exam', targetAudience: 'students', content: 'অর্ধ-বার্ষিক পরীক্ষা ১ জুন থেকে শুরু। প্রবেশপত্র অফিস থেকে সংগ্রহ করুন।', attachmentUrl: '' },
  ],
  applications: [],
  grievances: [
    { id: 'G-1', studentId: 'DA-2026-102', studentName: 'আহমাদ হাসান', date: '2026-02-10', subject: 'ছুটির আবেদন', message: 'জ্বরের কারণে ২ দিনের ছুটি চাই।', status: 'open' },
  ],
  salaries: [
    { id: 'SL-1', teacherId: 'T-102', teacherName: 'ক্বারী সাইফুল ইসলাম', month: '2026-01', basic: 22000, housing: 3000, deductions: 0, net: 25000, status: 'paid', paidDate: '2026-01-06' },
  ],
});

interface Ctx {
  data: DB;
  update: (patch: Partial<DB>) => void;
  reset: () => void;
  syncStatus: 'synced-local' | 'synced-cloud' | 'offline' | 'error';
  forceSync: () => void;
  exportJSON: () => void;
}
const DataCtx = createContext<Ctx | null>(null);
const KEY = 'madrasa_erp_db_v1';

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DB>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return { ...seed(), ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return seed();
  });
  const [syncStatus, setSyncStatus] = useState<Ctx['syncStatus']>(firebaseEnabled ? 'synced-cloud' : 'synced-local');

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { setSyncStatus('error'); }
  }, [data]);

  useEffect(() => {
    if (!db) return;
    const unsubs: (() => void)[] = [];
    const syncCol = (name: string, key: keyof DB) => {
      try {
        const u = onSnapshot(collection(db!, name), snap => {
          if (snap.empty) return;
          const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setData(prev => ({ ...prev, [key]: rows as never }));
          setSyncStatus('synced-cloud');
        }, () => setSyncStatus('offline'));
        unsubs.push(u);
      } catch { setSyncStatus('offline'); }
    };
    (['students', 'teachers', 'notices'] as const).forEach(k => syncCol(k, k));
    const onOff = () => setSyncStatus(navigator.onLine ? (firebaseEnabled ? 'synced-cloud' : 'synced-local') : 'offline');
    window.addEventListener('online', onOff); window.addEventListener('offline', onOff);
    return () => { unsubs.forEach(u => u()); window.removeEventListener('online', onOff); window.removeEventListener('offline', onOff); };
  }, []);

  const update = (patch: Partial<DB>) => setData(prev => ({ ...prev, ...patch }));
  const reset = () => { const s = seed(); setData(s); localStorage.setItem(KEY, JSON.stringify(s)); };
  const forceSync = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); setSyncStatus(firebaseEnabled ? 'synced-cloud' : 'synced-local'); } catch { setSyncStatus('error'); } };
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'madrasa-backup.json'; a.click();
  };
  const val = useMemo(() => ({ data, update, reset, syncStatus, forceSync, exportJSON }), [data, syncStatus]);
  return <DataCtx.Provider value={val}>{children}</DataCtx.Provider>;
}
export const useDB = () => {
  const c = useContext(DataCtx);
  if (!c) throw new Error('useDB outside provider');
  return c;
};
