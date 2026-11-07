# Deploying Student Career Growth Tracker (free, live)

Target setup (all free tiers):

| Part | Service | Why |
|---|---|---|
| Database (all text data and logins) | MongoDB Atlas M0 | 512 MB, no time limit |
| Certificate files | Cloudinary Free | Keeps big files out of the 512 MB database |
| Backend API | Render (Web Service, Free) | Runs Node/Express |
| Frontend | Vercel or Netlify or Cloudflare Pages | Static React build |
| Code | GitHub | All three deploy from a repo |

Order matters: **Database -> Cloudinary -> Backend -> Frontend -> link them (CORS) -> create admin.**

---

## Step 0. Put the code on GitHub
```bash
cd student-career-tracker
git init
git add .
git commit -m "Student Career Growth Tracker"
# create an EMPTY repo on github.com (Private is fine), then:
git remote add origin https://github.com/<your-user>/student-career-tracker.git
git branch -M main
git push -u origin main
```
`.gitignore` already excludes `.env` and `node_modules`. Check on GitHub that no `.env` file was uploaded.

## Step 1. MongoDB Atlas (database)
1. Sign up at https://www.mongodb.com/cloud/atlas.
2. Create a project, then **Create a cluster -> M0 Free**. Pick a region close to your Render region (e.g. Mumbai/Singapore for India).
3. **Database Access -> Add New Database User**: username `tracker_app`, a strong generated password, role **Read and write to any database**. Save the password.
4. **Network Access -> Add IP Address -> Allow access from anywhere (0.0.0.0/0)**. Render's free plan has no fixed outbound IP, so this is required. Your protection is the long database password, so keep it strong.
5. **Database -> Connect -> Drivers**, copy the string and edit it:
   ```
   mongodb+srv://tracker_app:<PASSWORD>@cluster0.xxxxx.mongodb.net/student_career_tracker?retryWrites=true&w=majority
   ```
   - Replace `<PASSWORD>`. If it contains `@ : / ? # %`, URL-encode them (or just generate a password with letters and digits only).
   - Keep `/student_career_tracker` before the `?`, otherwise data lands in a database called `test`.

## Step 1b. Cloudinary (certificate files)
1. Sign up at https://cloudinary.com (free plan, no card).
2. Dashboard -> **Settings -> API Keys**. Note the **Cloud name**, **API Key** and **API Secret**.
3. **Settings -> Security**: turn ON **"PDF and ZIP files delivery"** if it is off. (This app downloads files with signed links, but turning it on avoids PDF problems on new accounts.)
4. Never put the API Secret in GitHub or in chat. It goes only into Render's environment variables (Step 2).

Files are uploaded as *authenticated* assets: they have no public link. Only the API can fetch them, and the API only hands a file to the student who owns it or to an admin.

## Step 2. Backend on Render
1. Sign up at https://render.com with GitHub.
2. **New -> Web Service** -> connect your repo.
3. Settings:
   - Name: `career-tracker-api`
   - Region: same area as Atlas
   - Root Directory: `backend`
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: **Free**
4. **Environment Variables**:
   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `MONGO_URI` | the Atlas string from Step 1 |
   | `JWT_SECRET` | 48+ random bytes: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CLIENT_URL` | leave a placeholder for now, fill in at Step 4 |
   | `NODE_VERSION` | `20` |
   | `CLOUDINARY_CLOUD_NAME` | from Step 1b |
   | `CLOUDINARY_API_KEY` | from Step 1b |
   | `CLOUDINARY_API_SECRET` | from Step 1b |
   Do not set `PORT`; Render provides it.
5. **Create Web Service**. In the log, look for `Certificate files are stored in: Cloudinary`. If it says MongoDB, one of the three CLOUDINARY variables is missing or misspelled. When the log says `API running on ...`, open
   `https://career-tracker-api.onrender.com/api/health`. You should see `{"success":true,"status":"ok",...}`.

## Step 3. Frontend on Vercel (or Netlify)
**Vercel**
1. https://vercel.com -> **Add New -> Project** -> import the repo.
2. Root Directory: `frontend`. Framework preset: Vite (auto-detected). Build: `npm run build`, output: `dist`.
3. Environment variable (must be set BEFORE the build, Vite bakes it in):
   `VITE_API_URL` = `https://career-tracker-api.onrender.com/api`
4. Deploy. Note the URL, e.g. `https://career-tracker.vercel.app`.

`frontend/vercel.json` is already included so refreshing on `/student/dashboard` works instead of showing 404.

**Netlify / Cloudflare Pages instead:** base directory `frontend`, build `npm run build`, publish `dist`, same `VITE_API_URL` variable. `frontend/public/_redirects` handles page refreshes.

Licensing note: Vercel's free Hobby plan is meant for personal, non-commercial use. A college project is usually fine, but if the college runs it officially, Netlify or Cloudflare Pages are safer choices. Check their current terms.

## Step 4. Connect frontend and backend (CORS)
In Render -> your service -> Environment, set
`CLIENT_URL` = `https://career-tracker.vercel.app` (exact origin, **no trailing slash**).
Several origins are comma-separated, and `*` works as a wildcard (useful for Vercel preview URLs):
`https://career-tracker.vercel.app,https://career-tracker-*.vercel.app,https://tracker.yourcollege.edu`.
Render redeploys automatically. The Android app's origins (`https://localhost`, `capacitor://localhost`) are built into the server, so you do not add them here.
If a request is blocked, the Render log shows `CORS blocked origin: <the exact origin>`. Copy that value into `CLIENT_URL`.

## Step 5. Create the admin account
Free Render services have no shell, so run the seed script from your own computer against Atlas:
```bash
cd backend
# in backend/.env (local file, never committed):
#   MONGO_URI=<the Atlas string>
#   ADMIN_NAME=Head of Department
#   ADMIN_EMAIL=hod@yourcollege.edu
#   ADMIN_PASSWORD=<strong password, 8+ chars, letters and numbers>
npm install
npm run seed:admin
```
Then delete `ADMIN_PASSWORD` from the file. Log in at `https://<frontend>/admin/login`.

## Step 6. Live test checklist
1. `/api/health` returns ok.
2. Register a student on the live site, land on the dashboard, log out, log in again.
3. `/admin/login` works with the admin account, and refuses the student account.
4. As a student, open `/admin/dashboard` -> you are sent back to the student dashboard.
5. Refresh any page -> no 404.
6. As a student, add a certificate with a PDF, click **View file**, then delete the certificate. In Cloudinary -> Media Library -> folder `student-career-tracker/certificates` the file appears after upload and disappears after delete.

## Step 7. Android app (APK) - optional
The Android app is the same React site wrapped with Capacitor (`frontend/android/` is already generated). It talks to the same Render API, so no backend changes are needed.

**One-time setup on your computer**
1. Install **Node 22+**, then **Android Studio** (latest). It bundles JDK 21 and the Android SDK. On first start accept the default SDK install; Gradle may ask for **Android SDK 36**, so click *Install* if prompted.
2. `cd frontend && npm install`
3. Check `frontend/.env.production` contains your API URL (must end in `/api`):
   `VITE_API_URL=https://career-tracker-api-cjgl.onrender.com/api`

**Build and open the project**
```bash
cd frontend
npm run build:android     # builds the website and copies it into the Android project
npm run android:open      # opens Android Studio on frontend/android
```
Wait for Gradle sync to finish (the first sync downloads dependencies and can take several minutes).

**Test on your phone**
1. Phone: Settings -> About phone -> tap *Build number* 7 times; then Settings -> Developer options -> turn on *USB debugging*.
2. Plug the phone in via USB, tap *Allow*, pick the phone in the device dropdown at the top of Android Studio, click the green **Run** button.

**Create the APK to share**
- *Quick test APK:* Build -> Build Bundle(s) / APK(s) -> **Build APK(s)** -> click *locate*. File: `frontend/android/app/build/outputs/apk/debug/app-debug.apk`.
- *Release APK (recommended for students):* Build -> **Generate Signed App Bundle / APK** -> *APK* -> *Create new...* keystore (save the `.jks` file and both passwords somewhere safe) -> choose the *release* build type -> Finish. File: `frontend/android/app/release/app-release.apk`.
- *Command line alternative (debug APK):* `cd frontend/android && ./gradlew assembleDebug` (Windows: `gradlew.bat assembleDebug`). Needs `JAVA_HOME` (JDK 21) and `ANDROID_HOME` set.

**Keep the keystore safe.** Every future update must be signed with the same keystore, otherwise phones refuse to update the app and students must uninstall first. Never commit the `.jks` file (the repo `.gitignore` blocks it) and back it up outside the repo.

**Share it by link**
1. GitHub repo -> *Releases* -> *Draft a new release* -> attach `app-release.apk` -> Publish. Send students the release link (or upload to Google Drive with "Anyone with the link").
2. Student: open the link on the phone, download the `.apk`, tap it, allow *Install unknown apps* for the browser/Drive app when asked, tap *Install*. If Play Protect warns, choose *More details -> Install anyway* (normal for apps not from the Play Store).

**Updating the app**
The APK contains a copy of the website, so a website change reaches phones only through a new APK:
1. `git push` as usual (Vercel and Render update the website and API).
2. In `frontend/android/app/build.gradle` raise `versionCode` by 1 and change `versionName` (e.g. `"1.1"`).
3. `npm run build:android`, then build a signed release APK with the **same keystore**, and publish a new GitHub release.
Optional: if you would rather have the app always show the live website without rebuilding, add `"url": "https://<your-frontend>.vercel.app"` under `server` in `frontend/capacitor.config.json` and run `npm run build:android` once more. The app then needs internet to start, and Vercel's origin must be in `CLIENT_URL`.

**What works differently in the app**
- Excel/PDF downloads and certificate files open the Android share sheet (Save to Drive/Files, open in a PDF/Excel app, WhatsApp...). A phone cannot save blob links the way a desktop browser does.
- External links (GitHub, certificate verification) open in the phone's browser.
- The Android back button goes back one screen and exits from the first screen.
- The first login after a quiet period can take about a minute (Render free sleep), same as the website.

## Free-tier behaviour you should know about
- **Sleep:** a free Render web service spins down after 15 minutes without traffic and takes about a minute to wake. The first login after a quiet period will be slow. The frontend timeout is already 60 s for this. To avoid it, either pay $7/month for the Starter instance, or ping `/api/health` every 10-14 minutes with a free monitor such as UptimeRobot. Free services also share 750 instance hours per month, enough for one service running all month.
- **No persistent disk:** the free filesystem is wiped on every restart/deploy. Certificate files therefore live on Cloudinary, never on Render's disk.
- **Database size:** Atlas M0 is 512 MB. With files on Cloudinary, text records for 200 students use roughly 10-20 MB. Check Atlas -> Metrics once a month; consider upgrading above about 400 MB.
- **Cloudinary free plan:** limits are measured in monthly credits (storage + bandwidth + transformations), and can change. Check Dashboard -> Settings -> Usage once a month. Uploads in this app are capped at 2 MB per file. Roughly 200 students x 5 files x 1 MB = about 1 GB.
- **Backups:** the M0 free tier does not give you automatic backups. Export regularly from your computer:
  `mongodump --uri "<Atlas URI>" --out backup-$(date +%F)` (install MongoDB Database Tools first). Also useful: Atlas -> Collections -> Export.
- Free-tier terms change. Re-check the pricing pages of Render, Atlas, and your frontend host before relying on them for a whole semester.

## Running it for 100-200 students (all free)
- **Keep it awake:** create a free UptimeRobot monitor (HTTP, every 5-10 minutes) for `https://<your-api>.onrender.com/api/health`. Without it the first login of the day takes about a minute.
- **College Wi-Fi:** all students share one public IP. The limits are therefore high per IP (`RATE_LIMIT_MAX` 6000 and `AUTH_RATE_LIMIT_MAX` 600 per 15 minutes) and wrong-password protection is per account: 10 failed tries per email per 15 minutes. You can raise the IP limits with those two Render variables.
- **Weekly backup:** `mongodump --uri "<Atlas URI>" --out backup-$(date +%F)` and keep the folder on your computer or Drive. Certificate files are on Cloudinary and are not part of this dump; download them from the Cloudinary Media Library if you need a copy.
- **Monthly check (5 minutes):** Atlas storage, Cloudinary usage, Render logs for errors.
- **Registration day:** if 200 students register at the same minute, expect slow responses on a free Render instance (low CPU, password hashing). Ask them to register in batches, or upgrade Render to Starter for that day.
- **Admin dashboard** loads all students on each request. That is fine up to a few hundred; add pagination if you ever go past about 1000.

## Moving files that are already in MongoDB to Cloudinary
Only needed if students uploaded certificates before you turned Cloudinary on. Old files keep working meanwhile.
```bash
cd backend
# backend/.env (local, never committed) needs MONGO_URI (the Atlas string) and the three CLOUDINARY_* values
npm install
npm run migrate:files
```
It moves each file, removes the copy from MongoDB only after the upload succeeded, and is safe to run again.

## Security checklist before real students use it
- [ ] `JWT_SECRET` is long and random, different from your local one.
- [ ] Admin password is strong and not shared in chat/email.
- [ ] `CLIENT_URL` lists only your real frontend origins.
- [ ] No `.env` file in GitHub (`git ls-files | grep .env` shows only `.env.example`).
- [ ] Atlas user has a unique password used nowhere else.
- [ ] `CLOUDINARY_API_SECRET` exists only in Render's environment variables, not in GitHub or any chat.
- [ ] Tell students the site stores personal data (CGPA, attendance) and who can see it (the admins).

## Updating the live site
`git push` to `main` -> Render and Vercel redeploy automatically. If you change `VITE_API_URL`, trigger a frontend redeploy (it is applied at build time). The Android app needs a new APK for website changes (Step 7).

## Alternative: college server / VPS (always on, no sleep)
1. Ubuntu server with Node 20, Nginx, and MongoDB (or Atlas).
2. `cd backend && npm ci --omit=dev`, set `.env`, run with `pm2 start server.js --name tracker-api`, then `pm2 save && pm2 startup`.
3. `cd frontend && npm ci && VITE_API_URL=/api npm run build`, copy `dist/` to `/var/www/tracker`.
4. Nginx: serve `/var/www/tracker` with `try_files $uri /index.html;`, and `location /api/ { proxy_pass http://127.0.0.1:5000; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; }`.
5. HTTPS with Let's Encrypt: `sudo certbot --nginx -d tracker.yourcollege.edu`.

## Common problems
| Symptom | Cause / fix |
|---|---|
| "Cannot reach the server" right away | `VITE_API_URL` missing or wrong; fix and redeploy frontend. Must end with `/api`. |
| Browser console: CORS error | Open the Render log and find `CORS blocked origin: ...`; put exactly that origin in `CLIENT_URL` (no trailing slash). Each Vercel preview URL is a different origin; use a `*` wildcard for them. |
| Android app: "Cannot reach the server" | The API URL was not baked in. Check `frontend/.env.production`, run `npm run build:android`, rebuild the APK. Also allow up to a minute for Render to wake. |
| Android app: blank white screen | Inspect it from Chrome on your PC: open `chrome://inspect`, choose the app's WebView, read the Console. |
| `npm run build:android` / `cap` fails | Capacitor 8 needs Node 22+. Check with `node -v`. |
| Phone refuses to update the APK | The new APK was signed with a different key. Use the same keystore, or uninstall the old app first. |
| First request very slow, then fine | Render free sleep (see above). |
| 404 when refreshing a page | Rewrite file missing; make sure `vercel.json` / `_redirects` is committed. |
| Render log: `MongooseServerSelectionError` | Atlas IP allowlist lacks 0.0.0.0/0, wrong password, or special characters not URL-encoded. |
| Render log: `JWT_SECRET is missing or too short` | Set the variable (24+ characters). |
| "Too many attempts" for everyone | `trust proxy` missing. It is set in `server.js` in this version. |
| Certificate saved but "file could not be uploaded" | Check the three CLOUDINARY variables on Render and the Render log line `Cloudinary upload failed:` for the reason. |
| "Could not load the file right now" | Cloudinary download failed; check Render logs (`Cloudinary download failed`) and that the account is not over its free limits. |
| "Too many failed attempts for this account" | 10 wrong passwords for one email; wait 15 minutes. |
| Seed script: "Authentication failed" | Wrong Atlas user/password in local `MONGO_URI`. |
| Logins work then suddenly fail after a long time | Token expired (`JWT_EXPIRES_IN`); log in again. |
