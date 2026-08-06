/**
 * wakelock.js
 * Manages a single Screen Wake Lock instance, re-acquiring it
 * automatically when the tab regains visibility (the OS releases
 * wake locks whenever the page is hidden).
 */
let wakeLock = null;
let desired = false;

async function acquire() {
  if (!("wakeLock" in navigator)) return;
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => {
      wakeLock = null;
    });
  } catch {
    wakeLock = null;
  }
}

export async function setWakeLock(enabled) {
  desired = enabled;
  if (enabled) {
    await acquire();
  } else if (wakeLock) {
    try {
      await wakeLock.release();
    } catch {
      /* ignore */
    }
    wakeLock = null;
  }
}

export function initWakeLockVisibilityHandler() {
  document.addEventListener("visibilitychange", async () => {
    if (desired && document.visibilityState === "visible" && !wakeLock) {
      await acquire();
    }
  });
}

export function isWakeLockSupported() {
  return "wakeLock" in navigator;
}
