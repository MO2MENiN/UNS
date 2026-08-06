/**
 * sound.js
 * Plays short cached audio cues (tap tick / completion chime).
 * Files are pre-generated and served from /assets/sounds so the
 * service worker can cache them for full offline playback.
 */
let tickAudio = null;
let completeAudio = null;

function ensureLoaded() {
  if (!tickAudio) {
    tickAudio = new Audio("assets/sounds/tick.wav");
    tickAudio.preload = "auto";
  }
  if (!completeAudio) {
    completeAudio = new Audio("assets/sounds/complete.wav");
    completeAudio.preload = "auto";
  }
}

export function playTick(enabled) {
  if (!enabled) return;
  try {
    ensureLoaded();
    tickAudio.currentTime = 0;
    tickAudio.play().catch(() => {});
  } catch {
    /* ignore playback errors (e.g. autoplay policies before first gesture) */
  }
}

export function playComplete(enabled) {
  if (!enabled) return;
  try {
    ensureLoaded();
    completeAudio.currentTime = 0;
    completeAudio.play().catch(() => {});
  } catch {
    /* ignore */
  }
}
