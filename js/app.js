/* ============================================================
   BIRTHDAY LOVE WEBSITE — app.js v3
   ★ ONLY EDIT THE CONFIG SECTIONS BELOW ★
   ============================================================ */

/* ═══════════════════════════════════════════════════════
   ★ CONFIG — Edit these
   ═══════════════════════════════════════════════════════ */
const HER_NAME  = "Sinchana(CUBBY)😊";
const BIRTHDAY  = new Date(2026, 6, 1); // new Date(YEAR, MONTH-1, DAY)
const MUSIC_SRC = ""C:\Users\Sharath\Downloads\Dil Tu Jaan Tu - Gurnazar (DJJOhAL.Com).mp3"";                    // e.g. 'videos/song.mp3'

/* ═══════════════════════════════════════════════════════
   ★ TIMELINE — Edit your 4 memories
   ═══════════════════════════════════════════════════════ */
const TIMELINE = [
  { date:'The Beginning', icon:'👋', title:'The Day We Met',
    desc:'The moment I first saw you in lab, got somthing spl in you but im really scred about you that time. I didn\'t know it then, but I was meeting the love of my life.' },
  { date:'The Spark', icon:'💘', title:'When I Fell For You',
    desc:'Im not able to remember the exact moment I realized I was completely, hopelessly, beautifully in love with you. And I\'ve been falling ever since.' },
  { date:'Adventures', icon:'🗺️', title:'Our Beautiful Journey to orion mall😁',
    desc:'Every laugh, every hugs, every inside joke — each moment with you is a treasure I\'ll carry in my heart forever.' },
  { date:'Today & Forever', icon:'🌟', title:'This Birthday & Beyond',
    desc:'Here we are, celebrating you on your most special day. And I promise — so many more beautiful chapters await us.' },
];

/* ═══════════════════════════════════════════════════════
   ★ LOVE LETTER — Edit paragraphs
   ═══════════════════════════════════════════════════════ */
const LETTER_PARAGRAPHS = [
  `As I sit down to write this, my heart is so full that I'm not sure words will ever be enough. But I'll try — because you deserve every single attempt.`,
  `You came into my life and <em>rearranged everything</em>. Before you, I didn't know that love could feel like this — like a quiet Sunday morning and a fireworks show all at once.`,
  `On your birthday, I want you to know that every moment I have spent with you has been a gift. Every silly argument resolved with a hug, every adventure stumbled into together — I treasure all of it. <em>Every. Single. Bit.</em>`,
  `You are more loved than you could possibly know. More than sunsets and stars and all the poetry ever written. More than I'll ever fully be able to show — though I intend to spend a lifetime trying.`,
  `Happy Birthday, my darling. May this year bring you everything you deserve — which is <em>absolutely everything beautiful</em> this world has to offer.`,
];

/* ════════════════════════════════════════════════════════
   ↑ THAT'S ALL YOU NEED TO EDIT ↑
   Everything below powers the website automatically.
   ════════════════════════════════════════════════════════ */

// ── PHOTO STORAGE (persists in localStorage so photos survive refresh) ──
// photos are stored as base64 data URLs
let savedPhotos = [];
let savedVideos = [];

function loadSaved() {
  try {
    const p = localStorage.getItem('bday_photos');
    const v = localStorage.getItem('bday_videos');
    if (p) savedPhotos = JSON.parse(p);
    if (v) savedVideos = JSON.parse(v);
  } catch(e) { savedPhotos = []; savedVideos = []; }
}
function savePhotos() {
  try { localStorage.setItem('bday_photos', JSON.stringify(savedPhotos)); } catch(e) {}
}
function saveVideos() {
  try { localStorage.setItem('bday_videos', JSON.stringify(savedVideos)); } catch(e) {}
}

// ── GRADIENTS for frames ──
const FRAME_GRADIENTS = [
  'linear-gradient(135deg,#ffb6c1,#e8829a)',
  'linear-gradient(135deg,#c990b8,#6b4aa0)',
  'linear-gradient(135deg,#4b2e83,#ffb6c1)',
  'linear-gradient(135deg,#e8829a,#f0c060)',
  'linear-gradient(135deg,#6b4aa0,#c990b8)',
  'linear-gradient(135deg,#ffb6c1,#4b2e83)',
];

/* ── DOM READY ─────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  loadSaved();
  initLoading();
  initCursor();
  initNav();
  buildBackground();
  buildTimeline();
  buildGalleryZone();   // new single upload zone
  buildVideoZone();     // new single upload zone
  buildLetter();
  startCountdown();
  initScrollReveal();
  initMusic();
  initTwinkleStars();
});

/* ── LOADING ───────────────────────────────────────────── */
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

/* ── CURSOR ────────────────────────────────────────────── */
function initCursor() {
  const cur = document.getElementById('cursor');
  const dot = document.getElementById('cursor-dot');
  if (!cur) return;
  let cx=0,cy=0,tx=0,ty=0;
  document.addEventListener('mousemove', e => {
    tx=e.clientX; ty=e.clientY;
    if(Math.random()<.022) spawnCursorHeart(tx,ty);
  });
  function lerp(a,b,t){return a+(b-a)*t}
  (function loop(){
    cx=lerp(cx,tx,.15); cy=lerp(cy,ty,.15);
    cur.style.left=cx+'px'; cur.style.top=cy+'px';
    dot.style.left=tx+'px'; dot.style.top=ty+'px';
    requestAnimationFrame(loop);
  })();
}
function spawnCursorHeart(x,y){
  const icons=['💕','💗','💖','✨','🌸','💓','⭐'];
  const el=document.createElement('div');
  el.style.cssText=`position:fixed;left:${x}px;top:${y}px;font-size:${11+Math.random()*10}px;pointer-events:none;z-index:300;animation:floatUp ${.9+Math.random()*.8}s ease forwards;transform:translate(-50%,-50%)`;
  el.textContent=icons[Math.floor(Math.random()*icons.length)];
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),2000);
}

/* ── NAV ───────────────────────────────────────────────── */
function initNav(){
  const navbar=document.getElementById('navbar');
  const navBtns=document.querySelectorAll('.nav-link');
  const ids=['hero','wishes','gallery','videos','letter','surprise'];
  window.addEventListener('scroll',()=>{
    navbar.classList.toggle('scrolled',window.scrollY>60);
    let current='hero';
    ids.forEach(id=>{const el=document.getElementById(id);if(el&&el.getBoundingClientRect().top<=90)current=id;});
    navBtns.forEach(btn=>{
      const hit=(btn.getAttribute('onclick')||'').match(/'([^']+)'/);
      btn.classList.toggle('active',!!(hit&&hit[1]===current));
    });
  },{passive:true});
}
function goTo(id){const el=document.getElementById(id);if(el)el.scrollIntoView({behavior:'smooth'});}

/* ── SCROLL REVEAL ─────────────────────────────────────── */
function initScrollReveal(){
  const check=()=>document.querySelectorAll('.reveal').forEach(el=>{
    if(el.getBoundingClientRect().top<window.innerHeight-70) el.classList.add('in');
  });
  window.addEventListener('scroll',check,{passive:true});
  setTimeout(check,400);
}

/* ── BACKGROUND ────────────────────────────────────────── */
function buildBackground(){
  buildStars('hero-stars',150);
  buildStars('surprise-stars',120);
  buildFloatingHearts();
  buildParticles();
  buildPetals();
}
function buildStars(id,n){
  const c=document.getElementById(id);if(!c)return;
  for(let i=0;i<n;i++){
    const s=document.createElement('div');s.className='star';
    const sz=1+Math.random()*2.5;
    Object.assign(s.style,{width:sz+'px',height:sz+'px',left:Math.random()*100+'%',top:Math.random()*100+'%',opacity:.15+Math.random()*.7,animationDuration:(2+Math.random()*3.5)+'s',animationDelay:(Math.random()*4)+'s'});
    c.appendChild(s);
  }
}
function initTwinkleStars(){
  ['hero','surprise'].forEach(secId=>{
    const sec=document.getElementById(secId);if(!sec)return;
    for(let i=0;i<20;i++){
      const s=document.createElement('div');
      s.style.cssText=`position:absolute;left:${Math.random()*100}%;top:${Math.random()*100}%;width:3px;height:3px;background:var(--pink);border-radius:50%;pointer-events:none;animation:twinkle ${1.5+Math.random()*2}s ease-in-out ${Math.random()*3}s infinite`;
      sec.appendChild(s);
    }
  });
}
function buildFloatingHearts(){
  const c=document.getElementById('hearts-bg');if(!c)return;
  const icons=['💕','💗','💖','💓','🌹','✨','🌸','💫','⭐','🌺'];
  for(let i=0;i<20;i++){
    const h=document.createElement('div');h.className='fheart';
    h.textContent=icons[Math.floor(Math.random()*icons.length)];
    Object.assign(h.style,{left:Math.random()*100+'%',fontSize:(1+Math.random()*1.5)+'rem',animationDuration:(7+Math.random()*9)+'s',animationDelay:(Math.random()*10)+'s'});
    c.appendChild(h);
  }
}
function buildParticles(){
  const c=document.getElementById('particles');if(!c)return;
  for(let i=0;i<25;i++){
    const p=document.createElement('div');p.className='pdot';
    const sz=2+Math.random()*5;
    Object.assign(p.style,{width:sz+'px',height:sz+'px',left:Math.random()*100+'%',background:`rgba(255,182,193,${.15+Math.random()*.35})`,animationDuration:(9+Math.random()*13)+'s',animationDelay:(Math.random()*12)+'s'});
    c.appendChild(p);
  }
}
function buildPetals(){
  const c=document.getElementById('petals-layer');if(!c)return;
  const icons=['🌸','🌺','🌹','🌷','💮'];
  for(let i=0;i<12;i++){
    const p=document.createElement('div');p.className='petal';
    p.textContent=icons[Math.floor(Math.random()*icons.length)];
    Object.assign(p.style,{left:Math.random()*100+'%',bottom:'0',fontSize:(.9+Math.random()*.8)+'rem',animationDuration:(8+Math.random()*10)+'s',animationDelay:(Math.random()*12)+'s'});
    c.appendChild(p);
  }
}

/* ══════════════════════════════════════════════════════════
   ★ GALLERY — Single Drop Zone + Floating Frames
   ══════════════════════════════════════════════════════════ */
function buildGalleryZone() {
  const wrap = document.getElementById('gallery-zone');
  if (!wrap) return;

  wrap.innerHTML = `
    <!-- DROP ZONE -->
    <div class="drop-zone" id="photo-drop" ondragover="event.preventDefault();this.classList.add('drag-over')" ondragleave="this.classList.remove('drag-over')" ondrop="handlePhotoDrop(event)">
      <input type="file" id="photo-input" accept="image/*" multiple style="display:none" onchange="handlePhotoFiles(this.files)"/>
      <div class="drop-icon">📸</div>
      <div class="drop-title">Drop your photos here</div>
      <div class="drop-sub">Drag & drop any number of photos · or click to browse</div>
      <button class="drop-btn" onclick="document.getElementById('photo-input').click()">Choose Photos</button>
      <div class="drop-hint">JPG · PNG · WEBP · All formats welcome 💕</div>
    </div>

    <!-- FLOATING FRAMES CANVAS -->
    <div class="frames-stage" id="frames-stage"></div>

    <!-- CLEAR BUTTON (shown when photos exist) -->
    <div id="gallery-actions" style="display:none;text-align:center;margin-top:24px">
      <button class="clear-btn" onclick="clearPhotos()">🗑️ Clear All Photos</button>
      <div style="color:rgba(255,182,193,.5);font-size:.78rem;margin-top:8px">Photos are saved in your browser automatically</div>
    </div>
  `;

  // Render any saved photos
  savedPhotos.forEach((src, i) => addPhotoFrame(src, i));
  if (savedPhotos.length > 0) {
    document.getElementById('gallery-actions').style.display = 'block';
  }
}

function handlePhotoDrop(e) {
  e.preventDefault();
  document.getElementById('photo-drop').classList.remove('drag-over');
  const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/'));
  processPhotoFiles(files);
}
function handlePhotoFiles(fileList) {
  processPhotoFiles([...fileList]);
}
function processPhotoFiles(files) {
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const src = e.target.result;
      savedPhotos.push(src);
      savePhotos();
      addPhotoFrame(src, savedPhotos.length - 1);
      document.getElementById('gallery-actions').style.display = 'block';
    };
    reader.readAsDataURL(file);
  });
}

function addPhotoFrame(src, index) {
  const stage = document.getElementById('frames-stage');
  if (!stage) return;

  // Random floating position & rotation
  const rotations = [-6,-4,-3,-2,-1,0,1,2,3,4,6];
  const rot    = rotations[Math.floor(Math.random() * rotations.length)];
  const grad   = FRAME_GRADIENTS[index % FRAME_GRADIENTS.length];
  const delay  = (index * 0.12).toFixed(2);
  const size   = 200 + Math.floor(Math.random() * 80); // 200–280px

  const frame = document.createElement('div');
  frame.className = 'photo-frame';
  frame.dataset.index = index;
  frame.style.cssText = `
    --rot:${rot}deg;
    --size:${size}px;
    --grad:${grad};
    animation-delay:${delay}s;
  `;
  frame.innerHTML = `
    <div class="frame-border" style="background:${grad}">
      <div class="frame-inner">
        <img src="${src}" alt="Memory ${index+1}" onclick="openLightboxImg('${src}','Memory ${index+1}')"/>
      </div>
      <div class="frame-caption">Memory ${index+1} 💕</div>
    </div>
    <button class="frame-delete" onclick="deletePhoto(${index})" title="Remove">✕</button>
  `;

  stage.appendChild(frame);
}

function deletePhoto(index) {
  savedPhotos.splice(index, 1);
  savePhotos();
  rebuildFrames();
  if (savedPhotos.length === 0) document.getElementById('gallery-actions').style.display = 'none';
}
function clearPhotos() {
  if (!confirm('Remove all photos?')) return;
  savedPhotos = [];
  savePhotos();
  rebuildFrames();
  document.getElementById('gallery-actions').style.display = 'none';
}
function rebuildFrames() {
  const stage = document.getElementById('frames-stage');
  if (stage) stage.innerHTML = '';
  savedPhotos.forEach((src, i) => addPhotoFrame(src, i));
}

/* ══════════════════════════════════════════════════════════
   ★ VIDEO ZONE — Single Drop Zone + Video Cards
   ══════════════════════════════════════════════════════════ */
function buildVideoZone() {
  const wrap = document.getElementById('video-zone');
  if (!wrap) return;

  wrap.innerHTML = `
    <!-- VIDEO DROP ZONE -->
    <div class="drop-zone" id="video-drop" ondragover="event.preventDefault();this.classList.add('drag-over')" ondragleave="this.classList.remove('drag-over')" ondrop="handleVideoDrop(event)">
      <input type="file" id="video-input" accept="video/*" multiple style="display:none" onchange="handleVideoFiles(this.files)"/>
      <div class="drop-icon">🎬</div>
      <div class="drop-title">Drop your videos here</div>
      <div class="drop-sub">Drag & drop MP4, MOV, or any video · or click to browse</div>
      <button class="drop-btn" onclick="document.getElementById('video-input').click()">Choose Videos</button>
      <div class="drop-hint">MP4 · MOV · AVI · All formats welcome 🎥</div>
    </div>

    <!-- VIDEO CARDS GRID -->
    <div class="video-cards-grid" id="video-cards-grid"></div>

    <!-- CLEAR BUTTON -->
    <div id="video-actions" style="display:none;text-align:center;margin-top:24px">
      <button class="clear-btn" onclick="clearVideos()">🗑️ Clear All Videos</button>
      <div style="color:rgba(255,182,193,.5);font-size:.78rem;margin-top:8px">Videos are saved in your browser automatically</div>
    </div>
  `;

  savedVideos.forEach((v, i) => addVideoCard(v.src, v.name, i));
  if (savedVideos.length > 0) document.getElementById('video-actions').style.display = 'block';
}

function handleVideoDrop(e) {
  e.preventDefault();
  document.getElementById('video-drop').classList.remove('drag-over');
  const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('video/'));
  processVideoFiles(files);
}
function handleVideoFiles(fileList) {
  processVideoFiles([...fileList]);
}
function processVideoFiles(files) {
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const entry = { src: e.target.result, name: file.name.replace(/\.[^.]+$/, '') };
      savedVideos.push(entry);
      saveVideos();
      addVideoCard(entry.src, entry.name, savedVideos.length - 1);
      document.getElementById('video-actions').style.display = 'block';
    };
    reader.readAsDataURL(file);
  });
}

function addVideoCard(src, name, index) {
  const grid = document.getElementById('video-cards-grid');
  if (!grid) return;
  const grad = FRAME_GRADIENTS[index % FRAME_GRADIENTS.length];

  const card = document.createElement('div');
  card.className = 'vcard reveal';
  card.dataset.index = index;
  card.innerHTML = `
    <div class="vcard-thumb" style="background:${grad}">
      <video src="${src}" preload="metadata" muted style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;border-radius:16px 16px 0 0"></video>
      <div class="vcard-overlay">
        <div class="vcard-ripple"></div>
        <div class="vcard-play" onclick="playVideoInline(${index})">▶</div>
      </div>
    </div>
    <div class="vcard-info">
      <div class="vcard-title">${name} 🎬</div>
      <button class="vcard-delete" onclick="deleteVideo(${index})">🗑️ Remove</button>
    </div>
  `;
  grid.appendChild(card);
  initScrollReveal();
}

function playVideoInline(index) {
  const src = savedVideos[index]?.src;
  if (!src) return;
  document.getElementById('lb-inner').innerHTML = `
    <video controls autoplay style="max-width:88vw;max-height:82vh;border-radius:14px;display:block;background:#000">
      <source src="${src}"/>
    </video>`;
  document.getElementById('lightbox').classList.add('open');
}

function deleteVideo(index) {
  savedVideos.splice(index, 1);
  saveVideos();
  rebuildVideoCards();
  if (savedVideos.length === 0) document.getElementById('video-actions').style.display = 'none';
}
function clearVideos() {
  if (!confirm('Remove all videos?')) return;
  savedVideos = [];
  saveVideos();
  rebuildVideoCards();
  document.getElementById('video-actions').style.display = 'none';
}
function rebuildVideoCards() {
  const grid = document.getElementById('video-cards-grid');
  if (grid) grid.innerHTML = '';
  savedVideos.forEach((v, i) => addVideoCard(v.src, v.name, i));
}

/* ── LIGHTBOX ──────────────────────────────────────────── */
function openLightboxImg(src, label) {
  document.getElementById('lb-inner').innerHTML = `
    <img src="${src}" alt="${label}" style="max-width:88vw;max-height:84vh;object-fit:contain;border-radius:14px;display:block"/>
    <p style="text-align:center;margin-top:12px;font-family:'Dancing Script',cursive;font-size:1.3rem;color:var(--pink)">${label}</p>`;
  document.getElementById('lightbox').classList.add('open');
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  const vid = document.querySelector('#lb-inner video');
  if (vid) vid.pause();
}
document.addEventListener('keydown', e => { if(e.key==='Escape') closeLightbox(); });

/* ── TIMELINE ──────────────────────────────────────────── */
function buildTimeline() {
  const tl = document.getElementById('timeline'); if(!tl) return;
  TIMELINE.forEach((item,i)=>{
    const div=document.createElement('div');div.className='tl-item reveal';
    const body=`<div class="tl-body glass"><div class="tl-date">${item.date}</div><div class="tl-title">${item.title}</div><div class="tl-desc">${item.desc}</div></div>`;
    const dot=`<div class="tl-dot">${item.icon}</div>`;
    const sp=`<div style="flex:1"></div>`;
    div.innerHTML=i%2===0?body+dot+sp:sp+dot+body;
    tl.appendChild(div);
  });
}

/* ── LETTER ────────────────────────────────────────────── */
function buildLetter() {
  const el=document.getElementById('letter-body');if(!el)return;
  el.innerHTML=LETTER_PARAGRAPHS.map(p=>`<p>${p}</p>`).join('');
}

/* ── COUNTDOWN ─────────────────────────────────────────── */
function startCountdown() {
  function tick(){
    const now=new Date();let target=new Date(BIRTHDAY);
    if(target<=now) target.setFullYear(target.getFullYear()+1);
    const diff=target-now;
    if(diff<=0){['cd-d','cd-h','cd-m','cd-s'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent='00'});return;}
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=String(v).padStart(2,'0')};
    set('cd-d',Math.floor(diff/86400000));
    set('cd-h',Math.floor((diff%86400000)/3600000));
    set('cd-m',Math.floor((diff%3600000)/60000));
    set('cd-s',Math.floor((diff%60000)/1000));
  }
  tick();setInterval(tick,1000);
}

/* ── MUSIC ─────────────────────────────────────────────── */
function initMusic(){
  const audio=document.getElementById('bg-music');if(!audio)return;
  if(MUSIC_SRC) audio.src=MUSIC_SRC;
}
let musicPlaying=false;
function toggleMusic(){
  const audio=document.getElementById('bg-music');
  const btn=document.getElementById('music-btn');
  if(!audio)return;
  if(!MUSIC_SRC){alert('🎵 Add music:\n\n1. Put .mp3 in videos/ folder\n2. Open js/app.js\n3. Set MUSIC_SRC = "videos/song.mp3"');return;}
  musicPlaying=!musicPlaying;
  if(musicPlaying){audio.play().catch(()=>{});btn.textContent='♫  Playing';btn.classList.add('playing');}
  else{audio.pause();btn.textContent='♪  Music';btn.classList.remove('playing');}
}

/* ── CELEBRATION ───────────────────────────────────────── */
function launchCelebration(){
  const colors=['#ffb6c1','#4b2e83','#f0c060','#ffffff','#e8829a','#ffe4e8','#c890b8'];
  if(typeof confetti!=='undefined'){
    confetti({particleCount:200,spread:160,origin:{y:.5},colors});
    setTimeout(()=>confetti({particleCount:140,angle:70,spread:80,origin:{x:0,y:.6},colors}),420);
    setTimeout(()=>confetti({particleCount:140,angle:110,spread:80,origin:{x:1,y:.6},colors}),640);
    setTimeout(()=>confetti({particleCount:120,spread:220,origin:{y:.2},colors}),1050);
    setTimeout(()=>confetti({particleCount:180,spread:180,origin:{y:0},gravity:1.2,colors}),1700);
  }
  const emojis=['💕','💗','💖','💓','🌹','✨','🌸','🎉','🎊','⭐','🌺','🌟'];
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
