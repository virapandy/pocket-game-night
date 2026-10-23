# Jev design check: what-am-i

Run: 2026-10-23, budget `product`. Tool: `tests/tools/jev-design/run.ts`. Findings only: nothing in the source files was changed. Bands: above 0.8 clear, 0.5 to 0.8 report, below 0.5 or "uncertain" unsure. Every probability is one Jev answer per question (no repeats), so a value near a band edge may move on a re-run.

## Screen map

- Screens parsed: 14; asked: 12; not asked (fewer than 2 buttons in a table, or beyond --screens): A1, S4.
- **Flagged** (Jev's likeliest button is not the main button, P above 0.8): none.
- **Report band** (not the main button, P 0.5 to 0.8): none.
- **Jev unsure**: S1, S2, T1, T0, T3, G1.
- **Way out not visible** (P yes below 0.5): A2 0.15; T1 0.03; T0 0.39; T2 0.35.
- **Purpose not clearly clear** (P yes below 0.8): A2 0.76; T1 0.77; T2 0.53; T3 0.24; G2 0.71.
- **Labels below 0.5:** 35 of 88. Labels 0.5 to 0.8: 43.
- Main button = the map's `main "..."` wording in a screen's Words line; screens without it are not judged against a main button. Buttons = the first column of each screen's tables (menu items included if the map lists them).

### Persona disagreements (likeliest button differs from the main button)

- S1: grandparent: How to play (0.77); first-time host: How to play (0.84); one-hand host: ← Back (0.32); new guest: How to play (0.54)
- S2: grandparent: How to play (0.60); child: ← Back (0.31); first-time host: How to play (0.94); one-hand host: ← Back (0.51); new guest: How to play (0.85)
- T1: grandparent: Not Riya? Someone else first (0.44); one-hand host: Pause / Menu (0.38); uncle: Not Riya? Someone else first (0.47); new guest: Not Riya? Someone else first (0.60)
- T0: grandparent: Tap only (0.88); child: Tap only (0.54); one-hand host: Tap only (0.81); new guest: Tap only (0.60)
- R1: new guest: ← Home (0.57)
- G1: grandparent: ← Home (0.35); first-time host: ← Home (0.30); new guest: ← Home (0.53)

### Per screen

### A2. What shall we play? (new card)

Main button: (none found). Buttons: What Am I? card, nothing unfinished · What Am I? card, a game night unfinished.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| What Am I? card, nothing unfinished | 0.87 | clear | n/a | no main button found in the map (not judged) | 0.15 | 0.76 | none |

### S1. Who's playing?

Main button: Next. Buttons: Add / Enter · ✕ · Drag a name · How to play · ← Back · Next.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Next | 0.49 | unsure | 0.49 | Jev unsure | 0.95 | 0.99 | grandparent: How to play (0.77); first-time host: How to play (0.84); one-hand host: ← Back (0.32); new guest: How to play (0.54) |

### S2. Words and time

Main button: Start. Buttons: a pack / a length / a switch · How to play · ← Back · Start.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| How to play | 0.42 | unsure | 0.07 | Jev unsure | 0.90 | 0.81 | grandparent: How to play (0.60); child: ← Back (0.31); first-time host: How to play (0.94); one-hand host: ← Back (0.51); new guest: How to play (0.85) |

### S3. Read this aloud (first game of the night)

Main button: First turn. Buttons: First turn · ← Back · How to play.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| First turn | 0.98 | clear | 0.98 | no | 0.89 | 0.98 | none |

### T1. Pass screen ("Riya, you're guessing")

Main button: I'm ready. Buttons: I'm ready · Not Riya? Someone else first · Pause / Menu.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Not Riya? Someone else first | 0.41 | unsure | 0.40 | Jev unsure | 0.03 | 0.77 | grandparent: Not Riya? Someone else first (0.44); one-hand host: Pause / Menu (0.38); uncle: Not Riya? Someone else first (0.47); new guest: Not Riya? Someone else first (0.60) |

### T0. Tilt or tap? (once per phone, only where the phone asks for motion permission)

Main button: Allow tilt. Buttons: Allow tilt · Tap only.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Allow tilt | 0.48 | unsure | 0.48 | Jev unsure | 0.39 | 0.93 | grandparent: Tap only (0.88); child: Tap only (0.54); one-hand host: Tap only (0.81); new guest: Tap only (0.60) |

### T2. Get ready (countdown)

Main button: (none found). Buttons: countdown ends · Pause.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| countdown ends | 0.70 | report | n/a | no main button found in the map (not judged) | 0.35 | 0.53 | none |

### T3. The word (room-facing, sideways)

Main button: (none found). Buttons: tilt down, or tap the bottom half · tilt up, or tap the top half · any mark within 0.8 s of a new word appearing · 10 s left · time up · Pause, or the app hidden (call, lock, switch app) · pack runs out.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| tilt up, or tap the top half | 0.38 | unsure | n/a | Jev unsure | 0.59 | 0.24 | none |

### T4. Time's up (end of turn)

Main button: Save score. Buttons: a word · Save score.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Save score | 0.89 | clear | 0.89 | no | 0.94 | 0.95 | none |

### R1. Round over

Main button: Round 2. Buttons: Round 2 · Change players or words · End the game · ← Home · D1 · D2 · D3 · D4 · D5 · D6.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Round 2 | 0.80 | report | 0.80 | no | 0.99 | 0.90 | new guest: ← Home (0.57) |

### G1. Game over

Main button: Play again. Buttons: Play again · Change players or words · End for tonight · ← Home · Undo (toast after End the game).

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Play again | 0.39 | unsure | 0.39 | Jev unsure | 1.00 | 0.98 | grandparent: ← Home (0.35); first-time host: ← Home (0.30); new guest: ← Home (0.53) |

### G2. Summary "Tonight's What Am I?"

Main button: ← Home / Play something else. Buttons: Oops, keep playing · ← Home / Play something else.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| ← Home / Play something else | 0.70 | report | 0.70 | ok, medium (0.5 to 0.8) | 0.95 | 0.71 | none |

### Labels below 0.5 ("understood at once by most Indian families, including a non-Hindi speaker from Tirunelveli?")

| Label | P yes | Top answer |
|---|---|---|
| D1 | 0.06 | no |
| Mark words by tilting? | 0.07 | no |
| Allow tilt | 0.07 | no |
| D3 | 0.08 | no |
| D4 | 0.11 | no |
| D5 | 0.11 | no |
| D2 | 0.12 | no |
| D6 | 0.12 | no |
| Turn length | 0.20 | no |
| a pack / a length / a switch | 0.22 | no |
| ; the drawing; score line | 0.22 | no |
| countdown ends | 0.22 | no |
| tilt up, or tap the top half | 0.24 | no |
| Word pack | 0.25 | no |
| on with | 0.26 | no |
| ; main | 0.28 | no |
| , | 0.28 | no |
| ; | 0.30 | no |
| What Am I? card, nothing unfinished | 0.33 | no |
| Drag a name | 0.33 | no |
| pack runs out | 0.34 | no |
| tilt down, or tap the bottom half | 0.35 | no |
| Undo (toast after End the game) | 0.37 | no |
| Words nobody got: Penguin, Zebra | 0.39 | no |
| What Am I? card, a game night unfinished | 0.40 | no |
| Next: Arjun | 0.40 | no |
| Mix of all: 316 words | 0.41 | no |
| Penguin · Zebra | 0.41 | no |
| Save score | 0.44 | no |
| Best guesser tonight: Meena (31 words) | 0.44 | no |
| Change players or words | 0.45 | no |
| Delete tonight's games | 0.45 | no |
| with a beep each (sound on); | 0.47 | no |
| Arjun 7 · Riya 5 · Meena 5 · … | 0.49 | no |
| Arjun and Meena share the win with 12! | 0.49 | no |

## Word list

Words asked: 789 of 789, three questions each: known to a mixed-region Indian family (ages 8 to 80, including a non-Hindi speaker from Tirunelveli); can be acted or described; political or religious-sensitive. Listed: known or acted below 0.5 (P yes), sensitive above 0.5 (P yes). Unsure = top answer "uncertain".

- **Not known at once (P yes below 0.5):** WAIW-015 Crow (0.48); WAIW-016 Owl (0.35); WAIW-017 Eagle (0.49); WAIW-019 Hen (0.49); WAIW-023 Tortoise (0.16); WAIW-024 Rabbit (0.47); WAIW-025 Squirrel (0.27); WAIW-030 Bear (0.38); WAIW-031 Deer (0.34); WAIW-034 Dolphin (0.48); WAIW-039 Lizard (0.36); WAIW-041 Idli (0.25); WAIW-045 Chapati (0.44); WAIW-047 Curd (0.48); WAIW-063 Payasam (0.08); WAIW-064 Popcorn (0.40); WAIW-070 Fish fry (0.41); WAIW-071 Mutton (0.46); WAIW-074 Lassi (0.44); WAIW-080 Pani puri (0.19); WAIW-083 Broom (0.39); WAIW-095 Mixie (0.37); WAIW-107 Tumbler (0.29); WAIW-114 Iron box (0.39); WAIW-116 Chappal stand (0.31); WAIW-127 Auto driver (0.45); WAIW-133 Carpenter (0.49); WAIW-134 Plumber (0.26); WAIW-140 Watchman (0.36); WAIW-144 Firefighter (0.29); WAIW-145 Astronaut (0.47); WAIW-151 Zookeeper (0.06); WAIW-153 Delivery rider (0.11); WAIW-159 Newsreader (0.42); WAIW-164 Kho kho (0.26); WAIW-174 Wrestling (0.47); WAIW-176 Basketball (0.42); WAIW-177 Skipping (0.48); WAIW-183 Wicket (0.26); WAIW-186 Wicketkeeper (0.37); WAIW-188 Run out (0.36); WAIW-189 Free hit (0.19); WAIW-193 Stumps (0.30); WAIW-196 Goalkeeper (0.28); WAIW-197 Penalty (0.49); WAIW-198 Referee (0.32); WAIW-199 Marathon (0.47); WAIW-202 Pongal (0.18); WAIW-206 Onam (0.10); WAIW-207 Navratri (0.28); WAIW-208 Ganesh Chaturthi (0.27); WAIW-209 Raksha Bandhan (0.32); WAIW-235 Exhibition (0.28); WAIW-245 Taking a selfie (0.21); WAIW-253 Cutting vegetables (0.49); WAIW-254 Rolling chapati (0.31); WAIW-259 Putting on a saree (0.33); WAIW-260 Tying shoelaces (0.29); WAIW-263 Bowling a ball (0.06); WAIW-264 Rocking a baby (0.35); WAIW-265 Rowing a boat (0.26); WAIW-268 Typing on a phone (0.28); WAIW-272 Walking a dog (0.42); WAIW-273 Carrying a heavy bag (0.49); WAIW-276 Lighting a lamp (0.46); WAIW-285 Rohit Sharma (0.45); WAIW-286 Mithali Raj (0.11); WAIW-287 PV Sindhu (0.44); WAIW-288 Saina Nehwal (0.38); WAIW-289 Mary Kom (0.28); WAIW-290 Neeraj Chopra (0.35); WAIW-291 Viswanathan Anand (0.45); WAIW-292 Sunil Chhetri (0.36); WAIW-293 Milkha Singh (0.23); WAIW-294 PT Usha (0.32); WAIW-295 Mirabai Chanu (0.08); WAIW-296 Rakesh Sharma (0.23); WAIW-297 Sania Mirza (0.34); WAIW-300 Zakir Hussain (0.31); WAIW-301 Sunita Williams (0.09); WAIW-302 Yuvraj Singh (0.28); WAIW-303 Leander Paes (0.38); WAIW-306 Kalpana Chawla (0.19); WAIW-307 CV Raman (0.30); WAIW-308 Srinivasa Ramanujan (0.20); WAIW-309 Jasprit Bumrah (0.25); WAIW-310 Smriti Mandhana (0.05); WAIW-311 Rabindranath Tagore (0.28); WAIW-312 Swami Vivekananda (0.38); WAIW-313 Hima Das (0.10); WAIW-314 Ratan Tata (0.40); WAIW-315 Sundar Pichai (0.21); WAIW-316 D Gukesh (0.03); WAIW-317 Harmanpreet Kaur (0.06); WAIW-318 Anil Kumble (0.48); WAIW-319 Sourav Ganguly (0.24); WAIW-320 Rahul Dravid (0.36); WAIW-321 Fox (0.33); WAIW-322 Wolf (0.21); WAIW-323 Rhino (0.32); WAIW-324 Hippo (0.45); WAIW-327 Cheetah (0.25); WAIW-328 Leopard (0.35); WAIW-330 Sheep (0.49); WAIW-332 Rooster (0.20); WAIW-334 Sparrow (0.46); WAIW-335 Vulture (0.32); WAIW-336 Ostrich (0.31); WAIW-337 Swan (0.24); WAIW-338 Flamingo (0.31); WAIW-339 Woodpecker (0.05); WAIW-340 Cuckoo (0.14); WAIW-341 Myna (0.30); WAIW-342 Hummingbird (0.09); WAIW-344 Octopus (0.20); WAIW-345 Jellyfish (0.07); WAIW-346 Starfish (0.18); WAIW-348 Seal (0.26); WAIW-349 Seahorse (0.10); WAIW-353 Earthworm (0.15); WAIW-354 Snail (0.24); WAIW-355 Scorpion (0.47); WAIW-356 Firefly (0.21); WAIW-357 Dragonfly (0.16); WAIW-358 Grasshopper (0.26); WAIW-359 Caterpillar (0.27); WAIW-360 Yak (0.14); WAIW-361 Mongoose (0.22); WAIW-362 Porcupine (0.08); WAIW-363 Hyena (0.09); WAIW-364 Jackal (0.30); WAIW-365 Koala (0.10); WAIW-366 Chameleon (0.07); WAIW-369 Seagull (0.19); WAIW-370 Centipede (0.19); WAIW-371 Bedbug (0.03); WAIW-372 Moth (0.35); WAIW-373 Beetle (0.19); WAIW-374 Pelican (0.04); WAIW-375 Silkworm (0.11); WAIW-376 Termite (0.18); WAIW-377 Chimpanzee (0.39); WAIW-378 Vada (0.20); WAIW-379 Upma (0.20); WAIW-380 Sambar (0.43); WAIW-381 Rasam (0.07); WAIW-382 Appam (0.03); WAIW-383 Mysore pak (0.13); WAIW-384 Murukku (0.13); WAIW-387 Chole bhature (0.05); WAIW-388 Rajma (0.18); WAIW-390 Kulfi (0.37); WAIW-392 Khichdi (0.23); WAIW-395 Rasgulla (0.49); WAIW-396 Sandesh (0.11); WAIW-397 Momos (0.44); WAIW-398 Dhokla (0.06); WAIW-399 Pav bhaji (0.16); WAIW-400 Poha (0.10); WAIW-401 Modak (0.05); WAIW-403 French fries (0.47); WAIW-410 Fish curry (0.45); WAIW-412 Buttermilk (0.27); WAIW-414 Sweet corn (0.29); WAIW-419 Ladies finger (0.25); WAIW-422 Pumpkin (0.22); WAIW-424 Drumstick (0.33); WAIW-425 Bitter gourd (0.20); WAIW-429 Pomegranate (0.30); WAIW-433 Chicken 65 (0.21); WAIW-434 Prawns (0.44); WAIW-435 Kebab (0.34); WAIW-436 Shawarma (0.02); WAIW-437 Cotton candy (0.12); WAIW-443 Charger (0.46); WAIW-445 Headphones (0.31); WAIW-448 Hair dryer (0.29); WAIW-454 Bookshelf (0.36); WAIW-457 Doormat (0.40); WAIW-460 Flask (0.14); WAIW-461 Frying pan (0.42); WAIW-463 Vacuum cleaner (0.46); WAIW-464 Mop (0.43); WAIW-466 Thermometer (0.34); WAIW-468 Spectacles (0.49); WAIW-469 Hanger (0.38); WAIW-472 Terrace (0.35); WAIW-478 Rat trap (0.28); WAIW-479 Weighing scale (0.44); WAIW-480 Measuring tape (0.31); WAIW-482 Screwdriver (0.28); WAIW-484 Microwave (0.38); WAIW-486 Wi-Fi (0.42); WAIW-490 Talcum powder (0.44); WAIW-497 Lungi (0.26); WAIW-498 Vet (0.24); WAIW-499 Judge (0.44); WAIW-500 Pharmacist (0.26); WAIW-502 Librarian (0.24); WAIW-503 Cashier (0.37); WAIW-504 Lifeguard (0.05); WAIW-506 Flight attendant (0.28); WAIW-507 Ticket checker (0.43); WAIW-508 Gym trainer (0.23); WAIW-509 Sports coach (0.42); WAIW-510 Commentator (0.21); WAIW-512 Film director (0.43); WAIW-513 Cartoonist (0.12); WAIW-514 Architect (0.30); WAIW-515 Construction worker (0.30); WAIW-516 Crane operator (0.04); WAIW-517 Receptionist (0.31); WAIW-519 Programmer (0.25); WAIW-520 YouTuber (0.10); WAIW-521 Radio jockey (0.12); WAIW-522 DJ (0.45); WAIW-523 Tour guide (0.48); WAIW-524 Juggler (0.28); WAIW-525 Clown (0.35); WAIW-526 Ringmaster (0.03); WAIW-527 Acrobat (0.20); WAIW-530 Bodyguard (0.41); WAIW-531 Beekeeper (0.09); WAIW-532 Baker (0.27); WAIW-533 Fashion designer (0.32); WAIW-534 Makeup artist (0.29); WAIW-535 Stunt artist (0.09); WAIW-538 Poet (0.46); WAIW-539 Quiz master (0.35); WAIW-540 Scuba diver (0.05); WAIW-541 Welder (0.13); WAIW-542 Skydiver (0.02); WAIW-543 Salesperson (0.36); WAIW-544 Call centre agent (0.23); WAIW-545 Parking attendant (0.17); WAIW-546 Woodcutter (0.15); WAIW-547 Coal miner (0.18); WAIW-548 Inventor (0.37); WAIW-549 Translator (0.29); WAIW-550 Puppeteer (0.02); WAIW-551 Sculptor (0.18); WAIW-552 Toy maker (0.23); WAIW-553 Mimicry artist (0.16); WAIW-554 Bodybuilder (0.19); WAIW-555 Tightrope walker (0.17); WAIW-556 Weather reporter (0.37); WAIW-557 Archery (0.15); WAIW-558 Weightlifting (0.21); WAIW-559 Long jump (0.45); WAIW-561 Javelin throw (0.07); WAIW-562 Shot put (0.02); WAIW-563 Discus throw (0.14); WAIW-564 Pole vault (0.01); WAIW-565 Relay race (0.29); WAIW-566 Hurdles (0.26); WAIW-567 Gymnastics (0.21); WAIW-568 Karate (0.49); WAIW-569 Judo (0.15); WAIW-570 Skating (0.18); WAIW-571 Surfing (0.11); WAIW-572 Skiing (0.04); WAIW-573 Golf (0.27); WAIW-574 Rugby (0.02); WAIW-575 Baseball (0.01); WAIW-576 Snooker (0.35); WAIW-577 Diving (0.15); WAIW-578 Tug of war (0.40); WAIW-579 Sack race (0.10); WAIW-580 Lemon and spoon race (0.21); WAIW-581 Three-legged race (0.21); WAIW-582 Musical chairs (0.44); WAIW-583 Statue game (0.18); WAIW-585 Spinning top (0.33); WAIW-586 Marbles (0.44); WAIW-587 Hopscotch (0.05); WAIW-588 Seven stones (0.13); WAIW-589 Push-ups (0.21); WAIW-590 Somersault (0.06); WAIW-591 Cartwheel (0.09); WAIW-592 Dumbbells (0.18); WAIW-594 Stopwatch (0.33); WAIW-595 Scoreboard (0.19); WAIW-596 Jersey (0.38); WAIW-597 Racket (0.41); WAIW-598 Shuttlecock (0.24); WAIW-601 Toss (0.29); WAIW-602 Century (0.48); WAIW-603 Hat-trick (0.17); WAIW-604 No ball (0.25); WAIW-605 Wide ball (0.23); WAIW-606 Clean bowled (0.12); WAIW-607 Boundary (0.15); WAIW-608 Super over (0.20); WAIW-609 Bouncer (0.04); WAIW-611 Fielder (0.22); WAIW-612 Pitch (0.14); WAIW-613 Howzat (0.33); WAIW-614 Man of the match (0.30); WAIW-615 Durga Puja (0.12); WAIW-616 Bihu (0.01); WAIW-617 Lohri (0.01); WAIW-618 Baisakhi (0.01); WAIW-619 Rath Yatra (0.08); WAIW-620 Easter (0.19); WAIW-621 Guru Nanak Jayanti (0.02); WAIW-622 Buddha Purnima (0.04); WAIW-623 Iftar party (0.17); WAIW-624 Goa Carnival (0.04); WAIW-627 Gandhi Jayanti (0.24); WAIW-629 Baby shower (0.03); WAIW-630 Housewarming (0.18); WAIW-634 Annual day (0.41); WAIW-635 Qutub Minar (0.25); WAIW-638 Golden Temple (0.46); WAIW-639 Hawa Mahal (0.20); WAIW-640 Charminar (0.15); WAIW-641 Mysore Palace (0.33); WAIW-642 Kanyakumari (0.16); WAIW-643 Ooty (0.42); WAIW-644 Backwaters (0.07); WAIW-645 Howrah Bridge (0.23); WAIW-646 Victoria Memorial (0.14); WAIW-647 Darjeeling (0.43); WAIW-648 Sundarbans (0.03); WAIW-650 Ajanta Caves (0.09); WAIW-651 Kaziranga (0.05); WAIW-652 Cherrapunji (0.10); WAIW-654 Pyramids (0.44); WAIW-661 Farm (0.45); WAIW-663 Shopping mall (0.48); WAIW-666 Water park (0.31); WAIW-667 Aquarium (0.28); WAIW-668 Igloo (0.12); WAIW-669 Haunted house (0.26); WAIW-672 Threading a needle (0.34); WAIW-673 Watering plants (0.49); WAIW-674 Eating something spicy (0.43); WAIW-675 Walking on hot sand (0.33); WAIW-676 Jumping in puddles (0.45); WAIW-677 Slipping on wet floor (0.48); WAIW-678 Using binoculars (0.12); WAIW-679 Seeing a cockroach (0.47); WAIW-680 Opening a tight jar (0.28); WAIW-681 Bargaining (0.41); WAIW-682 Taking a cold bath (0.38); WAIW-683 Shaving a beard (0.32); WAIW-684 Putting on lipstick (0.48); WAIW-686 Cleaning your glasses (0.30); WAIW-689 Hammering a nail (0.38); WAIW-690 Digging a hole (0.39); WAIW-691 Pushing a stuck car (0.49); WAIW-692 Changing a tyre (0.39); WAIW-695 Going down a slide (0.42); WAIW-696 Spinning a top (0.45); WAIW-697 Shuffling cards (0.40); WAIW-698 Juggling (0.27); WAIW-699 Doing push-ups (0.24); WAIW-700 Lifting weights (0.30); WAIW-701 Shooting an arrow (0.31); WAIW-702 Watching a scary film (0.37); WAIW-703 Singing in the shower (0.36); WAIW-708 Walking on tiptoe (0.42); WAIW-709 Midnight snacking (0.32); WAIW-712 Taking bitter medicine (0.37); WAIW-713 Getting an injection (0.49); WAIW-714 Knitting a sweater (0.18); WAIW-715 Playing the flute (0.49); WAIW-716 Walking a tightrope (0.13); WAIW-717 Stuck in a lift (0.33); WAIW-718 Building a sandcastle (0.36); WAIW-719 Giving a hug (0.45); WAIW-722 Getting a shock (0.44); WAIW-723 Walking like a robot (0.49); WAIW-724 Making a paper boat (0.45); WAIW-725 Playing a video game (0.21); WAIW-728 Cheering for your team (0.23); WAIW-729 Giving a speech (0.43); WAIW-730 Smelling something bad (0.29); WAIW-732 Dipa Karmakar (0.09); WAIW-733 Lovlina Borgohain (0.06); WAIW-734 Manika Batra (0.05); WAIW-735 Jhulan Goswami (0.05); WAIW-736 Anju Bobby George (0.20); WAIW-737 Manu Bhaker (0.04); WAIW-738 Nikhat Zareen (0.02); WAIW-739 Koneru Humpy (0.02); WAIW-740 Divya Deshmukh (0.01); WAIW-741 Deepika Kumari (0.11); WAIW-742 Rani Rampal (0.07); WAIW-743 Shreya Ghoshal (0.13); WAIW-744 Asha Bhosle (0.37); WAIW-745 Indra Nooyi (0.08); WAIW-747 Bachendri Pal (0.08); WAIW-748 Avani Lekhara (0.04); WAIW-749 Deepti Sharma (0.05); WAIW-750 Jemimah Rodrigues (0.03); WAIW-751 Sheetal Devi (0.09); WAIW-752 Dutee Chand (0.03); WAIW-753 Karnam Malleswari (0.11); WAIW-754 Bhavani Devi (0.01); WAIW-755 Shafali Verma (0.04); WAIW-756 KS Chithra (0.06); WAIW-758 Jagadish Chandra Bose (0.06); WAIW-759 R Ashwin (0.23); WAIW-760 Sunil Gavaskar (0.44); WAIW-761 Ravindra Jadeja (0.26); WAIW-762 Shubman Gill (0.11); WAIW-763 Rishabh Pant (0.17); WAIW-764 Lakshya Sen (0.05); WAIW-765 PR Sreejesh (0.01); WAIW-766 Mariyappan Thangavelu (0.08); WAIW-767 Satya Nadella (0.13); WAIW-768 SP Balasubrahmanyam (0.10); WAIW-769 Shankar Mahadevan (0.19); WAIW-770 Prabhas (0.03); WAIW-771 Shubhanshu Shukla (0.01); WAIW-772 Salim Ali (0.14); WAIW-773 Ruskin Bond (0.05); WAIW-774 RK Narayan (0.04); WAIW-775 Tenzing Norgay (0.26); WAIW-776 Verghese Kurien (0.11); WAIW-777 Rohan Bopanna (0.10); WAIW-778 Sanju Samson (0.09); WAIW-779 Virender Sehwag (0.34); WAIW-780 Kishore Kumar (0.33); WAIW-781 Jeremy Lalrinnunga (0.04); WAIW-782 Chhota Bheem (0.23); WAIW-783 Tenali Raman (0.06); WAIW-784 Birbal (0.22); WAIW-785 Motu Patlu (0.18); WAIW-786 Shaktimaan (0.31); WAIW-787 Mowgli (0.48); WAIW-788 Little Singham (0.10); WAIW-789 Krrish (0.16)
- **Cannot be acted or described (P yes below 0.5):** WAIW-316 D Gukesh (0.24); WAIW-738 Nikhat Zareen (0.48); WAIW-740 Divya Deshmukh (0.27); WAIW-748 Avani Lekhara (0.47); WAIW-749 Deepti Sharma (0.28); WAIW-750 Jemimah Rodrigues (0.29); WAIW-766 Mariyappan Thangavelu (0.46); WAIW-771 Shubhanshu Shukla (0.25)
- **Political or religious-sensitive (P yes above 0.5):** WAIW-005 Cow (0.84); WAIW-236 Mosque (0.58); WAIW-329 Pig (0.70); WAIW-638 Golden Temple (0.58)
- **Unsure on any question:** none
- Known, 0.5 to 0.8 band: 275.

## Decisions used

- This run: 2563 decisions, 149 calls.
- Product count this ISO week (2026-W43): 93 before, 2656 after, of 15000.
- Shared count this ISO week: 1896 before, 4459 after, of 50000.
- Stopped early: no.
- Skipped: nothing.

## Tool faults (kept apart from findings)

- None: every call answered on the first try.
