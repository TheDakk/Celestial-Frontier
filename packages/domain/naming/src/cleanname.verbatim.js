/* AUTO-LIFTED VERBATIM shared name normalizer from main.js (v1.8.9) —
   cleanName (13274-13274); body sha256/16 066c818037c41e5f.
   ⚠ DO NOT EDIT. Regenerate: node tools/lift-strays.mjs */
function cleanName(s,n){ return String(s).replace(/[<>&"']/g,'').trim().slice(0,n||24); }   /* verify-pass: one sanitizer, parameterized cap */
export { cleanName };
