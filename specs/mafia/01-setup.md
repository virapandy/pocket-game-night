# 01-setup.md: Setup (C1/C2)

Copied from `docs/games/mafia/scenarios.md` (version 1.1, approved by the owner 25 October 2026, decision MF18), the binding contract. Each scenario's paragraph headed "Version 1.1" is that file's two-reader item, copied word for word; it wins over the text above it. Terms, canonical strings, screen IDs, properties and test hooks: [README.md](README.md). Rule API for the tests: [api.md](api.md).

## MAF-001: Picking Mafia
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
Home's "Host a game" line lists Mafia **after What Am I?** (titles joined with ", " and " or " before the last). The picker shows
the Mafia card (Canonical strings) **after the What Am I? card**, all cards equal in width and height (±1 px). Tapping it opens
"Who's playing?"; with an unfinished Mafia game night, the shared Start new dialog (as SWD-115) opens instead: "Start new (ends
that one)" records `endEvening` for it and opens "Who's playing?"; "Carry on that one" resumes it (MAF-091).

**Version 1.1** (item 30): **MAF-001:** the test asserts the Host a game line ends "What Am I? or Mafia on this phone" while Mafia is the last game.

## MAF-002: Who's playing?
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
Impostor's names screen (IMP-003, seat order, no dragging) with: tonight's names filled in in their last order (IMP-004); a
counter small line "9 players" ("1 player" / "2 players"); "Next" disabled with fewer than 5 names, and "Mafia needs at least 5
players." shown below the list whenever that is true; a 17th name shows "Up to 16 players." and adds nothing. ✕ removes a name
with the toast "Kabir removed · Undo". Every Enter adds its name and keeps the field focused (as SWD-132). Names are 1–16
characters after trimming; the duplicate message as IMP-003. There is **no "First time" tick** (MF14). Small text link "How to
play" → MAF-006; quiet "← Back" → the picker; "Next" → Roles.

**Version 1.1** (item 28): **MAF-002:** after a refused 17th name the field keeps the text; "Up to 16 players." and "Mafia needs at least 5 players." are `role="alert"`. **MAF-061:** S1 opened from G1 shows "← Back to the game" in place of "← Back".

## MAF-003: Roles
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
h1 "Roles for N players". Line "Mafia: M" between "−" (accessible name "Fewer Mafia") and "+" ("More Mafia"), each 48 × 48 px;
under it "We suggest S for N players." (S = suggested count). Lines "Doctor: 1", "Police: 1", "Villagers: V" (V = N − M − 2),
text only. With N = 5: no Doctor or Police lines; instead "With 5 players: 1 Mafia and 4 Villagers. Doctor and Police join at
6." and V = N − M.
**The Mafia count** starts at S every time this screen opens with a changed N, else at the value last set for this game night.
"−" is disabled when M = S − 1 or M = 1. "+" is disabled when M = S + 1, or when M + 1 ≥ (N − (M + 1)) − 1 (one more Mafia would
make them equal the rest after night 1); so at N = 5 "+" is always disabled. Worked values: N = 9, S = 2: M may be 1, 2 or 3;
N = 6, S = 1: M = 1 or 2 (2 Mafia face 3 after night 1 and 2 < 3, so the game goes on); N = 5, S = 1: M = 1 only (2 Mafia would
face 2 after night 1: 2 ≥ 2); N = 16, S = 4: M = 3, 4 or 5.
Rules box (body text, 1 px border, 12 px padding), one line each: "Night comes first." · "The Doctor can protect themselves once a
game, never the same person two nights running." · "The Police learns only Mafia or Not Mafia." · "A tie: point again once,
then nobody is out." · "A player who goes out shows their role."
Small text link "How to play" → MAF-006; quiet "← Back" → Who's playing? (names kept; M kept unless N changes); main "Give
everyone a role" → MAF-004.

**Version 1.1** (item 27): **MAF-003:** M resets to S when S2 opens with N different from the N it had when M was last set tonight; at N = 5, "−" and "+" are shown disabled and "We suggest 1 for 5 players." shows.

## MAF-004: Starting a game
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
"Give everyone a role" records `start { players, mafiaCount }` and deals (MAF-010). When this is the first Mafia game of tonight it
opens Read this aloud (MAF-005), otherwise the first deal pass screen (MAF-010).

## MAF-005: Read this aloud
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
The card reads: "M of us are secretly the Mafia. Everyone else is the Village. At night we pass the phone round and everyone does
the same thing, so nobody can tell who is who. Each morning the phone tells us what happened, then we talk and vote someone out.
The Village wins by finding every Mafia. The Mafia win when they are as many as everyone else." ("1 of us is secretly the Mafia"
when M = 1; M as a digit.) Fits without scrolling at every size with Larger text off. Main "Pass the phone round" → the first
deal pass screen; quiet "← Back" → Roles with **the deal undone** (`start` removed; S1–S3 unchanged); small text link "How to
play" → MAF-006 → back here.

## MAF-006: How to play
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
Opened from S1, S2, S3 and the menu. h1 "How to play"; the seven steps of `guide.md` "How to play", in short lines; the rules box
of MAF-003; and the line "Saw someone's screen? Keep it to yourself and carry on. Before the first night, Deal again instead."
(MF15). It never names a player or a role holder (as IMP-072). Main "Done" → the screen it was opened from, unchanged.

**Version 1.4 (product owner, 26 October; owner away)** (item 7; class C1): How to play gains one line (`mf.s4.4`): **"Need to stop during someone's turn? Let them finish, or close the app: the game is saved."** The rest of item 7 is no change: no Home on the role card, the night job and the countdown is kept by design (MAF-055). Tests: `tests/browser/mafia-v14.spec.ts`.
