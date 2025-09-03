// WEEKDAYS_LABEL is global from utils

function HabitScheduleButton({ habit, onChange }) {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef(null);
  const popupRef = React.useRef(null);
  const [coords, setCoords] = React.useState({ top: 0, left: 0 });

  // Close when clicking outside
  React.useEffect(() => {
    function handle(event) {
      if (!open) return;
      if (popupRef.current && popupRef.current.contains(event.target)) return;
      if (anchorRef.current && anchorRef.current.contains(event.target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', handle, { passive: true });
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  // Stable positioning (fixed, no jump) using a single effect
  React.useLayoutEffect(() => {
    if (!open) return;
    function update() {
      if (!anchorRef.current) return;
      const r = anchorRef.current.getBoundingClientRect();
      const width = popupRef.current?.offsetWidth || 288;
      const height = popupRef.current?.offsetHeight || 0;
      const gap = 6;
      let left = r.left; // default align left
      if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
      if (left < 8) left = 8;
      let top = r.bottom + gap; // below
      if (height && top + height > window.innerHeight - 8) {
        top = r.top - height - gap; // above if overflow
      }
      if (top < 8) top = 8;
      setCoords({ top, left });
    }
    update();
    window.addEventListener('resize', update, { passive: true });
    window.addEventListener('scroll', update, { passive: true });
    return () => { window.removeEventListener('resize', update); window.removeEventListener('scroll', update); };
  }, [open]);

  const sched = habit.schedule || { mode: "weekdays", daysOfWeek: Array(7).fill(true) };
  const [domInput, setDomInput] = React.useState((sched.daysOfMonth || []).join(","));
  const [quota, setQuota] = React.useState(Number(sched.timesPerWeek || 3));
  const setDay = (idx, val) => { const next = { mode: "weekdays", daysOfWeek: [...(sched.daysOfWeek || Array(7).fill(true))] }; next.daysOfWeek[idx] = val; onChange(next) };
  const applyDom = () => { const list = domInput.split(/[ ,]+/).map(v => parseInt(v, 10)).filter(n => !isNaN(n) && n >= 1 && n <= 31); onChange({ mode: "dom", daysOfMonth: Array.from(new Set(list)).sort((a, b) => a - b) }) };
  const applyQuota = () => { const t = Math.max(0, Math.min(7, Number(quota) || 0)); onChange({ mode: "quota", timesPerWeek: t }) };
  
  return (
    <div className="inline-block" ref={anchorRef}>
      <button onClick={() => setOpen(o => !o)} className="btn-soft">Schedule</button>
      {open && ReactDOM.createPortal((
        <div
          ref={popupRef}
          className="w-72 fixed rounded-xl border border-slate-200/70 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-3 text-sm shadow-xl shadow-black/10 animate-fade-in"
          style={{ top: coords.top, left: coords.left, zIndex: 100000 }}
        >
          <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
            {[{ key: "weekdays", label: "Weekdays" }, { key: "dom", label: "Days of Month" }, { key: "quota", label: "X / Week" }].map(m =>
              (<button key={m.key} onClick={() => onChange(m.key === "weekdays" ? { mode: "weekdays", daysOfWeek: sched.daysOfWeek || Array(7).fill(true) } : m.key === "dom" ? { mode: "dom", daysOfMonth: sched.daysOfMonth || [] } : { mode: "quota", timesPerWeek: sched.timesPerWeek || 3 })} className={["rounded-md border px-2 py-1.5 transition-colors", sched.mode === m.key ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300" : "border-slate-300/70 dark:border-slate-600/60 hover:bg-slate-50 dark:hover:bg-slate-700"].join(" ")}>{m.label}</button>)
            )}
          </div>
          {sched.mode === "weekdays" && (
            <div>
              <div className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">Active Weekdays</div>
              <div className="grid grid-cols-7 gap-1">
                {WEEKDAYS_LABEL.map((wd, i) => (
                  <label key={wd} className="flex cursor-pointer select-none items-center justify-center gap-1 rounded-md border border-slate-300/70 dark:border-slate-600/60 p-1 text-xs hover:bg-slate-50 dark:hover:bg-slate-700">
                    <input type="checkbox" className="mr-1 accent-primary-600" checked={!!(sched.daysOfWeek || [])[i]} onChange={(e) => setDay(i, e.target.checked)} />
                    {wd}
                  </label>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button className="btn-soft !py-1 !px-2" onClick={() => onChange({ mode: "weekdays", daysOfWeek: Array(7).fill(true) })}>All</button>
                <button className="btn-soft !py-1 !px-2" onClick={() => onChange({ mode: "weekdays", daysOfWeek: [true, true, true, true, true, false, false] })}>Weekdays</button>
                <button className="btn-soft !py-1 !px-2" onClick={() => onChange({ mode: "weekdays", daysOfWeek: [false, false, false, false, false, true, true] })}>Weekend</button>
              </div>
            </div>
          )}
          {sched.mode === "dom" && (
            <div>
              <div className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">Days of month (e.g. 1,10,20)</div>
              <input value={domInput} onChange={(e) => setDomInput(e.target.value)} className="w-full rounded-md border border-slate-300/70 dark:border-slate-600/60 bg-transparent px-2 py-1 text-sm focus:ring-2 focus:ring-primary-500 outline-none" placeholder="1, 10, 20" />
              <div className="mt-2 text-right"><button onClick={applyDom} className="btn-soft !py-1 !px-2">Apply</button></div>
            </div>
          )}
          {sched.mode === "quota" && (
            <div>
              <div className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">Times per week (0–7)</div>
              <input type="number" min={0} max={7} value={Number.isFinite(quota) ? quota : 0} onChange={(e) => { const n = Math.max(0, Math.min(7, parseInt(e.target.value || "0", 10))); setQuota(n); }} className="w-full rounded-md border border-slate-300/70 dark:border-slate-600/60 bg-transparent px-2 py-1 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              <div className="mt-2 text-right"><button onClick={applyQuota} className="btn-soft !py-1 !px-2">Apply</button></div>
              <p className="mt-2 text-[11px] leading-snug text-slate-500 dark:text-slate-400">This mode allows free ticking; progress is measured by completions per week.</p>
            </div>
          )}
          <div className="mt-3 text-right"><button onClick={() => setOpen(false)} className="text-xs text-slate-600 dark:text-slate-400 hover:underline">Close</button></div>
        </div>), document.body)}
    </div>
  );
}
window.HabitScheduleButton = HabitScheduleButton;
