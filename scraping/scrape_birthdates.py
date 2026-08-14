#!/usr/bin/env python3
"""Fetch player birth dates (Wikidata P569) for age display in Devine le Gone.
Primary: one SPARQL query for the whole OL squad (P54=Q704).
Fallback: per-player Wikidata search for anyone missing.
"""
import csv
import json
import time
from common import get, wikidata_sparql

OUT = "data-research/csv/players_birthdates.csv"


def squad_birthdates():
    query = """
    SELECT ?personLabel ?dob WHERE {
      ?person wdt:P54 wd:Q704 .
      OPTIONAL { ?person wdt:P569 ?dob }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en". }
    }
    """
    rows = wikidata_sparql(query)
    out = {}
    for row in rows:
        name = row["personLabel"]["value"]
        dob = row.get("dob", {}).get("value")
        if dob and name not in out:
            out[name] = dob[:10]
    return out


def search_birthdate(name):
    r = get("https://www.wikidata.org/w/api.php", params={
        "action": "wbsearchentities", "search": name, "language": "fr",
        "format": "json", "limit": 5, "type": "item",
    })
    if not r:
        return None
    for item in r.json().get("search", []):
        desc = (item.get("description") or "").lower()
        if not any(k in desc for k in ["football", "footballeur", "soccer"]):
            continue
        qid = item["id"]
        rows = wikidata_sparql(f"SELECT ?dob WHERE {{ wd:{qid} wdt:P569 ?dob . }}")
        if rows:
            return rows[0]["dob"]["value"][:10]
    return None


def main():
    with open("data-research/players.json", encoding="utf-8") as f:
        players = json.load(f)["players"]

    squad = squad_birthdates()
    print(f"{len(squad)} birthdates from OL squad SPARQL")

    done = {}
    try:
        with open(OUT, encoding="utf-8") as f:
            for row in csv.DictReader(f):
                if row["birthdate"]:
                    done[row["name"]] = row["birthdate"]
    except FileNotFoundError:
        pass

    with open(OUT, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["name", "birthdate"])
        w.writeheader()
        for i, p in enumerate(players):
            name = p["name"]
            bd = done.get(name) or squad.get(name)
            if not bd:
                bd = search_birthdate(name)
                time.sleep(0.3)
            w.writerow({"name": name, "birthdate": bd or ""})
            print(f"[{i+1}/{len(players)}] {name} -> {bd or 'NOT FOUND'}", flush=True)


if __name__ == "__main__":
    main()
