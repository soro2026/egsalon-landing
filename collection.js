/* ══════════════════════════════════════════════════════════════════════════
   collection.js — Collection 서랍 넷 (2026.10.23 · 파이스)
   1023 소로 — Collection 첫 화면은 서랍 넷(그림 · 곡 · 별 · 273권) · 그림 서랍부터.
   손님 브라우저가 DB 를 직접 읽는다(1021 밤 Places 와 같은 길 · 공개 키 · 읽기만).

   ① 숫자 — 서랍마다 지금 DB 의 수(못 읽으면 html 에 적힌 수 그대로)
   ② 그림 서랍 — heritage_items visual · active 를 사조별 · 시대순으로 어두운 벽에
        사조 차례 = 그 사조에서 가장 이른 해 · 사조 안 = 해 → 거는 순서(hang_order)
   ③ 곡 서랍(1023 소로 「음반 재킷은 CSS 라 심심」 → 작곡가의 벽) — 곡을 쓴 사람의 액자 초상(stars.framed_url · 이름 · 별칭)
        태어난 해 순서 · 네 방(바로크 ~1699 · 고전파 1700~1779 · 낭만파 1780~1859 · 후기 낭만과 20세기 1860~)
        초상 아래에 그 사람의 곡을 한 줄씩 · 초상이 없는 곡(「여러 작곡가」)은 그 곡이 오를 음악관의 무대 그림
   ④ 누르면 크게 — 명패 · 한 줄 장면 · 다섯 관에 다음에 걸리는(오르는) 날
        셈은 place.js · hallroom.js · concertroom.js · 앱 terra.html showHallNote · concert.html todaysSong 과 한 벌
          오늘 관 h 의 것 = 배열[ (D + floor(no × N ÷ H)) mod N ]  →  i 번째가 관 h 에 오는 날 = D + ((i − off(h) − D) mod N)
          그림  H 미술관 전부(terra_pins heritage · sort · 잠든 관 포함) · N 그림(hang_order → id) · no meta.museum_no
          곡    H 깨어 있는 음악관(terra_pins concert · active · sort)      · N 곡(id 순)            · no meta.hall_no
        ⚠⚠ 앱 공식을 고치면 여기도 함께
   4겹 해설 · 설명 듣기 · 연주 · 거실에 들이기는 앱 몫(「홈은 보는 곳, 앱은 하고 남는 곳」 1018 · 「곡은 만나는 날에만」 0816)
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  var SUPA = 'https://cyhlotwdisjvoxvfkpnd.supabase.co';
  var KEY  = 'sb_publishable_jYYfQV_wQgMRFjSUuDq7xA_gWc9vsnR';
  var STAGE = SUPA + '/storage/v1/object/public/tour-assets/concert/';
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
  /* 해설 글의 *제목* · **굵게** — 홈페이지 한 줄에서는 별표를 걷고, 홑별표는 작품 표기 「 」로 */
  function plain(t){ return String(t || '').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '「$1」'); }

  /* ── ① 서랍 숫자 ── */
  function setCount(key, n){
    if (!n) return;   /* 못 읽었거나 손님 읽기가 막힌 표(0)면 html 에 적힌 수 그대로 */
    document.querySelectorAll('[data-count="' + key + '"]').forEach(function(el){ el.textContent = n; });
  }
  get('stars?select=id&limit=1', true).then(function(n){ setCount('stars', n); }).catch(function(){});
  get('college_books?select=id&limit=1', true).then(function(n){ setCount('college', n); }).catch(function(){});

  /* ── 서랍 바꾸기 — 다른 페이지로 보내지 않고 이 페이지 안에서(1022 소로 「링크로 보내지 말고」) ── */
  var drawers = document.querySelectorAll('.dr[data-dr]');
  function show(id, scroll){
    var sec = document.getElementById(id);
    if (!sec || !sec.classList.contains('drawer')) return;
    document.querySelectorAll('section.drawer').forEach(function(s){ s.hidden = (s !== sec); });
    drawers.forEach(function(d){
      var on = d.getAttribute('data-dr') === id;
      d.classList.toggle('on', on);
      if (on) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
    });
    if (scroll) sec.scrollIntoView({ behavior:'smooth', block:'start' });
  }
  drawers.forEach(function(d){
    d.addEventListener('click', function(e){
      e.preventDefault();
      var id = d.getAttribute('data-dr');
      try { history.replaceState(null, '', '#' + id); } catch(x){}
      show(id, true);
    });
  });
  if (location.hash) show(location.hash.slice(1), false);

  /* ══ 두 서랍이 함께 쓰는 셈 ══ */
  function Shelf(conf){
    this.conf = conf; this.halls = []; this.list = []; this.order = []; this.D = kstDay();
  }
  Shelf.prototype.off = function(h){ return Math.floor(Number((h.meta || {})[this.conf.no] || 0) * this.list.length / this.halls.length); };
  Shelf.prototype.awake = function(){ return this.halls.filter(function(h){ return h.active !== false; }); };
  Shelf.prototype.hallName = function(h){ return (h.meta && h.meta.title_ko) || h.name; };
  Shelf.prototype.when = function(i){
    var me = this, N = this.list.length;
    return this.awake().map(function(h){ return { h:h, d:((i - me.off(h) - me.D) % N + N) % N }; })
      .sort(function(a, b){ return a.d - b.d; });
  };
  Shelf.prototype.today = function(){
    var me = this, N = this.list.length, out = {};
    this.D = kstDay();
    this.awake().forEach(function(h){
      var i = ((me.D + me.off(h)) % N + N) % N;
      out[i] = (out[i] ? out[i] + ' · ' : '') + me.conf.short(me.hallName(h));
    });
    return out;
  };

  /* ══ ② 그림 서랍 ══ */
  var art = new Shelf({ no:'museum_no', short:function(n){ return n.replace(/ (미술관|박물관)$/, ''); } });
  var artBox = document.getElementById('wallRooms');

  function renderArt(){
    var today = art.today(), groups = {}, names = [];
    art.list.forEach(function(w, i){
      var g = w.movement || '그 밖의 그림';
      if (!groups[g]){ groups[g] = []; names.push(g); }
      groups[g].push({ w:w, i:i, y:year(w.period) });
    });
    names.forEach(function(g){ groups[g].sort(function(a, b){ return a.y - b.y || a.i - b.i; }); });
    names.sort(function(a, b){ return groups[a][0].y - groups[b][0].y; });

    art.order = [];
    var out = [];
    names.forEach(function(g){
      var list = groups[g], y0 = list[0].y, y1 = list[list.length - 1].y;
      out.push('<section class="wroom"><h3 class="wroom-h"><b>' + esc(g) + '</b><span>'
        + (y0 === 9999 ? '' : y0 + (y1 !== y0 && y1 !== 9999 ? '–' + y1 : '')) + '</span></h3><div class="wrow">');
      list.forEach(function(x){
        var k = art.order.length; art.order.push(x.i);
        var w = x.w, t = today[x.i];
        out.push('<button class="wa' + (w.ratio === 'portrait' ? ' pt' : '') + (t ? ' now' : '') + '" type="button" data-k="' + k + '"'
          + ' aria-label="' + esc(w.artist + ' 「' + w.name + '」') + '">'
          + '<span class="wa-f"><img src="' + esc(w.img) + '" alt="" loading="lazy" decoding="async"></span>'
          + '<span class="wa-t"><b>「' + esc(w.name) + '」</b><i>' + esc(w.artist) + '</i>'
          + (t ? '<em>오늘 · ' + esc(t) + '</em>' : '') + '</span></button>');
      });
      out.push('</div></section>');
    });
    artBox.innerHTML = out.join('');
    artBox.setAttribute('data-day', art.D);
    fadeIn(artBox);
  }

  /* ══ ③ 곡 서랍 — 작곡가의 벽 ══ */
  var song = new Shelf({ no:'hall_no', short:function(n){ return n; } });
  var musicBox = document.getElementById('musicRooms');
  var faces = {};                       /* 지은 사람 이름 → { img, birth, death } */
  var ERAS = [
    { to:1699, name:'바로크' },
    { to:1779, name:'고전파' },
    { to:1859, name:'낭만파' },
    { to:9999, name:'후기 낭만과 20세기' }
  ];
  /* 곡 이름이 지은 사람의 성으로 시작하면 초상 아래에서는 성을 뗀다(「베토벤 교향곡 6번 …」 → 「교향곡 6번 …」) */
  function shortSong(name, artist){
    var last = String(artist || '').split(' ').pop();
    return (last && name.indexOf(last + ' ') === 0) ? name.slice(last.length + 1) : name;
  }
  /* 초상이 없는 곡 — 그 곡이 오늘 또는 다음에 오르는 음악관의 무대 그림 */
  function stageFor(i){ var x = song.when(i)[0]; return x ? STAGE + x.h.code + '_hall.webp' : ''; }

  function renderMusic(){
    var today = song.today(), by = {}, people = [];
    song.list.forEach(function(w, i){
      var a = w.artist || '여러 작곡가';
      if (!by[a]){ by[a] = { name:a, f:faces[a], songs:[] }; people.push(by[a]); }
      by[a].songs.push({ w:w, i:i, y:year(w.period) });
    });
    people.forEach(function(p){ p.songs.sort(function(a, b){ return a.y - b.y || a.i - b.i; }); });
    people.sort(function(a, b){ return ((a.f && a.f.birth) || 99999) - ((b.f && b.f.birth) || 99999); });

    var rooms = ERAS.map(function(e){ return { name:e.name, to:e.to, people:[] }; });
    var rest = { name:'여러 작곡가의 무대', people:[] };
    people.forEach(function(p){
      var b = p.f && p.f.birth;
      if (!b){ rest.people.push(p); return; }
      for (var r = 0; r < rooms.length; r++){ if (b <= rooms[r].to){ rooms[r].people.push(p); break; } }
    });
    if (rest.people.length) rooms.push(rest);

    song.order = [];
    var out = [];
    rooms.forEach(function(room){
      if (!room.people.length) return;
      var bs = room.people.map(function(p){ return p.f && p.f.birth; }).filter(Boolean);
      out.push('<section class="wroom"><h3 class="wroom-h"><b>' + esc(room.name) + '</b><span>'
        + (bs.length ? Math.min.apply(null, bs) + '–' + Math.max.apply(null, bs) + '년생' : '') + '</span></h3><div class="wrow">');
      room.people.forEach(function(p){
        var img = p.f ? p.f.img : stageFor(p.songs[0].i);
        out.push('<div class="mc' + (p.f ? '' : ' stage') + '">',
          '<span class="wa-f"><img src="' + esc(img) + '" alt="' + esc(p.name) + '" loading="lazy" decoding="async"></span>',
          '<span class="mc-n"><b>' + esc(p.name) + '</b>' + (p.f && p.f.birth ? '<i>' + p.f.birth + '–' + (p.f.death || '') + '</i>' : '') + '</span>',
          '<ul class="mc-s">');
        p.songs.forEach(function(x){
          var k = song.order.length; song.order.push(x.i);
          var t = today[x.i];
          out.push('<li><button type="button" data-k="' + k + '"' + (t ? ' class="now"' : '') + '>「' + esc(shortSong(x.w.name, p.name)) + '」'
            + (t ? '<em>오늘 · ' + esc(t) + '</em>' : '') + '</button></li>');
        });
        out.push('</ul></div>');
      });
      out.push('</div></section>');
    });
    musicBox.innerHTML = out.join('');
    musicBox.setAttribute('data-day', song.D);
    fadeIn(musicBox);
  }

  function fadeIn(root){
    root.querySelectorAll('.wa-f img').forEach(function(img){
      var host = img.closest('.wa, .mc');
      var done = function(){ host.classList.add('in'); };
      if (img.complete && img.naturalWidth) done(); else img.addEventListener('load', done);
    });
  }

  /* ══ ④ 크게 보기 — 두 서랍이 함께 ══ */
  var lb = document.getElementById('lb'), cur = -1, kind = 'art', lastFocus = null;
  var LB = {
    art:  { shelf:art,  head:'다섯 미술관에 걸리는 날', app:'그림의 네 겹 해설과 설명 듣기, 내 집 거실에 들이기는 EG유니버스 안에서.',
            img:function(w){ return w.img; }, meta:function(w){ return [w.artist, w.period, w.movement]; }, by:'' },
    song: { shelf:song, head:'다섯 음악관에 오르는 날', app:'곡 이야기 듣기와 연주는 그 곡이 음악관에 오르는 날, EG유니버스 안에서.',
            img:function(w, i){ var f = faces[w.artist]; return f ? f.img : stageFor(i); }, meta:function(w){ return [w.artist, w.period]; }, by:'origin' }
  };
  function open(which, k){
    if (!lb) return;
    var L = LB[which], S = L.shelf;
    kind = which;
    cur = (k + S.order.length) % S.order.length;
    var i = S.order[cur], w = S.list[i];
    var big = lb.querySelector('.lb-img');
    big.classList.remove('in');
    big.onload = function(){ big.classList.add('in'); };
    big.alt = (w.artist || '') + ' 「' + w.name + '」';
    big.src = L.img(w, i);
    lb.classList.toggle('song', which === 'song');
    lb.querySelector('.lb-name').textContent = '「' + w.name + '」';
    lb.querySelector('.lb-meta').textContent = L.meta(w).filter(Boolean).join(' · ');
    var by = lb.querySelector('.lb-by');
    by.textContent = L.by && w[L.by] ? '연주 · ' + w[L.by] : ''; by.hidden = !by.textContent;
    var sc = lb.querySelector('.lb-scene');
    sc.textContent = plain(w.scene); sc.hidden = !w.scene;
    lb.querySelector('.lb-wh h4').textContent = L.head;
    lb.querySelector('.lb-when').innerHTML = S.when(i).map(function(x){
      return '<li' + (x.d === 0 ? ' class="now"' : '') + '><span>' + (x.d === 0 ? '오늘' : label(S.D + x.d)) + '</span>' + esc(S.hallName(x.h)) + '</li>';
    }).join('');
    lb.querySelector('.lb-app').textContent = L.app;
    lb.querySelector('.lb-count').textContent = (cur + 1) + ' / ' + S.order.length;
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
  if (artBox) artBox.addEventListener('click', function(e){
    var b = e.target.closest('.wa'); if (b) open('art', Number(b.getAttribute('data-k')));
  });
  if (musicBox) musicBox.addEventListener('click', function(e){
    var b = e.target.closest('button[data-k]'); if (b) open('song', Number(b.getAttribute('data-k')));
  });
  if (lb){
    lb.querySelector('.lb-x').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', function(){ open(kind, cur - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function(){ open(kind, cur + 1); });
    lb.addEventListener('click', function(e){ if (e.target === lb) close(); });
    document.addEventListener('keydown', function(e){
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') open(kind, cur - 1);
      else if (e.key === 'ArrowRight') open(kind, cur + 1);
    });
    /* 휴대폰 — 옆으로 밀어 넘기기 */
    var sx = null;
    lb.addEventListener('touchstart', function(e){ sx = e.touches[0].clientX; }, { passive:true });
    lb.addEventListener('touchend', function(e){
      if (sx == null) return;
      var dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 50) open(kind, cur + (dx < 0 ? 1 : -1));
    }, { passive:true });
  }

  /* ── 불러오기 ── */
  function fail(box, what){ return function(e){
    console.warn('[EG] ' + what + ' 서랍 로드 실패:', e);
    if (box) box.innerHTML = '<p class="wall-note">' + what + '을 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.</p>';
  }; }

  if (artBox) Promise.all([
    get('terra_pins?select=code,name,active,sort,meta&kind=eq.heritage&order=sort'),
    get('heritage_items?select=id,name,artist,period,movement,ratio,img,scene:layers->>scene&category=eq.visual&status=eq.active&order=hang_order.asc.nullslast,id.asc')
  ]).then(function(r){
    art.halls = Array.isArray(r[0]) ? r[0] : []; art.list = Array.isArray(r[1]) ? r[1] : [];
    if (!art.halls.length || !art.list.length) throw new Error('empty');
    setCount('visual', art.list.length);
    renderArt();
  }).catch(fail(artBox, '그림'));

  if (musicBox) Promise.all([
    get('terra_pins?select=code,name,active,sort,meta&kind=eq.concert&active=is.true&order=sort'),
    get('heritage_items?select=id,name,artist,period,origin,scene:liner_note->>scene&category=eq.record&status=eq.active&order=id'),
    get('stars?select=name,aliases,birth,death,framed_url&framed_url=not.is.null').catch(function(){ return []; })
  ]).then(function(r){
    song.halls = Array.isArray(r[0]) ? r[0] : []; song.list = Array.isArray(r[1]) ? r[1] : [];
    if (!song.halls.length || !song.list.length) throw new Error('empty');
    (Array.isArray(r[2]) ? r[2] : []).forEach(function(s){
      var f = { img:s.framed_url, birth:s.birth, death:s.death };
      faces[s.name] = f;
      (Array.isArray(s.aliases) ? s.aliases : []).forEach(function(a){ if (!faces[a]) faces[a] = f; });
    });
    setCount('record', song.list.length);
    renderMusic();
  }).catch(fail(musicBox, '곡'));

  /* 서울 자정을 넘기면 「오늘」을 다시 단다 */
  setInterval(function(){
    var d = String(kstDay());
    if (artBox && art.list.length && artBox.getAttribute('data-day') !== d) renderArt();
    if (musicBox && song.list.length && musicBox.getAttribute('data-day') !== d) renderMusic();
  }, 60 * 1000);
})();
