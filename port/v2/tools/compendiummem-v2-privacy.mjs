/** Presentation-only path privacy for new v2 evidence; never alters measured values. */
import os from 'node:os';
export function privatePathText(value, home = os.homedir()) {
  const text = String(value);
  if (typeof home !== 'string' || home.length < 2) throw new Error('Home alias input is invalid');
  return text.split(home).join('~');
}
export function privateJson(value, home = os.homedir()) {
  return JSON.stringify(value, (_key, item) => typeof item === 'string' ? privatePathText(item, home) : item, 2) + '\n';
}
