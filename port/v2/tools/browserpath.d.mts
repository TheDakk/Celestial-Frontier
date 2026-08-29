export function assertBrowserLaunchAllowed(
  platform?: NodeJS.Platform,
  codexSandbox?: string,
): void;

export function browserCandidates(explicit?: string): string[];

export function findChromiumBrowser(candidates?: readonly string[]): string;
