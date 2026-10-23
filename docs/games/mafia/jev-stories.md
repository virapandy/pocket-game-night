# Jev design check: mafia, text check

Run: 2026-10-23, budget `product`. Tool: `tests/tools/jev-design/run.ts --texts`. Source: column `text` of `games/mafia/stories.csv`. Findings only. One Jev answer per question (no repeats). Questions: (a) family-friendly; (b) understood by a mixed-region Indian family; (c) scary for a 7-year-old; (d) would get a laugh. Each has an "uncertain" option. Values are P(yes).

## Text check

- Rows asked: 26 of 26.
- **Flagged** (a or b under 0.5, or c over 0.5): MAFS-02, MAFS-06, MAFS-08, MAFS-09, MAFS-11, MAFS-12, MAFS-13, MAFS-15, MAFS-19, MAFS-20, MAFS-21, MAFS-22, MAFS-24.
- Unsure (top answer "uncertain" on any question): MAFS-04.
- Laugh (d) under 0.5 (not a flag): MAFS-01, MAFS-04, MAFS-10, MAFS-12, MAFS-25.

### Flagged rows

| ID | Text | (a) friendly | (b) understood | (c) scary | (d) laugh |
|---|---|---|---|---|---|
| MAFS-02 | The Mafia sent {NAME} on a very, very long auto ride. {NAME} is out. | 0.75 | 0.30 | 0.18 | 0.70 |
| MAFS-06 | The Mafia packed {NAME} into a suitcase and booked a train ticket. {NAME} is out. | 0.38 | 0.50 | 0.56 | 0.72 |
| MAFS-08 | The Mafia hid {NAME}'s slippers, then hid {NAME}. {NAME} is out. | 0.77 | 0.36 | 0.30 | 0.73 |
| MAFS-09 | {NAME} followed the smell of hot jalebis straight into a trap. {NAME} is out. | 0.98 | 0.44 | 0.03 | 0.88 |
| MAFS-11 | The Mafia gave {NAME} a ticket to watch a five-day cricket match. {NAME} is out. | 0.74 | 0.39 | 0.08 | 0.73 |
| MAFS-12 | {NAME} opened the door for the milkman. It wasn't the milkman. {NAME} is out. | 0.89 | 0.67 | 0.52 | 0.48 |
| MAFS-13 | The Mafia tied {NAME} to a very comfortable chair with a very long TV serial. {NAME} is out. | 0.80 | 0.16 | 0.08 | 0.88 |
| MAFS-15 | The Mafia sent {NAME} to the kitchen to wash every vessel in the house. {NAME} is out. | 0.77 | 0.49 | 0.10 | 0.81 |
| MAFS-19 | The Mafia slipped on a banana peel the Doctor left by the door. Nobody is out! | 0.97 | 0.40 | 0.01 | 0.84 |
| MAFS-20 | The Mafia rang the bell, but the Doctor said nobody was home. Nobody is out! | 0.93 | 0.36 | 0.15 | 0.64 |
| MAFS-21 | The Mafia had a plan. The Doctor had a better plan. Nobody is out! | 0.93 | 0.48 | 0.06 | 0.55 |
| MAFS-22 | The Mafia came with a sack, but the Doctor came with a bigger sack. Nobody is out! | 0.60 | 0.43 | 0.22 | 0.70 |
| MAFS-24 | The Mafia tiptoed in. The Doctor's pet dog had other ideas. Nobody is out! | 0.94 | 0.44 | 0.07 | 0.69 |

### All rows

| ID | (a) | (b) | (c) | (d) |
|---|---|---|---|---|
| MAFS-01 | 0.79 | 0.60 | 0.45 | 0.24 |
| MAFS-02 | 0.75 | 0.30 | 0.18 | 0.70 |
| MAFS-03 | 0.84 | 0.68 | 0.39 | 0.81 |
| MAFS-04 | 0.77 | 0.69 | 0.31 | 0.21 |
| MAFS-05 | 1.00 | 0.73 | 0.03 | 0.68 |
| MAFS-06 | 0.38 | 0.50 | 0.56 | 0.72 |
| MAFS-07 | 0.74 | 0.61 | 0.30 | 0.51 |
| MAFS-08 | 0.77 | 0.36 | 0.30 | 0.73 |
| MAFS-09 | 0.98 | 0.44 | 0.03 | 0.88 |
| MAFS-10 | 0.95 | 0.66 | 0.42 | 0.36 |
| MAFS-11 | 0.74 | 0.39 | 0.08 | 0.73 |
| MAFS-12 | 0.89 | 0.67 | 0.52 | 0.48 |
| MAFS-13 | 0.80 | 0.16 | 0.08 | 0.88 |
| MAFS-14 | 0.98 | 0.81 | 0.16 | 0.78 |
| MAFS-15 | 0.77 | 0.49 | 0.10 | 0.81 |
| MAFS-16 | 0.96 | 0.71 | 0.06 | 0.93 |
| MAFS-17 | 0.97 | 0.59 | 0.11 | 0.58 |
| MAFS-18 | 0.96 | 0.62 | 0.03 | 0.78 |
| MAFS-19 | 0.97 | 0.40 | 0.01 | 0.84 |
| MAFS-20 | 0.93 | 0.36 | 0.15 | 0.64 |
| MAFS-21 | 0.93 | 0.48 | 0.06 | 0.55 |
| MAFS-22 | 0.60 | 0.43 | 0.22 | 0.70 |
| MAFS-23 | 0.96 | 0.53 | 0.05 | 0.76 |
| MAFS-24 | 0.94 | 0.44 | 0.07 | 0.69 |
| MAFS-25 | 0.95 | 0.69 | 0.18 | 0.27 |
| MAFS-26 | 0.96 | 0.60 | 0.07 | 0.81 |

## Decisions used

- This run: 104 decisions, 26 calls.
- Product count this ISO week (2026-W43): 3792 before, 3896 after, of 15000.
- Shared count this ISO week: 5595 before, 5699 after, of 50000.
- Stopped early: no.
- Skipped: nothing.

## Tool faults (kept apart from findings)

- None: every call answered on the first try.
