#!/usr/bin/env python3
"""Scrape club crest PNGs for every club an OL player has been through.
Primary: Wikipedia lead image (usually the crest) via api.php + weserv proxy (PNG).
Resumable via CSV checkpoint.
"""
import csv
import json
import os
import time
from common import slugify, wikipedia_pageimage, download

OUT_DIR = "public/images/clubs"
CSV_PATH = "data-research/csv/clubs_logos.csv"
os.makedirs(OUT_DIR, exist_ok=True)
FIELDS = ["club", "slug", "source", "wiki_title", "image_url", "local_path", "status"]


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
            row = {"club": club, "slug": slug, "source": "", "wiki_title": "", "image_url": "", "local_path": "", "status": "not_found"}

            img_url, title = wikipedia_pageimage(f"{club} football club", "fr")
            source = "wikipedia_fr"
            if not img_url:
                # Bare-name fallback is risky: for one-word clubs that share a
                # name with a French city (Marseille, Angers, Auxerre...) this
                # can resolve to the CITY's Wikipedia page and grab a landmark
                # photo instead of the crest. Only accept it if the resolved
                # title clearly isn't just the bare place name.
                candidate_url, candidate_title = wikipedia_pageimage(club, "fr")
                if candidate_title and candidate_title.strip().lower() != club.strip().lower():
                    img_url, title = candidate_url, candidate_title
            if not img_url:
                img_url, title = wikipedia_pageimage(f"{club} football club", "en")
                source = "wikipedia_en"

            if img_url:
                local = f"{OUT_DIR}/{slug}.png"
                if download(img_url, local, as_png=True):
                    row.update(source=source, wiki_title=title or "", image_url=img_url, local_path=local, status="ok")
                    print(f"[{i+1}/{len(clubs)}] {club} -> {source} ({title})")
                    w.writerow(row)
                    f.flush()
                    time.sleep(0.3)
                    continue

            print(f"[{i+1}/{len(clubs)}] {club} -> NOT FOUND")
            w.writerow(row)
            f.flush()
            time.sleep(0.3)


if __name__ == "__main__":
    main()
