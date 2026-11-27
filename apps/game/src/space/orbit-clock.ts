/* The orbit hold: the clock that places the planets and the dwarf planets on their orbits, which can be held.

   From the legacy game (celestial-frontier.html): the hold is a snapshot of the clock, read in place of the clock
   while it is set (13382-13389); the system map places its planets (7668) and its dwarf planets (7797) by it (7526)
   and everything else by the running clock, so moons, belts, comets and clouds keep moving under a hold. It is set
   on approach (5968-5970) and on landing (13649-13650, 13675-13676), and lifted on zooming back out (5948), on a
   reset (16970) and on any change of map (26942).

   Two named differences from the legacy game:
   - What sets it. Here the orbits also hold while the card of a body of the system is open (a planet's, the
     star's, a moon's, a dwarf planet's, a comet's or the visitor's), so what a player is reading about stays where
     it was pressed. The legacy game holds only on approach and landing; an open card alone does not hold its
     orbits. Dakk's rulings of 2026-11-26 (planets) and 2026-11-27 (every body). The map screen calls hold and release; approach and landing
     call the same two when they arrive.
   - What a release does. Here the orbits go on from where they were held: no world jumps. In the legacy game a
     release returns to the running clock, so every world jumps ahead by the length of the hold.

   Pure: the only clock is the one given. */

export interface OrbitClock {
  /** The seconds the orbits have run. */
  time(): number;
  /** Holds the orbits where they are. A hold while held keeps the first instant. */
  hold(): void;
  /** Lets the orbits run on from where they were held. */
  release(): void;
}

/** `now` gives the seconds of the running clock. */
export function orbitClock(now: () => number): OrbitClock {
  /** The seconds spent under holds that have ended. */
  let lost = 0;
  let heldAt: number | null = null;
  const time = (): number => heldAt ?? now() - lost;
  return {
    time,
    hold() { heldAt = time(); },
    release() {
      if (heldAt === null) return;
      lost = now() - heldAt;
      heldAt = null;
    },
  };
}
