export const COMPENDIUM_CERTIFICATE_REPORT: string;
export function certificateSourceIdentity(): { commit: string; state: 'committed' | 'dirty-diagnostic'; statusSha256: string };
export function runCompendiumCertificateGate(): number;
export function verifyCompendiumCertificateRun(expectedRunId: string): number;
