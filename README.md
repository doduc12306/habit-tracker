## ✨ Features
- Google Sign-In (per-user Firestore namespace `users/{uid}`)
- Add / remove habits and configure schedule modes
- 3 schedule modes:
  - `weekdays`: select active weekdays
  - `dom`: explicit days of month (e.g. 1,10,20)
  - `quota`: N times per week (0–7)
- Daily check grid + per-day completion bar
- Mini calendar highlighting 100% completion days
- Streak (current / longest) of consecutive full‑completion days (within viewed month)
- Simple timer (Pomodoro style) & quick notes panel
- Offline-first: habits & check marks cached in `localStorage`; auto-syncs after login / month switch

## 🗂 Directory Structure
```
public/
  index.html          # Entry: loads React, Firebase SDK, Babel and scripts
  src/
    App.js            # Main logic + UI layout
    utils.js          # Date / schedule helpers, streak calc
    components/
      AddHabit.js
      HabitScheduleButton.js
      MiniCalendar.js
      MonthYearPicker.js
      Timer.js
firebase.json         # Hosting + emulator config
firestore.rules       # (Simplified) security rules
firestore.indexes.json
```
Everything runs via `<script type="text/babel">` and globals; no bundler yet.

## � Getting Started

To run this project, you'll need your own Firebase project.

1.  **Create a Firebase Project**: Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  **Enable Services**:
    *   In your new project, go to **Build > Firestore Database** and create a database.
    *   Go to **Build > Authentication**, click "Get started", and enable the **Google** sign-in provider.
3.  **Get Config**: In your project's settings (click the gear icon ⚙️), scroll down to "Your apps" and create a new Web app. Copy the `firebaseConfig` object.
4.  **Configure Locally**:
    *   In this repository, copy the file `public/firebase-config.js.example` to a new file named `public/firebase-config.js`.
    *   Paste your `firebaseConfig` object into `public/firebase-config.js`. This file is ignored by Git, so your keys won't be exposed.

## �🔧 Local Development

Once you have set up your `firebase-config.js`, you can run the project locally. Requires Firebase CLI (`firebase login`).

```bash
firebase emulators:start --only hosting,firestore
```
Visit http://localhost:5000

## 🚀 Deploy
Deploy rules & hosting:
```bash
firebase deploy
```

## 🔐 Firestore Rules (summary)
- Only the owner (`request.auth.uid == userId`) can read/write.
- Writable docs: `users/{uid}/meta/habits` and `users/{uid}/months/{ym}`.
- Basic size caps (can be hardened later).

## 🗃 Data Model
```
users/{uid}/meta/habits { habits: [ { id, name, schedule } ] }
users/{uid}/months/{YYYY-M} { habitId: { dayNumber: true } }
```
`schedule` variants:
```
{ mode: 'weekdays', daysOfWeek: [bool x7] }
{ mode: 'dom', daysOfMonth: [1,10,20] }
{ mode: 'quota', timesPerWeek: 3 }
```

## ♻️ Sync & Offline
- On login: fetch habits + current month doc; create with defaults if missing (using any cached local copy first).
- On toggle: merge update only the changed habit/day inside `users/{uid}/months/{ym}`.
- Local cache keys: `ht_ym`, `ht_habits`, `ht_checks`.

## ⚠️ Considerations
- Merge writes keep bandwidth low; watch doc size if habits > ~200.
- `quota` progress currently sums capped completions per week (weeks wholly within month view).


## 📝 License
Released under the MIT License. 
