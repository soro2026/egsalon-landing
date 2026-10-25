/* ══════════════════════════════════════════════════════════════════════════
   concertroom.js — Guide 고전음악의 음악관 칸: 앱 공연장 그림 + 오늘 그 홀에 걸린 곡 (2026.10.22 · 파이스2)
   1022 소로 — 「Places 도서관 서가처럼, 이미 짜 놓은 코딩과 데이터를 병행해서 보여 주는 방식」
     → 캡처 · 영상 다섯 칸을 페이지가 직접 짓는다. 소로 촬영 없음 · 곡은 날마다 바뀜.
     (회화의 hallroom.js · Today 「오늘의 음악관」 무대와 한 집안 — 셈과 그림이 같다)

   figure.clip.concertroom[data-hall="<홀 code>"][data-show="walk|gate|hall"][data-voice][data-view] 를 찾아 채운다.
     walk = 정문 → 홀 안 → 무대 스크린까지 걸어 들어가는 장면(화면에 들어오면 돌고, 벗어나면 쉰다)
     gate = 정문 한 장 · 홀 이름과 문설주 한 줄(meta.subtitle)
     hall = 홀 안 · 무대 스크린에 「HODIE · 오늘의 연주」와 오늘의 곡
     voice = 아래 띠에 「▶ 이 곡 이야기」(앱과 같은 낭독 voice_takes · scope song) — 누를 때만 소리(헌장 9장)
     view = 칸의 세로 ÷ 가로(기본 1.25 = 4:5)

   ① 그림 = 앱과 같은 파일 tour-assets/concert/<홀>_gate_<m|d|e|n>.webp · <홀>_hall.webp (그림판 1080 × 1920)
         정문 시간대 = egPhase(서울 시각 · Today · Places 와 같은 하늘) · 못 오면 낮(d)
   ② 스크린 자리 = 앱 콘솔 값 그대로 terra_pins.meta.screen_rect · 바탕은 그날 연주 영상의 미리보기 그림을 흐리게(Today 와 같음)
   ③ 곡 = 앱 concert.html todaysSong 과 같은 셈
         배열[ (D + floor(hall_no × N ÷ H)) mod N ]
           D  서울 날수 floor((지금 + 9시간) ÷ 하루)
           H  음악관 전부(terra_pins kind concert · 앱 boot 와 같이 거르지 않음)
           N  곡 전부(heritage_items record · active · id 순)
           hall_no 그 홀의 meta.hall_no
   ⚠⚠ 앱 공식을 고치면 여기도 함께 — 앱 concert.html · terra.html + place.js + today.html + 이 파일
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  var figs = document.querySelectorAll('figure.clip.concertroom[data-hall]');
  if (!figs.length) return;

  var SUPA = 'https://cyhlotwdisjvoxvfkpnd.supabase.co';
  var KEY  = 'sb_publishable_jYYfQV_wQgMRFjSUuDq7xA_gWc9vsnR';
  var PUB  = SUPA + '/storage/v1/object/public/tour-assets/concert/';
  var DAY  = 86400000;
  var PW = 1080, PH = 1920;           /* 앱 공연장 그림판(concert.html HALL_RATIO) */
  var VIEW = 5 / 4;                   /* 칸의 세로 ÷ 가로(기본) */

  /* 칸 모양 — guide.css 꼬리표를 건드리지 않으려고 여기서 붙인다 */
  var css = document.createElement('style');
  css.textContent = [
    '.clip.concertroom .frame,.pair .clip.concertroom .frame{aspect-ratio:4/5;background:#0d0a07;container-type:inline-size}',
    '.concertroom .cr-gate{position:absolute;inset:0;background:center/cover no-repeat;opacity:0;transition:opacity 1.4s ease}',
    '.concertroom .cr-gate.on{opacity:1}',
    '.concertroom .cr-gate.on.drift{animation:crDrift 7s ease-out both}',
    '.concertroom .cr-gate.on.rest{transform:scale(1.06)}',   /* 1025 파이원 — 쉬는 동안 정문 그림을 걸음의 첫 장면(1.06) 그대로 */
    '@keyframes crDrift{from{transform:scale(1.06)}to{transform:scale(1)}}',
    '.concertroom .cr-door{position:absolute;left:6%;right:6%;bottom:9%;text-align:center;opacity:0;transform:translateY(8px);',
      'transition:opacity 1.1s ease,transform 1.1s ease;text-shadow:0 1px 16px rgba(0,0,0,.65)}',
    '.concertroom .cr-door.on{opacity:1;transform:none}',
    '.concertroom .cr-door b{display:block;font-family:var(--serif);font-weight:400;font-size:clamp(17px,5.2cqw,34px);color:#f6efe0;letter-spacing:.04em}',
    '.concertroom .cr-door span{display:block;margin-top:.55em;font-size:clamp(11px,2.5cqw,16px);color:rgba(240,226,196,.88);letter-spacing:.06em}',
    '.concertroom .cr-door span::before{content:"문설주";display:block;margin-bottom:.45em;font-size:.72em;letter-spacing:.2em;color:rgba(233,207,156,.75)}',
    '.concertroom .cr-hall{position:absolute;left:0;top:0;width:100%;aspect-ratio:' + PW + '/' + PH + ';opacity:0;',
      'transition:opacity 1.4s ease,transform 5.5s cubic-bezier(.45,.05,.25,1)}',
    '.concertroom .cr-hall.on{opacity:1}',
    '.concertroom .cr-hall img.wall{position:absolute;inset:0;width:100%;height:100%;object-fit:fill;display:block}',
    '.concertroom .cr-scr{position:absolute;overflow:hidden;background:#0b0b0b;opacity:0;transition:opacity 1.4s ease}',
    '.concertroom .cr-scr.on{opacity:1}',
    '.concertroom .cr-scr .thumb{position:absolute;inset:-6%;background:center/cover no-repeat;filter:blur(3px) saturate(.9);transform:scale(1.04)}',
    '.concertroom .cr-scr .veil{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.6em;',
      'text-align:center;padding:0 6%;background:linear-gradient(180deg,rgba(12,9,6,.42),rgba(12,9,6,.58))}',
    '.concertroom .s-eye{font-family:"Cormorant Garamond",var(--serif);font-size:clamp(6px,1.55cqw,12px);letter-spacing:.42em;text-indent:.42em;color:rgba(233,207,156,.9)}',
    '.concertroom .s-title{font-family:var(--serif);font-weight:400;font-size:clamp(9px,3.1cqw,24px);line-height:1.45;color:#fbf6ea;word-break:keep-all;',
      'opacity:0;transform:translateY(6px);transition:opacity 1.1s ease,transform 1.1s ease}',
    '.concertroom .s-artist{font-size:clamp(7px,1.75cqw,13px);color:rgba(251,246,234,.78);letter-spacing:.03em;opacity:0;transition:opacity 1.1s ease .3s}',
    '.concertroom .cr-scr.named .s-title{opacity:1;transform:none}',
    '.concertroom .cr-scr.named .s-artist{opacity:1}',
    '.concertroom .s-ring{margin-top:.2em;width:clamp(18px,4.6cqw,40px);aspect-ratio:1;border-radius:50%;border:1px solid rgba(233,207,156,.75);display:grid;place-items:center}',
    '.concertroom .s-ring::after{content:"";width:0;height:0;margin-left:3px;border-left:clamp(6px,1.25cqw,11px) solid rgba(233,207,156,.95);',
      'border-top:clamp(4px,.8cqw,7px) solid transparent;border-bottom:clamp(4px,.8cqw,7px) solid transparent}',
    '.concertroom .cr-scr.wait .s-ring{animation:crRing 2.4s ease-in-out infinite}',
    '@keyframes crRing{0%,100%{box-shadow:0 0 0 0 rgba(233,207,156,0)}50%{box-shadow:0 0 0 8px rgba(233,207,156,.18)}}',
    '.concertroom .cr-where{position:absolute;z-index:3;left:14px;top:12px;font-size:clamp(10px,1.9cqw,12.5px);letter-spacing:.14em;',
      'color:rgba(244,239,230,.82);text-shadow:0 1px 10px rgba(0,0,0,.7);opacity:0;transition:opacity .9s ease}',
    '.concertroom .cr-where.on{opacity:1}',
    /* 아래 띠 — 앱 공연장의 띠와 같은 자리 · 곡 이름 왼쪽, 「▶ 이 곡 이야기」 오른쪽 */
    '.concertroom .cr-bar{position:absolute;z-index:3;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:space-between;gap:12px;',
      'padding:clamp(28px,7cqw,56px) clamp(14px,3.4cqw,26px) clamp(12px,2.6cqw,20px);',
      'background:linear-gradient(0deg,rgba(8,6,4,.88) 0%,rgba(8,6,4,.62) 55%,rgba(8,6,4,0) 100%);opacity:0;transition:opacity 1.1s ease}',
    '.concertroom .cr-bar.on{opacity:1}',
    '.concertroom .cr-bar .bt{min-width:0}',
    '.concertroom .cr-bar .bt b{display:block;font-family:var(--serif);font-weight:400;font-size:clamp(12px,2.3cqw,17px);color:#f6efe0;',
      'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.concertroom .cr-bar .bt span{display:block;margin-top:.3em;font-size:clamp(10px,1.7cqw,12.5px);color:rgba(240,226,196,.7);',
      'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.concertroom .cr-bar .hv{flex:none;padding:.55em 1.1em;border:1px solid rgba(233,207,156,.55);border-radius:999px;background:rgba(16,12,8,.55);',
      'cursor:pointer;font:inherit;font-size:clamp(11px,1.9cqw,14px);letter-spacing:.04em;color:rgba(240,222,178,.96)}',
    '.concertroom .cr-bar .hv:hover{background:rgba(40,30,18,.7);color:#f8eed4}',
    '.concertroom .cr-bar .hv .vd{opacity:.55;margin-left:7px;font-size:.92em}',
    '.concertroom figcaption a{color:inherit;text-decoration:underline;text-underline-offset:3px}',
    '@media (prefers-reduced-motion:reduce){.concertroom .cr-gate.on.drift{animation:none}.concertroom .cr-hall{transition:opacity 1.4s ease}}'
  ].join('');
  document.head.appendChild(css);

  window.egPhase = window.egPhase || function(){
    try { if (window.egSky && egSky.phase) return egSky.phase(); } catch(e){}
    var h = new Date(Date.now() + 9 * 3600000).getUTCHours();
    return (h>=5 && h<9) ? 'm' : (h>=9 && h<17) ? 'd' : (h>=17 && h<20) ? 'e' : 'n';
  };
  function kstDay(){ return Math.floor((Date.now() + 9 * 3600000) / DAY); }
  function esc(t){ return String(t == null ? '' : t).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function get(path){
    return fetch(SUPA + '/rest/v1/' + path, { headers:{ apikey:KEY, Authorization:'Bearer ' + KEY } })
      .then(function(r){ if (!r.ok) throw new Error(r.status); return r.json(); });
  }
  function mmss(d){ d = Math.round(Number(d) || 0); return Math.floor(d / 60) + ':' + String(d % 60).padStart(2, '0'); }
  /* 그림이 안 오면 다음 후보로(앱 bgChain 과 같은 걸음) */
  function bgChain(el, urls){
    var i = 0;
    (function next(){
      if (i >= urls.length) return;
      var u = urls[i++], im = new Image();
      im.onload = function(){ el.style.backgroundImage = 'url("' + u + '")'; };
      im.onerror = next;
      im.src = u;
    })();
  }

  /* ── 칸 하나의 뼈대 ── */
  function skeleton(fig){
    var fr = fig.querySelector('.frame');
    fr.innerHTML =
      '<div class="cr-gate" aria-hidden="true"></div>' +
      '<div class="cr-door"><b></b><span></span></div>' +
      '<div class="cr-hall"><img class="wall" alt="" aria-hidden="true">' +
        '<div class="cr-scr"><div class="thumb"></div><div class="veil">' +
          '<div class="s-eye">HODIE · 오늘의 연주</div><div class="s-title"></div><div class="s-artist"></div>' +
          '<div class="s-ring" aria-hidden="true"></div></div></div></div>' +
      '<div class="cr-where" aria-hidden="true"></div>' +
      '<div class="cr-bar"><div class="bt"><b></b><span></span></div></div>';
    var S = {
      fr: fr, base: Number(fig.getAttribute('data-view')) || VIEW, view: 0, show: fig.getAttribute('data-show') || 'hall',
      voice: fig.hasAttribute('data-voice'),
      gate: fr.querySelector('.cr-gate'), door: fr.querySelector('.cr-door'),
      hall: fr.querySelector('.cr-hall'), wall: fr.querySelector('img.wall'), scr: fr.querySelector('.cr-scr'),
      thumb: fr.querySelector('.thumb'), where: fr.querySelector('.cr-where'), bar: fr.querySelector('.cr-bar'),
      timers: [], audio: null
    };
    applyView(S);
    return S;
  }
  /* 칸 높이 — 넓은 칸(view < 1)도 휴대폰 폭에서는 정사각형까지 세운다(스크린과 아래 띠가 겹치지 않게) */
  function applyView(S){
    var v = (S.fr.clientWidth && S.fr.clientWidth < 600 && S.base < 1) ? 1 : S.base;
    if (v !== S.view){ S.view = v; S.fr.style.aspectRatio = '1 / ' + v; }
  }

  /* 홀 그림을 칸 폭 100% 로 깔고, 스크린이 칸 높이의 0.44 쯤에 오게 올린다(Today shift 와 같은 셈) */
  function shiftY(S, R, toScreen){
    var W = S.fr.clientWidth, Hh = W * PH / PW, Hf = W * S.view;
    if (!toScreen || !R) return 0;
    var cy = (R.T + R.H / 2) / 100 * Hh;
    var at = S.voice ? 0.38 : 0.44;                    /* 아래 띠가 있으면 스크린을 조금 위로 */
    return Math.min(0, Math.max(Hf - Hh, Hf * at - cy));
  }
  function place(S, R, toScreen, instant){
    if (instant){ S.hall.style.transition = 'none'; }
    S.hall.style.transform = 'translateY(' + shiftY(S, R, toScreen) + 'px)';
    if (instant){ void S.hall.offsetWidth; S.hall.style.transition = ''; }
  }

  /* ── 낭독 단추 — 앱 공연장 띠의 「▶ 이 곡 이야기」와 같은 파일 ── */
  function voice(fig, S, song){
    if (S.audio){ try{ S.audio.pause(); }catch(e){} S.audio = null; }
    var old = S.bar.querySelector('.hv'); if (old) old.remove();
    if (!fig.hasAttribute('data-voice') || !song) return;
    get('voice_takes?select=url,dur_sec&scope=eq.song&active=eq.true&ref=eq.' + encodeURIComponent(song.id)).then(function(rows){
      var v = rows && rows[0]; if (!v || !v.url) return;          /* 없으면 단추도 없다 */
      var b = document.createElement('button'); b.type = 'button'; b.className = 'hv';
      var dur = v.dur_sec ? '<span class="vd">' + mmss(v.dur_sec) + '</span>' : '';
      var paint = function(t){ b.innerHTML = t + dur; };
      var a = null;
      paint('▶ 이 곡 이야기');
      b.addEventListener('click', function(){
        if (!a){
          a = S.audio = new Audio(v.url);
          a.addEventListener('ended', function(){ paint('▶ 다시 듣기'); });
          a.addEventListener('pause', function(){ if (!a.ended) paint('▶ 이어 듣기'); });
          a.addEventListener('play', function(){ paint('❚❚ 듣는 중'); });
        }
        if (a.paused){ if (a.ended) a.currentTime = 0; a.play().catch(function(){}); }
        else a.pause();
      });
      S.bar.appendChild(b);
    }).catch(function(){});
  }

  var halls = [], songs = [], dayNo = -1, boxes = [];
  var baseCap = [];
  figs.forEach(function(f, i){ baseCap[i] = f.querySelector('figcaption').innerHTML; boxes[i] = skeleton(f); });

  function todaysSong(me){
    var N = songs.length, H = Math.max(halls.length, 1);
    if (!N || !me) return null;
    var o = Math.floor(Number((me.meta || {}).hall_no || 0) * N / H);
    return songs[((dayNo + o) % N + N) % N];
  }

  function paint(fig, S, me, song){
    var m = me.meta || {}, R = m.screen_rect, t = egPhase();
    applyView(S);
    S.timers.forEach(clearTimeout); S.timers = [];
    bgChain(S.gate, [PUB + me.code + '_gate_' + t + '.webp', PUB + me.code + '_gate_d.webp']);
    S.wall.src = PUB + me.code + '_hall.webp';
    S.door.querySelector('b').textContent = me.name || '';
    S.door.querySelector('span').textContent = m.subtitle || '';
    if (R){ S.scr.style.left = R.L + '%'; S.scr.style.top = R.T + '%'; S.scr.style.width = R.W + '%'; S.scr.style.height = R.H + '%'; }
    if (song){
      S.scr.querySelector('.s-title').textContent = song.name || '';
      S.scr.querySelector('.s-artist').textContent = [song.artist, song.period].filter(Boolean).join(' · ');
      S.bar.querySelector('.bt b').textContent = song.name || '';
      S.bar.querySelector('.bt span').textContent = [song.artist, song.period].filter(Boolean).join(' · ');
      if (song.video_id){
        var big = 'https://i.ytimg.com/vi/' + song.video_id + '/maxresdefault.jpg', mid = 'https://i.ytimg.com/vi/' + song.video_id + '/hqdefault.jpg';
        var im = new Image();
        im.onload = function(){ S.thumb.style.backgroundImage = 'url("' + (im.naturalWidth > 200 ? big : mid) + '")'; };
        im.onerror = function(){ S.thumb.style.backgroundImage = 'url("' + mid + '")'; };
        im.src = big;
      }
    }

    if (S.show === 'gate'){
      S.gate.classList.add('on'); S.door.classList.add('on');
      S.where.textContent = (m.city_en || '') + ' · 정문'; S.where.classList.add('on');
    } else if (S.show === 'hall'){
      S.hall.classList.add('on'); S.scr.classList.add('on'); S.scr.classList.add('named');
      place(S, R, true, true);
      S.where.textContent = (me.name || '') + ' · 오늘의 연주'; S.where.classList.add('on');
      if (fig.hasAttribute('data-voice')){ S.bar.classList.add('on'); voice(fig, S, song); }
    } else {
      walkSetup(fig, S, me, R);
    }
  }

  /* ── walk — 정문 → 홀 안 → 스크린 (Today 무대와 같은 걸음 · 비행 영상은 빼고 정문부터) ── */
  function walkSetup(fig, S, me, R){
    var NAME = me.name || '';
    function at(ms, fn){ S.timers.push(setTimeout(fn, ms)); }
    function reset(){
      S.timers.forEach(clearTimeout); S.timers = [];
      [S.gate, S.door, S.hall, S.scr].forEach(function(e){ e.classList.remove('on'); });
      S.gate.classList.remove('drift'); S.scr.classList.remove('named'); S.scr.classList.remove('wait');
      place(S, R, false, true);
      rest();
    }
    /* 1025 파이원 — 쉬는 동안(화면에 들어오는 중 · 화면 밖 · 한 바퀴 끝) 검정 대신 정문 그림을 걸음의 첫 장면으로 둔다.
       소로 「스크롤하면서 까맣게 되는 것」. 움직임 줄이기를 켠 손님은 예전 그대로(홀 · 스크린 정지 장면). */
    function rest(){
      if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      S.gate.classList.add('on'); S.gate.classList.add('rest');
    }
    function play(){
      reset();
      var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce){
        S.hall.classList.add('on'); S.scr.classList.add('on'); S.scr.classList.add('named'); place(S, R, true, true);
        S.where.textContent = NAME + ' · 오늘의 연주'; S.where.classList.add('on'); return;
      }
      S.gate.classList.remove('rest'); S.gate.classList.add('on'); S.gate.classList.add('drift'); S.where.textContent = NAME + ' · 정문'; S.where.classList.add('on');
      at(900,   function(){ S.door.classList.add('on'); });
      at(4600,  function(){ S.door.classList.remove('on'); S.gate.classList.remove('on'); S.hall.classList.add('on'); S.scr.classList.add('on');
                            S.where.textContent = NAME + ' · 공연장'; });
      at(5200,  function(){ place(S, R, true, false); });
      at(10600, function(){ S.scr.classList.add('named'); S.where.textContent = NAME + ' · 오늘의 연주'; });
      at(12800, function(){ S.scr.classList.add('wait'); });
      at(19500, function(){ S.scr.classList.remove('named'); S.scr.classList.remove('wait'); S.scr.classList.remove('on'); S.hall.classList.remove('on'); rest(); });   /* 1025 — 스크린에서 정문으로 곧장 겹쳐 넘어감 */
      at(21100, play);
    }
    S.play = play; S.reset = reset;
    if ('IntersectionObserver' in window){
      if (S.io) S.io.disconnect();
      S.io = new IntersectionObserver(function(es){
        es.forEach(function(e){
          if (e.isIntersecting && !S.running){ S.running = true; play(); }
          else if (!e.isIntersecting && S.running){ S.running = false; reset(); }
        });
      }, { threshold: .45 });
      S.running = false;
      reset();
      S.io.observe(fig);
    } else play();
  }

  function render(){
    dayNo = kstDay();
    figs.forEach(function(fig, i){
      var code = fig.getAttribute('data-hall');
      var me = halls.filter(function(h){ return h.code === code; })[0];
      if (!me) return;
      var song = todaysSong(me);
      paint(fig, boxes[i], me, song);
      var cap = baseCap[i];
      if (song && boxes[i].show !== 'gate') cap += ' 오늘 이 홀에 걸린 곡은 「' + esc(song.name) + '」입니다.';
      cap += ' <a href="place-' + esc(code) + '.html">' + esc(me.name) + '의 2주 공연일정 →</a>';
      fig.querySelector('figcaption').innerHTML = cap;
    });
  }

  /* 창 크기가 바뀌면 스크린 자리를 다시 맞춘다 */
  window.addEventListener('resize', function(){
    figs.forEach(function(fig, i){
      var S = boxes[i], code = fig.getAttribute('data-hall');
      var me = halls.filter(function(h){ return h.code === code; })[0]; if (!me) return;
      var R = (me.meta || {}).screen_rect;
      applyView(S);
      if (S.show === 'hall') place(S, R, true, true);
      else if (S.show === 'walk' && S.hall.classList.contains('on')) place(S, R, true, true);
    });
  });

  Promise.all([
    get('terra_pins?select=code,name,sort,meta&kind=eq.concert&order=sort'),
    get('heritage_items?select=id,name,artist,period,video_id&category=eq.record&status=eq.active&order=id')
  ]).then(function(r){
    halls = r[0] || []; songs = r[1] || [];
    render();
    /* 자정을 넘기면 곡이 바뀐다 — 분마다 날짜만 본다 */
    setInterval(function(){ if (kstDay() !== dayNo) render(); }, 60000);
  }).catch(function(){});
})();
