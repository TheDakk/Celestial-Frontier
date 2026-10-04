# Deferred next audio slice — 2026-09-08

Selection only; no audio code or assets changed. This batch restores the protostar disk.

Use the existing `cf-pilot-ui-settlement` recording (700 ms, UI category, gain .65)
after one verified Starter Charter acceptance, including immediate completion when existing
progress qualifies. The native caller is `#chpanel [data-starter-charter-accept]` in
`port/v2/apps/game/src/main.ts`; `runStarterCharterAccept` already checks the committed
revision, exact checkpoint fields and any gear carrier before publishing acceptance and rewards.
Play only after successful publication and barrier release. Duplicate/current, refusal,
convergence and publication failure remain silent.

Current authored game mappings cover exploration music/woodland bed, navigation and Scout
landing. Settlement, refusal, approach and combat-contact recordings remain auditions;
Chronicle uses its existing registered procedural cues. No replacement Chronicle audio is proposed.

A small same-route settlement ticket in `audiovisual-pilot.ts` / `tame-greeting-audio.ts` should
capture shared-context activation during the original trusted Accept event and consume it once
after success. Never activate again after an await. Require explicit pilot listening opt-in,
Effects/Master Sound enabled, unchanged route, visible/answerable owner and no superseding
arm. Keep hide/mute/route/teardown cancellation, four pilot voices, one voice per category and
the existing 19,503,360-byte decoded-data cache. Existing cue/license rows suffice; no new media.

Focused caller tests should cover delayed persistence and activation, accepted/immediately
completed results, duplicate/refused/stale/fault outcomes, mute/hide/route/disposal and replacement
tickets. Native diagnostic: `?avpilot=1`, skip Training, enable pilot sound, open Charters via
`#objchip`, accept an available row, and observe its actual durable result followed by exactly
one finite 0.7-second AudioBuffer source. Include a refusal control; source start is not human
listening or physical-device acceptance.
