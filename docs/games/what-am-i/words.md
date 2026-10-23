# What Am I?: word packs (edition 1, draft, 23 October 2026)

`words.csv` holds **726 words** after the second Jev check (23 October): Animals 92, Food 98 (10 non-veg), Around the house
100, Jobs 94, Sports and cricket 87, Festivals and places 91, Act it out 100, Famous Indians 64. "Mix of all" (the default)
draws from every pack: 714 words with non-veg off (724 on). Grown on 23 October from 40 a pack by four
helpers in parallel, two packs each, under `docs/word-guidelines.md` Part B; rows WAIW-321 on carry "grown 23 Oct" and the
helper's doubt, if any, in notes.

Rules every word follows:
- **Known everywhere** (K24): English, or an Indian word a non-Hindi speaker from Tirunelveli or Sivagangai knows
  (Idli, Payasam, Kabaddi, Pongal, Onam sit beside Holi, Jalebi and Raksha Bandhan, so no region is favoured).
- **Actable or describable by a 10-year-old.**
- **Famous Indians:** known in every state, nothing political (no politicians; Gandhi left out for that reason; Sudha
  Murty left out as a Rajya Sabha member). APJ Abdul Kalam is in as the scientist children learn about (flagged for Jev).
  Women and men balanced; every region including the northeast; eight story and cartoon characters known everywhere
  (Chhota Bheem, Tenali Raman, Birbal, Motu Patlu, Shaktimaan, Mowgli, Little Singham, Krrish).
- **Festivals and places:** faiths balanced (Hindu, Muslim, Christian, Sikh, Buddhist, harvest festivals) and landmarks from
  every region.
- **Non-veg** words (Egg, Chicken curry, Fish fry, Mutton) carry `nonveg=yes` and are off unless the host turns them on
  (WA9). Biryani stays on: it has veg kinds.
- Two words appear in two packs with different meanings or uses (Bat, Swimming); no word is shown twice in one evening.
- Left out when growing (not known at once everywhere, or political): Sudha Murty, Sloth, Skunk, Leech, Mahavir Jayanti,
  Hornbill Festival, Mexican wave, Ugadi, R Praggnanandhaa (spelling), District collector; Commentator kept in Jobs only.
- Before approval, the Jev word-list check reads every word; flagged words (notes column) are the first to replace.

## First Jev check (23 October 2026, `jev-check.md`)
Jev (J1, run by the `jev-design` helper, 2,563 decisions) rated 434 of 789 words below 0.5 for "known at once", including
Idli, Hen, Crow, Plumber, Auto driver, Pongal and Rohit Sharma. That fails the common-sense check the strategy's **control
words** are meant to catch (`docs/proposals/jev-for-design.md` §3), so the absolute scores are **not** used as a pass mark.
Jev's ordering within a pack is still useful. A word was removed only where Jev put it at the very bottom **and** another check
already doubted it (a growing helper's note, word guideline B1 or B4, or its fit for a 10-year-old), as §4 requires:
- **Famous Indians (22):** Divya Deshmukh, Bhavani Devi, PR Sreejesh, Shubhanshu Shukla, Nikhat Zareen, Koneru Humpy,
  D Gukesh, Jemimah Rodrigues, Dutee Chand, Prabhas, Manu Bhaker, Avani Lekhara, Shafali Verma, RK Narayan, Jeremy
  Lalrinnunga, Smriti Mandhana, Manika Batra, Jhulan Goswami, Deepti Sharma, Lakshya Sen, Ruskin Bond, Mariyappan
  Thangavelu (most also "can't be described" by Jev).
- **Others (11):** Bedbug, Pelican, Hummingbird, Shawarma, Puppeteer, Crane operator, Ringmaster, Baseball, Rugby, Pole
  vault, Baby shower.
- **Sensitive (1):** Pig (Jev 0.70 religious-sensitive; word guideline B3).
- **Kept on purpose:** regional festivals and foods Jev rated low (Bihu, Lohri, Baisakhi, Onam, Pongal, Appam, Rasam,
  Dhokla): balance across regions is the rule (B1), and Jev rating Pongal and Idli low shows its blind spot. Cow (Jev 0.84
  sensitive) is kept as an everyday animal to act; Mosque and Golden Temple (0.58) are kept for balance with Temple and Church.
  The owner may overrule any of these.
- **Next:** the tool gets control words; then J1 is re-run, with J2 (fits its pack) and J3 (guessable from a clue).

## Clues for the "guessable from a clue" check (J3), 23 October
`clues.csv` holds two clues per word (755 rows, one per word in `words.csv`), written by four helpers in parallel as a
family would shout them: one description, one association; never the word or part of it (checked by script), at most
10 words. They are test data for Jev's J3 job only, never shown in the app. The helpers' hard cases, to read against J3's
results: near-twins (Leopard / Cheetah, Rooster / Hen, Wicket / Stumps / Pitch, Talcum powder / Hair oil / Perfume, Safety
pin / Needle and thread); cricket terms non-fans may miss (Free hit, Super over, Howzat); words a region may not know
(Sandesh, Seven stones, Cherrapunji, Sundarbans); people children may not know (Anju Bobby George, KS Chithra, Karnam
Malleswari, Salim Ali, Verghese Kurien, Indra Nooyi, Bachendri Pal, Sheetal Devi).

## Second Jev check, with control words (23 October 2026, `jev-words-2.md`)
2,292 decisions. **The controls passed:** the three made-up words scored 0.01–0.04 "known" and were rated hard to act; the six
everyday controls (Elephant, Banana, Doctor, Cricket, Diwali, Chair) all scored above 0.5 on every question. So Jev's scale is
sound at the ends, but strict: 399 of 755 words fell below 0.5 "known", including Idli (0.28) and Sambar (0.39), which every
Tirunelveli family knows. As before, a word was removed only where Jev put it below 0.2 **and** another check already doubted
it (a helper's note when growing or writing clues, word guideline B4, or a near-twin), **29 words**:
- **Famous Indians (12):** Jagadish Chandra Bose, KS Chithra, Salim Ali, Verghese Kurien, Indra Nooyi, Karnam Malleswari,
  Bachendri Pal, Sheetal Devi, Rohan Bopanna, Satya Nadella, Rani Rampal, Deepika Kumari (also mixed up with a film star).
- **Sports and cricket (8):** Skiing, Surfing, Seven stones, Hopscotch (both called by regional names), Bouncer, Pitch (near
  Wicket and Stumps), Clean bowled (near Bowler), Super over.
- **Festivals and places (5):** Cherrapunji, Sundarbans, Kaziranga, Goa Carnival, Iftar party (Eid stays).
- **Jobs (2):** Welder, Parking attendant. **Animals (1):** Silkworm. **Food (1):** Sandesh (little known in the south).
- **Kept although Jev rated them low:** regional festivals and foods (Bihu, Lohri, Baisakhi, Onam, Durga Puja, Appam, Payasam,
  Rasam, Dhokla, Poha, Modak) for balance across regions (B1); cartoon characters children know (Chhota Bheem, Motu Patlu,
  Tenali Raman, Little Singham); cricketers and athletes in school books (Mithali Raj, Harmanpreet Kaur, Mirabai Chanu, Hima
  Das, Kalpana Chawla, Sunita Williams). **Sensitive:** Cow 0.86 again, **kept by the owner** (23 October) as an everyday animal to act; Mosque 0.58 and Golden Temple
  0.52 kept for balance with Temple and Church.
- **Still to come:** J2 (fits its pack) and J3 (guessable from a clue, `clues.csv`, now 726 rows) when the tester adds them.

