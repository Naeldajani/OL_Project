# Gones Analytics — Olympique Lyonnais

Une reconstruction de l'application OL (thème sombre, sidebar, jeux et stats) : Momentum par saison, Meilleur XI, Pronostics 2026-27, Devine le Gone, Matchs & résultats.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- Recharts (graphiques)
- React Router

## Données

Les données réelles compilées se trouvent dans `data-research/` (JSON bruts + CSV de scraping, avec sources) et sont importées dans `src/data/*-real.json` pour l'app :

- `matches-real.json` — 1321 matchs OL depuis 2000, toutes compétitions (Ligue 1, Coupe de France, Coupe de la Ligue, C1, Europa League, Trophée des Champions), avec scores et ~3935 buts/buteurs
- `players-real.json` — 168 joueurs passés par l'OL (2000-2026) avec parcours de club et poste (`posteFr`, codes G/DC/DG/DD/MDC/MC/MOC/AD/AG/BU)
- `seasons-real.json` — bilan saison par saison en Ligue 1 (2000-01 à 2025-26)

Photos de joueurs/entraîneurs et logos de clubs sont de vraies images (Wikipedia/Wikidata), scrapées vers `public/images/` et référencées via `src/data/photo-manifest.ts` et `src/data/crest-manifest.ts`. Les entrées sans photo/logo disponible retombent sur un avatar/badge généré (initiales).

Les scripts de collecte sont dans `scraping/` (Python).

## Développement

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
