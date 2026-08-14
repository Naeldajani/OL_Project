"""
Inf'OL — agrège l'actualité OL depuis les flux publics des médias et sites
de supporters, et produit src/lugdunhome/data/news.json.

Chaque source est un flux RSS public. Les articles sont filtrés sur des
mots-clés OL (le club, le stade, la ville, les joueurs du dernier effectif),
puis condensés en un mini-résumé de 2 phrases. L'article original est
toujours cité et lié : on résume, on ne recopie pas.

Les visuels restent hébergés chez la source mais passent par images.weserv.nl,
qui les redimensionne et évite les blocages de hotlink.

Usage:  python3 scraping/scrape_news.py
"""

import html
import json
import re
import sys
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "lugdunhome" / "data" / "news.json"

UA = "Mozilla/5.0 (compatible; LugdunHome/1.0; +https://github.com/Naeldajani/OL_Project)"

# Chaque source : (nom affiché, url du flux, ol_only)
# ol_only=True  -> flux 100 % OL, on garde tout
# ol_only=False -> flux généraliste, on filtre sur les mots-clés
SOURCES = [
    ("Olympique-et-Lyonnais", "https://www.olympique-et-lyonnais.com/feed/", True),
    ("Lyon Mag", "https://www.lyonmag.com/rss", False),
    ("RMC Sport", "https://rmcsport.bfmtv.com/rss/football/ligue-1/", False),
    ("But! Football Club", "https://www.butfootballclub.fr/feed/", False),
    ("20 Minutes", "https://www.20minutes.fr/feeds/rss-sport.xml", False),
]

# Un article compte comme "OL" si l'un de ces motifs apparaît dans le titre
# ou le chapô. « OL » est traité à part (mot entier, sensible à la casse)
# pour ne pas attraper « col », « vol », « Olympique de Marseille »…
KEYWORDS = [
    "olympique lyonnais",
    "lyonnais",
    "lyonnaise",
    "groupama stadium",
    "parc ol",
    "olympique lyonnais féminin",
    "ol lyonnes",
    "fonseca",
    "textor",
    "kang",
    "tolisso",
    "lacazette",
    "cherki",
    "mikautadze",
    "greif",
    "niakhaté",
    "niakhate",
    "tagliafico",
    "maitland-niles",
    "veretout",
    "matic",
    "nuamah",
    "sulc",
    "šulc",
    "abner",
    "mangala",
    "de carvalho",
    "moreira",
    "karabec",
    "gonçalo",
    "goncalo",
]
OL_TOKEN = re.compile(r"\bOL\b")
# « Lyon » tout seul est trop large (Lyon la ville) : on ne le retient que
# collé à un contexte football.
LYON_CTX = re.compile(
    r"\bLyon\b.{0,60}\b(match|but|victoire|défaite|nul|mercato|transfert|"
    r"club|entraîneur|coach|joueur|effectif|ligue|championnat|équipe|"
    r"recrue|signature|prêt|contrat)\b",
    re.I | re.S,
)

# Rubriques déduites du texte, dans l'ordre de priorité.
TOPICS = [
    ("Mercato", r"mercato|transfert|recrue|signature|prêt|s'engage|arrivée|départ|contrat|offre|indemnité"),
    ("Match", r"\bmatch\b|victoire|défaite|match nul|but de|score|compo|journée|affronte|reçoit|déplacement"),
    ("Effectif", r"blessure|blessé|forfait|suspendu|suspension|reprise|entraînement|convoqué|de retour"),
    ("Club", r"président|actionnaire|dngc|dncg|budget|partenaire|sponsor|maillot|abonn|stade|billetterie"),
    ("Féminines", r"féminin|lyonnes|d1 arkema"),
]

# Signatures que WordPress ajoute en fin de flux ; elles arrivent toujours
# après le contenu, donc on coupe du marqueur jusqu'à la fin.
BOILERPLATE = re.compile(
    r"(the post\b.*"
    r"|l[’']article\b.*"
    r"|cet article\b.*"
    r"|lire la suite.*"
    r"|>>.*)",
    re.I | re.S,
)


def get(url, **kw):
    return requests.get(url, headers={"User-Agent": UA}, timeout=25, **kw)


def strip_tags(s):
    # deux passes : certains flux échappent leur HTML (&lt;p&gt;), donc le
    # balisage ne réapparaît qu'après le premier unescape.
    for _ in range(2):
        s = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", s, flags=re.S | re.I)
        s = re.sub(r"<[^>]+>", " ", s)
        s = html.unescape(s)
    return re.sub(r"\s+", " ", s).strip()


def tag(block, name):
    """Valeur d'une balise RSS, CDATA compris."""
    m = re.search(rf"<{name}[^>]*>(.*?)</{name}>", block, re.S | re.I)
    if not m:
        return ""
    v = m.group(1).strip()
    cdata = re.match(r"<!\[CDATA\[(.*?)\]\]>", v, re.S)
    return (cdata.group(1) if cdata else v).strip()


def first_image(block):
    """L'image de l'article : media:content, enclosure, ou le premier <img>
    du chapô (les flux WordPress y collent la vignette)."""
    for pat in (
        r'<media:content[^>]+url="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
        r'<media:thumbnail[^>]+url="([^"]+)"',
        r'<enclosure[^>]+url="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
        r'<img[^>]+src="([^"]+)"',
    ):
        m = re.search(pat, block, re.I)
        if m:
            return html.unescape(m.group(1))
    return ""


def og_image(url):
    """Repli : la vignette Open Graph de la page de l'article."""
    try:
        r = get(url)
        if r.status_code != 200:
            return ""
        m = re.search(
            r'<meta[^>]+property="og:image"[^>]+content="([^"]+)"', r.text, re.I
        ) or re.search(r'<meta[^>]+content="([^"]+)"[^>]+property="og:image"', r.text, re.I)
        return html.unescape(m.group(1)) if m else ""
    except requests.RequestException:
        return ""


def proxied_image(url, width=800):
    """Passe par weserv : redimensionne, convertit, et contourne les
    protections anti-hotlink de certains médias."""
    if not url or not url.startswith("http"):
        return ""
    bare = url.split("://", 1)[1]
    return f"https://images.weserv.nl/?url={requests.utils.quote(bare, safe='')}&w={width}&output=webp&q=78"


def summarize(text, limit=300):
    """Mini-résumé : on nettoie le chapô, on coupe aux phrases entières.

    On ne réécrit pas l'article — on en donne les 2 premières phrases utiles
    et on renvoie vers la source, qui est toujours citée.
    """
    text = BOILERPLATE.sub("", strip_tags(text)).strip()
    if not text:
        return ""
    phrases = re.split(r"(?<=[.!?…])\s+", text)
    out = ""
    for p in phrases:
        if out and len(out) + len(p) > limit:
            break
        out = f"{out} {p}".strip()
        if len(out) > limit * 0.6 and out.endswith((".", "!", "?", "…")):
            break
    if not out:
        out = text[:limit]
    if len(out) > limit:
        out = out[:limit].rsplit(" ", 1)[0] + "…"
    return out


def is_ol(*fields):
    blob = " ".join(f for f in fields if f)
    low = blob.lower()
    if any(k in low for k in KEYWORDS):
        return True
    if OL_TOKEN.search(blob):
        return True
    return bool(LYON_CTX.search(blob))


def topic_of(text):
    low = text.lower()
    for name, pat in TOPICS:
        if re.search(pat, low):
            return name
    return "Actu"


def parse_date(raw):
    try:
        d = parsedate_to_datetime(raw)
        if d.tzinfo is None:
            d = d.replace(tzinfo=timezone.utc)
        return d.astimezone(timezone.utc)
    except (TypeError, ValueError):
        return None


def collect():
    items, seen = [], set()

    for source, url, ol_only in SOURCES:
        try:
            r = get(url)
            if r.status_code != 200:
                print(f"  [!] {source}: HTTP {r.status_code}", file=sys.stderr)
                continue
        except requests.RequestException as exc:
            print(f"  [!] {source}: {exc}", file=sys.stderr)
            continue

        xml = r.text
        blocks = re.findall(r"<item[\s>].*?</item>", xml, re.S | re.I)
        kept = 0

        for block in blocks:
            title = strip_tags(tag(block, "title"))
            link = strip_tags(tag(block, "link")) or (
                re.search(r'<link[^>]+href="([^"]+)"', block) or [None, ""]
            )[1]
            desc = tag(block, "description") or tag(block, "content:encoded")
            if not title or not link:
                continue

            categories = " ".join(re.findall(r"<category[^>]*>(.*?)</category>", block, re.S | re.I))
            if not ol_only and not is_ol(title, strip_tags(desc), strip_tags(categories)):
                continue

            key = re.sub(r"[^a-z0-9]+", "", title.lower())[:60]
            if key in seen:
                continue
            seen.add(key)

            published = parse_date(tag(block, "pubDate"))
            image = first_image(block) or og_image(link)
            resume = summarize(desc)

            items.append(
                {
                    "id": key,
                    "title": title,
                    "summary": resume,
                    "url": link,
                    "source": source,
                    "author": strip_tags(tag(block, "dc:creator")) or None,
                    "image": proxied_image(image),
                    "topic": topic_of(f"{title} {resume}"),
                    "publishedAt": published.isoformat() if published else None,
                }
            )
            kept += 1

        print(f"  {source}: {kept}/{len(blocks)} articles OL")

    # les plus récents d'abord ; les articles sans date passent en dernier
    items.sort(key=lambda i: i["publishedAt"] or "", reverse=True)
    return items


def main():
    print("Inf'OL — collecte des flux")
    items = collect()
    if not items:
        print("Aucun article : on garde le fichier existant.", file=sys.stderr)
        return 1

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps(
            {
                "updatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                "sources": sorted({i["source"] for i in items}),
                "items": items[:60],
            },
            ensure_ascii=False,
            indent=1,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"→ {OUT.relative_to(ROOT)} : {len(items[:60])} articles")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
