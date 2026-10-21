# Places 첫 화면을 찍는 손 (2026.10.21 저녁 · 파이스)
# 쓰기: python3 tools/places_index.py   → places.html 을 새로 쓴다
# 집 목록은 tools/places.json 한 곳 — DB terra_pins(active) 를 옮겨 둔 것(1021). 집이 늘면 json 에 한 줄 더하고 다시 돌린다.
# 대문 그림은 앱 그림 그대로 — 촬영 없음(1021 소로 「콜」) · 나중에 영상 · 사진으로 바꿀 수 있게 집마다 자리 하나
import json, os, html
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V = '1021b'   # 1021 밤 — 집 한 곳 페이지가 선 칸은 눌린다(places.css 에 a.pl-link)
PUB = 'https://cyhlotwdisjvoxvfkpnd.supabase.co/storage/v1/object/public/tour-assets/'
APP = 'https://app.egsalon.com/'

KINDS = [
  # kind, 영어 이름, 우리말, 한 줄(Guide 로 잇기), 그리드 꼴
  ('heritage', 'Museums of Art', '미술관',
   '그림을 걸려고 지은 집이 하나도 없는 다섯 채입니다. 기차역, 왕궁, 관청이던 집에 하루 한 점씩 돌아가며 그림이 걸립니다. <a href="guide-painting.html">그림은 이렇게 봅니다 →</a>', ''),
  ('concert', 'Concert Halls', '음악관',
   '소리는 건물에서 나옵니다. 100년을 넘긴 홀과 창고 위에 얹은 유리 왕관에 하루 한 곡씩 걸립니다. <a href="guide-classical.html">곡은 이렇게 듣습니다 →</a>', ''),
  ('museum', 'Libraries', '도서관',
   '날마다 한 곳씩 오늘의 도서관이 됩니다. 어느 도서관에 들어가든 서가는 하나 — 내가 만난 문장들이 책으로 꽂힌 서가입니다. <a href="guide-text.html">서가는 이렇게 자랍니다 →</a>', ''),
  ('hansfoon', 'Cafés', '카페',
   '사람들이 모여 떠들던 바로 그 가게들입니다. 월 · 수 · 금 아침이면 탁자 위에 문장이 하나 놓이고, 이틀 동안 사람들의 한 줄이 쌓입니다. <a href="guide-dialogue.html">탁자에는 이렇게 앉습니다 →</a>', ''),
  ('constellatio', 'Observatories', '천문대',
   '지구 위 35곳. 지금 깊은 밤인 땅 한 곳에만 문이 열리고, 그 망원경 속에 별 하나에 한 사람씩 떠 있습니다. <a href="guide-nature.html">땅은 이렇게 만납니다 →</a> <a href="guide-stars.html">별은 이렇게 만납니다 →</a>', 'small'),
  ('stadium', 'Ballparks', '야구장',
   '화요일과 목요일, 10분짜리 1이닝. 내 홈은 소로파크이고, 원정을 가면 세 사람의 구장에 섭니다. <a href="guide-text.html#stadium">경기는 이렇게 합니다 →</a>', ''),
  ('college', 'Collège', '학술원',
   '혼자서는 끝내 못 읽던 책을 여럿이 몇 주에 걸쳐 끝까지 읽는 집입니다. 파리 · 런던 · 뉴욕에 한 채씩, 대문은 도시마다 다릅니다. <a href="guide-text.html#college">학술원은 이렇게 걷습니다 →</a>', ''),
]
FOLDER = {'heritage': 'galerie', 'concert': 'concert', 'museum': 'museum', 'hansfoon': 'hansfoon'}

def esc(t): return html.escape(str(t or ''), quote=True)

def img_tpl(p):
    k, c = p['k'], p['c']
    if k in FOLDER: return PUB + FOLDER[k] + '/' + c + '_gate_{t}.webp'
    if k == 'constellatio': return PUB + 'observatory/' + c + '_n.webp'
    if k == 'stadium': return APP + 'face_' + p['team'] + '.webp'
    # 1021 소로 — 학술원 대문은 도시마다 제 것. 런던 · 뉴욕은 낮 · 밤 두 판({g} — 아침은 낮판 · 저녁은 밤판, 앱 college.html gateForHere 와 같은 셈)
    if k == 'college': return APP + ('college_gate_' + p['gate'] + '_{g}.webp' if p.get('gate') else 'college_gate_{t}.webp')

def card(p):
    tpl = img_tpl(p)
    src = tpl.replace('{t}', 'd').replace('{g}', 'd')
    where = ' · '.join(x for x in [p.get('city'), p.get('co'), p.get('y')] if x)
    cls = 'pl-card face' if p['k'] == 'stadium' else 'pl-card'
    page = 'place-' + p['c'] + '.html'          # 1021 밤 — 집 한 곳 페이지가 서 있으면 칸이 그리로 이어진다
    link = os.path.exists(os.path.join(ROOT, page))
    out = [f'    <li class="{cls}" data-code="{esc(p["c"])}">' + (f'<a class="pl-link" href="{page}">' if link else ''),
           f'      <div class="pl-img"><img src="{esc(src)}"' + (f' data-tpl="{esc(tpl)}"' if ('{t}' in tpl or '{g}' in tpl) else '') +
           f' alt="{esc(p["n"])}" loading="lazy" width="1672" height="941"></div>',
           f'      <div class="pl-txt"><b>{esc(p["n"])}</b><span class="en">{esc(p.get("en"))}{" · " + esc(where) if where else ""}</span>']
    if p.get('sub'): out.append(f'        <span class="sub">{esc(p["sub"])}</span>')
    out.append('      </div>' + ('</a>' if link else '') + '</li>')
    return '\n'.join(out)

def build():
    P = json.load(open(os.path.join(ROOT, 'tools', 'places.json'), encoding='utf-8'))
    tmpl = open(os.path.join(ROOT, 'guide.html'), encoding='utf-8').read()
    head = tmpl[:tmpl.index('<main>')]
    head = head.replace(head[head.index('<title>'):head.index('</title>') + 8], '<title>Places · EG유니버스</title>')
    i = head.index('<meta name="description"'); j = head.index('>', i) + 1
    head = head[:i] + '<meta name="description" content="지구 위 제자리에 선 집 ' + str(len(P)) + '곳 — 미술관 · 음악관 · 도서관 · 카페 · 천문대 · 야구장 · 학술원.">' + head[j:]
    i = head.index('<link rel="stylesheet" href="guide.css'); j = head.index('>', i) + 1
    head = head[:i] + head[i:j] + f'\n<link rel="stylesheet" href="places.css?v={V}">' + head[j:]

    total = len(P)
    by = {k[0]: [p for p in P if p['k'] == k[0]] for k in KINDS}
    cnt = {k: len(v) for k, v in by.items()}
    body = ['<main>',
            '  <div class="eyebrow">4 · 어디 · 장소</div>',
            '  <h1>Places</h1>',
            f'  <p class="gloss">EG유니버스는 지구 위에 있습니다. 위성이 찍어 둔 지구를 그대로 빌려 쓰고, 있는 도시에 없던 집을 세웠습니다. 그림을 걸려고 지은 적 없는 미술관부터 지금 깊은 밤인 땅 한 곳에만 문을 여는 천문대까지, 지금 {total}곳입니다.</p>',
            '  <nav class="pl-kinds" aria-label="종류">']
    body += [f'    <a href="#{k}"><b>{ko}</b><i>{cnt[k]}</i></a>' for k, en, ko, line, g in KINDS]
    body += ['  </nav>',
             '  <p class="pl-clock">대문 그림은 서울 시각을 따라 아침 · 낮 · 저녁 · 밤으로 바뀝니다. 천문대는 늘 밤입니다.</p>']
    for k, en, ko, line, g in KINDS:
        body += ['', f'  <section class="pl-sec" id="{k}" aria-label="{ko}">',
                 f'    <div class="pl-head"><h2>{en}</h2><span class="ko">{ko}</span><span class="n">{cnt[k]}곳</span></div>',
                 f'    <p class="pl-line">{line}</p>',
                 f'    <ul class="pl-grid{" " + g if g else ""}">']
        body += [card(p) for p in by[k]]
        body += ['    </ul>', '  </section>']
    body += ['', '  <p class="pl-coda">한 곳에 한 장씩, 그 집이 어떻게 생겨났는지를 담은 페이지가 차례로 섭니다.</p>',
             '  <span class="wip">집마다 한 장 · 짓는 중</span>', '</main>']

    tail = tmpl[tmpl.index('</main>') + len('</main>'):]
    sky = ('<!-- 앱의 하늘 — 서울 시각 + 서울의 실제 일출 · 일몰(Today 와 같은 판) -->\n'
           '<script src="https://app.egsalon.com/eg_sky.js?v=0806e"></script>\n'
           '<script>\n'
           '/* 대문 그림의 시간대 m 아침 · d 낮 · e 저녁 · n 밤 — egSky 가 못 오면 서울 시각 고정 구간으로 */\n'
           'window.egPhase = window.egPhase || function(){\n'
           '  try { if (window.egSky && egSky.phase) return egSky.phase(); } catch(e){}\n'
           '  var h = new Date(Date.now() + 9 * 3600000).getUTCHours();\n'
           "  return (h>=5 && h<9) ? 'm' : (h>=9 && h<17) ? 'd' : (h>=17 && h<20) ? 'e' : 'n';\n"
           '};\n'
           '(function(){\n'
           "  var t = egPhase(), g = (t === 'e' || t === 'n') ? 'n' : 'd';\n"
           "  document.querySelectorAll('.pl-img img[data-tpl]').forEach(function(im){ im.src = im.getAttribute('data-tpl').replace('{t}', t).replace('{g}', g); });\n"
           '})();\n'
           '</script>\n')
    tail = tail.replace('<script src="guide.js', sky + '<script src="guide.js', 1)
    page = head + '\n'.join(body) + tail
    out = os.path.join(ROOT, 'places.html')
    open(out, 'w', encoding='utf-8').write(page)
    return out, total

if __name__ == '__main__':
    print(build())
