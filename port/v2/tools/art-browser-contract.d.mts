export const ART_BROWSER_PROVENANCE_SCHEMA: 'cf-v2-art-browser-provenance/v1';

export type ArtBrowserProvenance = Readonly<{
  schema: typeof ART_BROWSER_PROVENANCE_SCHEMA;
  executable: string;
  product: string;
  revision: string;
  user_agent: string;
  js_version: string;
  protocol_version: '1.3';
}>;

export function validateArtBrowserVersion(
  version: unknown,
  executable: string,
  tool?: string,
): ArtBrowserProvenance;

export function attestArtBrowserCdp(options: {
  send: (method: string) => unknown | Promise<unknown>;
  executable: string;
  tool: string;
  timeoutMs?: number;
  writeLine?: (line: string) => void;
}): Promise<ArtBrowserProvenance>;

export type ArtBrowserCdp = Readonly<{
  send: (method: string, params?: object, sessionId?: string, options?: object) => Promise<any>;
  browser: Readonly<{
    executable: string;
    product: string;
    revision: string;
    user_agent: string;
    js_version: string;
    protocol_version: string;
  }>;
  pid: number | undefined;
  provenance: ArtBrowserProvenance;
  close: () => Promise<void>;
}>;

export type ArtBrowserCdpOptions = {
  browserFile: string;
  tool: string;
  userDataPrefix: string;
  startupTimeoutMs?: number;
  commandTimeoutMs?: number;
  webSocketOpenTimeoutMs?: number;
  shutdownTimeoutMs?: number;
  onEvent?: (message: any) => void;
  writeLine?: (line: string) => void;
  cleanup?: () => unknown | Promise<unknown>;
};

export function openArtBrowserCdp(
  options: Omit<ArtBrowserCdpOptions, 'cleanup'>,
  dependencies?: {
    openCdp?: (options: object) => Promise<any>;
    environment?: Record<string, string | undefined>;
  },
): Promise<ArtBrowserCdp>;

export function withArtBrowserCdp<T>(
  options: ArtBrowserCdpOptions,
  work: (browser: ArtBrowserCdp) => T | Promise<T>,
  dependencies?: {
    openCdp?: (options: object) => Promise<any>;
    environment?: Record<string, string | undefined>;
  },
): Promise<T>;

export function closeArtToolServer(
  server: any,
  options?: {
    timeoutMs?: number;
    setTimer?: typeof setTimeout;
    clearTimer?: typeof clearTimeout;
  },
): Promise<void>;
