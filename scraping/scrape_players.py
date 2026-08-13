#!/usr/bin/env python3
"""Scrape player photos via Wikidata (member of sports team = OL, Q704),
which avoids name-collision mismatches. Falls back to a name-based Wikidata
search for players missing from the P54 list. Resumable via CSV checkpoint.
"""
import csv
import json
import os
import re
import time
import unicodedata
from common import get, slugify, download, wikidata_team_members, wikidata_sparql

OUT_DIR = "public/images/players"
CSV_PATH = "data-research/csv/players_photos.csv"
os.makedirs(OUT_DIR, exist_ok=True)
FIELDS = ["name", "slug", "source", "wikidata_name", "image_url", "local_path", "status"]

OL_QID = "Q704"


def norm(s):
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z ]", "", s.lower()).strip()


def load_done():
    done = {}
    if os.path.exists(CSV_PATH):
        with open(CSV_PATH, encoding="utf-8") as f:
            for row in csv.DictReader(f):
                done[row["name"]] = row
    return done


def wikidata_search_person_image(name):
    """Fallback: search Wikidata entities by name, keep first with an image
    and an occupation/label suggesting football."""
    r = get("https://www.wikidata.org/w/api.php", params={
        "action": "wbsearchentities", "search": name, "language": "fr",
        "format": "json", "limit": 5, "type": "item",
    })
    if not r:
        return None, None
    for item in r.json().get("search", []):
        desc = (item.get("description") or "").lower()
        if not any(k in desc for k in ["football", "footballeur", "soccer"]):
            continue
        qid = item["id"]
        rows = wikidata_sparql(f"""
        SELECT ?image WHERE {{ wd:{qid} wdt:P18 ?image . }}
        """)
        if rows:
            return rows[0]["image"]["value"], item.get("label")
    return None, None


def main():
    with open("data-research/players.json", encoding="utf-8") as f:
        players = json.load(f)["players"]

    print("Fetching OL squad list from Wikidata (P54=Q704)...")
    team_members = wikidata_team_members(OL_QID)
    by_norm = {norm(k): (k, v) for k, v in team_members.items()}
    print(f"  {len(team_members)} people with photos found on Wikidata for OL")

    done = load_done()
    write_header = not os.path.exists(CSV_PATH)

    with open(CSV_PATH, "a", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        if write_header:
            w.writeheader()

        for i, p in enumerate(players):
            name = p["name"]
            if name in done and done[name]["status"] == "ok":
                continue
            slug = slugify(name)
            row = {"name": name, "slug": slug, "source": "", "wikidata_name": "", "image_url": "", "local_path": "", "status": "not_found"}

            img_url = None
            wd_name = None
            key = norm(name)
            if key in by_norm:
                wd_name, img_url = by_norm[key]
                source = "wikidata_ol_squad"
            else:
                img_url, wd_name = wikidata_search_person_image(name)
                source = "wikidata_search"

            if img_url:
                local = f"{OUT_DIR}/{slug}.png"
                if download(img_url, local, as_png=True):
                    row.update(source=source, wikidata_name=wd_name or "", image_url=img_url, local_path=local, status="ok")
                    print(f"[{i+1}/{len(players)}] {name} -> {source}")
                    w.writerow(row)
                    f.flush()
                    time.sleep(0.3)
                    continue

            print(f"[{i+1}/{len(players)}] {name} -> NOT FOUND")
            w.writerow(row)
            f.flush()
            time.sleep(0.3)


if __name__ == "__main__":
    main()
