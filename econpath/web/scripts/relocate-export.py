# Usage: STATIC_EXPORT=1 npx next build && python3 scripts/relocate-export.py out <dest>
"""Turn a Next.js static export into a path-independent bundle (works under any URL prefix)."""
import os, re, shutil, sys
from pathlib import Path

src, dst = Path(sys.argv[1]), Path(sys.argv[2])
if dst.exists(): shutil.rmtree(dst)
shutil.copytree(src, dst, ignore=shutil.ignore_patterns("*.txt", "404", "_not-found", "__next*"))
# Home page moves to home/ so the published entry page can be a launcher.
(dst / "home").mkdir()
shutil.move(dst / "index.html", dst / "home" / "index.html")

BOOT = """<script>(function(){var R=%s;var root=new URL(R,location.href);
window.TURBOPACK_CHUNK_BASE_PATH=R+"_next/";
window.__econpathHref=function(h){if(typeof h!=="string"||h.charAt(0)!=="/"||h.charAt(1)==="/")return h;var u=new URL(h,"http://x");var p=u.pathname.replace(/^\\//,"");if(p===""||p==="/")p="home";if(p.slice(-1)!=="/")p+="/";return new URL(p+"index.html"+u.search+u.hash,root).href;};
document.addEventListener("click",function(e){if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey)return;var a=e.target.closest&&e.target.closest("a[href]");if(!a||a.target==="_blank")return;var h=a.getAttribute("href");if(!h||h.charAt(0)==="#"||/^[a-z][a-z0-9+.-]*:/i.test(h))return;e.preventDefault();e.stopImmediatePropagation();location.assign(h.charAt(0)==="/"?window.__econpathHref(h):new URL(h,location.href).href);},true);})();</script>"""

def route_to_file(path, rel):
    # "/colleges/ucla/" -> rel + "colleges/ucla/index.html"; "/" -> rel + "home/index.html"
    m = re.match(r"^/([^?#]*)([?#].*)?$", path)
    p, tail = m.group(1), m.group(2) or ""
    if p == "": p = "home"
    if not p.endswith("/"): p += "/"
    return rel + p + "index.html" + tail

for f in dst.rglob("*.html"):
    depth = len(f.relative_to(dst).parts) - 1
    rel = "../" * depth
    s = f.read_text()
    # Asset URLs in HTML attributes become relative. The serialized payload (\"/_next/...)
    # is made relative too, and the chunk loader base (TURBOPACK_CHUNK_BASE_PATH) matches.
    s = re.sub(r'(?<!\\)(["\'(])/_next/', lambda m: m.group(1) + rel + "_next/", s)
    s = s.replace('\\"/_next/', '\\"' + rel + "_next/")
    s = re.sub(r'(?<=["\'])/icon\.svg', rel + "icon.svg", s)
    # internal links in href attributes
    s = re.sub(r'href="(/(?!/)[^"]*)"', lambda m: 'href="%s"' % route_to_file(m.group(1), rel), s)
    s = s.replace("<head>", "<head>" + BOOT % ('"%s"' % rel), 1)
    f.write_text(s)

for f in dst.rglob("*.css"):
    s = f.read_text().replace("/_next/static/media/", "../media/")
    f.write_text(s)

(dst / "index.html").write_text("""<title>EconPath</title>
<style>:root{--bg:#f6f7f9;--fg:#0b1324;--mut:#5a6478;--pri:#2447d1}@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#080b12;--fg:#e9edf5;--mut:#9aa4b8;--pri:#5b7fff;color-scheme:dark}}:root[data-theme="dark"]{--bg:#080b12;--fg:#e9edf5;--mut:#9aa4b8;--pri:#5b7fff;color-scheme:dark}
body{background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,sans-serif;padding:48px 16px;text-align:center}a{color:var(--pri);font-weight:600}</style>
<p>Opening EconPath&hellip;</p>
<p><a href="home/index.html">Open EconPath</a></p>
<script>location.replace("home/index.html");</script>
""")
files = [p for p in dst.rglob("*") if p.is_file()]
print(len(files), "files", sum(p.stat().st_size for p in files)//1024, "KB")
