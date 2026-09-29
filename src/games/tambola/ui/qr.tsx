// Drawing QR codes (Phase 2): the hand-out QR (TAM-117) and the claim QR (TAM-177), as crisp SVG.
// The text inside is also on the element as `data-payload`, so tests never need to decode an image.
import qrcode from 'qrcode-generator';
import { useMemo } from 'react';

/** A square QR code with a quiet border, drawn as SVG. `size` is its width and height in CSS pixels. */
export function QrCode({ text, testId, size, label }: { text: string; testId: string; size: number; label: string }) {
  const path = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(text, 'Byte');
    qr.make();
    const n = qr.getModuleCount();
    let d = '';
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + 4} ${r + 4}h1v1h-1z`;
    }
    return { d, n: n + 8 };
  }, [text]);
  return (
    <div className="qr" data-testid={testId} data-payload={text} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${path.n} ${path.n}`} width={size} height={size} role="img" aria-label={label} shapeRendering="crispEdges">
        <rect width={path.n} height={path.n} fill="#fff" />
        <path d={path.d} fill="#000" />
      </svg>
    </div>
  );
}
