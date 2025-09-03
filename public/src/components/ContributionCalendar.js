function ContributionCalendar({ habits, checks, year, onYearChange }) {
  const cellSize = 12; // Keep cell size fixed for a compact view
  const today = new Date();
  const currentYear = today.getFullYear();
  // Navigation handlers
  const decYear = () => onYearChange && onYearChange(year - 1);
  const incYear = () => onYearChange && onYearChange(year + 1);
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31);
  // Align to Monday (like other parts of app)
  const startIdx = (startOfYear.getDay() + 6) % 7; // 0=Mon
  const gridStart = new Date(startOfYear);
  gridStart.setDate(startOfYear.getDate() - startIdx);
  const weeks = [];
  let cur = new Date(gridStart);
  while (cur <= endOfYear || weeks.length < 53) { // ensure full grid
    weeks.push(new Date(cur));
    cur.setDate(cur.getDate() + 7);
    if (weeks.length > 60) break; // safety
  }
  // Precompute intensity per day
  function dayKey(d) { return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; }
  const dayData = new Map();
  const totalHabits = habits.length;
  weeks.forEach(w => {
    for (let i=0;i<7;i++) {
      const d = new Date(w); d.setDate(w.getDate()+i);
      if (d < startOfYear || d > endOfYear) continue;
      const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
      const monthChecks = checks[monthKey] || {};
      let active=0, done=0;
      for (const h of habits) {
        if (isActiveOnDate(h, d)) {
          active++;
          if (monthChecks[h.id]?.[d.getDate()]) done++;
        }
      }
      const ratio = active===0? null : done/active; // null means no active habits that day
      dayData.set(dayKey(d), { date:d, active, done, ratio });
    }
  });
  // Color scale (GitHub style 5 levels)
  function level(r) {
    if (r === null) return 'bg-slate-800/10 dark:bg-slate-700/10 border-slate-600/10';
    if (r === 0) return 'bg-slate-800/40 dark:bg-slate-800 border-slate-600/40';
    if (r < .25) return 'bg-emerald-900/60 border-emerald-800/60';
    if (r < .5) return 'bg-emerald-700 border-emerald-600';
    if (r < .75) return 'bg-emerald-500 border-emerald-500';
    return 'bg-emerald-400 border-emerald-400';
  }
  // Month labels: pick first week column where month starts
  const monthLabels = [];
  for (let m=0;m<12;m++) {
    const firstDay = new Date(year, m, 1);
    // find week index containing this day
    const idx = weeks.findIndex(w => firstDay >= w && firstDay < (new Date(w.getFullYear(), w.getMonth(), w.getDate()+7)));
    if (idx !== -1) monthLabels.push({ month: MONTHS_FULL[m].slice(0,3), idx });
  }
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Year Overview {year}</h2>
        {onYearChange && (
          <div className="flex items-center gap-1">
            <button type="button" onClick={decYear} className="btn-soft !px-2 !py-1" title="Previous year">‹</button>
            <input type="number" min="2000" max={currentYear+2} value={year} onChange={e=>onYearChange(parseInt(e.target.value||year))} className="w-20 rounded-md border border-slate-300/60 dark:border-slate-600/50 bg-white/70 dark:bg-slate-700/60 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500" />
            <button type="button" onClick={incYear} className="btn-soft !px-2 !py-1" title="Next year">›</button>
          </div>
        )}
      </div>
      <div className="relative overflow-x-auto">
        <div className="pl-6">
          <div className="flex text-[10px] text-slate-500 dark:text-slate-400 mb-1 select-none">
            {monthLabels.map(l => (
              <div key={l.month+year} style={{marginLeft: l.idx*(cellSize+2), width: cellSize*4}}>{l.month}</div>
            ))}
          </div>
          <div className="flex gap-[2px]" style={{fontSize:10}}>
            <div className="flex flex-col justify-between py-[2px] text-[10px] leading-[11px] text-slate-500 dark:text-slate-400 select-none mr-1">
              <span>Mon</span><span>Wed</span><span>Fri</span>
            </div>
            {weeks.map((w,i)=>(
              <div key={i} className="flex flex-col gap-[2px]" style={{width:cellSize}}>
                {Array.from({length:7}).map((_,di)=>{ const d=new Date(w); d.setDate(w.getDate()+di); if(d<startOfYear||d>endOfYear) return <div key={di} style={{height:cellSize,width:cellSize}}/>; const info=dayData.get(dayKey(d)); const cls=info?level(info.ratio):'bg-slate-800/20 dark:bg-slate-700/20 border-slate-600/20'; const title=info?`${d.toDateString()}\n${info.done}/${info.active} habits`:d.toDateString(); return <div key={di} title={title} className={`rounded-[2px] border ${cls} transition-colors`} style={{height:cellSize,width:cellSize}} /> })}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
          <span>Less</span>
          <div className="flex gap-1">
            {[0,1,2,3,4].map(i=>{
              const size=12; const cls=['bg-slate-800/40 border-slate-600/40','bg-emerald-900/60 border-emerald-800/60','bg-emerald-700 border-emerald-600','bg-emerald-500 border-emerald-500','bg-emerald-400 border-emerald-400'][i];
              return <div key={i} className={`h-3 w-3 rounded-sm border ${cls}`} /> })}
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
window.ContributionCalendar = ContributionCalendar;
