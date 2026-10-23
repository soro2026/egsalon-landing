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
      body[data-nav="cover"] Today — 표지 영상 위에서는 현관처럼, 표지를 지나면 늘 떠 있다(1020 소로
                             「3초 뒤 사라지니 시각적으로 혼란」 — 무대가 줄줄이 움직이는 긴 페이지라 띠까지 들락이면 어지럽다)
      그 밖                  하위 페이지 — 늘 떠 있다
   ③ 지금 있는 페이지의 메뉴에 노란 밑줄(aria-current) — 바닥 지도에도
   ⓪ 바닥 지도 — 모든 페이지 끝에 메뉴의 얼개를 펼친다(1019 소로)
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  var APP_URL  = 'https://app.egsalon.com/';
  var LOOK_URL = '';   /* 입장 화면이 서기 전에는 비워 둔다 — 누르면 아무 데도 가지 않는다 */

  /* ── Guide 일곱 가지 (1020 오후 소로) — 하나마다 페이지 하나 · 길게 이어 내려가지 않는다
        「하나 소화하고 내려오면 다음 아이템이 이어 나오기보다 일곱이 쭉 펼쳐지게」
        Guide 첫 화면과 하위 페이지 끝에 <nav class="g7"></nav> 빈 자리만 두면 여기서 채운다
        바닥 지도의 일곱 칩도 이 목록 하나를 쓴다 — 글은 여기 한 곳에서 고친다
        순서는 백서 Ⅳ장 그대로(분더카머는 Ⅴ-3 「내 집」이라 넣지 않는다)
        ⚠ 홈페이지에서는 「차림」 「옛사람」을 쓰지 않는다 — 맥락 없이 읽으면 어색하거나 부정적으로 읽힌다(1020 소로)
        글 — why 한 문장(왜 중요한가) + how(EG유니버스가 그것을 어떻게 스미게 하는가) · 음악은 고전음악만(1020 소로) ── */
  var GUIDE = [
    { slug:'travel', en:'Travel', ko:'여행',
      why:'낯선 곳을 직접 보고 온 사람은 떠날 때와 조금 다른 사람이 되어 돌아옵니다.',
      how:'EG유니버스는 실제 지구 위에 서 있어 어디든 날아서 갑니다. 비행기 창가에서 손에 든 책을 읽고, 해 지는 도시를 따라 날며 하루를 적고, 다녀온 곳마다 순례자의 수첩처럼 도장이 하나씩 쌓입니다.',
      rooms:'독서비행 · 베스페르 · 크레덴시알 · 다른 도시' },
    { slug:'painting', en:'Painting', ko:'회화',
      why:'그림은 설명을 읽을 때보다 그 앞에 오래 서 있을 때 안으로 들어옵니다.',
      how:'그래서 많이 걸지 않습니다. 오르세 · 루브르 · 프라도 · 우피치 · 시카고, 다섯 미술관이 돌아가며 하루 한 점씩만 겁니다. 같은 그림을 다른 도시에서 다시 만나는 날이 오고, 마음에 든 한 점은 내 집 거실 벽에 걸어 둘 수 있습니다.',
      rooms:'오늘의 미술관' },
    { slug:'classical', en:'Classical', ko:'고전음악',
      why:'같은 곡도 무엇을 알고 듣느냐에 따라 전혀 다르게 들립니다.',
      how:'시드니 · 함부르크 · 빈 · 파리 · 부에노스아이레스, 다섯 홀에 하루 한 곡이 걸립니다. 재생을 누르기 전에 누가 어떤 처지에서 그 곡을 썼는지 이야기를 먼저 읽거나 목소리로 듣습니다. 모르고 들으면 흘러가고, 알고 들으면 들립니다.',
      rooms:'오늘의 음악관 · 거실 레코드장' },
    { slug:'stars', en:'Stars', ko:'별',
      why:'개념은 머리에 들어오지만 사람은 마음에 들어오고, 마음에 들어온 것만 오래 남습니다.',
      how:'그래서 EG유니버스는 교양을 사람으로 지었습니다. 밤하늘의 별 하나에 한 사람 — 소로, 보들레르, 프리드리히. 다가가면 그 생애가 장면으로 펼쳐지고, 별과 별 사이에 놓인 다리 가운데 어느 것을 건널지는 내가 고릅니다. 사랑하게 된 얼굴은 내 집 벽에 걸립니다.',
      rooms:'하늘 · 별 카드와 풍경 · 별과 별 사이 · 컴퍼니' },
    { slug:'nature', en:'Nature', ko:'자연',
      why:'자연은 말하지 않습니다. 그 고요 앞에서 사람은 느끼고, 잇고, 제 크기를 압니다.',   /* 1023 소로 — 뼈대 원점 검토(느끼게 · 잇게 · 제 크기 · 밖으로) */
      how:'EG유니버스의 다른 여섯 가지는 전부 사람이 만든 것입니다. 자연만 사람이 만들지 않았습니다. 천문대 35곳 가운데 11곳이 에베레스트, 킬리만자로, 그랜드캐니언, 나미브 사구 같은 대자연 한복판에 서 있고, 별을 만나러 가는 밤에는 먼저 그 땅을 지납니다. 여기서만은 무언가를 하라고 하지 않습니다.',
      rooms:'느끼게 한다 · 잇게 한다 · 제 크기를 알게 한다 · 밖을 가리킨다' },
    { slug:'text', en:'Text', ko:'텍스트',
      why:'사람은 말로 생각하고, 읽고 쓴 만큼 생각이 깊어집니다.',
      how:'다만 「읽으세요」라는 말로는 아무도 시작하지 못합니다. EG유니버스는 순서를 뒤집어 10분짜리 야구 경기에서 문장 하나를 먼저 스치게 합니다. 스친 문장은 서가에 책 한 권으로 서고, 궁금해진 책은 학술원에서 여럿이 함께 몇 주에 걸쳐 끝까지 읽습니다.',
      rooms:'야구장 · 서가 · 학술원 · 서고' },
    { slug:'dialogue', en:'Dialogue', ko:'대화',
      why:'어떤 생각은 누군가에게 말로 꺼내는 순간에야 모양을 갖춥니다.',
      how:'EG유니버스에는 광장이 없는 대신 작은 자리들을 두었습니다. 이름난 카페의 탁자에 놓인 한 문장에 한 줄씩 얹는 자리, 한 사람에게만 부치는 편지, 그림 한 점을 가운데 두고 낯선 이와 90분 동안 마주 앉는 저녁.',
      rooms:'교양 한 스푼 · 타벨라이 · 살롱 데 콩파뇽 · 에콜 노르말' }
  ];
  var gHref = function(g){ return 'guide-' + g.slug + '.html'; };
  window.EG_GUIDE = GUIDE.map(function(g){ return { slug:g.slug, en:g.en, ko:g.ko, href:gHref(g) }; });   /* 촬영표(shots.html)가 페이지 목록으로 쓴다 */
  var here = (location.pathname.split('/').pop() || 'home.html').replace(/\.html$/, '');

  document.querySelectorAll('nav.g7').forEach(function(box){
    var html = '<ol class="g7-list">';
    GUIDE.forEach(function(g, i){
      var cur = (here === 'guide-' + g.slug);
      html += '<li><a class="g7-item" href="' + gHref(g) + '"' + (cur ? ' aria-current="page"' : '') + '>'
        +   '<span class="g7-num">0' + (i + 1) + '</span>'
        +   '<span class="g7-name"><b>' + g.en + '</b><i>' + g.ko + '</i>'
        +     (cur ? '<span class="g7-here-row"><span class="g7-here">지금 여기</span></span>' : '') + '</span>'
        +   '<span class="g7-text"><span class="g7-why">' + g.why + '</span>'
        +   '<span class="g7-how">' + g.how + '</span>'
        +   '<span class="g7-rooms">' + g.rooms + '</span></span>'
        + '</a></li>';
    });
    box.innerHTML = html + '</ol>';
  });

  /* ── ⓪ 바닥 지도 (1019 소로) — 모든 페이지 끝에 메뉴의 얼개를 펼쳐 둔다
        「그 순간 꽂히는 곳으로」 · 순서는 메뉴 띠와 같다(Why 다음이 Today)
        페이지에는 <footer class="eg-map"></footer> 빈 자리만 두고, 글은 여기 한 곳에서 고친다
        ⚠ 아래 ①이 [data-gate]를 손질하므로 지도는 그보다 먼저 끼운다 ── */
  var chips = GUIDE.map(function(g){ return '<a href="' + gHref(g) + '">' + g.ko + '</a>'; }).join('');
  var MAP = ''
    + '<div class="map-in">'
    +   '<p class="map-eyebrow">EG유니버스의 지도</p>'
    +   '<ol class="map-main">'
    +     '<li><a class="map-name" href="today.html"><b>Today</b><i>지금</i></a>'
    +         '<p>오늘 펼쳐지는 독서비행, 그림 한 점, 곡 하나</p></li>'
    +     '<li><a class="map-name" href="guide.html"><b>Guide</b><i>어떻게</i></a>'
    +         '<p>일곱 가지를 누리는 법'
    +         '<span class="map-chips">' + chips + '</span></p></li>'
    +     '<li><a class="map-name" href="places.html"><b>Places</b><i>어디</i></a>'
    +         '<p>지구 위에 세운 미술관 · 음악관 · 도서관 · 카페 · 천문대</p></li>'
    +     '<li><a class="map-name" href="collection.html"><b>Collection</b><i>무엇</i></a>'
    +         '<p>그림 · 곡 · 별 · 콜레주 273권</p></li>'
    +   '</ol>'
    +   '<ul class="map-minor">'
    +     '<li><a href="letters.html">Letters <i>편지</i></a></li>'
    +     '<li><a href="news.html">News <i>소식</i></a></li>'
    +     '<li><a href="voices.html">Voices <i>후기</i></a></li>'
    +     '<li><a href="making.html">Making <i>짓는 과정</i></a></li>'
    +   '</ul>'
    +   '<div class="map-end">'
    +     '<a class="map-home" href="home.html">EG유니버스</a>'
    +     '<span class="map-date">2026년 12월 25일(금) 개관</span>'
    +     '<a class="map-door" data-gate href="#">EG 둘러보기</a>'
    +   '</div>'
    + '</div>';
  document.querySelectorAll('footer.eg-map').forEach(function(f){
    if (!f.children.length) f.innerHTML = MAP;
  });

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
    var navMode = document.body.getAttribute('data-nav');
    if (navMode === 'auto' || navMode === 'cover'){
      var t = 0, over = false;
      var show = function(){
        nav.classList.add('on');
        clearTimeout(t);
        t = setTimeout(function(){ if (!over && !nav.contains(document.activeElement)) nav.classList.remove('on'); }, 2600);
      };
      /* cover — 표지를 벗어나면 하위 페이지처럼 늘 떠 있다(먹색) · 표지로 돌아오면 다시 현관처럼 */
      var cover = navMode === 'cover' && document.querySelector('.hero');
      if (cover && 'IntersectionObserver' in window){
        new IntersectionObserver(function(es){
          var past = !es[0].isIntersecting;
          nav.classList.toggle('fixed', past);
          if (!past) show();
        }, { rootMargin:'-80px 0px 0px 0px', threshold:0 }).observe(cover);
      } else if (navMode === 'cover') nav.classList.add('fixed');
      ['mousemove','scroll','touchstart','keydown'].forEach(function(e){ window.addEventListener(e, show, { passive:true }); });
      nav.addEventListener('mouseenter', function(){ over = true; nav.classList.add('on'); });
      nav.addEventListener('mouseleave', function(){ over = false; show(); });
      nav.addEventListener('focusin', function(){ nav.classList.add('on'); });
    } else {
      nav.classList.add('fixed');
    }

    /* ── ③ 지금 페이지 ── */
    /* Guide 하위 페이지(guide-travel 등)에서는 메뉴의 Guide 에 밑줄 · 바닥 지도의 그 칩에 노랑 */
    var section = /^guide-/.test(here) ? 'guide' : here;
    document.querySelectorAll('.eg-nav a[href], .eg-map .map-name, .eg-map .map-minor a, .eg-map .map-chips a').forEach(function(a){
      var name = a.getAttribute('href').split('/').pop().replace(/\.html$/, '');
      if (name && (name === here || name === section)) a.setAttribute('aria-current', 'page');
    });
  }
})();
