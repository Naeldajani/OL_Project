# Gones Analytics — Olympique Lyonnais

Une reconstruction de l'application OL (thème sombre, sidebar, jeux et stats) : Momentum par saison, Meilleur XI, Pronostics 2026-27, Devine le Gone, Matchs & résultats.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- Recharts (graphiques)
- React Router

## Données

Les données réelles compilées se trouvent dans `data-research/` (bruts, avec sources et notes de fiabilité) et sont importées dans `src/data/*-real.json` pour l'app :

- `matches.json` — matchs européens, finales de coupes, quelques matchs de Ligue 1 confirmés (69 matchs vérifiés)
- `players.json` — 168 joueurs passés par l'OL (2000-2026) avec parcours de club
- `seasons.json` — bilan saison par saison en Ligue 1 (2000-01 à 2025-26)

Certaines données récentes (2023-26) restent partielles : les champs non confirmés sont marqués plutôt qu'inventés (voir `_dataQualityNotes` dans `seasons.json`).

Les logos de clubs sont générés (pas de vraies images de tiers), et les joueurs utilisent des avatars stylés (pas de vraies photos, pour des raisons de droits d'image).

## Développement

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
