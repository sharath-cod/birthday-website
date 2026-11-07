# Weekly reminder update (Android app v1.1)

Students now get a pop-up notification once a week, reminding them to log their weekly progress and follow their plan.
No backend change and no redeploy of Render/Vercel is needed. Only the Android app changes.

## What was added

| Item | File |
|---|---|
| Reminder logic (schedule, cancel, test, tap handling) | `frontend/src/utils/reminders.js` |
| Background manager (asks permission once, re-schedules on login) | `frontend/src/components/ReminderManager.jsx` |
| Settings card: on/off, day, time, "Send test" | `frontend/src/components/ReminderCard.jsx` (shown on *Weekly progress*) |
| Overdue banner on the student dashboard (7+ days with no update) | `frontend/src/pages/student/Dashboard.jsx` |
| Status-bar bell icon | `frontend/android/app/src/main/res/drawable/ic_stat_reminder.xml` |
| New plugin `@capacitor/local-notifications` | `frontend/package.json`, `capacitor.config.json` |
| Version bump 1 -> 2 (needed so phones accept the update) | `frontend/android/app/build.gradle` |

## How it behaves

- Default: **every Sunday at 6:00 PM**. Each student can change the day/time or switch it off on *Weekly progress*.
- The pop-up quotes the student's own goal from last week ("Your plan was: ... Did you do it?") so it reminds them to follow their schedule, not just to open the app.
- Tapping the notification opens the *Weekly progress* page.
- It is scheduled on the phone, so it works offline and with the app closed, and is restored after a reboot.
- Logging out (or an admin logging in on that phone) cancels it. If a session simply expires, the reminder keeps firing until the student opens the app.
- Android 13+ shows one permission prompt the first time a student opens the app after the update.
- The reminder text refreshes each time the student opens the app or saves a week.
- Known limits: it fires weekly even if the week is already logged, and some phones (Xiaomi, Oppo, Vivo, Realme, OnePlus) delay or block background alarms until battery settings are relaxed (see Troubleshooting).

## Deployment steps

You need the same setup as DEPLOYMENT.md Step 7 (Node 22+, Android Studio with JDK 21 and SDK 36).

### 1. Install the new plugin and rebuild
```bash
cd frontend
npm install
npm run build:android      # builds the website, copies it into android/, registers the plugin
```
Check the output lists `@capacitor/local-notifications` among the "Capacitor plugins for android".

### 2. Open in Android Studio and let Gradle sync
```bash
npm run android:open
```
Wait for "Gradle sync finished". If it asks to install SDK 36, click Install.

### 3. Test on a real phone first
1. USB-debugging phone -> pick it in Android Studio -> press Run.
2. Log in as a student, allow notifications when asked.
3. Open **Weekly progress** -> in the *Weekly reminder* card press **Send test**.
4. Press the Home button. Within about 5 seconds a pop-up banner should appear. Tap it: the app opens on Weekly progress.
5. Optional: set the day/time to 2 minutes from now, press Save, close the app, and wait for it.

### 4. Build the release APK (same keystore as before)
Build -> **Generate Signed App Bundle / APK** -> APK -> choose your **existing** `.jks` keystore -> *release* -> Finish.
Output: `frontend/android/app/release/app-release.apk`.

> You MUST sign with the same keystore as the first version. A different key makes phones refuse the update
> and students would have to uninstall (losing their login).

Command-line alternative (debug build only): `cd frontend/android && ./gradlew assembleDebug`.

### 5. Share the update
- GitHub -> Releases -> new release `v1.1` -> attach `app-release.apk` (or replace the Google Drive file).
- Students install it **over** the old app (do not uninstall). They stay logged in.
- Tell students: open the app once after updating and tap **Allow** on the notification prompt.

### 6. Commit the code
```bash
git add .
git commit -m "Add weekly progress reminder notification (v1.1)"
git push
```
Vercel redeploys the website automatically; the website itself is unchanged for browser users (the reminder card just says it is available in the Android app).

## Troubleshooting

| Problem | Fix |
|---|---|
| No permission prompt appears | Phone Settings -> Apps -> Career Tracker -> Notifications -> turn on. Then open *Weekly progress*, switch the reminder Off and On. |
| Test works but the weekly one never shows | Battery settings -> Career Tracker -> set to *Unrestricted / No restrictions*; on Xiaomi/Oppo/Vivo/Realme also enable *Autostart*. |
| Notification arrives silently with no pop-up banner | Phone Settings -> Apps -> Career Tracker -> Notifications -> "Weekly progress reminder" -> set to *Pop on screen / Alerting*. |
| `Plugin not found` / `LocalNotifications is not implemented` | You skipped step 1. Run `npm run build:android` again, then rebuild the APK. |
| Phone says "App not installed" when updating | The APK was signed with a different keystore, or `versionCode` is not higher than the installed one. |
| Gradle error about SDK 36 or JDK | Android Studio -> Settings -> SDK Manager -> install Android 16 (API 36); Gradle JDK must be 21. |

## Changing the default day/time
Edit `DEFAULT_PREFS` in `frontend/src/utils/reminders.js` (`weekday`: 1 = Sunday ... 7 = Saturday, `hour`: 0-23), then rebuild.
Students who already saved their own choice keep it.
