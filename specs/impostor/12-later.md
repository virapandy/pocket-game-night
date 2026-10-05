# Later (designed, not in the first release)

Copied unchanged from `docs/games/impostor/scenarios.md` (version 3.8, 4 October 2026), the binding contract. Terms, Canonical strings and Test hooks: [README.md](README.md).

## IMP-200: Regional word themes
Status: approved as direction, owner, 2026-10-03 (built later)
Phase: Impostor later
Then Full Desi, Tamil, Telugu, Malayalam, Kannada and Bengali themes can be chosen, each with its own list

## IMP-201: Each player's own script
Status: approved as direction, owner, 2026-10-03 (built later)
Phase: Impostor later
Then on their own hold screen a player can switch the word's script; the choice is remembered for the evening

## IMP-202: Players' own phones (with connected mode)
Status: approved as direction, owner, 2026-10-03 (built later)
Phase: Impostor later
Then each player sees "Hold here to see your word" on their own phone; the host phone shows only room screens

## IMP-203: Twist rounds
Status: approved as direction, owner, 2026-10-03 (built later)
Phase: Impostor later
Then a rare optional twist: no impostor, or everyone an impostor, revealed at the end

## IMP-204: Undercover variant
Status: approved as direction, owner, 2026-10-03 (built later)
Phase: Impostor later
Then the impostor gets the word's close cousin instead of nothing, and may not know they are the impostor

## Note, 5 October (decision I27): the "left halfway" Players sheet
Detail of IMP-074, IMP-075 and IMP-078, as built: on the "left halfway" screen ▲ ▼ are hidden; ✕ on a player of the
half-played round takes them off in the sheet at once with the toast "Kabir left · Undo"; "Done" records `setPlayers`
only for names added; "Next round" then records one `dealAgainWithout {player}` for each player taken off (the last of
these is the fresh round), or `dealAgain` when nobody was taken off. "End game" from that screen before "Next round"
records nothing for those taken off, so the ended game still lists them; the summary's "Play again" leaves them out.
Two or more leavers after a round: one toast, "Kabir, Zoya left after this round".

