/* Hand-written types for the auto-lifted SurveyPhrases body (verbatim v1.8.9). */
export function climateBand(P: Record<string, unknown>, sys: Record<string, unknown>, orb: number): string;
export function atmosphereText(P: Record<string, unknown>, r: () => number): string;
export function climateText(band: string, r: () => number): string;
export function waterText(P: Record<string, unknown>, band: string, r: () => number): string;
export function gravityText(mul: number): string;
export const COMP: Readonly<Record<string, string>>;
export const TYPE_LABEL: Readonly<Record<string, string>>;
