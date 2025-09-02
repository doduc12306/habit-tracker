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
const memo = React.memo;

// component references from global scope
const MemoizedMiniCalendar = memo(MiniCalendar);
const MemoizedHabitScheduleButton = memo(HabitScheduleButton);
const MemoizedMonthYearPicker = memo(MonthYearPicker);
const MemoizedAddHabit = memo(AddHabit);

const MemoizedHabitListItem = memo(({ habit, progress, onRemove, onUpdateSchedule }) => (
    <li className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3">
        <div>
            <div className="font-medium text-slate-900">{habit.name}</div>
            <div className="text-xs text-slate-500">{progress.pct}% complete</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
            <MemoizedHabitScheduleButton habit={habit} onChange={(s) => onUpdateSchedule(habit.id, s)} />
            <button onClick={() => onRemove(habit.id)} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-red-600 hover:bg-red-50 transition-colors">Remove</button>
        </div>
    </li>
));

const MemoizedHabitRow = memo(({ habit, monthChecks, daysList, ym, onToggle }) => {
    const row = monthChecks[habit.id] || {};
    const dayGridTemplate = `repeat(${daysList.length}, minmax(var(--day-min),1fr))`;
    return (
        <div className="grid items-center justify-items-center gap-2 px-3 border-b border-slate-200 bg-white" style={{ gridTemplateColumns: dayGridTemplate, minHeight: "var(--row-h)" }}>
            {daysList.map(d => {
                const date = new Date(ym[0], ym[1], d);
                const active = isActiveOnDate(habit, date);
                const checked = !!row[d];
                const base = "h-9 w-9 rounded-lg border text-sm transition-all shadow-sm outline-none ring-1 ring-transparent focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 focus:ring-offset-white flex items-center justify-center";
                const activeUnchecked = "border-slate-300 bg-white hover:bg-green-50 hover:border-green-400";
                const activeChecked = "border-green-600 bg-green-600 text-white font-bold";
                const inactive = "border-dashed border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed";
                return (
                    <button key={d} onClick={() => active && onToggle(habit.id, d)} className={[base, active ? (checked ? activeChecked : activeUnchecked) : inactive].join(" ")} title={`Day ${d}${active ? "" : " (inactive)"}`} disabled={!active}>{checked ? "✓" : ""}</button>
                );
            })}
        </div>
    );
});

const MemoizedDailyCompletionBar = memo(({ perDayCompletion, daysList, dayGridTemplate, allDoneDays }) => (
    <div className="px-3 py-4 bg-white">
        <div className="grid items-end gap-2" style={{ gridTemplateColumns: dayGridTemplate }}>
            {daysList.map((i) => {
                const o = perDayCompletion[i - 1];
                const h = o.activeCount ? (o.doneCount / o.activeCount) * parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bar-max-h')) : 0;
                return (
                    <div key={i} className="w-full rounded-t bg-green-500" title={`Day ${i}: ${o.doneCount}/${o.activeCount}`} style={{ height: `${h}px`, transition: "height 300ms ease" }} />
                );
            })}
        </div>
        <div className="mt-2 text-xs text-slate-500">{allDoneDays.size} day(s) with all active habits completed.</div>
    </div>
));

const StreakDisplay = memo(({ streak }) => (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-medium uppercase tracking-wider text-slate-500">Streak</div>
        <div className="mt-1 text-3xl font-bold text-slate-900">{streak.current}<span className="text-xl font-medium text-slate-400"> / {streak.longest}</span></div>
        <div className="mt-1 text-xs text-slate-500">Current vs longest streak of 100% completion.</div>
    </div>
));

const MonthInfo = memo(({ monthStart, totalDays }) => (
    <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center">
            <div className="text-xs uppercase tracking-wide text-slate-500">Start</div>
            <div className="mt-1 text-2xl font-semibold text-slate-800">{MONTHS_ABBR[monthStart.getMonth()]} 1</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center">
            <div className="text-xs uppercase tracking-wide text-slate-500">End</div>
            <div className="mt-1 text-2xl font-semibold text-slate-800">{endOfMonth(monthStart).getDate()}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center">
            <div className="text-xs uppercase tracking-wide text-slate-500">Days</div>
            <div className="mt-1 text-2xl font-semibold text-slate-800">{String(totalDays)}</div>
        </div>
    </div>
));

const AppHeader = memo(({ user, onSignIn, onSignOut }) => (
    <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
                <h1 className="text-xl font-bold text-slate-900">Habit Tracker</h1>
                <div className="flex items-center gap-4">
                    {user ? (
                        <>
                            <span className="text-sm font-medium">Welcome, {user.displayName}</span>
                            <button onClick={onSignOut} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">Sign Out</button>
                        </>
                    ) : (
                        <button onClick={onSignIn} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 transition-colors">Sign in with Google</button>
                    )}
                </div>
            </div>
        </div>
    </header>
));

const HabitManager = memo(({ habits, perHabitProgress, onAdd, onRemove, onUpdateSchedule }) => (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Manage Habits</h2>
        <ul className="space-y-2">
            {habits.map(h => (
                <MemoizedHabitListItem
                    key={h.id}
                    habit={h}
                    progress={perHabitProgress.find(x => x.id === h.id) || { pct: 0 }}
                    onRemove={onRemove}
                    onUpdateSchedule={onUpdateSchedule}
                />
            ))}
        </ul>
        <MemoizedAddHabit onAdd={onAdd} />
    </div>
));

const Notes = memo(() => (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Notes</h2>
        <textarea
            className="w-full h-32 rounded-md border border-slate-300 p-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Write your notes here..."
        ></textarea>
    </div>
));

const HabitGrid = memo(({ habits, monthChecks, daysList, dayGridTemplate, ym, onToggle, perDayCompletion, allDoneDays }) => (
  <div className="w-full overflow-hidden">
    <div className="grid grid-cols-[var(--side-w)_minmax(0,1fr)] border-b border-slate-200 bg-slate-100">
      <div className="flex items-center px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-600 border-r border-slate-200">Habit</div>
      <div className="relative">
        <div className="fade-left absolute inset-y-0 left-0"></div>
        <div className="grid items-center gap-2 px-3 py-2 text-center text-[11px] font-medium text-slate-500 justify-items-center" style={{ gridTemplateColumns: dayGridTemplate }}>
          {daysList.map(d => <div key={d} className="rounded-md w-full select-none">{d}</div>)}
        </div>
      </div>
    </div>
    <div className="grid grid-cols-[var(--side-w)_minmax(0,1fr)]">
      <div className="border-r border-slate-200 bg-slate-50">
        {habits.map(h => (
          <div key={h.id} className="flex items-center gap-3 px-3 text-sm text-slate-800 border-b border-slate-200 bg-white" style={{ width: 'var(--side-w)', minWidth: 'var(--side-w)', height: 'var(--row-h)' }}>
            <div className="h-2 w-2 rounded-full bg-slate-700" />
            <div className="font-medium truncate" title={h.name}>{h.name}</div>
          </div>
        ))}
        <div className="px-3 py-3 border-t border-slate-200 bg-white text-xs text-slate-500" style={{ width: 'var(--side-w)', minWidth: 'var(--side-w)' }}>Daily Completion</div>
      </div>
      <div className="relative overflow-x-auto bg-white">
        <div className="min-w-full">
          {habits.map(h => (
            <MemoizedHabitRow
              key={h.id}
              habit={h}
              monthChecks={monthChecks}
              daysList={daysList}
              ym={ym}
              onToggle={onToggle}
            />
          ))}
          <MemoizedDailyCompletionBar perDayCompletion={perDayCompletion} daysList={daysList} dayGridTemplate={dayGridTemplate} allDoneDays={allDoneDays} />
        </div>
      </div>
    </div>
  </div>
));

const Dashboard = memo(({ monthStart, totalDays, allDoneDays, allStreak }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MemoizedMiniCalendar monthStart={monthStart} days={totalDays} allDoneDays={allDoneDays} />
        <div className="space-y-4">
            <StreakDisplay streak={allStreak} />
            <MonthInfo monthStart={monthStart} totalDays={totalDays} />
        </div>
    </div>
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
  
  const [ym, setYm] = useLocalStorage("ht_ym", [today.getFullYear(), today.getMonth()]);
  const [habits, setHabits] = useLocalStorage("ht_habits", []);
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

  const allStreak = useMemo(() => computeAllDoneStreak(allDoneDays, totalDays), [allDoneDays, totalDays]);

  // --- RENDER ---
  if (loading) {
      return <div className="flex justify-center items-center min-h-screen text-lg">Loading...</div>
  }

  return (
    <div className="min-h-screen text-slate-800 flex flex-col">
      <AppHeader user={user} onSignIn={handleSignIn} onSignOut={handleSignOut} />
      <div className="flex-1 w-full">
      {!user ? (
        <div className="text-center p-10 max-w-lg mx-auto">
            <h2 className="text-3xl font-bold tracking-tight">Habit Tracker</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">Sign in with Google to start managing your habits and tracking your daily progress.</p>
        </div>
      ) : (
        <main className="mx-auto max-w-screen-2xl p-4 sm:p-6 lg:p-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            <div className="md:w-64"><MemoizedMonthYearPicker value={ym} onChange={setYm} /></div>
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="card py-3 text-center">
                <div className="text-xs uppercase tracking-wide text-slate-500">Habits</div>
                <div className="mt-1 text-2xl font-semibold">{habits.length}</div>
              </div>
              <div className="card py-3 text-center">
                <div className="text-xs uppercase tracking-wide text-slate-500">All-done days</div>
                <div className="mt-1 text-2xl font-semibold">{allDoneDays.size}</div>
              </div>
              <div className="card py-3 text-center">
                <div className="text-xs uppercase tracking-wide text-slate-500">Streak</div>
                <div className="mt-1 text-2xl font-semibold">{allStreak.current}<span className="text-sm font-medium text-slate-400"> / {allStreak.longest}</span></div>
              </div>
              <div className="card py-3 text-center">
                <div className="text-xs uppercase tracking-wide text-slate-500">Days in month</div>
                <div className="mt-1 text-2xl font-semibold">{totalDays}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="space-y-6 order-last lg:order-first">
              <div className="card">
                <h2 className="text-lg font-semibold mb-3">Habits</h2>
                <ul className="space-y-2 mb-4">
                  {habits.map(h => (
                    <MemoizedHabitListItem
                      key={h.id}
                      habit={h}
                      progress={perHabitProgress.find(x => x.id === h.id) || { pct:0 }}
                      onRemove={removeHabit}
                      onUpdateSchedule={updateHabitSchedule}
                    />
                  ))}
                </ul>
                <MemoizedAddHabit onAdd={addHabit} />
              </div>
              <div className="card">
                <h2 className="text-lg font-semibold mb-3">Notes</h2>
                <textarea className="w-full h-40 rounded-md border border-slate-300 p-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Note here..." />
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="card">
                <MemoizedMiniCalendar monthStart={monthStart} days={totalDays} allDoneDays={allDoneDays} />
              </div>
              <div className="card p-0 overflow-hidden">
                <HabitGrid
                  habits={habits}
                  monthChecks={monthChecks}
                  daysList={daysList}
                  dayGridTemplate={dayGridTemplate}
                  ym={ym}
                  onToggle={toggle}
                  perDayCompletion={perDayCompletion}
                  allDoneDays={allDoneDays}
                />
              </div>
            </div>
          </div>
        </main>
      )}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
