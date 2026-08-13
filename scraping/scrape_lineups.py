#!/usr/bin/env python3
"""Scrape per-match lineups (starting XI + bench + manager) from Transfermarkt.

Lugdun'Home needs the actual players who took part in a given match so the
community can rate them, which the fixture list alone doesn't provide.
Resumable: already-scraped match_ids are skipped.
"""
import csv
import json
import os
import re
import time
from bs4 import BeautifulSoup
from common import get

OUT = "data-research/csv/match_lineups.csv"
FIELDS = ["match_id", "team", "side", "role", "shirt", "player", "position", "nationality"]
FIRST_SEASON = 2018  # richest data + still relevant to today's community


def parse_lineup(match_id):
    url = f"https://www.transfermarkt.fr/spielbericht/aufstellung/spielbericht/{match_id}"
    r = get(url, headers={"User-Agent": "Mozilla/5.0"})
    if not r or r.status_code != 200:
        return []
    soup = BeautifulSoup(r.text, "lxml")
    rows = []
    for box in soup.select("div.box"):
        h2 = box.select_one("h2")
        if not h2:
            continue
        heading = h2.get_text(strip=True)
        if "départ" in heading:
            role = "titulaire"
        elif "banc" in heading:
            role = "banc"
        elif "Manager" in heading:
            role = "manager"
        else:
            continue

        club_link = h2.select_one("a[title]")
        team = club_link.get("title") if club_link else ""

        if role == "manager":
            # the first trainer link wraps the photo and has no text
            a = next((x for x in box.select('a[href*="/profil/trainer/"]')
                      if x.get_text(strip=True)), None)
            if a:
                rows.append({
                    "match_id": match_id, "team": team, "side": "", "role": "manager",
                    "shirt": "", "player": a.get_text(strip=True), "position": "", "nationality": "",
                })
            continue

        for tr in box.select("table.items > tr, table.items > tbody > tr"):
            name_link = tr.select_one("a.wichtig")
            if not name_link:
                continue
            shirt_el = tr.select_one("div.rn_nummer")
            shirt = shirt_el.get_text(strip=True) if shirt_el else ""
            inline = tr.select_one("table.inline-table")
            position = ""
            if inline:
                cells = inline.select("tr")
                if len(cells) > 1:
                    position = cells[-1].get_text(" ", strip=True).split(",")[0]
            flag = tr.select_one("img.flaggenrahmen")
            nationality = flag.get("title") if flag else ""
            rows.append({
                "match_id": match_id, "team": team, "side": "", "role": role,
                "shirt": shirt, "player": name_link.get_text(strip=True),
                "position": position, "nationality": nationality,
            })
    return rows


def main():
    matches = json.load(open("src/data/matches-real.json"))["matches"]
    targets = [
        m for m in matches
        if m.get("id", "").isdigit() and int(m["season"][:4]) >= FIRST_SEASON
    ]
    targets.sort(key=lambda m: m["date"], reverse=True)

    done = set()
    if os.path.exists(OUT):
        with open(OUT, encoding="utf-8") as f:
            done = {r["match_id"] for r in csv.DictReader(f)}

    write_header = not os.path.exists(OUT)
    with open(OUT, "a", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        if write_header:
            w.writeheader()
        for i, m in enumerate(targets):
            mid = m["id"]
            if mid in done:
                continue
            rows = parse_lineup(mid)
            for row in rows:
                # mark whether this entry belongs to OL or the opponent
                row["side"] = "ol" if "Lyon" in row["team"] or "Lyonnais" in row["team"] else "adv"
                w.writerow(row)
            f.flush()
            print(f"[{i+1}/{len(targets)}] {m['date']} {m['home']}-{m['away']} -> {len(rows)} entries", flush=True)
            time.sleep(0.7)


if __name__ == "__main__":
    main()
