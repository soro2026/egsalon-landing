/* ══════════════════════════════════════════════════════════════════════════
   libshelf.js — Places 도서관 집 페이지 「이 방의 서가」 (2026.10.22 · 파이스)
   1022 소로 — 「서가에 꽂힌 책을 스르르 시스템이 뽑아서 펼쳐서 넘기는 장면을 시연해 줄 수 있을까?
                 아까 오디오 들려주듯. 유저가 페이지 스스로 넘기면서 볼 수 있게」

   ① 방 = 앱 서고와 같은 그림 tour-assets/museum/<곳>_hall_<시간대> · 벽감 = terra_pins.meta.shelf_rect
   ② 서가 = 홈페이지 자기 서가(DB home_shelf) — Today 뮤세움 칸과 같은 책들 · 가장 새 책이 윗단 왼쪽
         판짜기(3단 × 12권 · 책등 book01~10 · 키 변주 · 글자 수)는 today.html 오늘의 뮤세움 · 앱 bibliotheca.html 과 한 벌
         「서가는 하나입니다 … 도서관이 바뀌는 것은 방의 얼굴」(백서 서가 장) — 일곱 페이지에 같은 책들이 선다
   ③ 책 = 앱 서고의 책 모달(f4)과 같은 얼굴 — 표지는 책 이름의 해시로 팔레트 · 글꼴 · 판짜기를 뽑는다(같은 책은 늘 같은 표지)
         스타디움 책 = questions(seed_id).library 네 장 · 한스푼 책 = spoons.layer_* 네 장
         ⚠ 콩파뇽 흔적 쪽(한스푼 오피니언)은 싣지 않는다 — 회원의 글이라 홈페이지에는 동의 없이 걸지 않는다(1018)
   ④ 시연 — 서가가 화면에 들어오면 한 번: 가장 새 책이 앞으로 빠져나와 → 표지 → 펼쳐져 「지식」 쪽에서 멈춤
         그다음은 손님 몫(‹ › · 쪽의 왼쪽 · 오른쪽 · 손가락 밀기 · 방향 키) · 덮으면 서가로 돌아간다
         소리는 손님이 넘길 때만(헌장 9장 — 저절로 소리 내지 않는다)
   ⑤ 오늘의 도서관이 되는 날 = 도서관 일곱(sort)[ 서울 날수 % 7 ] (today.html · 앱 terra · bibliotheca 와 같은 셈)
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  var box = document.getElementById('libshelf');
  if (!box) return;

  var SUPA = 'https://cyhlotwdisjvoxvfkpnd.supabase.co';
  var KEY  = 'sb_publishable_jYYfQV_wQgMRFjSUuDq7xA_gWc9vsnR';
  var PUB  = SUPA + '/storage/v1/object/public/tour-assets/museum/';
  var APP  = window.EG_APP_ASSETS || 'https://app.egsalon.com/';
  var CODE = box.getAttribute('data-code');
  var DAY = 86400000, WD = '일월화수목금토';
  var VIEW = 1;                         /* 무대의 세로 ÷ 가로 — 벽감과 그 둘레가 한 화면 */

  /* ── 모양 — places.css 꼬리표를 건드리지 않으려고 여기서 붙인다 ── */
  var css = document.createElement('style');
  css.textContent = [
    '.ls-stage{position:relative;margin-top:clamp(28px,4vw,44px);width:100%;max-width:760px;margin-left:auto;margin-right:auto;aspect-ratio:1/' + VIEW + ';overflow:hidden;border-radius:6px;background:#15100b;container-type:inline-size;box-shadow:0 1px 0 rgba(11,9,7,.08),0 10px 28px rgba(11,9,7,.14)}',
    '.ls-hall{position:absolute;left:0;top:0;width:100%;opacity:0;transition:opacity 1.2s ease}',
    '.ls-hall.on{opacity:1}',
    '.ls-hall img.wall{display:block;width:100%;height:auto}',
    '.ls-shelf{position:absolute;display:flex;flex-direction:column}',
    '.ls-shelf .rack{flex:1;display:flex;flex-direction:column;justify-content:flex-end;min-height:0}',
    '.ls-shelf .row{flex:1;display:flex;align-items:flex-end;justify-content:center;min-height:0}',
    '.ls-shelf .bk{position:relative;flex:none;cursor:pointer;transition:transform .9s cubic-bezier(.22,1,.36,1),filter .6s ease;transform-origin:50% 100%}',
    '.ls-shelf .bk:hover{transform:translateY(-4%)}',
    '.ls-shelf .bk.pull{transform:translateY(-18%) scale(1.08);filter:drop-shadow(0 0 14px rgba(255,214,140,.55));z-index:3}',
    '.ls-shelf .bk.away{opacity:.25}',
    '.ls-shelf .spine{display:block;height:100%;width:auto;filter:drop-shadow(0 3px 6px rgba(0,0,0,.6))}',
    '.ls-shelf .bkt{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;writing-mode:vertical-rl;text-orientation:mixed;pointer-events:none;' +
      'font-family:var(--serif);font-size:11px;font-weight:500;white-space:nowrap;color:rgba(255,255,255,.96);letter-spacing:.02em;line-height:1.18;' +
      'padding:7% 2px;overflow:hidden;text-shadow:0 1px 3px rgba(0,0,0,.98),0 0 6px rgba(0,0,0,.85),0 0 14px rgba(0,0,0,.6)}',
    '.ls-shelf .plank{height:11%;min-height:8px;border-radius:2px;position:relative;flex:none;' +
      'background:linear-gradient(180deg,#6b4a26 0%,#48311a 42%,#2f1f10 100%);box-shadow:0 5px 12px rgba(0,0,0,.55),inset 0 1px 0 rgba(201,162,74,.28)}',
    '.ls-shelf .pl-when,.ls-shelf .pl-n{position:absolute;top:50%;transform:translateY(-50%);font-family:"Cormorant Garamond",var(--serif);' +
      'font-size:clamp(7px,1.3cqw,11px);letter-spacing:.16em;white-space:nowrap;color:rgba(226,192,126,.92);text-shadow:0 -1px 0 rgba(0,0,0,.75)}',
    '.ls-shelf .pl-when{left:2.2%}.ls-shelf .pl-n{right:2.2%;color:rgba(226,192,126,.62)}',
    '.ls-head{position:absolute;left:0;right:0;top:4%;text-align:center;pointer-events:none;text-shadow:0 2px 16px rgba(0,0,0,.75);z-index:2}',
    '.ls-head b{display:block;font-family:"Cormorant Garamond",var(--serif);font-weight:500;font-size:clamp(11px,1.9cqw,15px);letter-spacing:.3em;text-indent:.3em;color:rgba(233,207,156,.9)}',
    '.ls-head span{display:block;margin-top:4px;font-size:clamp(10px,1.7cqw,13px);letter-spacing:.08em;color:rgba(244,239,230,.72)}',
    '.ls-hint{position:absolute;left:0;right:0;bottom:3.5%;text-align:center;font-size:clamp(11px,1.9cqw,13.5px);letter-spacing:.06em;color:rgba(244,239,230,.82);text-shadow:0 1px 10px rgba(0,0,0,.8);pointer-events:none;z-index:2;transition:opacity .6s}',
    /* 책 모달 — 무대 안에서 열린다(앱 f4 를 무대 크기에 맞춰 줄인 판) */
    '.ls-ov{position:absolute;inset:0;z-index:5;display:flex;align-items:center;justify-content:center;background:rgba(20,14,8,0);pointer-events:none;transition:background .9s ease}',
    '.ls-ov.open{pointer-events:auto;background:rgba(20,14,8,.62)}',
    '.ls-fit{position:relative;width:340px;height:510px;flex:none;transform-origin:50% 50%}',
    '.ls-scene{position:absolute;left:70px;top:95px;perspective:900px;perspective-origin:50% 45%;opacity:0;transition:opacity .45s ease}',
    '.ls-scene.on{opacity:1}',
    '.ls-3d{width:200px;height:280px;position:relative;transform-style:preserve-3d;transform:rotateY(-26deg) rotateX(4deg);transition:transform .5s cubic-bezier(.23,1,.32,1);cursor:pointer}',
    '.ls-front{position:absolute;width:200px;height:280px;border-radius:0 5px 5px 0;overflow:hidden;backface-visibility:hidden;box-shadow:inset -3px 0 8px rgba(0,0,0,.1)}',
    '.ls-gloss{position:absolute;top:0;left:0;width:52%;height:100%;background:linear-gradient(to right,rgba(255,255,255,.22) 0%,rgba(255,255,255,.05) 55%,transparent 100%);pointer-events:none;z-index:20}',
    '.ls-spine3{position:absolute;width:72px;height:280px;left:-72px;top:0;transform-origin:right center;transform:rotateY(-90deg);border-radius:4px 0 0 4px;display:flex;align-items:center;justify-content:center;overflow:hidden}',
    '.ls-spine3 span{writing-mode:vertical-rl;transform:rotate(180deg);font-size:.54rem;letter-spacing:.14em;white-space:nowrap;overflow:hidden;max-height:88%;font-family:var(--serif);font-weight:600}',
    '.ls-sticker{position:absolute;width:32px;height:32px;border-radius:50%;background:conic-gradient(from 0deg,#ff6b9d,#c44dff,#4dc8ff,#4dff91,#fff34d,#ff914d,#ff6b9d);z-index:25;display:flex;align-items:center;justify-content:center;font-size:.4rem;font-weight:700;color:rgba(255,255,255,.9);bottom:28px;right:10px}',
    '.ls-book{position:absolute;inset:0;display:flex;flex-direction:column;opacity:0;transform:scale(.96);pointer-events:none;transition:opacity .38s ease,transform .38s ease}',
    '.ls-book.on{opacity:1;transform:none;pointer-events:auto}',
    '.ls-pages{position:relative;height:460px;overflow:hidden;border-radius:2px 12px 12px 2px;box-shadow:0 18px 50px rgba(0,0,0,.5)}',
    '.ls-pg{position:absolute;inset:0;background:#F7F2E8;border-left:10px solid #E8E0CC;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;will-change:transform}',
    '.ls-pg::-webkit-scrollbar{display:none}',
    '.ls-lines{position:absolute;inset:0;background-image:repeating-linear-gradient(0deg,transparent,transparent 27px,rgba(180,160,120,.12) 27px,rgba(180,160,120,.12) 28px);pointer-events:none}',
    '.ls-in{position:relative;padding:32px 24px 64px;z-index:2}',
    '.ls-tag{font-size:8px;letter-spacing:.25em;color:rgba(100,80,40,.45);font-family:"Courier New",monospace;border-bottom:1px solid rgba(180,160,120,.2);padding-bottom:10px;margin-bottom:16px}',
    '.ls-hd{font-family:"Cormorant Garamond",var(--serif);font-size:17px;color:#2A1F0A;font-weight:600;margin-bottom:14px;line-height:1.4}',
    '.ls-bd{font-size:13px;color:#3D2F10;font-family:var(--serif);line-height:2;word-break:keep-all}',
    '.ls-bd strong{font-family:"Noto Sans KR","맑은 고딕",sans-serif;font-weight:700;color:#2a1f08}',
    '.ls-num{position:absolute;bottom:14px;right:36px;font-size:10px;color:rgba(100,80,40,.3);font-family:"Courier New",monospace}',
    '.ls-corner{position:absolute;bottom:0;right:0;width:0;height:0;border-style:solid;border-width:0 0 28px 28px;border-color:transparent transparent #E8E0CC transparent;opacity:.5}',
    '.ls-cur{padding:10px 0;border-bottom:1px solid rgba(180,160,120,.15);font-size:13px;color:#3D2F10;font-family:var(--serif);line-height:1.6;word-break:keep-all}',
    '.ls-lk{margin-top:18px}.ls-lk .t{font-size:10px;letter-spacing:.18em;color:rgba(120,90,40,.55);font-family:"Courier New",monospace;margin-bottom:6px}',
    '.ls-lk a{color:#8B6F2A;text-decoration:none;border-bottom:1px solid rgba(139,111,42,.3)}',
    '.ls-last{background:#F0EBE0;border-left-color:#DDD5BB;display:flex;align-items:center;justify-content:center;text-align:center}',
    '.ls-bar{height:50px;display:flex;align-items:center;justify-content:center;gap:14px}',
    '.ls-bar button{background:none;border:1px solid rgba(233,207,156,.35);color:rgba(244,239,230,.9);border-radius:999px;cursor:pointer;font:inherit}',
    '.ls-bar .nv{width:36px;height:36px;font-size:18px;line-height:1}',
    '.ls-bar .nv:disabled{opacity:.25;cursor:default}',
    '.ls-bar .nv.beckon{animation:lsBeckon 1.6s ease-in-out 3}',
    '@keyframes lsBeckon{50%{box-shadow:0 0 0 7px rgba(242,201,76,.22);border-color:rgba(242,201,76,.8)}}',
    '.ls-bar .cl{height:36px;padding:0 16px;font-size:13px;letter-spacing:.06em}',
    '.ls-dots{display:flex;gap:6px}.ls-dots i{width:6px;height:6px;border-radius:50%;background:rgba(244,239,230,.3)}.ls-dots i.on{background:rgba(242,201,76,.95)}'
  ].join('\n');
  document.head.appendChild(css);

  /* ── 손 ── */
  function get(path){
    return fetch(SUPA + '/rest/v1/' + path, { headers:{ apikey:KEY, Authorization:'Bearer ' + KEY } })
      .then(function(r){ if (!r.ok) throw new Error(r.status); return r.json(); });
  }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function md(t){   /* 앱 f4RenderMarkdown 과 같은 규약 — **굵게** · *굵게* */
    return esc(t).replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>').replace(/\*([^*\n]+?)\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  }
  function kstDay(){ return Math.floor((Date.now() + 9 * 3600000) / DAY); }
  function label(dayNo){ var d = new Date(dayNo * DAY); return (d.getUTCMonth() + 1) + '/' + d.getUTCDate() + '(' + WD[d.getUTCDay()] + ')'; }
  function iga(w){   /* 받침이 있으면 「이」, 없으면 「가」 */
    var c = String(w).charCodeAt(String(w).length - 1);
    return (c >= 0xAC00 && c <= 0xD7A3) ? ((c - 0xAC00) % 28 ? '이' : '가') : '이(가)';
  }
  var phase = function(){ try { return window.egPhase ? egPhase() : 'd'; } catch(e){ return 'd'; } };

  /* ── 앱 서고와 같은 판짜기 (today.html 오늘의 뮤세움 · bibliotheca.html) — ⚠ 해시 · 키 변주 · 글자 수 글자 하나 다르지 않게 ── */
  var RACKS = 3, PER_RACK = 12, PER_PAGE = RACKS * PER_RACK, SPINE_MAX = 13;
  var BOOK_IMAGES = ['book01','book02','book03','book04','book05','book06','book07','book08','book09','book10'];
  function bookImg(a){ var h = 0; for (var c of String(a)) h = (h*31 + c.charCodeAt(0)) & 0xfffff; return APP + BOOK_IMAGES[h % BOOK_IMAGES.length] + '.webp'; }
  function bookScale(a){ var h = 0; for (var c of String(a)) h = (h*17 + c.charCodeAt(0)) & 0xfffff; var s = [.88,.92,.96,1,.94,.90,.98,.86,1,.93]; return s[h % s.length]; }
  function shortTitle(s, m){ s = String(s || ''); return s.length > m ? s.slice(0, m - 1) + '…' : s; }
  function dt(d){ var p = String(d).split('-'); return { y:+p[0], m:+p[1], d:+p[2] }; }
  function when(a, z){ a = dt(a); z = dt(z);
    if (a.y === z.y && a.m === z.m && a.d === z.d) return a.y + '. ' + a.m + '. ' + a.d;
    return a.y === z.y ? a.y + '. ' + a.m + '. ' + a.d + ' — ' + z.m + '. ' + z.d : a.y + '. ' + a.m + '. ' + a.d + ' — ' + z.y + '. ' + z.m + '. ' + z.d; }

  /* ── 표지 — 앱 f4BuildCover 와 같은 팔레트 · 글꼴 · 판짜기(책 이름의 해시) ── */
  var PAL = [
    { band:'linear-gradient(135deg,#1e3a6e,#2c5282)', bandTxt:'rgba(255,220,150,0.85)', bg:'linear-gradient(170deg,#f4f0e8,#ece6da)', accent:'#2c5282', title:'#1a1a2e', spine:'linear-gradient(to right,#1a2f50,#2c4a7a)', spineTxt:'rgba(255,220,150,0.85)' },
    { band:'linear-gradient(135deg,#c0452a,#a03820)', bandTxt:'rgba(255,230,180,0.85)', bg:'linear-gradient(170deg,#fdf6ee,#f5ebe0)', accent:'#a03820', title:'#2d1810', spine:'linear-gradient(to right,#7a3020,#c0502a)', spineTxt:'rgba(255,240,200,0.9)' },
    { band:'none', bandTxt:'', bg:'#f8f8f6', accent:'#222', title:'#111', spine:'#1a1a1a', spineTxt:'rgba(255,255,255,0.7)' },
    { band:'linear-gradient(135deg,#1a5c3a,#0e3d26)', bandTxt:'rgba(180,255,200,0.8)', bg:'linear-gradient(170deg,#f0f7f4,#e4f0ea)', accent:'#1a5c3a', title:'#0a2e1c', spine:'linear-gradient(to right,#0a3020,#1a5c3a)', spineTxt:'rgba(200,255,220,0.85)' },
    { band:'linear-gradient(135deg,#7a1a3a,#5a1228)', bandTxt:'rgba(255,200,220,0.85)', bg:'linear-gradient(170deg,#fdf0f4,#f5e4ec)', accent:'#8a2040', title:'#2d0818', spine:'linear-gradient(to right,#4a0820,#8a2040)', spineTxt:'rgba(255,200,220,0.85)' },
    { band:'linear-gradient(135deg,#3d2e00,#c9a84c,#3d2e00)', bandTxt:'rgba(255,240,180,0.9)', bg:'linear-gradient(160deg,#fdfbf4,#f8f3e4,#f2ecd4)', accent:'#b08c28', title:'#1a1200', spine:'linear-gradient(to right,#1a1200,#3d2e00)', spineTxt:'rgba(220,185,80,0.9)' },
    { band:'linear-gradient(135deg,#0a1e38,#162d50)', bandTxt:'rgba(160,210,255,0.85)', bg:'linear-gradient(170deg,#f0f4f8,#e4ecf4)', accent:'#1a3a6e', title:'#0a1828', spine:'linear-gradient(to right,#06121e,#0a1e38)', spineTxt:'rgba(160,210,255,0.85)' },
    { band:'linear-gradient(135deg,#2a1a08,#5a3a18)', bandTxt:'rgba(220,190,120,0.9)', bg:'linear-gradient(170deg,#faf4e8,#f2e8d0)', accent:'#7a5020', title:'#2a1808', spine:'linear-gradient(to right,#1a1008,#3a2010)', spineTxt:'rgba(220,190,120,0.9)' },
    { band:'linear-gradient(135deg,#1a1030,#2e1a50)', bandTxt:'rgba(200,170,255,0.85)', bg:'linear-gradient(170deg,#f4f0fc,#ece4f8)', accent:'#5a30a0', title:'#1a0830', spine:'linear-gradient(to right,#0e0820,#1a1030)', spineTxt:'rgba(200,170,255,0.85)' },
    { band:'linear-gradient(135deg,#0a2818,#1a5030)', bandTxt:'rgba(150,240,180,0.85)', bg:'linear-gradient(170deg,#f0faf4,#e4f8ec)', accent:'#1a6040', title:'#081e10', spine:'linear-gradient(to right,#061408,#0a2818)', spineTxt:'rgba(150,240,180,0.85)' }
  ];
  var TYPO = [
    { font:"'Noto Serif KR',serif",     size:'1.6rem',  weight:'900', extra:'' },
    { font:"'Noto Sans KR',sans-serif", size:'1.55rem', weight:'900', extra:'' },
    { font:"'Noto Sans KR',sans-serif", size:'1.45rem', weight:'100', extra:'letter-spacing:0.08em' },
    { font:"'Cormorant Garamond',serif",size:'1.75rem', weight:'300', extra:'font-style:italic;letter-spacing:0.05em' },
    { font:"'Playfair Display',serif",  size:'1.5rem',  weight:'700', extra:'' }
  ];
  var LAYS = ['band_body', 'full_center', 'minimal'];
  function strHash(s){ var h = 0; for (var c of String(s)) h = (h*31 + c.charCodeAt(0)) & 0xfffff; return h; }
  function coverHtml(book){
    var h = strHash(book.answer), pal = PAL[h % PAL.length], ty = TYPO[(h >> 4) % TYPO.length], lay = LAYS[(h >> 8) % LAYS.length];
    var tc = pal.title, ac = pal.accent, cat = esc(book.category || ''), kw = book.keyword ? '"' + esc(book.keyword) + '"' : '', title = esc(book.answer);
    var tf = 'font-family:' + ty.font + ';font-size:' + ty.size + ';font-weight:' + ty.weight + ';color:' + tc + ';' + ty.extra;
    if (lay === 'band_body' && pal.band !== 'none'){
      var bandH = 64 + (h % 26);
      return '<div style="display:flex;flex-direction:column;height:100%;background:' + pal.bg + '">' +
        '<div style="width:100%;height:' + bandH + 'px;background:' + pal.band + ';position:relative;flex-shrink:0;overflow:hidden">' +
        '<div style="position:absolute;bottom:16px;left:14px;font-family:\'Cormorant Garamond\',serif;font-size:.56rem;letter-spacing:.16em;color:' + pal.bandTxt + ';font-style:italic">' + cat + '</div></div>' +
        '<div style="flex:1;padding:12px 14px 10px;display:flex;flex-direction:column;justify-content:space-between"><div>' +
        '<div style="font-size:.44rem;letter-spacing:.25em;color:' + ac + ';font-weight:700;margin-bottom:6px">EG</div>' +
        '<div style="' + tf + ';line-height:1.15">' + title + '</div>' +
        '<div style="width:24px;height:1.5px;background:' + ac + ';margin:8px 0;opacity:.4"></div>' +
        '<div style="font-family:\'Cormorant Garamond\',serif;font-size:.55rem;color:' + tc + ';font-style:italic;line-height:1.55;opacity:.6">' + kw + '</div></div>' +
        '<div style="border-top:1px solid ' + ac + '22;padding-top:8px;font-family:\'Cormorant Garamond\',serif;font-size:.44rem;color:' + ac + ';font-style:italic;opacity:.6">서가</div></div></div>';
    }
    if (lay === 'full_center'){
      return '<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px 14px;text-align:center;background:' + pal.bg + '">' +
        '<div style="font-size:.42rem;letter-spacing:.3em;color:' + ac + ';font-weight:700;margin-bottom:6px">EG</div>' +
        '<div style="font-size:1rem;color:' + ac + ';letter-spacing:.5em;margin:3px 0;opacity:.2">— ✦ —</div>' +
        '<div style="' + tf + ';line-height:1.15;margin:6px 0">' + title + '</div>' +
        '<div style="font-family:\'Cormorant Garamond\',serif;font-size:.58rem;color:' + ac + ';font-style:italic;margin-top:4px;letter-spacing:.1em;opacity:.7">' + cat + '</div>' +
        '<div style="width:44px;height:1px;background:linear-gradient(to right,transparent,' + ac + ',transparent);margin:10px auto;opacity:.45"></div>' +
        '<div style="font-family:\'Cormorant Garamond\',serif;font-size:.52rem;color:' + tc + ';font-style:italic;line-height:1.6;opacity:.55">' + kw + '</div>' +
        '<div style="margin-top:auto;padding-top:10px;border-top:1px solid ' + ac + '22;width:100%;font-size:.4rem;color:' + ac + ';letter-spacing:.2em;opacity:.45">서가</div></div>';
    }
    return '<div style="width:100%;height:100%;display:flex;flex-direction:column;padding:20px 14px 12px;background:' + pal.bg + ';position:relative">' +
      '<div style="font-size:.42rem;letter-spacing:.3em;color:' + ac + ';opacity:.55">EG</div>' +
      '<div style="font-family:\'Playfair Display\',serif;font-size:2.8rem;font-weight:900;color:' + ac + ';opacity:.06;line-height:1;position:absolute;right:8px;top:8px">EG</div>' +
      '<div style="flex:1;display:flex;flex-direction:column;justify-content:center">' +
      '<div style="' + tf + ';line-height:1.1">' + title + '</div>' +
      '<div style="font-size:.5rem;color:' + ac + ';letter-spacing:.12em;margin-top:5px;opacity:.65">' + cat + '</div>' +
      '<div style="width:100%;height:2px;background:' + ac + ';margin:10px 0;opacity:.45"></div>' +
      '<div style="font-size:.52rem;color:' + tc + ';font-style:italic;line-height:1.6;opacity:.52">' + kw + '</div></div>' +
      '<div style="text-align:right;font-size:.4rem;color:' + ac + ';letter-spacing:.15em;opacity:.4">서가</div></div>';
  }

  /* ── 무대 짓기 ── */
  box.innerHTML =
    '<div class="ls-stage" aria-label="이 방의 서가">' +
      '<div class="ls-hall"><img class="wall" alt="" aria-hidden="true"><div class="ls-shelf"></div></div>' +
      '<div class="ls-head" aria-hidden="true"><b></b><span></span></div>' +
      '<div class="ls-hint">책등을 누르면 책이 펼쳐집니다</div>' +
      '<div class="ls-ov" aria-hidden="true"><div class="ls-fit">' +
        '<div class="ls-scene"><div class="ls-3d"><div class="ls-front"><div class="ls-gloss"></div><div class="ls-cv" style="width:100%;height:100%"></div><div class="ls-sticker">EG</div></div>' +
          '<div class="ls-spine3"><span></span></div></div></div>' +
        '<div class="ls-book" role="dialog" aria-label="펼친 책"><div class="ls-pages"></div>' +
          '<div class="ls-bar"><button class="nv pv" type="button" aria-label="앞 쪽">‹</button><div class="ls-dots"></div>' +
          '<button class="nv nx" type="button" aria-label="다음 쪽">›</button><button class="cl" type="button">덮기</button></div></div>' +
      '</div></div>' +
    '</div>';
  var stage = box.querySelector('.ls-stage'), hall = box.querySelector('.ls-hall'), wall = hall.querySelector('img.wall');
  var shelf = box.querySelector('.ls-shelf'), head = box.querySelector('.ls-head'), hint = box.querySelector('.ls-hint');
  var ov = box.querySelector('.ls-ov'), fitEl = box.querySelector('.ls-fit'), scene = box.querySelector('.ls-scene'), b3d = box.querySelector('.ls-3d');
  var cv = box.querySelector('.ls-cv'), sp3 = box.querySelector('.ls-spine3'), bookEl = box.querySelector('.ls-book');
  var pagesEl = box.querySelector('.ls-pages'), dotsEl = box.querySelector('.ls-dots');
  var pvB = box.querySelector('.pv'), nxB = box.querySelector('.nx'), clB = box.querySelector('.cl');

  var ME = null, RECT = null, BOOKS = [], ratio = 1672 / 941;

  /* 방은 무대 폭 100% — 벽감 가운데가 무대 가운데에 오게 */
  function aim(){
    if (!RECT) return;
    var W = stage.clientWidth, H = W * ratio, SH = stage.clientHeight;
    var cy = (RECT.T + RECT.H / 2) / 100 * H;
    var ty = Math.min(0, Math.max(SH - H, SH / 2 - cy));
    hall.style.transform = 'translateY(' + ty + 'px)';
  }
  function fitBook(){
    var s = Math.min(1, stage.clientWidth * 0.94 / 340, stage.clientHeight * 0.96 / 510);
    fitEl.style.transform = 'scale(' + s + ')';
  }
  window.addEventListener('resize', function(){ aim(); fitBook(); fitSpines(); });

  /* 책등 글씨 — 책등의 폭과 높이를 재서 한 줄로 들어가게(1022 소로 「책등이 문제발생」 — 좁은 책등에서 글씨가 두 줄로 넘쳤다) */
  function fitSpine(bk){
    var im = bk.querySelector('.spine'), t = bk.querySelector('.bkt');
    var w = im.clientWidth, h = im.clientHeight; if (!w || !h) return;
    var n = Math.max(3, t.textContent.length);
    t.style.fontSize = Math.max(7, Math.min(w * 0.58, h * 0.84 / n, 20)).toFixed(1) + 'px';
  }
  function fitSpines(){ shelf.querySelectorAll('.bk').forEach(fitSpine); }
  function drawShelf(){
    shelf.style.left = RECT.L + '%'; shelf.style.top = RECT.T + '%'; shelf.style.width = RECT.W + '%'; shelf.style.height = RECT.H + '%';
    var page = BOOKS.slice(0, PER_PAGE), racks = [];
    for (var r = 0; r < RACKS; r++){
      var seg = page.slice(r * PER_RACK, (r + 1) * PER_RACK);
      if (!seg.length){ racks.push('<div class="rack"></div>'); continue; }
      racks.push('<div class="rack"><div class="row">' + seg.map(function(b){
        var i = BOOKS.indexOf(b);
        return '<div class="bk" data-i="' + i + '" role="button" tabindex="0" aria-label="' + esc(b.a) + ' 펼치기" style="height:' + (94 * bookScale(b.a)).toFixed(1) + '%">' +
               '<img class="spine" src="' + bookImg(b.a) + '" alt="">' +
               '<span class="bkt">' + esc(shortTitle(b.a, b.k === 'spoon' ? 18 : SPINE_MAX)) + '</span></div>';
      }).join('') + '</div><div class="plank"><span class="pl-when">' + when(seg[seg.length - 1].d, seg[0].d) + '</span><span class="pl-n">' + seg.length + '</span></div></div>');
    }
    shelf.innerHTML = racks.join('');
    shelf.querySelectorAll('.bk').forEach(function(bk){
      var im = bk.querySelector('.spine');
      if (im.complete && im.naturalWidth) fitSpine(bk); else im.addEventListener('load', function(){ fitSpine(bk); });
    });
    head.querySelector('span').textContent = BOOKS.length + '권';
    shelf.querySelectorAll('.bk').forEach(function(el){
      var go = function(){ stopDemo(); openBook(+el.getAttribute('data-i'), false); };
      el.addEventListener('click', go);
      el.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); } });
    });
  }

  /* ── 책 ── */
  var cur = 0, total = 0, busy = false, openIdx = -1, flipA = null, SEQ = 0;   /* SEQ — 덮거나 다른 책을 열면 앞선 예약을 무른다 */
  function flipSound(){ try { if (!flipA){ flipA = new Audio(APP + 'page_turn.mp3'); flipA.volume = .6; } flipA.currentTime = 0; flipA.play().catch(function(){}); } catch(e){} }
  function pageHtml(tag, hd, body, num){
    return '<div class="ls-lines"></div><div class="ls-in"><div class="ls-tag">' + tag + '</div><div class="ls-hd">' + hd + '</div>' +
           '<div class="ls-bd">' + body + '</div></div><div class="ls-num">' + num + '</div><div class="ls-corner"></div>';
  }
  function linksHtml(L){
    if (!L) return '';
    var out = [];
    if (L.books && L.books.length){
      out.push('<div class="ls-lk"><div class="t">📖 책</div>' + L.books.map(function(b){
        var meta = [b.translator && (b.translator + ' 옮김'), b.publisher].filter(Boolean).join(' · ');
        var q = encodeURIComponent((b.isbn ? [b.isbn] : [b.title, b.author, (b.translator || b.publisher)]).filter(Boolean).join(' '));
        return '<div class="ls-cur"><div style="font-weight:500">' + esc(b.title) + '</div>' + (meta ? '<div style="font-size:11px;color:rgba(80,60,30,.6);margin-top:3px">' + esc(meta) + '</div>' : '') +
               '<div style="margin-top:6px;font-size:11px"><a href="https://www.google.com/search?q=' + q + '" target="_blank" rel="noopener">책 찾기</a></div></div>';
      }).join('') + '</div>');
    }
    if (L.library_call_number) out.push('<div class="ls-lk"><div class="t">🏛 도서관 청구기호</div><div class="ls-cur">' + esc(L.library_call_number) + '</div></div>');
    if (L.youtube_keywords){
      var kws = Array.isArray(L.youtube_keywords) ? L.youtube_keywords : [L.youtube_keywords];
      out.push('<div class="ls-lk"><div class="t">▶ 영상</div>' + kws.map(function(k){
        return '<div class="ls-cur"><a href="https://www.youtube.com/results?search_query=' + encodeURIComponent(k) + '" target="_blank" rel="noopener">' + esc(k) + '</a></div>'; }).join('') + '</div>');
    }
    return out.join('');
  }
  function buildPages(book){
    var lib = book.library || {}, P = [];
    if (lib.knowledge)  P.push(pageHtml('LAYER 1 · 지식', '알고 이해하기', md(lib.knowledge), P.length + 1));
    if (lib.thought)    P.push(pageHtml('LAYER 2 · 사유', '생각하고 느끼기', md(lib.thought), P.length + 1));
    if (lib.connection) P.push(pageHtml('LAYER 3 · 연결', '삶과 이어보기', md(lib.connection), P.length + 1));
    if (lib.curation || book.curation_links){
      var items = String(lib.curation || '').split('/').map(function(s){ return s.trim(); }).filter(Boolean)
        .map(function(x){ return '<div class="ls-cur">' + md(x) + '</div>'; }).join('');
      P.push(pageHtml('LAYER 4 · 큐레이션', '더 깊이 들어가기', items + linksHtml(book.curation_links), P.length + 1));
    }
    if (!P.length) P.push(pageHtml('EG', esc(book.answer), '아직 이 책의 네 장이 준비되지 않았습니다.', 1));
    /* 마지막 쪽 — 이 책이 어디서 왔는지 */
    var d = dt(book.d), whenTxt = d.m + '월 ' + d.d + '일';
    var from = book.k === 'spoon' ? 'Today의 교양 한 스푼에서' : 'Today의 스타디움에서';
    P.push('<div class="ls-lines"></div><div style="position:relative;padding:32px 26px">' +
      '<div style="font-size:22px;margin-bottom:18px;opacity:.4">✦</div>' +
      '<div style="font-family:var(--serif);font-size:14px;line-height:2;color:#3D2F10;word-break:keep-all">이 책은 ' + whenTxt + ' ' + from + ' 만나<br>홈페이지 서가에 꽂혔습니다.</div>' +
      '<div style="margin-top:16px;font-family:var(--serif);font-size:12.5px;line-height:1.9;color:rgba(61,47,16,.7);word-break:keep-all">EG 안에서는 만난 문장마다 이런 책이 한 권씩<br>내 서가에 꽂히고, 아무것도 빠지지 않습니다.</div></div>');
    return P;
  }
  function show(i, dir){
    var all = pagesEl.children, inP = all[i], outP = all[cur];
    if (dir && outP && inP && outP !== inP){
      busy = true;
      if (dir > 0){
        inP.style.transition = 'none'; inP.style.transform = 'translateX(0)'; inP.style.zIndex = 11;
        outP.style.zIndex = 12;
        requestAnimationFrame(function(){ outP.style.transition = 'transform .48s cubic-bezier(.32,.72,0,1)'; outP.style.transform = 'translateX(-100%)'; });
      } else {
        outP.style.zIndex = 11;
        inP.style.transition = 'none'; inP.style.transform = 'translateX(100%)'; inP.style.zIndex = 13;
        requestAnimationFrame(function(){ requestAnimationFrame(function(){ inP.style.transition = 'transform .48s cubic-bezier(.32,.72,0,1)'; inP.style.transform = 'translateX(0)'; }); });
      }
      setTimeout(function(){ inP.style.zIndex = 12; outP.style.zIndex = 1; inP.scrollTop = 0; busy = false; }, 490);
    }
    cur = i;
    dotsEl.innerHTML = Array.prototype.map.call(all, function(_, k){ return '<i' + (k === i ? ' class="on"' : '') + '></i>'; }).join('');
    pvB.disabled = i === 0; nxB.disabled = i === total - 1;
  }
  function turn(d, byHand){
    if (busy) return;
    var n = cur + d; if (n < 0 || n >= total) return;
    if (byHand){ flipSound(); nxB.classList.remove('beckon'); }
    show(n, d);
  }
  function loadBook(b){
    if (b.full) return Promise.resolve(b);
    var q = b.k === 'spoon'
      ? get('spoons?select=headline,subject,curation_links,layer_knowledge,layer_thought,layer_connection,layer_curation&id=eq.' + encodeURIComponent(b.spoon)).then(function(r){
          var s = r && r[0]; if (!s) return;
          b.library = { knowledge:s.layer_knowledge || '', thought:s.layer_thought || '', connection:s.layer_connection || '', curation:s.layer_curation || '' };
          b.curation_links = s.curation_links || null; b.keyword = s.headline || '';
        })
      : get('questions?select=answer,keyword,category,library,curation_links&seed_id=eq.' + encodeURIComponent(b.seed) + '&limit=1').then(function(r){
          var x = r && r[0]; if (!x) return;
          b.library = x.library || {}; b.curation_links = x.curation_links || null; b.keyword = x.keyword || '';
          if (x.category) b.category = x.category;
        });
    return q.catch(function(){}).then(function(){ b.full = true; return b; });
  }
  function openBook(i, demo){
    var b = BOOKS[i]; if (!b) return;
    openIdx = i; var seq = ++SEQ; entering = false;
    shelf.querySelectorAll('.bk').forEach(function(el){ var me = +el.getAttribute('data-i') === i; el.classList.toggle('pull', me); el.classList.toggle('away', !me); });
    hint.style.opacity = 0;
    loadBook(b).then(function(book){
      if (seq !== SEQ) return;
      book.answer = book.a;
      cv.innerHTML = coverHtml(book);
      var h = strHash(book.answer), pal = PAL[h % PAL.length];
      sp3.style.background = pal.spine; sp3.querySelector('span').style.color = pal.spineTxt; sp3.querySelector('span').textContent = book.answer;
      var P = buildPages(book); total = P.length; cur = 0;
      pagesEl.innerHTML = P.map(function(h, k){
        return '<div class="ls-pg' + (k === P.length - 1 ? ' ls-last' : '') + '" style="z-index:' + (k ? 1 : 12) + ';transform:translateX(' + (k ? '100%' : '0') + ')">' + h + '</div>';
      }).join('');
      Array.prototype.forEach.call(pagesEl.children, function(p){
        p.addEventListener('click', function(ev){
          if (ev.target.closest('a,button')) return;
          var r = p.getBoundingClientRect(), x = ev.clientX - r.left;
          if (x < r.width * .35) turn(-1, true); else if (x > r.width * .65) turn(1, true);
        });
      });
      show(0, 0);
      fitBook();
      bookEl.classList.remove('on');
      b3d.style.transition = 'none'; b3d.style.transform = 'rotateY(-26deg) rotateX(4deg)'; b3d.style.opacity = '1';
      setTimeout(function(){
        if (seq !== SEQ) return;
        ov.classList.add('open'); ov.setAttribute('aria-hidden', 'false');
        scene.classList.add('on');
        setTimeout(function(){ if (seq === SEQ) enter(); }, demo ? 1600 : 1100);   /* 표지를 잠시 보이고 들어간다 · 표지를 누르면 바로 */
      }, demo ? 700 : 150);
    });
  }
  var entering = false;
  function enter(){
    if (!scene.classList.contains('on') || entering) return;
    entering = true; var my = SEQ;
    b3d.style.transition = 'transform .48s cubic-bezier(.23,1,.32,1)';
    b3d.style.transform = 'rotateY(0deg) rotateX(0deg)';
    setTimeout(function(){
      if (my !== SEQ) return;
      b3d.style.transition = 'transform 1s cubic-bezier(.25,0,.2,1), opacity .55s ease .45s';
      b3d.style.transform = 'rotateY(0deg) rotateX(0deg) scale(2.6)'; b3d.style.opacity = '0';
    }, 450);
    setTimeout(function(){
      if (my !== SEQ) return;
      scene.classList.remove('on'); entering = false;
      bookEl.classList.add('on');
      if (demoing){ nxB.classList.add('beckon'); demoing = false; }
      try { nxB.focus({ preventScroll:true }); } catch(e){}
    }, 1150);
  }
  function closeBook(){
    SEQ++; entering = false;
    bookEl.classList.remove('on'); scene.classList.remove('on');
    ov.classList.remove('open'); ov.setAttribute('aria-hidden', 'true');
    shelf.querySelectorAll('.bk').forEach(function(el){ el.classList.remove('pull', 'away'); });
    hint.style.opacity = 1; openIdx = -1;
  }
  b3d.addEventListener('click', enter);
  pvB.addEventListener('click', function(){ turn(-1, true); });
  nxB.addEventListener('click', function(){ turn(1, true); });
  clB.addEventListener('click', closeBook);
  ov.addEventListener('click', function(e){ if (e.target === ov) closeBook(); });
  stage.addEventListener('keydown', function(e){
    if (!bookEl.classList.contains('on')) return;
    if (e.key === 'ArrowRight'){ e.preventDefault(); turn(1, true); }
    else if (e.key === 'ArrowLeft'){ e.preventDefault(); turn(-1, true); }
    else if (e.key === 'Escape') closeBook();
  });
  var tx = null;
  pagesEl.addEventListener('touchstart', function(e){ tx = e.touches[0].clientX; }, { passive:true });
  pagesEl.addEventListener('touchend', function(e){
    if (tx == null) return; var d = e.changedTouches[0].clientX - tx; tx = null;
    if (Math.abs(d) > 40) turn(d < 0 ? 1 : -1, true);
  });

  /* ── 시연 — 서가가 화면에 들어오면 한 번 ── */
  var demoing = false, demoDone = false, demoTimer = null;
  function stopDemo(){ demoDone = true; clearTimeout(demoTimer); demoing = false; }
  function demo(){
    if (demoDone || !BOOKS.length) return;
    demoDone = true; demoing = true;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce){ demoing = false; return; }
    demoTimer = setTimeout(function(){ openBook(0, true); }, 1400);
  }

  /* ── 오늘의 도서관이 되는 날 ── */
  function myDays(halls){
    var foot = document.getElementById('libday'); if (!foot) return;
    var n = halls.length, idx = -1;
    halls.forEach(function(h, k){ if (h.code === CODE) idx = k; });
    if (!n || idx < 0){ foot.textContent = ''; return; }
    var D = kstDay(), days = [];
    for (var k = 0; k < 14; k++) if ((D + k) % n === idx) days.push(D + k);
    var name = ME.name, ga = iga(name);
    if (days[0] === D){
      foot.textContent = '오늘은 ' + name + ga + ' 오늘의 도서관입니다. 다음은 ' + days.slice(1).map(label).join(' · ') + '.';
    } else {
      foot.textContent = name + ga + ' 오늘의 도서관이 되는 날 — ' + days.map(label).join(' · ');
    }
  }

  Promise.all([
    get('terra_pins?select=code,name,sort,meta&kind=eq.museum&active=eq.true&order=sort'),
    get('home_shelf?select=shelved_on,kind,answer,question_seed,spoon_id,category&order=shelved_on.desc,id.desc')
  ]).then(function(r){
    var halls = r[0] || [];
    ME = halls.filter(function(h){ return h.code === CODE; })[0];
    if (!ME){ box.innerHTML = ''; return; }
    myDays(halls);
    RECT = (ME.meta || {}).shelf_rect || { L:27.8, T:35, W:44, H:39 };
    head.querySelector('b').textContent = (ME.meta || {}).name_en || ME.name;
    BOOKS = (r[1] || []).map(function(x){
      return { a:x.answer, k:x.kind, d:x.shelved_on, seed:x.question_seed, spoon:x.spoon_id, category:x.category };
    });
    wall.onload = function(){ if (wall.naturalWidth) ratio = wall.naturalHeight / wall.naturalWidth; hall.classList.add('on'); aim(); };
    wall.src = PUB + CODE + '_hall_' + phase() + '.webp';
    drawShelf(); aim(); fitBook();
    if (!BOOKS.length){ hint.textContent = '아직 서가가 비어 있습니다'; return; }
    if ('IntersectionObserver' in window){
      var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting && e.intersectionRatio >= .55){ io.disconnect(); demo(); } }); }, { threshold:[.55] });
      io.observe(stage);
    }
  }).catch(function(){ box.innerHTML = '<p class="ft-note">서가를 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.</p>'; });
})();
