# Isolated audio scripting environment

The approved Python3.12 environment is `.venv/` and is ignored by Git. No Pedalboard,
DawDreamer, NumPy or Mido has been installed here. The GUI-free Surge experiment remains
pending explicit approval. Use `.venv/bin/python`; do not use or alter Apple Python.

Read `../../UI_TOOLCHAIN.md` before use. Maintenance and full asset jobs take the shared
`../with-toolchain-lock.mjs` lock; run the toolchain check at batch start and capability
verification after an executable changes. Existing environments must be revalidated after
Homebrew Python updates. Future installed audio packages need an exact dependency lock.
