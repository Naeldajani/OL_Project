#!/usr/bin/env python3
"""Re-scrape ALL club crests using a reliable method: search for the page,
then only accept an image whose <img alt="Logo ..."> confirms it's actually
the crest -- never the page's generic lead image (which, for an ambiguous
club/city name, is often a landmark photo, not a badge).
"""
import csv
import json
import os
import time
from common import slugify, wikipedia_search_titles, wikipedia_crest_image, download

OUT_DIR = "public/images/clubs"
CSV_PATH = "data-research/csv/clubs_logos_v2.csv"
os.makedirs(OUT_DIR, exist_ok=True)
FIELDS = ["club", "slug", "wiki_title", "image_url", "local_path", "status"]


# Clubs where the automated search reliably lands on a *different real club*
# with a similar/nearby name rather than the one meant here.
OVERRIDES = {
    "Bastia": "Sporting Club de Bastia",
    "Ajaccio": "Athletic Club ajaccien",
    "Valenciennes": "Valenciennes FC",
    "Zenit Saint Petersburg": "Zenit Saint-Pétersbourg",
    "Dynamo Moscow": "FK Dynamo Moscou",
    "Olympiacos": "Olympiakos Le Pirée",
    "Gent": "KAA La Gantoise",
    "Clermont": "Clermont Foot 63",
    "Clermont Foot": "Clermont Foot 63",
    "Lyon": "Olympique lyonnais",
    "R. Strasbourg": "Racing Club de Strasbourg Alsace",
    "Strasbourg": "Racing Club de Strasbourg Alsace",
    "Le Havre AC": "Le Havre Athlétic Club (football)",
    "Le Havre": "Le Havre Athlétic Club (football)",
    "Brest": "Stade brestois 29",
    "Stade Brestois": "Stade brestois 29",
}


def find_crest(club):
    if club in OVERRIDES:
        img_url, _ = wikipedia_crest_image(OVERRIDES[club], "fr")
        if img_url:
            return img_url, OVERRIDES[club]
    """Try several query/lang variants, and within each, several search
    results, until a page with a genuine alt="Logo..." image is found."""
    variants = [
        (club + " football club", "fr"),
        (club + " (football)", "fr"),
        (club, "fr"),
        (club + " football club", "en"),
    ]
    for query, lang in variants:
        for title in wikipedia_search_titles(query, lang, limit=3):
            img_url, _ = wikipedia_crest_image(title, lang)
            if img_url:
                return img_url, title
    return None, None


def load_done():
    done = {}
    if os.path.exists(CSV_PATH):
        with open(CSV_PATH, encoding="utf-8") as f:
            for row in csv.DictReader(f):
                done[row["club"]] = row
    return done


def main():
    with open("data-research/players.json", encoding="utf-8") as f:
        players = json.load(f)["players"]
    clubs = sorted({c["club"] for p in players for c in p.get("career", [])})
    clubs.append("Lyon")

    done = load_done()
    write_header = not os.path.exists(CSV_PATH)

    with open(CSV_PATH, "a", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        if write_header:
            w.writeheader()

        for i, club in enumerate(clubs):
            if club in done and done[club]["status"] == "ok":
                continue
            slug = slugify(club)
            row = {"club": club, "slug": slug, "wiki_title": "", "image_url": "", "local_path": "", "status": "not_found"}

            img_url, title = find_crest(club)

            if img_url:
                local = f"{OUT_DIR}/{slug}.png"
                if download(img_url, local, as_png=True):
                    row.update(wiki_title=title or "", image_url=img_url, local_path=local, status="ok")
                    print(f"[{i+1}/{len(clubs)}] {club} -> {title}", flush=True)
                    w.writerow(row)
                    f.flush()
                    time.sleep(0.3)
                    continue

            print(f"[{i+1}/{len(clubs)}] {club} -> NOT FOUND", flush=True)
            w.writerow(row)
            f.flush()
            time.sleep(0.3)


if __name__ == "__main__":
    main()
