// Business logic: grading, merit, Bangla words/digits, Hijri conversion, CSV helpers
import type { ExamResult, AttendanceRecord, Student } from '../types';

export function gradeFor(pct: number): { grade: string; gpa: number } {
  if (pct >= 80) return { grade: 'Mumtaz (A+)', gpa: 5.0 };
  if (pct >= 70) return { grade: 'Jayyid Jiddan (A)', gpa: 4.0 };
  if (pct >= 60) return { grade: 'Jayyid (A-)', gpa: 3.5 };
  if (pct >= 50) return { grade: 'Maqbool (B)', gpa: 3.0 };
  if (pct >= 40) return { grade: 'Rasib Pass (C)', gpa: 2.0 };
  return { grade: 'Rasib Fail (F)', gpa: 0.0 };
}

export function computeResultTotals(marks: Record<string, { marksObtained: number; totalMarks: number }>) {
  let obt = 0, tot = 0, gpaSum = 0, n = 0, failed = false;
  for (const k of Object.keys(marks)) {
    const m = marks[k];
    obt += m.marksObtained; tot += m.totalMarks;
    const pct = m.totalMarks ? (m.marksObtained / m.totalMarks) * 100 : 0;
    const g = gradeFor(pct); gpaSum += g.gpa; n++;
    if (pct < 40) failed = true;
  }
  const pct = tot ? (obt / tot) * 100 : 0;
  let { grade, gpa } = gradeFor(pct);
  if (failed) { grade = 'Rasib Fail (F)'; gpa = 0; }
  else gpa = n ? Math.round((gpaSum / n) * 100) / 100 : 0;
  return { totalObtained: obt, percentage: Math.round(pct * 100) / 100, gpa, grade };
}

// Merit: total desc -> quranic marks desc -> attendance desc -> younger age first
export function assignMerit(
  results: ExamResult[],
  quranicSubjects: string[],
  attendanceRate: (sid: string) => number,
  dobOf: (sid: string) => string
): ExamResult[] {
  const sorted = [...results].sort((a, b) => {
    if (b.totalObtained !== a.totalObtained) return b.totalObtained - a.totalObtained;
    const qa = quranicSubjects.reduce((s, sub) => s + (a.marks[sub]?.marksObtained ?? 0), 0);
    const qb = quranicSubjects.reduce((s, sub) => s + (b.marks[sub]?.marksObtained ?? 0), 0);
    if (qb !== qa) return qb - qa;
    const aa = attendanceRate(a.studentId), ab = attendanceRate(b.studentId);
    if (ab !== aa) return ab - aa;
    return dobOf(b.studentId).localeCompare(dobOf(a.studentId)); // younger (later dob) first
  });
  return sorted.map((r, i) => ({ ...r, meritPosition: i + 1 }));
}

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
export const toBanglaDigits = (s: string | number): string =>
  String(s).replace(/[0-9]/g, d => BN_DIGITS[Number(d)]);

const ONES = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়', 'দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'ঊনিশ', 'বিশ', 'একুশ', 'বাইশ', 'তেইশ', 'চব্বিশ', 'পঁচিশ', 'ছাব্বিশ', 'সাতাশ', 'আঠাশ', 'ঊনত্রিশ', 'ত্রিশ', 'একত্রিশ', 'বত্রিশ', 'তেত্রিশ', 'চৌত্রিশ', 'পঁয়ত্রিশ', 'ছত্রিশ', 'সাঁইত্রিশ', 'আটত্রিশ', 'ঊনচল্লিশ', 'চল্লিশ', 'একচল্লিশ', 'বিয়াল্লিশ', 'তেতাল্লিশ', 'চুয়াল্লিশ', 'পঁয়তাল্লিশ', 'ছেচল্লিশ', 'সাতচল্লিশ', 'আটচল্লিশ', 'ঊনপঞ্চাশ', 'পঞ্চাশ', 'একান্ন', 'বায়ান্ন', 'তিপ্পান্ন', 'চুয়ান্ন', 'পঞ্চান্ন', 'ছাপ্পান্ন', 'সাতান্ন', 'আটান্ন', 'ঊনষাট', 'ষাট', 'একষট্টি', 'বাষট্টি', 'তেষট্টি', 'চৌষট্টি', 'পঁয়ষট্টি', 'ছেষট্টি', 'সাতষট্টি', 'আটষট্টি', 'ঊনসত্তর', 'সত্তর', 'একাত্তর', 'বাহাত্তর', 'তিয়াত্তর', 'চুয়াত্তর', 'পঁচাত্তর', 'ছিয়াত্তর', 'সাতাত্তর', 'আটাত্তর', 'ঊনআশি', 'আশি', 'একাশি', 'বিরাশি', 'তিরাশি', 'চুরাশি', 'পঁচাশি', 'ছিয়াশি', 'সাতাশি', 'আটাশি', 'ঊননব্বই', 'নব্বই', 'একানব্বই', 'বিরানব্বই', 'তিরানব্বই', 'চুরানব্বই', 'পঁচানব্বই', 'ছিয়ানব্বই', 'সাতানব্বই', 'আটানব্বই', 'নিরানব্বই'];
function twoDigits(n: number): string { return ONES[n] ?? ''; }
export function numberToBanglaWords(n: number): string {
  if (!Number.isFinite(n)) return '';
  n = Math.round(n);
  if (n === 0) return 'শূন্য টাকা মাত্র';
  if (n < 0) return 'ঋণাত্মক ' + numberToBanglaWords(-n);
  let parts: string[] = [];
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  if (crore) parts.push(`${crore < 100 ? twoDigits(crore) : numberToBanglaWordsCore(crore)} কোটি`);
  if (lakh) parts.push(`${twoDigits(lakh)} লাখ`);
  if (thousand) parts.push(`${twoDigits(thousand)} হাজার`);
  if (hundred) parts.push(`${twoDigits(hundred)} শত`);
  if (rest) parts.push(twoDigits(rest));
  return parts.join(' ') + ' টাকা মাত্র';
}
function numberToBanglaWordsCore(n: number): string {
  if (n < 100) return twoDigits(n);
  return n.toString();
}

// Hijri conversion (Kuwaiti algorithm) + Bengali month names
const HIJRI_MONTHS_BN = ['মুহাররম', 'সফর', 'রবিউল আউয়াল', 'রবিউস সানি', 'জুমাদাল ঊলা', 'জুমাদাস সানিয়া', 'রজব', 'শাবান', 'রমজান', 'শাওয়াল', 'জিলকদ', 'জিলহজ'];
const HIJRI_MONTHS_EN = ['Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani", 'Jumada al-Ula', 'Jumada al-Akhirah', 'Rajab', "Sha'ban", 'Ramadan', 'Shawwal', "Dhul-Qa'dah", 'Dhul-Hijjah'];
export function gregorianToHijri(date: Date): { hy: number; hm: number; hd: number } {
  const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
  let jd = Math.floor((1461 * (y + 4800 + Math.floor((m - 14) / 12))) / 4)
    + Math.floor((367 * (m - 2 - 12 * Math.floor((m - 14) / 12))) / 12)
    - Math.floor((3 * Math.floor((y + 4900 + Math.floor((m - 14) / 12)) / 100)) / 4) + d - 32075;
  let l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631); l = l - 10631 * n + 354;
  const j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) + Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const hm = Math.floor((24 * l) / 709); const hd = l - Math.floor((709 * hm) / 24); const hy = 30 * n + j - 30;
  return { hy, hm, hd };
}
export function hijriToday(date = new Date()): string {
  const { hy, hm, hd } = gregorianToHijri(date);
  return `${toBanglaDigits(hd)} ${HIJRI_MONTHS_BN[hm - 1]} ${toBanglaDigits(hy)} হিজরি`;
}
export function hijriTodayEn(date = new Date()): string {
  const { hy, hm, hd } = gregorianToHijri(date);
  return `${hd} ${HIJRI_MONTHS_EN[hm - 1]} ${hy} AH`;
}

export function attendanceRateFor(records: AttendanceRecord[], studentId: string, month?: string): number {
  const rows = records.filter(r => r.studentId === studentId && (!month || r.date.startsWith(month)));
  if (!rows.length) return 0;
  const present = rows.filter(r => r.status === 'present' || r.status === 'late').length;
  return Math.round((present / rows.length) * 1000) / 10;
}

export function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n');
}
export function downloadFile(filename: string, content: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob(['\uFEFF' + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
export const uid = (p = 'ID'): string => `${p}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`;
export const todayISO = (): string => new Date().toISOString().slice(0, 10);
export function vouchNo(prefix = 'V'): string {
  const d = new Date();
  return `${prefix}-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(1000 + Math.random() * 9000))}`;
}
