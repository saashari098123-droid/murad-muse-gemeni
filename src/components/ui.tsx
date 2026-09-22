import React from 'react';

export const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-5 ${className}`}>{children}</div>
);
export const Btn = ({ children, onClick, color = 'navy', className = '', type = 'button' }: any) => {
  const map: Record<string, string> = {
    navy: 'bg-[#1e3a8a] hover:bg-[#172c6b] text-white',
    green: 'bg-[#065f46] hover:bg-[#04402f] text-white',
    gold: 'bg-[#f59e0b] hover:bg-[#d97706] text-white',
    slate: 'bg-slate-200 hover:bg-slate-300 text-slate-800',
    red: 'bg-red-600 hover:bg-red-700 text-white',
    outline: 'border border-slate-300 hover:bg-slate-100 text-slate-700',
  };
  return <button type={type} onClick={onClick} className={`px-3 py-2 rounded-xl text-sm font-semibold transition ${map[color]} ${className}`}>{children}</button>;
};
export const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block text-sm">
    <span className="font-semibold text-slate-700">{label}</span>
    <div className="mt-1">{children}</div>
  </label>
);
export const inputCls = 'w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]';
export const Tile = ({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) => (
  <div className="bg-white rounded-2xl border p-4 flex items-center gap-3">
    <div className="p-2.5 rounded-xl bg-emerald-50 text-[#065f46]">{icon}</div>
    <div><div className="text-xs text-slate-500">{label}</div><div className="text-xl font-bold">{value}</div>{sub && <div className="text-xs text-slate-400">{sub}</div>}</div>
  </div>
);
export function PrintHeader({ madrasa, title, subtitle }: any) {
  return (
    <div className="text-center border-b-2 border-black pb-2 mb-3">
      <div className="font-arabic text-lg">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
      <h1 className="text-xl font-bold">{madrasa.nameBangla}</h1>
      <div className="text-sm">{madrasa.nameEnglish} | EIIN: {madrasa.eiin}</div>
      <div className="text-xs">{madrasa.address} | {madrasa.hotline}</div>
      <h2 className="mt-1 font-bold underline">{title}</h2>
      {subtitle && <div className="text-xs">{subtitle}</div>}
    </div>
  );
}
export function SigRow() {
  return (
    <div className="flex justify-between mt-8 text-sm">
      <div className="text-center"><div className="border-t border-black px-8 pt-1">অভিভাবকের স্বাক্ষর</div></div>
      <div className="text-center"><div className="w-28 h-16 seal-box mx-auto flex items-center justify-center text-[10px] text-slate-500">অফিসিয়াল সিল</div></div>
      <div className="text-center"><div className="border-t border-black px-8 pt-1">মুহতামিমের স্বাক্ষর</div></div>
    </div>
  );
}
export function printNow() { window.print(); }
