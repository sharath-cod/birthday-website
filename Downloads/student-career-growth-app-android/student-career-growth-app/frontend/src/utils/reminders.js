import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import api from '../services/api.js';

// Weekly "update your progress" reminder, scheduled ON THE PHONE (no server, no Firebase).
// It keeps firing every week even when the app is closed, and is restored after a reboot.

export const isNative = Capacitor.isNativePlatform();

const NOTIFICATION_ID = 4101;
const CHANNEL_ID = 'weekly-update';
export const REMINDER_ROUTE = '/student/weekly-progress';

// Same numbers the plugin uses: 1 = Sunday ... 7 = Saturday.
export const WEEKDAYS = [
  { value: 1, label: 'Sunday' },
  { value: 2, label: 'Monday' },
  { value: 3, label: 'Tuesday' },
  { value: 4, label: 'Wednesday' },
  { value: 5, label: 'Thursday' },
  { value: 6, label: 'Friday' },
  { value: 7, label: 'Saturday' },
];

export const DEFAULT_PREFS = { enabled: true, weekday: 1, hour: 18, minute: 0, asked: false };

const prefsKey = (uid) => `sct_reminder_${uid}`;

export function getPrefs(uid) {
  try {
    return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(prefsKey(uid)) || '{}') };
  } catch (e) {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(uid, prefs) {
  localStorage.setItem(prefsKey(uid), JSON.stringify(prefs));
}

export const timeToInput = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

export function describeSchedule({ weekday, hour, minute }) {
  const day = WEEKDAYS.find((d) => d.value === weekday)?.label || 'Sunday';
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return `every ${day} at ${d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
}

// 'granted' | 'denied' | 'prompt'
export async function getPermission() {
  if (!isNative) return 'denied';
  try {
    const { display } = await LocalNotifications.checkPermissions();
    return display === 'granted' ? 'granted' : display === 'denied' ? 'denied' : 'prompt';
  } catch (e) {
    return 'denied';
  }
}

export async function requestPermission() {
  if (!isNative) return 'denied';
  try {
    const { display } = await LocalNotifications.requestPermissions();
    return display === 'granted' ? 'granted' : 'denied';
  } catch (e) {
    return 'denied';
  }
}

// importance 4 = "high": Android shows it as a heads-up pop-up banner instead of only a silent icon.
async function ensureChannel() {
  await LocalNotifications.createChannel({
    id: CHANNEL_ID,
    name: 'Weekly progress reminder',
    description: 'Reminds you to log your weekly progress and follow your plan',
    importance: 4,
    visibility: 1,
    vibration: true,
    lights: true,
  });
}

const clip = (s, n) => (s.length > n ? `${s.slice(0, n - 1).trim()}…` : s);

// The text shows last week's own goal, so the reminder is about THEIR plan, not a generic message.
async function buildMessage() {
  const fallback = {
    title: 'Time for your weekly update',
    body: 'Log what you learned this week and set your goal for next week.',
  };
  try {
    const { data } = await api.get('/progress');
    const items = data.items || [];
    const last = items[items.length - 1];
    if (!last) return { title: fallback.title, body: 'Log Week 1 to start your growth history.' };
    const goal = String(last.nextGoal || '').replace(/\s+/g, ' ').trim();
    return {
      title: `Week ${last.weekNumber + 1} update time`,
      body: goal
        ? `Your plan was: "${clip(goal, 110)}". Did you do it? Log your progress now.`
        : fallback.body,
    };
  } catch (e) {
    return fallback; // offline or session expired: still remind, with the generic text
  }
}

export async function cancelReminder() {
  if (!isNative) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }] });
  } catch (e) { /* nothing was scheduled */ }
}

// Replaces any existing reminder with one built from `prefs`. Returns true if scheduled.
export async function scheduleReminder(prefs) {
  if (!isNative) return false;
  await cancelReminder();
  if (!prefs.enabled) return false;
  if ((await getPermission()) !== 'granted') return false;

  await ensureChannel();
  const { title, body } = await buildMessage();
  await LocalNotifications.schedule({
    notifications: [
      {
        id: NOTIFICATION_ID,
        title,
        body,
        largeBody: body,
        channelId: CHANNEL_ID,
        smallIcon: 'ic_stat_reminder',
        schedule: {
          on: { weekday: prefs.weekday, hour: prefs.hour, minute: prefs.minute, second: 0 },
          allowWhileIdle: true,
        },
        isExactNotification: false, // no special "alarms & reminders" permission needed
        autoCancel: true,
        extra: { route: REMINDER_ROUTE },
      },
    ],
  });
  return true;
}

// Fires one pop-up ~5 seconds from now so the student can check that it works on their phone.
export async function sendTestReminder() {
  if (!isNative) return false;
  if ((await getPermission()) !== 'granted') return false;
  await ensureChannel();
  const { title, body } = await buildMessage();
  await LocalNotifications.schedule({
    notifications: [
      {
        id: NOTIFICATION_ID + 1,
        title: `Test: ${title}`,
        body,
        largeBody: body,
        channelId: CHANNEL_ID,
        smallIcon: 'ic_stat_reminder',
        schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true },
        isExactNotification: false,
        autoCancel: true,
        extra: { route: REMINDER_ROUTE },
      },
    ],
  });
  return true;
}

// Calls `onOpen(route)` when the student taps a reminder. Returns a function that stops listening.
export async function onReminderTapped(onOpen) {
  if (!isNative) return () => {};
  const handle = await LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
    onOpen(event.notification?.extra?.route || REMINDER_ROUTE);
  });
  return () => handle.remove();
}

// Re-reads the progress list and re-schedules, so the text always shows the newest goal.
export async function refreshReminder(uid) {
  if (!isNative || !uid) return;
  try { await scheduleReminder(getPrefs(uid)); } catch (e) { /* never block the app for a reminder */ }
}
