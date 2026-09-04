import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const mainSource = fs.readFileSync(path.join(here, '../apps/game/src/main.ts'), 'utf8');

function recordsBody(source: string): string {
  const start = source.indexOf('function fillRecords(): void {');
  const end = source.indexOf('\n/* THE STAR ATLAS', start);
  return start >= 0 && end > start ? source.slice(start, end) : '';
}

function wiringErrors(source: string): string[] {
  const errors: string[] = [];
  if (!source.includes("from './expedition-chronicle.js';")) {
    errors.push('Expedition Chronicle owner is not imported');
  }
  const records = recordsBody(source);
  for (const expected of [
    "arc5OwnershipState?.mode === 'current'",
    'readCombatSettlementAuthorityV1(f4Runtime.extensions)',
    "combat.kind === 'loaded'",
    'ownership: ownershipSourceStateV1(arc5OwnershipState)',
    'projectExpeditionChronicleV1({',
    'renderExpeditionChronicleV1(projected.model)',
    'data-expedition-chronicle-protected',
  ]) if (!records.includes(expected)) errors.push(`Records omits ${expected}`);
  for (const forbidden of [
    'commitAction(', 'commitOutcome(', 'commitProduct(', 'save.journal.push(',
    'receiptKind:', 'Math.random(', 'Date.now(',
    'persistView(', 'publishArc', 'prepareArc', 'applyV5ExtensionWrites(',
  ]) if (records.includes(forbidden)) errors.push(`Records Chronicle mutates through ${forbidden}`);
  if (/\bsave\.[A-Za-z_$][\w$]*\s*=/u.test(records)) {
    errors.push('Records Chronicle assigns a save field');
  }
  if (/\bsave\.[A-Za-z_$][\w$]*\.(?:push|pop|shift|unshift|splice|sort|reverse)\(/u.test(records)) {
    errors.push('Records Chronicle mutates a save collection');
  }
  return errors;
}

describe('Expedition Chronicle Main wiring', () => {
  it('renders only from current ownership, combat, and save authorities', () => {
    expect(wiringErrors(mainSource)).toEqual([]);
  });

  it('fails when durable combat authority is bypassed or a writer enters Records', () => {
    expect(wiringErrors(mainSource.replace(
      'readCombatSettlementAuthorityV1(f4Runtime.extensions)',
      "{ kind: 'loaded', authority: { battles: [], conquests: [] } }",
    ))).toContain('Records omits readCombatSettlementAuthorityV1(f4Runtime.extensions)');
    expect(wiringErrors(mainSource.replace(
      "function fillRecords(): void {",
      "function fillRecords(): void { f4Runtime?.commitAction({} as never);",
    ))).toContain('Records Chronicle mutates through commitAction(');
    expect(wiringErrors(mainSource.replace(
      "function fillRecords(): void {",
      "function fillRecords(): void { if (save) save.journal = [];",
    ))).toContain('Records Chronicle assigns a save field');
  });
});
