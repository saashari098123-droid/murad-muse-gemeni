import { useMemo, useState } from 'react';
import { Users, Wallet, TrendingDown, CalendarCheck2, RefreshCw, Download, Plus, Trash2 } from 'lucide-react';
import { useDB } from '../store/DataContext';
import { attendanceRateFor, assignMerit, computeResultTotals, gradeFor, numberToBanglaWords, toBanglaDigits, toCSV, downloadFile, uid, todayISO, vouchNo } from '../utils/logic';
import { Btn, Card, Field, PrintHeader, SigRow, Tile, inputCls, printNow } from '../components/ui';
import type { Student } from '../types';

export default function AdminPortal() {
  const { data, update, syncStatus, forceSync, exportJSON, reset } = useDB();
  const [tab, setTab] = useState('dash');
  const month = todayISO().slice(0, 7);
  const feeIn = data.transactions.filter(t => t.type === 'income' && t.date.startsWith(month)).reduce((s, t) => s + t.amount, 0);
  const expOut = data.transactions.filter(t => t.type === 'expense' && t.date.startsWith(month)).reduce((s, t) => s + t.amount, 0);
  const todayAtt = data.attendances.filter(a => a.date === todayISO());
  const attRate = todayAtt.length ? Math.round(todayAtt.filter(a => a.status === 'present' || a.status === 'late').length / todayAtt.length * 100) : 0;

  const tabs: [string, string][] = [['dash', 'ড্যাশবোর্ড'], ['students', 'ছাত্র SIS'], ['teachers', 'শিক্ষক'], ['fees', 'ফি কালেকশন'], ['ledger', 'আয়-ব্যয়'], ['payroll', 'বেতন'], ['classes', 'ক্লাস/রুটিন'], ['results', 'ফলাফল/ট্যাবুলেশন'], ['admissions', `ভর্তি (${toBanglaDigits(data.applications.filter(a => a.status === 'pending').length)})`], ['sms', 'SMS'], ['sync', 'সিংক/ব্যাকআপ'], ['settings', 'সেটিংস']];

  return (
    <div className="max-w-7xl mx-auto px-3 py-4">
      <div className="flex flex-wrap gap-2 mb-4 no-print">
        {tabs.map(([id, l]) => <button key={id} onClick={() => setTab(id)} className={`px-3 py-2 rounded-xl text-sm font-semibold ${tab === id ? 'bg-[#1e3a8a] text-white' : 'bg-white border'}`}>{l}</button>)}
        <span className="ml-auto text-xs bg-white border rounded-xl px-3 py-2">☁️ {syncStatus} {syncStatus.includes('cloud') ? '🟢' : syncStatus === 'offline' ? '🔴' : '🟡'}</span>
      </div>

      {tab === 'dash' && (
        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Tile icon={<Users size={20} />} label="সক্রিয় ছাত্র" value={toBanglaDigits(data.students.filter(s => s.status === 'active').length)} />
          <Tile icon={<Users size={20} />} label="উস্তায" value={toBanglaDigits(data.teachers.filter(t => t.status === 'active').length)} />
          <Tile icon={<Wallet size={20} />} label="মাসিক আদায়" value={`৳${toBanglaDigits(feeIn)}`} sub={month} />
          <Tile icon={<TrendingDown size={20} />} label="মাসিক ব্যয়" value={`৳${toBanglaDigits(expOut)}`} />
          <Tile icon={<Wallet size={20} />} label="নিট ব্যালেন্স" value={`৳${toBanglaDigits(feeIn - expOut)}`} />
          <Tile icon={<CalendarCheck2 size={20} />} label="আজকের উপস্থিতি" value={`${toBanglaDigits(attRate)}%`} sub={`(${toBanglaDigits(todayAtt.length)} রেকর্ড)`} />
          <Card className="md:col-span-3"><h3 className="font-bold">সাম্প্রতিক লেনদেন</h3>{data.transactions.slice(-5).reverse().map(t => <div key={t.id} className="text-sm border-b py-1 flex justify-between"><span>{t.date} • {t.title} ({t.category})</span><b className={t.type === 'income' ? 'text-green-700' : 'text-red-600'}>{t.type === 'income' ? '+' : '−'}৳{toBanglaDigits(t.amount)}</b></div>)}</Card>
          <Card className="md:col-span-3"><h3 className="font-bold">অপেক্ষমাণ ভর্তি</h3>{data.applications.filter(a => a.status === 'pending').slice(0, 5).map(a => <div key={a.id} className="text-sm border-b py-1">{a.applicationNumber} • {a.applicantNameBangla} • {a.desiredClass}</div>)}</Card>
        </div>
      )}

      {tab === 'students' && <StudentCRUD />}
      {tab === 'teachers' && <TeacherCRUD />}
      {tab === 'fees' && <FeeTerminal />}
      {tab === 'ledger' && <Ledger />}
      {tab === 'payroll' && <Payroll />}
      {tab === 'classes' && <ClassBuilder />}
      {tab === 'results' && <ResultEngine />}
      {tab === 'admissions' && <AdmissionTriage />}
      {tab === 'sms' && <SmsPanel />}
      {tab === 'sync' && (
        <Card><h3 className="font-bold">ক্লাউড সিংক টার্মিনাল</h3>
          <p className="text-sm">অবস্থা: <b>{syncStatus}</b> • Firebase: {(import.meta.env.VITE_FIREBASE_API_KEY ? 'কনফিগার্ড' : 'ডেমো/লোকাল মোড — localStorage + onSnapshot ফলব্যাক')}</p>
          <div className="flex gap-2 mt-2"><Btn onClick={forceSync}><span className="flex gap-1 items-center"><RefreshCw size={14} /> ফোর্স সিংক</span></Btn><Btn color="green" onClick={exportJSON}><span className="flex gap-1 items-center"><Download size={14} /> JSON ব্যাকআপ</span></Btn><Btn color="slate" onClick={() => downloadFile('students.csv', toCSV(data.students as unknown as Record<string, unknown>[]))}>ছাত্র CSV</Btn><Btn color="red" onClick={() => { if (confirm('রিসেট করবেন?')) reset(); }}>রিসেট</Btn></div>
        </Card>
      )}
      {tab === 'settings' && <Settings />}
    </div>
  );
}

function StudentCRUD() {
  const { data, update } = useDB();
  const [q, setQ] = useState(''); const [cls, setCls] = useState('');
  const [form, setForm] = useState<Partial<Student>>({ nameBangla: '', guardianPhone: '', classId: 'c-hifz-1', monthlyTuitionFee: 1200 });
  const [editId, setEditId] = useState<string | null>(null);
  const rows = data.students.filter(s => (!cls || s.classId === cls) && (s.nameBangla.includes(q) || s.id.includes(q)));
  const save = () => {
    if (!form.nameBangla) { alert('নাম আবশ্যক'); return; }
    const c = data.classes.find(x => x.id === form.classId);
    if (editId) {
      update({ students: data.students.map(s => s.id === editId ? { ...s, ...form, className: c?.name ?? s.className } as Student : s) });
      setEditId(null);
    } else {
      const n = data.students.length + 101;
      update({ students: [...data.students, { id: `DA-2026-${n}`, roll: rows.length + 1, nameEnglish: '', institutionId: c?.institutionId ?? 'madrasa_main', className: c?.name ?? '', fatherName: '', motherName: '', address: '', dob: '2015-01-01', bloodGroup: 'O+', admissionDate: todayISO(), residentialStatus: 'non-residential', status: 'active', password: '1234', ...form } as Student] });
    }
    setForm({ nameBangla: '', guardianPhone: '', classId: 'c-hifz-1', monthlyTuitionFee: 1200 });
  };
  return (
    <Card>
      <h3 className="font-bold">ছাত্র তথ্য ব্যবস্থা (মোট: {toBanglaDigits(data.students.length)})</h3>
      <div className="grid md:grid-cols-4 gap-2 mt-2">
        <input className={inputCls} placeholder="খুঁজুন (নাম/ID)" value={q} onChange={e => setQ(e.target.value)} />
        <select className={inputCls} value={cls} onChange={e => setCls(e.target.value)}><option value="">সব শ্রেণি</option>{data.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <Btn color="slate" onClick={() => downloadFile('students.csv', toCSV(data.students as unknown as Record<string, unknown>[]))}>Excel/CSV এক্সপোর্ট</Btn>
        <Btn color="outline" onClick={printNow}>ID কার্ড প্রিন্ট</Btn>
      </div>
      <div className="grid md:grid-cols-5 gap-2 mt-2">
        <input className={inputCls} placeholder="নাম (বাংলা)*" value={form.nameBangla ?? ''} onChange={e => setForm({ ...form, nameBangla: e.target.value })} />
        <input className={inputCls} placeholder="পিতার নাম" value={form.fatherName ?? ''} onChange={e => setForm({ ...form, fatherName: e.target.value })} />
        <input className={inputCls} placeholder="অভিভাবক ফোন" value={form.guardianPhone ?? ''} onChange={e => setForm({ ...form, guardianPhone: e.target.value })} />
        <select className={inputCls} value={form.classId} onChange={e => setForm({ ...form, classId: e.target.value })}>{data.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <Btn color="green" onClick={save}>{editId ? 'আপডেট' : 'যোগ করুন'}</Btn>
      </div>
      <div className="overflow-x-auto mt-2"><table className="w-full text-sm"><thead><tr className="bg-slate-100"><th className="p-2">ID</th><th className="p-2 text-left">নাম</th><th className="p-2">শ্রেণি</th><th className="p-2">রোল</th><th className="p-2">ফোন</th><th className="p-2">অ্যাকশন</th></tr></thead>
        <tbody>{rows.map(s => <tr key={s.id} className="border-t"><td className="p-2">{s.id}</td><td className="p-2">{s.nameBangla}</td><td className="p-2">{s.className}</td><td className="p-2">{toBanglaDigits(s.roll)}</td><td className="p-2">{s.guardianPhone}</td>
          <td className="p-2 flex gap-1"><Btn color="slate" onClick={() => { setEditId(s.id); setForm(s); }}>এডিট</Btn><Btn color="red" onClick={() => { if (confirm('মুছবেন?')) update({ students: data.students.filter(x => x.id !== s.id) }); }}><Trash2 size={14} /></Btn></td></tr>)}</tbody></table></div>
    </Card>
  );
}

function TeacherCRUD() {
  const { data, update } = useDB();
  const [form, setForm] = useState({ nameBangla: '', designation: 'সহকারী উস্তায', phone: '', baseSalary: 20000 });
  return (
    <Card><h3 className="font-bold">শিক্ষক ব্যবস্থাপনা</h3>
      <div className="grid md:grid-cols-5 gap-2 mt-2">
        <input className={inputCls} placeholder="নাম*" value={form.nameBangla} onChange={e => setForm({ ...form, nameBangla: e.target.value })} />
        <input className={inputCls} placeholder="পদবি" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} />
        <input className={inputCls} placeholder="ফোন" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        <input type="number" className={inputCls} value={form.baseSalary} onChange={e => setForm({ ...form, baseSalary: Number(e.target.value) })} />
        <Btn color="green" onClick={() => {
          if (!form.nameBangla) return alert('নাম দিন');
          update({ teachers: [...data.teachers, { id: `T-${100 + data.teachers.length + 1}`, nameEnglish: '', qualification: '', email: '', joiningDate: todayISO(), assignedSubjectIds: [], assignedClassIds: [], status: 'active', bio: '', photoUrl: '', password: '1234', ...form }] }); setForm({ nameBangla: '', designation: 'সহকারী উস্তায', phone: '', baseSalary: 20000 });
        }}><Plus size={14} className="inline" /> যোগ</Btn>
      </div>
      <table className="w-full text-sm mt-2"><thead><tr className="bg-slate-100"><th className="p-2">ID</th><th className="p-2 text-left">নাম</th><th className="p-2">পদবি</th><th className="p-2">বেতন</th><th className="p-2">অবস্থা</th></tr></thead>
        <tbody>{data.teachers.map(t => <tr key={t.id} className="border-t"><td className="p-2">{t.id}</td><td className="p-2">{t.nameBangla}</td><td className="p-2">{t.designation}</td><td className="p-2">৳{toBanglaDigits(t.baseSalary)}</td><td className="p-2">{t.status}</td></tr>)}</tbody></table>
    </Card>
  );
}

function FeeTerminal() {
  const { data, update } = useDB();
  const [q, setQ] = useState('DA-2026-101');
  const [method, setMethod] = useState<'cash' | 'bkash' | 'nagad' | 'bank'>('cash');
  const [monthC, setMonthC] = useState(todayISO().slice(0, 7));
  const [last, setLast] = useState<string | null>(null);
  const st = data.students.find(s => s.id === q || String(s.roll) === q);
  const collect = () => {
    if (!st) return alert('শিক্ষার্থী পাওয়া যায়নি');
    const v = vouchNo('V');
    update({
      feePayments: [...data.feePayments, { id: uid('F'), studentId: st.id, studentName: st.nameBangla, classId: st.classId, className: st.className, voucherNumber: v, amountPaid: st.monthlyTuitionFee, paymentType: 'monthly_tuition', monthCovered: monthC, paymentDate: todayISO(), paymentMethod: method, receivedBy: 'অফিস', status: 'paid' }],
      transactions: [...data.transactions, { id: uid('TX'), date: todayISO(), type: 'income', category: 'Student Fees', amount: st.monthlyTuitionFee, title: `টিউশন ফি — ${st.nameBangla}`, description: `${st.id} • ${monthC}`, receiptVoucherNo: v, accountMethod: method }]
    });
    setLast(v);
  };
  const rec = last ? data.feePayments.find(f => f.voucherNumber === last) : null;
  return (
    <Card><h3 className="font-bold">⚡ কুইক ফি কালেকশন টার্মিনাল</h3>
      <div className="grid md:grid-cols-4 gap-2 mt-2">
        <Field label="রোল / ID"><input className={inputCls} value={q} onChange={e => setQ(e.target.value)} /></Field>
        <Field label="মাস"><input type="month" className={inputCls} value={monthC} onChange={e => setMonthC(e.target.value)} /></Field>
        <Field label="মাধ্যম"><select className={inputCls} value={method} onChange={e => setMethod(e.target.value as never)}><option value="cash">নগদ</option><option value="bkash">বিকাশ</option><option value="nagad">নগদ</option><option value="bank">ব্যাংক</option></select></Field>
        <div className="flex items-end"><Btn color="green" onClick={collect}>আদায় + ভাউচার</Btn></div>
      </div>
      {st && <div className="text-sm mt-1">শিক্ষার্থী: <b>{st.nameBangla}</b> • {st.className} • মাসিক ফি ৳{toBanglaDigits(st.monthlyTuitionFee)}</div>}
      {rec && <div className="mt-2 border rounded-2xl p-4 print-doc">
        <PrintHeader madrasa={data.madrasa} title="ফি ভাউচার (অফিস কপি + শিক্ষার্থী কপি)" subtitle={`ভাউচার: ${rec.voucherNumber}`} />
        <div className="grid grid-cols-2 gap-2 text-sm">
          {[0, 1].map(i => <div key={i} className="border p-2"><b>{i === 0 ? 'অফিস কপি' : 'শিক্ষার্থী কপি'}</b><br />{rec.studentName} ({rec.studentId})<br />মাস: {rec.monthCovered} • {rec.paymentMethod}<br /><b>৳{toBanglaDigits(rec.amountPaid)}</b> ({numberToBanglaWords(rec.amountPaid)})</div>)}
        </div><SigRow /><div className="no-print mt-2"><Btn onClick={printNow}>ডুপ্লিকেট প্রিন্ট</Btn></div>
      </div>}
    </Card>
  );
}

function Ledger() {
  const { data, update } = useDB();
  const [f, setF] = useState({ type: 'income', category: 'Student Fees', amount: 1000, title: '', method: 'cash' });
  const bal = data.transactions.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
  return (
    <Card><h3 className="font-bold">আয়-ব্যয় লেজার (ব্যালেন্স: ৳{toBanglaDigits(bal)})</h3>
      <div className="grid md:grid-cols-6 gap-2 mt-2">
        <select className={inputCls} value={f.type} onChange={e => setF({ ...f, type: e.target.value })}><option value="income">আয়</option><option value="expense">ব্যয়</option></select>
        <select className={inputCls} value={f.category} onChange={e => setF({ ...f, category: e.target.value })}><option>Student Fees</option><option>Mahfil Donations</option><option>Zakat/Lillah</option><option>Teacher Salaries</option><option>Kitchen/Mess</option><option>Utility Bills</option><option>Maintenance</option></select>
        <input type="number" className={inputCls} value={f.amount} onChange={e => setF({ ...f, amount: Number(e.target.value) })} />
        <input className={inputCls} placeholder="শিরোনাম" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
        <select className={inputCls} value={f.method} onChange={e => setF({ ...f, method: e.target.value })}><option value="cash">নগদ</option><option value="bkash">বিকাশ</option><option value="nagad">নগদ</option><option value="bank">ব্যাংক</option></select>
        <Btn color="green" onClick={() => { update({ transactions: [...data.transactions, { id: uid('TX'), date: todayISO(), type: f.type as never, category: f.category, amount: f.amount, title: f.title || f.category, description: '', receiptVoucherNo: vouchNo('V'), accountMethod: f.method }] }); }}>যোগ</Btn>
      </div>
      <div className="overflow-x-auto mt-2"><table className="w-full text-sm"><thead><tr className="bg-slate-100"><th className="p-2">তারিখ</th><th className="p-2 text-left">শিরোনাম</th><th className="p-2">খাত</th><th className="p-2">পরিমাণ</th></tr></thead>
        <tbody>{[...data.transactions].reverse().map(t => <tr key={t.id} className="border-t"><td className="p-2">{t.date}</td><td className="p-2">{t.title}</td><td className="p-2">{t.category}</td><td className={`p-2 font-bold ${t.type === 'income' ? 'text-green-700' : 'text-red-600'}`}>{t.type === 'income' ? '+' : '−'}৳{toBanglaDigits(t.amount)}</td></tr>)}</tbody></table></div>
    </Card>
  );
}

function Payroll() {
  const { data, update } = useDB();
  const [month, setMonth] = useState(todayISO().slice(0, 7));
  return (
    <Card><h3 className="font-bold">স্টাফ পে-রোল — {month}</h3>
      <input type="month" className={inputCls + ' mt-2 max-w-xs'} value={month} onChange={e => setMonth(e.target.value)} />
      <table className="w-full text-sm mt-2"><thead><tr className="bg-slate-100"><th className="p-2 text-left">শিক্ষক</th><th className="p-2">মূল</th><th className="p-2">নিট</th><th className="p-2">অবস্থা</th><th className="p-2">অ্যাকশন</th></tr></thead>
        <tbody>{data.teachers.map(t => {
          const rec = data.salaries.find(s => s.teacherId === t.id && s.month === month);
          const net = t.baseSalary + 3000;
          return <tr key={t.id} className="border-t"><td className="p-2">{t.nameBangla}</td><td className="p-2">৳{toBanglaDigits(t.baseSalary)}</td><td className="p-2">৳{toBanglaDigits(net)}</td><td className="p-2">{rec?.status ?? 'unpaid'}</td>
            <td className="p-2">{!rec || rec.status === 'unpaid' ? <Btn color="green" onClick={() => {
              update({ salaries: [...data.salaries.filter(s => !(s.teacherId === t.id && s.month === month)), { id: uid('SL'), teacherId: t.id, teacherName: t.nameBangla, month, basic: t.baseSalary, housing: 3000, deductions: 0, net, status: 'paid', paidDate: todayISO() }], transactions: [...data.transactions, { id: uid('TX'), date: todayISO(), type: 'expense', category: 'Teacher Salaries', amount: net, title: `বেতন — ${t.nameBangla}`, description: month, receiptVoucherNo: vouchNo('S'), accountMethod: 'bank' }] });
            }}>পরিশোধ</Btn> : '✅'}</td></tr>;
        })}</tbody></table></Card>
  );
}

function ClassBuilder() {
  const { data, update } = useDB();
  const [c, setC] = useState({ name: '', monthlyFee: 1000, institutionId: 'madrasa_main' });
  const [sub, setSub] = useState({ classId: '', subjectName: '', fullMarks: 100, isQ: true });
  return (
    <div className="space-y-3">
      <Card><h3 className="font-bold">নতুন শ্রেণি</h3>
        <div className="grid md:grid-cols-4 gap-2 mt-2">
          <input className={inputCls} placeholder="শ্রেণির নাম" value={c.name} onChange={e => setC({ ...c, name: e.target.value })} />
          <select className={inputCls} value={c.institutionId} onChange={e => setC({ ...c, institutionId: e.target.value })}>{data.institutions.map(i => <option key={i.id} value={i.id}>{i.nameBangla}</option>)}</select>
          <input type="number" className={inputCls} value={c.monthlyFee} onChange={e => setC({ ...c, monthlyFee: Number(e.target.value) })} />
          <Btn color="green" onClick={() => { if (!c.name) return alert('নাম দিন'); update({ classes: [...data.classes, { id: uid('C'), name: c.name, arabicName: '', code: c.name.slice(0, 4).toUpperCase(), institutionId: c.institutionId, section: 'ক', shift: 'সকাল', assignedTeacherName: '', monthlyFee: c.monthlyFee, subjects: [], periods: [] }] }); setC({ name: '', monthlyFee: 1000, institutionId: 'madrasa_main' }); }}>যোগ</Btn>
        </div></Card>
      <Card><h3 className="font-bold">কিতাব/বিষয় যোগ</h3>
        <div className="grid md:grid-cols-5 gap-2 mt-2">
          <select className={inputCls} value={sub.classId} onChange={e => setSub({ ...sub, classId: e.target.value })}><option value="">শ্রেণি</option>{data.classes.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
          <input className={inputCls} placeholder="বিষয়/কিতাব" value={sub.subjectName} onChange={e => setSub({ ...sub, subjectName: e.target.value })} />
          <input type="number" className={inputCls} value={sub.fullMarks} onChange={e => setSub({ ...sub, fullMarks: Number(e.target.value) })} />
          <label className="text-sm flex items-center gap-1"><input type="checkbox" checked={sub.isQ} onChange={e => setSub({ ...sub, isQ: e.target.checked })} /> কুরআনিক</label>
          <Btn color="green" onClick={() => { if (!sub.classId || !sub.subjectName) return alert('শ্রেণি+বিষয় দিন'); update({ classes: data.classes.map(x => x.id === sub.classId ? { ...x, subjects: [...x.subjects, { subjectName: sub.subjectName, arabicName: '', fullMarks: sub.fullMarks, passMarks: Math.round(sub.fullMarks * 0.4), isQuranicSubject: sub.isQ, kitabAuthor: '' }] } : x) }); setSub({ classId: '', subjectName: '', fullMarks: 100, isQ: true }); }}>যোগ</Btn>
        </div>
        {data.classes.map(x => <div key={x.id} className="text-sm mt-2 border rounded-xl p-2"><b>{x.name}</b> — {x.subjects.map(s => s.subjectName).join(', ')}<br /><span className="text-xs text-slate-500">পিরিয়ড: {x.periods.map(p => `${p.periodNumber}. ${p.subjectName} (${p.timeRange})`).join(' | ') || '—'}</span></div>)}
      </Card>
    </div>
  );
}

function ResultEngine() {
  const { data, update } = useDB();
  const [clsId, setClsId] = useState('c-hifz-1');
  const [exam, setExam] = useState('অর্ধ-বার্ষিক');
  const [entry, setEntry] = useState<Record<string, Record<string, number>>>({});
  const cls = data.classes.find(c => c.id === clsId);
  const roster = data.students.filter(s => s.classId === clsId);
  const existing = data.examResults.filter(r => r.classId === clsId && r.examName === exam);
  const finalize = () => {
    const built = roster.map(s => {
      const m: Record<string, { marksObtained: number; totalMarks: number; grade: string; gpa: number }> = {};
      (cls?.subjects ?? []).forEach(sub => {
        const obt = entry[s.id]?.[sub.subjectName] ?? 0;
        const g = gradeFor(sub.fullMarks ? obt / sub.fullMarks * 100 : 0);
        m[sub.subjectName] = { marksObtained: obt, totalMarks: sub.fullMarks, grade: g.grade, gpa: g.gpa };
      });
      const t = computeResultTotals(m);
      return { id: uid('R'), examName: exam, academicYear: '2026', studentId: s.id, studentName: s.nameBangla, classId: clsId, className: cls?.name ?? '', roll: s.roll, marks: m, ...t, meritPosition: 0, comments: '' };
    });
    const quranic = (cls?.subjects ?? []).filter(s => s.isQuranicSubject).map(s => s.subjectName);
    const ranked = assignMerit(built as never, quranic, sid => attendanceRateFor(data.attendances, sid), sid => data.students.find(s => s.id === sid)?.dob ?? '');
    update({ examResults: [...data.examResults.filter(r => !(r.classId === clsId && r.examName === exam)), ...ranked] });
    alert('ট্যাবুলেশন সম্পন্ন + মেধা নির্ধারিত!');
  };
  return (
    <div className="space-y-3">
      <Card><h3 className="font-bold">ফলাফল এন্ট্রি ও ট্যাবুলেশন ইঞ্জিন</h3>
        <div className="grid md:grid-cols-3 gap-2 mt-2">
          <select className={inputCls} value={clsId} onChange={e => setClsId(e.target.value)}>{data.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <select className={inputCls} value={exam} onChange={e => setExam(e.target.value)}><option>১ম সাময়িক</option><option>অর্ধ-বার্ষিক</option><option>বার্ষিক পরীক্ষা</option></select>
          <Btn color="green" onClick={finalize}>সংরক্ষণ + মেধা গণনা</Btn>
        </div>
        <div className="overflow-x-auto mt-2"><table className="w-full text-sm"><thead><tr className="bg-slate-100"><th className="p-2">রোল/নাম</th>{(cls?.subjects ?? []).map(s => <th key={s.subjectName} className="p-2">{s.subjectName} ({toBanglaDigits(s.fullMarks)})</th>)}</tr></thead>
          <tbody>{roster.map(s => <tr key={s.id} className="border-t"><td className="p-2">{toBanglaDigits(s.roll)} {s.nameBangla}</td>{(cls?.subjects ?? []).map(sub => <td key={sub.subjectName} className="p-1"><input type="number" className={inputCls} value={entry[s.id]?.[sub.subjectName] ?? ''} onChange={e => setEntry({ ...entry, [s.id]: { ...entry[s.id], [sub.subjectName]: Number(e.target.value) } })} /></td>)}</tr>)}</tbody></table></div>
      </Card>
      {!!existing.length && (
        <Card><div className="print-doc print-landscape">
          <PrintHeader madrasa={data.madrasa} title={`ট্যাবুলেশন শিট — ${exam}`} subtitle={`${cls?.name} • A4 ল্যান্ডস্কেপ`} />
          <table><thead><tr><th>মেধা</th><th>রোল</th><th>নাম</th>{(cls?.subjects ?? []).map(s => <th key={s.subjectName}>{s.subjectName}</th>)}<th>মোট</th><th>%</th><th>গ্রেড</th></tr></thead>
            <tbody>{[...existing].sort((a, b) => a.meritPosition - b.meritPosition).map(r => <tr key={r.id}><td>{toBanglaDigits(r.meritPosition)}</td><td>{toBanglaDigits(r.roll)}</td><td>{r.studentName}</td>{(cls?.subjects ?? []).map(s => <td key={s.subjectName}>{toBanglaDigits(r.marks[s.subjectName]?.marksObtained ?? 0)}</td>)}<td><b>{toBanglaDigits(r.totalObtained)}</b></td><td>{r.percentage}%</td><td>{r.grade}</td></tr>)}</tbody></table>
          <SigRow /></div>
          <div className="no-print mt-2 flex gap-2"><Btn onClick={printNow}>A4 প্রিন্ট</Btn><Btn color="slate" onClick={() => downloadFile('tabulation.csv', toCSV(existing.map(r => ({ merit: r.meritPosition, roll: r.roll, name: r.studentName, total: r.totalObtained, grade: r.grade }))))}>CSV</Btn></div>
        </Card>
      )}
    </div>
  );
}

function AdmissionTriage() {
  const { data, update } = useDB();
  return (
    <Card><h3 className="font-bold">ভর্তি যাচাই ({toBanglaDigits(data.applications.length)})</h3>
      <div className="space-y-2 mt-2">{data.applications.map(a => (
        <div key={a.id} className="border rounded-xl p-2 text-sm"><b>{a.applicationNumber}</b> • {a.applicantNameBangla} • {a.desiredClass} • {a.guardianPhone} • Trx: {a.transactionId} • <b>{a.status}</b>
          <div className="flex gap-1 mt-1">
            <Btn color="slate" onClick={() => update({ applications: data.applications.map(x => x.id === a.id ? { ...x, status: 'verified' } : x) })}>যাচাই</Btn>
            <Btn color="green" onClick={() => {
              const n = data.students.length + 101;
              const c = data.classes.find(x => x.name === a.desiredClass);
              update({ applications: data.applications.map(x => x.id === a.id ? { ...x, status: 'accepted' } : x), students: [...data.students, { id: `DA-2026-${n}`, roll: data.students.filter(s => s.classId === c?.id).length + 1, nameBangla: a.applicantNameBangla, nameEnglish: a.applicantNameEnglish, institutionId: a.institutionId, classId: c?.id ?? data.classes[0].id, className: c?.name ?? data.classes[0].name, fatherName: a.fatherName, motherName: a.motherName, guardianPhone: a.guardianPhone, address: a.presentAddress, dob: '2015-01-01', bloodGroup: 'O+', admissionDate: todayISO(), residentialStatus: 'non-residential', monthlyTuitionFee: c?.monthlyFee ?? 1000, status: 'active', password: '1234' }] });
            }}>ভর্তি করুন (রোল অটো)</Btn>
            <Btn color="red" onClick={() => update({ applications: data.applications.map(x => x.id === a.id ? { ...x, status: 'rejected' } : x) })}>বাতিল</Btn>
          </div></div>
      ))}{!data.applications.length && <p className="text-sm">কোনো আবেদন নেই।</p>}</div></Card>
  );
}

function SmsPanel() {
  const { data } = useDB();
  const [tpl, setTpl] = useState('প্রিয় অভিভাবক, আপনার সন্তান আজ অনুপস্থিত। — কর্তৃপক্ষ');
  const len = [...tpl].length;
  return (
    <Card><h3 className="font-bold">📩 SMS গেটওয়ে (সিমুলেটর)</h3>
      <div className="grid md:grid-cols-2 gap-2 mt-2">
        <Field label="টেমপ্লেট"><textarea className={inputCls} rows={4} value={tpl} onChange={e => setTpl(e.target.value)} /></Field>
        <div className="text-sm">অক্ষর: <b>{toBanglaDigits(len)}</b> • SMS সংখ্যা: <b>{toBanglaDigits(Math.max(1, Math.ceil(len / 160)))}</b> • প্রাপক: সকল অভিভাবক ({toBanglaDigits(data.students.length)})<br />
          <div className="flex gap-2 mt-2"><Btn color="green" onClick={() => alert(`✅ ${toBanglaDigits(data.students.length)}টি SMS কিউতে পাঠানো হয়েছে (সিমুলেটেড)`)}>পাঠান</Btn><Btn color="slate" onClick={() => setTpl('প্রিয় অভিভাবক, মাসিক ফি বকেয়া রয়েছে। অনুগ্রহ করে পরিশোধ করুন। — হিসাব শাখা')}>ফি রিমাইন্ডার</Btn><Btn color="slate" onClick={() => setTpl('জরুরি: আবহাওয়ার কারণে আগামীকাল মাদরাসা বন্ধ থাকবে।')}>জরুরি/ছুটি</Btn></div></div>
      </div></Card>
  );
}

function Settings() {
  const { data, update } = useDB();
  const [m, setM] = useState(data.madrasa);
  const [pt, setPt] = useState(data.prayerTimes);
  const [notice, setNotice] = useState({ title: '', content: '', category: 'academic' as never });
  return (
    <div className="space-y-3">
      <Card><h3 className="font-bold">প্রতিষ্ঠান তথ্য</h3>
        <div className="grid md:grid-cols-3 gap-2 mt-2">
          <Field label="নাম (বাংলা)"><input className={inputCls} value={m.nameBangla} onChange={e => setM({ ...m, nameBangla: e.target.value })} /></Field>
          <Field label="EIIN"><input className={inputCls} value={m.eiin} onChange={e => setM({ ...m, eiin: e.target.value })} /></Field>
          <Field label="হটলাইন"><input className={inputCls} value={m.hotline} onChange={e => setM({ ...m, hotline: e.target.value })} /></Field>
          <Field label="অভিভাবক সহায়তা"><input className={inputCls} value={m.guardianSupport} onChange={e => setM({ ...m, guardianSupport: e.target.value })} /></Field>
          <Field label="ইমেইল"><input className={inputCls} value={m.email} onChange={e => setM({ ...m, email: e.target.value })} /></Field>
          <Field label="মুহতামিম"><input className={inputCls} value={m.principalName} onChange={e => setM({ ...m, principalName: e.target.value })} /></Field>
        </div>
        <div className="mt-2"><Btn color="green" onClick={() => { update({ madrasa: m }); alert('সংরক্ষিত!'); }}>সংরক্ষণ</Btn></div></Card>
      <Card><h3 className="font-bold">নামাজের সময়</h3>
        <div className="grid md:grid-cols-3 gap-2 mt-2">{Object.entries(pt).map(([k, v]) => <Field key={k} label={k}><input className={inputCls} value={v} onChange={e => setPt({ ...pt, [k]: e.target.value })} /></Field>)}</div>
        <div className="mt-2"><Btn color="green" onClick={() => { update({ prayerTimes: pt }); alert('সংরক্ষিত!'); }}>সংরক্ষণ</Btn></div></Card>
      <Card><h3 className="font-bold">নতুন নোটিশ</h3>
        <div className="grid md:grid-cols-3 gap-2 mt-2">
          <input className={inputCls} placeholder="শিরোনাম" value={notice.title} onChange={e => setNotice({ ...notice, title: e.target.value })} />
          <select className={inputCls} value={notice.category} onChange={e => setNotice({ ...notice, category: e.target.value as never })}><option value="academic">একাডেমিক</option><option value="exam">পরীক্ষা</option><option value="holiday">ছুটি</option><option value="urgency">জরুরি</option></select>
          <Btn color="green" onClick={() => { if (!notice.title) return alert('শিরোনাম দিন'); update({ notices: [...data.notices, { id: uid('N'), title: notice.title, publishDate: todayISO(), category: notice.category, targetAudience: 'all', content: notice.content || notice.title, attachmentUrl: '' }] }); setNotice({ title: '', content: '', category: 'academic' as never }); }}>প্রকাশ</Btn>
        </div>
        <input className={inputCls + ' mt-2'} placeholder="বিস্তারিত" value={notice.content} onChange={e => setNotice({ ...notice, content: e.target.value })} /></Card>
    </div>
  );
}

// keep tree-shaken export used above
export const __x = { useMemo };
