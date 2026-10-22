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

  /* ── 탁자 — 잔과 디저트 한 접시 · 잔 입에서 김이 오른다 (위 「탁자에 앉으면」 · 아래 「탁자 위의 한 스푼」 두 칸이 같은 그림 · 같은 김) ── */
  var figs = [].slice.call(document.querySelectorAll('.ct-table, .ct-spoon'));
  if (!figs.length) return;
  var tcode = figs[0].getAttribute('data-code');
  var st = null;
  figs.forEach(function(f){ f.querySelector('.ct-in img').src = PUB + tcode + '_cup_1.webp'; });

  function place(f){
    var frame = f.querySelector('.ct-frame'), steam = f.querySelector('.steam');
    if (!st || !st.on) { steam.style.display = 'none'; return; }
    var w = frame.clientWidth, h = frame.clientHeight; if (!w || !h) return;
    var k = Math.max(w / IW, h / IH), rw = IW * k, rh = IH * k;     /* object-fit:cover 와 같은 셈 */
    var ox = (w - rw) / 2, oy = (h - rh) / 2;
    steam.style.display = '';
    steam.style.left = (ox + rw * st.x / 100) + 'px';
    steam.style.top  = (oy + rh * st.y / 100) + 'px';
    steam.style.transform = 'translate(-50%,-100%) scale(' + ((st.s || 1) * rw / BASE).toFixed(3) + ')';
  }
  function placeAll(){ figs.forEach(place); }
  var H = { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } };
  fetch(SUPA + '/rest/v1/terra_pins?select=steam:meta->cup_steam&kind=eq.hansfoon&code=eq.' + encodeURIComponent(tcode), H)
    .then(function(r){ return r.json(); })
    .then(function(L){
      var s = L && L[0] && L[0].steam && L[0].steam['1'];
      if (s && s.on !== false) st = { x: +s.x, y: +s.y, s: +s.s || 1, on: true };
      placeAll();
    }).catch(function(){});
  window.addEventListener('resize', placeAll);

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function watch(f, enter, leave){
    var frame = f.querySelector('.ct-frame');
    if (!('IntersectionObserver' in window)) { enter(); return; }
    new IntersectionObserver(function(es){
      es.forEach(function(e){
        if (e.intersectionRatio >= .3 || (e.isIntersecting && e.intersectionRect.height >= innerHeight * .6)) enter();
        else if (!e.isIntersecting && leave) leave();
      });
    }, { threshold: [0, .3, .5] }).observe(frame);
  }

  /* 「탁자에 앉으면」 — 화면에 들어오면 그림이 천천히 다가앉고(1.05 → 1) 김이 피어오른다 · 나가면 김을 거둔다 */
  var tab = document.querySelector('.ct-table');
  if (tab) watch(tab,
    function(){ tab.querySelector('.ct-in').classList.add('in'); tab.querySelector('.steam').classList.add('on'); place(tab); },
    function(){ tab.querySelector('.steam').classList.remove('on'); });

  /* 「탁자 위의 한 스푼」 — 지금 열려 있는 회차(spoons · open_on 이 오늘이거나 그 앞인 가장 최근 — 앱 hello_spoon fetchSpoon · Today 와 같은 셈)
     탁자가 어두워지고 → 오늘의 문장 → 이야기 첫 두 단락 → 「이어지는 이야기와 퀴즈는 EG 안에서」 → 그대로 멈춤 · 도돌이 없음 (1022 소로) */
  var sp = document.querySelector('.ct-spoon');
  if (!sp) return;
  var WD = '일월화수목금토';
  function esc(t){ return String(t == null ? '' : t).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function br(t){ return esc(t).replace(/\n/g, '<br>'); }
  var today = new Date(Date.now() + 9 * 36e5).toISOString().slice(0, 10);   /* 서울 날짜 */
  var ready = false, wanted = false, done = false;
  function play(){
    if (done) return; done = true;
    var frame = sp.querySelector('.ct-frame'), lines = sp.querySelectorAll('.line');
    sp.querySelector('.ct-in').classList.add('in'); sp.querySelector('.steam').classList.add('on'); place(sp);
    frame.classList.add('dim');
    if (reduce){ [].forEach.call(lines, function(l){ l.classList.add('on'); }); return; }
    [].forEach.call(lines, function(l, i){ setTimeout(function(){ l.classList.add('on'); }, 1100 + i * 1900); });
  }
  fetch(SUPA + '/rest/v1/spoons?select=headline,story,open_on&status=eq.published&open_on=lte.' + today + '&order=open_on.desc,spoon_no.desc&limit=1', H)
    .then(function(r){ return r.json(); })
    .then(function(L){
      var x = L && L[0]; if (!x || !x.headline) { sp.hidden = true; return; }
      sp.querySelector('.head').innerHTML = br(x.headline);
      var paras = (x.story || []).filter(function(b){ return b && b.type === 'text' && b.text; }).slice(0, 2);
      sp.querySelector('.story').innerHTML = paras.map(function(b){ return '<p class="line">' + br(b.text) + '</p>'; }).join('');
      var d = new Date(x.open_on + 'T00:00:00Z');
      sp.querySelector('.ct-where').textContent = sp.getAttribute('data-name') + ' · 지금 열려 있는 한 스푼 · ' +
        (d.getUTCMonth() + 1) + '/' + d.getUTCDate() + '(' + WD[d.getUTCDay()] + ') 열림';
      ready = true; if (wanted) play();
    }).catch(function(){ sp.hidden = true; });
  watch(sp, function(){ wanted = true; if (ready) play(); });
})();
