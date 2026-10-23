# What Am I?: word packs (edition 1, draft, 23 October 2026)

`words.csv` holds **755 words** after the first Jev check (23 October): Animals 93, Food 99 (10 non-veg), Around the house
100, Jobs 96, Sports and cricket 95, Festivals and places 96, Act it out 100, Famous Indians 76. "Mix of all" (the default)
draws from every pack: 743 words with non-veg off. Grown on 23 October from 40 a pack by four
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

