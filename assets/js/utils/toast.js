/**
 * toast.js
 * Lightweight, accessible toast notification used for "copied",
 * "added to favorites", etc.
 */
let hideTimer = null;

export function showToast(message) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.querySelector(".toast__inner").textContent = message;
  el.classList.add("toast--visible");
  el.setAttribute("role", "status");
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    el.classList.remove("toast--visible");
  }, 2200);
}
