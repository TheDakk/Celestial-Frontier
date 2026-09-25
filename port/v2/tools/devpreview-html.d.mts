export declare const PROD_ORIGIN: string;
export declare const SCHEMA: string;
export declare const DEVELOPMENT_CHANNEL: string;
export declare const DEV_PREVIEW_HTML_ENV: string;
export interface DevPreviewHtmlOptions {
  readonly expectedOrigin: string; readonly entryName: string; readonly commit: string; readonly shortCommit: string;
  readonly clean: boolean; readonly publishable: boolean; readonly developmentVersion: string; readonly buildId: string;
}
export declare function transformHtml(source: string, options: DevPreviewHtmlOptions): string;
