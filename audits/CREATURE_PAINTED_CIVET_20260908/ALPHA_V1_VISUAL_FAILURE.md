# First ImageMagick matte — edge review failed

True alpha was produced, but the dark-background review exposed filled checkerboard cells
among whiskers and isolated specks. Preserve alpha-v1 and both review composites.
The correction restricts enclosed-hole restoration to the actual body/nose envelope,
keeps whiskers on the chroma edge and rejects disconnected tiny specks. No body repaint.
