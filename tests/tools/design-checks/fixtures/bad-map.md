# Fixture map with deliberate faults

## A. Test

### A1. Home
*Words:* "Host a game"; main "Start". *Intentions:* help (menu). Menu: Settings.
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Host a game | A2 | — | SWD-001 |
| Broken button | P9 | — | |
| Nothing | | — | |

### A2. Dead end
*Words:* "Pick a spymaster"; main "End game"; main "Go". *Intentions:* none.
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Yes | same screen | `deal` | |
| Pad | map shown | — | SWD-002 |

### A3. Hidden secret
*Words:* "Your words (6 left)". *Intentions:* back, home. No menu.
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Back | A1 | — | SWD-001 |

### A4. Stuck
*Words:* "Stuck". No menu.
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Again | same screen | — | SWD-001 |
