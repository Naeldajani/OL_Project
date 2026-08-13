#!/usr/bin/env python3
"""Re-fetch the Transfermarkt fixture-list pages (already scraped once for
scores) to pull OL's league position column, which was discarded the first
time. Only Ligue 1 rows carry a position. Merges into a new CSV keyed by
match_id: data-research/csv/matches_position.csv
"""
import csv
import os
import re
import time
from bs4 import BeautifulSoup
from common import get

OL_ID = "1041"
OL_SLUG = "olympique-lyon"
OUT = "data-research/csv/matches_position.csv"
FIRST_SEASON, LAST_SEASON = 2000, 2025


def parse_positions(season_id):
    url = f"https://www.transfermarkt.fr/{OL_SLUG}/spielplandatum/verein/{OL_ID}/saison_id/{season_id}"
    r = get(url, headers={"User-Agent": "Mozilla/5.0"})
    if not r or r.status_code != 200:
        return []
    soup = BeautifulSoup(r.text, "lxml")
    tables = soup.select("div.responsive-table table")
    if not tables:
        return []
    out = []
    competition = None
    for row in tables[0].select("tbody tr"):
        tds = row.find_all("td")
        if len(tds) == 1:
            competition = tds[0].get_text(strip=True)
            continue
        if len(tds) < 10 or competition != "Ligue 1":
            continue
        pos_text = tds[4].get_text(strip=True)
        m = re.search(r"(\d+)", pos_text)
        report_link = tds[9].find("a")
        report_url = report_link["href"] if report_link else ""
        mid_m = re.search(r"spielbericht/(\d+)", report_url)
        if not mid_m or not m:
            continue
        out.append({"match_id": mid_m.group(1), "ol_position": m.group(1)})
    return out


def main():
    done = set()
    write_header = not os.path.exists(OUT)
    if os.path.exists(OUT):
        done = {r["match_id"] for r in csv.DictReader(open(OUT))}
    with open(OUT, "a", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["match_id", "ol_position"])
        if write_header:
            w.writeheader()
        for season_id in range(FIRST_SEASON, LAST_SEASON + 1):
            rows = parse_positions(season_id)
            new = [r for r in rows if r["match_id"] not in done]
            for r in new:
                w.writerow(r)
                done.add(r["match_id"])
            f.flush()
            print(f"{season_id}: {len(rows)} Ligue1 rows, {len(new)} new", flush=True)
            time.sleep(0.6)


if __name__ == "__main__":
    main()
