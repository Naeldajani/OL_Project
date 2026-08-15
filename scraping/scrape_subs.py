#!/usr/bin/env python3
"""Remplacements par match : qui est entré, qui est sorti, à quelle minute.

Les compositions récupérées jusqu'ici distinguaient seulement « titulaire »
et « banc ». Or noter un remplaçant resté sur le banc n'a aucun sens : il
faut savoir qui est réellement entré en jeu.

Reprend la page « feuille de match » de Transfermarkt, bloc Remplacements.
Reprise possible : les match_id déjà traités sont sautés.
"""
import csv
import os
import re
import sys
import time

from bs4 import BeautifulSoup

from common import get

LINEUPS = "data-research/csv/match_lineups.csv"
OUT = "data-research/csv/match_subs.csv"
FIELDS = ["match_id", "side", "minute", "player_in", "player_out", "reason"]


def known_matches():
    """Les matchs dont on a déjà la composition — les seuls qui nous servent."""
    ids, ol_squad = [], {}
    with open(LINEUPS, encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            mid = row["match_id"]
            if mid not in ol_squad:
                ol_squad[mid] = set()
                ids.append(mid)
            if row["side"] == "ol":
                ol_squad[mid].add(row["player"])
    return ids, ol_squad


def done_matches():
    if not os.path.exists(OUT):
        return set()
    with open(OUT, encoding="utf-8") as fh:
        return {row["match_id"] for row in csv.DictReader(fh)}


def read_minute(action):
    """La minute n'est pas écrite : c'est une image de chiffres découpée dans
    une planche de sprites, et seule la position du découpage la porte. Les
    cases font 36 px, la colonne donne les unités et la ligne les dizaines."""
    clock = action.select_one(".sb-aktion-uhr span")
    if clock is None:
        return ""
    # certains matchs affichent quand même le texte : on le préfère
    text = action.select_one(".sb-aktion-uhr")
    if text:
        m = re.search(r"(\d{1,3})", text.get_text(strip=True))
        if m:
            return m.group(1)

    style = clock.get("style", "")
    m = re.search(r"background-position:\s*(-?\d+)px\s+(-?\d+)px", style)
    if not m:
        return ""
    units = abs(int(m.group(1))) // 36
    tens = abs(int(m.group(2))) // 36
    minute = tens * 10 + units
    return str(minute) if 1 <= minute <= 120 else ""


def parse(match_id, ol_players):
    url = f"https://www.transfermarkt.fr/spielbericht/index/spielbericht/{match_id}"
    r = get(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    if not r or r.status_code != 200:
        return None

    soup = BeautifulSoup(r.text, "lxml")
    box = next(
        (
            b
            for b in soup.select("div.box")
            if b.select_one("h2") and "emplacement" in b.select_one("h2").get_text()
        ),
        None,
    )
    if box is None:
        return []

    rows = []
    for action in box.select("div.sb-aktion"):
        incoming = action.select_one(".sb-aktion-wechsel-ein a.wichtig")
        outgoing = action.select_one(".sb-aktion-wechsel-aus a.wichtig")
        if not incoming or not outgoing:
            continue
        player_in = incoming.get_text(strip=True)
        player_out = outgoing.get_text(strip=True)

        minute = read_minute(action)

        reason_el = action.select_one(".sb-aktion-wechsel-aus .hide-for-small")
        reason = reason_el.get_text(strip=True).lstrip(", ") if reason_el else ""

        # Le camp ne se lit pas de façon fiable dans le balisage : on le déduit
        # de la composition déjà connue, qui fait autorité.
        side = "ol" if (player_in in ol_players or player_out in ol_players) else "adv"

        rows.append(
            {
                "match_id": match_id,
                "side": side,
                "minute": minute,
                "player_in": player_in,
                "player_out": player_out,
                "reason": reason,
            }
        )
    return rows


def main():
    ids, squads = known_matches()
    already = done_matches()
    todo = [i for i in ids if i not in already]
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else len(todo)
    todo = todo[:limit]
    print(f"{len(todo)} matchs à traiter ({len(already)} déjà faits)")

    fresh = not os.path.exists(OUT)
    with open(OUT, "a", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=FIELDS)
        if fresh:
            writer.writeheader()

        failures = 0
        for i, match_id in enumerate(todo, 1):
            rows = parse(match_id, squads.get(match_id, set()))
            if rows is None:
                failures += 1
                print(f"  [{i}/{len(todo)}] {match_id}: échec")
                if failures > 20:
                    print("Trop d'échecs consécutifs, arrêt.")
                    break
                time.sleep(4)
                continue
            failures = 0
            writer.writerows(rows)
            fh.flush()
            if i % 20 == 0 or i == len(todo):
                print(f"  [{i}/{len(todo)}] {match_id}: {len(rows)} remplacements")
            time.sleep(1.2)

    print(f"→ {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
