/* ══════════════════════════════════════════════════════════════════════════
   collection.js — Collection 서랍 넷 (2026.10.23 · 파이스)
   1023 소로 — Collection 첫 화면은 서랍 넷(그림 · 곡 · 별 · 273권) · 그림 서랍부터.
   손님 브라우저가 DB 를 직접 읽는다(1021 밤 Places 와 같은 길 · 공개 키 · 읽기만).

   ① 숫자 — 서랍마다 지금 DB 의 수(못 읽으면 html 에 적힌 수 그대로)
   ② 그림 서랍 — heritage_items visual · active 75점을 사조별 · 시대순으로 어두운 벽에 건다
        사조 차례 = 그 사조에서 가장 이른 해 · 사조 안 = 해 → 거는 순서(hang_order)
        「오늘」 표시 = 다섯 미술관에 오늘 걸린 그림(앱과 같은 셈)
   ③ 그림을 누르면 — 크게 · 명패 · 한 줄 장면(layers.scene) · 다섯 미술관에 다음에 걸리는 날
        셈은 place.js · hallroom.js · 앱 terra.html showHallNote 와 한 벌
          오늘 관 h 에 걸린 그림 = 배열[ (D + floor(no × N ÷ H)) mod N ]
          → 그림 i 가 관 h 에 걸리는 날 = D + ((i − off(h) − D) mod N)
          D 서울 날수 · H 미술관 전부(terra_pins heritage · sort · 잠든 관 포함) · N 그림 전부(hang_order → id) · no meta.museum_no
        ⚠⚠ 앱 공식을 고치면 여기도 함께 — 앱 terra.html · galerie.html · concert.html · admin + place.js + hallroom.js + 이 파일
   4겹 해설 · 설명 듣기 · 거실에 들이기는 앱 몫(「홈은 보는 곳, 앱은 하고 남는 곳」 1018 소로)
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  var SUPA = 'https://cyhlotwdisjvoxvfkpnd.supabase.co';
  var KEY  = 'sb_publishable_jYYfQV_wQgMRFjSUuDq7xA_gWc9vsnR';
  var DAY  = 86400000;
  var WD   = '일월화수목금토';

  function get(path, count){
    var h = { apikey:KEY, Authorization:'Bearer ' + KEY };
    if (count) h.Prefer = 'count=exact';
    return fetch(SUPA + '/rest/v1/' + path, { headers:h }).then(function(r){
      if (!r.ok) throw new Error('HTTP ' + r.status);
      if (count){ var m = /\/(\d+)$/.exec(r.headers.get('content-range') || ''); return m ? Number(m[1]) : null; }
      return r.json();
    });
  }
  function esc(t){ return String(t == null ? '' : t).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function kstDay(){ return Math.floor((Date.now() + 9 * 3600000) / DAY); }
  function label(dayNo){ var d = new Date(dayNo * DAY); return (d.getUTCMonth() + 1) + '/' + d.getUTCDate() + '(' + WD[d.getUTCDay()] + ')'; }
  function year(p){ var m = /(\d{4})/.exec(p || ''); return m ? Number(m[1]) : 9999; }

  /* ── ① 서랍 숫자 ── */
  function setCount(key, n){
    if (!n) return;   /* 못 읽었거나 손님 읽기가 막힌 표(0)면 html 에 적힌 수 그대로 */
    document.querySelectorAll('[data-count="' + key + '"]').forEach(function(el){ el.textContent = n; });
  }
  get('heritage_items?select=id&category=eq.record&status=eq.active&limit=1', true).then(function(n){ setCount('record', n); }).catch(function(){});
  get('stars?select=id&limit=1', true).then(function(n){ setCount('stars', n); }).catch(function(){});
  get('college_books?select=id&limit=1', true).then(function(n){ setCount('college', n); }).catch(function(){});

  /* ── ② 그림 서랍 ── */
  var box = document.getElementById('wallRooms');
  if (!box) return;
  var halls = [], arts = [], order = [], D = kstDay();

  function off(h){ return Math.floor(Number((h.meta || {}).museum_no || 0) * arts.length / halls.length); }
  function hallName(h){ return (h.meta && h.meta.title_ko) || h.name; }
  /* 그림 i(거는 순서의 자리)가 관마다 다음에 걸리는 날 */
  function when(i){
    var N = arts.length;
    return halls.filter(function(h){ return h.active !== false; }).map(function(h){
      return { h:h, d:((i - off(h) - D) % N + N) % N };
    }).sort(function(a, b){ return a.d - b.d; });
  }

  function render(){
    D = kstDay();
    var N = arts.length;
    var today = {};                      /* 거는 자리 i → 오늘 걸린 관 이름 */
    halls.forEach(function(h){
      if (h.active === false) return;
      var i = ((D + off(h)) % N + N) % N;
      today[i] = (today[i] ? today[i] + ' · ' : '') + hallName(h).replace(/ (미술관|박물관)$/, '');
    });

    /* 사조별 · 시대순 */
    var groups = {}, names = [];
    arts.forEach(function(w, i){
      var g = w.movement || '그 밖의 그림';
      if (!groups[g]){ groups[g] = []; names.push(g); }
      groups[g].push({ w:w, i:i, y:year(w.period) });
    });
    names.forEach(function(g){ groups[g].sort(function(a, b){ return a.y - b.y || a.i - b.i; }); });
    names.sort(function(a, b){ return groups[a][0].y - groups[b][0].y; });

    order = [];
    var out = [];
    names.forEach(function(g){
      var list = groups[g], y0 = list[0].y, y1 = list[list.length - 1].y;
      out.push('<section class="wroom"><h3 class="wroom-h"><b>' + esc(g) + '</b><span>'
        + (y0 === 9999 ? '' : y0 + (y1 !== y0 && y1 !== 9999 ? '–' + y1 : '')) + '</span></h3><div class="wrow">');
      list.forEach(function(x){
        var k = order.length; order.push(x.i);
        var w = x.w, t = today[x.i];
        out.push('<button class="wa' + (w.ratio === 'portrait' ? ' pt' : '') + (t ? ' now' : '') + '" type="button" data-k="' + k + '"'
          + ' aria-label="' + esc(w.artist + ' 「' + w.name + '」') + '">'
          + '<span class="wa-f"><img src="' + esc(w.img) + '" alt="" loading="lazy" decoding="async"></span>'
          + '<span class="wa-t"><b>「' + esc(w.name) + '」</b><i>' + esc(w.artist) + '</i>'
          + (t ? '<em>오늘 · ' + esc(t) + '</em>' : '') + '</span></button>');
      });
      out.push('</div></section>');
    });
    box.innerHTML = out.join('');
    box.setAttribute('data-day', D);
    box.querySelectorAll('.wa img').forEach(function(img){
      var done = function(){ img.closest('.wa').classList.add('in'); };
      if (img.complete && img.naturalWidth) done(); else img.addEventListener('load', done);
    });
  }

  /* ── ③ 크게 보기 ── */
  var lb = document.getElementById('lb'), cur = -1, lastFocus = null;
  function open(k){
    if (!lb) return;
    cur = (k + order.length) % order.length;
    var i = order[cur], w = arts[i];
    var big = lb.querySelector('.lb-img');
    big.classList.remove('in');
    big.onload = function(){ big.classList.add('in'); };
    big.alt = w.artist + ' 「' + w.name + '」';
    big.src = w.img;
    lb.querySelector('.lb-name').textContent = '「' + w.name + '」';
    lb.querySelector('.lb-meta').textContent = [w.artist, w.period, w.movement].filter(Boolean).join(' · ');
    var sc = lb.querySelector('.lb-scene');
    sc.textContent = w.scene || ''; sc.hidden = !w.scene;
    lb.querySelector('.lb-when').innerHTML = when(i).map(function(x){
      return '<li' + (x.d === 0 ? ' class="now"' : '') + '><span>' + (x.d === 0 ? '오늘' : label(D + x.d)) + '</span>' + esc(hallName(x.h)) + '</li>';
    }).join('');
    lb.querySelector('.lb-count').textContent = (cur + 1) + ' / ' + order.length;
    if (lb.hidden){
      lastFocus = document.activeElement;
      lb.hidden = false;
      document.documentElement.classList.add('lb-open');
      requestAnimationFrame(function(){ lb.classList.add('on'); });
      lb.querySelector('.lb-x').focus();
    }
  }
  function close(){
    if (!lb || lb.hidden) return;
    lb.classList.remove('on');
    document.documentElement.classList.remove('lb-open');
    setTimeout(function(){ lb.hidden = true; }, 250);
    if (lastFocus) try { lastFocus.focus(); } catch(e){}
  }
  box.addEventListener('click', function(e){
    var b = e.target.closest('.wa'); if (b) open(Number(b.getAttribute('data-k')));
  });
  if (lb){
    lb.querySelector('.lb-x').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', function(){ open(cur - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function(){ open(cur + 1); });
    lb.addEventListener('click', function(e){ if (e.target === lb) close(); });
    document.addEventListener('keydown', function(e){
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') open(cur - 1);
      else if (e.key === 'ArrowRight') open(cur + 1);
    });
    /* 휴대폰 — 옆으로 밀어 넘기기 */
    var sx = null;
    lb.addEventListener('touchstart', function(e){ sx = e.touches[0].clientX; }, { passive:true });
    lb.addEventListener('touchend', function(e){
      if (sx == null) return;
      var dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 50) open(cur + (dx < 0 ? 1 : -1));
    }, { passive:true });
  }

  Promise.all([
    get('terra_pins?select=code,name,active,sort,meta&kind=eq.heritage&order=sort'),
    get('heritage_items?select=id,name,artist,period,movement,ratio,img,scene:layers->>scene&category=eq.visual&status=eq.active&order=hang_order.asc.nullslast,id.asc')
  ]).then(function(r){
    halls = Array.isArray(r[0]) ? r[0] : []; arts = Array.isArray(r[1]) ? r[1] : [];
    if (!halls.length || !arts.length) throw new Error('empty');
    setCount('visual', arts.length);
    render();
    /* 서울 자정을 넘기면 「오늘」을 다시 단다 */
    setInterval(function(){ if (String(kstDay()) !== box.getAttribute('data-day')) render(); }, 60 * 1000);
  }).catch(function(e){
    console.warn('[EG] 그림 서랍 로드 실패:', e);
    box.innerHTML = '<p class="wall-note">그림을 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.</p>';
  });
})();
