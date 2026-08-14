"""
Audit juridique des visuels : interroge l'API Wikimedia Commons pour chaque
image téléchargée et récupère sa licence, son auteur et sa page d'origine.

Pourquoi c'est nécessaire : « venir de Commons » ne veut pas dire « libre ».
Commons héberge surtout du CC BY / CC BY-SA — réutilisables, mais qui
*obligent* à créditer l'auteur et à nommer la licence. On y trouve aussi des
logos sous exception (marque déposée, seuil d'originalité) qui ne sont pas
du contenu libre.

Produit data-research/csv/media_licences.csv et le manifeste de crédits
consommé par l'application.

Usage:  python3 scraping/audit_licences.py
"""

import csv
import json
import re
import sys
import time
from pathlib import Path
from urllib.parse import unquote

import requests

ROOT = Path(__file__).resolve().parent.parent
CSV_DIR = ROOT / "data-research" / "csv"
OUT_CSV = CSV_DIR / "media_licences.csv"
OUT_TS = ROOT / "src" / "data" / "credits-manifest.ts"

API = "https://commons.wikimedia.org/w/api.php"
# Wikipédia FR/EN hébergent en local des logos sous exception (marque
# déposée, usage informatif) : ces fichiers ne sont PAS du contenu libre et
# n'ont rien à faire sur un site public. Seul /wikipedia/commons/ l'est.
LOCAL_WIKI = re.compile(r"/wikipedia/(?!commons/)([a-z]{2})/")
UA = "LugdunHome/1.0 (projet supporter non commercial; contact via GitHub Naeldajani/OL_Project)"

# Licences acceptées : réutilisation libre, y compris commerciale, sous
# réserve de créditer. Tout le reste est écarté du site public.
FREE = re.compile(
    r"^(cc[- ]by([- ]sa)?([- ]\d(\.\d)?)?|cc0|public domain|pd-|"
    r"gfdl|fal\b|attribution)",
    re.I,
)
# Motifs qui signalent explicitement une image NON libre.
NON_FREE = re.compile(r"fair use|non-free|trademark(ed)?$|copyright(ed)? free use", re.I)

SOURCES = [
    ("player", CSV_DIR / "players_photos.csv"),
    ("coach", CSV_DIR / "coaches_photos.csv"),
    ("club", CSV_DIR / "clubs_logos_v2.csv"),
]


def commons_title(url: str) -> str | None:
    """Retrouve le titre « File:… » à partir de l'URL téléchargée."""
    if "wikimedia.org" not in url and "wikipedia.org" not in url:
        return None
    m = re.search(r"Special:FilePath/([^?]+)", url)
    if m:
        return "File:" + unquote(m.group(1))
    m = re.search(r"/commons/(?:thumb/)?[0-9a-f]/[0-9a-f]{2}/([^/?]+)", url)
    if m:
        return "File:" + unquote(m.group(1))
    return None


def fetch_batch(titles: list[str]) -> dict[str, dict]:
    """extmetadata donne licence + auteur ; l'API accepte 50 titres par appel."""
    params = {
        "action": "query",
        "format": "json",
        "prop": "imageinfo",
        "iiprop": "extmetadata|url",
        "iiextmetadatafilter": "LicenseShortName|Artist|Credit|LicenseUrl|Permission",
        "titles": "|".join(titles),
    }
    for attempt in range(4):
        try:
            r = requests.get(API, params=params, headers={"User-Agent": UA}, timeout=40)
            if r.status_code == 200:
                return r.json().get("query", {}).get("pages", {})
        except requests.RequestException:
            pass
        time.sleep(2 * (attempt + 1))
    return {}


def clean(html: str) -> str:
    txt = re.sub(r"<[^>]+>", " ", html or "")
    txt = txt.replace("&amp;", "&").replace("&nbsp;", " ").replace("&quot;", '"')
    return re.sub(r"\s+", " ", txt).strip()


def classify(licence: str) -> str:
    if not licence:
        return "inconnue"
    if NON_FREE.search(licence):
        return "non-libre"
    if FREE.match(licence.strip()):
        return "libre"
    return "à vérifier"


def main() -> int:
    rows, wanted = [], {}

    for kind, path in SOURCES:
        if not path.exists():
            print(f"  [!] {path.name} absent", file=sys.stderr)
            continue
        for rec in csv.DictReader(path.open(encoding="utf-8")):
            if rec.get("status") != "ok":
                continue
            url = rec.get("image_url", "")
            local = LOCAL_WIKI.search(url)
            title = None if local else commons_title(url)
            entry = {
                "kind": kind,
                # les CSV clubs nomment la colonne « club », les autres « name »
                "name": rec.get("name") or rec.get("club", ""),
                "local_path": rec.get("local_path", ""),
                "image_url": url,
                "commons_title": title or "",
                "licence": "",
                "author": "",
                "file_page": "",
                "verdict": f"non-libre (import local {local.group(1)}.wikipedia)"
                if local
                else "hors-commons",
            }
            rows.append(entry)
            if title:
                wanted.setdefault(title, []).append(entry)

    titles = list(wanted)
    print(f"{len(rows)} visuels, {len(titles)} fichiers Commons à interroger")

    for i in range(0, len(titles), 50):
        chunk = titles[i : i + 50]
        pages = fetch_batch(chunk)
        # l'API normalise les titres, on réindexe donc sur le titre renvoyé
        for page in pages.values():
            info = (page.get("imageinfo") or [{}])[0]
            meta = info.get("extmetadata", {}) or {}
            licence = clean(meta.get("LicenseShortName", {}).get("value", ""))
            author = clean(meta.get("Artist", {}).get("value", "")) or clean(
                meta.get("Credit", {}).get("value", "")
            )
            for entry in wanted.get(page.get("title", ""), []):
                entry["licence"] = licence
                entry["author"] = author[:160]
                entry["file_page"] = info.get("descriptionurl", "")
                entry["verdict"] = classify(licence)
        print(f"  {min(i + 50, len(titles))}/{len(titles)}")
        time.sleep(0.4)

    CSV_DIR.mkdir(parents=True, exist_ok=True)
    with OUT_CSV.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)

    tally: dict[str, int] = {}
    for r in rows:
        tally[r["verdict"]] = tally.get(r["verdict"], 0) + 1
    print("\nVerdicts :", tally)

    problems = [r for r in rows if r["verdict"] in ("non-libre", "inconnue", "hors-commons")]
    if problems:
        print(f"\n{len(problems)} visuels à écarter ou vérifier :")
        for r in problems[:25]:
            print(f"  [{r['verdict']}] {r['kind']} · {r['name']} · {r['licence'] or '—'}")

    # Manifeste de crédits : uniquement ce qui est réellement diffusé.
    # Les blasons de clubs n'y figurent pas — plus aucun logo n'est publié,
    # ils sont remplacés par des écussons maison (src/lib/crest.ts).
    credits = {
        r["name"]: {
            "licence": r["licence"],
            "author": r["author"],
            "page": r["file_page"],
        }
        for r in rows
        if r["verdict"] == "libre" and r["kind"] != "club"
    }
    OUT_TS.parent.mkdir(parents=True, exist_ok=True)
    OUT_TS.write_text(
        "// Généré par scraping/audit_licences.py — ne pas éditer à la main.\n"
        "// Crédits obligatoires des visuels Wikimedia Commons (CC BY / CC BY-SA).\n"
        "export type Credit = { licence: string; author: string; page: string }\n"
        "export const CREDITS: Record<string, Credit> = "
        + json.dumps(credits, ensure_ascii=False, indent=1)
        + "\n",
        encoding="utf-8",
    )
    print(f"\n→ {OUT_CSV.relative_to(ROOT)}")
    print(f"→ {OUT_TS.relative_to(ROOT)} : {len(credits)} crédits")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
