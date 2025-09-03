// Optimized ContributionCalendar with caching + progressive reveal
const YEAR_CACHE = {};
function getYearDays(year){
  if (YEAR_CACHE[year]) return YEAR_CACHE[year];
  const arr = [];
  const start = new Date(year,0,1);
  const end = new Date(year,11,31);
  for(let d = new Date(start); d <= end; d.setDate(d.getDate()+1)){
    arr.push(new Date(d));
  }
  YEAR_CACHE[year] = arr;
  return arr;
}

function ratioLevel(r){
  if(r===null) return 'bg-slate-800/10 dark:bg-slate-700/10';
  if(r===0) return 'bg-slate-800/40 dark:bg-slate-800';
  if(r<0.25) return 'bg-emerald-900/60';
  if(r<0.5) return 'bg-emerald-700';
  if(r<0.75) return 'bg-emerald-500';
  return 'bg-emerald-400';
}

const HeatCell = React.memo(function HeatCell({ info, size, highlight }){
  const { date, ratio, active, done } = info;
  const cls = ratioLevel(ratio);
  return (
    <div
      title={`${date.toDateString()}${ratio!==null?`\n${done}/${active} habits`:''}`}
      className={`rounded-[2px] ${cls} border border-transparent transition-colors ${highlight}`}
      style={{ width:size, height:size }}
      data-date={date.toISOString().slice(0,10)}
    />
  );
});

function buildQuarterBlocks(year){
  const groups = [ [0,1,2,3], [4,5,6,7], [8,9,10,11] ];
  return groups.map(g => {
    const qStart = new Date(year, g[0], 1);
    const qEnd = new Date(year, g[g.length-1]+1, 0);
    const offset = (qStart.getDay()+6)%7; // Monday align
    const firstWeekStart = new Date(qStart); firstWeekStart.setDate(qStart.getDate()-offset);
    const weeks=[]; let ws=new Date(firstWeekStart);
    while(ws <= qEnd){ weeks.push(new Date(ws)); ws.setDate(ws.getDate()+7); }
    return { months:g, weeks, start:qStart, end:qEnd };
  });
}

function ContributionCalendar({ habits, checks, year, compact=false }) {
  const today = new Date();
  const isTodayYear = today.getFullYear() === year;
  const days = getYearDays(year);
  const COMPACT_DAY = 15;
  const cellSize = compact ? 10 : 12;

  // Precompute per-day info (memo by dependencies)
  const perDay = React.useMemo(()=>{
    return days.map(d => {
      const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
      const monthChecks = checks[monthKey] || {};
      let active=0, done=0;
      for(const h of habits){
        if(isActiveOnDate(h,d)){
          active++;
          if(monthChecks[h.id]?.[d.getDate()]) done++;
        }
      }
      return { date:d, active, done, ratio: active===0? null : done/active };
    });
  }, [days, habits, checks, year]);

  // Remove progressive reveal (render all immediately) to avoid cutoff issues
  const visible = perDay.length;

  // Non-compact weeks grid
  const weeks = React.useMemo(()=>{
    if (compact) return [];
    const startOfYear = new Date(year,0,1);
    const endOfYear = new Date(year,11,31);
    const startIdx = (startOfYear.getDay()+6)%7;
    const gridStart = new Date(startOfYear); gridStart.setDate(startOfYear.getDate()-startIdx);
    const arr=[]; let cur=new Date(gridStart);
    while(cur <= endOfYear || arr.length < 53){ arr.push(new Date(cur)); cur.setDate(cur.getDate()+7); if(arr.length>60) break; }
    return arr;
  }, [compact, year]);

  const quarterBlocks = React.useMemo(()=> compact ? buildQuarterBlocks(year) : [], [compact, year]);
  const maxWeeks = compact ? Math.max(...quarterBlocks.map(q=>q.weeks.length)) : 0;

  // Map date ISO -> info for quick lookup
  const infoMap = React.useMemo(()=>{
    const m = new Map();
    perDay.forEach((i, idx) => m.set(i.date.toDateString(), { ...i, __idx: idx }));
    return m;
  }, [perDay]);

  const todayISO = today.toDateString();

  return (
    <div className="w-full">
      {!compact && (
        <div className="flex items-center justify-center mb-2">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Year Overview {year}</h2>
        </div>
      )}
      <div className={compact ? 'overflow-visible' : 'overflow-x-auto overflow-y-hidden'}>
        <div className={compact ? 'grid grid-cols-1 gap-4' : 'min-w-max'}>
          {compact ? (
            quarterBlocks.map((qb, qi) => (
              <div key={qi}>
                <div className="grid gap-[2px] w-fit mx-auto" style={{ gridTemplateColumns:`repeat(${maxWeeks},${COMPACT_DAY}px)` }}>
                  {Array.from({length:maxWeeks}).map((_, i) => {
                    if (i < qb.weeks.length) {
                      const w = qb.weeks[i];
                      return (
                        <div key={i} className="flex flex-col gap-[2px]">
                          {Array.from({length:7}).map((_, di) => {
                            const d = new Date(w); d.setDate(w.getDate()+di);
                            if (d < qb.start || d > qb.end) return <div key={di} style={{ height:COMPACT_DAY, width:COMPACT_DAY }} />;
                            const info = infoMap.get(d.toDateString());
                            if (!info) return <div key={di} style={{ height:COMPACT_DAY, width:COMPACT_DAY }} />;
                            const highlight = isTodayYear && d.toDateString() === todayISO ? 'ring-2 ring-black dark:ring-white ring-offset-[1px] ring-offset-slate-900 dark:ring-offset-slate-900 animate-pulse' : '';
                            return <HeatCell key={di} info={info} size={COMPACT_DAY} highlight={highlight} />;
                          })}
                        </div>
                      );
                    }
                    return (
                      <div key={i} className="flex flex-col gap-[2px] opacity-25">
                        {Array.from({length:7}).map((_, di) => <div key={di} style={{ height:COMPACT_DAY, width:COMPACT_DAY }} />)}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="flex gap-[2px]" style={{ fontSize:10 }}>
              {weeks.map((w, i) => (
                <div key={i} className="flex flex-col gap-[2px]" style={{ width:cellSize }}>
                  {Array.from({length:7}).map((_, di) => {
                    const d = new Date(w); d.setDate(w.getDate()+di);
                    if (d.getFullYear() !== year) return <div key={di} style={{ height:cellSize, width:cellSize }} />;
                    const info = infoMap.get(d.toDateString());
                    if (!info) return <div key={di} style={{ height:cellSize, width:cellSize }} />;
                    const highlight = isTodayYear && d.toDateString() === todayISO ? 'ring-2 ring-black dark:ring-white ring-offset-[1px] ring-offset-slate-900 dark:ring-offset-slate-900 animate-pulse' : '';
                    return <HeatCell key={di} info={info} size={cellSize} highlight={highlight} />;
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="h-3 w-3 rounded-sm bg-slate-800/40 dark:bg-slate-800" />
            <div className="h-3 w-3 rounded-sm bg-emerald-900/60" />
            <div className="h-3 w-3 rounded-sm bg-emerald-700" />
            <div className="h-3 w-3 rounded-sm bg-emerald-500" />
            <div className="h-3 w-3 rounded-sm bg-emerald-400" />
          </div>
          <span>More</span>
          {/* Removed incremental percentage indicator */}
        </div>
      </div>
    </div>
  );
}

window.ContributionCalendar = ContributionCalendar;
