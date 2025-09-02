function AddHabit({ onAdd }) {
  const [val, setVal] = React.useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); onAdd(val); setVal(""); }} className="mt-4 flex items-center gap-2">
      <input value={val} onChange={(e) => setVal(e.target.value)} placeholder="Add a new habit…" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
      <button type="submit" className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 transition-colors flex-shrink-0">Add</button>
    </form>
  );
}
window.AddHabit = AddHabit;
