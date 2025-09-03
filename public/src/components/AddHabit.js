function AddHabit({ onAdd }) {
  const [val, setVal] = React.useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); onAdd(val); setVal(""); }} className="mt-4 flex items-center gap-2">
      <input value={val} onChange={(e) => setVal(e.target.value)} placeholder="Add a new habit…" className="w-full rounded-lg border border-slate-300/70 dark:border-slate-600/60 bg-white/85 dark:bg-slate-700/70 backdrop-blur px-3 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
      <button type="submit" className="btn-primary flex-shrink-0 disabled:opacity-50" disabled={!val.trim()}>Add</button>
    </form>
  );
}
window.AddHabit = AddHabit;
