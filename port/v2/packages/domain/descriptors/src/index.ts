/* @cf/domain-descriptors — MODULE 13 of 14 (typed facade over the auto-lift).
   ⚠ Descriptor functions call app hooks as free identifiers — call
   installCaptureHooks() (or install real app implementations) BEFORE use. */
export * from './descriptors.verbatim.js';
export { installCaptureHooks, CAPTURE_THUMB } from './apphooks.js';
