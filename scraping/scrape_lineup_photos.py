#!/usr/bin/env python3
"""Fetch photos for players who appear in scraped match lineups but aren't in
the original 168-player research set (mostly recent/academy squad members).
Appends to players_photos.csv so the app's manifest picks them up.
"""
import csv
import json
import os
import re
import time
import unicodedata
from common import get, slugify, download, wikidata_sparql

OUT_DIR = "public/images/players"
CSV_PATH = "data-research/csv/players_photos.csv"
FIELDS = ["name", "slug", "source", "wikidata_name", "image_url", "local_path", "status"]


def norm(s):
    s = unicodedata.normalize("NFD", s)
    return "".join(c for c in s if unicodedata.category(c) != "Mn").lower().strip()


def find_image(name):
    """Search Wikidata for a footballer by name and return their P18 image."""
    r = get("https://www.wikidata.org/w/api.php", params={
        "action": "wbsearchentities", "search": name, "language": "fr",
        "format": "json", "limit": 6, "type": "item",
    })
    if not r:
        return None, None
    for item in r.json().get("search", []):
        desc = (item.get("description") or "").lower()
        if not any(k in desc for k in ["football", "soccer", "gardien", "sportif"]):
            continue
        qid = item["id"]
        rows = wikidata_sparql(f"SELECT ?image WHERE {{ wd:{qid} wdt:P18 ?image . }}")
        if rows:
            return rows[0]["image"]["value"], item.get("label")
    return None, None


def main():
    lineups = json.load(open("src/lugdunhome/data/lineups.json", encoding="utf-8"))
    squad = set()
    for v in lineups.values():
        for p in v["ol"]:
            squad.add(p["player"])

    existing = list(csv.DictReader(open(CSV_PATH, encoding="utf-8")))
    have = {norm(r["name"]) for r in existing if r["status"] == "ok"}
    tried = {norm(r["name"]) for r in existing}

    targets = sorted(n for n in squad if norm(n) not in have)
    print(f"{len(targets)} joueurs sans photo", flush=True)

    with open(CSV_PATH, "a", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        for i, name in enumerate(targets):
            if norm(name) in tried:
                # already attempted under this exact spelling in a prior run
                pass
            img, label = find_image(name)
            slug = slugify(name)
            row = {"name": name, "slug": slug, "source": "wikidata_lineup",
                   "wikidata_name": label or "", "image_url": img or "",
                   "local_path": "", "status": "not_found"}
            if img:
                path = f"{OUT_DIR}/{slug}.png"
                if download(img, path, as_png=True):
                    row["local_path"] = path
                    row["status"] = "ok"
            print(f"[{i+1}/{len(targets)}] {name} -> {row['status']}", flush=True)
            w.writerow(row)
            f.flush()
            time.sleep(0.35)


if __name__ == "__main__":
    main()
