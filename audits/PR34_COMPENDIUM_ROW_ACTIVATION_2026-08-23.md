# PR #34 Compendium row-activation ruler repair — 2026-08-23

## Hosted failure

- GitHub Actions run: `32665404776` (one authorized attempt; no retry; label removed).
- Tested PR head/base: `4909069ba6f1e2d5dee62286d29b0bc8201186ee` /
  `8998ffb77ca5b1f3123d7ea776c41db6e23bd24e`.
- Retained report: `PR34_COMPENDIUM_GHA_32665404776_FAILURE.json.gz`.
- Raw/gzip SHA-256:
  `c43c7273e82de26589b7f69a2a73f4dd405a1431f23991f1990c1e7ab5b7d6f1` /
  `594209e4c174f01986862783c461c86d09e7665906af0a659fae9d1f93855ade`.

The desktop second 440-detail native click never entered the exact logical detail mode. The
following semantic wait repeatedly observed no detail for roughly 30 seconds. Its final command was
correctly clipped to the 46 ms remaining in that phase and timed out after 46.97 ms while the
independent browser heartbeat completed in 3.54 ms. Therefore 46 ms was neither the product SLA nor
the causal failure. The earliest failed outcome was native row activation.

## Repair boundary

Collector commit `bf0ece6c7d32410f6cb76fb0a4920c0332d080c4`:

1. requires the exact virtual row to be fully vertically contained;
2. chooses an 8 px inset point;
3. requires independent `document.elementFromPoint(...).closest('[data-cid]')` ownership by that
   exact logical row;
4. performs one native press/release with no retry; and
5. immediately requires exact detail mode and logical identity before any art wait.

The browser-free selftest rejects partial containment, removed hit ownership, an empty identity and
an altered expression. A missed click now fails immediately as interaction evidence instead of
impersonating downstream art unanswerability.

## Replacement calibration

- Measurement authority:
  `cfc40f891e817c54c5b382cd5ef39ff606a0af27e1c142382c19da3d213edf0a`.
- Collector SHA-256:
  `50c28928c7aac758c2b19d0a7c52de1d05f730d03e293b0d83fa324cdd300cf7`.
- Product producer authority is unchanged:
  `5a316197d9aca27967f4e930f43089d2bbe2b9e4a66a40c207ea59c809405d94`.
- Exact browser: Edge `151.0.4129.101`, revision `@cc1d9f4080fd9140611a9600b8d1615db310105d`,
  JavaScript `15.1.23.9`, CDP `1.3`.
- Active budget SHA-256:
  `208af9558317cae7748f01470dd50e608485d4a197212ecd04db823f7c15a424`.

| Evidence | Raw SHA-256 | Deterministic gzip SHA-256 |
| --- | --- | --- |
| candidate4 | `16b1a4ce399c85270768ed9fb72aba810551816f2c4e79293f4ac48772e6005e` | `54a56a09710f92cec811a26a8c0ba4493c8d80a6dc8ceebde775097fe6ba36a9` |
| candidate5b | `f07bb4452317f9ba7b4a5eb5fc1fa19f79d93de595dfa38f36ae4790d8fdba5a` | `39857545f3ba9a9c7068b6cf2ee49987b10e8e1f38c8ac7c37a1dcf11a7ed725` |
| candidate6 | `da4429ca04d72c63806d4dee92423bb06ce234c9cf43c1b5a6a02d328f6827b4` | `2e86982c5a75a5fa68af19eada2254c4dee923affbd5736cb4b5577e24cccc6b` |
| paired baseline1 reduced sample | `621755c66c819955d20619f8205f2d6fa2116423c40405d6e3cdc77ac201544e` | `43d528e059b6fa31d5f7ff2d4ea0ee1916be106f18c8a51b6ebb80c304475534` |
| diagnostic baseline2 | `4b9807e92037e44a1e79b1690fd896a150dfdf9583e77fa90fd572cffcfba3a3` | `b88e2ed2fc1dd1c5410792ff601e4053946098fcd309e6925f173d74bea63a14` |
| exact-budget certification | `ea31612f16c978d30a40d8b6465f89e4e6f10f23b35ae996919e5ed0c7656108` | `1c6c12faaf984716c31aecb8b1e5c11767ed998892c6bd4eba9f4edf23a0f1eb` |

Candidates 4/5b/6 each completed all 78 calibration outcomes and both native detail interactions.
Baseline1 retains the four sealed product faults (`unwindowed-1500-rows`, `list-source-440`,
`full-portrait-dom-exposure`, `eager-art-import`) and the previous phone/desktop warm-range breach
inventory. Baseline2 retains the four product faults but is diagnostic-only because its desktop
warm jitter did not preserve that breach inventory. No numeric resource ceiling changed.

## Exact-budget certification

Clean committed source `7de42c6bb02f4c7af26053fa7a4cf45f5fbdc777` ran
`20260823-pr34-row-activation-certification` once under the active budget. It completed 78/78 with
zero findings, no partial or blocked outcomes, complete browser/server/workspace-lock lifecycle,
and a passing named verifier. Both phone and desktop native detail interactions succeeded.
Neither these calibrations nor this local certificate supplies hosted-green, merge, HUMAN-review,
release or deployment authority.
