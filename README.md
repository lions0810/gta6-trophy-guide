# Leonida Platinum — GTA VI Trophy Guide & Tracker

[![make.fun bounty](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/lions0810/gta6-trophy-guide/rank.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/lions0810/gta6-trophy-guide/reward.svg)](https://make.fun/c/gta6-trophy-guide-01)

An offline guide and tracker for all **55 PlayStation 5 trophies of Grand Theft Auto VI**
(1 platinum, 2 gold, 6 silver, 46 bronze), entered in the make.fun bounty
[gta6-trophy-guide-01](https://make.fun/c/gta6-trophy-guide-01).

## What it does

- **Checklist & tracker** — every trophy with its official name, description and grade;
  tick them off and progress is saved in the browser (localStorage), with export and
  import of your progress as a JSON file.
- **Filters & search** — by grade, by kind (story, strangers, collectibles, activities,
  exploration, crime, combat, economy, secret, completion), by earned / remaining /
  missable-only, and by free text. Press `/` anywhere to jump to the search box.
  The progress header always shows the earned count, a percentage, and per-grade counts.
- **Spoiler shield** — a setting that blurs story trophies' names and descriptions
  until you have earned them.
- **Roadmap to the platinum** — a five-stage path built from the official descriptions:
  story first (with the one missable stop flagged inside Chapter 1), then stranger
  strands, then the collectible / activity / economy sweeps, then secrets and the
  100% cleanup.
- **Missables page** — exactly one trophy is flagged potentially missable in the
  sources: *Positive Mental Attitude*. The page explains why and when to act.
- **Cited guides** — a guide to every trophy in this entry's own words, each naming
  its sources beside it. Official names, descriptions and grades come from the
  Exophase list, cross-checked against PSNProfiles; missable reporting is
  cross-checked against PowerPyx. A source is cited, never copied.

## Run it

```sh
node serve.ts            # serves app/ at http://localhost:8080
```

The app is plain static files under `app/` — any static file server works, and it
runs with the network off: it loads nothing from outside its own files.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the
output directory and writes `dossier.json` with the vendored
`vendor/makefun-frontend.ts` library, byte for byte as the scorer rebuilds it.

## Screenshots

`screenshots/` holds four real renders of the app taken by its maker with
`take-screenshots.mjs` (the entry's own CDP script over chrome-headless-shell):
the checklist with the missable guide open, the roadmap, the silver filter, and
the spoiler shield at work. `shots.json` records which view each file shows.

## Data

`app/data/trophies.json` holds the 55 trophies: official `name`, `description` and
`grade`, plus this entry's `kind`, `missable` flag, roadmap `stage`, original
`guide` text and its `source` for every trophy.

No Rockstar Games logo, artwork or screenshots are used; the neon-sunset
“Leonida” look is original CSS.

## License

MIT — see `LICENSE`.
