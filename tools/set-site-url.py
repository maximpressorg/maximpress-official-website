#!/usr/bin/env python3
"""Replace former Cloudflare base URL with the actual chosen Firebase/custom-domain URL.
Run before deployment, once the target hostname is confirmed. No URL guesses.
"""
from pathlib import Path
from urllib.parse import urlsplit
import sys
if len(sys.argv)!=2: raise SystemExit('Usage: python tools/set-site-url.py https://YOUR_CONFIRMED_DOMAIN')
new=sys.argv[1].rstrip('/')
p=urlsplit(new)
if p.scheme!='https' or not p.hostname or p.path or p.query or p.fragment:
 raise SystemExit('Provide only an HTTPS site origin, e.g. https://YOUR_PROJECT.web.app')
root=Path(__file__).resolve().parents[1]/'public'
old='https://maximpress.pages.dev'
changed=[]
for path in root.rglob('*'):
 if path.is_file() and (path.suffix=='.html' or path.name in ('sitemap.xml','robots.txt')):
  txt=path.read_text(encoding='utf-8')
  if old in txt:
   path.write_text(txt.replace(old,new),encoding='utf-8');changed.append(str(path.relative_to(root)))
print('Updated origin in',len(changed),'public content and SEO files.')
print('Homepage sitemap remains homepage-only. Update redirects and Search Console separately.')
