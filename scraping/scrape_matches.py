#!/usr/bin/env python3
"""Scrape ALL OL matches (all competitions) for every season since 2000-01,
with scores and goal scorers, from Transfermarkt.

Resumable: matches_full.csv (one row/match) and matches_scorers.csv (one row/goal)
are appended to; a season already fully written to the 'seasons_done' marker
file is skipped on re-run.
"""
import csv
import os
import re
import time
from bs4 import BeautifulSoup
from common import get

OL_ID = "1041"
OL_SLUG = "olympique-lyon"
OUT_MATCHES = "data-research/csv/matches_full.csv"
OUT_SCORERS = "data-research/csv/matches_scorers.csv"
DONE_MARKER = "data-research/csv/.matches_seasons_done"

MATCH_FIELDS = ["season", "competition", "round", "date", "time", "home", "away",
                 "home_score", "away_score", "penalties", "venue_side", "attendance",
                 "report_url", "match_id"]
SCORER_FIELDS = ["match_id", "season", "competition", "date", "home", "away",
                  "running_score", "scoring_team", "scorer", "assist", "detail"]

FIRST_SEASON = 2000
LAST_SEASON = 2025  # 2025-26, in progress


def load_done_seasons():
    if os.path.exists(DONE_MARKER):
        return set(open(DONE_MARKER).read().split())
    return set()


def mark_season_done(season):
    with open(DONE_MARKER, "a") as f:
        f.write(f"{season}\n")


def parse_fixtures(season_id):
    url = f"https://www.transfermarkt.fr/{OL_SLUG}/spielplandatum/verein/{OL_ID}/saison_id/{season_id}"
    r = get(url, headers={"User-Agent": "Mozilla/5.0"})
    if not r or r.status_code != 200:
        return []
    soup = BeautifulSoup(r.text, "lxml")
    tables = soup.select("div.responsive-table table")
    if not tables:
        return []
    matches = []
    competition = None
    for row in tables[0].select("tbody tr"):
        tds = row.find_all("td")
        if len(tds) == 1:
            competition = tds[0].get_text(strip=True)
            continue
        if len(tds) < 10 or competition is None:
            continue
        round_ = tds[0].get_text(strip=True)
        date = tds[1].get_text(strip=True)
        time_ = tds[2].get_text(strip=True)
        side = tds[3].get_text(strip=True)  # D=domicile/home, E=exterieur/away
        opponent_cell = tds[6]
        opponent = opponent_cell.get_text(strip=True)
        opponent = re.sub(r"\s*\(\d+\.\)\s*$", "", opponent).strip()
        attendance = tds[8].get_text(strip=True)
        score_cell = tds[9].get_text(strip=True)
        m = re.match(r"(\d+):(\d+)", score_cell)
        if not m:
            continue
        s1, s2 = int(m.group(1)), int(m.group(2))
        penalties = "tab" in score_cell or "n.v." in score_cell
        report_link = tds[9].find("a")
        report_url = report_link["href"] if report_link else ""
        match_id_m = re.search(r"spielbericht/(\d+)", report_url)
        match_id = match_id_m.group(1) if match_id_m else ""

        if side == "D":
            home, away, home_score, away_score = "Lyon", opponent, s1, s2
        else:
            home, away, home_score, away_score = opponent, "Lyon", s1, s2

        matches.append({
            "season": f"{season_id}-{str(season_id+1)[-2:]}", "competition": competition,
            "round": round_, "date": date, "time": time_, "home": home, "away": away,
            "home_score": home_score, "away_score": away_score,
            "penalties": "oui" if penalties else "non", "venue_side": side,
            "attendance": attendance, "report_url": report_url, "match_id": match_id,
        })
    return matches


def parse_scorers(match_id):
    url = f"https://www.transfermarkt.fr/spielbericht/index/spielbericht/{match_id}"
    r = get(url, headers={"User-Agent": "Mozilla/5.0"})
    if not r or r.status_code != 200:
        return []
    soup = BeautifulSoup(r.text, "lxml")
    goals = []
    for ev in soup.select("div.sb-aktion"):
        score_el = ev.select_one(".sb-aktion-spielstand b")
        if not score_el:
            continue
        running_score = score_el.get_text(strip=True)
        action = ev.select_one(".sb-aktion-aktion")
        if not action:
            continue
        scorer_link = action.find("a")
        scorer = scorer_link.get_text(strip=True) if scorer_link else ""
        detail_text = action.get_text(" ", strip=True)
        assist_m = re.search(r"Passe d[ée]cisive\s*:\s*([^,]+)", detail_text)
        assist = assist_m.group(1).strip() if assist_m else ""
        team_el = ev.select_one(".sb-aktion-wappen img")
        team = team_el.get("alt") if team_el else ""
        goals.append({
            "running_score": running_score, "scoring_team": team,
            "scorer": scorer, "assist": assist, "detail": detail_text,
        })
    return goals


def main():
    done_seasons = load_done_seasons()
    write_m_header = not os.path.exists(OUT_MATCHES)
    write_s_header = not os.path.exists(OUT_SCORERS)

    mf = open(OUT_MATCHES, "a", newline="", encoding="utf-8")
    sf = open(OUT_SCORERS, "a", newline="", encoding="utf-8")
    mw = csv.DictWriter(mf, fieldnames=MATCH_FIELDS)
    sw = csv.DictWriter(sf, fieldnames=SCORER_FIELDS)
    if write_m_header:
        mw.writeheader()
    if write_s_header:
        sw.writeheader()

    for season_id in range(FIRST_SEASON, LAST_SEASON + 1):
        if str(season_id) in done_seasons:
            continue
        matches = parse_fixtures(season_id)
        print(f"Season {season_id}-{str(season_id+1)[-2:]}: {len(matches)} matches")
        time.sleep(0.8)
        for match in matches:
            mw.writerow(match)
            mf.flush()
            if match["match_id"]:
                goals = parse_scorers(match["match_id"])
                for g in goals:
                    sw.writerow({
                        "match_id": match["match_id"], "season": match["season"],
                        "competition": match["competition"], "date": match["date"],
                        "home": match["home"], "away": match["away"], **g,
                    })
                sf.flush()
                time.sleep(0.6)
        mark_season_done(season_id)
        print(f"  -> season {season_id} done")

    mf.close()
    sf.close()


if __name__ == "__main__":
    main()
