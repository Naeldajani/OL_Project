#!/usr/bin/env python3
"""Remap OL players' position/subPosition to French position codes:
G, DC, DG, DD, MDC, MC, MOC, AD, AG, BU
Writes data-research/csv/players_positions.csv
"""
import json
import csv

with open("data-research/players.json", encoding="utf-8") as f:
    data = json.load(f)
players = data["players"]

# Base mapping for unambiguous (position, subPosition) pairs
BASE = {
    ("Goalkeeper", "Goalkeeper"): "G",
    ("Defender", "Centre-Back"): "DC",
    ("Defender", "Left-Back"): "DG",
    ("Defender", "Right-Back"): "DD",
    ("Midfielder", "Defensive Midfielder"): "MDC",
    ("Midfielder", "Central Midfielder"): "MC",
    ("Midfielder", "Attacking Midfielder"): "MOC",
    ("Forward", "Attacking Midfielder"): "MOC",
    ("Forward", "Striker"): "BU",
    ("Forward", "Left Winger"): "AG",
    ("Forward", "Right Winger"): "AD",
}

# Side-dependent cases (Winger / Full-Back with no side specified) resolved
# from known preferred foot/side (best-effort, football knowledge).
SIDE_OVERRIDE = {
    "Michel Bastos": "AG",
    "Kader Keïta": "AD",
    "Sylvain Vairelles": "AD",
    "Florent Malouda": "AG",
    "Sidney Govou": "AD",
    "Sylvain Wiltord": "AG",
    "Bertrand Traoré": "AD",
    "Martin Terrier": "AG",
    "Karl Toko Ekambi": "AG",
    "Bradley Barcola": "AG",
    "Malick Fofana": "AD",
    "Ernest Nuamah": "AD",
    "Saïd Benrahma": "AG",
    "Afonso Moreira": "AD",
    "Anthony Mounier": "AD",
    "Yassine Benzia": "AG",
    "Clinton N'Jie": "AD",
    "Tetê": "AD",
    "Christophe Delmotte": "DD",
}

rows = []
unresolved = []
for p in players:
    name = p["name"]
    pos, sub = p.get("position"), p.get("subPosition")
    code = BASE.get((pos, sub))
    estimated = False
    if code is None:
        if name in SIDE_OVERRIDE:
            code = SIDE_OVERRIDE[name]
            estimated = True
        else:
            unresolved.append(name)
            code = ""
    rows.append({
        "name": name,
        "position_en": pos,
        "subPosition_en": sub,
        "poste_fr": code,
        "estimated_side": "oui" if estimated else "non",
    })

with open("data-research/csv/players_positions.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=["name", "position_en", "subPosition_en", "poste_fr", "estimated_side"])
    w.writeheader()
    w.writerows(rows)

print(f"{len(rows)} joueurs, {len(unresolved)} non résolus: {unresolved}")
