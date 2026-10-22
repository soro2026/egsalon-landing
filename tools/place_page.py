# Places 집 한 곳 페이지를 찍는 손 (2026.10.21 밤 · 파이스)
# 쓰기: python3 tools/place_page.py            → 내력 글이 있는 집마다 place-<code>.html 을 새로 쓴다
#       python3 tools/places_index.py          → (그다음) 첫 화면 칸이 그 페이지로 이어진다
# 글은 tools/places.json 한 곳 — DB terra_pins.meta(lede · body · note) 를 옮겨 둔 것. DB 글이 바뀌면 json 을 다시 받는다.
# 맨 위 자리(Places 결정문 §5 · 1021 소로) — media/place_<code>_1920.mp4 · _1280.mp4 · _poster.jpg 가 있으면 영상,
#   media/place_<code>.webp 가 있으면 사진, 둘 다 없으면 앱 대문 그림(서울 시각 아침 · 낮 · 저녁 · 밤). 파일만 넣고 다시 돌리면 바뀐다.
# 지금 집 페이지가 서는 종류 — 미술관(2주 전시일정) · 음악관(2주 공연일정 · 곡마다 작곡가 액자 초상) · 도서관(이 방의 서가 · 1022) — 「열나흘」은 1022 소로가 「2주 일정」으로 바꿈. 카페는 같은 틀에 칸을 더해 차례로.
import json, os, html, runpy
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V = '1021c'
PUB = 'https://cyhlotwdisjvoxvfkpnd.supabase.co/storage/v1/object/public/tour-assets/'
KIND = {
  'heritage': {'ko': '미술관', 'folder': 'galerie',                'story_sub': '그림이 들어오기 전의 일',
               'fort_body': '이 방에 걸리는 그림은 이 관의 소장품이 아닙니다. 다섯 미술관이 같은 그림들을 같은 순서로, 서로 며칠씩 간격을 두고 하루 한 점씩 겁니다. 그래서 오늘 이 방에서 본 그림을 얼마 뒤 다른 도시의 방에서 다시 만나게 됩니다.',
               'room': '방', 'fort_title': '2주 전시일정', 'fort_sub': '오늘부터 14일, 이 방에 걸릴 그림',
               'fort_foot': '앱에서 이 미술관 대문을 열면 옆에 뜨는 안내문과 같은 표입니다. 서울 시각 자정에 한 칸씩 넘어갑니다. 명패 뒤의 이야기는 EG 안에서.',
               'guide': ('guide-painting.html', '그림은 이렇게 봅니다')},
  'concert':  {'ko': '음악관', 'folder': 'concert',                'story_sub': '이 홀이 서기까지',
               'fort_body': '이 홀에 오르는 곡은 이 홀의 것이 아닙니다. 다섯 음악관이 같은 곡들을 같은 순서로, 서로 며칠씩 간격을 두고 하루 한 곡씩 겁니다. 그래서 오늘 이 홀에서 들은 곡을 얼마 뒤 다른 도시의 홀에서 다시 만나게 됩니다. 곡마다 곁에 걸린 얼굴은 그 곡을 지은 사람이고, 모두 천문대 하늘에 별로 떠 있는 사람들입니다.',
               'room': '홀', 'fort_title': '2주 공연일정', 'fort_sub': '오늘부터 14일, 이 홀에 오를 곡',
               'fort_foot': '앱에서 이 음악관 대문을 열면 옆에 뜨는 안내문과 같은 표입니다. 서울 시각 자정에 한 칸씩 넘어갑니다. 연주는 EG 안에서.',
               'guide': ('guide-classical.html', '곡은 이렇게 듣습니다')},
  # 1022 소로 — 도서관은 서가가 사람마다 달라 표 대신 「이 방의 서가」(홈페이지 서가를 이 방의 벽감에) · 책을 뽑아 펼쳐 넘김(libshelf.js)
  'museum':   {'ko': '도서관', 'folder': 'museum',                 'story_sub': '이 서가가 서기까지',
               'fort_body': 'EG 안의 서가는 사람마다 다릅니다. 스타디움에서 만난 문제 하나, 아침 카페에서 퀴즈까지 푼 한 스푼 하나가 그 사람의 서가에 책 한 권씩으로 꽂히니까요. 홈페이지에도 서가가 하나 있습니다. Today에 나온 문제와 한 스푼이 날마다 여기 꽂힙니다. 서가는 하나라서 일곱 도서관 어디에 들어가도 같은 책들이 서고, 바뀌는 것은 방의 얼굴뿐입니다. 책등을 누르면 그 책이 펼쳐집니다.',
               'room': '방', 'fort_title': '이 방의 서가', 'fort_sub': '홈페이지 서가 · 가장 새 책이 윗단 왼쪽',
               'fort_foot': '책을 펼치면 네 장이 이어집니다. 지식, 사유, 연결, 큐레이션. 이 서가의 책은 홈페이지에 나온 것들이라 누구에게나 같고, 내 서가는 EG 안에서 자랍니다.',
               'shelf': True,
               'guide': ('guide-text.html', '책은 이렇게 만납니다')},
  # 1022 소로 — 카페는 내력 글을 뼈대로 삼아 「이 탁자에 앉았던 사람들」 삽화 이야기로(tools/cafes/<code>.py) · DB 는 그대로
  'hansfoon': {'ko': '카페', 'folder': 'hansfoon',              'story_sub': '',
               'room': '탁자', 'fort_title': '오늘의 카페가 되는 날', 'fort_sub': '열세 곳이 날마다 돌아가며',
               'fort_body': '지구 위 카페 열세 곳이 날마다 한 곳씩 돌아가며 오늘의 카페가 됩니다. 그날 이 탁자에는 그 무렵 열린 교양 한 스푼이 놓이고, 사람들이 그 위에 한 줄씩 얹습니다.',
               'story': True,
               'guide': ('guide-dialogue.html', '대화는 이렇게 시작됩니다')},
}

CAFE_CSS = ('<style>'
  '.scenes{margin-top:clamp(28px,4vw,44px)}'
  '.scene{padding:clamp(28px,4vw,44px) 0;border-top:1px solid rgba(11,9,7,.1)}'
  '.scene:first-child{border-top:0;padding-top:0}'
  '.sc-when{font-family:"Cormorant Garamond",var(--serif);font-size:clamp(13px,1.2vw,15px);letter-spacing:.22em;color:var(--ink-dim)}'
  '.scene h3{margin-top:8px;font-family:var(--serif);font-weight:500;font-size:clamp(21px,2.2vw,28px);letter-spacing:-.01em;line-height:1.35;word-break:keep-all}'
  '.scene p{margin-top:16px;font-family:var(--serif);font-weight:300;font-size:clamp(16px,1.35vw,18px);line-height:1.95;word-break:keep-all;max-width:36em}'
  '.scene .clip{max-width:860px}'
  '.sc-faces{display:flex;gap:clamp(14px,2vw,24px);flex-wrap:wrap;margin-top:22px}'
  '.sc-face{margin:0;width:clamp(120px,15vw,168px)}'
  '.sc-face img{display:block;width:100%;height:auto;filter:drop-shadow(0 8px 18px rgba(11,9,7,.28))}'
  '.sc-face figcaption{margin-top:10px;font-size:12.5px;line-height:1.5;color:var(--ink-dim);word-break:keep-all}'
  '.sc-face figcaption b{display:block;font-weight:500;color:var(--ink-soft)}'
  '</style>')

def scene_media(sc, ind):
    out = []
    if sc.get('img'):
        n = sc['img']
        if os.path.exists(os.path.join(ROOT, 'media', n + '.webp')):
            out.append(f'{ind}<figure class="clip still"><div class="frame"><img src="media/{n}.webp?v={V}" alt="{esc(sc.get("cap",""))}" loading="lazy"></div>'
                       f'<figcaption>{esc(sc.get("cap",""))}</figcaption></figure>')
        elif sc.get('shot'):
            s = sc['shot']
            attrs = ' '.join(f'data-{k}="{esc(s[k])}"' for k in ['kind', 'shot', 'where', 'must'] if s.get(k))
            out.append(f'{ind}<figure class="clip pending" {attrs}></figure>')
    faces = sc.get('stars') or ([sc['star']] if sc.get('star') else [])
    if faces:
        out.append(f'{ind}<div class="sc-faces">' + ''.join(
            f'<figure class="sc-face"><img src="{esc(f["url"])}" alt="{esc(f["name"])}의 액자 초상" loading="lazy">'
            f'<figcaption><b>{esc(f["name"])}</b>EG 하늘에 별로 떠 있는 사람</figcaption></figure>' for f in faces) + '</div>')
    return out

def esc(t): return html.escape(str(t or ''), quote=True)

def dur(sec):
    s = int(round(float(sec or 0))); return f'{s // 60}분 {s % 60}초' if s >= 60 else f'{s}초'

def gate_tpl(p): return PUB + KIND[p['k']]['folder'] + '/' + p['c'] + '_gate_{t}.webp'

def other_card(p):
    tpl = gate_tpl(p)
    where = ' · '.join(x for x in [p.get('city'), p.get('co')] if x)
    return (f'    <li class="pl-card"><a class="pl-link" href="place-{esc(p["c"])}.html">\n'
            f'      <div class="pl-img"><img src="{esc(tpl.replace("{t}", "d"))}" data-tpl="{esc(tpl)}" alt="{esc(p["n"])}" loading="lazy" width="1672" height="941"></div>\n'
            f'      <div class="pl-txt"><b>{esc(p["n"])}</b><span class="en">{esc(p.get("en"))} · {esc(where)}</span>'
            f'<span class="sub">{esc(p.get("sub"))}</span></div>\n'
            '    </a></li>')

def hero(p, K):
    c = p['c']; where = ' · '.join(x for x in [p.get('en'), p.get('city'), p.get('co'), p.get('y')] if x)
    plate = ('  <div class="plate">\n'
             f'    <p class="tag"><span><a href="places.html">Places</a> · {K["ko"]} · {esc(p.get("city"))}</span></p>\n'
             f'    <h1>{esc(p["n"])}</h1>\n'
             f'    <p class="face">{esc(p.get("sub"))}</p>\n'
             f'    <p class="book">{esc(where)}</p>\n'
             '  </div>\n')
    if os.path.exists(os.path.join(ROOT, 'media', f'place_{c}_1920.mp4')):
        return (f'<header class="hero place" aria-label="{esc(p["n"])} — 맨 위 영상">\n'
                f'  <video id="heroClip" muted playsinline autoplay loop preload="auto" poster="media/place_{c}_poster.jpg?v={V}" aria-hidden="true"\n'
                f'         data-src-1920="media/place_{c}_1920.mp4?v={V}" data-src-1280="media/place_{c}_1280.mp4?v={V}"></video>\n'
                + plate + '</header>\n'), f"media/place_{c}_poster.jpg?v={V}"
    if os.path.exists(os.path.join(ROOT, 'media', f'place_{c}.webp')):
        src = f'media/place_{c}.webp?v={V}'
        return (f'<header class="hero place" aria-label="{esc(p["n"])} — 맨 위 사진">\n'
                f'  <img class="still" src="{src}" alt="" aria-hidden="true">\n' + plate + '</header>\n'), src
    tpl = gate_tpl(p)
    return (f'<header class="hero place" aria-label="{esc(p["n"])} — 대문">\n'
            f'  <!-- 앱 대문 그림 그대로 · 서울 시각을 따라 바뀐다. media/place_{c}_1920.mp4 나 place_{c}.webp 를 넣고 다시 찍으면 그것으로 바뀐다 -->\n'
            f'  <img class="still" src="{esc(tpl.replace("{t}", "d"))}" data-tpl="{esc(tpl)}" alt="" aria-hidden="true">\n'
            + plate + '</header>\n'), tpl.replace('{t}', 'd')

def build(p, P, tmpl):
    K = KIND[p['k']]
    head = tmpl[:tmpl.index('<body')]
    head = head.replace(head[head.index('<title>'):head.index('</title>') + 8], f'<title>{esc(p["n"])} · Places · EG유니버스</title>')
    i = head.index('<meta name="description"'); j = head.index('>', i) + 1
    head = head[:i] + f'<meta name="description" content="{esc(p["n"] + " — " + p.get("sub", "") + ". " + p.get("lede", ""))}">' + head[j:]
    h, bg = hero(p, K)
    i = head.index('<style>.hero{'); j = head.index('</style>', i) + 8
    head = head[:i] + f"<style>.hero{{background-image:url('{bg}')}}</style>" + head[j:]
    i = head.index('<link rel="stylesheet" href="guide.css'); j = head.index('>', i) + 1
    head = head[:i] + head[i:j] + f'\n<link rel="stylesheet" href="places.css?v={V}">' + head[j:]
    gate = tmpl[tmpl.index('<a class="gate"'):tmpl.index('<header')]

    body = ['<main class="after-hero">']
    if p.get('lede'): body += [f'  <p class="gloss">{esc(p["lede"])}</p>']          # 음악관 내력에는 첫 줄이 없다 — 곧장 이야기로
    if K.get('story'):
        return build_cafe(p, P, K, head, gate, h, body, tmpl)
    body += [f'  <p class="rooms">이 집 이야기 · {K["fort_title"]}</p>', '',
            '  <section class="room" id="story">',
            f'    <div class="room-head"><span class="room-num">01</span><h2>이 집 이야기</h2><span class="room-sub">{K["story_sub"]}</span></div>',
            '    <div class="room-body">']
    body += [f'      <p>{esc(x)}</p>' for x in p.get('body', [])]
    body += ['    </div>']
    if p.get('voice'):
        body += [f'    <button class="voice" type="button" data-src="{esc(p["voice"])}">'
                 f'<span class="v-ico" aria-hidden="true"></span><span class="v-lab">이 집 이야기 듣기</span><span class="v-dur">{dur(p.get("vdur"))}</span></button>']
    if K.get('shelf'):
      body += ['  </section>', '',
             '  <section class="room" id="shelf-room">',
             f'    <div class="room-head"><span class="room-num">02</span><h2>{K["fort_title"]}</h2><span class="room-sub">{K["fort_sub"]}</span></div>',
             '    <div class="room-body">',
             f'      <p>{K["fort_body"]}</p>',
             '    </div>',
             '    <!-- 이 방의 서가 — libshelf.js 가 DB(terra_pins · home_shelf · questions · spoons)를 읽어 그린다. 판짜기는 today.html 오늘의 뮤세움 · 앱 bibliotheca.html 과 한 벌 -->',
             f'    <div class="ls" id="libshelf" data-code="{esc(p["c"])}" aria-live="polite"><p class="ft-note">서가를 불러오고 있습니다.</p></div>',
             '    <p class="ft-foot" id="libday"></p>',
             f'    <p class="ft-foot">{K["fort_foot"]}</p>',
             '  </section>', '']
    else:
      body += ['  </section>', '',
             '  <section class="room" id="fortnight-room">',
             f'    <div class="room-head"><span class="room-num">02</span><h2>{K["fort_title"]}</h2><span class="room-sub">{K["fort_sub"]}</span></div>',
             '    <div class="room-body">',
             f'      <p>{K["fort_body"]}</p>',
             '    </div>',
             f'    <!-- {K["fort_title"]} — place.js 가 DB(heritage_items · terra_pins)를 읽어 그린다. 셈은 앱 terra.html showHallNote 와 한 벌 -->',
             f'    <div class="ft" id="fortnight" data-code="{esc(p["c"])}" data-kind="{p["k"]}" aria-live="polite"><p class="ft-note">오늘부터 14일 동안의 편성을 불러오고 있습니다.</p></div>',
             f'    <p class="ft-foot">{K["fort_foot"]}</p>',
             '  </section>', '']
    if p.get('note'): body += [f'  <p class="coda">{esc(p["note"])}</p>', '']
    body += [
             '  <section class="pl-others" aria-label="다른 ' + K['ko'] + '">',
             f'    <h2>다른 {K["ko"]}</h2>',
             '    <ul class="pl-grid small">']
    body += [other_card(q) for q in P if q['k'] == p['k'] and q['c'] != p['c'] and q.get('body')]
    g_href, g_txt = K['guide']
    body += ['    </ul>',
             f'    <p class="pl-line"><a href="{g_href}">{g_txt} →</a></p>',
             '  </section>',
             f'  <a class="pl-back" href="places.html#{p["k"]}">← Places · 지구 위 {len(P)}곳</a>',
             '</main>']

    tail = tmpl[tmpl.index('</main>') + len('</main>'):]
    sky = ('<!-- 앱의 하늘 — 서울 시각 + 서울의 실제 일출 · 일몰(Today · Places 첫 화면과 같은 판) -->\n'
           '<script src="https://app.egsalon.com/eg_sky.js?v=0806e"></script>\n'
           f'<script src="place.js?v={V}"></script>\n'
           + ('<script src="libshelf.js?v=1022b"></script>\n' if K.get('shelf') else ''))
    tail = tail.replace('<script src="guide.js', sky + '<script src="guide.js', 1)
    page = head + '<body data-nav="cover">\n\n' + gate + h + '\n'.join(body) + tail
    out = os.path.join(ROOT, f'place-{p["c"]}.html')
    open(out, 'w', encoding='utf-8').write(page)
    return os.path.basename(out)

def build_cafe(p, P, K, head, gate, h, body, tmpl):
    ST = runpy.run_path(os.path.join(ROOT, 'tools', 'cafes', p['c'] + '.py'))['STORY']
    head = head.replace('</head>', CAFE_CSS + '\n</head>', 1)
    body += [f'  <p class="rooms">{ST["title"]} · {K["fort_title"]}</p>', '',
             '  <section class="room" id="story">',
             f'    <div class="room-head"><span class="room-num">01</span><h2>{ST["title"]}</h2><span class="room-sub">{ST["sub"]}</span></div>',
             '    <div class="scenes">']
    for sc in ST['scenes']:
        body += ['      <article class="scene">',
                 f'        <div class="sc-when">{esc(sc["when"])}</div>',
                 f'        <h3>{esc(sc["title"])}</h3>']
        body += [f'        <p>{esc(x)}</p>' for x in sc['body'][:1]]
        body += scene_media(sc, '        ')
        body += [f'        <p>{esc(x)}</p>' for x in sc['body'][1:]]
        body += ['      </article>']
    body += ['    </div>']
    if p.get('voice'):
        body += [f'    <button class="voice" type="button" data-src="{esc(p["voice"])}">'
                 f'<span class="v-ico" aria-hidden="true"></span><span class="v-lab">앱 대문 안내 듣기</span><span class="v-dur">{dur(p.get("vdur"))}</span></button>']
    body += ['  </section>', '',
             '  <section class="room" id="day-room">',
             f'    <div class="room-head"><span class="room-num">02</span><h2>{K["fort_title"]}</h2><span class="room-sub">{K["fort_sub"]}</span></div>',
             '    <div class="room-body">',
             f'      <p>{K["fort_body"]}</p>',
             '    </div>',
             f'    <p class="ft-foot" id="cafeday" data-code="{esc(p["c"])}"></p>',
             '  </section>', '']
    if p.get('note'): body += [f'  <p class="coda">{esc(p["note"])}</p>', '']
    others = [other_card(q) for q in P if q['k'] == p['k'] and q['c'] != p['c'] and os.path.exists(os.path.join(ROOT, 'tools', 'cafes', q['c'] + '.py'))]
    g_href, g_txt = K['guide']
    body += ['  <section class="pl-others" aria-label="다른 ' + K['ko'] + '">']
    if others: body += [f'    <h2>다른 {K["ko"]}</h2>', '    <ul class="pl-grid small">'] + others + ['    </ul>']
    body += [f'    <p class="pl-line"><a href="{g_href}">{g_txt} →</a></p>',
             '  </section>',
             f'  <a class="pl-back" href="places.html#{p["k"]}">← Places · 지구 위 {len(P)}곳</a>',
             '</main>']
    tail = tmpl[tmpl.index('</main>') + len('</main>'):]
    day = ('<script>/* 오늘의 카페가 되는 날 — 카페 열세 곳(sort)[ 서울 날수 % 13 ] (앱 spoonOnDuty · today.html 과 같은 셈) */\n'
           '(function(){var el=document.getElementById("cafeday");if(!el)return;var SUPA="https://cyhlotwdisjvoxvfkpnd.supabase.co",KEY="sb_publishable_jYYfQV_wQgMRFjSUuDq7xA_gWc9vsnR",WD="일월화수목금토",DAY=864e5;'
           'function lab(n){var d=new Date(n*DAY);return (d.getUTCMonth()+1)+"/"+d.getUTCDate()+"("+WD[d.getUTCDay()]+")";}'
           'fetch(SUPA+"/rest/v1/terra_pins?select=code,name&kind=eq.hansfoon&active=eq.true&order=sort",{headers:{apikey:KEY,Authorization:"Bearer "+KEY}}).then(function(r){return r.json();}).then(function(L){'
           'var c=el.getAttribute("data-code"),n=L.length,i=-1,me=null;L.forEach(function(x,k){if(x.code===c){i=k;me=x;}});if(i<0)return;'
           'var D=Math.floor((Date.now()+9*36e5)/DAY),ds=[];for(var k=0;k<28;k++)if((D+k)%n===i)ds.push(D+k);'
           'el.textContent=(ds[0]===D?"오늘이 그날입니다. 다음은 "+ds.slice(1).map(lab).join(" · ")+".":"다음에 오늘의 카페가 되는 날 — "+ds.map(lab).join(" · "));}).catch(function(){});})();</script>\n')
    sky = ('<!-- 앱의 하늘 — 서울 시각 + 서울의 실제 일출 · 일몰(Today · Places 첫 화면과 같은 판) -->\n'
           '<script src="https://app.egsalon.com/eg_sky.js?v=0806e"></script>\n'
           f'<script src="place.js?v={V}"></script>\n' + day)
    tail = tail.replace('<script src="guide.js', sky + '<script src="guide.js', 1)
    page = head + '<body data-nav="cover">\n\n' + gate + h + '\n'.join(body) + tail
    out = os.path.join(ROOT, f'place-{p["c"]}.html')
    open(out, 'w', encoding='utf-8').write(page)
    return os.path.basename(out)

if __name__ == '__main__':
    P = json.load(open(os.path.join(ROOT, 'tools', 'places.json'), encoding='utf-8'))
    tmpl = open(os.path.join(ROOT, 'guide-travel.html'), encoding='utf-8').read()
    print([build(p, P, tmpl) for p in P if p['k'] in KIND and (p.get('body') or (KIND[p['k']].get('story') and os.path.exists(os.path.join(ROOT, 'tools', 'cafes', p['c'] + '.py'))))])
