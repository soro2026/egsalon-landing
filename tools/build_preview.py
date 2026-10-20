# 미리보기 빌더 — 사이트 페이지 하나를 HTML 파일 하나로 (공용 css · js 와 media 를 안에 품는다)
# 쓰기: python3 build_preview.py <저장소> <페이지.html> <내보낼.html>
# · 영상은 화질을 보시도록 1920 판을 품는다(1280 자리에도 같은 것)
# · <html data-preview> 를 단다 — 미리보기에서만 다르게 보일 것이 있으면 이 표지로
import sys, re, base64, os
root, page, out = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(os.path.join(root, page), encoding='utf-8').read()
MIME = {'jpg': 'image/jpeg', 'webp': 'image/webp', 'png': 'image/png'}

def read(name):
    return open(os.path.join(root, name), encoding='utf-8').read()
def data(path, mime):
    return 'data:' + mime + ';base64,' + base64.b64encode(open(os.path.join(root, path), 'rb').read()).decode()

# 공용 css · js 를 안으로
for name in ['site.css', 'guide.css']:
    if os.path.exists(os.path.join(root, name)):
        body = read(name)
        s = re.sub(r'<link rel="stylesheet" href="' + re.escape(name) + r'\?v=[^"]*">', lambda m: '<style>\n' + body + '\n</style>', s)
for name in ['site.js', 'guide.js']:
    if os.path.exists(os.path.join(root, name)):
        body = read(name).replace('</script', '<\\/script')
        s = re.sub(r'<script src="' + re.escape(name) + r'\?v=[^"]*"></script>', lambda m: '<script>\n' + body + '\n</script>', s)

# 본문 영상 · 맨 위 영상 — 1920 판 하나를 품고, 고르는 셈을 그 하나로
def vid(m):
    return 'data-video-1920="" data-video-1280="' + data('media/' + m.group(1) + '_1920.mp4', 'video/mp4') + '"'
s = re.sub(r'data-video-1920="media/([a-z0-9_]+)_1920\.mp4(?:\?v=[^"]*)?"\s*data-video-1280="media/[a-z0-9_]+_1280\.mp4(?:\?v=[^"]*)?"', vid, s)
def hero(m):
    return 'data-src-1920="" data-src-1280="' + data('media/' + m.group(1) + '_1920.mp4', 'video/mp4') + '"'
s = re.sub(r'data-src-1920="media/([a-z0-9_]+)_1920\.mp4(?:\?v=[^"]*)?"\s*data-src-1280="media/[a-z0-9_]+_1280\.mp4(?:\?v=[^"]*)?"', hero, s)
for a, b in [("v.getAttribute(big ? 'data-src-1920' : 'data-src-1280')", "v.getAttribute('data-src-1280')"),
             ("e.target.getAttribute(big ? 'data-video-1920' : 'data-video-1280')", "e.target.getAttribute('data-video-1280')"),
             ("e.target.getAttribute(wide ? 'data-video-1920' : 'data-video-1280')", "e.target.getAttribute('data-video-1280')")]:
    s = s.replace(a, b)

# 그림 — css url() · poster · src
s = re.sub(r"url\('(media/[^')?]+\.(jpg|webp|png))(?:\?v=[^']*)?'\)", lambda m: "url('" + data(m.group(1), MIME[m.group(2)]) + "')", s)
s = re.sub(r'(poster|src)="(media/[^"?]+\.(jpg|webp|png))(?:\?v=[^"]*)?"', lambda m: m.group(1) + '="' + data(m.group(2), MIME[m.group(3)]) + '"', s)

s = s.replace('<html lang="ko">', '<html lang="ko" data-preview>', 1)
s = re.sub(r'(<body[^>]*>)', r'\1\n<!-- 미리보기 — 다른 페이지로 가는 링크는 이 파일 안에서는 열리지 않습니다 -->', s, count=1)
open(out, 'w', encoding='utf-8').write(s)
left = re.findall(r'(?:href|src)="(?:site|guide)\.(?:css|js)\?v=|"media/[^"]+"', s)
print(out, round(os.path.getsize(out) / 1e6, 1), 'MB', '· 남은 바깥 참조', len(left))
