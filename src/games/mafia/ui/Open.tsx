// Mafia outside its own screens: Home's unfinished row (MAF-091) and the shared Start new dialog (MAF-001, as SWD-115).
import { BlocksRoot, QuietButton } from '../../../blocks';

/** Home's row: one button of two lines, "Mafia · Night 2 · Meena's turn with the phone" / "Riya, Arjun +7 · 9:10 pm · Tap to resume". */
export function NightRowButton({ row, onClick }: { row: { line1: string; line2: string }; onClick: () => void }) {
  return (
    <button type="button" className="maf-night-row" onClick={onClick}>
      <span className="maf-row-line">{row.line1}</span>
      <span>{row.line2}</span>
    </button>
  );
}

/** "Start a new game night?": two equal quiet buttons, no main button. */
export function StartNewNightDialog({ text, onCarryOn, onStartNew }: { text: string; onCarryOn: () => void; onStartNew: () => void }) {
  return (
    <BlocksRoot className="maf">
      <div className="maf-backdrop">
        <div className="maf-dialog" role="dialog" aria-modal="true" aria-labelledby="maf-start-new">
          <h1 id="maf-start-new" className="maf-dialog-title">
            Start a new game night?
          </h1>
          <p className="maf-body">{text}</p>
          <div className="maf-equal">
            <QuietButton onClick={onCarryOn}>Carry on that one</QuietButton>
            <QuietButton onClick={onStartNew}>Start new (ends that one)</QuietButton>
          </div>
        </div>
      </div>
    </BlocksRoot>
  );
}
