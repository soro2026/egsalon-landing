/* ══════════════════════════════════════════════════════════════════════════
   cafetable.js — Places 카페 집 페이지의 「문을 열면 · 탁자에 앉으면」 (2026.10.22 저녁 · 파이스)
   1022 소로 — 「우리가 애써 만들어 놓은 각 카페의 장면들 · 디저트도 한 접시씩 구워두었고 그걸 활용해서 군침돌게」
   그림은 앱과 같은 파일 — tour-assets/hansfoon/<곳>_hall_<m|d|e|n>.webp(실내) · <곳>_cup_1.webp(탁자 · 잔과 디저트 한 접시)
   김은 앱 콘솔에서 맞춘 잔 입 자리 — terra_pins.meta.cup_steam(그림 기준 % · 크기 s) — Today 교양 한 스푼 무대와 같은 값 · 같은 김
   ⚠ 고치면 꼬리표(?v=)를 tools/place_page.py 에서 함께 바꾼다
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  var SUPA = 'https://cyhlotwdisjvoxvfkpnd.supabase.co', KEY = 'sb_publishable_jYYfQV_wQgMRFjSUuDq7xA_gWc9vsnR';
  var PUB = SUPA + '/storage/v1/object/public/tour-assets/hansfoon/';
  var IW = 1672, IH = 941;          /* 앱 카페 그림 판 */
  var BASE = 1440;                  /* Today 무대에서 김(90×150)이 맞던 그림 폭 — 그 비율로 줄이고 늘린다 */

  /* ── 실내 — 서울 시각의 빛으로 열고, 아침 · 낮 · 저녁 · 밤을 누르면 그 빛으로 갈아 낀다 ── */
  var hall = document.querySelector('.ct-hall');
  if (hall){
    var code = hall.getAttribute('data-code');
    var imgs = hall.querySelectorAll('.ct-frame img');
    var chips = hall.querySelectorAll('.ct-chips button');
    var now = (window.egPhase ? egPhase() : 'd'), cur = null, front = 0, seq = 0;
    chips.forEach(function(b){
      if (b.getAttribute('data-t') === now) b.classList.add('now');
      b.addEventListener('click', function(){ show(b.getAttribute('data-t')); });
    });
    function show(t){
      if (t === cur) return;
      cur = t;
      chips.forEach(function(b){ b.setAttribute('aria-pressed', b.getAttribute('data-t') === t ? 'true' : 'false'); });
      var my = ++seq, back = imgs[1 - front];
      back.onload = function(){
        if (my !== seq) return;
        back.classList.add('on'); imgs[front].classList.remove('on'); front = 1 - front;
      };
      back.src = PUB + code + '_hall_' + t + '.webp';
    }
    show(now);
  }

  /* ── 탁자 — 잔과 디저트 한 접시 · 잔 입에서 김이 오른다 ── */
  var tab = document.querySelector('.ct-table');
  if (!tab) return;
  var tcode = tab.getAttribute('data-code');
  var frame = tab.querySelector('.ct-frame'), inner = tab.querySelector('.ct-in');
  var timg = tab.querySelector('.ct-in img'), steam = tab.querySelector('.steam');
  var st = null;
  timg.src = PUB + tcode + '_cup_1.webp';

  function place(){
    if (!st || !st.on) { steam.style.display = 'none'; return; }
    var w = frame.clientWidth, h = frame.clientHeight; if (!w || !h) return;
    var k = Math.max(w / IW, h / IH), rw = IW * k, rh = IH * k;     /* object-fit:cover 와 같은 셈 */
    var ox = (w - rw) / 2, oy = (h - rh) / 2;
    steam.style.display = '';
    steam.style.left = (ox + rw * st.x / 100) + 'px';
    steam.style.top  = (oy + rh * st.y / 100) + 'px';
    steam.style.transform = 'translate(-50%,-100%) scale(' + ((st.s || 1) * rw / BASE).toFixed(3) + ')';
  }
  fetch(SUPA + '/rest/v1/terra_pins?select=steam:meta->cup_steam&kind=eq.hansfoon&code=eq.' + encodeURIComponent(tcode),
        { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } })
    .then(function(r){ return r.json(); })
    .then(function(L){
      var s = L && L[0] && L[0].steam && L[0].steam['1'];
      if (s && s.on !== false) st = { x: +s.x, y: +s.y, s: +s.s || 1, on: true };
      place();
    }).catch(function(){});
  window.addEventListener('resize', place);

  /* 화면에 들어오면 — 그림이 천천히 다가앉고(1.05 → 1) 김이 피어오른다 · 나가면 김을 거둔다 */
  if ('IntersectionObserver' in window){
    new IntersectionObserver(function(es){
      es.forEach(function(e){
        if (e.intersectionRatio >= .3){ inner.classList.add('in'); steam.classList.add('on'); place(); }
        else if (!e.isIntersecting){ steam.classList.remove('on'); }
      });
    }, { threshold: [0, .35] }).observe(frame);
  } else { inner.classList.add('in'); steam.classList.add('on'); }
})();
