# One phone probe without text encoder — preparation

Nick authorized one new probe on the same physical iPhone17Pro/iOS26.6.2, USB-C.
First verify every pinned transformer initializer fits1GiB. Parent and exact in-worker
expanded graph both have443 initializers; largest113,246,208bytes (108MiB). None exceeds
1GiB. Oversized synthetic tensor rejects; exact1GiB permits. See initializer-audit.json.
Total initializer bytes4,393,808,634 after expansion; passing one-buffer check does not
prove total resident memory or temporary allocation fits. No inference in this inspection.

Next precompute only the accepted recipe text on Mac, freeze binary/hash/prompt/model
identity, serve it to phone and refuse text-encoder fallback. Phone must load only encode,
denoise and decode. One warm finisher attempt, memory where exposed, no session-loss retry.
No phone inference has run in this audit yet. Native embedding preparation requires a
signed source; preparation tool exposes only text weights, no VAE/transformer resources.
