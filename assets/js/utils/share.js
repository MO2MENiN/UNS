/**
 * share.js
 * Web Share API + Clipboard API helpers used by the dhikr list and
 * counter pages ("share" and "copy" actions).
 */
export async function shareText(text, title = "أنس - UNS") {
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return true;
    } catch {
      return false; // user cancelled or unsupported context
    }
  }
  return copyText(text);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers / non-secure contexts
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      return true;
    } catch {
      return false;
    }
  }
}
