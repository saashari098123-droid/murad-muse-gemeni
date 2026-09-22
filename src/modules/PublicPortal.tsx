import { useMemo, useState } from 'react';
import { Bell, BookOpen, Building2, FileCheck, GraduationCap, Home, Images, Landmark, MoonStar, Phone, Search } from 'lucide-react';
import { useDB } from '../store/DataContext';
import { hijriToday, toBanglaDigits, uid, todayISO, downloadFile, toCSV } from '../utils/logic';
import { Btn, Card, Field, PrintHeader, SigRow, inputCls, printNow } from '../components/ui';

export default function PublicPortal({ onLogin }: { onLogin: (r: 'student' | 'teacher' | 'admin') => void }) {
  const { data, update } = useDB();
  const [tab, setTab] = useState('home');
  const [admission, setAdmission] = useState({ nameBn: '', nameEn: '', father: '', mother: '', phone: '', prev: '', dClass: 'হিফজ ১ম বর্ষ', address: '', payMethod: 'বিকাশ', trx: '', inst: 'madrasa_main' });
  const [step, setStep] = useState(0);
  const [slip, setSlip] = useState<string | null>(null);
  const [verify, setVerify] = useState({ year: '2026', classId: 'c-hifz-1', roll: 1 });
  const [noticeQ, setNoticeQ] = useState('');

  const verifyResult = useMemo(() =>
    data.examResults.find(r => r.academicYear === verify.year && r.classId === verify.classId && r.roll === Number(verify.roll)),
    [data, verify]);

  const submitAdmission = () => {
    if (!admission.nameBn || !admission.phone || !admission.trx) { alert('নাম, মোবাইল ও ট্রানজেকশন আইডি আবশ্যক'); return; }
    const appNo = `ADM-2026-${String(data.applications.length + 1).padStart(4, '0')}`;
    update({ applications: [...data.applications, { id: uid('APP'), applicationNumber: appNo, institutionId: admission.inst, applicantNameBangla: admission.nameBn, applicantNameEnglish: admission.nameEn, fatherName: admission.father, motherName: admission.mother, guardianPhone: admission.phone, previousInstitute: admission.prev, desiredClass: admission.dClass, presentAddress: admission.address, paymentMethod: admission.payMethod, transactionId: admission.trx, status: 'pending', appliedAt: todayISO() }] });
    setSlip(appNo); setStep(0);
  };

  const tabs = [
    { id: 'home', label: 'হোম', icon: <Home size={16} /> },
    { id: 'about', label: 'পরিচিতি', icon: <Landmark size={16} /> },
    { id: 'dept', label: 'বিভাগসমূহ', icon: <Building2 size={16} /> },
    { id: 'admission', label: 'ভর্তি', icon: <FileCheck size={16} /> },
    { id: 'result', label: 'ফল যাচাই', icon: <GraduationCap size={16} /> },
    { id: 'notices', label: 'নোটিশ', icon: <Bell size={16} /> },
    { id: 'gallery', label: 'গ্যালারি', icon: <Images size={16} /> },
  ];

  return (
    <div>
      {/* Banner */}
      <div className="bg-[#1e3a8a] text-white px-4 py-2 text-sm flex flex-wrap gap-3 items-center justify-between no-print">
        <span>🌙 {hijriToday()} | <span className="font-arabic">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span></span>
        <span className="flex items-center gap-2"><MoonStar size={14} /> ফজর {data.prayerTimes.Fajr} • মাগরিব {data.prayerTimes.Maghrib}</span>
      </div>
      <div className="bg-[#065f46] text-white overflow-hidden whitespace-nowrap text-sm py-1.5 no-print">
        <div className="notice-marquee inline-block px-4">📢 {data.notices.map(n => n.title).join('  •  ')}</div>
      </div>

      <div className="max-w-6xl mx-auto px-3 py-4">
        <div className="flex flex-wrap gap-2 mb-4 no-print">
          {tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold ${tab === t.id ? 'bg-[#1e3a8a] text-white' : 'bg-white border'}`}>{t.icon}{t.label}</button>)}
          <div className="ml-auto flex gap-2">
            <Btn color="green" onClick={() => onLogin('student')}>ছাত্র লগইন</Btn>
            <Btn color="gold" onClick={() => onLogin('teacher')}>উস্তায লগইন</Btn>
            <Btn color="slate" onClick={() => onLogin('admin')}>অ্যাডমিন</Btn>
          </div>
        </div>

        {tab === 'home' && (
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="md:col-span-2 bg-gradient-to-br from-[#1e3a8a] to-[#065f46] text-white border-0">
              <div className="font-arabic text-2xl">{data.madrasa.nameArabic}</div>
              <h1 className="text-2xl md:text-3xl font-bold">{data.madrasa.nameBangla}</h1>
              <p className="text-white/80 text-sm">{data.madrasa.nameEnglish} • EIIN: {data.madrasa.eiin}</p>
              <p className="mt-2 text-sm">{data.madrasa.welcomeMessage}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Btn color="gold" onClick={() => setTab('admission')}>অনলাইন ভর্তি</Btn>
                <Btn color="green" onClick={() => setTab('result')}>ফল যাচাই</Btn>
                <Btn color="outline" className="bg-white" onClick={() => setTab('notices')}>নোটিশ বোর্ড</Btn>
              </div>
            </Card>
            <Card>
              <h3 className="font-bold flex items-center gap-2"><MoonStar size={16} /> আজকের নামাজের সময়</h3>
              <div className="mt-2 space-y-1 text-sm">
                {Object.entries(data.prayerTimes).map(([k, v]) => <div key={k} className="flex justify-between border-b py-1"><span>{k}</span><b>{v}</b></div>)}
              </div>
            </Card>
            <Card className="md:col-span-2">
              <h3 className="font-bold">মুহতামিমের বাণী</h3>
              <p className="text-sm mt-1"><b>{data.madrasa.principalName}</b> ({data.madrasa.principalDesignation}) — {data.madrasa.welcomeMessage}</p>
              <p className="text-sm mt-2 text-slate-600">{data.madrasa.mission} {data.madrasa.vision}</p>
            </Card>
            <Card>
              <h3 className="font-bold flex items-center gap-2"><Bell size={16} /> সর্বশেষ নোটিশ</h3>
              <div className="mt-2 space-y-2">{data.notices.slice(0, 3).map(n => <div key={n.id} className="text-sm border rounded-xl p-2"><b>{n.title}</b><div className="text-xs text-slate-500">{n.publishDate} • {n.category}</div></div>)}</div>
            </Card>
          </div>
        )}

        {tab === 'about' && (
          <Card>
            <h2 className="text-xl font-bold">প্রতিষ্ঠানের ইতিহাস</h2>
            <p className="text-sm mt-2">{data.madrasa.history}</p>
            <h3 className="font-bold mt-3">শিক্ষা পদ্ধতি</h3>
            <p className="text-sm">দরসে নিজামী / মাদানী নেসাব + জাতীয় কারিকুলাম (NCTB) সমন্বিত পাঠদান। নূরানী, তাহফীজুল কুরআন, কিতাব-আলিম, দাওরায়ে হাদিস, ইফতা ও জেনারেল বিভাগ।</p>
            <h3 className="font-bold mt-3">যোগাযোগ</h3>
            <p className="text-sm flex items-center gap-2"><Phone size={14} /> {data.madrasa.hotline} | {data.madrasa.guardianSupport} | {data.madrasa.email}</p>
            <p className="text-sm">{data.madrasa.address}</p>
            <p className="text-sm mt-1">💳 {data.madrasa.bankAccounts}</p>
          </Card>
        )}

        {tab === 'dept' && (
          <div className="grid md:grid-cols-2 gap-4">
            {data.institutions.map(i => (
              <Card key={i.id}>
                <h3 className="font-bold">{i.nameBangla} <span className="text-xs text-slate-500">({i.nameEnglish})</span></h3>
                <div className="text-xs mt-1">লক্ষ্য শ্রেণি: {i.targetGrades.join(', ')} • {i.gender}</div>
                <div className="text-sm mt-1">ভর্তি ফি: ৳{toBanglaDigits(i.admissionFee)} | মাসিক: ৳{toBanglaDigits(i.monthlyTuitionFee)}</div>
                <div className="text-xs mt-1">প্রধান: {i.headName}</div>
                <ul className="text-xs list-disc ml-5 mt-1">{i.features.map((f, ix) => <li key={ix}>{f}</li>)}</ul>
                <div className="mt-2"><Btn color="green" onClick={() => { setAdmission(a => ({ ...a, inst: i.id })); setTab('admission'); }}>এই বিভাগে আবেদন</Btn></div>
              </Card>
            ))}
          </div>
        )}

        {tab === 'admission' && (
          <Card>
            <h2 className="font-bold text-lg">অনলাইন ভর্তি ফরম (৪ ধাপ)</h2>
            <div className="flex gap-2 mt-2 text-xs">{['মৌলিক তথ্য', 'অভিভাবক', 'বিভাগ', 'ফি নিশ্চিত'].map((s, i) => <span key={i} className={`px-2 py-1 rounded-full ${step === i ? 'bg-[#1e3a8a] text-white' : 'bg-slate-100'}`}>{toBanglaDigits(i + 1)}. {s}</span>)}</div>
            <div className="grid md:grid-cols-2 gap-3 mt-3">
              {step === 0 && (<>
                <Field label="আবেদনকারীর নাম (বাংলা)*"><input className={inputCls} value={admission.nameBn} onChange={e => setAdmission({ ...admission, nameBn: e.target.value })} /></Field>
                <Field label="Name (English)"><input className={inputCls} value={admission.nameEn} onChange={e => setAdmission({ ...admission, nameEn: e.target.value })} /></Field>
                <Field label="পূর্ব প্রতিষ্ঠান"><input className={inputCls} value={admission.prev} onChange={e => setAdmission({ ...admission, prev: e.target.value })} /></Field>
                <Field label="বর্তমান ঠিকানা"><input className={inputCls} value={admission.address} onChange={e => setAdmission({ ...admission, address: e.target.value })} /></Field>
              </>)}
              {step === 1 && (<>
                <Field label="পিতার নাম"><input className={inputCls} value={admission.father} onChange={e => setAdmission({ ...admission, father: e.target.value })} /></Field>
                <Field label="মাতার নাম"><input className={inputCls} value={admission.mother} onChange={e => setAdmission({ ...admission, mother: e.target.value })} /></Field>
                <Field label="অভিভাবক মোবাইল*"><input className={inputCls} value={admission.phone} onChange={e => setAdmission({ ...admission, phone: e.target.value })} /></Field>
              </>)}
              {step === 2 && (<>
                <Field label="ক্যাম্পাস"><select className={inputCls} value={admission.inst} onChange={e => setAdmission({ ...admission, inst: e.target.value })}>{data.institutions.map(i => <option key={i.id} value={i.id}>{i.nameBangla}</option>)}</select></Field>
                <Field label="কাঙ্ক্ষিত শ্রেণি"><select className={inputCls} value={admission.dClass} onChange={e => setAdmission({ ...admission, dClass: e.target.value })}>{data.classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></Field>
              </>)}
              {step === 3 && (<>
                <Field label="পেমেন্ট মাধ্যম"><select className={inputCls} value={admission.payMethod} onChange={e => setAdmission({ ...admission, payMethod: e.target.value })}><option>বিকাশ</option><option>নগদ</option><option>রকেট</option><option>ব্যাংক</option></select></Field>
                <Field label="Transaction ID*"><input className={inputCls} value={admission.trx} onChange={e => setAdmission({ ...admission, trx: e.target.value })} /></Field>
                <div className="text-xs md:col-span-2 bg-amber-50 border p-2 rounded-xl">💳 {data.madrasa.bankAccounts}</div>
              </>)}
            </div>
            <div className="flex gap-2 mt-3">
              {step > 0 && <Btn color="slate" onClick={() => setStep(step - 1)}>পেছনে</Btn>}
              {step < 3 ? <Btn onClick={() => setStep(step + 1)}>পরবর্তী</Btn> : <Btn color="green" onClick={submitAdmission}>আবেদন জমা দিন</Btn>}
            </div>
            {slip && (
              <div className="mt-4 print-doc border rounded-2xl p-4">
                <PrintHeader madrasa={data.madrasa} title="ভর্তি আবেদন স্লিপ" subtitle={`সিরিয়াল: ${slip}`} />
                <div className="text-sm">নাম: {admission.nameBn} | শ্রেণি: {admission.dClass} | মোবাইল: {admission.phone} | TrxID: {admission.trx}</div>
                <SigRow />
                <div className="no-print mt-3"><Btn onClick={printNow}>স্লিপ প্রিন্ট</Btn></div>
              </div>
            )}
          </Card>
        )}

        {tab === 'result' && (
          <Card>
            <h2 className="font-bold flex items-center gap-2"><Search size={16} /> ফলাফল যাচাই</h2>
            <div className="grid md:grid-cols-4 gap-2 mt-2">
              <Field label="শিক্ষাবর্ষ"><input className={inputCls} value={verify.year} onChange={e => setVerify({ ...verify, year: e.target.value })} /></Field>
              <Field label="শ্রেণি"><select className={inputCls} value={verify.classId} onChange={e => setVerify({ ...verify, classId: e.target.value })}>{data.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
              <Field label="রোল"><input type="number" className={inputCls} value={verify.roll} onChange={e => setVerify({ ...verify, roll: Number(e.target.value) })} /></Field>
            </div>
            {verifyResult ? (
              <div className="mt-3 print-doc border rounded-2xl p-4">
                <PrintHeader madrasa={data.madrasa} title={`${verifyResult.examName} — ডিজিটাল মার্কশিট`} subtitle={`${verifyResult.className} • রোল ${toBanglaDigits(verifyResult.roll)}`} />
                <div className="text-sm">নাম: <b>{verifyResult.studentName}</b> ({verifyResult.studentId}) | মোট: <b>{toBanglaDigits(verifyResult.totalObtained)}</b> | শতকরা: {verifyResult.percentage}% | গ্রেড: {verifyResult.grade} | মেধা: {toBanglaDigits(verifyResult.meritPosition)}</div>
                <table className="mt-2"><thead><tr><th>বিষয়</th><th>প্রাপ্ত</th><th>মোট</th><th>গ্রেড</th></tr></thead>
                  <tbody>{Object.entries(verifyResult.marks).map(([s, m]) => <tr key={s}><td>{s}</td><td>{toBanglaDigits(m.marksObtained)}</td><td>{toBanglaDigits(m.totalMarks)}</td><td>{m.grade}</td></tr>)}</tbody></table>
                <SigRow />
                <div className="no-print mt-2 flex gap-2"><Btn onClick={printNow}>প্রিন্ট</Btn><Btn color="slate" onClick={() => downloadFile('marksheet.csv', toCSV(Object.entries(verifyResult.marks).map(([s, m]) => ({ subject: s, ...m }))))}>CSV ডাউনলোড</Btn></div>
              </div>
            ) : <p className="text-sm text-red-600 mt-2">কোনো ফলাফল পাওয়া যায়নি।</p>}
          </Card>
        )}

        {tab === 'notices' && (
          <Card>
            <h2 className="font-bold">নোটিশ বোর্ড</h2>
            <input className={inputCls + ' mt-2'} placeholder="খুঁজুন…" value={noticeQ} onChange={e => setNoticeQ(e.target.value)} />
            <div className="grid md:grid-cols-2 gap-2 mt-2">
              {data.notices.filter(n => n.title.includes(noticeQ) || n.content.includes(noticeQ)).map(n => (
                <div key={n.id} className="border rounded-xl p-3 text-sm"><b>{n.title}</b><div className="text-xs text-slate-500">{n.publishDate} • {n.category} • {n.targetAudience}</div><p className="mt-1">{n.content}</p></div>
              ))}
            </div>
          </Card>
        )}

        {tab === 'gallery' && (
          <div className="grid md:grid-cols-4 gap-3">
            {['বার্ষিক মাহফিল', 'দস্তারবন্দী / পাগড়ি বিতরণ', 'ক্বিরাত প্রতিযোগিতা', 'ক্রীড়া দিবস'].map((g, i) => (
              <Card key={i}><div className="h-28 rounded-xl bg-gradient-to-br from-emerald-100 to-amber-100 flex items-center justify-center text-4xl">🕌</div><b className="text-sm">{g}</b><div className="text-xs text-slate-500">ছবি সংখ্যা: {toBanglaDigits(12 + i * 5)}</div></Card>
            ))}
          </div>
        )}

        <div className="text-center text-xs text-slate-500 mt-6 no-print">
          <BookOpen size={14} className="inline" /> {data.madrasa.nameBangla} • হটলাইন {data.madrasa.hotline} • {data.madrasa.email}
        </div>
      </div>
    </div>
  );
}
