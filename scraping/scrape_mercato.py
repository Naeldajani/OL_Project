"""
Mercat'OL — arrivées et départs de l'OL, saison par saison.

Source : les tableaux « Mercato estival / hivernal » des articles
« Saison XXXX-XXXX de l'Olympique lyonnais » sur Wikipédia FR. Ce sont des
faits (qui, d'où, combien, à quel titre), donc librement reproductibles, et
ils sont maintenus à jour par les contributeurs à chaque officialisation.

Produit src/lugdunhome/data/mercato.json.

Usage:  python3 scraping/scrape_mercato.py [saison_de_depart]
"""

import json
import re
import sys
import time
from datetime import date
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "lugdunhome" / "data" / "mercato.json"
BIRTHDATES = ROOT / "data-research" / "csv" / "players_birthdates.csv"

API = "https://fr.wikipedia.org/w/api.php"
UA = "LugdunHome/1.0 (projet supporter non commercial; github Naeldajani/OL_Project)"

FIRST_SEASON = int(sys.argv[1]) if len(sys.argv) > 1 else 2015
LAST_SEASON = date.today().year if date.today().month >= 7 else date.today().year - 1


def get(params):
    for attempt in range(4):
        try:
            r = requests.get(API, params=params, headers={"User-Agent": UA}, timeout=40)
            if r.status_code == 200:
                return r.json()
        except requests.RequestException:
            pass
        time.sleep(1.5 * (attempt + 1))
    return {}


def clean(value: str) -> str:
    """Réduit le wikitexte à du texte lisible."""
    # Une cellule peut porter ses attributs avant une barre verticale
    # (`align="center" |Tyler Morton`) : sans ça, ils finissent dans le nom.
    head, sep, tail = value.partition("|")
    if sep and "=" in head and "[[" not in head:
        value = tail
    value = re.sub(r"<ref[^>]*>.*?</ref>|<ref[^>]*/>", "", value, flags=re.S)
    value = re.sub(r"\[\[Fichier:[^\]]*\]\]", "", value)
    # [[cible|libellé]] -> libellé ; [[page]] -> page
    value = re.sub(r"\[\[[^\]|]*\|([^\]]*)\]\]", r"\1", value)
    value = re.sub(r"\[\[([^\]]*)\]\]", r"\1", value)
    # {{FRA-d}} et autres drapeaux
    value = re.sub(r"\{\{[^{}]*\}\}", "", value)
    value = re.sub(r"<[^>]+>", "", value)
    value = value.replace("'''", "").replace("''", "")
    return re.sub(r"\s+", " ", value).strip(" |")


# Le champ « Transfert » mélange montant et nature de l'opération.
FREE = re.compile(r"libre|fin de contrat|gratuit|sans indemnit", re.I)
LOAN = re.compile(r"pr[êe]t", re.I)
END_LOAN = re.compile(r"fin de pr[êe]t|retour de pr[êe]t", re.I)
AMOUNT = re.compile(r"(\d+(?:[.,]\d+)?)\s*(M|k)\s*€", re.I)


def parse_deal(raw: str) -> dict:
    text = clean(raw)
    fee = None
    m = AMOUNT.search(text)
    if m:
        value = float(m.group(1).replace(",", "."))
        fee = value if m.group(2).upper() == "M" else value / 1000

    if END_LOAN.search(text):
        kind = "fin de prêt"
    elif LOAN.search(text):
        kind = "prêt"
    elif FREE.search(text):
        kind = "libre"
    elif fee is not None:
        kind = "transfert"
    else:
        kind = "indéterminé"
    return {"kind": kind, "fee": fee, "raw": text}


# Les tableaux ont changé de forme au fil des saisons : colonnes dans un
# ordre différent, montant tantôt fondu dans « Transfert » tantôt à part, et
# cellules séparées soit par un saut de ligne soit par « || » sur une seule
# ligne. On lit donc les en-têtes plutôt que de compter les colonnes.
HEADERS = {
    "nom": "name",
    "joueur": "name",
    "nationalite": "nationality",
    "poste": "position",
    "position": "position",
    "type de transfert": "kind_raw",
    "transfert": "deal",
    "montant": "amount",
    "provenancedestination": "club",
    "provenance": "club",
    "destination": "club",
    "division": "league",
}

# Le drapeau du pays est un modèle {{FRA-d}} : c'est souvent la seule trace
# de nationalité quand la colonne dédiée n'existe pas.
FLAG = re.compile(r"\{\{([A-Za-z]{2,3})-d\}\}")
COUNTRIES = {
    "FRA": "France", "ENG": "Angleterre", "ANG": "Angola", "BRA": "Brésil",
    "ESP": "Espagne", "POR": "Portugal", "ITA": "Italie", "GER": "Allemagne",
    "ALL": "Allemagne", "NED": "Pays-Bas", "BEL": "Belgique", "SUI": "Suisse",
    "USA": "États-Unis", "ARG": "Argentine", "CIV": "Côte d'Ivoire",
    "SEN": "Sénégal", "MLI": "Mali", "ALG": "Algérie", "MAR": "Maroc",
    "TUN": "Tunisie", "CMR": "Cameroun", "GHA": "Ghana", "NGA": "Nigeria",
    "COD": "RD Congo", "CGO": "Congo", "IRL": "Irlande", "SCO": "Écosse",
    "CZE": "Tchéquie", "SVK": "Slovaquie", "POL": "Pologne", "CRO": "Croatie",
    "SRB": "Serbie", "GEO": "Géorgie", "UKR": "Ukraine", "TUR": "Turquie",
    "DEN": "Danemark", "SWE": "Suède", "NOR": "Norvège", "AUT": "Autriche",
    "JPN": "Japon", "KOR": "Corée du Sud", "AUS": "Australie", "CAN": "Canada",
    "MEX": "Mexique", "COL": "Colombie", "URU": "Uruguay", "CHI": "Chili",
    "PAR": "Paraguay", "GUI": "Guinée", "BFA": "Burkina Faso", "GAB": "Gabon",
    "COM": "Comores", "MAD": "Madagascar", "HAI": "Haïti", "ISR": "Israël",
}


def normalize_header(raw: str) -> str:
    txt = clean(raw.lstrip("!").strip())
    txt = txt.split("|")[-1].strip().lower()
    txt = txt.replace("/", "").replace("-", "").replace("’", "'")
    txt = "".join(c for c in txt.replace("é", "e").replace("è", "e") if c.isalnum() or c == " ")
    return txt.strip()


def split_cells(block: str) -> list[str]:
    cells: list[str] = []
    for line in block.split("\n|"):
        line = line.strip()
        if not line or line.startswith("+") or line.startswith("-"):
            continue
        # une ligne peut porter toutes les colonnes, séparées par ||
        cells.extend(part.strip() for part in line.split("||"))
    return cells


def parse_table(wikitext: str, season: str, window: str) -> list[dict]:
    rows, direction, columns = [], None, []

    for block in wikitext.split("\n|-"):
        heads = re.findall(r"^!\s*(.+)$", block, re.M)
        if heads:
            found = [HEADERS.get(normalize_header(h)) for h in heads]
            if any(found):
                columns = found
            continue

        # les séparateurs Arrivées / Départs sont des lignes fusionnées
        if re.search(r"colspan=.*Arriv", block, re.S):
            direction = "arrivee"
            continue
        if re.search(r"colspan=.*(Départ|Depart)", block, re.S):
            direction = "depart"
            continue
        if direction is None or not columns:
            continue

        cells = split_cells(block)
        if len(cells) < 4:
            continue

        record: dict[str, str] = {}
        flag = ""
        for column, cell in zip(columns, cells):
            if not flag:
                m = FLAG.search(cell)
                if m:
                    flag = m.group(1).upper()
            if column:
                record[column] = cell

        name = clean(record.get("name", ""))
        if not name or len(name) < 3:
            continue

        deal = parse_deal(" ".join(filter(None, (record.get("deal"), record.get("kind_raw"), record.get("amount")))))
        nationality = clean(record.get("nationality", "")) or COUNTRIES.get(flag, flag)

        rows.append(
            {
                "name": name,
                "nationality": nationality,
                "position": clean(record.get("position", "")),
                "club": clean(record.get("club", "")),
                "league": clean(record.get("league", "")),
                "direction": direction,
                "season": season,
                "window": window,
                **deal,
            }
        )
    return rows


def birthdates() -> dict[str, str]:
    if not BIRTHDATES.exists():
        return {}
    import csv

    out = {}
    for r in csv.DictReader(BIRTHDATES.open(encoding="utf-8")):
        if r.get("birthdate"):
            out[r["name"]] = r["birthdate"]
    return out


def age_on(birth: str, season: str) -> int | None:
    """Âge au 1er juillet de la saison — l'âge du jour vieillirait les
    transferts anciens à chaque build."""
    try:
        by, bm, bd = (int(x) for x in birth.split("-")[:3])
    except (ValueError, AttributeError):
        return None
    year = int(season.split("-")[0])
    age = year - by
    if (7, 1) < (bm, bd):
        age -= 1
    return age if 14 < age < 50 else None


def main() -> int:
    births = birthdates()
    deals = []

    for start in range(FIRST_SEASON, LAST_SEASON + 1):
        season = f"{start}-{start + 1}"
        page = f"Saison {season} de l'Olympique lyonnais"
        meta = get({"action": "parse", "page": page, "prop": "sections", "format": "json"})
        if "parse" not in meta:
            print(f"  {season}: page absente")
            continue

        # On prend la section « Transferts » entière : selon les saisons, le
        # tableau est posé sous la section parente ou sous l'une de ses
        # sous-sections, et les récupérer séparément dupliquerait les lignes.
        parent = next(
            (s for s in meta["parse"]["sections"] if re.fullmatch(r"transferts?", s["line"], re.I)),
            None,
        )
        if parent is None:
            print(f"  {season}: pas de section Transferts")
            continue

        body = get(
            {
                "action": "parse",
                "page": page,
                "prop": "wikitext",
                "section": parent["index"],
                "format": "json",
            }
        )
        if "parse" not in body:
            print(f"  {season}: section illisible")
            continue

        wikitext = body["parse"]["wikitext"]["*"]
        found = 0
        # découpe par fenêtre de mercato ; le premier morceau précède tout
        # sous-titre et se rattache donc à l'été
        chunks = re.split(r"\n=+\s*([^=\n]+?)\s*=+\n", wikitext)
        windows = [("été", chunks[0])] + [
            ("hiver" if re.search(r"hiver", chunks[i], re.I) else "été", chunks[i + 1])
            for i in range(1, len(chunks) - 1, 2)
        ]
        for window, text in windows:
            rows = parse_table(text, season, window)
            deals.extend(rows)
            found += len(rows)
        print(f"  {season}: {found} mouvements")
        time.sleep(0.4)

    for d in deals:
        birth = births.get(d["name"])
        d["age"] = age_on(birth, d["season"]) if birth else None

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps(
            {
                "updatedAt": date.today().isoformat(),
                "seasons": sorted({d["season"] for d in deals}, reverse=True),
                "deals": deals,
            },
            ensure_ascii=False,
            indent=1,
        )
        + "\n",
        encoding="utf-8",
    )
    arrivals = sum(1 for d in deals if d["direction"] == "arrivee")
    print(f"\n→ {OUT.relative_to(ROOT)} : {len(deals)} mouvements "
          f"({arrivals} arrivées, {len(deals) - arrivals} départs)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
