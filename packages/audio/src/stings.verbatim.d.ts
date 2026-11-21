/* Hand-written types for the auto-lifted audio stings. */
/* EDITED 2026-11-21 (task m3a-14, Dakk's word): playWhoosh takes its random source, a function returning a number in [0, 1). */
export function sfxOut(a: AudioContext): GainNode;
export function applySfxGain(): void;
export function playRaritySting(tier: number): void;
export function playSurveyPing(): void;
export function playWhoosh(random: () => number): void;
