#!/usr/bin/env python3
"""Compose match_lineups.csv et match_subs.csv en un JSON compact.

Le rôle « banc » ne dit pas si le joueur est entré : noter un remplaçant
resté assis n'aurait aucun sens. Les remplacements relevés sur la feuille de
match distinguent donc « entré » du reste du banc, et portent la minute.
"""
import csv
import json
import os
from collections import defaultdict

rows = list(csv.DictReader(open("data-research/csv/match_lineups.csv", encoding="utf-8")))

SUBS = "data-research/csv/match_subs.csv"
came_on = defaultdict(dict)   # match_id -> {joueur: minute}
went_off = defaultdict(dict)
if os.path.exists(SUBS):
    for r in csv.DictReader(open(SUBS, encoding="utf-8")):
        if r["side"] != "ol":
            continue
        came_on[r["match_id"]][r["player_in"]] = r["minute"]
        went_off[r["match_id"]][r["player_out"]] = r["minute"]
by_match = defaultdict(lambda: {"ol": [], "adv": [], "coach": "", "advCoach": ""})

for r in rows:
    entry = by_match[r["match_id"]]
    if r["role"] == "manager":
        if r["side"] == "ol":
            entry["coach"] = r["player"]
        else:
            entry["advCoach"] = r["player"]
        continue
    role = r["role"]
    minute = ""
    if r["side"] == "ol":
        if role == "banc" and r["player"] in came_on[r["match_id"]]:
            role = "entre"
            minute = came_on[r["match_id"]][r["player"]]
        elif role == "titulaire" and r["player"] in went_off[r["match_id"]]:
            minute = went_off[r["match_id"]][r["player"]]
    entry[r["side"]].append({
        "player": r["player"],
        "role": role,
        "shirt": r["shirt"],
        "position": r["position"],
        "nationality": r["nationality"],
        **({"minute": minute} if minute else {}),
    })

out = {mid: v for mid, v in by_match.items() if v["ol"]}
with open("src/lugdunhome/data/lineups.json", "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))

entered = sum(1 for v in out.values() for p in v["ol"] if p["role"] == "entre")
print(f"{len(out)} matchs avec une composition OL, {entered} entrées en jeu")
