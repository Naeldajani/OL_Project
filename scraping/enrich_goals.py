"""
Ajoute aux buts de src/data/matches-real.json ce que le CSV des buteurs
contient déjà mais que le JSON avait laissé de côté : le passeur décisif et
la manière dont le but a été marqué (tête, penalty, contre son camp, pied).

C'est ce qui permet des questions bonus indépendantes du score : prédire
2-1 ne dit rien de qui marque, ni comment.

Usage:  python3 scraping/enrich_goals.py
"""

import csv
import json
import re
import unicodedata
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "data-research" / "csv" / "matches_scorers.csv"
JSON_PATH = ROOT / "src" / "data" / "matches-real.json"


def norm(s: str) -> str:
    s = unicodedata.normalize("NFD", s or "")
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "", s.lower())


def how(detail: str) -> str:
    """Une seule étiquette par but, la plus parlante d'abord : un penalty de
    la tête n'existe pas, mais « Tête » et « pied droit » cohabitent."""
    if re.search(r"contre-son-camp", detail, re.I):
        return "csc"
    if re.search(r"penalty", detail, re.I):
        return "penalty"
    if re.search(r"t[êe]te", detail, re.I):
        return "tete"
    if re.search(r"pied gauche", detail, re.I):
        return "gauche"
    if re.search(r"pied droit", detail, re.I):
        return "droit"
    return "autre"


def main() -> int:
    extras: dict[str, list[dict]] = defaultdict(list)
    for row in csv.DictReader(CSV_PATH.open(encoding="utf-8")):
        extras[row["match_id"]].append(
            {
                "player": row["scorer"],
                "assist": (row.get("assist") or "").strip() or None,
                "how": how(row.get("detail", "")),
            }
        )

    data = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    enriched = missed = 0

    for match in data["matches"]:
        pool = extras.get(match["id"], [])
        # index par joueur : l'ordre des buts est le même des deux côtés,
        # mais un doublon de nom rendrait un appariement positionnel faux
        by_player: dict[str, list[dict]] = defaultdict(list)
        for e in pool:
            by_player[norm(e["player"])].append(e)

        for goal in match.get("scorers", []):
            candidates = by_player.get(norm(goal["player"]))
            if candidates:
                extra = candidates.pop(0)
                goal["assist"] = extra["assist"]
                goal["how"] = extra["how"]
                enriched += 1
            else:
                missed += 1

    JSON_PATH.write_text(
        json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8"
    )
    total = enriched + missed
    print(f"{enriched}/{total} buts enrichis ({missed} sans correspondance)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
