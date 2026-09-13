# First full-model native delivery attempt

Overall **FAIL**, immutable receipt. Actual normal-game Install → persisted chunks → Pause →
reload → explicit Resume verified all20 pinned files,6,691,020,416 bytes in6,392 OPFS chunks,
within the same attempt. Resume issued a real nonzero byte Range after11,534,336 retained bytes.
Full resumed install took108.716 seconds from a freshly hashed local mirror, not the internet.
The UI reached Model ready; model bytes were not injected into storage by a fixture.

The diagnostic used Page.reload(ignoreCache:true) after Pause. Initial paused document was
service-worker controlled; every post-reload resume observation was uncontrolled. It failed
the explicit cache/controller guard before closing servers or entering offline verification.
No offline pass, full controlled resumed download, Blob-readback pass or phone claim follows.
The exact cache inventory and actual installed markers/chunks are retained. No browser exception
was recorded. All27 measured source hashes stayed unchanged; target, browser/profile, servers
and locks were closed. The owned browser profile and test-installed model copy were removed.

Correct the diagnostic to a normal reload and require the exact expected controller before
resuming large work. Retain this result; a new changed-instrument attempt has a new directory.
