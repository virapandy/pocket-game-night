# Jev design check: mafia, text check

Run: 2026-10-23, budget `product`. Tool: `tests/tools/jev-design/run.ts --texts`. Source: column `text` of `games/mafia/stories.csv`. Findings only. One Jev answer per question (no repeats). Questions: (a) family-friendly; (b) understood by a mixed-region Indian family; (c) scary for a 7-year-old; (d) would get a laugh. Each has an "uncertain" option. Values are P(yes).

## Text check

- Rows asked: 24 of 24.
- **Flagged** (a or b under 0.5, or c over 0.5): MAFS-09, MAFS-11, MAFS-13, MAFS-15, MAFS-19, MAFS-22, MAFS-26.
- Unsure (top answer "uncertain" on any question): MAFS-10.
- Laugh (d) under 0.5 (not a flag): MAFS-01, MAFS-04, MAFS-10, MAFS-13, MAFS-20, MAFS-25.

### Flagged rows

| ID | Text | (a) friendly | (b) understood | (c) scary | (d) laugh |
|---|---|---|---|---|---|
| MAFS-09 | {NAME} followed the smell of hot jalebis straight into a trap. {NAME} is out. | 0.97 | 0.44 | 0.03 | 0.89 |
| MAFS-11 | The Mafia sent {NAME} to watch a very long cricket match. It still hasn't finished. {NAME} is out. | 0.75 | 0.47 | 0.14 | 0.90 |
| MAFS-13 | The Mafia sat {NAME} in front of a TV show that never ends. {NAME} is out. | 0.67 | 0.17 | 0.17 | 0.47 |
| MAFS-15 | The Mafia sent {NAME} to the kitchen to wash every vessel in the house. {NAME} is out. | 0.79 | 0.48 | 0.11 | 0.79 |
| MAFS-19 | The Mafia slipped on a banana peel the Doctor left by the door. Nobody is out! | 0.96 | 0.44 | 0.01 | 0.82 |
| MAFS-22 | The Mafia came with a sack, but the Doctor came with a bigger sack. Nobody is out! | 0.58 | 0.33 | 0.24 | 0.70 |
| MAFS-26 | The Mafia came for someone, but the Doctor sent them home with a lecture about sleep. Nobody is out! | 0.96 | 0.42 | 0.06 | 0.79 |

### All rows

| ID | (a) | (b) | (c) | (d) |
|---|---|---|---|---|
| MAFS-01 | 0.78 | 0.63 | 0.39 | 0.19 |
| MAFS-02 | 0.77 | 0.64 | 0.16 | 0.53 |
| MAFS-03 | 0.82 | 0.69 | 0.35 | 0.81 |
| MAFS-04 | 0.76 | 0.65 | 0.28 | 0.21 |
| MAFS-05 | 0.99 | 0.75 | 0.02 | 0.66 |
| MAFS-07 | 0.74 | 0.60 | 0.31 | 0.55 |
| MAFS-08 | 0.61 | 0.60 | 0.40 | 0.77 |
| MAFS-09 | 0.97 | 0.44 | 0.03 | 0.89 |
| MAFS-10 | 0.95 | 0.67 | 0.48 | 0.34 |
| MAFS-11 | 0.75 | 0.47 | 0.14 | 0.90 |
| MAFS-13 | 0.67 | 0.17 | 0.17 | 0.47 |
| MAFS-14 | 0.98 | 0.77 | 0.15 | 0.73 |
| MAFS-15 | 0.79 | 0.48 | 0.11 | 0.79 |
| MAFS-16 | 0.97 | 0.66 | 0.06 | 0.92 |
| MAFS-17 | 0.96 | 0.55 | 0.12 | 0.62 |
| MAFS-18 | 0.95 | 0.68 | 0.02 | 0.72 |
| MAFS-19 | 0.96 | 0.44 | 0.01 | 0.82 |
| MAFS-20 | 0.97 | 0.54 | 0.07 | 0.49 |
| MAFS-21 | 0.93 | 0.57 | 0.06 | 0.51 |
| MAFS-22 | 0.58 | 0.33 | 0.24 | 0.70 |
| MAFS-23 | 0.95 | 0.55 | 0.04 | 0.78 |
| MAFS-24 | 0.94 | 0.53 | 0.09 | 0.66 |
| MAFS-25 | 0.95 | 0.73 | 0.17 | 0.29 |
| MAFS-26 | 0.96 | 0.42 | 0.06 | 0.79 |

## Decisions used

- This run: 96 decisions, 24 calls.
- Product count this ISO week (2026-W43): 12111 before, 12207 after, of 15000.
- Shared count this ISO week: 13914 before, 14010 after, of 50000.
- Stopped early: no.
- Skipped: nothing.

## Tool faults (kept apart from findings)

- None: every call answered on the first try.
