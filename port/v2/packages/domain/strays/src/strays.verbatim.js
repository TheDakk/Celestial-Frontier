/* AUTO-LIFTED VERBATIM domain-pure strays from main.js (v1.8.9) — functions
   living OUTSIDE the 14 [domain] modules that fixtures pin or domain code
   calls. cleanName (lines 13274-13274).
   body sha256/16 066c818037c41e5f. ⚠ DO NOT EDIT. Regenerate: node tools/lift-strays.mjs */

function cleanName(s,n){ return String(s).replace(/[<>&"']/g,'').trim().slice(0,n||24); }   /* verify-pass: one sanitizer, parameterized cap */
export { cleanName };
