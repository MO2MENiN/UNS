// install.js — cross-platform "install as app" support.
//
// Android/Chrome/Edge fire `beforeinstallprompt`, which we capture once at bootstrap
// and can trigger later from a UI button. iOS Safari never fires this event — there is
// no programmatic install API — so the only correct approach there is to detect iOS and
// show manual "Add to Home Screen" instructions instead.

let deferredPrompt = null;

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true // iOS Safari's own flag
  );
}

function isIOS() {
  const ua = window.navigator.userAgent || '';
  const isAppleTouch = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ reports as "MacIntel" but is touch-capable, unlike real Macs.
  const isIpadOS13Plus = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return isAppleTouch || isIpadOS13Plus;
}

function isAndroid() {
  return /Android/i.test(window.navigator.userAgent || '');
}

function canPromptInstall() {
  return deferredPrompt !== null;
}

function init(onPromptAvailabilityChange) {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    if (onPromptAvailabilityChange) onPromptAvailabilityChange();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    if (onPromptAvailabilityChange) onPromptAvailabilityChange();
  });
}

// Triggers the native install prompt. Resolves to 'accepted' | 'dismissed' | 'unavailable'.
async function promptInstall() {
  if (!deferredPrompt) return 'unavailable';
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  const outcome = choice.outcome;
  deferredPrompt = null;
  return outcome;
}

export const Install = { isStandalone, isIOS, isAndroid, canPromptInstall, init, promptInstall };
