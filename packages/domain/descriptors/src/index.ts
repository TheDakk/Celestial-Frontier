/* @cf/domain-descriptors — MODULE 13 of 14 (typed facade over the auto-lift).
   The verbatim descriptors import their nine app hooks (the six thumb stubs,
   _cardFactsSet, _earthNamePass, GAL_KIND) from apphooks.ts: nothing is
   installed on the global object.
   The ecology epoch is not a hook: pass it to planetDescriptorAtEcologyEpoch
   or describePickWithState.
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
export { CAPTURE_THUMB } from './apphooks.js';
/* ⚠ D-CAT-1: the DEDUPED roster, not the verbatim one. Re-exporting the
   verbatim list here would have left the audit and the compendium reading a
   different catalogue from the one the name pass hands out. */
export { _EARTH_NAMES, _earthNamePass } from './apphooks.js';
