# Rhyme scenario changes, 29 September 2026 (owner-approved)

The rhyme catalog now follows the owner's rule (every call rhymes with its number or links to it through
popular culture or common knowledge; nothing niche). Failing Hindi lines were cut, so 35 numbers have no
Hindi rhyme. For the tester to apply in `specs/tambola/11-rhymes.md`, then the coder to rebuild
`content/tambola/rhymes.json` from `docs/games/tambola/rhymes.csv` (361 rhymes).

**Change TAM-150** to:
> ## TAM-150: Every number has several rhymes
> Then every number from 1 to 90 has at least 3 rhymes in English, at least 2 of them family-friendly
> And every number has at least 1 family-friendly English rhyme with an Indian reference (TAM-158)
> And Hindi rhymes exist for most numbers, but not necessarily all (55 of 90 today)

**Change TAM-153** to:
> ## TAM-153: The host chooses the rhyme language
> When the host sets rhymes to English, Hindi, or Both
> Then only rhymes in the chosen language(s) are picked
> And with Both, either language can come up on any call
> And with Hindi, a number that has no Hindi rhyme shows one of its family-friendly English rhymes with an
> Indian reference instead (never the number alone, unless it has no rhyme at all, TAM-015)

TAM-151, TAM-152, TAM-154 to TAM-158 are unchanged.
