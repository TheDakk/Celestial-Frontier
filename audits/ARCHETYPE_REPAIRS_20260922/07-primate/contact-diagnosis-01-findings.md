# Chimpanzee fit-01: three exact first contact refusals

Executed `node audits/ARCHETYPE_REPAIRS_20260922/07-primate/contact-diagnosis-01.mjs` once. This replays only the two failed action timestamps and one failed presentation timestamp from the original sprint's `07-primate/static.json`. Every refusal's complete first line reproduces exactly. No ARAP solve, static battery, native film, timing certificate, or acceptance run was performed.

The real GSAP/performance/contact owners reconstruct the attempted poses. The presentation reproduces the established idle blend and schedule, with exact schedule equality asserted against the original report. The temporary bundle adds only three trace statements to the contact module; removing them restores its exact source bytes. Production files and all equations, limits, and thresholds remain unchanged.

All 42 bundled source hashes remained unchanged during this diagnostic. Of these, 39 exactly match the original static receipt, two contain reviewed earlier dead-code removals (`classifyRealm` / `realmFromLabel` in `body-card.ts`, `spine6` in `family-templates.ts`), and one is the new diagnostic entry. The receipt retains both historical and current hashes and the exceptions' specific reasons. Contact, performance, actions, kinematics, and presentation blending source bytes match the original run. Original record, binding, authoring, presence, and subject inputs remained unchanged.

The original static report's contact-failure `firstRefusal.pose` is the last successfully painted pose: that field updates inside `rig.applyPose`, after contact resolution. This diagnostic instead records `attemptedPose` immediately before `contact.resolve`. The original report remains intact.

All pixel values below use the original 1254-square source coordinate system.

| Retained sample | Exact conflict |
| --- | --- |
| dodge at 44.333333333333336 ms | `legNearFoot` resolves to −51.14672708234197 degrees, beyond the unchanged −50 to +50 limit. |
| presentation at 9850 ms, dodge elapsed 47.64407912890056 ms | `legNearFoot` resolves to −51.146731326657175 degrees, beyond the same limit. |
| faint at 359.6666666666667 ms | Far-leg accommodation requires 36.71006064492376 px in pass 0, then another 2.478388450412238 px in the first painted-support correction: 39.188449095336 px total exceeds the unchanged 38.06856971308484 px cap by 1.1198793822511584 px. |

## Responsible geometry

Only `legFar` and `legNear` are contact chains. Forearm shape does not cause these failures.

The near leg's authored hip/knee/foot are (306,545), (509,737), (482,1076). Upper and lower lengths are 279.4154612758571 and 340.0735214626389 px; maximum reach is 619.488982738496 px. The relative bend between its authored upper and lower segments is 51.148934374969805 degrees. The planted dodge moves the body backward/upward while holding the foot support, so successive support corrections take this chain nearly straight. Straightening requires almost the entire authored bend as negative `legNearFoot` rotation, which exceeds the permitted 50 degrees. This is an angular conflict at near-full extension, not an ARAP or material failure. Dodge's total compression is only about 1.354 px; the presentation sample's is about 5.289 px, both below the cap.

The far leg's authored hip/knee/foot are (297,670), (295,793), (148,1045). Its upper/lower lengths are 123.01625908797587 / 291.741323778446 px. Rest hip-to-foot distance is 403.51703805415707 px, leaving only 11.240544812264773 px before maximum extension at 414.75758286642184 px. During faint, composed root/body rotation places that hip beyond the foot's available reach. Pass 0 accommodates within the cap, but preserving the painted support (offset +8,−8 px from the foot landmark) requires the further shift that crosses the cap. The near leg does not request compression in either of those passes.

The measurements establish the conflicts, not permission to move joints away from the observed painting. A plausible geometric correction requires independent visual support for new landmarks or a corrected painting; this diagnostic does not itself establish such a correction. Preserve the original inputs and reds. Parent owns any justified new authoring and its subsequent checks; this diagnostic ends here.
