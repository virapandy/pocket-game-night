// R1 Round over, G1 Game over and G2 Tonight's summary (lane W4): WAI-032, WAI-033, WAI-060 to WAI-064. They get their frame
// (menu, Pause, dialogs, toasts) from Frame.tsx through `StepProps`.
import { useState } from 'react';
import { QuietButton, Screen, ScrollArea } from '../../../blocks';
import { joinNames, wordById } from '../rules';
import type { StepProps } from './Frame';
import { GameMenu, HomeButton, Main, Scoreboard, WaiDialog } from './parts';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const words = (n: number) => plural(n, 'word', 'words');

/** Each word once, in the order first shown (product owner 25 October, item 30). */
const once = (list: readonly string[]) => list.filter((w, i) => list.indexOf(w) === i);

/** "Penguin, Zebra and 3 more": at most 5 words, then "and N more" (no comma before "and"). */
export function nobodyGot(ids: readonly string[], list: Parameters<typeof wordById>[0]): string | null {
  const all = once(ids.map((id) => wordById(list, id)?.word ?? id));
  if (all.length === 0) return null;
  if (all.length <= 5) return `Words nobody got: ${all.join(', ')}`;
  return `Words nobody got: ${all.slice(0, 5).join(', ')} and ${all.length - 5} more`;
}

/** R1 (WAI-032, WAI-033): the round's scoreboard and the next round. */
export function RoundOverScreen(p: StepProps) {
  const done = p.state.round - 1;
  const nobody = nobodyGot(p.view.passedByRound[done - 1] ?? [], p.state.words);
  return (
    <Screen className="wai-game wai-round">
      <header className="wai-bar">
        <HomeButton onClick={p.onHome} />
        {p.top}
      </header>
      {p.welcome}
      <ScrollArea>
        <h1 className="pgn-title">{`Round ${done} done. Round ${done + 1} next.`}</h1>
        <Scoreboard rows={p.view.scoreboard} />
        {nobody && <p className="wai-body">{nobody}</p>}
        <p className="wai-small">Play as many rounds as you like; tap End the game to see who got the most.</p>
        <div className="wai-stack">
          <QuietButton onClick={p.openPlayers}>{`Players (${p.view.order.length}) ›`}</QuietButton>
          <QuietButton onClick={p.onChangeSetup}>Change players or words</QuietButton>
          <QuietButton onClick={p.openEndGame}>End the game</QuietButton>
        </div>
      </ScrollArea>
      <Main guardKey={`${p.state.game}:${p.state.round}:R1`} onClick={() => p.setUi({ roundStarted: `${p.state.game}:${p.state.round}` })}>
        {`Round ${done + 1}`}
      </Main>
    </Screen>
  );
}

/** G1 (WAI-061, WAI-062): the winner, the game's lines and what next. */
export function GameOverScreen(p: StepProps) {
  const r = p.view.result;
  const winners = r?.winners ?? [];
  const turns = r?.turns ?? 0;
  const title =
    turns === 0
      ? 'Game ended. No turns played.'
      : winners.length === 0
        ? 'Nobody got a word this game!'
        : winners.length === 1
          ? `${winners[0]} wins with ${r!.top}!`
          : `${joinNames(winners)} share the win with ${r!.top}!`;
  const best = r?.bestTurn && r.bestTurn.got > 0 ? `Best turn: ${r.bestTurn.player}, ${words(r.bestTurn.got)}` : null;
  const nobody = turns > 0 ? nobodyGot(r?.passed ?? [], p.state.words) : null;
  const record = [
    r && r.moved > 0 ? `Moved after time's up: ${words(r.moved)}` : null,
    r && r.endedEarly > 0 ? `Turns ended early: ${r.endedEarly}` : null,
  ].filter((x): x is string => x !== null);
  const wins = p.view.tonight.wins;
  const tally = wins.length > 0 ? `Tonight: ${wins.map((w) => `${w.player} ${plural(w.wins, 'win', 'wins')}`).join(' · ')}` : null;
  // "Play again" needs two players still in the game; with fewer it opens the setup screens instead.
  const again = () => {
    const choices = p.state.choices;
    if (choices && p.state.order.length >= 2 && p.act({ type: 'start', players: [...p.state.order], choices })) return;
    p.onChangeSetup();
  };
  return (
    <Screen className="wai-game wai-over">
      <header className="wai-bar">
        <QuietButton onClick={p.onHome}>← Home</QuietButton>
        {p.top}
      </header>
      {p.welcome}
      <ScrollArea>
        <h1 className="pgn-title">{title}</h1>
        {turns > 0 && <Scoreboard rows={p.view.scoreboard} />}
        {best && <p className="wai-body">{best}</p>}
        {nobody && <p className="wai-body">{nobody}</p>}
        {record.length > 0 && <p className="wai-small">{record.join(' · ')}</p>}
        {tally && <p className="wai-body wai-strong">{tally}</p>}
        <div className="wai-stack">
          <QuietButton onClick={p.onChangeSetup}>Change players or words</QuietButton>
          <QuietButton onClick={p.openEndTonight}>End for tonight</QuietButton>
        </div>
      </ScrollArea>
      <Main guardKey={`${p.state.game}:G1`} onClick={again}>
        Play again
      </Main>
    </Screen>
  );
}

/** G2 (WAI-064): tonight's summary; the menu has only "Delete tonight's games". */
export function SummaryScreen(p: StepProps) {
  const [deleting, setDeleting] = useState(false);
  const t = p.view.tonight;
  const wins = t.wins.length > 0 ? `Wins: ${t.wins.map((w) => `${w.player} ${w.wins}`).join(' · ')}` : 'No wins yet';
  const best = t.best && t.best.got > 0 ? `Best guesser tonight: ${joinNames(t.best.players)} (${words(t.best.got)})` : null;
  return (
    <Screen className="wai-game wai-summary">
      <header className="wai-bar wai-bar-end">
        <div className="wai-top">
          <GameMenu items={[{ label: "Delete tonight's games", onSelect: () => setDeleting(true) }]} />
        </div>
      </header>
      <ScrollArea>
        <h1 className="pgn-title">Tonight's What Am I?</h1>
        <p className="wai-body">{`${plural(t.players.length, 'player', 'players')} · ${plural(t.games, 'game', 'games')} · ${words(t.got)} got`}</p>
        <p className="wai-body wai-strong">{wins}</p>
        {best && <p className="wai-body">{best}</p>}
        <div className="wai-stack">
          <QuietButton onClick={p.keepPlaying}>Oops, keep playing</QuietButton>
          <QuietButton onClick={p.onHome}>← Home</QuietButton>
        </div>
      </ScrollArea>
      <Main guardKey={`${p.state.game}:G2`} onClick={() => p.onSomethingElse([...p.state.order])}>
        Play something else
      </Main>
      {deleting && (
        <WaiDialog title="Delete tonight's games?" onDismiss={() => setDeleting(false)}>
          <p className="wai-body">The games and tally will be lost.</p>
          <div className="wai-dialog-buttons">
            <QuietButton onClick={p.deleteNight}>Delete</QuietButton>
            <Main inline onClick={() => setDeleting(false)}>
              Keep it
            </Main>
          </div>
        </WaiDialog>
      )}
    </Screen>
  );
}
