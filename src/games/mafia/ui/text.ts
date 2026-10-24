// Every on-screen string of Mafia's setup and room frame, from docs/games/mafia/text.csv (keys `mf.*`, product owner,
// 25 October 2026) and the Canonical strings of specs/mafia/README.md. Where the two differ, the scenarios and tests win.
// Names are written as typed; names in capitals (RIYA) are upper case by CSS only.

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const T = {
  // S1 Who's playing? (mf.s1.*)
  s1: {
    title: "Who's playing?",
    count: (n: number) => plural(n, 'player', 'players'),
    tooFew: 'Mafia needs at least 5 players.',
    tooMany: 'Up to 16 players.',
    twice: (name: string) => `${name} is already playing. Add an initial, like ${name} S.`,
    removed: (name: string) => `${name} removed · Undo`,
    howToPlay: 'How to play',
    back: '← Back',
    backToGame: '← Back to the game',
    next: 'Next',
    field: 'Player name',
    add: 'Add',
    remove: (name: string) => `Remove ${name}`,
  },
  // S2 Roles (mf.s2.*)
  s2: {
    title: (n: number) => `Roles for ${n} players`,
    mafia: (m: number) => `Mafia: ${m}`,
    fewer: 'Fewer Mafia',
    more: 'More Mafia',
    suggest: (s: number, n: number) => `We suggest ${s} for ${n} players.`,
    doctor: 'Doctor: 1',
    police: 'Police: 1',
    villagers: (v: number) => `Villagers: ${v}`,
    five: 'With 5 players: 1 Mafia and 4 Villagers. Doctor and Police join at 6.',
    rules: [
      'Night comes first.',
      'The Doctor can protect themselves once a game, never the same person two nights running.',
      'The Police learns only Mafia or Not Mafia.',
      'A tie: point again once, then nobody is out.',
      'A player who goes out shows their role.',
    ],
    main: 'Give everyone a role',
  },
  // S3 Read this aloud (mf.s3.*)
  s3: {
    title: 'Read this aloud',
    card: (m: number) =>
      `${m === 1 ? '1 of us is' : `${m} of us are`} secretly the Mafia. Everyone else is the Village. At night we pass the phone ` +
      'round and everyone does the same thing, so nobody can tell who is who. Each morning the phone tells us what happened, ' +
      'then we talk and vote someone out. The Village wins by finding every Mafia. The Mafia win when they are as many as ' +
      'everyone else.',
    main: 'Pass the phone round',
  },
  // S4 How to play (mf.s4.*; the seven steps of guide.md "How to play", MAF-006)
  s4: {
    title: 'How to play',
    steps: [
      "Type everyone's names. The phone says how many Mafia there will be.",
      'Pass the phone round. Each player looks at their role, taps Done and passes it on. The Mafia also see who the other Mafia are.',
      'Night: pass the phone round once more. Everyone taps to see their night job, picks one name and taps Done. The Mafia pick who goes out, the Doctor who to protect, the Police who to check. Villagers pick who they think is Mafia.',
      "Morning: the host reads the phone's short story aloud: who is out, or that the Doctor saved someone.",
      'Day: talk it over. Then 3, 2, 1, point! The host taps the player with the most fingers. A tie: point again once, then nobody is out. You can also choose Nobody today.',
      'The player voted out shows their role. If that ends the game, the phone says who won. If not, night comes again.',
      'Game over: every role is shown, with what happened each night. Play again with new roles.',
    ],
    peek: "Saw someone's screen? Keep it to yourself and carry on. Before the first night, Deal again instead.",
    done: 'Done',
  },
  // Where-lines (MAF-090, item 3)
  where: {
    deal: (name: string) => `Dealing roles · ${name}'s turn with the phone`,
    nightStart: (r: number) => `Night ${r} · starting`,
    nightTurn: (r: number, name: string) => `Night ${r} · ${name}'s turn with the phone`,
    nightOver: (r: number) => `Night ${r} · over`,
    morning: (r: number) => `Morning, day ${r}`,
    talking: (r: number) => `Day ${r} · talking`,
    vote: (r: number) => `Day ${r} · vote`,
    afterVote: (r: number) => `Day ${r} · after the vote`,
    gameOver: (k: number) => `Game over, game ${k}`,
  },
  // Menu (mf.menu.*, MAF-053)
  menu: {
    button: '··· Menu',
    name: 'Menu',
    how: 'How to play',
    players: 'Players',
    seeRole: 'See my role again',
    dealAgain: 'Deal again',
    pause: 'Pause',
    home: 'Home (game is saved)',
    endGame: 'End the game',
    endTonight: 'End for tonight',
    settings: 'Settings',
    history: 'History',
    close: 'Close',
  },
  // Paused cover and "Welcome back." (mf.d-pause.*)
  pause: {
    title: 'Paused',
    line: "Tap Carry on when everyone's back.",
    carryOn: 'Carry on',
    button: 'Pause',
    welcome: 'Welcome back.',
  },
  // Players and leave dialogs (mf.d-leave.*, MAF-051, MAF-052)
  leave: {
    title: 'Players',
    done: 'Done',
    ask: (name: string) => `${name} has to leave?`,
    day: (name: string) => `${name} goes out now. Their role stays secret until the game ends.`,
    night: (name: string) => `${name} leaves when this night is over. Their role stays secret until the game ends.`,
    deal: (name: string) => `${name} leaves. Everyone gets a new role without ${name}.`,
    yes: (name: string) => `${name} leaves`,
    no: (name: string) => `Don't remove ${name}`,
    toast: (name: string) => `${name} left · Undo`,
    ok: 'OK',
    tooFew: 'Mafia needs at least 5 players.',
    joins: (name: string) => `${name} · joins next game`,
    left: (name: string) => `${name} · left`,
  },
  // End the game (mf.d-end.*, MAF-054)
  end: {
    ask: 'End this game with no winner?',
    body: "Everyone's role will be shown.",
    yes: 'End the game',
    no: 'Keep playing',
    toast: 'Game ended · Undo',
  },
  // End for tonight (mf.d-tonight.*, MAF-063)
  tonight: {
    ask: 'End for tonight?',
    over: "Tonight's score stays in History.",
    midGame: "Tonight's score stays in History. This game won't count for either side.",
    yes: 'End for tonight',
    no: 'Keep playing',
  },
  // Deal again (mf.d-deal-again.*, MAF-014)
  dealAgain: {
    ask: 'Deal again?',
    body: 'Everyone gets a new role.',
    yes: 'Deal again',
    no: 'Keep these roles',
  },
  home: '← Home',
  // Roles on screen (Terms)
  role: { mafia: 'Mafia', doctor: 'Doctor', police: 'Police', villager: 'Villager' } as const,
} as const;
