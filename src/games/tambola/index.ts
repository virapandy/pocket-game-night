// Tambola's registration: the only file other code may import from this game.
import type { GameInfo } from '../../engine';
import { tambolaRules } from './rules';
import { hasPhoneTickets, PhoneTickets, SavedTickets } from './ui/PhoneTickets';
import { describeGame } from './ui/saved';
import { TambolaPastGame, TambolaScreen } from './ui/TambolaScreen';

export {
  tambolaRules,
  tambolaDefaults,
  suggestTiers,
  planPrizes,
  pickRhyme,
  rhymePack,
  checkNumbers,
  PATTERNS,
  PATTERN_NAMES,
  NEEDS,
  makeTickets,
  ticketInfo,
  encodeTicket,
  decodeTicket,
  typedCode,
  decodeTypedCode,
  encodeClaim,
  decodeClaim,
  readClaim,
} from './rules';
export type {
  Pattern,
  TambolaConfig,
  TambolaMove,
  TambolaSettings,
  TambolaState,
  TambolaSummary,
  TambolaView,
  ClaimView,
  CheckResult,
  Payout,
  Rhyme,
  RhymePack,
  Ticket,
  TicketInfo,
  ClaimInfo,
  TicketView,
} from './rules';

export const tambolaInfo: GameInfo = {
  id: 'tambola',
  title: 'Tambola',
  tagline: 'Housie for the whole room. The anchor calls, everyone shouts.',
};

export const tambola = {
  info: tambolaInfo,
  Screen: TambolaScreen,
  PastGame: TambolaPastGame,
  describe: describeGame,
  rules: tambolaRules,
  /**
   * Phase 2: a player's phone. The ticket QR is a link to the app with `#t=` and the ticket after it (TAM-117);
   * the app opens `Screen` with that text, or with `enter` to type a ticket code. `SavedTickets` is Home's row of
   * tickets more than 6 hours old (PLT-300).
   */
  phone: { linkKey: 't', Screen: PhoneTickets, hasTickets: hasPhoneTickets, SavedTickets },
};
