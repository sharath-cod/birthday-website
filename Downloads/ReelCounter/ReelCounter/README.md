# Reel Counter (Android, Kotlin)

Counts reels/shorts swiped in Instagram and YouTube, shows a floating counter,
and pops up a reminder when your daily limit is reached.

## Run
1. Android Studio → Open this folder → let Gradle sync (JDK 17).
2. Run on a real phone (Android 8.0+).
3. In the app tap **Open Accessibility settings** → Reel Counter → turn ON.
4. Set your limit → open Instagram Reels / YouTube Shorts and swipe.

## Git / GitHub
    git init
    git add .
    git commit -m "Initial Reel Counter app"
    git branch -M main
    git remote add origin https://github.com/<you>/ReelCounter.git
    git push -u origin main

## GitHub backup of counts (optional)
Create a PRIVATE repo, then a fine-grained token (Contents: read & write, only that repo).
Enter username, repo, token in the app → "Save & backup". Data lands in reel-data/stats.json.

## If counting stops working
Instagram/YouTube rename internal view IDs in updates. Update `reelViewIds`
in ReelCounterService.kt (inspect with Android Studio → Tools → Layout Inspector,
or `adb shell uiautomator dump`).

## Firebase setup (login + cloud save) — required before the first build
1. https://console.firebase.google.com → Add project.
2. Project settings → Add app → Android → package name `com.sharath.reelcounter`
   → download `google-services.json` → put it in the `app/` folder.
3. Build → Authentication → Get started → Sign-in method → enable **Email/Password**.
4. Build → Firestore Database → Create database (production mode).
5. Firestore → Rules → paste the contents of `firestore.rules` → Publish.
6. Sync Gradle and run. Sign up on the login screen.

`google-services.json` is in .gitignore; add it manually on each machine
(or remove that line if your repo is private and you prefer to commit it).
