#!/usr/bin/env python3
"""Replace single-entry ('Lyon only') career data with the real full career,
parsed from each player's French Wikipedia infobox ('Parcours senior' table).
"""
import json
import re
import time
from bs4 import BeautifulSoup
from common import get

OUT = "data-research/csv/careers_fixed.json"


def wiki_career(name, lang="fr"):
    r = get(f"https://{lang}.wikipedia.org/wiki/{name.replace(' ', '_')}")
    if not r or r.status_code != 200:
        return None
    soup = BeautifulSoup(r.text, "lxml")
    infobox = soup.select_one("table.infobox_v3, table.infobox")
    if not infobox:
        return None
    rows = infobox.find_all("tr")
    in_senior = False
    career = []
    for tr in rows:
        text = tr.get_text(" ", strip=True)
        if re.search(r"Parcours senior|Senior career", text):
            in_senior = True
            continue
        if re.search(r"Sélections|International career|Parcours junior|Youth career", text):
            if in_senior:
                break
            continue
        if in_senior:
            tds = tr.find_all("td")
            if len(tds) < 2:
                continue
            years = tds[0].get_text(" ", strip=True)
            club = tds[1].get_text(" ", strip=True).lstrip("→").strip()
            years = re.sub(r"\s*-\s*", "-", years)
            if re.match(r"^\d{4}(-\d{4})?-?$", years.replace(" ", "")) and club and club != "Club":
                career.append({"club": club, "years": years.replace(" ", "")})
    return career or None


def main():
    with open("data-research/players.json", encoding="utf-8") as f:
        players = json.load(f)["players"]

    targets = [p["name"] for p in players if len(p.get("career", [])) <= 1]
    print(f"{len(targets)} players with single-entry career")

    fixed = {}
    for i, name in enumerate(targets):
        career = wiki_career(name, "fr")
        if not career or len(career) <= 1:
            career = wiki_career(name.replace(" ", "_"), "en")
        if career and len(career) > 1:
            fixed[name] = career
            print(f"[{i+1}/{len(targets)}] {name} -> {len(career)} clubs")
        else:
            print(f"[{i+1}/{len(targets)}] {name} -> NOT FOUND")
        time.sleep(0.4)

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(fixed, f, ensure_ascii=False, indent=2)
    print(f"fixed {len(fixed)}/{len(targets)}")


if __name__ == "__main__":
    main()
