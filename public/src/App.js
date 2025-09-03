// Using globals loaded earlier (utils, components, firebaseApi)
const { doc, onSnapshot, setDoc, signInWithPopup, signOut, onAuthStateChanged } = window.firebaseApi;
const db = window.db;
const auth = window.auth;
const provider = window.provider;

// use React.* directly to avoid duplicate destructuring across reloads
const useState = React.useState;
const useEffect = React.useEffect;
const useMemo = React.useMemo;
const useCallback = React.useCallback;
const useRef = React.useRef;
const memo = React.memo;

// component references from global scope
const MemoizedMiniCalendar = memo(MiniCalendar);
const MemoizedHabitScheduleButton = memo(HabitScheduleButton);
const MemoizedMonthYearPicker = memo(MonthYearPicker);
const MemoizedAddHabit = memo(AddHabit);
const MemoizedContributionCalendar = typeof ContributionCalendar !== 'undefined' ? memo(ContributionCalendar) : null;

const MemoizedHabitListItem = memo(({ habit, progress, onRemove, onUpdateSchedule }) => (
    <li className="group flex items-center justify-between gap-1 sm:gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 p-2 sm:p-3 backdrop-blur-sm hover:border-emerald-300 dark:hover:border-emerald-600 transition-all">
        <div className="flex-1 overflow-hidden">
            <div className="font-medium text-slate-900 dark:text-slate-100 tracking-tight truncate" title={habit.name}>{habit.name}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span>{progress.pct}% complete</span>
                <div className="flex-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300" style={{ width: `${progress.pct}%` }} />
                </div>
            </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <MemoizedHabitScheduleButton habit={habit} onChange={(s) => onUpdateSchedule(habit.id, s)} />
            <button onClick={() => onRemove(habit.id)} className="btn-soft !px-2 !py-1 !border-red-300/70 dark:!border-red-500/40 !text-red-600 dark:!text-red-300 hover:!bg-red-50 dark:hover:!bg-red-900/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 sm:hidden"><path fillRule="evenodd" d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" clipRule="evenodd" /></svg>
                <span className="hidden sm:inline">Remove</span>
            </button>
        </div>
    </li>
));

const MemoizedGoalItem = memo(({ goal, onRemove, onToggle }) => (
    <li className="group flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
        <input 
            type="checkbox" 
            checked={goal.done} 
            onChange={() => onToggle(goal.id)} 
            className="h-5 w-5 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500 bg-transparent transition-all" 
        />
        <span className={`flex-1 transition-all ${goal.done ? 'line-through text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>
            {goal.text}
        </span>
        <button 
            onClick={() => onRemove(goal.id)} 
            className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1 rounded"
        >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" clipRule="evenodd" />
            </svg>
        </button>
    </li>
));

const MemoizedHabitRow = memo(({ habit, monthChecks, daysList, ym, onToggle, rowIndex, rowCount }) => {
  const row = monthChecks[habit.id] || {};
  const dayGridTemplate = `repeat(${daysList.length}, minmax(var(--day-min),1fr))`;

  function handleArrowNav(e) {
    const key = e.key;
    if (!['ArrowRight','ArrowLeft','ArrowUp','ArrowDown','Home','End'].includes(key)) return;
    const currentBtn = e.currentTarget;
    const row = parseInt(currentBtn.getAttribute('data-row'), 10);
    const day = parseInt(currentBtn.getAttribute('data-day'), 10);
    let targetRow = row;
    let targetDay = day;
    const maxDay = daysList.length;
    switch (key) {
      case 'ArrowRight': targetDay = Math.min(maxDay, day + 1); break;
      case 'ArrowLeft': targetDay = Math.max(1, day - 1); break;
      case 'ArrowDown': targetRow = Math.min(rowCount - 1, row + 1); break;
      case 'ArrowUp': targetRow = Math.max(0, row - 1); break;
      case 'Home': targetDay = 1; break;
      case 'End': targetDay = maxDay; break;
      default: break;
    }
    const next = document.querySelector(`button[data-row="${targetRow}"][data-day="${targetDay}"]`);
    if (next && next !== currentBtn) {
      e.preventDefault();
      next.focus();
    }
  }

  return (
    <div className="grid items-center justify-items-center gap-2 px-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" style={{ gridTemplateColumns: dayGridTemplate, minHeight: 'var(--row-h)' }}>
      {daysList.map(d => {
        const date = new Date(ym[0], ym[1], d);
        const active = isActiveOnDate(habit, date);
        const checked = !!row[d];
        const base = "h-9 w-9 rounded-lg border text-sm transition-all shadow-sm outline-none ring-1 ring-transparent focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-slate-800 flex items-center justify-center";
        const activeUnchecked = "border-slate-300/70 dark:border-slate-600/60 bg-white/70 dark:bg-slate-700/60 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:border-emerald-400 dark:hover:border-emerald-500";
        const activeChecked = "border-emerald-600/90 bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-semibold shadow";
        const inactive = "border-dashed border-slate-200/60 dark:border-slate-700/50 bg-slate-100/60 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 cursor-not-allowed";
        const cls = active ? (checked ? activeChecked : activeUnchecked) : inactive;
        return (
          <button
            key={d}
            data-row={rowIndex}
            data-day={d}
            onKeyDown={handleArrowNav}
            onClick={() => active && onToggle(habit.id, d)}
            className={[base, cls].join(' ')}
            title={`Day ${d}${active ? '' : ' (inactive)'}`}
            disabled={!active}
          >{checked ? '✓' : ''}</button>
        );
      })}
    </div>
  );
});

    // Sticky stats + month picker bar
    const StatsBar = memo(({ ym, setYm, habitsCount, allDoneCount, allStreak, onJumpToday, isCurrentMonth }) => {
      return (
        <div className="sticky top-[4rem] z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 py-3 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
            <div className="w-full md:w-60 flex items-center gap-2">
              <MemoizedMonthYearPicker value={ym} onChange={setYm} />
              {isCurrentMonth && (
                <button onClick={onJumpToday} className="btn-soft !py-1 !px-2 text-xs" aria-label="Jump to today">Today</button>
              )}
            </div>
            <div className="flex-1 grid grid-cols-3 sm:grid-cols-6 md:grid-cols-3 lg:grid-cols-6 gap-2">
              <div className="card py-2 px-3 shadow-sm dark:bg-slate-800 dark:border-slate-700 flex flex-col items-center justify-center">
                <div className="text-[10px] sm:text-[11px] uppercase tracking-wide font-medium text-slate-500 dark:text-slate-400">Habits</div>
                <div className="mt-0.5 text-xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{habitsCount}</div>
              </div>
              <div className="card py-2 px-3 shadow-sm dark:bg-slate-800 dark:border-slate-700 flex flex-col items-center justify-center">
                <div className="text-[10px] sm:text-[11px] uppercase tracking-wide font-medium text-slate-500 dark:text-slate-400">All-done days</div>
                <div className="mt-0.5 text-xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{allDoneCount}</div>
              </div>
              <div className="card py-2 px-3 shadow-sm dark:bg-slate-800 dark:border-slate-700 flex flex-col items-center justify-center">
                <div className="text-[10px] sm:text-[11px] uppercase tracking-wide font-medium text-slate-500 dark:text-slate-400">Streak</div>
                {(() => { const c = allStreak.current; let f = 0; if (c>0){ if(c<=10)f=1; else if(c<=20)f=2; else f=3;} return (
                  <div className="mt-0.5 flex items-center gap-1"><span className="text-xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{c}</span><span className="flex" aria-hidden="true">{Array.from({length:f}).map((_,i)=><span key={i}>🔥</span>)}</span></div>
                ); })()}
              </div>
            </div>
          </div>
        </div>
      );
    });

const MemoizedDailyCompletionBar = memo(({ perDayCompletion, daysList, dayGridTemplate, allDoneDays }) => (
    <div className="px-3 py-4 bg-white dark:bg-slate-800">
        <div className="grid items-end gap-2" style={{ gridTemplateColumns: dayGridTemplate }}>
          {daysList.map((i) => {
            const o = perDayCompletion[i - 1];
            const h = o.activeCount ? (o.doneCount / o.activeCount) * parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bar-max-h')) : 0;
            return (
              <div key={i} className="w-full rounded-t bg-gradient-to-t from-emerald-500/85 to-teal-400/80" title={`Day ${i}: ${o.doneCount}/${o.activeCount}`} style={{ height: `${h}px`, transition: 'height 300ms ease' }} />
            );
          })}
        </div>
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{allDoneDays.size} day(s) with all active habits completed.</div>
      </div>
    ));
const HabitGrid = memo(({ habits, monthChecks, daysList, dayGridTemplate, ym, onToggle, perDayCompletion, allDoneDays, perHabitProgress }) => (
  <div className="w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
    <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[160px_1fr] sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <div className="flex items-center px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700" style={{minHeight:'var(--row-h)'}}>Habit</div>
      <div style={{minHeight:'var(--row-h)'}}></div>
    </div>
    <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[160px_1fr] max-h-[60vh] overflow-y-auto">
      <div className="border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800">
        <div aria-hidden="true" className="border-b border-slate-200 dark:border-slate-800" style={{minHeight:'var(--row-h)'}}></div>
    {habits.map((h, idx) => {
          const prog = perHabitProgress.find(p => p.id === h.id)?.pct ?? 0;
          return (
      <div key={h.id} className="group flex gap-3 px-3 text-sm border-b border-slate-200 dark:border-slate-800 transition-colors w-full bg-white dark:bg-slate-800 hover:bg-green-50/60 dark:hover:bg-green-900/20" style={{ minHeight: 'var(--row-h)' }}>
              <div className="flex flex-col justify-center w-full overflow-hidden">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-slate-500 dark:bg-slate-400 flex-shrink-0" />
                  <div className="font-medium truncate text-slate-800 dark:text-slate-200" title={h.name}>{h.name}</div>
                  <span className="ml-auto text-[11px] font-medium text-slate-500 dark:text-slate-400 tabular-nums">{prog}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full bg-green-500 dark:bg-green-500 transition-all" style={{ width: prog + '%' }} />
                </div>
              </div>
            </div>
          );
        })}
        <div className="px-3 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 text-xs text-slate-600 dark:text-slate-400 w-full">Daily Completion</div>
      </div>
  <div className="relative overflow-x-auto bg-white dark:bg-slate-800 drag-scroll-x cursor-grab" data-drag-scroll>
        <div className="min-w-full">
          <div className="sticky top-0 z-10 bg-white/85 dark:bg-slate-900/75 backdrop-blur px-3 flex items-center" style={{minHeight:'var(--row-h)'}}>
            <div className="fade-left absolute inset-y-0 left-0 pointer-events-none"></div>
            <div className="grid items-center gap-2 text-center text-[11px] font-medium text-slate-500 dark:text-slate-400 justify-items-center" style={{ gridTemplateColumns: dayGridTemplate }}>
              {daysList.map(d => <div key={d} data-day={d} className="rounded-md w-full select-none">{d}</div>)}
            </div>
          </div>
          {habits.map((h, idx) => (
            <div key={h.id} className="bg-white dark:bg-slate-800 group hover:bg-green-50/40 dark:hover:bg-green-900/10 transition-colors">
              <MemoizedHabitRow
                habit={h}
                monthChecks={monthChecks}
                daysList={daysList}
                ym={ym}
                onToggle={onToggle}
                rowIndex={idx}
                rowCount={habits.length}
              />
            </div>
          ))}
          <MemoizedDailyCompletionBar perDayCompletion={perDayCompletion} daysList={daysList} dayGridTemplate={dayGridTemplate} allDoneDays={allDoneDays} />
        </div>
      </div>
    </div>
  </div>
));


// Re-introduced AppHeader (was removed during layout refactor)
const AppHeader = memo(({ user, onSignOut }) => (
  <header className="gradient-header backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-slate-200/70 dark:border-slate-800/60">
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
      <div className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">
            Habit Tracker
          </h1>
          {user && (
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-slate-600 dark:text-slate-400">
                Welcome back, {user.displayName?.split(' ')[0] || 'User'}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.toggleTheme && window.toggleTheme()} 
            aria-label="Toggle theme" 
            className="btn-soft flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
              <path d="M8 1a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 1ZM10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM12.95 4.11a.75.75 0 1 0-1.06-1.06l-1.062 1.06a.75.75 0 0 0 1.061 1.062l1.06-1.061ZM15 8a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 15 8ZM11.89 12.95a.75.75 0 0 0 1.06-1.06l-1.06-1.062a.75.75 0 0 0-1.062 1.061l1.061 1.06ZM8 12a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 12ZM5.172 11.89a.75.75 0 0 0-1.061-1.062L3.05 11.89a.75.75 0 1 0 1.06 1.06l1.06-1.06ZM4 8a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 4 8ZM4.11 5.172A.75.75 0 0 0 5.173 4.11L4.11 3.05a.75.75 0 1 0-1.06 1.06l1.06 1.061Z" />
            </svg>
            <span className="hidden sm:inline">Theme</span>
          </button>
          {user ? (
            <button onClick={onSignOut} className="btn-soft">Sign Out</button>
          ) : null}
        </div>
      </div>
    </div>
  </header>
));

const DEFAULT_HABITS = [
];

// Custom hook for localStorage - acts as an offline cache
function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => { 
      try { 
          const raw = localStorage.getItem(key); 
          return raw ? JSON.parse(raw) : initial;
      } catch { 
          return initial;
      } 
  });
  useEffect(() => { 
      try { 
          localStorage.setItem(key, JSON.stringify(val));
      } catch { } 
  }, [key, val]);
  return [val, setVal];
}

function App() {
  const today = new Date();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const heatmapRef = useRef(null);
  const [heatmapVisible, setHeatmapVisible] = useState(false);
  
  const [ym, setYm] = useLocalStorage("ht_ym", [today.getFullYear(), today.getMonth()]);
  
  // Get year from the month picker
  const currentYear = ym[0];

  const [habits, setHabits] = useLocalStorage("ht_habits", []);
  const [goals, setGoals] = useLocalStorage("ht_goals", []); // [{id,text,done}]
  const [checks, setChecks] = useLocalStorage("ht_checks", {});

  const monthKey = `${ym[0]}-${ym[1]}`;

  // --- AUTHENTICATION ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
  setHabits([]);
  setChecks({});
  setGoals([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- DATA SYNCING ---
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    
  const habitsDocRef = doc(db, `users/${user.uid}/meta/habits`);
  const goalsDocRef = doc(db, `users/${user.uid}/meta/goals`);
    const unsubscribeHabits = onSnapshot(habitsDocRef, async (docSnap) => {
        if (docSnap.exists()) {
            setHabits(docSnap.data().habits || []);
        } else {
            const localHabits = JSON.parse(localStorage.getItem("ht_habits") || "[]");
            const initialHabits = localHabits.length > 0 ? localHabits : DEFAULT_HABITS;
            await setDoc(habitsDocRef, { habits: initialHabits });
            setHabits(initialHabits);
        }
        setLoading(false);
    });
  const unsubscribeGoals = onSnapshot(goalsDocRef, async (docSnap) => {
    if (docSnap.exists()) {
      setGoals(docSnap.data().goals || []);
    } else {
      const localGoals = JSON.parse(localStorage.getItem("ht_goals") || "[]");
      await setDoc(goalsDocRef, { goals: localGoals });
      setGoals(localGoals);
    }
  });

    const monthDocRef = doc(db, `users/${user.uid}/months/${monthKey}`);
    const unsubscribeChecks = onSnapshot(monthDocRef, (docSnap) => {
        setChecks(prevChecks => ({
            ...prevChecks,
            [monthKey]: docSnap.exists() ? docSnap.data() : {}
        }));
    });

    return () => {
      unsubscribeHabits();
  unsubscribeChecks();
  unsubscribeGoals();
    };
  }, [user, monthKey]);

  const handleSignIn = () => signInWithPopup(auth, provider).catch(err => console.error("Sign in error:", err));
  const handleSignOut = () => signOut(auth).catch(err => console.error("Sign out error:", err));

  // --- DATA MANIPULATION ---
  const writeToFirestore = useCallback(async (docRef, data) => {
    if (!user) return;
    try {
      await setDoc(docRef, data, { merge: true });
    } catch (error) {
      console.error("Firestore write error:", error);
    }
  }, [user]);

  const toggle = (habitId, day) => {
    const path = `users/${user.uid}/months/${monthKey}`;
    const currentMonthChecks = checks[monthKey] || {};
    const newCheckState = !(currentMonthChecks[habitId]?.[day] || false);
    writeToFirestore(doc(db, path), { [habitId]: { [day]: newCheckState } });
  };

  const addHabit = (name) => {
    if (!name.trim()) return;
    const newHabit = { 
        id: crypto.randomUUID(), 
        name: name.trim(), 
        schedule: { mode: "weekdays", daysOfWeek: Array(7).fill(true) } 
    };
    const updatedHabits = [...habits, newHabit];
    writeToFirestore(doc(db, `users/${user.uid}/meta/habits`), { habits: updatedHabits });
  };

  // GOALS CRUD
  const addGoal = (text) => {
    if (!text.trim()) return;
    const newGoal = { id: crypto.randomUUID(), text: text.trim(), done: false };
    const updated = [...goals, newGoal];
    setGoals(updated);
    if (user) writeToFirestore(doc(db, `users/${user.uid}/meta/goals`), { goals: updated });
  };
  const toggleGoal = (id) => {
    const updated = goals.map(g => g.id === id ? { ...g, done: !g.done } : g);
    setGoals(updated);
    if (user) writeToFirestore(doc(db, `users/${user.uid}/meta/goals`), { goals: updated });
  };
  const removeGoal = (id) => {
    const updated = goals.filter(g => g.id !== id);
    setGoals(updated);
    if (user) writeToFirestore(doc(db, `users/${user.uid}/meta/goals`), { goals: updated });
  };

  const removeHabit = (id) => {
    if (!confirm("Are you sure?")) return;
    const updatedHabits = habits.filter(h => h.id !== id);
    writeToFirestore(doc(db, `users/${user.uid}/meta/habits`), { habits: updatedHabits });
  };

  const updateHabitSchedule = (id, schedule) => {
    const updatedHabits = habits.map(h => h.id === id ? { ...h, schedule } : h);
    writeToFirestore(doc(db, `users/${user.uid}/meta/habits`), { habits: updatedHabits });
  };

  // --- COMPUTED VALUES ---
  const monthStart = useMemo(() => new Date(ym[0], ym[1], 1), [ym]);
  const totalDays = useMemo(() => daysInMonth(ym[0], ym[1]), [ym]);
  const daysList = useMemo(() => Array.from({ length: totalDays }, (_, i) => i + 1), [totalDays]);
  const dayGridTemplate = useMemo(() => `repeat(${totalDays}, minmax(var(--day-min),1fr))`, [totalDays]);
  
  const monthChecks = checks[monthKey] || {};

  const activeDaysByHabit = useMemo(() => 
    habits.reduce((map, h) => {
      if (h.schedule?.mode === "quota") {
        map.set(h.id, "quota");
      } else {
        const set = new Set();
        for (let d = 1; d <= totalDays; d++) {
          if (isActiveOnDate(h, new Date(ym[0], ym[1], d))) set.add(d);
        }
        map.set(h.id, set);
      }
      return map;
    }, new Map()), 
  [habits, ym, totalDays]);

  const weeks = useMemo(() => {
    const start = startOfMonth(monthStart);
    const end = endOfMonth(monthStart);
    const out = [];
    let cur = startOfWeek(start);
    while (cur <= end) {
      out.push(new Date(cur));
      cur = addDays(cur, 7);
    }
    return out;
  }, [monthStart]);

  const perHabitProgress = useMemo(() => {
    return habits.map(h => {
      const row = monthChecks[h.id] || {};
      if (h.schedule?.mode === "quota") {
        const target = h.schedule?.timesPerWeek || 0;
        const done = weeks.reduce((acc, ws) => {
          const we = endOfWeek(ws);
          let weeklyDone = 0;
          for (let d = 1; d <= totalDays; d++) {
            const date = new Date(ym[0], ym[1], d);
            if (date >= ws && date <= we && row[d]) weeklyDone++;
          }
          return acc + Math.min(weeklyDone, target);
        }, 0);
        const totalTarget = target * weeks.length || 1;
        return { id: h.id, pct: Math.round((done / totalTarget) * 100) };
      } else {
        const activeSet = activeDaysByHabit.get(h.id) || new Set();
        const count = [...activeSet].filter(d => row[d]).length;
        const denom = activeSet.size || 1;
        return { id: h.id, pct: Math.round((count / denom) * 100) };
      }
    });
  }, [habits, monthChecks, weeks, ym, totalDays, activeDaysByHabit]);

  const perDayCompletion = useMemo(() => {
    return daysList.map(d => {
      let activeCount = 0, doneCount = 0;
      for (const h of habits) {
        const activeSet = activeDaysByHabit.get(h.id);
        if (activeSet === "quota" || (activeSet && activeSet.has(d))) {
          activeCount++;
          if (monthChecks[h.id]?.[d]) doneCount++;
        }
      }
      return { activeCount, doneCount };
    });
  }, [daysList, habits, activeDaysByHabit, monthChecks]);

  const allDoneDays = useMemo(() => 
    new Set(perDayCompletion.map((o, idx) => (o.activeCount > 0 && o.doneCount === o.activeCount ? idx + 1 : null)).filter(Boolean)),
  [perDayCompletion]);

  const allStreak = useMemo(() => {
    const today = new Date();
    // ym is [year, month]
    const isCurrentMonth = today.getFullYear() === ym[0] && today.getMonth() === ym[1];
    const limitDay = isCurrentMonth ? today.getDate() : totalDays;
    return computeAllDoneStreak(allDoneDays, totalDays, limitDay);
  }, [allDoneDays, totalDays, ym]);

  const isCurrentMonth = today.getFullYear() === ym[0] && today.getMonth() === ym[1];

  const scrollToToday = useCallback(() => {
    if (!isCurrentMonth) return;
    const scroller = document.querySelector('.drag-scroll-x');
    if (!scroller) return;
    const cell = scroller.querySelector(`.sticky .grid [data-day="${today.getDate()}"]`);
    if (cell) {
      const left = cell.offsetLeft - 16;
      scroller.scrollTo({ left: left < 0 ? 0 : left, behavior: 'smooth' });
      // Focus first active button of today for first habit if exists
      const btn = scroller.querySelector(`button[data-row="0"][data-day="${today.getDate()}"]`);
      if (btn) btn.focus();
    }
  }, [isCurrentMonth, today]);

  // Accessibility: announce streak changes
  const prevStreakRef = useRef(allStreak.current);
  const [streakAnnouncement, setStreakAnnouncement] = useState('');
  useEffect(() => {
    const currentVal = allStreak.current;
    if (prevStreakRef.current !== currentVal) {
      setStreakAnnouncement(`Streak updated: ${currentVal} day${currentVal === 1 ? '' : 's'}.`);
      prevStreakRef.current = currentVal;
    }
  }, [allStreak.current]);

  // Lazy load heatmap when scrolled into view
  useEffect(() => {
    if (heatmapVisible) return; // already loaded
    if (!heatmapRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting) {
        setHeatmapVisible(true);
        observer.disconnect();
      }
    }, { root: null, rootMargin: '120px', threshold: 0.1 });
    observer.observe(heatmapRef.current);
    return () => observer.disconnect();
  }, [heatmapVisible]);

  // --- RENDER ---
  if (loading) {
    return (
      <div className="min-h-screen p-6 space-y-6">
        <div className="max-w-screen-2xl mx-auto space-y-6">
          <CardSkeleton lines={2} />
          <div className="grid md:grid-cols-3 gap-6">
            <CardSkeleton lines={6} />
            <div className="md:col-span-2 space-y-6">
              <GridSkeleton />
              <CardSkeleton lines={8} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
  <div className="min-h-screen font-sans bg-slate-50 dark:bg-slate-900">
      {!user ? (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center card max-w-sm mx-auto">
            <h1 className="text-2xl font-bold mb-2 text-slate-800 dark:text-slate-100">Welcome to Habit Tracker</h1>
            <p className="text-slate-600 dark:text-slate-300 mb-6">Please sign in to continue.</p>
            <button onClick={handleSignIn} className="btn-primary w-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              <span>Sign in with Google</span>
            </button>
          </div>
        </div>
      ) : (
        <main className="p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto">
          <AppHeader user={user} onSignOut={handleSignOut} />
          <StatsBar ym={ym} setYm={setYm} habitsCount={habits.length} allDoneCount={allDoneDays.size} allStreak={allStreak} onJumpToday={scrollToToday} isCurrentMonth={isCurrentMonth} />
          <div aria-live="polite" role="status" className="sr-only">{streakAnnouncement}</div>
          
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[340px_1fr] gap-6 lg:gap-8 mt-6">
            <div className="space-y-6 order-last md:order-first">
              <div className="card p-3" ref={heatmapRef}>
                {heatmapVisible && MemoizedContributionCalendar ? (
                  <MemoizedContributionCalendar compact habits={habits} checks={checks} year={currentYear} />
                ) : (
                  <HeatmapSkeleton />
                )}
              </div>
              <div className="card">
                <h2 className="text-lg font-semibold mb-3 dark:text-slate-100 flex items-center justify-between">Habits <span className="text-sm font-medium tabular-nums text-slate-500 dark:text-slate-400">{habits.length}</span></h2>
                <ul className="space-y-2 mb-4">
                  {habits.map(h => (
                    <MemoizedHabitListItem
                      key={h.id}
                      habit={h}
                      progress={perHabitProgress.find(p => p.id === h.id) || { pct: 0 }}
                      onRemove={removeHabit}
                      onUpdateSchedule={updateHabitSchedule}
                    />
                  ))}
                </ul>
                <MemoizedAddHabit onAdd={addHabit} />
              </div>
            </div>

            <div className="space-y-6 overflow-hidden">
              <div className="card p-0 overflow-hidden dark:bg-slate-800">
                <HabitGrid
                  habits={habits}
                  monthChecks={monthChecks}
                  daysList={daysList}
                  dayGridTemplate={dayGridTemplate}
                  ym={ym}
                  onToggle={toggle}
                  perDayCompletion={perDayCompletion}
                  allDoneDays={allDoneDays}
                  perHabitProgress={perHabitProgress}
                />
              </div>
              <div className="card">
                <h2 className="text-lg font-semibold mb-3 dark:text-slate-100 flex items-center justify-between">Goals <span className="text-sm font-medium tabular-nums text-slate-500 dark:text-slate-400">{goals.length}</span></h2>
                <ul className="space-y-2 mb-4">
                  {goals.map(g => (
                    <MemoizedGoalItem key={g.id} goal={g} onRemove={removeGoal} onToggle={toggleGoal} />
                  ))}
                </ul>
                <GoalInput onAdd={addGoal} />
              </div>
              {/* Heatmap moved to left column in compact mode; remove from here */}
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

// Goal input lightweight component (after render to keep file order simpler)
function GoalInput({ onAdd }) {
  const [val, setVal] = useState("");
  const [focused, setFocused] = useState(false);
  
  return (
    <form onSubmit={(e)=>{e.preventDefault(); onAdd(val); setVal("");}} className="flex items-center gap-2">
      <div className="relative flex-1">
        <input 
          value={val} 
          onChange={e=>setVal(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Add a goal…" 
          className={`w-full rounded-lg border border-slate-300/70 dark:border-slate-600/60 bg-white/80 dark:bg-slate-700/70 backdrop-blur px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${focused ? 'border-primary-400' : ''}`} 
        />
        {val && (
          <button 
            type="button" 
            onClick={() => setVal("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14ZM5.28 5.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 5.22Z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      <button 
        type="submit" 
        disabled={!val.trim()} 
        className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 sm:hidden">
          <path fillRule="evenodd" d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14Zm.75-10.25v2.5h2.5a.75.75 0 0 1 0 1.5h-2.5v2.5a.75.75 0 0 1-1.5 0v-2.5h-2.5a.75.75 0 0 1 0-1.5h2.5v-2.5a.75.75 0 0 1 1.5 0Z" clipRule="evenodd" />
        </svg>
        <span className="hidden sm:inline">Add</span>
      </button>
    </form>
  );
}

// --- Skeleton (fallback) rewrite ---
// Base skeleton block with pulse + subtle gradient overlay
function Skeleton({ className="", rounded="rounded-md" }) {
  return (
    <div className={`relative overflow-hidden ${rounded} bg-slate-200/70 dark:bg-slate-700/50 animate-pulse ${className}`} />
  );
}

// Generic card skeleton with optional title bar and lines
function CardSkeleton({ lines = 3, title = true }) {
  return (
    <div className="card p-4 space-y-4">
      {title && <Skeleton className="h-5 w-40" />}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}

// Grid (habit cells) skeleton
function GridSkeleton({ cells = 30 }) {
  return (
    <div className="card p-4 space-y-4">
      <Skeleton className="h-5 w-52" />
      <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-14 gap-2">
        {Array.from({ length: cells }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// Heatmap skeleton (quarter blocks look)
function HeatmapSkeleton() {
  return (
    <div className="card p-3 space-y-3">
      <div className="space-y-2">
        {[0,1,2].map(q => (
          <div key={q} className="flex gap-[2px]">
            {Array.from({ length: 20 }).map((_, c) => (
              <div key={c} className="flex flex-col gap-[2px]">
                {Array.from({ length: 7 }).map((_, r) => (
                  <Skeleton key={r} className="h-3 w-3 rounded-[2px]" />
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
