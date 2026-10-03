# UX guidelines: in-room play

Draft, 28 September 2026. Applies to every Pocket Game Night game; examples are from Tambola.
Built from three research passes (in-room play, mis-touches, patchy connections). **[Inference]**
marks our own reasoning rather than a source. Sources are listed at the end.

## Who we design for
Assume every user is impaired some of the time. Research on "situational impairments" lists walking,
divided attention, low light, glare, noise and alcohol, all of which reduce touch accuracy and reading
speed [8]. Our users:
- **The host:** talking to the room, often anchoring, one hand busy with a plate or a drink, grip
  changing every few seconds [11].
- **Tipsy or distracted players:** alcohol measurably changes how people tap, even at modest levels [8].
- **Grandparents:** do well on touchscreens but are slower; avoid dragging and anything timed [9].
- **Kids and low-literacy players:** need big digits, words next to icons, and the anchor's voice.
- **Travellers:** moving trains, glare, no signal, low battery.

## 1. The room screen (the host phone turned to the room)
1. **One thing at a time.** The called number fills the screen; TV guidance keeps information density low
   and content "front and centre" [1][2].
2. **Size by distance.** Signage practice: about 25 mm of letter height per 3 m of viewing distance [3].
   The called number should be at least 25 mm tall, about half a portrait phone screen **[Inference]**.
3. **The 1–90 board is for the host, not the room.** Its cells (about 6 mm) are readable only within
   about 1.5 m **[Inference]**. The room gets the big number plus a strip of the **last 3 calls**.
4. **Heavy sans-serif, high contrast.** Bold weights; aim for 7:1 contrast, not the 3:1 minimum [3][4].
5. **Keep content away from the edges**, where fingers hold the phone [1][11] **[Inference, adapted]**.
6. **"Show the room" view:** one tap hides all controls and shows only the number and the last 3 calls.
7. **Test at 1, 2 and 3 m in a lit, noisy room** [5].

## 2. People first, phones second
8. **Voice carries the game; the screen confirms.** Kahoot designed its shared-screen play so players
   "look up" and connect [6]; Heads Up! is a phone assisting an analogue game [7].
9. **Claims are shouted, then checked.** Never replace the shout with a silent button by default.
10. **Player phones hold only what's private** (their ticket). Anything the room should see goes on
    the host screen [6].
11. **Offer a personal-screen fallback** for people who can't see the host screen: a player's own
    phone can show the last calls. Kahoot added this for large rooms and low vision [6].
12. **Don't lean on "phones kill conversation".** That well-known finding failed to replicate [10].
    Our case rests on the shared-screen evidence above.

## 3. Host controls under pressure
13. **"Next number" is always in the same place: bottom centre, in the thumb zone.** 49% of people hold
    the phone one-handed and 75% of touches are by thumb; bottom centre suits both hands [11][12].
14. **Big targets.** Every control at least 48×48 dp / 44×44 pt [13][14], WCAG AAA 44×44 CSS px [15].
    "Next number" at least 72 dp tall **[Inference]**. About 12 mm at edges and corners, 7 mm at
    the centre [16]. Leave space between controls [13][17].
15. **Rare and destructive actions go up top, away from the thumb, behind a specific confirmation**
    ("End the game and show payouts?" with buttons "End game" / "Keep playing", not Yes/No) [12][18].
16. **Instant feedback on every host tap:** a visible change within 100 ms [22], plus a short
    vibration and sound where supported, so the host knows it worked without looking **[Inference]** [2].
17. **Labels with every icon.** Only a handful of icons are universally understood [19].
17a. **One main button per screen, and it is the next step.** Only one button has the solid main look. A chosen
    option shows an outline, a ✓ and a light tint, never the main look. Choices between equals (host or join,
    paper or phone) look equal. Destructive actions are never the main button (owner, 1 October 2026).
    Marks and states (a marked cell, a chosen tab) never use the main-button colour (2 October 2026).
17b. **In landscape, the bottom button never hides a setup choice** (2 October 2026).

## 4. Mis-touches: prevent, then forgive
18. **Undo beats confirmation.** Confirmations used too often get clicked through by habit; keep them
    for serious, irreversible actions [18]. Accepting a claim is undoable (TAM-070); ending a game
    gets a confirmation.
19. **Actions fire when the finger lifts**, so sliding off a wrong button cancels it (WCAG 2.5.2) [20].
20. **Double taps don't double-act.** "Next number" ignores repeat taps for about 0.5–0.8 s and is
    disabled until the new number shows **[Inference]**.
21. **No dragging required.** Anything draggable also works with taps (WCAG 2.5.7); older adults
    were slowest at dragging [9][21].
22. **Marking a ticket number toggles**, with no confirmation; tapping again unmarks it **[Inference]**.
23. **The game can't be lost by accident.** Disable pull-to-refresh and swipe-back inside a game;
    save on every move and when the app is hidden; a refresh resumes the game [23][24][25].

## 5. Legibility and accessibility
24. **Text:** 17 pt body by default, never below 11 pt [13]; a **Larger text** option for players,
    since bigger and fewer items removed the walking penalty in research [8].
25. **Contrast:** at least 4.5:1 for text, 3:1 for large text and for state indicators such as a
    marked cell; aim for 7:1 on the room screen [4][26][27].
26. **Never colour alone.** About 1 in 12 men have colour-vision deficiency [28]. A marked cell gets a
    fill **and** a mark; a verdict gets an icon **and** a word: "✓ Accepted", "✗ Bogey" [29].
26a. **Announce what the room hears:** the called number, its rhyme and every verdict reach screen readers
    (a polite live region, WCAG 4.1.3) (2 October 2026).
27. **Dark mode is an option, not the default,** and keeps its text large. Light mode still read
    better in night conditions in the study NN/g cites [30].
28. **Nothing timed or auto-advancing by default,** so slower players are never rushed [9].

## 6. Offline and interruptions
29. **Offline is normal, not an error.** No offline warnings on the host screen; nothing waits on the
    network. If a sync feature ever exists, use plain words ("Weak network: your ticket still works") [31].
30. **"Open once, then works offline":** precache the whole app on the first visit, including rhymes and
    sounds [32][33].
31. **Never update the app mid-game.** Offer updates on the home screen only [34] **[Inference]**.
32. **Keep the screen awake during a game** (Screen Wake Lock), and ask again after the app returns;
    if refused (battery saver), show a small "keep your screen on" hint [35]. On iPhone this works in
    home-screen apps only from iOS 18.4 [36].
33. **Resume after interruptions.** Save when the app is hidden; if Android discarded the tab, reopen
    straight into the game with "Game resumed" [25].
34. **Pause, don't catch up.** If auto-calling is on and the app is hidden, return to "Paused: tap to
    resume" **[Inference]**.
35. **Storage can vanish.** If the saved game is gone, show a calm "Start a new game", never an error
    [37][38] **[Inference]**. Ask the browser for persistent storage when a game starts [37].
36. **iPhone quirks:** there is no install prompt, so show a one-time "Share → Add to Home Screen"
    tip; games saved in Safari and in the home-screen app are separate, so always open it the same way [39].

## 7. Phone tickets and joining
37. **The QR opens in the phone's own camera app**, as a link that works with no server **[Inference]** [40].
38. **A 6-character typed code as a fallback,** without look-alike characters (0/O, 1/I/L), easy to read aloud **[Inference]**.
39. **Short QR codes, high contrast, and a one-line instruction** beside them: "Scan with your camera to
    get your ticket" [41].
40. **A guest who can't load the app gets a paper ticket in one tap**, within about 10 seconds **[Inference]**.
41. **Ticket size on a phone:** 9 columns in portrait gives cells of about 38 CSS px, below the 44 px
    AAA target but above the 24 px AA minimum [15][42]. Show the ticket in **landscape** by default
    (cells about 80 px), with portrait allowed **[Inference]**. Tickets always fit the screen width, down to 320 px (cells about 32 px there) (2 October 2026).

## 8. Low-end phones and battery
42. **Small and fast:** about 170 KB of compressed JavaScript on the critical path, usable within
    5 seconds on a mid-range phone over slow 3G [43][22].
43. **Taps respond within 100 ms;** no constant animations on the host screen, which also saves battery [22].
44. **Test with a throttled CPU and a real budget Android phone** [22].

## 9. Secrets on a passed phone, and the table (Impostor review, 3 October 2026)
45. **Private reveal on a passed phone.** The secret shows only while held (or tapped, with an auto-hide). When hidden
    it is not in the page at all, and it hides when the app goes to the background (a blank cover for the app
    switcher). Every role gets the same layout, timing, vibration and sound. The private text is sized for one reader
    at arm's length, and shows above the finger. No text selection, callout, magnifier, context menu or drag.
46. **Room screen on the table.** When the phone lies in the middle: main text at least 56 CSS px, timers at least
    120 CSS px, countdown numbers at least 200 CSS px. Remember half the table reads it upside down **[Inference]**.
47. **A reveal can't be undone, so it is pick, then confirm.** The deciding tap names the person ("Reveal Arjun").
    Undo is only for what is still secret or still open.
48. **Shared screens stop at decision points.** A countdown started by a tap is fine; a timer ending never starts the
    next step by itself (extends 28).

## Decisions (owner, 2026-09-28)
- **Auto-call mode:** off by default. When the host turns it on, they set the time between calls,
  can change it at any time, and can pause and resume with one tap (TAM-120).
- **Undo last call:** allowed for 5 seconds after a call, for mis-taps; after that a called number
  stands (TAM-119, TAM-071).

## Sources
[1] Amazon Fire TV design guidelines, https://developer.amazon.com/docs/fire-tv/design-and-user-experience-guidelines.html ·
[2] Android TV design, https://developer.android.com/design/ui/tv/guides/foundations/design-for-tv ·
[3] Typography and viewing distance, https://digitalsignage.com/digital_signage/docs/guides/typography-viewing-distance/ ·
[4] WebAIM contrast, https://webaim.org/articles/contrast/ ·
[5] 10-foot user interface, https://en.wikipedia.org/wiki/10-foot_user_interface ·
[6] Kahoot single-device play, https://kahoot.com/blog/2021/03/04/questions-answers-on-a-single-device/ and https://kahoot.com/blog/2022/08/08/tech-tip-single-screen/ ·
[7] Heads Up!, https://apps.apple.com/us/app/heads-up/id623592465 ·
[8] Wobbrock, situationally aware mobile devices, https://faculty.washington.edu/wobbrock/pubs/eics-19.01.pdf ·
[9] Findlater et al., CHI 2013, https://makeabilitylab.cs.washington.edu/media/publications/Findlater_AgeRelatedDifferencesInPerformanceWithTouchscreensComparedToTraditionalMouseInput_CHI2013.pdf ·
[10] Mere-presence replication, https://pmc.ncbi.nlm.nih.gov/articles/PMC8189469/ ·
[11] Hoober, how users hold phones, https://www.uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php ·
[12] The thumb zone, https://www.smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users/ ·
[13] Apple HIG accessibility, https://developer.apple.com/tutorials/data/design/human-interface-guidelines/accessibility.json ·
[14] Android accessibility, https://developer.android.com/guide/topics/ui/accessibility/apps ·
[15] WCAG 2.5.5 target size (enhanced), https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html ·
[16] Hoober, design for fingers, https://www.uxmatters.com/mt/archives/2017/03/design-for-fingers-touch-and-people-part-1.php ·
[17] NN/g touch target size, https://www.nngroup.com/articles/touch-target-size/ ·
[18] NN/g confirmation dialogs, https://www.nngroup.com/articles/confirmation-dialog/ ·
[19] NN/g icon usability, https://www.nngroup.com/articles/icon-usability/ ·
[20] WCAG 2.5.2 pointer cancellation, https://www.w3.org/WAI/WCAG22/Understanding/pointer-cancellation.html ·
[21] WCAG 2.5.7 dragging, https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html ·
[22] RAIL performance model, https://web.dev/articles/rail ·
[23] overscroll-behavior, https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior ·
[24] beforeunload, https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event ·
[25] Page Lifecycle API, https://developer.chrome.com/docs/web-platform/page-lifecycle-api ·
[26] WCAG 1.4.3 contrast, https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html ·
[27] WCAG 1.4.11 non-text contrast, https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html ·
[28] NEI colour blindness, https://www.nei.nih.gov/learn-about-eye-health/eye-conditions-and-diseases/color-blindness ·
[29] WCAG 1.4.1 use of colour, https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html ·
[30] NN/g dark mode, https://www.nngroup.com/articles/dark-mode/ ·
[31] web.dev offline UX, https://web.dev/articles/offline-ux-design-guidelines ·
[32] web.dev offline cookbook, https://web.dev/articles/offline-cookbook ·
[33] Workbox precaching, https://developer.chrome.com/docs/workbox/modules/workbox-precaching ·
[34] Vite PWA guide, https://vite-pwa-org.netlify.app/guide/ ·
[35] Screen Wake Lock API, https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API ·
[36] WebKit wake lock bug, https://bugs.webkit.org/show_bug.cgi?id=254545 ·
[37] web.dev persistent storage, https://web.dev/articles/persistent-storage ·
[38] WebKit storage policy, https://webkit.org/blog/14403/updates-to-storage-policy/ ·
[39] web.dev PWA installation, https://web.dev/learn/pwa/installation ·
[40] BarcodeDetector support, https://caniuse.com/mdn-api_barcodedetector ·
[41] QR code UX, https://www.uxmatters.com/mt/archives/2023/01/understanding-qr-code-ux-design-considerations.php ·
[42] WCAG 2.5.8 target size (minimum), https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html ·
[43] Performance budgets, https://web.dev/articles/performance-budgets-101 ·
[44] Housie caller app listing, https://apps.apple.com/us/app/housie-tambola-number-picker/id6756596567

**Evidence notes:** no source gives a target size for tipsy users; our sizes are the accessibility
AAA figures applied as a safety margin. Hold-to-confirm came from a practitioner blog only, so we
use specific confirmations instead. Several academic sources were behind paywalls and are not cited.
