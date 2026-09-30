# tests/android: runs on an Android phone emulator (PLT-120, PLT-121)

Chrome for Android on a real Android emulator, driven by Playwright over adb. Not part of `npm test` or
`npm run test:browser`, and never part of the checks on every push: it runs once a week and on request (PLT-118).
The app is served from this computer (`npm run preview`) and reaches the emulator through `adb reverse`, so it is
the same build the browser tests use.

| File | What it is |
|---|---|
| `fixtures.ts` | The first adb device, Chrome with its first-run screens off, a touch screen, the screen size a test asks for (390 × 844 or 360 × 800 CSS pixels at density 480), and a fresh Chrome profile per test |
| `emulator.spec.ts` | PLT-120 (a full paper game offline at both sizes, TAM-138 no scrolling) and PLT-121 (TAM-111 back gesture and pull-down, TAM-112 Android closing Chrome, TAM-064 install and offline start, TAM-110/TAM-128 screen awake, TAM-116 taps within 100 ms with the processor slowed 4×) |
| `../playwright.android.config.ts` | One worker, retried once (PLT-122), 3 minutes per test |

## What it needs
- The Android SDK command-line tools, platform-tools (adb) and the emulator, with an Android 13 (API 33)
  `google_apis` system image. Chrome comes with that image (Chrome 109 at the time of writing).
- An emulator already running with gesture navigation on (the default), for example an AVD made with
  `avdmanager create avd -n pgn_pixel -k "system-images;android-33;google_apis;arm64-v8a" -d pixel_6`
  (use `x86_64` on Intel or Linux machines), started with `emulator -avd pgn_pixel -no-snapshot -no-audio`.
- `adb devices` lists it as `device`.

## Running it
From the repo root: `npm run build`, then `npx playwright test --config tests/playwright.android.config.ts`.
A script is requested from the Build workspace (`npm run test:android`).

If no emulator is running, every test fails with "No Android emulator is running (setup problem, PLT-122)":
that is a setup problem, never an app bug. A test that fails twice in a row (the retry) with the same steps is
treated as a real bug.

## Weekly automation
GitHub's standard Ubuntu runners can run an x86_64 emulator with hardware acceleration (KVM) for free. The
requested weekly workflow boots one (API 33, `google_apis`, x86_64), then runs this suite, report-only.
