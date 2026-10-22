/* ══════════════════════════════════════════════════════════════════════════
   starroom.js — Guide 별 페이지의 별 칸 셋: 액자 초상 · 교양의 풍경 · 별과 별 사이 (2026.10.22 · 파이스2)
   1022 소로 — 「꼭 영상 촬영이 필요한지 점검하고, 아니면 DB와 코드를 불러와서 구현」
     → 캡처 · 영상 세 칸을 페이지가 직접 짓는다. 손님이 직접 눌러 볼 수 있다.

   figure.clip.starroom[data-show="frame|scenes|link"][data-star="<별 이름>"] 를 찾아 채운다.
     frame  = 별 탐구 맨 위의 액자 초상(stars.framed_url) · 누르면 화면 가득(앱 star.html 과 같은 걸음)
     scenes = 교양의 풍경 — 앱 star.html loadFloor0 과 같은 데이터(rpc get_star_questions)와 같은 차례
              (작품끼리 가나다순 · 생애와 사상은 맨 뒤 · 작품 안은 RPC 차례 그대로)
              한 줄을 누르면 네 겹(지식 · 사유 · 연결 · 큐레이션). 화면에 처음 들어오면 첫 줄 하나를 펼쳐 보이고, 그다음은 손님 몫
              ⚠ 콩파뇽의 글(응답의 정원)은 싣지 않는다 — 회원의 글이라 동의 없이 홈페이지에 걸지 않는다(1018)
     link   = 별과 별 사이 — star_links(active · id 순) 가운데 오늘의 한 장 = [ 서울 날수 % 개수 ] · 카드 뒷면처럼 머리말 · 이야기 · 출처
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  var figs = document.querySelectorAll('figure.clip.starroom[data-show]');
  if (!figs.length) return;

  var SUPA = 'https://cyhlotwdisjvoxvfkpnd.supabase.co';
  var KEY  = 'sb_publishable_jYYfQV_wQgMRFjSUuDq7xA_gWc9vsnR';
  var DAY  = 86400000;

  var css = document.createElement('style');
  css.textContent = [
    /* 공통 — 별 칸은 밤하늘 쪽 바탕 */
    '.clip.starroom .frame{aspect-ratio:auto;background:none;overflow:visible}',
    /* frame */
    '.starroom .sr-frame{position:relative;aspect-ratio:16/10;border-radius:6px;overflow:hidden;cursor:zoom-in;',
      'background:radial-gradient(ellipse at 50% 42%,#2a2016 0%,#16110c 62%,#0c0907 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px}',
    '.clip.starroom .sr-frame img{position:static;inset:auto;width:auto;height:auto;max-height:72%;max-width:62%;object-fit:contain;filter:drop-shadow(0 14px 34px rgba(0,0,0,.6));opacity:0;transition:opacity 1.2s ease}',
    '.starroom .sr-frame img.on{opacity:1}',
    '.starroom .sr-frame .nm{font-family:var(--serif);font-size:clamp(14px,1.6vw,19px);color:#f2ead6;letter-spacing:.04em;text-align:center}',
    '.starroom .sr-frame .nm span{display:block;margin-top:4px;font-size:.72em;color:rgba(242,234,214,.6);letter-spacing:.08em}',
    '.starroom .sr-frame .hint{position:absolute;right:14px;bottom:12px;font-size:12px;letter-spacing:.06em;color:rgba(233,207,156,.75)}',
    '.sr-zoom{position:fixed;inset:0;z-index:9999;background:rgba(8,6,4,.94);display:flex;align-items:center;justify-content:center;cursor:zoom-out;',
      'opacity:0;transition:opacity .45s ease}',
    '.sr-zoom.on{opacity:1}',
    '.sr-zoom img{max-width:92vw;max-height:92vh;object-fit:contain;transform:scale(.94);transition:transform .55s cubic-bezier(.22,1,.36,1)}',
    '.sr-zoom.on img{transform:none}',
    /* scenes — 양피지 한 장 */
    '.starroom .sr-paper{background:#f1e9d8;border:1px solid #e0d3b8;border-radius:10px;padding:clamp(18px,3vw,30px);',
      'box-shadow:0 1px 0 rgba(11,9,7,.06),0 10px 26px rgba(11,9,7,.10);color:#2a2318}',
    '.starroom .sr-head{display:flex;align-items:baseline;gap:12px;margin-bottom:16px;flex-wrap:wrap}',
    '.starroom .sr-head b{font-family:var(--serif);font-weight:700;font-size:clamp(16px,1.7vw,19px);color:#2a2318}',
    '.starroom .sr-head span{font-size:12.5px;color:#8a7a5c;letter-spacing:.04em}',
    '.starroom .sc-list{display:grid;grid-template-columns:1fr 1fr;gap:7px;align-items:start}',
    '.starroom .sc-item{min-width:0}',
    '.starroom .sc-item.open{grid-column:1/-1}',
    '.starroom .sc-line{display:flex;align-items:center;gap:10px;padding:11px 9px;cursor:pointer;border-bottom:1px solid #ddcfb2;border-radius:8px 8px 0 0;transition:.15s}',
    '.starroom .sc-line:hover,.starroom .sc-item.open .sc-line{background:#e8dcc2;border-bottom-color:#b89a5e}',
    '.starroom .sc-dot{color:#b89a5e;font-size:11px;flex:none}',
    '.starroom .sc-title{flex:1;min-width:0;font-family:var(--serif);font-size:14.5px;font-weight:700;color:#2a2318;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.starroom .sc-item.open .sc-title{color:#6b4a14}',
    '.starroom .sc-work{font-size:11.5px;color:#8a7a5c;flex:none;max-width:40%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.starroom .sc-layers{display:grid;grid-template-rows:0fr;transition:grid-template-rows .7s cubic-bezier(.22,1,.36,1)}',
    '.starroom .sc-item.open .sc-layers{grid-template-rows:1fr}',
    '.starroom .sc-in{overflow:hidden}',
    '.starroom .sc-box{background:#faf5ea;border:1px solid #e0d3b8;border-top:none;border-radius:0 0 12px 12px;padding:20px 22px 22px;box-shadow:0 10px 22px rgba(0,0,0,.08)}',
    '.starroom .ly{display:grid;grid-template-columns:68px 1fr;gap:12px;margin-bottom:15px;opacity:0;transform:translateY(-6px);transition:opacity .6s ease,transform .6s ease}',
    '.starroom .sc-item.open .ly{opacity:1;transform:none}',
    '.starroom .sc-item.open .ly:nth-child(2){transition-delay:.25s}.starroom .sc-item.open .ly:nth-child(3){transition-delay:.5s}.starroom .sc-item.open .ly:nth-child(4){transition-delay:.75s}',
    '.starroom .ly:last-child{margin-bottom:0}',
    '.starroom .ly-l{font-size:11px;font-weight:700;letter-spacing:.1em;color:#8b5a1e;padding-top:4px;text-align:right;border-right:2px solid #d9c49a;padding-right:11px;white-space:nowrap}',
    '.starroom .ly-t{font-family:var(--serif);font-size:14px;line-height:1.78;color:#3a3022;word-break:keep-all}',
    '.starroom .ly-t strong{font-family:inherit;font-weight:700;color:#1f1a12}',
    '@media (max-width:640px){.starroom .sc-list{grid-template-columns:1fr}.starroom .ly{grid-template-columns:1fr;gap:4px}.starroom .ly-l{text-align:left;border-right:none;padding-right:0}}',
    /* link — 카드 뒷면 */
    '.starroom .sr-card{position:relative;border-radius:10px;overflow:hidden;padding:clamp(22px,4vw,40px) clamp(20px,4vw,44px);color:#f2ead6;',
      'background:radial-gradient(ellipse at 50% 0%,#2b2117 0%,#17120d 58%,#0d0a07 100%);box-shadow:0 10px 28px rgba(11,9,7,.18)}',
    '.starroom .lk-pair{display:flex;align-items:flex-start;justify-content:center;gap:clamp(10px,3vw,26px);margin-bottom:clamp(16px,3vw,26px)}',
    '.starroom .lk-p{display:flex;flex-direction:column;align-items:center;gap:8px;width:clamp(86px,16vw,130px)}',
    '.starroom .lk-p .ph{width:100%;aspect-ratio:3/4;border-radius:4px;background:#2a2016 center/cover no-repeat;box-shadow:0 6px 18px rgba(0,0,0,.5);filter:sepia(.25)}',
    '.starroom .lk-p b{font-family:var(--serif);font-weight:400;font-size:clamp(12px,1.3vw,14.5px);text-align:center;word-break:keep-all;color:#f2ead6}',
    '.starroom .lk-line{flex:1;max-width:180px;height:1px;margin-top:calc(clamp(86px,16vw,130px) * 2 / 3);background:linear-gradient(90deg,rgba(233,207,156,.15),rgba(233,207,156,.85),rgba(233,207,156,.15));position:relative}',
    '.starroom .lk-line::after{content:"✦";position:absolute;left:50%;top:50%;transform:translate(-50%,-55%);font-size:13px;color:#e9cf9c}',
    '.starroom .lk-eye{text-align:center;font-family:"Cormorant Garamond",var(--serif);font-size:12px;letter-spacing:.32em;text-indent:.32em;color:rgba(233,207,156,.8)}',
    '.starroom .lk-head{margin-top:8px;text-align:center;font-family:var(--serif);font-weight:400;font-size:clamp(19px,2.3vw,26px);color:#fbf6ea;word-break:keep-all}',
    '.starroom .lk-story{max-width:34em;margin:16px auto 0;font-family:var(--serif);font-size:clamp(14.5px,1.35vw,16.5px);line-height:1.9;color:rgba(244,239,230,.88);word-break:keep-all;text-align:center}',
    '.starroom .lk-src{max-width:40em;margin:18px auto 0;font-size:12px;line-height:1.6;color:rgba(233,207,156,.55);text-align:center;word-break:keep-all}',
    '@media (max-width:640px){.starroom .sr-frame{aspect-ratio:4/5}.clip.starroom .sr-frame img{max-width:78%}}',
    '.starroom figcaption a{color:inherit;text-decoration:underline;text-underline-offset:3px}'
  ].join('');
  document.head.appendChild(css);

  function kstDay(){ return Math.floor((Date.now() + 9 * 3600000) / DAY); }
  function esc(t){ return String(t == null ? '' : t).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function md(t){   /* 앱 renderMarkdownStar 와 같은 셈 — **굵게** · *굵게* */
    return esc(t).replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>').replace(/\*([^*\n]+?)\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  }
  function api(path, body){
    var o = { headers:{ apikey:KEY, Authorization:'Bearer ' + KEY } };
    if (body){ o.method = 'POST'; o.headers['Content-Type'] = 'application/json'; o.body = JSON.stringify(body); }
    return fetch(SUPA + '/rest/v1/' + path, o).then(function(r){ if (!r.ok) throw new Error(r.status); return r.json(); });
  }
  function years(s){ return (s.birth || s.death) ? (s.birth || '?') + ' – ' + (s.death || '') : ''; }
  /* 받침 있으면 「과」, 없으면 「와」 */
  function wa(name){
    var c = String(name || '').trim().slice(-1).charCodeAt(0);
    return (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28) ? '과' : '와';
  }
  function getStar(name){
    return api('stars?select=id,name,birth,death,photo_url,framed_url&name=eq.' + encodeURIComponent(name)).then(function(r){ return r && r[0]; });
  }
  function onceVisible(el, fn){
    if (!('IntersectionObserver' in window)){ fn(); return; }
    var io = new IntersectionObserver(function(es){ if (es.some(function(e){ return e.isIntersecting; })){ io.disconnect(); fn(); } }, { threshold:.5 });
    io.observe(el);
  }

  /* ── frame — 액자 초상 · 누르면 화면 가득 ── */
  function frame(fig){
    var box = fig.querySelector('.frame');
    getStar(fig.getAttribute('data-star')).then(function(s){
      if (!s || !(s.framed_url || s.photo_url)) return;
      var src = s.framed_url || s.photo_url;
      box.innerHTML = '<div class="sr-frame" role="button" tabindex="0" aria-label="' + esc(s.name) + ' 초상 크게 보기">' +
        '<img alt="' + esc(s.name) + ' 초상"><div class="nm">' + esc(s.name) + '<span>' + esc(years(s)) + '</span></div>' +
        '<div class="hint">누르면 크게</div></div>';
      var stage = box.firstChild, img = stage.querySelector('img');
      img.onload = function(){ img.classList.add('on'); };
      img.src = src;
      function zoom(){
        var z = document.createElement('div'); z.className = 'sr-zoom'; z.setAttribute('role', 'dialog');
        z.innerHTML = '<img alt="' + esc(s.name) + ' 초상" src="' + esc(src) + '">';
        document.body.appendChild(z);
        requestAnimationFrame(function(){ z.classList.add('on'); });
        function close(){ z.classList.remove('on'); document.removeEventListener('keydown', key); setTimeout(function(){ z.remove(); }, 460); }
        function key(e){ if (e.key === 'Escape') close(); }
        z.addEventListener('click', close); document.addEventListener('keydown', key);
      }
      stage.addEventListener('click', zoom);
      stage.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); zoom(); } });
    }).catch(function(){});
  }

  /* ── scenes — 교양의 풍경 ── */
  function scenes(fig, capBase){
    var box = fig.querySelector('.frame');
    getStar(fig.getAttribute('data-star')).then(function(s){
      if (!s) return;
      return api('rpc/get_star_questions', { p_star_id: Number(s.id) }).then(function(rows){
        if (!rows || !rows.length) return;
        var workLabel = function(w){ return (!w || w === 'general') ? '생애와 사상' : w; };
        var order = [], seen = {};
        rows.forEach(function(r){ var w = r.work || 'general'; if (!seen[w]){ seen[w] = []; order.push(w); } seen[w].push(r); });
        order.sort(function(a, b){ if (a === 'general') return 1; if (b === 'general') return -1; return a.localeCompare(b, 'ko'); });
        var flat = [].concat.apply([], order.map(function(w){ return seen[w]; }));
        function ly(label, t){ return t ? '<div class="ly"><div class="ly-l">' + label + '</div><div class="ly-t">' + md(t) + '</div></div>' : ''; }
        box.innerHTML = '<div class="sr-paper"><div class="sr-head"><b>교양의 풍경</b><span>' + esc(s.name) + ' · ' + flat.length + '장면</span></div>' +
          '<div class="sc-list">' + flat.map(function(r){
            var first = r.question_type === 'pa' ? (r.work === 'EG가이드북' ? '낭독' : '방송') : '지식';
            return '<div class="sc-item"><div class="sc-line" role="button" tabindex="0"><span class="sc-dot">✧</span>' +
              '<span class="sc-title">' + (esc(r.poetic_title) || '제목 없음') + '</span><span class="sc-work">' + esc(workLabel(r.work)) + '</span></div>' +
              '<div class="sc-layers"><div class="sc-in"><div class="sc-box">' +
                ly(first, r.knowledge) + ly('사유', r.thought) + ly('연결', r.connection) + ly('큐레이션', r.curation) +
              '</div></div></div></div>';
          }).join('') + '</div></div>';
        var list = box.querySelector('.sc-list');
        function toggle(item){
          var was = item.classList.contains('open');
          list.querySelectorAll('.sc-item.open').forEach(function(x){ x.classList.remove('open'); x.querySelector('.sc-dot').textContent = '✧'; });
          if (!was){ item.classList.add('open'); item.querySelector('.sc-dot').textContent = '✦'; }
        }
        list.addEventListener('click', function(e){ var l = e.target.closest('.sc-line'); if (l) toggle(l.parentElement); });
        list.addEventListener('keydown', function(e){ var l = e.target.closest('.sc-line'); if (l && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); toggle(l.parentElement); } });
        /* 시연 — 처음 화면에 들어오면 첫 줄 하나만 펼친다. 그다음은 손님 몫 */
        onceVisible(box, function(){ setTimeout(function(){ var f = list.querySelector('.sc-item'); if (f && !list.querySelector('.sc-item.open')) toggle(f); }, 900); });
        fig.querySelector('figcaption').innerHTML = capBase + ' 지금 ' + flat.length + '장면입니다. 다른 줄도 눌러 펼쳐 보세요.';
      });
    }).catch(function(){});
  }

  /* ── link — 오늘의 별과 별 사이 한 장 ── */
  function link(fig, capBase){
    var box = fig.querySelector('.frame');
    api('star_links?select=id,star_a,star_b,head,story,source&active=is.true&order=id').then(function(links){
      if (!links || !links.length) return;
      var L = links[((kstDay() % links.length) + links.length) % links.length];
      return api('stars?select=id,name,birth,death,photo_url&id=in.(' + L.star_a + ',' + L.star_b + ')').then(function(ss){
        var a = ss.filter(function(x){ return x.id === L.star_a; })[0] || {}, b = ss.filter(function(x){ return x.id === L.star_b; })[0] || {};
        function p(s){ return '<div class="lk-p"><div class="ph"' + (s.photo_url ? ' style="background-image:url(\'' + esc(s.photo_url) + '\')"' : '') + '></div><b>' + esc(s.name) + '</b></div>'; }
        box.innerHTML = '<div class="sr-card"><div class="lk-pair">' + p(a) + '<div class="lk-line" aria-hidden="true"></div>' + p(b) + '</div>' +
          '<div class="lk-eye">별과 별 사이</div><div class="lk-head">' + esc(L.head) + '</div>' +
          '<p class="lk-story">' + esc(L.story) + '</p>' + (L.source ? '<p class="lk-src">' + esc(L.source) + '</p>' : '') + '</div>';
        fig.querySelector('figcaption').innerHTML = capBase + ' 오늘의 한 장은 ' + esc(a.name) + wa(a.name) + ' ' + esc(b.name) + ' 사이입니다. 날마다 다른 선이 펼쳐집니다.';
      });
    }).catch(function(){});
  }

  figs.forEach(function(fig){
    var show = fig.getAttribute('data-show'), cap = fig.querySelector('figcaption').innerHTML;
    if (show === 'frame') frame(fig);
    else if (show === 'scenes') scenes(fig, cap);
    else if (show === 'link') link(fig, cap);
  });
})();
