// Every on-screen string of Mafia's morning, day, vote and results screens (M1, Y1, V1–V4, G1, G2, History), from
// docs/games/mafia/text.csv (keys mf.m1, mf.y1, mf.v1–v4, mf.d-nobody, mf.g1, mf.g2, mf.history) and the Canonical strings
// of specs/mafia/README.md. Where the two differ, the scenarios and tests win. Names are as typed; capitals are CSS only.
import type { Role } from "../rules";
import { T } from "./text";

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;
/** "Kabir", "Kabir or Om", "Kabir, Om or Riya". */
export const orList = (names: readonly string[]) =>
  names.length <= 1
    ? (names[0] ?? "")
    : `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}`;
/** "Kabir", "Kabir and Om", "Kabir, Om and Riya". */
export const andList = (names: readonly string[]) =>
  names.length <= 1
    ? (names[0] ?? "")
    : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

export const D = {
  // mf.m1.*, mf.v4.2–5 (the role line on M1 and V4)
  was: (name: string, r: Role) =>
    r === "mafia"
      ? `${name} was MAFIA!`
      : r === "villager"
        ? `${name} was a Villager.`
        : `${name} was the ${T.role[r]}.`,
  count: (left: number, caught: number, of: number) =>
    `${plural(left, "player", "players")} left · Mafia caught: ${caught} of ${of}`,
  m1: {
    title: (r: number) => `Morning, day ${r}`,
    seeRole: "See my role again",
    endGame: "End the game",
    talk: "Start talking",
    seeWho: "See who won",
    breakLine: "Back after a break? Everyone can see their role again.",
  },
  // mf.y1.*
  y1: {
    title: (r: number) => `Day ${r} · Talk it over`,
    still: "Who's still in",
    out: (name: string, r: Role, how: "night" | "vote", round: number) =>
      `${name} · ${T.role[r]} · ${how === "night" ? `out night ${round}` : `voted out day ${round}`}`,
    left: (name: string) => `${name} · left`,
    watch: "Out players: watch quietly, no hints!",
    timer: "Start a 2-minute timer",
    stop: "Stop timer",
    timesUp: "Time's up!",
    vote: "Time to vote",
  },
  // mf.v1.*
  v1: {
    heading: "Everyone in, point at who you think is Mafia.",
    only: (names: readonly string[]) => `Point only at ${orList(names)}`,
    steps: ["3", "2", "1", "Point!"],
    notYet: "Not yet",
  },
  // mf.v2.*, mf.v3.*
  v2: {
    title: "Who got the most fingers?",
    notSure: "Not sure?",
    tie: "It's a tie",
    again: "Count again",
    nobody: "Nobody today",
    back: "← Back to talking",
    voteOut: "Vote out",
    vote: (name: string) => `Vote ${name} out`,
  },
  v3: {
    title: "Tap everyone who is tied",
    notTie: "Not a tie",
    point: "Point again",
    pointAt: (names: readonly string[]) => `Point again: ${orList(names)}`,
    still: "Still a tie",
    stillTitle: "Still a tie. Nobody is out today.",
    night: (r: number) => `Start night ${r}`,
  },
  // mf.d-nobody.*
  nobody: {
    ask: "Nobody out today?",
    body: (r: number) => `Nobody goes out today. Straight to night ${r}.`,
    yes: "Nobody today",
    no: "Back to the vote",
  },
  // mf.v4.1 (the name in capitals by CSS)
  v4: { out: " is out." },
  // mf.g1.*
  g1: {
    village: "The Village wins!",
    villageLine: "Every Mafia is out.",
    mafia: "The Mafia win!",
    mafiaLine: "They're as many as everyone else.",
    none: "Game ended. No winner.",
    hadToLeave: (names: readonly string[]) => `${andList(names)} had to leave.`,
    whoWasWho: "Who was who",
    row: (name: string, r: Role, status: string) =>
      `${name} · ${T.role[r]} · ${status}`,
    inToEnd: "in to the end",
    left: "left",
    outNight: (r: number) => `out night ${r}`,
    votedOut: (r: number) => `voted out day ${r}`,
    each: "What happened each night",
    night: (r: number, clauses: readonly string[]) =>
      `Night ${r}: ${clauses.join(" · ")}`,
    mafiaPicked: (names: readonly string[]) =>
      `the Mafia picked ${andList(names)}`,
    phoneChose: (names: readonly string[], chosen: string) =>
      `the Mafia picked ${andList(names)}; the phone chose ${chosen}`,
    mafiaNone: "the Mafia made no pick",
    protected: (name: string) => `the Doctor protected ${name}`,
    protectedSelf: "the Doctor protected themselves",
    checked: (name: string, mafia: boolean) =>
      `the Police checked ${name} (${mafia ? "Mafia" : "Not Mafia"})`,
    wasOut: (name: string) => `${name} was out`,
    nobodyOut: "nobody was out",
    nightLeft: (name: string) => `${name} left`,
    spotter: (name: string, n: number, of: number) =>
      `Best Mafia spotter: ${name} picked a Mafia ${n} nights out of ${of}`,
    ghost: (name: string) => `Best ghost guess: ${name}`,
    tally: (v: number, m: number) => `Tonight: Village ${v} · Mafia ${m}`,
    change: "Change players or roles",
    endTonight: "End for tonight",
    again: "Play again",
  },
  // mf.g2.*; D9 as Secret Words' (SWD-065, MAF-064 item 29)
  g2: {
    title: "Tonight's Mafia",
    count: (players: number, games: number) =>
      `${plural(players, "player", "players")} · ${plural(games, "game", "games")}`,
    score: (v: number, m: number) => `Village ${v} · Mafia ${m}`,
    mostMafia: (name: string, n: number) => `${name} was Mafia in ${n} games`,
    spotter: (name: string) => `Best Mafia spotter tonight: ${name}`,
    oops: "Oops, keep playing",
    elsewhere: "Play something else",
    delete: "Delete tonight's games",
    deleteAsk: "Delete tonight's games? The games and tally will be lost.",
    deleteYes: "Delete",
    deleteNo: "Keep it",
  },
  // mf.history.*
  history: {
    row: (time: string, players: number, result: string, nights: number) =>
      `Mafia · ${time} · ${plural(players, "player", "players")} · ${result} · ${plural(nights, "night", "nights")}`,
    village: "The Village won",
    mafia: "The Mafia won",
    ended: "Game ended",
  },
} as const;
