function Timer() {
  const [min, setMin] = React.useState(25);
  const [sec, setSec] = React.useState(0);
  const [left, setLeft] = React.useState(0);
  const [running, setRunning] = React.useState(false);
  const [initialTime, setInitialTime] = React.useState(0);

  React.useEffect(() => {
    let id;
    if (running && left > 0) {
      id = setInterval(() => setLeft(v => v > 0 ? v - 1 : 0), 1000);
    } else if (left === 0 && running) {
      setRunning(false); // Timer finished
    }
    return () => {
      if (id) clearInterval(id);
    };
  }, [running, left]);

  const fmt = n => String(n).padStart(2, "0");
  
  const totalSecondsFromInputs = Math.max(0, (parseInt(min || 0) || 0) * 60 + (parseInt(sec || 0) || 0));
  
  // Display logic: show remaining time if running or paused, otherwise show setup time
  const display = (left > 0 || initialTime > 0) ? `${fmt(Math.floor(left / 60))}:${fmt(left % 60)}` : `${fmt(min)}:${fmt(sec)}`;

  const start = () => {
    // If it's not running and has time left, it's a resume.
    if (!running && left > 0) {
      setRunning(true);
      return;
    }
    // Otherwise, it's a fresh start from the input values.
    setLeft(totalSecondsFromInputs);
    setInitialTime(totalSecondsFromInputs);
    setRunning(true);
  };

  const pause = () => setRunning(false);
  
  const reset = () => {
    setRunning(false);
    setLeft(totalSecondsFromInputs);
    setInitialTime(totalSecondsFromInputs);
  };

  // Determine button text and action
  const isPaused = !running && left > 0 && left < initialTime;
  const startButtonText = isPaused ? "Resume" : "Start";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-end justify-between gap-4 flex-wrap">
            <div className="text-4xl font-bold tabular-nums text-slate-800">{display}</div>
            <div className="flex items-center gap-2">
                {!running ? 
                    <button onClick={start} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 transition-colors">{startButtonText}</button> : 
                    <button onClick={pause} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-600 transition-colors">Pause</button>}
                <button onClick={reset} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">Reset</button>
            </div>
        </div>
        <div className="mt-4 flex items-center gap-2 border-t border-slate-200 pt-4">
            <input type="number" min="0" className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm" value={min} onChange={(e) => { setMin(Math.max(0, parseInt(e.target.value || 0))); if (!running) setLeft(0); }} />
            <span className="text-sm text-slate-500">min</span>
            <input type="number" min="0" max="59" className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm" value={sec} onChange={(e) => { setSec(Math.min(59, Math.max(0, parseInt(e.target.value || 0)))); if (!running) setLeft(0); }} />
            <span className="text-sm text-slate-500">sec</span>
        </div>
        <div className="flex gap-2 mt-3">
            {[5, 10, 15, 25, 45].map(p => (<button key={p} onClick={() => { setMin(p); setSec(0); if (!running) setLeft(0); }} className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 transition-colors">{p}m</button>))}
        </div>
    </div>
  );
}
window.Timer = Timer;