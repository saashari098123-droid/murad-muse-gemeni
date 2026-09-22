import { useMemo, useState } from 'react';
import { useDB } from '../store/DataContext';
import { toBanglaDigits, todayISO, uid, toCSV, downloadFile } from '../utils/logic';
import { Btn, Card, Field, PrintHeader, SigRow, inputCls, printNow } from '../components/ui';

export default function TeacherPortal({ teacherId }: { teacherId: string }) {
  const { data, update } = useDB();
  const [tab, setTab] = useState('attendance');
  const me = data.teachers.find(t => t.id === teacherId);
  const [clsId, setClsId] = useState(data.classes[0]?.id ?? '');
  const [period, setPeriod] = useState(1);
  const [marks, setMarks] = useState<Record<string, 'present' | 'absent' | 'late' | 'excused'>>({});
  const [hw, setHw] = useState({ subject: '', title: '', desc: '', deadline: todayISO() });
  const cls = data.classes.find(c => c.id === clsId);
  const roster = useMemo(() => data.students.filter(s => s.classId === clsId && s.status === 'active'), [data, clsId]);

  if (!me) return <Card>শিক্ষক পাওয়া যায়নি।</Card>;
  const myHw = data.homework.filter(h => h.assignedBy === me.nameBangla);
  const mySal = data.salaries.filter(s => s.teacherId === teacherId);
  const inbox = data.grievances.filter(g => roster.some(r => r.id === g.studentId));

  const saveAttendance = (sendSms: boolean) => {
    const rows = roster.map(s => ({
      id: uid('AT'), studentId: s.id, studentName: s.nameBangla, classId: clsId,
      className: cls?.name ?? '', date: todayISO(), periodNumber: period,
      status: marks[s.id] ?? 'present', recordedBy: teacherId, smsAlertSent: sendSms && (marks[s.id] === 'absent')
    }));
    update({ attendances: [...data.attendances, ...rows] });
    alert(`${toBanglaDigits(rows.length)} জনের হাজিরা সংরক্ষিত${sendSms ? ' + SMS ড্রাফট তৈরি' : ''}।`);
  };

  return (
    <div className="max-w-6xl mx-auto px-3 py-4">
      <Card className="mb-3"><b>{me.nameBangla}</b> ({me.designation}) — {me.id} | {me.phone}</Card>
      <div className="flex flex-wrap gap-2 mb-4 no-print">
        {[['attendance', 'হাজিরা রেজিস্টার'], ['homework', 'সবক প্রদান'], ['syllabus', 'সিলেবাস মাইলস্টোন'], ['salary', 'বেতন স্লিপ'], ['inbox', `অভিযোগ ইনবক্স (${toBanglaDigits(inbox.length)})`]].map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} className={`px-3 py-2 rounded-xl text-sm font-semibold ${tab === id ? 'bg-[#1e3a8a] text-white' : 'bg-white border'}`}>{l}</button>
        ))}
      </div>

      {tab === 'attendance' && (
        <Card>
          <div className="grid md:grid-cols-3 gap-2">
            <Field label="শ্রেণি"><select className={inputCls} value={clsId} onChange={e => setClsId(e.target.value)}>{data.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            <Field label="পিরিয়ড"><input type="number" min={1} max={8} className={inputCls} value={period} onChange={e => setPeriod(Number(e.target.value))} /></Field>
            <Field label="তারিখ"><input className={inputCls} value={todayISO()} disabled /></Field>
          </div>
          <div className="flex gap-2 mt-2">
            <Btn color="slate" onClick={() => setMarks(Object.fromEntries(roster.map(s => [s.id, 'present'])))}>সবাইকে উপস্থিত</Btn>
            <Btn color="green" onClick={() => saveAttendance(false)}>সংরক্ষণ</Btn>
            <Btn color="gold" onClick={() => saveAttendance(true)}>সংরক্ষণ + অনুপস্থিত SMS</Btn>
            <Btn color="outline" onClick={() => downloadFile('attendance.csv', toCSV(roster.map(s => ({ roll: s.roll, name: s.nameBangla, status: marks[s.id] ?? 'present' }))))}>CSV</Btn>
          </div>
          <table className="w-full text-sm mt-3"><thead><tr className="bg-slate-100"><th className="p-2">রোল</th><th className="p-2 text-left">নাম</th><th className="p-2">অবস্থা</th></tr></thead>
            <tbody>{roster.map(s => (
              <tr key={s.id} className="border-t"><td className="p-2 text-center">{toBanglaDigits(s.roll)}</td><td className="p-2">{s.nameBangla}</td>
                <td className="p-2"><select className={inputCls} value={marks[s.id] ?? 'present'} onChange={e => setMarks({ ...marks, [s.id]: e.target.value as never })}>
                  <option value="present">উপস্থিত</option><option value="absent">অনুপস্থিত</option><option value="late">বিলম্ব</option><option value="excused">ছুটি</option>
                </select></td></tr>
            ))}</tbody></table>
          {sendSmsPreview(roster, marks)}
        </Card>
      )}

      {tab === 'homework' && (
        <Card>
          <h3 className="font-bold">দৈনিক সবক / হোমওয়ার্ক পোস্ট</h3>
          <div className="grid md:grid-cols-2 gap-2 mt-2">
            <Field label="শ্রেণি"><select className={inputCls} value={clsId} onChange={e => setClsId(e.target.value)}>{data.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            <Field label="বিষয়"><select className={inputCls} value={hw.subject} onChange={e => setHw({ ...hw, subject: e.target.value })}><option value="">— নির্বাচন —</option>{(cls?.subjects ?? []).map(s => <option key={s.subjectName} value={s.subjectName}>{s.subjectName}</option>)}</select></Field>
            <Field label="শিরোনাম (যেমন: সবক সূরা মূলক ১-১২)"><input className={inputCls} value={hw.title} onChange={e => setHw({ ...hw, title: e.target.value })} /></Field>
            <Field label="জমার শেষ তারিখ"><input type="date" className={inputCls} value={hw.deadline} onChange={e => setHw({ ...hw, deadline: e.target.value })} /></Field>
            <Field label="বিবরণ (সবক/সবকী/আমোখতা, কিতাব: বাব ও পৃষ্ঠা)"><textarea className={inputCls} rows={3} value={hw.desc} onChange={e => setHw({ ...hw, desc: e.target.value })} /></Field>
          </div>
          <div className="mt-2"><Btn color="green" onClick={() => {
            if (!hw.subject || !hw.title) { alert('বিষয় ও শিরোনাম আবশ্যক'); return; }
            update({ homework: [...data.homework, { id: uid('H'), classId: clsId, className: cls?.name ?? '', subjectName: hw.subject, date: todayISO(), assignedBy: me.nameBangla, title: hw.title, description: hw.desc, submissionDeadline: hw.deadline }] });
            setHw({ subject: '', title: '', desc: '', deadline: todayISO() }); alert('সবক প্রকাশিত!');
          }}>প্রকাশ করুন</Btn></div>
          <div className="mt-3 space-y-1">{myHw.map(h => <div key={h.id} className="text-sm border rounded-xl p-2"><b>{h.className} • {h.subjectName}: {h.title}</b><br />{h.description} <span className="text-slate-500">({h.date})</span></div>)}</div>
        </Card>
      )}

      {tab === 'syllabus' && (
        <div className="space-y-2">{data.syllabuses.filter(s => s.classId === clsId).map(s => (
          <Card key={s.id}><b>{s.subjectName}</b>
            <div className="mt-1 space-y-1">{s.topics.map(t => (
              <label key={t.id} className="flex items-center gap-2 text-sm border rounded-xl px-2 py-1.5">
                <input type="checkbox" checked={t.isCompleted} onChange={e => {
                  update({ syllabuses: data.syllabuses.map(x => x.id === s.id ? { ...x, topics: x.topics.map(y => y.id === t.id ? { ...y, isCompleted: e.target.checked, completedAt: e.target.checked ? todayISO() : '' } : y) } : x) });
                }} />
                <span>{t.topicName} <span className="text-xs text-slate-500">({t.pageRangeOrChapters} • লক্ষ্য: {t.targetDate})</span></span>
              </label>
            ))}</div></Card>
        ))}</div>
      )}

      {tab === 'salary' && (
        <div className="space-y-2">{mySal.map(s => (
          <Card key={s.id}><div className="print-doc">
            <PrintHeader madrasa={data.madrasa} title="শিক্ষক বেতন ভাউচার" subtitle={`মাস: ${s.month}`} />
            <div className="text-sm">নাম: <b>{s.teacherName}</b> ({s.teacherId})<br />মূল: ৳{toBanglaDigits(s.basic)} + বাসা: ৳{toBanglaDigits(s.housing)} − কর্তন: ৳{toBanglaDigits(s.deductions)} = <b>নিট: ৳{toBanglaDigits(s.net)}</b> • অবস্থা: {s.status}</div>
            <SigRow /></div>
            <div className="no-print mt-2"><Btn onClick={printNow}>স্লিপ প্রিন্ট</Btn></div></Card>
        ))}{!mySal.length && <Card>বেতন রেকর্ড নেই।</Card>}</div>
      )}

      {tab === 'inbox' && (
        <div className="space-y-2">{inbox.map(g => (
          <Card key={g.id}><b>{g.studentName}</b> — {g.subject} <span className="text-xs">({g.date})</span><p className="text-sm">{g.message}</p>
            <div className="flex gap-2 mt-1">
              <Btn color="green" onClick={() => { const r = prompt('উত্তর লিখুন:'); if (r) update({ grievances: data.grievances.map(x => x.id === g.id ? { ...x, reply: r, status: 'resolved' } : x) }); }}>উত্তর + সমাধান</Btn>
            </div></Card>
        ))}{!inbox.length && <Card>কোনো অভিযোগ নেই।</Card>}</div>
      )}
    </div>
  );
}

function sendSmsPreview(roster: { id: string; nameBangla: string; guardianPhone: string }[], marks: Record<string, string>) {
  const abs = roster.filter(s => marks[s.id] === 'absent');
  if (!abs.length) return null;
  return (
    <div className="mt-3 bg-amber-50 border rounded-xl p-3 text-sm">
      <b>📩 অনুপস্থিত SMS ড্রাফট ({toBanglaDigits(abs.length)}):</b>
      <div className="mt-1 font-mono text-xs">প্রিয় অভিভাবক, আপনার সন্তান {abs[0].nameBangla} আজ মাদরাসায় অনুপস্থিত। — কর্তৃপক্ষ ({abs[0].guardianPhone})</div>
      <div className="text-xs text-slate-500">বাংলা অক্ষর গণনা: {toBanglaDigits(95)} • ১ SMS (১৬০ অক্ষর)</div>
    </div>
  );
}
