// Tambola's pure rules module: the contract answers, prizes, rhymes and (Phase 2) phone tickets.
export { tambolaRules, tambolaDefaults } from './rules';
export { suggestTiers, planPrizes, apportion, type PlanInput, type PrizePlan } from './prizes';
export { pickRhyme, rhymePack } from './rhymes';
export { checkNumbers, type CheckResult } from './check';
export { makeTickets, numbersOn, rowNumbers, cornerNumbers, type Ticket, type Rows, type Cell } from './tickets';
export {
  gameCode,
  typedCode,
  decodeTypedCode,
  ticketInfo,
  encodeTicket,
  decodeTicket,
  encodeClaim,
  decodeClaim,
  readClaim,
  CODE_ALPHABET,
  type TicketInfo,
  type ClaimInfo,
} from './codes';
export * from './types';
