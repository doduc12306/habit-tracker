// MONTHS_FULL, monFirstIndex, startOfMonth, isToday are global
function MiniCalendar({ monthStart, days, allDoneDays }) {
  const first = startOfMonth(monthStart);
  const startIdx = monFirstIndex(first);
  const cells = [];
  for (let i = 0; i < startIdx; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(new Date(first.getFullYear(), first.getMonth(), d));
  while (cells.length % 7 !== 0) cells.push(null);
  return (
    <div className="rounded-xl bg-white/90 dark:bg-slate-800/80 backdrop-blur p-4 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200/70 dark:border-slate-700/60">
      <div className="mb-3 text-center text-lg font-semibold tracking-wide bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 bg-clip-text text-transparent">{MONTHS_FULL[first.getMonth()]} {first.getFullYear()}</div>
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium uppercase text-slate-400 dark:text-slate-500">{"M T W T F S S".split(" ").map((l, i) => <div key={i}>{l}</div>)}</div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          const done = d && allDoneDays.has(d.getDate());
          const isTod = d && isToday(d);
          return (
            <div key={i} className="flex items-center justify-center h-9">
              {d ? (
                <div className={["flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all", done ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow" : "bg-slate-100/80 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300", isTod ? "ring-2 ring-offset-1 ring-primary-500 dark:ring-offset-slate-800" : ""].join(" ")}>{d.getDate()}</div>
              ) : <div className="h-8 w-8" />}
            </div>
          )
        })}
      </div>
    </div>
  );
}
window.MiniCalendar = MiniCalendar;
