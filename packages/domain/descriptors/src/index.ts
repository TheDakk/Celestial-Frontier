/* @cf/domain-descriptors — MODULE 13 of 14 (typed facade over the auto-lift).
   ⚠ Descriptor functions call app hooks as free identifiers — call
   installCaptureHooks() (or install real app implementations) BEFORE use.
   The ecology epoch is not a hook: pass it to planetDescriptorAtEcologyEpoch.
   The verbatim describePick (it reads the app's `st` and `customNames`) is not
   exported; describePickWithState takes both as parameters. */
export {
  galaxyStats,
  fmtBig,
  roman,
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
export { planetDescriptorAtEcologyEpoch } from './explicit-epoch.js';
export { installCaptureHooks, CAPTURE_THUMB } from './apphooks.js';
/* ⚠ D-CAT-1: the DEDUPED roster, not the verbatim one. Re-exporting the
   verbatim list here would have left the audit and the compendium reading a
   different catalogue from the one the name pass hands out. */
export { _EARTH_NAMES, _earthNamePass } from './apphooks.js';
