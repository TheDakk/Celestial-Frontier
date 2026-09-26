# C24 — strict root typecheck

Measured185 TypeScript errors before; zero after. Root command:
`npx tsc --noEmit --noUnusedLocals`; app and worker programs also exit0.
No tsconfig, skipLibCheck, library/dependency or threshold changes.

Pure motion/contact imports reached `creature-rig.ts`, bringing Pixi/WebGPU into
the strict root program. New `creature-rig-types.ts` owns only structural pose,
record, contact, binding and seam types, including the existing paint-skin type.
Pure consumers now use that module. The Pixi loader re-exports existing names,
so current external type consumers remain compatible. One unused `BodyCard`
overlay import was removed.

All13 edited modules emit byte-identical JavaScript before/after with the locked
Rolldown compiler (imports external, tree shaking disabled, identical virtual
filename/options). runtime-parity.json pins both outputs. Thus no unchanged full
unit/native/S2 battery was repeated after C23; this item changes types only.
Root validate also passes. No claim that parked I5 or the whole develop profile
is green. The initial parity helper assumed TypeScript7 retained the old JS API;
that module is absent. The failed helper is retained and replaced by the actual
installed Rolldown compiler; no dependency install or error suppression.

Claude consumes the signed type boundary; keep the strict root owner enabled.
Codex continues C25 actual-Claude-source films, then§20 balance. Nick need not
relay. C8 remains parked; no hosted attempt/label/release/deploy.
