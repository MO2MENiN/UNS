// counter.js — pure dhikr counter logic, independent from UI/DOM.
import { Storage } from './storage.js';

function itemKey(sectionId, dhikrId) {
  return `${sectionId}:${dhikrId}`;
}

function getCount(sectionId, dhikrId) {
  return Storage.getProgress(itemKey(sectionId, dhikrId));
}

// Increments the counter, clamped to [0, target]. Returns { count, justCompleted }.
function increment(sectionId, dhikrId, target) {
  const key = itemKey(sectionId, dhikrId);
  const current = Storage.getProgress(key);
  if (current >= target) {
    return { count: current, justCompleted: false };
  }
  const next = Math.min(current + 1, target);
  Storage.setProgress(key, next);
  return { count: next, justCompleted: next >= target };
}

function decrement(sectionId, dhikrId) {
  const key = itemKey(sectionId, dhikrId);
  const current = Storage.getProgress(key);
  const next = Math.max(current - 1, 0);
  Storage.setProgress(key, next);
  return next;
}

function reset(sectionId, dhikrId) {
  Storage.setProgress(itemKey(sectionId, dhikrId), 0);
  return 0;
}

export const Counter = { itemKey, getCount, increment, decrement, reset };
