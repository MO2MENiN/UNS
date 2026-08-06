/**
 * vibrate.js
 * Thin wrapper around the Vibration API with a settings gate.
 */
export function vibrate(enabled, pattern = 15) {
  if (!enabled) return;
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* unsupported / blocked — ignore */
    }
  }
}
