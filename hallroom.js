/* ══════════════════════════════════════════════════════════════════════════
   hallroom.js — 미술관 방 한 칸: 낮 판 방 + 오늘 그 관에 걸린 그림 (2026.10.22 · 파이스)
   1022 소로 — 「저녁이라 빛이 환하지 않은데, 오르세 벽 낮판 이미지에 오늘 작품 얹어서」
     → 캡처 대신 페이지가 직접 건다. 소로 촬영 없음 · 그림은 날마다 바뀜.

   figure.clip.hallroom[data-hall="<관 code>"] 를 찾아 채운다.
   ① 방 = 앱과 같은 파일 tour-assets/galerie/<관>_hall_d.webp — 시간대는 낮(d)으로 고정
         (이 칸이 말하려는 것이 그 방의 빛이라서 — 오르세 유리 지붕 · 우피치 옆 창)
   ② 걸이 = 앱 콘솔 값 그대로 terra_pins.meta.frame_rect · plaque_pos
         크기 셈은 앱 galerie.html hangBox · 홈페이지 today.html 미술관 무대와 한 벌(같은 면적 · 그림 비율)
         명패 잉크 = 앱 galerie.html paintPlaqueInk 와 한 벌 — 명패가 앉은 곳의 벽 밝기를 재서 상아색 · 먹색 중
         대비가 큰 쪽 · 못 재면 meta.plaque_ink(우피치 · 시카고 = dark) (1022 소로 「우피치 그림 소개가 묻혀」)
   ③ 그림 = place.js 2주 전시일정 표의 「오늘」과 같은 셈
         배열[ (D + floor(no × N ÷ H)) mod N ]
           D  서울 날수 floor((지금 + 9시간) ÷ 하루)
           H  미술관 전부(terra_pins kind heritage · sort 순 · 잠든 관 포함)
           N  그림 전부(heritage_items visual · active · hang_order → id 순)
           no 그 관의 meta.museum_no
   ⚠⚠ 앱 공식을 고치면 여기도 함께 — 앱 terra.html · galerie.html · concert.html · admin + place.js + 이 파일
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  var figs = document.querySelectorAll('figure.clip.hallroom[data-hall]');
  if (!figs.length) return;

  var SUPA = 'https://cyhlotwdisjvoxvfkpnd.supabase.co';
  var KEY  = 'sb_publishable_jYYfQV_wQgMRFjSUuDq7xA_gWc9vsnR';
  var PUB  = SUPA + '/storage/v1/object/public/tour-assets/galerie/';
  var DAY  = 86400000;
  var PW = 941, PH = 1672;            /* 앱 그림판(HALL_RATIO) */
  var VIEW = 5 / 4;                   /* 칸의 세로 ÷ 가로 — 지붕(또는 창)에서 그림 아래 명패까지 한 화면 */

  /* 칸 모양 — guide.css 꼬리표를 건드리지 않으려고 여기서 붙인다 */
  var css = document.createElement('style');
  css.textContent =
    '.clip.hallroom .frame,.pair .clip.hallroom .frame{aspect-ratio:4/5;background:#1a1612;container-type:inline-size}' +
    '.hallroom .hr{position:absolute;left:0;top:0;width:100%;aspect-ratio:' + PW + '/' + PH + ';opacity:0;transition:opacity 1.2s ease}' +
    '.hallroom .hr.on{opacity:1}' +
    '.hallroom .hr img.wall{position:absolute;inset:0;width:100%;height:100%;object-fit:fill}' +
    '.hallroom .art{position:absolute;opacity:0;transition:opacity 1.2s ease}' +
    '.hallroom .art.on{opacity:1}' +
    '.hallroom .art img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;' +
      'filter:drop-shadow(0 10px 30px rgba(0,0,0,.5)) drop-shadow(0 2px 8px rgba(0,0,0,.4))}' +
    '.hallroom .hp{position:absolute;transform:translateX(-50%);text-align:center;white-space:nowrap;' +
      'font-family:var(--serif);text-shadow:0 1px 10px rgba(0,0,0,.55);opacity:0;transition:opacity 1.2s ease}' +
    '.hallroom .hp.on{opacity:1}' +
    '.hallroom .hp b{display:block;font-weight:400;font-size:max(9px,2.5cqw);color:#f2ead6;letter-spacing:.04em}' +
    '.hallroom .hp span{display:block;margin-top:.35em;font-size:max(8px,1.95cqw);color:rgba(242,234,214,.66);letter-spacing:.06em}' +
    '.hallroom .hp.dark{text-shadow:0 1px 2px rgba(255,255,255,.3)}' +
    '.hallroom .hp.dark b{color:#2a2318}' +
    '.hallroom .hp.dark span{color:rgba(42,35,24,.62)}' +
    '.hallroom figcaption a{color:inherit;text-decoration:underline;text-underline-offset:3px}';
  document.head.appendChild(css);

  function kstDay(){ return Math.floor((Date.now() + 9 * 3600000) / DAY); }
  function esc(t){ return String(t == null ? '' : t).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function get(path){
    return fetch(SUPA + '/rest/v1/' + path, { headers:{ apikey:KEY, Authorization:'Bearer ' + KEY } })
      .then(function(r){ if (!r.ok) throw new Error(r.status); return r.json(); });
  }

  /* 명패 잉크 — 앱 galerie.html 과 같은 셈(#f2ead6 · #2a2318 의 상대 휘도) */
  var INK_IVORY = 0.82, INK_DARK = 0.02;
  function lum8(r, g, b){
    var f = function(v){ v /= 255; return v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
    return .2126 * f(r) + .7152 * f(g) + .0722 * f(b);
  }
  function contrast(a, b){ var hi = Math.max(a, b), lo = Math.min(a, b); return (hi + .05) / (lo + .05); }
  function wallLum(im, P){
    try{
      var W = 120, H = Math.max(1, Math.round(120 * im.naturalHeight / im.naturalWidth));
      var c = document.createElement('canvas'); c.width = W; c.height = H;
      var g = c.getContext('2d', { willReadFrequently:true }); g.drawImage(im, 0, 0, W, H);
      var x0 = Math.max(0, Math.round((P.X - 9) / 100 * W)), x1 = Math.min(W, Math.round((P.X + 9) / 100 * W));
      var y0 = Math.max(0, Math.round((P.Y - 0.5) / 100 * H)), y1 = Math.min(H, Math.round((P.Y + 6) / 100 * H));
      if (x1 <= x0 || y1 <= y0) return null;
      var d = g.getImageData(x0, y0, x1 - x0, y1 - y0).data, s = 0, n = 0;
      for (var i = 0; i < d.length; i += 4){ s += lum8(d[i], d[i + 1], d[i + 2]); n++; }
      return n ? s / n : null;
    }catch(e){ return null; }   /* 교차출처로 막히면 고정값으로 */
  }
  function ink(hp, wall, m){
    var dark = m.plaque_ink === 'dark';
    var L = m.plaque_pos ? wallLum(wall, m.plaque_pos) : null;
    if (L != null) dark = contrast(L, INK_DARK) > contrast(L, INK_IVORY);
    hp.classList.toggle('dark', dark);
  }

  /* 벽을 재려면 교차출처로 받아야 한다 — 막히면 맨살로 한 번 더(그림이 안 뜨는 것보다 잉크 자동이 쉬는 편이 낫다 · 앱 bgChain 함정 AE) */
  function loadWall(im, src, done){
    im.crossOrigin = 'anonymous';
    im.onload = done;
    im.onerror = function(){
      if (!im.hasAttribute('crossorigin')) return;
      im.removeAttribute('crossorigin'); im.onerror = null; im.src = src + (src.indexOf('?') < 0 ? '?' : '&') + 'nc=1';
    };
    im.src = src;
  }

  var halls = [], list = [], dayNo = -1;
  var baseCap = [];
  figs.forEach(function(f, i){ baseCap[i] = f.querySelector('figcaption').innerHTML; });

  /* 방은 칸 폭 100% · 위에서부터 보이되, 그림과 명패가 칸 아래로 빠지면 그만큼만 올린다 */
  function place(fig, me, w){
    var hr = fig.querySelector('.hr'), wall = hr.querySelector('img.wall');
    var art = hr.querySelector('.art'), img = art.querySelector('img'), hp = hr.querySelector('.hp');
    var m = me.meta || {}, R = m.frame_rect, P = m.plaque_pos;
    hp.classList.toggle('dark', m.plaque_ink === 'dark');   /* 폴백 먼저 — 재면 갈아 끼운다 */
    loadWall(wall, PUB + me.code + '_hall_d.webp', function(){ hr.classList.add('on'); ink(hp, wall, m); });
    if (!R || !w){ hr.classList.add('on'); return; }

    function hang(){
      var g = R, iw = img.naturalWidth, ih = img.naturalHeight;
      if (iw && ih){
        var bw = R.W / 100 * PW, bh = R.H / 100 * PH, r = iw / ih;
        var hh = Math.sqrt(bw * bh / r), ww = hh * r, cx = R.L + R.W / 2, cy = R.T + R.H / 2;
        g = { L:cx - ww / PW * 50, T:cy - hh / PH * 50, W:ww / PW * 100, H:hh / PH * 100 };
      }
      art.style.left = g.L + '%'; art.style.top = g.T + '%'; art.style.width = g.W + '%'; art.style.height = g.H + '%';
      var need = g.T + g.H + 2;
      if (P){ hp.style.left = P.X + '%'; hp.style.top = P.Y + '%'; need = Math.max(need, P.Y + 4); }
      var seen = 100 / (PH / PW / VIEW);                 /* 칸에 들어오는 방의 높이(%) */
      var lift = Math.max(0, need - seen + 2);
      hr.style.transform = lift ? 'translateY(-' + lift + '%)' : '';
    }
    img.onload = function(){ hang(); art.classList.add('on'); hp.classList.add('on'); };
    img.alt = (w.artist || '') + ' 「' + (w.name || '') + '」';
    img.src = w.img || '';
    hp.querySelector('b').textContent = w.name || '';
    hp.querySelector('span').textContent = [w.artist, w.period].filter(Boolean).join(' · ');
    hang();
  }

  function render(){
    dayNo = kstDay();
    var H = halls.length, N = list.length;
    figs.forEach(function(fig, i){
      var code = fig.getAttribute('data-hall');
      var me = halls.filter(function(h){ return h.code === code; })[0];
      if (!me){ return; }
      var w = null;
      if (H && N){
        var o = Math.floor(Number((me.meta || {}).museum_no || 0) * N / H);
        w = list[((dayNo + o) % N + N) % N];
      }
      place(fig, me, w);
      if (w){
        fig.querySelector('figcaption').innerHTML = baseCap[i] +
          ' 오늘 이 방에 걸린 그림은 ' + esc(w.artist) + ' 「' + esc(w.name) + '」입니다. ' +
          '<a href="place-' + esc(code) + '.html">' + esc(me.name) + '의 2주 전시일정 →</a>';
      }
    });
  }

  Promise.all([
    get('terra_pins?select=code,name,sort,meta&kind=eq.heritage&order=sort'),
    get('heritage_items?select=id,name,artist,period,img&category=eq.visual&status=eq.active&order=hang_order.asc.nullslast,id.asc')
  ]).then(function(r){
    halls = r[0] || []; list = r[1] || [];
    render();
    /* 서울 자정을 넘기면 창을 켜 둔 채로도 다음 그림으로 */
    setInterval(function(){ if (kstDay() !== dayNo) render(); }, 60 * 1000);
  }).catch(function(){
    /* DB가 안 오면 빈 방이라도 — 낮의 빛은 보인다 */
    figs.forEach(function(fig){
      var code = fig.getAttribute('data-hall'), hr = fig.querySelector('.hr'), wall = hr.querySelector('img.wall');
      loadWall(wall, PUB + code + '_hall_d.webp', function(){ hr.classList.add('on'); });
    });
  });
})();
