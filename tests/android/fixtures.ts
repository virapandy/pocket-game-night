// The Android emulator fixture: Chrome for Android on the first adb device, the app served from this computer
// through `adb reverse`, and the screen set to the size a test asks for. The browser tests' helpers
// (tests/browser/helpers.ts) work unchanged on the page this gives.
import { execFileSync } from 'node:child_process';
import { _android, test as base, expect, type AndroidDevice, type BrowserContext, type Page } from '@playwright/test';

export { expect };
const PORT = 4173;
export const APP_URL = `http://localhost:${PORT}/pocket-game-night/`;

/** Phone screens in CSS pixels, at 3 device pixels per CSS pixel (density 480). */
export const SCREENS = { standard: { width: 390, height: 844 }, small: { width: 360, height: 800 } } as const;
export type ScreenName = keyof typeof SCREENS;

type Fixtures = { screen: ScreenName; context: BrowserContext; page: Page };
type Workers = { device: AndroidDevice };

export const test = base.extend<Fixtures, Workers>({
  device: [async ({}, use) => {
    const devices = await _android.devices();
    if (!devices.length) throw new Error('No Android emulator is running (setup problem, PLT-122): see tests/android/README.md');
    const device = devices[0]!;
    // `adb reverse` is a command for adb on this computer, not a shell command on the phone: the app server on this
    // computer's port becomes the emulator's localhost. Without it every page load is refused (setup problem, PLT-122).
    try {
      execFileSync('adb', ['-s', device.serial(), 'reverse', `tcp:${PORT}`, `tcp:${PORT}`], { stdio: 'ignore' });
    } catch {
      throw new Error(`Could not forward port ${PORT} to the emulator with adb reverse (setup problem, PLT-122)`);
    }
    // Chrome's first-run screens would sit in front of the page.
    await device.shell('echo "chrome --disable-fre --no-default-browser-check --no-first-run" > /data/local/tmp/chrome-command-line');
    await device.shell('am set-debug-app --persistent com.android.chrome');
    await device.shell('settings put global stay_on_while_plugged_in 0');
    await use(device);
    await device.shell('wm size reset; wm density reset');
    await device.close();
  }, { scope: 'worker' }],
  screen: ['standard', { option: true }],
  context: async ({ device, screen }, use) => {
    const s = SCREENS[screen];
    await device.shell(`wm size ${s.width * 3}x${s.height * 3}; wm density 480`);
    await device.shell('am force-stop com.android.chrome; pm clear com.android.chrome');
    await device.shell('echo "chrome --disable-fre --no-default-browser-check --no-first-run" > /data/local/tmp/chrome-command-line');
    // A phone has a touch screen: taps are real touch events (TAM-116).
    const context = await device.launchBrowser({ baseURL: APP_URL, hasTouch: true });
    await use(context);
    await context.close().catch(() => undefined);
  },
  page: async ({ context }, use) => {
    await new Promise((r) => setTimeout(r, 1500));
    const page = context.pages()[0] ?? (await context.newPage());
    await use(page);
  },
});
