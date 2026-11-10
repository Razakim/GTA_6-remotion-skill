# gta6_dl.py  —  pip install requests
import re, requests, subprocess, sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

BASE = "https://www.gtabase.com/gta-6/screenshots/"
PROJECT = Path(__file__).resolve().parent
OUT = PROJECT / "public/assets/_incoming/gta6"
OUT.mkdir(parents=True, exist_ok=True)
S = requests.Session()
S.headers["User-Agent"] = "Mozilla/5.0"

# 1. Collecte des liens 1080p sur toutes les pages
urls = []
start = 0
while True:
    r = S.get(BASE, params={"thumb_limitstart": start, "limit": 100}, timeout=30)
    found = re.findall(r'https://www\.gtabase\.com/igallery/gta-6-screens/[^"\')\s]+?-1080\.jpg', r.text)
    new = [u for u in dict.fromkeys(found) if u not in urls]
    if not new:
        break
    urls += new
    start += 100

print(f"{len(urls)} images trouvées")

# Garder les URLs originales comme métadonnées de source de l'archive.
sources = PROJECT / "public/assets/sources"
sources.mkdir(exist_ok=True)
(sources / "gta6-screenshots.txt").write_text("\n".join(urls) + "\n", encoding="utf-8")

# 2. Téléchargement en parallèle
def dl(u):
    dest = OUT / u.rsplit("/", 1)[1]
    if dest.exists():
        return
    dest.write_bytes(S.get(u, timeout=60).content)
    print("OK", dest.name)

with ThreadPoolExecutor(6) as ex:
    list(ex.map(dl, urls))

# Ranger les nouveaux fichiers et reconstruire le catalogue consultable.
subprocess.run([sys.executable, str(PROJECT / "scripts/archive_gta6_assets.py")], check=True)
