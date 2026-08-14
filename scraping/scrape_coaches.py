#!/usr/bin/env python3
"""Scrape photos of every OL head coach since 2000, via Wikidata."""
import csv
import json
import os
import time
from common import get, slugify, download, wikidata_sparql

OUT_DIR = "public/images/coaches"
CSV_PATH = "data-research/csv/coaches_photos.csv"
os.makedirs(OUT_DIR, exist_ok=True)
FIELDS = ["name", "slug", "wikidata_id", "image_url", "local_path", "status"]

COACHES = [
    "Alain Perrin", "Bruno Génésio", "Claude Puel", "Fabio Grosso",
    "Gérard Houllier", "Hubert Fournier", "Jacques Santini", "Laurent Blanc",
    "Paul Le Guen", "Peter Bosz", "Pierre Sage", "Rudi Garcia",
    "Rémi Garde", "Sylvinho",
]


def wikidata_find_image(name):
    r = get("https://www.wikidata.org/w/api.php", params={
        "action": "wbsearchentities", "search": name, "language": "fr",
        "format": "json", "limit": 5, "type": "item",
    })
    if not r:
        return None, None
    for item in r.json().get("search", []):
        desc = (item.get("description") or "").lower()
        if not any(k in desc for k in ["football", "entraineur", "entraîneur", "manager", "coach"]):
            continue
        qid = item["id"]
        rows = wikidata_sparql(f"SELECT ?image WHERE {{ wd:{qid} wdt:P18 ?image . }}")
        if rows:
            return rows[0]["image"]["value"], qid
    return None, None


def main():
    done = {}
    if os.path.exists(CSV_PATH):
        with open(CSV_PATH, encoding="utf-8") as f:
            for row in csv.DictReader(f):
                done[row["name"]] = row

    write_header = not os.path.exists(CSV_PATH)
    with open(CSV_PATH, "a", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        if write_header:
            w.writeheader()

        for i, name in enumerate(COACHES):
            if name in done and done[name]["status"] == "ok":
                continue
            slug = slugify(name)
            row = {"name": name, "slug": slug, "wikidata_id": "", "image_url": "", "local_path": "", "status": "not_found"}

            img_url, qid = wikidata_find_image(name)
            if img_url:
                local = f"{OUT_DIR}/{slug}.png"
                if download(img_url, local, as_png=True):
                    row.update(wikidata_id=qid or "", image_url=img_url, local_path=local, status="ok")
                    print(f"[{i+1}/{len(COACHES)}] {name} -> ok ({qid})")
                    w.writerow(row)
                    f.flush()
                    time.sleep(0.3)
                    continue

            print(f"[{i+1}/{len(COACHES)}] {name} -> NOT FOUND")
            w.writerow(row)
            f.flush()
            time.sleep(0.3)


if __name__ == "__main__":
    main()
