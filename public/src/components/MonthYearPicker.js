// MONTHS_FULL global
function MonthYearPicker({ value, onChange }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 8 }, (_, i) => currentYear - 3 + i);
  const [y, m] = value;
  return (
    <div className="grid grid-cols-2 gap-2">
      <select value={m} onChange={(e) => onChange([y, Number(e.target.value)])} className="w-full rounded-lg border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
        {MONTHS_FULL.map((label, idx) => <option key={label} value={idx}>{label}</option>)}
      </select>
      <select value={y} onChange={(e) => onChange([Number(e.target.value), m])} className="w-full rounded-lg border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
        {years.map((yy) => <option key={yy} value={yy}>{yy}</option>)}
      </select>
    </div>
  );
}
window.MonthYearPicker = MonthYearPicker;
