import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { expect, it } from 'vitest';

const source = readFileSync(new URL('../tools/glassmatrix.mjs', import.meta.url), 'utf8');
const matches = [...source.matchAll(/styleRestored=(restoredStyle\.present===priorStyle\.present&&restoredStyle\.value===priorStyle\.value);\s+return \{ok:([\s\S]*?),broken,restored,priorStyle,restoredStyle,styleRestored\}/g)];
expect(matches).toHaveLength(1);
type Receipt = { ok: boolean; broken: { ok: boolean; errors: string[] }; restored: { ok: boolean };
  priorStyle: { present: boolean; value: string | null }; restoredStyle: { present: boolean; value: string | null } };
const assess = Function('receipt', `const {broken,restored,priorStyle,restoredStyle}=receipt;
  const styleRestored=${matches[0]![1]};return (${matches[0]![2]});`) as (receipt: Receipt) => boolean;
const report = JSON.parse(gunzipSync(readFileSync(new URL(
  '../../../audits/UI_U1_LOCAL_CHECKPOINT_a528791_20260906/glass/glassmatrix-local-u1-a528791-20260906-small-phone.json.gz', import.meta.url,
))).toString('utf8')) as { status: string; certifying: boolean; source: { commit: string }; instrumentFailures: string[] };
const prefix = 'small-phone: phone dock compressed-track control stayed green or failed to restore (';
const failures = report.instrumentFailures.filter(row => row.startsWith(prefix));
expect(failures).toHaveLength(1);
const receipt = JSON.parse(failures[0]!.slice(prefix.length, -1)) as Receipt;

it('accepts the recorded responsive-slot fault and exact restoration without rewriting historical RED', () => {
  expect(report.source.commit).toBe('a52879197e5d061671e5835e41a7afe4ba39b5d2');
  expect(report.status).toBe('instrument-fail'); expect(report.certifying).toBe(false); expect(receipt.ok).toBe(false);
  expect(receipt.broken.ok).toBe(false);
  expect(receipt.broken.errors.filter(error => error.startsWith('dock responsive slot drifted: '))).toHaveLength(9);
  expect(receipt.restored.ok).toBe(true); expect(receipt.restoredStyle).toEqual(receipt.priorStyle);
  expect(assess(receipt)).toBe(true); expect(receipt.ok).toBe(false);
});

it.each(['unchanged green fault', 'unrelated fault', 'red restoration', 'style value mismatch', 'style presence mismatch'])(
  'rejects %s using the shipped predicate', fault => {
    const mutant = structuredClone(receipt);
    if (fault === 'unchanged green fault') mutant.broken = { ok: true, errors: [] };
    if (fault === 'unrelated fault') mutant.broken.errors = ['unrelated geometry error'];
    if (fault === 'red restoration') mutant.restored.ok = false;
    if (fault === 'style value mismatch') mutant.restoredStyle.value = 'grid-template-columns:repeat(10,26px)';
    if (fault === 'style presence mismatch') mutant.restoredStyle.present = !mutant.priorStyle.present;
    expect(assess(mutant)).toBe(false);
  },
);
