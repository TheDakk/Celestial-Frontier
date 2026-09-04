/* @cf/domain-descriptors — MODULE 13 of 14 (typed facade over the auto-lift).
   ⚠ Descriptor functions call app hooks as free identifiers — call
   installCaptureHooks() (or install real app implementations) BEFORE use. */
export {
  galaxyStats,
  fmtBig,
  roman,
  describePick,
  slimGal,
  starDescriptor,
  planetDescriptor,
  moonDescriptor,
  galaxyDescriptor,
  wormholeDescriptor,
  cmbDescriptor,
  oortDescriptor,
  kuiperDescriptor,
  visitorDescriptor,
  beltDescriptor,
  SOL_MOONS,
  type Descriptor,
} from './descriptors.verbatim.js';
export {
  describePickWithState,
  type CustomNameLookup,
  type DescriptorNavigationState,
  type DescriptorPick,
  type DescriptorStarState,
} from './describe-pick.js';
export { installCaptureHooks, CAPTURE_THUMB } from './apphooks.js';
/* ⚠ D-CAT-1: the DEDUPED roster, not the verbatim one. Re-exporting the
   verbatim list here would have left the audit and the compendium reading a
   different catalogue from the one the name pass hands out. */
export { _EARTH_NAMES, _earthNamePass } from './apphooks.js';
