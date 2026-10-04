# Bivalve shell material within the closed kit

Use the existing **`plated`** category for the visible rigid valves and hinge. Use existing **`slick`** joint overrides for the visible mantle, siphon and foot. These names describe the Motion Kit's mechanical response; they do not claim a mollusc shell is made of chitin or that the animal has a new biological plate anatomy.

The current law is `MOTION_KIT.md` §6: plated surfaces are rigid, have a heavy settle and do not stretch. `port/v2/apps/game/src/motion/secondary.ts` implements that same category with zero squash/stretch, rigid=true and heavySettle=true. The closed mapper already accepts `plated`; literal `shell` is unmapped. `body-card.ts` already supports explicit `materials.joints` overrides. No new material, mapping, template or runtime change is required.

The intended authored declaration, only where the corresponding anatomy is actually visible, is:

```json
{
  "surface": "plated",
  "joints": {
    "mantle": "slick",
    "siphon": "slick",
    "foot": "slick"
  }
}
```

Do not declare an optional hidden/absent part solely to make this example compile. The current Mussel painting still lacks a proven complete hinge axis and distinct siphonal structure, and its large tongue-like foot/wide gape remain biological review holds. A material decision does not resolve those source or reference gaps. No Mussel fit or global reference is admitted by this record.

The current sessile-filter candidate request is Sea Squirt, with both genuine siphons preserved even though the present coarse template has one aperture chain. The second small-crustacean candidate is canonical Prawn. Krill was rejected as a convenient substitute because the current five-pair template cannot justify deleting its real thoracic appendages. NOAA's *Order Euphausiacea* describes eight pairs, with some terminal reductions: [NOAA monograph](https://repository.library.noaa.gov/view/noaa/45708/noaa_45708_DS1.pdf). This biological inventory is separate from whether a generated Prawn is fully authorable.

This is audit evidence and a recommended closed-kit declaration, not a runtime edit, native result or quality acceptance. Source-bound controls are retained separately when the offline validation slot is available.
