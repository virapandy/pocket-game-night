// The prototype's frame (screen map section K, rule 7): the grey bar on top, and under it the screens in a phone-sized
// frame (360 × 640 unless the size switch says otherwise). The screens run in their own page inside the frame (an
// iframe), so the phone's width, height and orientation are the frame's, and the bar is never part of a screen.
import { useEffect, useRef, useState } from 'react';
import type { ProtoMap } from './parse';

const SIZES = ['360 × 640', '390 × 844', '812 × 375', '320 × 568', '568 × 320'];
const BAR = 44;
const hashId = () => decodeURIComponent(location.hash.slice(1));

export function Frame({ game, map }: { game: string; map: ProtoMap }) {
  const [size, setSize] = useState(() => {
    const saved = localStorage.getItem('pgn-proto-size');
    return saved && SIZES.includes(saved) ? saved : (SIZES[0] as string);
  });
  const [at, setAt] = useState(hashId);
  const [note, setNote] = useState('');
  const [avail, setAvail] = useState(() => ({ w: innerWidth, h: innerHeight }));
  const [src] = useState(() => `${location.pathname}?frame=1${location.hash}`);
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== location.origin || typeof e.data !== 'object' || e.data === null) return;
      const d = e.data as { proto?: string; id?: string; text?: string };
      if (d.proto === 'at' && typeof d.id === 'string') {
        setAt(d.id);
        setNote('');
        if (hashId() !== d.id) history.replaceState(null, '', `${location.pathname}${d.id ? `#${encodeURIComponent(d.id)}` : ''}`);
      }
      if (d.proto === 'note' && typeof d.text === 'string') setNote(d.text);
    };
    const onResize = () => setAvail({ w: innerWidth, h: innerHeight });
    addEventListener('message', onMessage);
    addEventListener('resize', onResize);
    return () => {
      removeEventListener('message', onMessage);
      removeEventListener('resize', onResize);
    };
  }, []);

  const goTo = (id: string) => {
    const w = ref.current?.contentWindow;
    if (w) w.location.hash = id;
  };
  const [w, h] = size.split(' × ').map(Number) as [number, number];
  const scale = Math.min(1, (avail.w - 16) / w, (avail.h - BAR - 16) / h);
  const screen = map.screens.find((s) => s.id === at);
  const sections = [...new Set(map.screens.map((s) => s.section))];

  return (
    <>
      <nav className="proto-bar" aria-label="Prototype">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            goTo('');
          }}
        >
          Prototype: {game}
        </a>
        <span className="proto-where">{note || (screen ? `${screen.id} · ${screen.section}` : 'Index')}</span>
        <select aria-label="Go to screen" value={screen?.id ?? ''} onChange={(e) => goTo(e.target.value)}>
          <option value="">Index</option>
          {sections.map((sec) => (
            <optgroup key={sec} label={sec}>
              {map.screens
                .filter((s) => s.section === sec)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} {s.title}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        <select
          aria-label="Phone size"
          value={size}
          onChange={(e) => {
            setSize(e.target.value);
            localStorage.setItem('pgn-proto-size', e.target.value);
          }}
        >
          {SIZES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </nav>
      <div className="proto-stage">
        <div style={{ width: w * scale, height: h * scale }}>
          <iframe
            ref={ref}
            title={`Prototype screen, ${size}`}
            src={src}
            className="proto-frame"
            style={{ width: w, height: h, transform: `scale(${scale})` }}
          />
        </div>
      </div>
    </>
  );
}
