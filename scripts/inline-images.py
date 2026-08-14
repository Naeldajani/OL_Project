"""
Prépare les manifestes d'images en data-URI pour la build « artefact ».

Un artefact est un fichier HTML unique, servi sous une CSP qui bloque toute
requête vers un hôte externe : les images doivent donc voyager dans le
fichier lui-même. On les réduit fortement (l'affichage ne dépasse jamais
~64 px de large) et on les encode en PNG quantifié, sinon les 477 visuels
feraient exploser la limite de 16 Mo.

Écrit deux modules à côté des originaux ; ils sont substitués par un alias
vite au moment de la build artefact, puis supprimés.

Usage:  python3 scripts/inline-images.py [taille_px]
"""

import base64
import io
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
SIZE = int(sys.argv[1]) if len(sys.argv) > 1 else 120

# Plus de manifeste de blasons : les clubs sont dessinés par l'application
# (src/lib/crest.ts), il n'y a donc plus de logo à embarquer.
TARGETS = [
    (ROOT / "src/data/photo-manifest.ts", ROOT / "src/data/photo-manifest.inline.ts"),
]

ENTRY = re.compile(r'^(\s*)("(?:[^"\\]|\\.)*")\s*:\s*"(/images/[^"]+)"\s*,?\s*$')


def encode(rel_path: str) -> str | None:
    src = PUBLIC / rel_path.lstrip("/")
    if not src.exists():
        return None
    try:
        im = Image.open(src)
    except OSError:
        return None

    im = im.convert("RGBA")
    im.thumbnail((SIZE, SIZE), Image.LANCZOS)
    # quantize garde la transparence, contrairement à une conversion RGB qui
    # remplirait le fond par du noir sur les logos détourés.
    im = im.quantize(colors=64, method=Image.FASTOCTREE)

    buf = io.BytesIO()
    im.save(buf, format="PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def convert(src: Path, dst: Path) -> tuple[int, int]:
    out, done, missing = [], 0, 0
    for line in src.read_text(encoding="utf-8").splitlines():
        m = ENTRY.match(line)
        if not m:
            out.append(line)
            continue
        indent, key, path = m.groups()
        uri = encode(path)
        if uri is None:
            missing += 1
            continue
        # une data-URI base64 ne contient ni guillemet ni antislash : on peut
        # la poser telle quelle entre guillemets doubles.
        out.append(f'{indent}{key}: "{uri}",')
        done += 1
    dst.write_text("\n".join(out) + "\n", encoding="utf-8")
    return done, missing


def inline_news() -> None:
    """Les visuels d'Inf'OL sont distants ; la CSP de l'artefact les bloque,
    donc on les rapatrie aussi (plus grands : ils s'affichent en pleine
    largeur)."""
    import json

    import requests

    src = ROOT / "src/lugdunhome/data/news.json"
    dst = ROOT / "src/lugdunhome/data/news.inline.json"
    if not src.exists():
        return

    data = json.loads(src.read_text(encoding="utf-8"))
    ok = 0
    for item in data.get("items", []):
        url = item.get("image") or ""
        if not url.startswith("http"):
            continue
        try:
            # weserv renvoie 403 sur le User-Agent par défaut de requests
            r = requests.get(url, timeout=25, headers={"User-Agent": "Mozilla/5.0"})
            if r.status_code != 200:
                item["image"] = ""
                continue
            im = Image.open(io.BytesIO(r.content)).convert("RGB")
            im.thumbnail((520, 520), Image.LANCZOS)
            buf = io.BytesIO()
            im.save(buf, format="JPEG", quality=72, optimize=True)
            item["image"] = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()
            ok += 1
        except (requests.RequestException, OSError):
            item["image"] = ""

    dst.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    print(f"  news.inline.json: {ok} visuels d'actu inlinés ({dst.stat().st_size / 1e6:.1f} Mo)")


def main() -> int:
    total_ok = total_missing = 0
    for src, dst in TARGETS:
        ok, missing = convert(src, dst)
        total_ok += ok
        total_missing += missing
        size = dst.stat().st_size / 1e6
        print(f"  {dst.name}: {ok} images inlinées ({size:.1f} Mo), {missing} introuvables")
    inline_news()
    print(f"→ {total_ok} images, {total_missing} manquantes (taille max {SIZE}px)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
