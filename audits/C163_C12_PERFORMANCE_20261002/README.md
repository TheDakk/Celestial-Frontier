# C163 C12 profiling diagnosis — 2026-10-02

C174 reserved one 4× CPU diagnostic on signed `235d68d36`; C175 released it after completion. The unchanged original Chimpanzee/Centipede script completed 789 live frames with zero rig refusals, CPU p95 9.3 ms and interval p95 16.8 ms. Sampling perturbs timing: this is not a 60 fps acceptance result.

The 14.435-second sample has about 7.604 s idle, 2.154 s ARAP sweep, 0.227 s orientation forward, 0.149 s active orientation, 1.129 s other skin work and 0.039 s garbage collection. The largest useful target is repeated ARAP work, not collector tuning. Six CPU frames exceed 1000/60 ms in this profiled capture; the prior unprofiled three-frame hold remains separate.

`profile-run.json` records the exact command/source and terminal status. `profile-01/report.json`, `cpu-profile.json` and `cpu-breakdown.json` retain raw samples and attribution. `retained-files.json` binds every output; diagnostic film/stills remain local ignored scratch because the named unprofiled acceptance evidence already exists. No source, choreography, iteration ceiling, pin or numerical bound changed during this measurement.

The candidate follow-up lives separately at `../C163_C12_FIXED_ROTATIONS_20261002`. It requires its own signed inputs, reservation, controls and unprofiled native result. Nothing here authorizes an I5 re-bind.
