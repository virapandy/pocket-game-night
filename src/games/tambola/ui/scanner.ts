// The host's camera for "Scan a claim" (TAM-177, TAM-178). Android reads QR codes with the phone's own
// reader (BarcodeDetector); iPhones, which lack it, use the small jsQR library, loaded only when needed.
// Tests replace the camera with `window.__pgnCamera` (tests/browser/README.md, "The camera test hook").

export type CameraFailure = 'denied' | 'no-camera';

interface CameraHook {
  start(onRead: (text: string) => void, onFail: (why: string) => void): () => void;
}

interface Detector {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}
type DetectorClass = (new (options: { formats: string[] }) => Detector) & { getSupportedFormats?: () => Promise<string[]> };

const SCAN_EVERY_MS = 200;
const MAX_SIDE = 640;

/**
 * Starts reading QR codes. `onRead` gets each code's text; `onFail` says the camera can't be used.
 * Returns the function that stops the camera.
 */
export function startScanner(video: HTMLVideoElement | null, onRead: (text: string) => void, onFail: (why: CameraFailure) => void): () => void {
  const hook = (window as unknown as { __pgnCamera?: CameraHook }).__pgnCamera;
  if (hook && typeof hook.start === 'function') {
    const stop = hook.start(onRead, (why) => onFail(why === 'denied' ? 'denied' : 'no-camera'));
    return typeof stop === 'function' ? stop : () => {};
  }

  let stopped = false;
  let stream: MediaStream | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const stop = () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
    if (video) video.srcObject = null;
  };

  const media = navigator.mediaDevices;
  if (!media || typeof media.getUserMedia !== 'function' || !video) {
    setTimeout(() => !stopped && onFail('no-camera'), 0);
    return stop;
  }

  void (async () => {
    try {
      stream = await media.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    } catch (e) {
      const name = e instanceof DOMException ? e.name : '';
      if (!stopped) onFail(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'no-camera');
      return;
    }
    if (stopped) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    video.srcObject = stream;
    video.setAttribute('playsinline', 'true');
    video.muted = true;
    await video.play().catch(() => {});
    const read = await reader();
    const loop = async () => {
      if (stopped) return;
      try {
        const text = video.readyState >= 2 ? await read(video) : null;
        if (text && !stopped) {
          onRead(text);
          return;
        }
      } catch {
        // A frame that can't be read: try the next one.
      }
      timer = setTimeout(() => void loop(), SCAN_EVERY_MS);
    };
    void loop();
  })();
  return stop;
}

/** The best QR reader this phone has. */
async function reader(): Promise<(video: HTMLVideoElement) => Promise<string | null>> {
  const Native = (window as unknown as { BarcodeDetector?: DetectorClass }).BarcodeDetector;
  if (Native) {
    try {
      const formats = (await Native.getSupportedFormats?.()) ?? ['qr_code'];
      if (formats.includes('qr_code')) {
        const detector = new Native({ formats: ['qr_code'] });
        return async (video) => (await detector.detect(video))[0]?.rawValue ?? null;
      }
    } catch {
      // Fall back to jsQR.
    }
  }
  const jsQR = (await import('jsqr')).default;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  return async (video) => {
    if (!ctx || !video.videoWidth) return null;
    const scale = Math.min(1, MAX_SIDE / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' })?.data ?? null;
  };
}
