# Guide 하위 페이지를 한 틀로 짓는 손 (2026.10.20 저녁 · 파이스)
# 쓰기: python3 tools/guide_page.py tools/pages/painting.py   → guide-painting.html 을 새로 쓴다
# 페이지 글은 tools/pages/<slug>.py 의 PAGE 한 덩어리에 적는다 — 고칠 때는 그 파일을 고치고 다시 돌린다.
#
# PAGE = {
#   'slug','num','ko','en','why','how','rooms',             # 머리
#   'hero': {'video': 'guide_x_y'} 또는 {'shot': {...}},     # 맨 위 영상 — 있으면 video, 없으면 빗금 칸 설명
#   'book': '명패 마지막 줄(HTML 허용)',
#   'lede': ['단락', ...], 'lede_media': [미디어...],
#   'rooms_list': [ {'id','title','sub','body':[...], 'media':[...], 'keep':[(굵게, 이어서)...], 'remain': '...'} ],
#   'coda': '맺는 한 줄',
# }
# 미디어 하나 = {'video': 'guide_x_y', 'cap': '...'}  · {'img': 'guide_x_y', 'cap': '...', 'w':1920, 'h':1080}
#             · {'shot': {'kind','shot','where','len','key','must'}}  · {'pair': [미디어, 미디어]}
#             · {'hall': 'orsay', 'cap': '...'}  — 미술관 방 낮 판 + 오늘 그 관에 걸린 그림(hallroom.js · DB 직접 · 1022)
import sys, os, html, runpy
V = '1020h'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def esc(t): return html.escape(str(t), quote=True)

def media(m, ind='  '):
    if 'pair' in m:
        return ind + '<div class="pair">\n' + '\n'.join(media(x, ind + '  ') for x in m['pair']) + '\n' + ind + '</div>'
    if 'video' in m:
        n = m['video']
        return (f'{ind}<figure class="clip" data-video-1920="media/{n}_1920.mp4" data-video-1280="media/{n}_1280.mp4">\n'
                f'{ind}  <div class="frame"><video muted playsinline loop preload="none" poster="media/{n}_poster.jpg"></video></div>\n'
                f'{ind}  <figcaption>{m.get("cap","")}</figcaption></figure>')
    if 'img' in m:
        return (f'{ind}<figure class="clip still">\n'
                f'{ind}  <div class="frame"><img src="media/{m["img"]}.webp" alt="{esc(m.get("alt", m.get("cap","")))}" loading="lazy" width="{m.get("w",1920)}" height="{m.get("h",1080)}"></div>\n'
                f'{ind}  <figcaption>{m.get("cap","")}</figcaption></figure>')
    if 'hall' in m:   # 1022 소로 — 캡처 대신 낮 판 방 + 오늘 그 관에 걸린 그림을 페이지가 직접 건다(hallroom.js)
        USES['hall'] = True
        return (f'{ind}<figure class="clip hallroom" data-hall="{esc(m["hall"])}">\n'
                f'{ind}  <div class="frame"><div class="hr"><img class="wall" alt="" aria-hidden="true">'
                f'<div class="art"><img alt=""></div><div class="hp"><b></b><span></span></div></div></div>\n'
                f'{ind}  <figcaption>{m.get("cap","")}</figcaption></figure>')
    s = m['shot']
    attrs = ' '.join(f'data-{k}="{esc(s[k])}"' for k in ['kind', 'shot', 'where', 'len', 'key', 'must'] if s.get(k))
    return f'{ind}<figure class="clip pending" {attrs}></figure>'

USES = {}

def notes(keep, remain):
    if not keep and not remain: return ''
    out = '    <div class="notes">\n'
    if keep:
        out += '    <div class="keep"><h3>지키는 것</h3><ul>\n' + '\n'.join(f'      <li><b>{a}</b> {b}</li>' for a, b in keep) + '\n    </ul></div>\n'
    else:
        out += '    <div></div>\n'
    if remain:
        out += f'    <div class="remain"><h3>남는 것</h3><p>{remain}</p></div>\n'
    return out + '  </div>'

def build(P):
    tmpl = open(os.path.join(ROOT, 'guide-travel.html'), encoding='utf-8').read()
    head = tmpl[:tmpl.index('<body')]
    head = head.replace(head[head.index('<title>'):head.index('</title>') + 8], f'<title>{P["en"]} · Guide · EG유니버스</title>')
    i = head.index('<meta name="description"'); j = head.index('>', i) + 1
    head = head[:i] + f'<meta name="description" content="{esc(P["ko"] + " — " + P["why"])}">' + head[j:]
    i = head.index('<style>.hero{'); j = head.index('</style>', i) + 8
    hv = P['hero'].get('video')
    head = head[:i] + (f"<style>.hero{{background-image:url('media/{hv}_poster.jpg?v={V}')}}</style>" if hv else '') + head[j:]
    gate = tmpl[tmpl.index('<a class="gate"'):tmpl.index('<header')]

    if hv:
        hero_open = (f'<header class="hero" aria-label="{esc(P["en"])} — 맨 위 영상">\n'
                     f'  <video id="heroClip" muted playsinline autoplay loop preload="auto"\n'
                     f'         poster="media/{hv}_poster.jpg?v={V}" aria-hidden="true"\n'
                     f'         data-src-1920="media/{hv}_1920.mp4?v={V}"\n'
                     f'         data-src-1280="media/{hv}_1280.mp4?v={V}"></video>\n')
    else:
        s = P['hero']['shot']
        attrs = ' '.join(f'data-{k}="{esc(s[k])}"' for k in ['kind', 'shot', 'where', 'len', 'key', 'must'] if s.get(k))
        hero_open = f'<header class="hero pending" aria-label="{esc(P["en"])} — 맨 위 영상 자리" {attrs}>\n'
    hero = (hero_open +
            '  <div class="plate">\n'
            f'    <p class="tag"><span><a href="guide.html">Guide</a> · {P["num"]} · {P["ko"]}</span></p>\n'
            f'    <h1>{P["en"]}</h1>\n'
            f'    <p class="face">{P["why"]}</p>\n'
            f'    <p class="book">{P["book"]}</p>\n'
            '  </div>\n'
            + ('  <div class="credit">지도 · Google · Cesium</div>\n' if P.get('credit', True) else '') +
            '</header>\n')

    body = ['<main class="after-hero">',
            f'  <p class="gloss">{P["how"]}</p>',
            f'  <p class="rooms">{P["rooms"]}</p>', '',
            '  <section class="lede" aria-label="여는 장면">']
    body += [f'    <p>{p}</p>' for p in P['lede']]
    body += ['  </section>']
    body += [media(m) for m in P.get('lede_media', [])]
    for k, r in enumerate(P['rooms_list'], 1):
        body += ['', f'  <section class="room" id="{r["id"]}">',
                 f'    <div class="room-head"><span class="room-num">0{k}</span><h2>{r["title"]}</h2><span class="room-sub">{r["sub"]}</span></div>',
                 '    <div class="room-body">']
        body += [f'      <p>{p}</p>' for p in r['body']]
        body += ['    </div>']
        body += [media(m, '    ') for m in r.get('media', [])]
        n = notes(r.get('keep'), r.get('remain'))
        if n: body += [n]
        body += ['  </section>']
    body += ['', f'  <p class="coda">{P["coda"]}</p>', '',
             '  <!-- 이 페이지를 다 읽고 내려오면 다음 것이 이어 나오지 않고 일곱이 펼쳐진다(1020 오후 소로) -->',
             '  <p class="g7-head">일곱 가지</p>', '  <nav class="g7" aria-label="일곱 가지"></nav>', '</main>']
    tail = tmpl[tmpl.index('</main>') + len('</main>'):]
    if USES.get('hall'):
        tail = tail.replace('</body>', '<script src="hallroom.js?v=1022b"></script>\n</body>', 1)
    page = head + '<body data-nav="cover">\n\n' + gate + hero + '\n'.join(body) + tail
    out = os.path.join(ROOT, f'guide-{P["slug"]}.html')
    open(out, 'w', encoding='utf-8').write(page)
    return out

if __name__ == '__main__':
    P = runpy.run_path(sys.argv[1])['PAGE']
    print(build(P))
