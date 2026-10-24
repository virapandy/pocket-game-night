// What Am I?'s pure rules module (specs/what-am-i/api.md).
export { whatAmIRules, wordText, validChoices, playersProblem, toPlayOf, currentPlayer, resultOf, tonightOf, MIN_PLAYERS, MAX_PLAYERS } from './rules';
export { WORDS, whatAmIEdition, wordsAtEdition, eligible, packCount, queueFor, headOf, packOf, wordById, fallbackWords, buildUnshown } from './queue';
export * from './marking';
export { whereLine, homeLine1, homeLine2, clockText, playersShort, joinNames, tipLine, type PhoneTips } from './text';
export { readWhatAmINight, type WhatAmINight } from './saved';
export * from './types';
