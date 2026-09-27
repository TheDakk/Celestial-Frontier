import type { CompendiumMeasurementAuthority, CompendiumProducerAuthority } from './compendiummem-contract.mjs';
export type CertificateResult = {ok: boolean; errors: string[]; epoch: string|null; source: string|null};
export function readActiveCompendiumBudget(): {measurementAuthority: CompendiumMeasurementAuthority; producerAuthority: CompendiumProducerAuthority};
export function verifyActiveCompendiumCertificate(measurement: CompendiumMeasurementAuthority, producer: CompendiumProducerAuthority, options?: {read?: (path: string) => Buffer}): CertificateResult;
export const activeCompendiumMeasurementSources: {collector: string; outcomeContract: string};
