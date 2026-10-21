/* ══════════════════════════════════════════════════════════════════════════
   place.js — Places 집 한 곳 페이지가 함께 쓰는 손 (2026.10.21 밤 · 파이스)
   ① 맨 위 대문 그림 — 서울 시각 아침 · 낮 · 저녁 · 밤(egPhase — Places 첫 화면 · Today 와 같은 하늘)
   ② 「이 집 이야기 듣기」 — 앱 대문 안내문과 같은 낭독 파일(voice_takes · scope place)
   ③ 열나흘의 전시 — ⭐ 홈페이지에서 처음으로 손님 브라우저가 DB 를 직접 읽는 칸(1021 소로)
      셈은 앱 terra.html showHallNote 와 한 벌 — 그림 = 배열[ (D + k + floor(no × N ÷ H)) mod N ]
        D  서울 날수 floor((지금 + 9시간) ÷ 하루)            (앱 concertDay)
        H  미술관 전부(terra_pins kind heritage · sort 순 · 잠든 관 포함)   (앱 loadGalerieHallsAll)
        N  그림 전부(heritage_items visual · active · hang_order → id 순) (앱 loadGalerieArts)
        no 그 관의 meta.museum_no
      ⚠⚠ 앱 공식을 고치면 여기도 함께 — 한 곳만 고치면 앱은 티치아노, 홈페이지는 프리드리히가 된다
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  var SUPA = 'https://cyhlotwdisjvoxvfkpnd.supabase.co';
  var KEY  = 'sb_publishable_jYYfQV_wQgMRFjSUuDq7xA_gWc9vsnR';
  var WD = '일월화수목금토';
  var DAY = 86400000;

  /* ── ① 대문 그림의 시간대 m 아침 · d 낮 · e 저녁 · n 밤 — egSky 가 못 오면 서울 시각 고정 구간 ── */
  window.egPhase = window.egPhase || function(){
    try { if (window.egSky && egSky.phase) return egSky.phase(); } catch(e){}
    var h = new Date(Date.now() + 9 * 3600000).getUTCHours();
    return (h>=5 && h<9) ? 'm' : (h>=9 && h<17) ? 'd' : (h>=17 && h<20) ? 'e' : 'n';
  };
  function paintGates(){
    var t = egPhase(), g = (t === 'e' || t === 'n') ? 'n' : 'd';
    document.querySelectorAll('img[data-tpl]').forEach(function(im){
      var s = im.getAttribute('data-tpl').replace('{t}', t).replace('{g}', g);
      if (im.getAttribute('src') !== s) im.src = s;
    });
  }
  paintGates();
  setInterval(paintGates, 10 * 60 * 1000);   /* 창을 오래 켜 두어도 저녁이 오면 대문에 불이 켜진다 */

  /* ── ② 이 집 이야기 듣기 ── */
  document.querySelectorAll('button.voice[data-src]').forEach(function(b){
    var a = null, lab = b.querySelector('.v-lab');
    var idle = lab ? lab.textContent : '';
    b.addEventListener('click', function(){
      if (!a){
        a = new Audio(b.getAttribute('data-src'));
        a.addEventListener('ended', function(){ b.classList.remove('on'); if (lab) lab.textContent = idle; });
      }
      if (a.paused){ a.play().catch(function(){}); b.classList.add('on'); if (lab) lab.textContent = '듣는 중 · 누르면 멈춤'; }
      else { a.pause(); b.classList.remove('on'); if (lab) lab.textContent = idle; }
    });
  });

  /* ── ③ 열나흘의 전시 ── */
  var box = document.getElementById('fortnight');
  if (!box) return;
  var CODE = box.getAttribute('data-code');

  function kstDay(){ return Math.floor((Date.now() + 9 * 3600000) / DAY); }
  function label(dayNo){ var d = new Date(dayNo * DAY); return (d.getUTCMonth() + 1) + '/' + d.getUTCDate() + '(' + WD[d.getUTCDay()] + ')'; }
  function esc(t){ return String(t == null ? '' : t).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  /* 받침 — 「우르비노의 비너스」는 · 루브르 박물관으로 */
  function jong(s){ s = String(s || '').replace(/[」』"'\s)]+$/, ''); var c = s.charCodeAt(s.length - 1); return (c >= 0xAC00 && c <= 0xD7A3) ? (c - 0xAC00) % 28 : -1; }
  function eun(s){ var j = jong(s); return j < 0 ? '은(는)' : j ? '은' : '는'; }
  function get(path){
    return fetch(SUPA + '/rest/v1/' + path, { headers:{ apikey:KEY, Authorization:'Bearer ' + KEY } })
      .then(function(r){ if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }
  var halls = null, arts = null;

  function meta(w){ return [w.artist, w.period, w.movement].filter(Boolean).join(' · '); }

  function render(){
    var H = halls.length, N = arts.length;
    var me = halls.filter(function(h){ return h.code === CODE; })[0];
    if (!H || !N || !me){ box.innerHTML = '<p class="ft-note">편성을 준비하고 있습니다.</p>'; return; }
    var off = function(h){ return Math.floor(Number((h.meta || {}).museum_no || 0) * N / H); };
    var D = kstDay(), o = off(me);
    var at = function(k){ return arts[((D + k + o) % N + N) % N]; };

    var w0 = at(0), out = [];
    out.push('<div class="ft-today">',
      '<div class="ft-wall">' + (w0.img ? '<img src="' + esc(w0.img) + '" alt="' + esc(w0.artist + ' 「' + w0.name + '」') + '">' : '') + '</div>',
      '<div class="ft-plaque"><span class="ft-when">오늘 · ' + label(D) + '</span>',
      '<h3>「' + esc(w0.name) + '」</h3>',
      '<span class="ft-meta">' + esc(meta(w0)) + '</span>',
      (w0.scene ? '<p class="ft-scene">' + esc(w0.scene) + '</p>' : ''),
      '</div></div>');

    out.push('<ol class="ft-list">');
    for (var k = 1; k < 14; k++){
      var w = at(k);
      out.push('<li><span class="ft-d">' + label(D + k) + '</span>',
        '<span class="ft-th">' + (w.img ? '<img src="' + esc(w.img) + '" alt="" loading="lazy">' : '') + '</span>',
        '<span class="ft-t"><b>「' + esc(w.name) + '」</b><i>' + esc(meta(w)) + '</i>' + (w.scene ? '<em>' + esc(w.scene) + '</em>' : '') + '</span></li>');
    }
    out.push('</ol>');

    /* 오늘 이 방의 그림이 다음에 걸리는 관 — 관마다 floor(N ÷ H)날씩 떨어져 같은 줄을 따라간다 */
    var best = null;
    halls.forEach(function(h){
      if (h.code === CODE) return;
      var d = ((o - off(h)) % N + N) % N;
      if (d > 0 && (!best || d < best.d)) best = { d:d, h:h };
    });
    if (best){
      var hn = (best.h.meta && best.h.meta.title_ko) || best.h.name;
      out.push('<p class="ft-leave">오늘 이 방의 「' + esc(w0.name) + '」' + eun(w0.name) + ' <b>' + label(D + best.d) + '</b> '
        + '<a href="place-' + esc(best.h.code) + '.html">' + esc(hn) + '</a>에 다시 걸립니다.</p>');
    }
    box.innerHTML = out.join('');
    box.setAttribute('data-day', D);
  }

  Promise.all([
    get('terra_pins?select=code,name,active,sort,meta&kind=eq.heritage&order=sort'),
    get('heritage_items?select=id,name,artist,period,movement,img,scene:layers->>scene&category=eq.visual&status=eq.active&order=hang_order.asc.nullslast,id.asc')
  ]).then(function(r){
    halls = Array.isArray(r[0]) ? r[0] : []; arts = Array.isArray(r[1]) ? r[1] : [];
    render();
    /* 서울 자정을 넘기면 한 칸 넘긴다 — 창을 밤새 켜 두어도 앱과 같은 날을 가리킨다 */
    setInterval(function(){ if (String(kstDay()) !== box.getAttribute('data-day')) render(); }, 60 * 1000);
  }).catch(function(e){
    console.warn('[EG] 열나흘의 전시 로드 실패:', e);
    box.innerHTML = '<p class="ft-note">편성을 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.</p>';
  });
})();
