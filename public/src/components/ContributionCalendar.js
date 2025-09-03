const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function ContributionCalendar({ habits, checks, year, compact=false }) {
  const cellSize = compact ? 10 : 12; // non-compact size
  const COMPACT_DAY = 15; // enlarged pixel size for each day cell in compact mode
  const startOfYear = new Date(year,0,1);
  const endOfYear = new Date(year,11,31);
  const today = new Date();
  const isTodayYear = today.getFullYear() === year;
  function isSameDay(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }

  function dayKey(d){ return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; }
  const dayData = new Map();

  // Precompute day data for entire year
  for(let m=0;m<12;m++){
    const mStart = new Date(year,m,1);
    const mEnd = new Date(year,m+1,0);
    for(let d=new Date(mStart); d<=mEnd; d.setDate(d.getDate()+1)){
      const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
      const monthChecks = checks[monthKey] || {};
      let active=0, done=0;
      for(const h of habits){
        if(isActiveOnDate(h,d)){
          active++;
          if(monthChecks[h.id]?.[d.getDate()]) done++;
        }
      }
      const ratio = active===0? null : done/active;
      dayData.set(dayKey(d), { date:new Date(d), active, done, ratio });
    }
  }

  function level(r){
    if(r===null) return 'bg-slate-800/10 dark:bg-slate-700/10 border-slate-600/10';
    if(r===0) return 'bg-slate-800/40 dark:bg-slate-800 border-slate-600/40';
    if(r<.25) return 'bg-emerald-900/60 border-emerald-800/60';
    if(r<.5) return 'bg-emerald-700 border-emerald-600';
    if(r<.75) return 'bg-emerald-500 border-emerald-500';
    return 'bg-emerald-400 border-emerald-400';
  }

  // Build week starts for full year (for non-compact)
  const weeks = [];
  if(!compact){
    const startIdx = (startOfYear.getDay()+6)%7; // Monday align
    const gridStart = new Date(startOfYear); gridStart.setDate(startOfYear.getDate()-startIdx);
    let cur = new Date(gridStart);
    while(cur <= endOfYear || weeks.length < 53){
      weeks.push(new Date(cur));
      cur.setDate(cur.getDate()+7);
      if(weeks.length>60) break;
    }
  }

  // Compact mode quarter blocks (group 4 months each)
  let quarterBlocks = [];
  if (compact) {
    const groups = [ [0,1,2,3], [4,5,6,7], [8,9,10,11] ];
    for (const g of groups) {
      const qStart = new Date(year, g[0], 1);
      const qEnd = new Date(year, g[g.length-1] + 1, 0);
      const offset = (qStart.getDay() + 6) % 7; // Monday align
      const firstWeekStart = new Date(qStart); firstWeekStart.setDate(qStart.getDate() - offset);
      const weeksArr = [];
      let ws = new Date(firstWeekStart);
      while (ws <= qEnd) { weeksArr.push(new Date(ws)); ws.setDate(ws.getDate()+7); }
      quarterBlocks.push({ months: g, weeks: weeksArr, start: qStart, end: qEnd });
    }
  }
  const maxWeeks = compact ? Math.max(...quarterBlocks.map(q=>q.weeks.length)) : 0;

  return (
    <div className={'w-full'}>
      {!compact && (
        <div className="flex items-center justify-center mb-2">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Year Overview {year}</h2>
        </div>
      )}
  <div className={compact ? 'overflow-visible' : 'overflow-x-auto overflow-y-hidden'}>
  <div className={compact ? 'grid grid-cols-1 gap-4' : 'min-w-max'}>
          {compact ? (
            quarterBlocks.map((qb, qi) => (
              <div key={qi} className="">
                <div className="grid gap-[2px] w-fit mx-auto" style={{gridTemplateColumns:`repeat(${maxWeeks},${COMPACT_DAY}px)`}}>
                  {Array.from({length:maxWeeks}).map((_,i)=>{
                    if(i < qb.weeks.length){
                      const w = qb.weeks[i];
                      return (
                        <div key={i} className="flex flex-col gap-[2px]">
                          {Array.from({length:7}).map((_,di)=>{
                            const d = new Date(w); d.setDate(w.getDate()+di);
                            if(d < qb.start || d > qb.end) return <div key={di} className="w-full" style={{height:COMPACT_DAY,width:COMPACT_DAY}}/>;
                            const info = dayData.get(dayKey(d));
                            const cls = info? level(info.ratio) : 'bg-slate-800/20 dark:bg-slate-700/20 border-slate-600/20';
                            const title = info? `${d.toDateString()}\n${info.done}/${info.active} habits` : d.toDateString();
                            const highlight = isTodayYear && isSameDay(d,today) ? 'ring-2 ring-black dark:ring-white ring-offset-[1px] ring-offset-slate-900 dark:ring-offset-slate-900 animate-pulse' : '';
                            return <div key={di} title={title} className={`w-full rounded-[2px] border ${cls} transition-colors ${highlight}`} style={{height:COMPACT_DAY,width:COMPACT_DAY}} />
                          })}
                        </div>
                      );
                    }
                    // filler blank week column to keep alignment width
                    return (
                      <div key={i} className="flex flex-col gap-[2px] opacity-25">
                        {Array.from({length:7}).map((_,di)=>(<div key={di} style={{height:COMPACT_DAY,width:COMPACT_DAY}} />))}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="flex gap-[2px]" style={{fontSize:10}}>
              {weeks.map((w,i)=>(
                <div key={i} className="flex flex-col gap-[2px]" style={{width:cellSize}}>
                  {Array.from({length:7}).map((_,di)=>{ const d=new Date(w); d.setDate(w.getDate()+di); if(d<startOfYear||d>endOfYear) return <div key={di} style={{height:cellSize,width:cellSize}}/>; const info=dayData.get(dayKey(d)); const cls=info?level(info.ratio):'bg-slate-800/20 dark:bg-slate-700/20 border-slate-600/20'; const title=info?`${d.toDateString()}\n${info.done}/${info.active} habits`:d.toDateString(); const highlight = isTodayYear && isSameDay(d,today) ? 'ring-2 ring-black dark:ring-white ring-offset-[1px] ring-offset-slate-900 dark:ring-offset-slate-900 animate-pulse' : ''; return <div key={di} title={title} className={`rounded-[2px] border ${cls} transition-colors ${highlight}`} style={{height:cellSize,width:cellSize}} /> })}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
          <span>Less</span>
            <div className="flex gap-1">
              {[0,1,2,3,4].map(i=>{
                const cls=['bg-slate-800/40 border-slate-600/40','bg-emerald-900/60 border-emerald-800/60','bg-emerald-700 border-emerald-600','bg-emerald-500 border-emerald-500','bg-emerald-400 border-emerald-400'][i];
                return <div key={i} className={`h-3 w-3 rounded-sm border ${cls}`} />
              })}
            </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
window.ContributionCalendar = ContributionCalendar;
