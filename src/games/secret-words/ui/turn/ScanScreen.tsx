// S7, the scan screen (SWD-033, 116 board check, 104 Do Not Disturb tip, 117 the QR), and S7a, the same screen opened by
// "Show the map code again" (SWD-129: no menu, no tip, main "Back to the game").
import qrcode from 'qrcode-generator';
import { useMemo, type ReactNode } from 'react';
import { useViewport } from '../shared/device';
import { SwMain } from '../shared/guard';
import type { MenuItem } from '../shared/parts';
import { TopActions } from './chrome';

/** The map code as shown: `XXX-XXXX`. */
export const shownCode = (code: string) => `${code.slice(0, 3)}-${code.slice(3)}`;

/** A square QR code drawn as SVG with a quiet border; the `img` is `map-qr`, named "Map code 27P-3QX8". */
function MapQr({ text, size, code }: { text: string; size: number; code: string }) {
  const path = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(text, 'Byte');
    qr.make();
    const n = qr.getModuleCount();
    let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + 4} ${r + 4}h1v1h-1z`;
    return { d, n: n + 8 };
  }, [text]);
  return (
    <svg
      className="sw-qr"
      data-testid="map-qr"
      viewBox={`0 0 ${path.n} ${path.n}`}
      width={size}
      height={size}
      role="img"
      aria-label={`Map code ${shownCode(code)}`}
      shapeRendering="crispEdges"
    >
      <rect width={path.n} height={path.n} fill="#fff" />
      <path d={path.d} fill="#000" />
    </svg>
  );
}

export function ScanScreen({
  giverLine,
  three,
  qrText,
  code,
  check,
  dnd,
  paused,
  mainText,
  guardUntil,
  onMain,
  onPause,
  menu,
  covered,
}: {
  giverLine: string;
  three: boolean;
  qrText: string;
  code: string;
  check: string;
  dnd: boolean;
  /** While paused the QR is removed from the DOM (SWD-033, 110). */
  paused: boolean;
  mainText: string;
  guardUntil: number;
  onMain: () => void;
  /** Absent on "Show the map code again" (no menu, no Pause). */
  onPause?: () => void;
  menu?: readonly (readonly MenuItem[])[];
  covered: boolean;
}) {
  const vp = useViewport();
  const qrSize = vp.landscape && vp.small ? 160 : 200;
  const qr = paused ? <div className="sw-qr-gap" style={{ width: qrSize, height: qrSize }} /> : <MapQr text={qrText} size={qrSize} code={code} />;
  const top = onPause && menu && (
    <div className="sw-topbar sw-topbar-plain">
      <TopActions onPause={onPause} menu={menu} />
    </div>
  );
  const heading = <h1 className="sw-h1">Clue givers: scan to get the secret map</h1>;
  const lines = (qrHere: ReactNode) => (
    <>
      <p>{giverLine}</p>
      <p data-testid="other-phone-line">
        {three ? 'On your phones: open the app, tap Join a game, scan this.' : 'On the other phone: open the app, tap Join a game, scan this.'}
      </p>
      <p className="sw-small sw-strong">Guessers: don't scan this one!</p>
      {qrHere}
      <p className="sw-code-text" data-testid="map-code-text">{`Or type this code: ${shownCode(code)}`}</p>
      <p data-testid="board-check">{check}</p>
      <p className="sw-small" data-testid="mismatch-line">
        Doesn't match? Scan this code again.
      </p>
      {dnd && (
        <p className="sw-small" data-testid="dnd-tip">
          Tip: turn on Do Not Disturb so messages don't pop up on the board.
        </p>
      )}
    </>
  );
  const main = !covered && (
    <SwMain until={guardUntil} onClick={onMain}>
      {mainText}
    </SwMain>
  );
  if (vp.landscape) {
    return (
      <div className={`sw-scan-land${vp.small ? ' sw-land-small' : ''}`}>
        <div className="sw-scan-qr">{qr}</div>
        <div className="sw-scan-col">
          {top}
          <div className="sw-scan-col-scroll">
            {heading}
            {lines(null)}
          </div>
        </div>
        {main}
      </div>
    );
  }
  return (
    <div className="sw-page sw-scan">
      {top}
      {heading}
      {lines(<div className="sw-scan-qr-port">{qr}</div>)}
      {main}
    </div>
  );
}
