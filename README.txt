╔══════════════════════════════════════════════════════════════╗
║       💕  BIRTHDAY WEBSITE — DEPLOYMENT GUIDE  💕            ║
╚══════════════════════════════════════════════════════════════╝

──────────────────────────────────────────────
 FOLDER STRUCTURE
──────────────────────────────────────────────

birthday-website/
├── index.html          ← Main website file (don't rename)
├── css/
│   └── style.css       ← All styling
├── js/
│   └── app.js          ← All JavaScript
├── images/             ← 📁 DROP YOUR PHOTOS HERE
│   ├── photo1.jpg
│   ├── photo2.jpg
│   └── ... (any jpg/png/webp)
├── videos/             ← 📁 DROP YOUR VIDEOS HERE
│   ├── video1.mp4
│   ├── video2.mp4
│   └── ...
└── README.txt          ← This file

──────────────────────────────────────────────
 HOW TO ADD YOUR PHOTOS
──────────────────────────────────────────────

1. Put your photo files into the  images/  folder
2. Open  js/app.js  in any text editor (Notepad works)
3. Find the section that says:  // ═══ YOUR PHOTOS ═══
4. Add your filenames like this:

   { src: 'images/photo1.jpg', label: 'Our first date 💕' },
   { src: 'images/photo2.jpg', label: 'Summer holiday 🌅' },

That's it! Photos appear instantly in the gallery.

──────────────────────────────────────────────
 HOW TO ADD YOUR VIDEOS
──────────────────────────────────────────────

1. Put your .mp4 video files into the  videos/  folder
2. Open  js/app.js  in any text editor
3. Find the section that says:  // ═══ YOUR VIDEOS ═══
4. Add your filenames like this:

   { src: 'videos/video1.mp4', title: 'Our Holiday 🌊', date: 'July 2024' },
   { src: 'videos/video2.mp4', title: 'Her Birthday 🎂', date: 'May 2024' },

Videos play directly in the browser — no YouTube needed!

You can also use YouTube embed links instead:
   { youtube: 'https://www.youtube.com/embed/VIDEO_ID', title: 'Our Song 🎵' },

──────────────────────────────────────────────
 HOW TO ADD BACKGROUND MUSIC
──────────────────────────────────────────────

1. Put your .mp3 file into the  videos/  folder (or images/)
2. Open  js/app.js  and find:  MUSIC_SRC
3. Change it to:  'videos/your-song.mp3'

──────────────────────────────────────────────
 HOW TO CHANGE HER NAME
──────────────────────────────────────────────

Open js/app.js and find:
   const HER_NAME = "My Love";
Change "My Love" to her actual name.

──────────────────────────────────────────────
 HOW TO SET THE BIRTHDAY DATE
──────────────────────────────────────────────

Open js/app.js and find:
   const BIRTHDAY = new Date(2025, 5, 15);
Change to her actual birthday (months are 0-indexed, Jan=0).
Example: April 20 → new Date(2025, 3, 20)

──────────────────────────────────────────────
 DEPLOYING TO HOSTINGER — STEP BY STEP
──────────────────────────────────────────────

OPTION A: File Manager (easiest)
─────────────────────────────────
1. Log in to hpanel.hostinger.com
2. Go to  Hosting → Manage → File Manager
3. Navigate into the  public_html  folder
4. Delete any existing index.html if there is one
5. Click  Upload  → select ALL files from birthday-website/ folder
   (upload the CONTENTS, not the folder itself)
6. Make sure the folder structure looks like:
     public_html/
       index.html
       css/style.css
       js/app.js
       images/...
       videos/...
7. Visit your domain — it's live! 🎉

OPTION B: FTP (for large video files)
───────────────────────────────────────
1. In hPanel → Hosting → FTP Accounts → get credentials
2. Use FileZilla (free): filezilla-project.org
3. Connect with your FTP credentials
4. Drag the contents of birthday-website/ into public_html/
5. Done!

OPTION C: Git (advanced)
──────────────────────────
Hostinger supports Git deployment via hPanel → Git.

──────────────────────────────────────────────
 TIPS
──────────────────────────────────────────────

• Compress large photos before uploading (use squoosh.app — free)
• Videos over 50MB may be slow — compress with Handbrake (free)
• Best video format: .mp4 (H.264 codec)
• Best image formats: .jpg or .webp

──────────────────────────────────────────────
Made with 💕 — Enjoy the surprise!
