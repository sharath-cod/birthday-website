import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Bell, BellOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  WEEKDAYS, describeSchedule, getPermission, getPrefs, isNative, requestPermission,
  savePrefs, scheduleReminder, sendTestReminder, timeToInput,
} from '../utils/reminders.js';

// Lets the student switch the weekly reminder on/off and choose the day and time.
export default function ReminderCard() {
  const { user } = useAuth();
  const uid = user?.id;
  const [prefs, setPrefs] = useState(() => getPrefs(uid));
  const [permission, setPermission] = useState('prompt');
  const [busy, setBusy] = useState(false);

  useEffect(() => { getPermission().then(setPermission); }, []);

  if (!isNative) {
    return (
      <div className="card mb-6 flex items-start gap-3 p-4 text-sm text-muted">
        <Bell size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p>Weekly reminders are available in the Android app. Install the app to get a pop-up on your phone each week.</p>
      </div>
    );
  }

  async function apply(next, message) {
    setBusy(true);
    try {
      let perm = permission;
      if (next.enabled && perm !== 'granted') {
        perm = await requestPermission();
        setPermission(perm);
      }
      savePrefs(uid, { ...next, asked: true });
      setPrefs({ ...next, asked: true });
      if (!next.enabled) {
        await scheduleReminder(next); // cancels the existing one
        toast.success('Weekly reminder turned off');
      } else if (perm === 'granted') {
        await scheduleReminder(next);
        toast.success(message || `Reminder set ${describeSchedule(next)}`);
      } else {
        toast.error('Notifications are blocked for this app.');
      }
    } catch (e) {
      toast.error('Could not set the reminder. Try again.');
    } finally {
      setBusy(false);
    }
  }

  const onTime = (value) => {
    const [h, m] = (value || '18:00').split(':').map(Number);
    setPrefs((p) => ({ ...p, hour: h, minute: m }));
  };

  async function test() {
    setBusy(true);
    try {
      const ok = await sendTestReminder();
      if (ok) toast.success('A test reminder will pop up in about 5 seconds. Lock your phone or press Home to see it.');
      else toast.error('Allow notifications first.');
    } catch (e) {
      toast.error('Could not send the test reminder.');
    } finally {
      setBusy(false);
    }
  }

  const blocked = permission === 'denied';

  return (
    <section className="card mb-6 p-5" aria-labelledby="reminder-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {prefs.enabled && !blocked ? <Bell size={20} className="mt-0.5 text-pine" aria-hidden="true" /> : <BellOff size={20} className="mt-0.5 text-muted" aria-hidden="true" />}
          <div>
            <h2 id="reminder-heading" className="text-base font-bold">Weekly reminder</h2>
            <p className="text-sm text-muted">
              {prefs.enabled && !blocked ? `On: ${describeSchedule(prefs)}.` : 'Off. Turn it on to get a pop-up that reminds you to log your week and follow your plan.'}
            </p>
          </div>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            className="h-5 w-5 accent-[rgb(var(--pine))]"
            checked={prefs.enabled}
            disabled={busy}
            onChange={(e) => apply({ ...prefs, enabled: e.target.checked })}
          />
          {prefs.enabled ? 'On' : 'Off'}
        </label>
      </div>

      {blocked && (
        <p className="mt-3 rounded-md bg-danger-light p-3 text-sm text-danger">
          Notifications are blocked. Open your phone <strong>Settings → Apps → Career Tracker → Notifications</strong> and allow them, then come back here.
        </p>
      )}

      {prefs.enabled && (
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
          <div>
            <label htmlFor="reminder-day" className="mb-1.5 block text-sm font-medium">Day</label>
            <select id="reminder-day" className="input" value={prefs.weekday} onChange={(e) => setPrefs((p) => ({ ...p, weekday: Number(e.target.value) }))}>
              {WEEKDAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="reminder-time" className="mb-1.5 block text-sm font-medium">Time</label>
            <input id="reminder-time" type="time" className="input" value={timeToInput(prefs.hour, prefs.minute)} onChange={(e) => onTime(e.target.value)} />
          </div>
          <button className="btn-primary" disabled={busy} onClick={() => apply(prefs)}>Save</button>
          <button className="btn-ghost" disabled={busy || blocked} onClick={test}>Send test</button>
        </div>
      )}
      {prefs.enabled && (
        <p className="mt-3 text-xs text-muted">
          If reminders don't appear on your phone, allow the app to run in the background (battery settings → Career Tracker → "Unrestricted" / "No restrictions").
        </p>
      )}
    </section>
  );
}
