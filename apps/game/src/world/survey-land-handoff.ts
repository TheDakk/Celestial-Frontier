/* The order of the two barriers between Survey and Landing.

   The route into a system can still own an ordinary persistence checkpoint, and Survey installs a second
   one. This owns only the order between those two barriers, the exact Survey settlement, and Landing. It
   never retries, persists, reads a clock, or knows game state. */
export interface SurveyLandHandoff {
  readonly waitForCurrentBarrier: () => Promise<void>;
  readonly startSurvey: () => Promise<boolean> | null;
  readonly land: () => Promise<boolean>;
}

export async function runSurveyLandHandoff(input: SurveyLandHandoff): Promise<boolean> {
  await input.waitForCurrentBarrier();
  const surveySettlement = input.startSurvey();
  if (surveySettlement === null) return false;
  /* Observe rejection immediately. Deferring the first handler until after the replacement barrier can leak
     an unhandled rejection while that barrier is legitimately still pending. The observation adds no retry
     and preserves the original rejection after the barrier is drained. */
  const observedSettlement = surveySettlement.then(
    (value) => Object.freeze({ kind: 'fulfilled' as const, value }),
    (error: unknown) => Object.freeze({ kind: 'rejected' as const, error }),
  );
  await input.waitForCurrentBarrier();
  const observed = await observedSettlement;
  if (observed.kind === 'rejected') throw observed.error;
  if (!observed.value) return false;
  return input.land();
}
