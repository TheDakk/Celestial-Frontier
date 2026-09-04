export type PortableZipInvocation = Readonly<{
  file: string;
  args: readonly string[];
  cwd: string | undefined;
  environment?: Readonly<Record<string, string>>;
}>;

export function portableZipInvocation(
  sourceDirectory: string,
  outputFile: string,
  platform?: NodeJS.Platform,
): PortableZipInvocation;

export function createDirectoryContentsZip(
  sourceDirectory: string,
  outputFile: string,
  options?: {
    platform?: NodeJS.Platform;
    run?: (file: string, args: string[], options: object) => unknown;
    fileExists?: (file: string) => boolean;
  },
): string;
