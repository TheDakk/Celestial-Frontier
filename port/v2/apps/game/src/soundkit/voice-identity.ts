/* D15 Stage 0 — ONE voice per creature (N5_AUDIO.md "One identity"). Before this, the painted battle compiled its voice card from the anatomy
   record + genome seed and mixed in the battle's own seed, while Tame, Feed and the Compendium voiced the same creature from resolver-v1's
   AudioSignature: two systems, two voices, and a new voice every fight. Now every path derives the creature's voice card here:
   - the SEED comes from the creature's AudioSignature (the owned individual's exact projection, lineage included; a non-owned combatant's
     genome-only signature — identical to the owned one for an unbred creature);
   - the VOICE TEMPLATE comes from the genome (its Earth profile's body plan, or the procedural painter's body family), never from which
     painting happens to draw it, so the card does not change when the art does;
   - the material comes from the genome's skin gene (compileVoiceCard's own rule).
   Pure and deterministic. The oscillator call plans of Tame/Feed/Compendium already key on the same signature; they become articulations
   of this card when real sources arrive (Stage 4). */
import type { AudioSignature } from '@cf/audio';
import { serializeAudioSignature } from '@cf/audio';
import { speciesVisualKey } from '@cf/art/species-identity';
import type { CreatureInstanceId, OwnershipStateV2 } from '@cf/domain-acquisition';
import { projectGenomeAudioSignatureV1, projectOwnedCreatureAudioIdentity } from '../audio-identity-projector.js';
import { earthFaunaProfile } from '../earth-fauna-profiles.js';
import { proceduralFamilyV1 } from '../morph/painted-stand-in.js';
import { compileVoiceCard, type SystemCardLike, type VoiceCardResult } from './voice-card.js';

/** Salt of the voice seed drawn from a signature (changing it re-voices every creature). */
export const VOICE_IDENTITY_SALT = 0x5c0e0001;
export function voiceIdentitySeedV1(signature: AudioSignature): number {
  const text = serializeAudioSignature(signature); let h = (0x811c9dc5 ^ VOICE_IDENTITY_SALT) >>> 0;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  h ^= h >>> 16; return Math.imul(h, 0x85ebca6b) >>> 0;
}

/** Procedural body family → voice template; absent = no voice (sessile colonies). */
const FAMILY_VOICE_TEMPLATE: Readonly<Record<string, string>> = Object.freeze({
  'serpent:snake': 'serpent', 'serpent:viper': 'serpent', jelly: 'radial',
  'ceph:octopus': 'cephalopod', 'ceph:squid': 'cephalopod', 'ceph:cuttlefish': 'cephalopod',
  'insect:beetle': 'insect', 'insect:generic': 'insect', 'insect:mantis': 'insect', 'crust:crab': 'brachyuran', 'crust:lobster': 'brachyuran',
  'fish:fusiform': 'fish', 'fish:sturgeon': 'fish', 'fish:shark': 'fish', 'fish:flat': 'fish', 'fish:angler': 'fish',
  'winged:membrane': 'flyer-membrane', 'winged:four': 'insect',
});
export function voiceTemplateForGenomeV1(genome: Readonly<Record<string, unknown>>): string | null {
  const earth = typeof genome._earthName === 'string' ? genome._earthName : null;
  if (earth !== null) return earthFaunaProfile(earth)?.candidateTemplates[0] ?? null;
  const family = proceduralFamilyV1(genome);
  if (family.startsWith('land:')) {
    const [, n, leaper] = family.split(':');
    return n === '4' ? (leaper ? 'hopper' : 'quadruped') : n === '6' ? 'insect' : n === '8' ? 'arachnid' : n === '2' ? 'biped-bird' : 'quadruped';
  }
  return FAMILY_VOICE_TEMPLATE[family] ?? null;
}

/** The creature's ONE voice card. `signature` = its AudioSignature (the owned projection's when it is owned); absent = the genome-only one. */
export function creatureVoiceCardV1(genome: Readonly<Record<string, unknown>>, signature?: AudioSignature | null, systemCard?: SystemCardLike | null): VoiceCardResult {
  if (genome.kingdom !== undefined && genome.kingdom !== 'fauna') return Object.freeze({ ok: false, reason: `no-voice:${String(genome.kingdom)}` });
  const sig = signature ?? projectGenomeAudioSignatureV1(genome);
  if (!sig) return Object.freeze({ ok: false, reason: 'no-voice:no-audio-signature' });
  const template = voiceTemplateForGenomeV1(genome);
  if (template === null) return Object.freeze({ ok: false, reason: 'no-voice:no-voice-template' });
  let key: string; try { key = speciesVisualKey(genome as Record<string, unknown>); } catch { key = `genome:${Number(genome.seed) >>> 0}`; }
  return compileVoiceCard({ template: { id: template }, identity: { speciesVisualKey: key } }, genome as unknown as Parameters<typeof compileVoiceCard>[1], systemCard ?? null, null, { seed: voiceIdentitySeedV1(sig) });
}

/** An owned individual's voice card through its exact ownership projection (the path Tame, Feed and the Compendium resolve). */
export function ownedCreatureVoiceCardV1(ownership: OwnershipStateV2, creatureId: CreatureInstanceId, systemCard?: SystemCardLike | null): VoiceCardResult {
  const projection = projectOwnedCreatureAudioIdentity(ownership, creatureId);
  if (projection.kind !== 'projected') return Object.freeze({ ok: false, reason: `no-voice:${projection.reason}` });
  const creature = ownership.creatures.find((row) => row.creatureId === creatureId);
  if (!creature) return Object.freeze({ ok: false, reason: 'no-voice:creature-not-live' });
  return creatureVoiceCardV1(creature.genome as unknown as Readonly<Record<string, unknown>>, projection.signature, systemCard);
}
