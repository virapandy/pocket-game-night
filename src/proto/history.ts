// The prototype's browser Back, the same for every game: Back on an open menu only closes it, and a dialog (or a menu)
// that is left forward is not a history step, so Back never reopens it. Each screen is otherwise its own history step.
import { useEffect, useRef, useState } from 'react';

/** The menu is open and has its own history step (so Back closes it and goes no further). */
let menuEntry = false;
/** The next hash change replaces the current step instead of adding one ('dialog') or comes from a menu ('menu'). */
let pending: 'dialog' | 'menu' | null = null;

export const hashId = () => decodeURIComponent(location.hash.slice(1));

/**
 * Opens a screen. `fromDialog`: the screen being left is a dialog (or sheet), so its step is replaced, not kept.
 * An open menu's step is replaced the same way.
 */
export function navigate(to: string, fromDialog = false) {
  if (to === hashId()) {
    // Already there: only an open menu's step has to go.
    if (menuEntry) {
      menuEntry = false;
      history.back();
    }
    return;
  }
  pending = menuEntry ? 'menu' : fromDialog ? 'dialog' : null;
  menuEntry = false;
  if (pending) location.replace(`#${to ? encodeURIComponent(to) : ''}`);
  else location.hash = to;
}

/** What the last `navigate` asked for; read once by the hash-change handler. */
export function takePending() {
  const p = pending;
  pending = null;
  return p;
}

/** A visited step whose dialog was left forward is kept in the list, marked, so Back can step over it. */
const DEAD = '~';
export const stepId = (v: string | undefined) => (v ?? '').replace(/^~/, '');

/**
 * A dialog is being left forward to a screen: the dialogs it was opened over (D1 under D7) are closed too, so Back
 * must not stop on them. Marks them; `trackVisit` steps over them.
 */
export function retireDialogs(visited: string[], isDialog: (id: string) => boolean) {
  for (let i = visited.length - 2; i >= 0 && isDialog(stepId(visited[i])); i--) visited[i] = DEAD + stepId(visited[i]);
}

/**
 * Keeps the step list of visited screens: a push, a replace of the top, or a step back. Returns 'skip' when a step
 * back landed on a closed dialog, which has already been asked to go back once more.
 */
export function trackVisit(visited: string[], next: string, how: 'dialog' | 'menu' | null): 'skip' | 'ok' {
  if (how === 'dialog') visited[visited.length - 1] = next;
  else if (how === null && stepId(visited[visited.length - 2]) === next) {
    visited.pop();
    if ((visited[visited.length - 1] ?? '').startsWith(DEAD) && visited.length > 1) {
      history.back();
      return 'skip';
    }
  } else visited.push(next);
  return 'ok';
}

/** The phone's Back from a screen button: one step, two when a menu's own step is on top. */
export function goBack() {
  if (menuEntry) {
    menuEntry = false;
    history.go(-2);
  } else history.back();
}

/** A hash edited by hand drops a menu step that was left open. */
export const forgetMenu = () => {
  menuEntry = false;
};

/** `[open, setOpen]` for a menu: opening takes a history step, so Back closes the menu and stays on the screen. */
export function useMenu(): [boolean, (open: boolean) => void] {
  const [open, setOpen] = useState(false);
  const isOpen = useRef(false);
  isOpen.current = open;
  useEffect(() => {
    const onPop = () => {
      if (isOpen.current) {
        menuEntry = false;
        setOpen(false);
      }
    };
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
  }, []);
  const set = (next: boolean) => {
    if (next) {
      if (!menuEntry) {
        history.pushState({ protoMenu: true }, '');
        menuEntry = true;
      }
      setOpen(true);
      return;
    }
    if (!isOpen.current) return;
    setOpen(false);
    // Closed by a button: give its step back, unless a tap in the same breath already left the screen.
    queueMicrotask(() => {
      if (menuEntry) {
        menuEntry = false;
        history.back();
      }
    });
  };
  return [open, set];
}
