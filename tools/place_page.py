# Places 집 한 곳 페이지를 찍는 손 (2026.10.21 밤 · 파이스)
# 쓰기: python3 tools/place_page.py            → 내력 글이 있는 집마다 place-<code>.html 을 새로 쓴다
#       python3 tools/places_index.py          → (그다음) 첫 화면 칸이 그 페이지로 이어진다
# 글은 tools/places.json 한 곳 — DB terra_pins.meta(lede · body · note) 를 옮겨 둔 것. DB 글이 바뀌면 json 을 다시 받는다.
# 맨 위 자리(Places 결정문 §5 · 1021 소로) — media/place_<code>_1920.mp4 · _1280.mp4 · _poster.jpg 가 있으면 영상,
#   media/place_<code>.webp 가 있으면 사진, 둘 다 없으면 앱 대문 그림(서울 시각 아침 · 낮 · 저녁 · 밤). 파일만 넣고 다시 돌리면 바뀐다.
# 지금 집 페이지가 서는 종류 — 미술관(2주 전시일정) · 음악관(2주 공연일정 · 곡마다 작곡가 액자 초상) — 「열나흘」은 1022 소로가 「2주 일정」으로 바꿈. 도서관 · 카페는 같은 틀에 칸을 더해 차례로.
import json, os, html
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
}

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
    body += [f'  <p class="rooms">이 집 이야기 · {K["fort_title"]}</p>', '',
            '  <section class="room" id="story">',
            f'    <div class="room-head"><span class="room-num">01</span><h2>이 집 이야기</h2><span class="room-sub">{K["story_sub"]}</span></div>',
            '    <div class="room-body">']
    body += [f'      <p>{esc(x)}</p>' for x in p.get('body', [])]
    body += ['    </div>']
    if p.get('voice'):
        body += [f'    <button class="voice" type="button" data-src="{esc(p["voice"])}">'
                 f'<span class="v-ico" aria-hidden="true"></span><span class="v-lab">이 집 이야기 듣기</span><span class="v-dur">{dur(p.get("vdur"))}</span></button>']
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
           f'<script src="place.js?v={V}"></script>\n')
    tail = tail.replace('<script src="guide.js', sky + '<script src="guide.js', 1)
    page = head + '<body data-nav="cover">\n\n' + gate + h + '\n'.join(body) + tail
    out = os.path.join(ROOT, f'place-{p["c"]}.html')
    open(out, 'w', encoding='utf-8').write(page)
    return os.path.basename(out)

if __name__ == '__main__':
    P = json.load(open(os.path.join(ROOT, 'tools', 'places.json'), encoding='utf-8'))
    tmpl = open(os.path.join(ROOT, 'guide-travel.html'), encoding='utf-8').read()
    print([build(p, P, tmpl) for p in P if p['k'] in KIND and p.get('body')])
