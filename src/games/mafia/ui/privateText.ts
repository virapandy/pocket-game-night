// The words of Mafia's deal and night screens (B1, B2, D5, N0–N3), from docs/games/mafia/text.csv (keys mf.b1.*, mf.b2*,
// mf.d5.*, mf.n0.* to mf.n3.*) and specs/mafia/02-deal.md and 03-night.md (version 1.1). Names are written as typed; a name
// in capitals (RIYA, "Arjun's pick: KABIR") is upper case by CSS only.
import type { Role } from '../rules';

/** "Zoya", "Zoya and Dev", "Zoya, Dev and Om". */
export const andList = (names: readonly string[]) =>
  names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

export const P = {
  // B1, N1 pass screens (mf.b1.*, mf.n1.*)
  dealProgress: (i: number, of: number) => `Player ${i} of ${of}`,
  nightProgress: (r: number, i: number, of: number) => `Night ${r} · ${i} of ${of}`,
  passTo: 'Pass the phone to',
  lookAway: 'Everyone else, look away!',
  imMe: (name: string) => `I'm ${name}`,
  outLine: "You're out: pick who you think is Mafia.",
  // B2 role card (mf.b2.*)
  tapInstead: 'Tap instead',
  hold: 'Hold here to see your role',
  tapSee: 'Tap to see',
  tapHide: 'Tap to hide',
  notMe: (name: string) => `Not ${name}? ← Back`,
  someoneSaw: 'Someone saw my role',
  passOn: (name: string) => `Done, pass to ${name}`,
  allSeen: "Done, everyone's seen",
  backToDay: 'Done, back to the day',
  firstTime: 'First time? What this role means',
  hideThis: 'Hide this',
  // N0 (mf.n0.*)
  night: (r: number) => `Night ${r}`,
  nightLine: 'Pass the phone round once more. Everyone does the same: tap to see your night job, pick one name, tap Done, pass it on.',
  faceStill: 'Keep your face still!',
  startNight: 'Start the night',
  // N2 (mf.n2.*)
  seeJob: 'Tap to see your night job',
  nightOver: 'Done, night over',
  // N3 (mf.n3.*)
  overTitle: 'Night over.',
  overLine: 'Host, take the phone and read the morning aloud.',
  readMorning: 'Read the morning',
} as const;

/** MAF-011: the role word (in capitals by CSS) and the two lines under it; the Mafia's line 1 is the partner line. */
export const CARD: Record<Role, { word: string; lines: [string, string] }> = {
  mafia: { word: 'Mafia', lines: ['', 'At night, you pick who goes out. By day, act like a Villager.'] },
  doctor: { word: 'Doctor', lines: ['At night, pick someone to protect from the Mafia.', 'Yourself once a game. Never the same person two nights running.'] },
  police: { word: 'Police', lines: ['At night, check one person.', 'The phone tells only you: Mafia or Not Mafia.'] },
  villager: { word: 'Villager', lines: ['You have no night power.', 'By day, talk, watch and find the Mafia.'] },
};

/** MAF-012: "First time? What this role means", three lines per role. */
export const FIRST_TIME: Record<Role, [string, string, string]> = {
  mafia: ['Your side wins when the Mafia are as many as everyone else.', 'At night, pick who goes out.', 'By day, join in and point at others. Stay calm!'],
  doctor: ['Your side wins when every Mafia is out.', 'At night, protect one person.', "If you protect the Mafia's pick, nobody goes out."],
  police: ['Your side wins when every Mafia is out.', 'At night, check one person.', 'You choose whether to tell the room what you found.'],
  villager: ['Your side wins when every Mafia is out.', 'At night, pick who you think is Mafia. Only you see it.', 'By day, listen, ask questions and vote.'],
};

/**
 * MAF-011 / MAF-015 (item 20): the Mafia card's line 1. `partners` = the other Mafia dealt this game (seat order); `out` and
 * `left` = which of them are out or have left.
 */
export function partnerLine(partners: readonly string[], out: readonly string[], left: readonly string[]): string {
  if (partners.length === 0) return 'You are the only Mafia.';
  const outs = partners.filter((p) => out.includes(p));
  const lefts = partners.filter((p) => left.includes(p) && !out.includes(p));
  const still = partners.filter((p) => !outs.includes(p) && !lefts.includes(p));
  const gone = [
    outs.length > 0 ? `${andList(outs)} ${outs.length === 1 ? 'is' : 'are'} out` : '',
    lefts.length > 0 ? `${andList(lefts)} ${lefts.length === 1 ? 'has' : 'have'} left` : '',
  ]
    .filter(Boolean)
    .join(' and ');
  if (still.length === 0) return `${gone}. You're the only Mafia left.`;
  const team = still.length === 1 ? `You and ${still[0]} are the Mafia.` : `You, ${andList(still)} are the Mafia.`;
  return gone ? `${team} ${gone}.` : team;
}

/** N2 job lines (MAF-023 to MAF-026); the role word is upper case in the text itself (text.csv). */
export const JOB = {
  mafiaFirst: (see: readonly string[]) =>
    see.length > 0 ? `MAFIA · Pick who goes out tonight. ${andList(see)} will see your pick.` : 'MAFIA · Pick who goes out tonight.',
  /** "MAFIA · Arjun's pick: KABIR. Tap Kabir to agree, or pick someone else." in three parts (KABIR in capitals by CSS). */
  mafiaLater: (by: string, target: string) => [`MAFIA · ${by}'s pick: `, target, `. Tap ${target} to agree, or pick someone else.`] as const,
  doctor: 'DOCTOR · Pick someone to protect tonight.',
  police: 'POLICE · Pick someone to check.',
  policeNone: 'POLICE · Nobody left to check.',
  villager: 'VILLAGER · Who do you think is Mafia? Think, then pick. Only you see this.',
  ghost: "YOU'RE OUT · Ghost guess: who's Mafia? Pick one.",
} as const;

/** N2 result lines (MAF-023 to MAF-026). */
export const RESULT = {
  mafiaFirst: (pick: string, see: readonly string[]) => (see.length > 0 ? `${pick}. ${andList(see)} can agree or change it.` : `${pick}.`),
  mafiaAgree: (pick: string) => `${pick}. You agree.`,
  mafiaDiffer: (pick: string) => `${pick}. If the Mafia's picks differ, the phone picks one of them at random.`,
  doctor: (pick: string) => `${pick} is protected tonight.`,
  doctorSelf: 'You are protected tonight.',
  police: (pick: string, mafia: boolean) => (mafia ? `${pick}: MAFIA.` : `${pick}: Not Mafia.`),
  /** Version 1.2 A: a Police with nobody left to check taps any name. */
  policeNone: 'Nobody left to check.',
  villager: (pick: string) => `You think it's ${pick}. At the end we'll see if you were right.`,
  ghost: (pick: string) => `Your guess: ${pick}.`,
} as const;
