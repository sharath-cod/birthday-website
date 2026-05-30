/* ============================================================
   BIRTHDAY LOVE WEBSITE — app.js (Enhanced v2)
   ★  ONLY EDIT THE SECTIONS MARKED BELOW  ★
   ============================================================ */

/* ═══════════════════════════════════════════════════════════
   ★ STEP 1 — BASIC CONFIG  (Edit these!)
   ═══════════════════════════════════════════════════════════ */
const HER_NAME   = "My Love";           // ← Her name
const BIRTHDAY   = new Date(2025, 5, 15); // ← new Date(YEAR, MONTH-1, DAY)
const MUSIC_SRC  = "";                  // ← 'videos/song.mp3' or leave ""

/* ═══════════════════════════════════════════════════════════
   ★ STEP 2 — YOUR PHOTOS
   Add photos to the images/ folder, then list them here.
   { src: 'images/photo1.jpg', label: 'Caption 💕', height: 260 }
   ═══════════════════════════════════════════════════════════ */
const PHOTOS = [
  { src: '', label: 'Our first photo together 💕',  height: 260 },
  { src: '', label: 'That magical evening 🌙',       height: 200 },
  { src: '', label: 'Laughing together ✨',           height: 300 },
  { src: '', label: 'Our adventure day 🗺️',         height: 220 },
  { src: '', label: 'You in the sunshine 🌸',        height: 280 },
  { src: '', label: 'Candid perfection 💫',          height: 240 },
  { src: '', label: 'Movie night memories 🎬',       height: 200 },
  { src: '', label: 'Best day ever 🎉',              height: 320 },
  { src: '', label: 'Just us two 💖',                height: 250 },
  { src: '', label: 'Saturday mornings ☕',          height: 230 },
  { src: '', label: 'Dancing in the rain 🌧️',      height: 270 },
  { src: '', label: 'Golden hour 🌅',                height: 200 },
];

/* ═══════════════════════════════════════════════════════════
   ★ STEP 3 — YOUR VIDEOS
   Local:   { src: 'videos/clip.mp4', title:'...', desc:'...', date:'...' }
   YouTube: { youtube: 'https://youtube.com/embed/ID', title:'...', desc:'...', date:'...' }
   ═══════════════════════════════════════════════════════════ */
const VIDEOS = [
  { src: '', title: 'The Day We Met',      desc: 'Reliving the moment that changed everything.',     date: 'Our special day'  },
  { src: '', title: 'Adventures Together', desc: 'All the places we explored, hand in hand.',        date: 'Summer memories'  },
  { src: '', title: 'You, Laughing',       desc: 'My absolute favourite sound in the whole world.',  date: 'Candid moments'   },
  { src: '', title: 'Our Favourite Song',  desc: 'The song that will always be ours.',              date: 'Late-night drives' },
  { src: '', title: 'A Message For You',   desc: 'Something I recorded just for your birthday.',    date: 'Today 🎂'          },
  { src: '', title: 'Our Future',          desc: 'All the adventures still waiting for us.',        date: 'Coming soon…'     },
];

/* ═══════════════════════════════════════════════════════════
   ★ STEP 4 — TIMELINE  (edit the 4 memory entries)
   ═══════════════════════════════════════════════════════════ */
const TIMELINE = [
  { date:'The Beginning', icon:'👋', title:'The Day We Met',
    desc:'The moment I first saw you, something shifted in my universe. I didn\'t know it then, but I was meeting the love of my life.' },
  { date:'The Spark', icon:'💘', title:'When I Fell For You',
    desc:'I remember the exact moment I realized I was completely, hopelessly, beautifully in love with you. And I\'ve been falling ever since.' },
  { date:'Adventures', icon:'🗺️', title:'Our Beautiful Journey',
    desc:'Every laugh, every late night, every inside joke — each moment with you is a treasure I\'ll carry in my heart forever.' },
  { date:'Today & Forever', icon:'🌟', title:'This Birthday & Beyond',
    desc:'Here we are, celebrating you on your most special day. And I promise — so many more beautiful chapters await us.' },
];

/* ═══════════════════════════════════════════════════════════
   ★ STEP 5 — LOVE LETTER  (edit the paragraphs)
   ═══════════════════════════════════════════════════════════ */
const LETTER_PARAGRAPHS = [
  `As I sit down to write this, my heart is so full that I'm not sure words will ever be enough. But I'll try — because you deserve every single attempt, every earnest effort, every imperfect syllable.`,
  `You came into my life and <em>rearranged everything</em>. Before you, I didn't know that love could feel like this — like a quiet Sunday morning and a fireworks show all at once. You are the person I want to call first with good news, the hand I reach for in the dark, the face I see when I imagine my future.`,
  `On your birthday, I want you to know that every moment I have spent with you has been a gift. Every silly argument we've resolved with a hug, every adventure we've stumbled into together, every quiet evening that felt like the whole world — I treasure all of it. <em>Every. Single. Bit.</em>`,
  `You are more loved than you could possibly know. More than sunsets and stars and all the poetry ever written. More than I'll ever fully be able to show — though I intend to spend a lifetime trying.`,
  `Happy Birthday, my darling. May this year bring you everything you deserve — which is <em>absolutely everything beautiful</em> this world has to offer.`,
];

/* ════════════════════════════════════════════════════════════
   ↑ THAT'S ALL YOU NEED TO EDIT ↑
   ════════════════════════════════════════════════════════════ */

const GRADIENTS = [
  'linear-gradient(135deg,#2d1a52,#6b4aa0)','linear-gradient(135deg,#4b2e83,#e8829a)',
  'linear-gradient(135deg,#1a0d2e,#4b2e83)','linear-gradient(135deg,#6b4aa0,#ffb6c1)',
  'linear-gradient(135deg,#2d1a52,#e8829a)','linear-gradient(135deg,#4b2e83,#6b4aa0)',
];
const PH_ICONS   = ['📸','🌙','😍','🗺️','🌸','💫','🎬','🎉','💖','☕','🌧️','🌅'];
const VID_ICONS  = ['💕','🗺️','😂','🎵','💌','🌟'];
const VID_BADGES = ['Favourite','Travel','Candid','Music','Special','Dream'];

/* ── DOM READY ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initLoading();
  initCursor();
  initNav();
  buildBackground();
  buildTimeline();
  buildGallery();
  buildVideos();
  buildLetter();
  startCountdown();
  initScrollReveal();
  initMusic();
  initTwinkleStars();
});

/* ── LOADING ─────────────────────────────────────────────── */
function initLoading() {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const el = document.getElementById('loading');
      if (!el) return;
      el.classList.add('fade');
      setTimeout(() => el.remove(), 1400);
    }, 3000);
  });
}

/* ── CURSOR ──────────────────────────────────────────────── */
function initCursor() {
  const cur = document.getElementById('cursor');
  const dot = document.getElementById('cursor-dot');
  if (!cur) return;
  let cx = 0, cy = 0, tx = 0, ty = 0;
  document.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; if (Math.random()<.025) spawnCursorHeart(tx, ty); });
  function lerp(a,b,t){ return a+(b-a)*t; }
  function loop() {
    cx = lerp(cx, tx, .15); cy = lerp(cy, ty, .15);
    cur.style.left = cx+'px'; cur.style.top = cy+'px';
    dot.style.left = tx+'px'; dot.style.top  = ty+'px';
    requestAnimationFrame(loop);
  }
  loop();
}

function spawnCursorHeart(x, y) {
  const icons = ['💕','💗','💖','✨','🌸','💓','⭐'];
  const el = document.createElement('div');
  el.style.cssText = `position:fixed;left:${x}px;top:${y}px;font-size:${11+Math.random()*10}px;pointer-events:none;z-index:300;animation:floatUp ${.9+Math.random()*.8}s ease forwards;transform:translate(-50%,-50%)`;
  el.textContent = icons[Math.floor(Math.random()*icons.length)];
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

/* ── NAV ─────────────────────────────────────────────────── */
function initNav() {
  const navbar  = document.getElementById('navbar');
  const navBtns = document.querySelectorAll('.nav-link');
  const ids     = ['hero','wishes','gallery','videos','letter','surprise'];
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
    let current = 'hero';
    ids.forEach(id => { const el = document.getElementById(id); if(el && el.getBoundingClientRect().top <= 90) current = id; });
    navBtns.forEach(btn => {
      const hit = (btn.getAttribute('onclick')||'').match(/'([^']+)'/);
      btn.classList.toggle('active', !!(hit && hit[1]===current));
    });
  }, { passive:true });
}
function goTo(id) { const el = document.getElementById(id); if(el) el.scrollIntoView({behavior:'smooth'}); }

/* ── SCROLL REVEAL ───────────────────────────────────────── */
function initScrollReveal() {
  const check = () => document.querySelectorAll('.reveal').forEach(el => { if(el.getBoundingClientRect().top < window.innerHeight-70) el.classList.add('in'); });
  window.addEventListener('scroll', check, { passive:true });
  setTimeout(check, 400);
}

/* ── BACKGROUND ──────────────────────────────────────────── */
function buildBackground() {
  buildStars('hero-stars', 150);
  buildStars('surprise-stars', 120);
  buildFloatingHearts();
  buildParticles();
  buildPetals();
}

function buildStars(id, n) {
  const c = document.getElementById(id); if(!c) return;
  for(let i=0;i<n;i++) {
    const s = document.createElement('div'); s.className='star';
    const sz = 1+Math.random()*2.5;
    Object.assign(s.style,{width:sz+'px',height:sz+'px',left:Math.random()*100+'%',top:Math.random()*100+'%',opacity:.15+Math.random()*.7,animationDuration:(2+Math.random()*3.5)+'s',animationDelay:(Math.random()*4)+'s'});
    c.appendChild(s);
  }
}

function initTwinkleStars() {
  // extra twinkling accent stars
  ['hero','surprise'].forEach(secId => {
    const sec = document.getElementById(secId); if(!sec) return;
    for(let i=0;i<20;i++) {
      const s = document.createElement('div');
      s.style.cssText = `position:absolute;left:${Math.random()*100}%;top:${Math.random()*100}%;width:3px;height:3px;background:var(--pink);border-radius:50%;pointer-events:none;animation:twinkle ${1.5+Math.random()*2}s ease-in-out ${Math.random()*3}s infinite`;
      sec.appendChild(s);
    }
  });
}

function buildFloatingHearts() {
  const c = document.getElementById('hearts-bg'); if(!c) return;
  const icons = ['💕','💗','💖','💓','🌹','✨','🌸','💫','⭐','🌺'];
  for(let i=0;i<20;i++) {
    const h = document.createElement('div'); h.className='fheart';
    h.textContent = icons[Math.floor(Math.random()*icons.length)];
    Object.assign(h.style,{left:Math.random()*100+'%',fontSize:(1+Math.random()*1.5)+'rem',animationDuration:(7+Math.random()*9)+'s',animationDelay:(Math.random()*10)+'s'});
    c.appendChild(h);
  }
}

function buildParticles() {
  const c = document.getElementById('particles'); if(!c) return;
  for(let i=0;i<25;i++) {
    const p = document.createElement('div'); p.className='pdot';
    const sz = 2+Math.random()*5;
    Object.assign(p.style,{width:sz+'px',height:sz+'px',left:Math.random()*100+'%',background:`rgba(255,182,193,${.15+Math.random()*.35})`,animationDuration:(9+Math.random()*13)+'s',animationDelay:(Math.random()*12)+'s'});
    c.appendChild(p);
  }
}

function buildPetals() {
  const c = document.getElementById('petals-layer'); if(!c) return;
  const icons = ['🌸','🌺','🌹','🌷','💮'];
  for(let i=0;i<12;i++) {
    const p = document.createElement('div'); p.className='petal';
    p.textContent = icons[Math.floor(Math.random()*icons.length)];
    Object.assign(p.style,{left:Math.random()*100+'%',bottom:'0',fontSize:(.9+Math.random()*.8)+'rem',animationDuration:(8+Math.random()*10)+'s',animationDelay:(Math.random()*12)+'s'});
    c.appendChild(p);
  }
}

/* ── GALLERY ─────────────────────────────────────────────── */
function buildGallery() {
  const grid = document.getElementById('gallery-grid'); if(!grid) return;
  PHOTOS.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'g-item reveal';
    if(item.src) {
      div.innerHTML = `<img src="${item.src}" alt="${item.label}" style="height:${item.height}px;object-fit:cover;width:100%"/><div class="g-overlay"><span class="g-overlay-text">${item.label}</span></div>`;
      div.addEventListener('click', () => openLightboxImg(item.src, item.label));
    } else {
      div.innerHTML = `<div class="g-placeholder" style="height:${item.height}px;background:${GRADIENTS[i%GRADIENTS.length]}"><div style="font-size:2.4rem">${PH_ICONS[i%PH_ICONS.length]}</div><div>${item.label}</div><div style="font-size:.7rem;color:rgba(255,182,193,.4);margin-top:4px">Add src in PHOTOS → app.js</div></div><div class="g-overlay"><span class="g-overlay-text">${item.label}</span></div>`;
    }
    grid.appendChild(div);
  });
}

function openLightboxImg(src, label) {
  document.getElementById('lb-inner').innerHTML = `<img src="${src}" alt="${label}"/><p style="text-align:center;margin-top:12px;font-family:'Dancing Script',cursive;font-size:1.3rem;color:var(--pink)">${label}</p>`;
  document.getElementById('lightbox').classList.add('open');
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  const vid = document.querySelector('#lb-inner video'); if(vid) vid.pause();
  const frm = document.querySelector('#lb-inner iframe'); if(frm) { const s=frm.src; frm.src=''; frm.src=s; }
}
document.addEventListener('keydown', e => { if(e.key==='Escape') closeLightbox(); });

/* ── VIDEOS ──────────────────────────────────────────────── */
function buildVideos() {
  const grid = document.getElementById('videos-grid'); if(!grid) return;
  VIDEOS.forEach((v, i) => {
    const card = document.createElement('div');
    card.className = 'v-card glass reveal';
    let thumbBg = '';
    if(v.src) thumbBg = `<video src="${v.src}" preload="metadata" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0" muted></video>`;
    else thumbBg = `<div style="font-size:3rem;position:relative;z-index:2">${VID_ICONS[i%VID_ICONS.length]}</div>`;
    card.innerHTML = `
      <div class="v-thumb" style="background:${GRADIENTS[i%GRADIENTS.length]}">
        ${thumbBg}
        <div class="v-thumb-overlay" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:3">
          <div class="v-ripple"></div><div class="v-play">▶</div>
        </div>
      </div>
      <div class="v-info">
        <div class="v-title">${v.title}</div>
        <div class="v-desc">${v.desc}</div>
        <div class="v-date">📅 ${v.date}</div>
        <span class="v-badge">${VID_BADGES[i%VID_BADGES.length]}</span>
      </div>`;
    card.querySelector('.v-thumb').addEventListener('click', () => openVideo(v));
    grid.appendChild(card);
  });
}

function openVideo(v) {
  let html = '';
  if(v.src) {
    html = `<video controls autoplay style="width:100%;max-width:86vw;max-height:80vh;border-radius:12px;display:block;background:#000"><source src="${v.src}" type="video/mp4"/>Your browser does not support video.</video>`;
  } else if(v.youtube) {
    html = `<div style="width:min(800px,88vw);aspect-ratio:16/9;border-radius:12px;overflow:hidden"><iframe src="${v.youtube}?autoplay=1" width="100%" height="100%" frameborder="0" allow="autoplay;fullscreen" allowfullscreen></iframe></div>`;
  } else if(v.vimeo) {
    html = `<div style="width:min(800px,88vw);aspect-ratio:16/9;border-radius:12px;overflow:hidden"><iframe src="${v.vimeo}?autoplay=1" width="100%" height="100%" frameborder="0" allow="autoplay;fullscreen" allowfullscreen></iframe></div>`;
  } else {
    html = `<div style="background:#1a0d2e;width:min(560px,85vw);padding:40px;border-radius:12px;text-align:center"><div style="font-size:3rem;margin-bottom:16px">🎬</div><div style="font-family:'Dancing Script',cursive;font-size:1.5rem;color:var(--pink);margin-bottom:12px">${v.title}</div><div style="color:rgba(255,255,255,.6);font-size:.88rem;line-height:1.7">Add your video file or YouTube link<br>in the VIDEOS section of app.js</div></div>`;
  }
  document.getElementById('lb-inner').innerHTML = html+`<p style="text-align:center;margin-top:14px;font-family:'Dancing Script',cursive;font-size:1.3rem;color:var(--pink)">${v.title}</p>`;
  document.getElementById('lightbox').classList.add('open');
}

/* ── TIMELINE ────────────────────────────────────────────── */
function buildTimeline() {
  const tl = document.getElementById('timeline'); if(!tl) return;
  TIMELINE.forEach((item, i) => {
    const div = document.createElement('div'); div.className='tl-item reveal';
    const body = `<div class="tl-body glass"><div class="tl-date">${item.date}</div><div class="tl-title">${item.title}</div><div class="tl-desc">${item.desc}</div></div>`;
    const dot  = `<div class="tl-dot">${item.icon}</div>`;
    const sp   = `<div style="flex:1"></div>`;
    div.innerHTML = i%2===0 ? body+dot+sp : sp+dot+body;
    tl.appendChild(div);
  });
}

/* ── LETTER ──────────────────────────────────────────────── */
function buildLetter() {
  const el = document.getElementById('letter-body'); if(!el) return;
  el.innerHTML = LETTER_PARAGRAPHS.map(p=>`<p>${p}</p>`).join('');
}

/* ── COUNTDOWN ───────────────────────────────────────────── */
function startCountdown() {
  function tick() {
    const now = new Date(); let target = new Date(BIRTHDAY);
    if(target<=now) target.setFullYear(target.getFullYear()+1);
    const diff = target-now;
    if(diff<=0){['cd-d','cd-h','cd-m','cd-s'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent='00'});return;}
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=String(v).padStart(2,'0')};
    set('cd-d',Math.floor(diff/86400000));
    set('cd-h',Math.floor((diff%86400000)/3600000));
    set('cd-m',Math.floor((diff%3600000)/60000));
    set('cd-s',Math.floor((diff%60000)/1000));
  }
  tick(); setInterval(tick,1000);
}

/* ── MUSIC ───────────────────────────────────────────────── */
function initMusic() {
  const audio = document.getElementById('bg-music'); if(!audio) return;
  if(MUSIC_SRC) audio.src = MUSIC_SRC;
}
let musicPlaying = false;
function toggleMusic() {
  const audio = document.getElementById('bg-music');
  const btn   = document.getElementById('music-btn');
  if(!audio) return;
  if(!MUSIC_SRC){ alert('🎵 Add your music:\n\n1. Put your .mp3 in the videos/ folder\n2. Open js/app.js\n3. Set MUSIC_SRC = "videos/song.mp3"'); return; }
  musicPlaying = !musicPlaying;
  if(musicPlaying){ audio.play().catch(()=>{}); btn.textContent='♫  Playing'; btn.classList.add('playing'); }
  else{ audio.pause(); btn.textContent='♪  Music'; btn.classList.remove('playing'); }
}

/* ── CELEBRATION ─────────────────────────────────────────── */
function launchCelebration() {
  const colors = ['#ffb6c1','#4b2e83','#f0c060','#ffffff','#e8829a','#ffe4e8','#c890b8'];
  if(typeof confetti!=='undefined'){
    confetti({particleCount:200,spread:160,origin:{y:.5},colors});
    setTimeout(()=>confetti({particleCount:140,angle:70,spread:80,origin:{x:0,y:.6},colors}),420);
    setTimeout(()=>confetti({particleCount:140,angle:110,spread:80,origin:{x:1,y:.6},colors}),640);
    setTimeout(()=>confetti({particleCount:120,spread:220,origin:{y:.2},colors}),1050);
    setTimeout(()=>confetti({particleCount:180,spread:180,origin:{y:0},gravity:1.2,colors}),1700);
  }
  const emojis = ['💕','💗','💖','💓','🌹','✨','🌸','🎉','🎊','⭐','🌺','🌟'];
  for(let i=0;i<50;i++){
    setTimeout(()=>{
      const h=document.createElement('div');
      h.style.cssText=`position:fixed;left:${Math.random()*100}vw;top:-30px;font-size:${1.4+Math.random()*1.8}rem;pointer-events:none;z-index:400;animation:confettiFall ${2.2+Math.random()*2.8}s ease-in forwards`;
      h.textContent=emojis[Math.floor(Math.random()*emojis.length)];
      document.body.appendChild(h);
      setTimeout(()=>h.remove(),5500);
    },i*75);
  }
  const btn=document.querySelector('.celebrate-btn');
  if(btn){btn.textContent='🎊 Celebrating! 🎊';setTimeout(()=>{btn.textContent='🎉 Celebrate Together!'},4200);}
}
