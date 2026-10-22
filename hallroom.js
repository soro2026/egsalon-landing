/* ══════════════════════════════════════════════════════════════════════════
   hallroom.js — 미술관 방 한 칸: 낮 판 방 + 오늘 그 관에 걸린 그림 (2026.10.22 · 파이스)
   1022 소로 — 「저녁이라 빛이 환하지 않은데, 오르세 벽 낮판 이미지에 오늘 작품 얹어서」
     → 캡처 대신 페이지가 직접 건다. 소로 촬영 없음 · 그림은 날마다 바뀜.

   figure.clip.hallroom[data-hall="<관 code>"] 를 찾아 채운다.
   ① 방 = 앱과 같은 파일 tour-assets/galerie/<관>_hall_d.webp — 시간대는 낮(d)으로 고정
         (이 칸이 말하려는 것이 그 방의 빛이라서 — 오르세 유리 지붕 · 우피치 옆 창)
   ② 걸이 = 앱 콘솔 값 그대로 terra_pins.meta.frame_rect · plaque_pos
         크기 셈은 앱 galerie.html hangBox · 홈페이지 today.html 미술관 무대와 한 벌(같은 면적 · 그림 비율)
   ③ 그림 = place.js 열나흘 표의 「오늘」과 같은 셈
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
    '.hallroom figcaption a{color:inherit;text-decoration:underline;text-underline-offset:3px}';
  document.head.appendChild(css);

  function kstDay(){ return Math.floor((Date.now() + 9 * 3600000) / DAY); }
  function esc(t){ return String(t == null ? '' : t).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function get(path){
    return fetch(SUPA + '/rest/v1/' + path, { headers:{ apikey:KEY, Authorization:'Bearer ' + KEY } })
      .then(function(r){ if (!r.ok) throw new Error(r.status); return r.json(); });
  }

  var halls = [], list = [], dayNo = -1;
  var baseCap = [];
  figs.forEach(function(f, i){ baseCap[i] = f.querySelector('figcaption').innerHTML; });

  /* 방은 칸 폭 100% · 위에서부터 보이되, 그림과 명패가 칸 아래로 빠지면 그만큼만 올린다 */
  function place(fig, me, w){
    var hr = fig.querySelector('.hr'), wall = hr.querySelector('img.wall');
    var art = hr.querySelector('.art'), img = art.querySelector('img'), hp = hr.querySelector('.hp');
    var m = me.meta || {}, R = m.frame_rect, P = m.plaque_pos;
    wall.onload = function(){ hr.classList.add('on'); };
    wall.src = PUB + me.code + '_hall_d.webp';
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
          '<a href="place-' + esc(code) + '.html">' + esc(me.name) + '의 열나흘 →</a>';
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
      wall.onload = function(){ hr.classList.add('on'); };
      wall.src = PUB + code + '_hall_d.webp';
    });
  });
})();
