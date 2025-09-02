// MONTHS_FULL, monFirstIndex, startOfMonth, isToday are global
function MiniCalendar({ monthStart, days, allDoneDays }) {
  const first = startOfMonth(monthStart);
  const startIdx = monFirstIndex(first);
  const cells = [];
  for (let i = 0; i < startIdx; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(new Date(first.getFullYear(), first.getMonth(), d));
  while (cells.length % 7 !== 0) cells.push(null);
  return (
    <div className="rounded-xl bg-white dark:bg-slate-800 p-4 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="mb-3 text-center text-lg font-semibold tracking-wide">{MONTHS_FULL[first.getMonth()]} {first.getFullYear()}</div>
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium uppercase text-slate-400 dark:text-slate-500">{"M T W T F S S".split(" ").map((l, i) => <div key={i}>{l}</div>)}</div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          const done = d && allDoneDays.has(d.getDate());
          const isTod = d && isToday(d);
          return (
            <div key={i} className="flex items-center justify-center h-9">
              {d ? (
                <div className={["flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors", done ? "bg-primary-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300", isTod ? "ring-2 ring-primary-500 ring-offset-1 dark:ring-offset-slate-800" : ""].join(" ")}>{d.getDate()}</div>
              ) : <div className="h-8 w-8" />}
            </div>
          )
        })}
      </div>
    </div>
  );
}
window.MiniCalendar = MiniCalendar;
