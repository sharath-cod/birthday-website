import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { cancelReminder, getPermission, getPrefs, isNative, onReminderTapped, requestPermission, savePrefs, scheduleReminder } from '../utils/reminders.js';

// Invisible. Keeps the phone's weekly reminder in step with who is logged in.
export default function ReminderManager() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const studentId = user?.role === 'student' ? user.id : null;
  const isAdmin = user?.role === 'admin';

  // Tapping the pop-up opens the weekly progress page.
  useEffect(() => {
    if (!isNative) return undefined;
    let stop = () => {};
    let cancelled = false;
    onReminderTapped((route) => navigate(route)).then((fn) => { if (cancelled) fn(); else stop = fn; });
    return () => { cancelled = true; stop(); };
  }, [navigate]);

  // A student opened the app: ask permission once, then (re)schedule with the latest goal text.
  useEffect(() => {
    if (!isNative || loading || !studentId) return;
    (async () => {
      try {
        const prefs = getPrefs(studentId);
        if (!prefs.enabled) return;
        let permission = await getPermission();
        if (permission === 'prompt' && !prefs.asked) {
          savePrefs(studentId, { ...prefs, asked: true });
          permission = await requestPermission();
        }
        if (permission === 'granted') await scheduleReminder(prefs);
      } catch (e) { /* a reminder problem must never break the app */ }
    })();
  }, [studentId, loading]);

  // Teachers/admins don't get student reminders (matters on a shared phone).
  useEffect(() => {
    if (isNative && !loading && isAdmin) cancelReminder();
  }, [isAdmin, loading]);

  return null;
}
