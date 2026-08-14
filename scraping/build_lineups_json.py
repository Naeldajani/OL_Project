#!/usr/bin/env python3
"""Turn the scraped match_lineups.csv into a compact JSON the app imports."""
import csv
import json
from collections import defaultdict

rows = list(csv.DictReader(open("data-research/csv/match_lineups.csv", encoding="utf-8")))
by_match = defaultdict(lambda: {"ol": [], "adv": [], "coach": "", "advCoach": ""})

for r in rows:
    entry = by_match[r["match_id"]]
    if r["role"] == "manager":
        if r["side"] == "ol":
            entry["coach"] = r["player"]
        else:
            entry["advCoach"] = r["player"]
        continue
    entry[r["side"]].append({
        "player": r["player"],
        "role": r["role"],
        "shirt": r["shirt"],
        "position": r["position"],
        "nationality": r["nationality"],
    })

out = {mid: v for mid, v in by_match.items() if v["ol"]}
with open("src/lugdunhome/data/lineups.json", "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))

print(f"{len(out)} matches with an OL lineup")
