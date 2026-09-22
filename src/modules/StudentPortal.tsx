import { useMemo, useState } from 'react';
import { Printer, MessageSquare } from 'lucide-react';
import { useDB } from '../store/DataContext';
import { attendanceRateFor, numberToBanglaWords, toBanglaDigits } from '../utils/logic';
import { Btn, Card, Field, PrintHeader, SigRow, inputCls, printNow } from '../components/ui';
import { uid, todayISO } from '../utils/logic';

export default function StudentPortal({ studentId }: { studentId: string }) {
  const { data, update } = useDB();
  const [tab, setTab] = useState('overview');
  const [msg, setMsg] = useState({ subject: '', message: '' });
  const me = data.students.find(s => s.id === studentId);
  const myAtt = useMemo(() => data.attendances.filter(a => a.studentId === studentId), [data, studentId]);
  const rate = attendanceRateFor(data.attendances, studentId);
  const myResults = data.examResults.filter(r => r.studentId === studentId);
  const myFees = data.feePayments.filter(f => f.studentId === studentId);
  const myHw = data.homework.filter(h => h.classId === me?.classId);
  const mySyl = data.syllabuses.filter(s => s.classId === me?.classId);
  const classmates = data.students.filter(s => s.classId === me?.classId && s.id !== studentId);
  const dues = (me?.monthlyTuitionFee ?? 0) * 12 - myFees.reduce((s, f) => s + f.amountPaid, 0);

  if (!me) return <Card>শিক্ষার্থী পাওয়া যায়নি।</Card>;

  const cal = (month: string) => {
    const days: { d: number; st?: string }[] = [];
    const [y, m] = month.split('-').map(Number);
    const n = new Date(y, m, 0).getDate();
    for (let d = 1; d <= n; d++) {
      const iso = `${month}-${String(d).padStart(2, '0')}`;
      const rec = myAtt.find(a => a.date === iso);
      days.push({ d, st: rec?.status ?? (new Date(y, m - 1, d).getDay() === 5 ? 'holiday' : undefined) });
    }
    return days;
  };
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const color: Record<string, string> = { present: 'bg-green-500', absent: 'bg-red-500', late: 'bg-yellow-400', excused: 'bg-blue-400', holiday: 'bg-slate-300' };

  return (
    <div className="max-w-6xl mx-auto px-3 py-4">
      <div className="flex flex-wrap gap-2 mb-4 no-print">
        {[['overview', 'ওভারভিউ'], ['homework', 'সবক / হোমওয়ার্ক'], ['attendance', 'হাজিরা'], ['fees', 'ফি ও রসিদ'], ['results', 'রিপোর্ট কার্ড'], ['classmates', 'সহপাঠী'], ['syllabus', 'সিলেবাস'], ['feedback', 'অভিযোগ বাক্স']].map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} className={`px-3 py-2 rounded-xl text-sm font-semibold ${tab === id ? 'bg-[#065f46] text-white' : 'bg-white border'}`}>{l}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <Card>
          <div className="flex gap-4 items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-2xl font-bold text-[#065f46]">{me.nameBangla[0]}</div>
            <div>
              <h2 className="text-xl font-bold">আসসালামু আলাইকুম, {me.nameBangla}!</h2>
              <div className="text-sm text-slate-600">{me.id} • {me.className} • রোল {toBanglaDigits(me.roll)} • {me.institutionId}</div>
              <div className="text-sm">উপস্থিতি: <b>{toBanglaDigits(rate)}%</b> • মেধা: <b>{toBanglaDigits(myResults[0]?.meritPosition ?? 0)}</b></div>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-2 mt-3 text-sm">
            <div className="border rounded-xl p-2">পিতা: {me.fatherName}<br />মাতা: {me.motherName}<br />ফোন: {me.guardianPhone}</div>
            <div className="border rounded-xl p-2">জন্ম: {me.dob}<br />রক্ত: {me.bloodGroup}<br />আবাসিক: {me.residentialStatus}</div>
            <div className="border rounded-xl p-2">মাসিক ফি: ৳{toBanglaDigits(me.monthlyTuitionFee)}<br />বকেয়া: ৳{toBanglaDigits(Math.max(dues, 0))}<br />ঠিকানা: {me.address}</div>
          </div>
        </Card>
      )}

      {tab === 'homework' && (
        <div className="space-y-2">{myHw.map(h => (
          <Card key={h.id}><b>{h.subjectName}: {h.title}</b><p className="text-sm">{h.description}</p><div className="text-xs text-slate-500">তারিখ: {h.date} • জমা: {h.submissionDeadline} • প্রদানকারী: {h.assignedBy}</div></Card>
        ))}{!myHw.length && <Card>কোনো সবক নেই।</Card>}</div>
      )}

      {tab === 'attendance' && (
        <Card>
          <Field label="মাস"><input type="month" className={inputCls} value={month} onChange={e => setMonth(e.target.value)} /></Field>
          <div className="grid grid-cols-7 gap-1.5 mt-3">
            {cal(month).map((c, i) => <div key={i} title={c.st ?? ''} className={`h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white ${color[c.st ?? ''] ?? 'bg-slate-100 !text-slate-500'}`}>{toBanglaDigits(c.d)}</div>)}
          </div>
          <div className="flex gap-3 text-xs mt-2"><span>🟩 উপস্থিত</span><span>🟥 অনুপস্থিত</span><span>🟨 বিলম্ব</span><span>⬜ ছুটি/শুক্রবার</span></div>
        </Card>
      )}

      {tab === 'fees' && (
        <Card>
          <h3 className="font-bold">ফি লেজার — মোট পরিশোধ: ৳{toBanglaDigits(myFees.reduce((s, f) => s + f.amountPaid, 0))}</h3>
          <div className="space-y-2 mt-2">{myFees.map(f => (
            <div key={f.id} className="border rounded-xl p-3 text-sm print-doc" id={`fee-${f.id}`}>
              <PrintHeader madrasa={data.madrasa} title="অফিসিয়াল ফি ভাউচার" subtitle={`ভাউচার: ${f.voucherNumber}`} />
              <div>শিক্ষার্থী: <b>{f.studentName}</b> ({f.studentId}) • {f.className}</div>
              <div>খাত: {f.paymentType} • মাস: {f.monthCovered} • মাধ্যম: {f.paymentMethod} • তারিখ: {f.paymentDate}</div>
              <div className="text-lg font-bold">পরিমাণ: ৳{toBanglaDigits(f.amountPaid)} <span className="text-xs font-normal">({numberToBanglaWords(f.amountPaid)})</span></div>
              <SigRow />
              <div className="no-print mt-2"><Btn onClick={printNow}><span className="flex items-center gap-1"><Printer size={14} /> ভাউচার প্রিন্ট</span></Btn></div>
            </div>
          ))}</div>
        </Card>
      )}

      {tab === 'results' && (
        <div className="space-y-3">{myResults.map(r => (
          <Card key={r.id}>
            <div className="print-doc">
              <PrintHeader madrasa={data.madrasa} title={`${r.examName} — রিপোর্ট কার্ড`} subtitle={`${r.className} • রোল ${toBanglaDigits(r.roll)} • ${r.academicYear}`} />
              <div className="text-sm">নাম: <b>{r.studentName}</b> | মোট: {toBanglaDigits(r.totalObtained)} | {r.percentage}% | GPA {r.gpa} | {r.grade} | মেধা {toBanglaDigits(r.meritPosition)}</div>
              <table className="mt-2"><thead><tr><th>বিষয়</th><th>প্রাপ্ত</th><th>মোট</th><th>গ্রেড</th><th>GPA</th></tr></thead>
                <tbody>{Object.entries(r.marks).map(([s, m]) => <tr key={s}><td>{s}</td><td>{toBanglaDigits(m.marksObtained)}</td><td>{toBanglaDigits(m.totalMarks)}</td><td>{m.grade}</td><td>{m.gpa}</td></tr>)}</tbody></table>
              <div className="text-sm mt-1">মন্তব্য: {r.comments}</div>
              <SigRow />
            </div>
            <div className="no-print mt-2"><Btn onClick={printNow}>মার্কশিট প্রিন্ট</Btn></div>
          </Card>
        ))}{!myResults.length && <Card>এখনো ফল প্রকাশ হয়নি।</Card>}</div>
      )}

      {tab === 'classmates' && (
        <Card><h3 className="font-bold">সহপাঠী ({toBanglaDigits(classmates.length)})</h3>
          <table className="w-full text-sm mt-2"><thead><tr className="bg-slate-100"><th className="p-2 text-left">রোল</th><th className="p-2 text-left">নাম</th><th className="p-2 text-left">ফোন</th></tr></thead>
            <tbody>{classmates.map(c => <tr key={c.id} className="border-t"><td className="p-2">{toBanglaDigits(c.roll)}</td><td className="p-2">{c.nameBangla}</td><td className="p-2">{c.guardianPhone}</td></tr>)}</tbody></table></Card>
      )}

      {tab === 'syllabus' && (
        <div className="space-y-2">{mySyl.map(s => {
          const done = s.topics.filter(t => t.isCompleted).length;
          const pct = s.topics.length ? Math.round(done / s.topics.length * 100) : 0;
          return <Card key={s.id}><b>{s.subjectName}</b><div className="h-2 bg-slate-100 rounded-full mt-1"><div className="h-2 bg-[#065f46] rounded-full" style={{ width: pct + '%' }} /></div><div className="text-xs mt-1">{toBanglaDigits(pct)}% সম্পন্ন ({toBanglaDigits(done)}/{toBanglaDigits(s.topics.length)})</div>
            <ul className="text-xs list-disc ml-5">{s.topics.map(t => <li key={t.id}>{t.isCompleted ? '✅' : '⬜'} {t.topicName} — {t.pageRangeOrChapters}</li>)}</ul></Card>;
        })}</div>
      )}

      {tab === 'feedback' && (
        <Card>
          <h3 className="font-bold flex items-center gap-2"><MessageSquare size={16} /> গোপন অভিযোগ / দোয়ার আবেদন</h3>
          <div className="grid gap-2 mt-2">
            <Field label="বিষয়"><input className={inputCls} value={msg.subject} onChange={e => setMsg({ ...msg, subject: e.target.value })} /></Field>
            <Field label="বার্তা"><textarea className={inputCls} rows={4} value={msg.message} onChange={e => setMsg({ ...msg, message: e.target.value })} /></Field>
            <Btn color="green" onClick={() => {
              if (!msg.message) { alert('বার্তা লিখুন'); return; }
              update({ grievances: [...data.grievances, { id: uid('G'), studentId: me.id, studentName: me.nameBangla, date: todayISO(), subject: msg.subject || 'সাধারণ', message: msg.message, status: 'open' }] });
              setMsg({ subject: '', message: '' }); alert('প্রশাসনের কাছে পাঠানো হয়েছে।');
            }}>পাঠান</Btn>
          </div>
          <div className="mt-3 space-y-1">{data.grievances.filter(g => g.studentId === studentId).map(g => <div key={g.id} className="text-sm border rounded-xl p-2"><b>{g.subject}</b> ({g.status})<br />{g.message}{g.reply && <div className="text-green-700">উত্তর: {g.reply}</div>}</div>)}</div>
        </Card>
      )}
    </div>
  );
}
