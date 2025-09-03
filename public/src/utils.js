const MONTHS_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS_LABEL = ["M", "T", "W", "T", "F", "S", "S"];

function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate() }
function isToday(date) { const t = new Date(); return date.getFullYear() === t.getFullYear() && date.getMonth() === t.getMonth() && date.getDate() === t.getDate() }
function monFirstIndex(date) { return (date.getDay() + 6) % 7 }
function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1) }
function endOfMonth(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0) }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x }
function startOfWeek(d) { const idx = monFirstIndex(d); return addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -idx) }
function endOfWeek(d) { return addDays(startOfWeek(d), 6) }

function isActiveOnDate(habit, date) {
  const sched = habit.schedule || { mode: "weekdays", daysOfWeek: Array(7).fill(true) };
  const idx = monFirstIndex(date);
  if (sched.mode === "weekdays") return !!(sched.daysOfWeek || [])[idx];
  if (sched.mode === "dom") return (sched.daysOfMonth || []).includes(date.getDate());
  if (sched.mode === "quota") return true;
  return true;
}

function computeAllDoneStreak(allDoneDays, totalDays, limitDay) {
  // limitDay: only count days up to this (to ignore future days in current month)
  const maxDay = typeof limitDay === 'number' ? Math.min(limitDay, totalDays) : totalDays;
  if (maxDay <= 0) return { current: 0, longest: 0 };
  // longest streak scanning forward up to maxDay
  let longest = 0, cur = 0;
  for (let d = 1; d <= maxDay; d++) {
    if (allDoneDays.has(d)) {
      cur++;
      if (cur > longest) longest = cur;
    } else {
      cur = 0;
    }
  }
  // current streak scanning backward starting at maxDay
  let current = 0;
  for (let d = maxDay; d >= 1; d--) {
    if (allDoneDays.has(d)) current++; else break;
  }
  return { current, longest };
}

// expose globals
window.MONTHS_FULL = MONTHS_FULL;
window.MONTHS_ABBR = MONTHS_ABBR;
window.WEEKDAYS_LABEL = WEEKDAYS_LABEL;
window.daysInMonth = daysInMonth;
window.isToday = isToday;
window.monFirstIndex = monFirstIndex;
window.startOfMonth = startOfMonth;
window.endOfMonth = endOfMonth;
window.addDays = addDays;
window.startOfWeek = startOfWeek;
window.endOfWeek = endOfWeek;
window.isActiveOnDate = isActiveOnDate;
window.computeAllDoneStreak = computeAllDoneStreak;
