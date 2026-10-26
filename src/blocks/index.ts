// Shared screen building blocks (src/blocks/README.md). Games and the app import them from here; blocks import nothing
// from a game or the app. The stylesheet loads once, before any game's own stylesheet.
import './blocks.css';

export { TAP_GUARD_MS, TapGuard, useTapGuard } from './tapGuard';
export { HideMainButton, MainButton, OptionButton, QuietButton } from './buttons';
export { Toast, useToast, type ToastState } from './toast';
export { Dialog, Sheet, useBackCloses } from './overlays';
export { BlocksRoot, Screen, ScreenContent, ScrollArea } from './screen';
export { keepNames } from './names';
