/* ══════════════════════════════════════════════════════════════════════════
   site.js — egsalon.com 모든 페이지가 함께 쓰는 머리의 손 (2026.10.18)

   ① 단추 두 얼굴 (결정문 1018 §1)
      앱(app.egsalon.com)이 로그인한 기기에 eg_seen=1 표지를 남긴다(앱의 eg_seen.js).
      표지 있음 → 「EG 들어가기」(노랑) → 앱 첫 문. 앱이 저장된 로그인을 보고 곧장 지구로.
      표지 없음 → 「EG 둘러보기」(먹색) → 입장 화면.
      ⚠ 입장 화면은 맨 마지막 작업(1018 저녁 소로) — 지어지면 LOOK_URL 만 바꾼다.
      ⚠ 휴대폰이면 앱으로 보내지 않고 안내를 띄운다 — 판정은 앱의 eg_device.js 한 벌(먼저 불러 둘 것).
   ② 메뉴 띠
      body[data-nav="auto"]  현관 — 움직일 때만 내려오고, 2.6초 가만있으면 올라간다(1017 소로)
      그 밖                  하위 페이지 — 늘 떠 있다
   ③ 지금 있는 페이지의 메뉴에 노란 밑줄(aria-current)
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  var APP_URL  = 'https://app.egsalon.com/';
  var LOOK_URL = '';   /* 입장 화면이 서기 전에는 비워 둔다 — 누르면 아무 데도 가지 않는다 */

  /* ── ① 단추 두 얼굴 ── */
  var seen = /(?:^|;\s*)eg_seen=1(?:;|$)/.test(document.cookie);
  var note = document.getElementById('gate-note');
  document.querySelectorAll('[data-gate]').forEach(function(a){
    if (seen){
      a.textContent = 'EG 들어가기'; a.href = APP_URL; a.classList.add('in');
      a.addEventListener('click', function(ev){
        var phone = (typeof window.egIsPhone === 'function') ? window.egIsPhone() : false;
        if (!phone || !note) return;
        ev.preventDefault();
        note.classList.add('on');
        clearTimeout(note._t); note._t = setTimeout(function(){ note.classList.remove('on'); }, 6000);
      });
    } else {
      a.textContent = 'EG 둘러보기';
      if (LOOK_URL) a.href = LOOK_URL;
      else { a.removeAttribute('href'); a.setAttribute('role','button'); a.style.cursor = 'pointer'; }
    }
  });
  if (note){
    document.addEventListener('pointerdown', function(ev){
      if (note.classList.contains('on') && !ev.target.closest('[data-gate]')) note.classList.remove('on');
    }, { passive:true });
  }

  /* 단추 바탕 — 현관 영상 위에서는 반쯤 비치고, 영상을 벗어나면 먹색 */
  var gate = document.querySelector('.gate');
  var hero = document.querySelector('.hero');
  if (gate){
    if (hero && 'IntersectionObserver' in window){
      new IntersectionObserver(function(es){ gate.classList.toggle('solid', !es[0].isIntersecting); },
        { rootMargin:'-80px 0px 0px 0px', threshold:0 }).observe(hero);
    } else gate.classList.add('solid');
  }

  /* ── ② 메뉴 띠 ── */
  var nav = document.querySelector('.eg-nav');
  if (nav){
    if (document.body.getAttribute('data-nav') === 'auto'){
      var t = 0, over = false;
      var show = function(){
        nav.classList.add('on');
        clearTimeout(t);
        t = setTimeout(function(){ if (!over && !nav.contains(document.activeElement)) nav.classList.remove('on'); }, 2600);
      };
      ['mousemove','scroll','touchstart','keydown'].forEach(function(e){ window.addEventListener(e, show, { passive:true }); });
      nav.addEventListener('mouseenter', function(){ over = true; nav.classList.add('on'); });
      nav.addEventListener('mouseleave', function(){ over = false; show(); });
      nav.addEventListener('focusin', function(){ nav.classList.add('on'); });
    } else {
      nav.classList.add('fixed');
    }

    /* ── ③ 지금 페이지 ── */
    var here = (location.pathname.split('/').pop() || 'home.html').replace(/\.html$/, '');
    nav.querySelectorAll('a[href]').forEach(function(a){
      var name = a.getAttribute('href').split('/').pop().replace(/\.html$/, '');
      if (name && name === here) a.setAttribute('aria-current', 'page');
    });
  }
})();
