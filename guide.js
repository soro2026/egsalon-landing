/* ══════════════════════════════════════════════════════════════════════════
   guide.js — Guide 하위 페이지가 함께 쓰는 손 (2026.10.20 저녁)
   ① 맨 위 영상(#heroClip) — 폰은 1280 · 넓은 화면은 1920 · 화면 밖이면 쉰다 (Today 와 같은 셈)
   ② 본문 영상(figure.clip[data-video-1920]) — 화면에 반쯤 들어오면 돌고, 벗어나면 멈춘다
   ③ 빗금 칸(.clip.pending · .hero.pending) — data-* 에 적힌 촬영 설명을 칸 안에 그린다
      같은 함수(window.egShotHTML)를 촬영표(shots.html)도 쓴다 — 설명은 페이지 한 곳에만 적는다
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  /* ── ③ 빗금 칸 ──
     data-kind   영상 | 캡처
     data-shot   무엇을 (한 줄)
     data-where  앱 어디서 (타륜 › … 처럼 누르는 길)
     data-len    길이 (영상만)
     data-key    녹화 — F9(지구 캔버스만) | Shift+F9(탭 전체 · 기내 · 방 안) | 캡처
     data-must   화면에 꼭 들어가야 할 것 */
  function esc(t){ return String(t || '').replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  window.egShotHTML = function(el){
    var d = el.dataset, rows = [
      ['어디서', d.where], ['길이', d.len], ['녹화', d.key], ['꼭 담을 것', d.must]
    ].filter(function(r){ return r[1]; });
    return '<div class="shot">'
      + '<span class="shot-tag">촬영 대기 · ' + esc(d.kind || '영상') + '</span>'
      + '<span class="shot-what">' + esc(d.shot) + '</span>'
      + (rows.length ? '<dl>' + rows.map(function(r){ return '<dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('') + '</dl>' : '')
      + '</div>';
  };
  document.querySelectorAll('figure.clip.pending').forEach(function(f){
    var fr = f.querySelector('.frame');
    if (!fr){ fr = document.createElement('div'); fr.className = 'frame'; f.insertBefore(fr, f.firstChild); }
    fr.innerHTML = window.egShotHTML(f);
  });
  document.querySelectorAll('header.hero.pending').forEach(function(h){
    if (!h.querySelector('.shot')) h.insertAdjacentHTML('beforeend', window.egShotHTML(h));
  });

  /* ── ① 맨 위 영상 ── */
  var v = document.getElementById('heroClip');
  if (v && v.getAttribute('data-src-1280')){
    var big = Math.max(screen.width, screen.height) * (window.devicePixelRatio || 1) > 2000 && window.innerWidth > 900;
    v.src = v.getAttribute(big ? 'data-src-1920' : 'data-src-1280');
    var inView = true;
    var kick = function(){ if (inView && !document.hidden) v.play().catch(function(){}); };
    v.play().catch(function(){
      ['pointerdown','touchstart','keydown'].forEach(function(e){ window.addEventListener(e, kick, { once:true, passive:true }); });
    });
    document.addEventListener('visibilitychange', function(){ if (document.hidden) v.pause(); else kick(); });
    if ('IntersectionObserver' in window){
      new IntersectionObserver(function(es){ inView = es[0].isIntersecting; inView ? kick() : v.pause(); }, { threshold:0 }).observe(v);
    }
  }

  /* ── ② 본문 영상 — 처음 들어올 때 주소를 단다(preload none) · 움직임 줄이기를 켠 분에게는 포스터만 ── */
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var figs = document.querySelectorAll('figure.clip[data-video-1920]');
  if (!still && figs.length && 'IntersectionObserver' in window){
    var wide = (window.innerWidth * (window.devicePixelRatio || 1)) > 1400;
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){
        var vid = e.target.querySelector('video'); if (!vid) return;
        if (e.isIntersecting){
          if (!vid.getAttribute('src')) vid.src = e.target.getAttribute(wide ? 'data-video-1920' : 'data-video-1280');
          var p = vid.play(); if (p && p.catch) p.catch(function(){});
        } else vid.pause();
      });
    }, { threshold:0.5 });
    figs.forEach(function(f){ io.observe(f); });
  }
})();
