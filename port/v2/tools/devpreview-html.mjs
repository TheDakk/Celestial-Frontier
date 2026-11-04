/** The development preview's HTML stamp (extracted from devpreview.mjs 2026-09-24 so the Vite BUILD can apply it before the PWA
 * plugin pins each HTML file: a stamp applied after the build left every preview package with a service worker whose pinned
 * HTML hashes no longer matched, so it never installed). devpreview.mjs and apps/game/vite.config.ts both import this. */
export const PROD_ORIGIN = 'https://celestialfrontier.github.io';
export const SCHEMA = 'cf-dev-preview/v3';
export const DEVELOPMENT_CHANNEL = 'development';
/** The env var devpreview.mjs sets for `vite build`: JSON of transformHtml's options without `entryName`. */
export const DEV_PREVIEW_HTML_ENV = 'CF_DEV_PREVIEW_HTML';
function fail(message) { throw new Error(message); }
function assert(condition, message) { if (!condition) fail(message); }
function scriptJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

export function transformHtml(source, {
  expectedOrigin, entryName, commit, shortCommit, clean, publishable,
  developmentVersion, buildId,
}) {
  assert((source.match(/<head(?:\s[^>]*)?>/g) || []).length === 1,
    `${entryName}: expected exactly one <head>`);
  assert((source.match(/<body(?:\s[^>]*)?>/g) || []).length === 1,
    `${entryName}: expected exactly one <body>`);
  const scripts = [...source.matchAll(/<script type="module"([^>]*) src="([^"]+)"><\/script>/g)];
  assert(scripts.length === 1, `${entryName}: expected exactly one built module entry, found ${scripts.length}`);
  const rawEntry = scripts[0][2];
  const entry = `./${rawEntry.replace(/^\/+/, '')}`;
  assert(!entry.includes('..') && /^\.\/[A-Za-z0-9_./-]+\.js$/.test(entry),
    `${entryName}: built module entry is unsafe: ${rawEntry}`);
  const runtime = {
    schema: SCHEMA,
    expectedOrigin,
    productionOrigin: PROD_ORIGIN,
    sourceCommit: commit,
    shortCommit,
    sourceState: clean ? 'committed' : 'dirty-local-only',
    publishable,
    developmentVersion,
    buildId,
    channel: DEVELOPMENT_CHANNEL,
    entry,
  };
  const loader = `<script type="module" data-cf-dev-loader>
const info=Object.freeze(${scriptJson(runtime)});
window.__CF_DEV_PREVIEW__=info;
const local=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
if((location.origin===info.expectedOrigin&&info.publishable)||local){
  import(info.entry).catch((error)=>{ console.error('CF DEV PREVIEW entry failed',error); });
}else{
  document.documentElement.dataset.cfPreviewBlocked='true';
  const block=()=>{ document.body.innerHTML='<main style="max-width:52rem;margin:12vh auto;padding:2rem;font:16px/1.5 system-ui;color:#fff;background:#270d16;border:2px solid #ff6b8b;border-radius:16px"><h1>Development preview blocked</h1><p>This build is bound to a different test origin. It did not start, so it cannot read or write game storage here.</p></main>'; };
  document.readyState==='loading'?addEventListener('DOMContentLoaded',block,{once:true}):block();
}
</script>`;
  const robots = '<meta name="robots" content="noindex,nofollow,noarchive,nosnippet" />';
  let html = source.replace(scripts[0][0], loader);
  html = html.replace(/\b(src|href)="\/([^"]+)"/g, '$1="./$2"');
  html = html.replace(/<\/head>/, `${robots}\n</head>`);
  assert(!/<script type="module"[^>]*\ssrc=/.test(html), `${entryName}: unguarded module entry survived`);
  assert(!html.includes('cf-dev-preview-banner')
    && !html.includes('cf-development-site-banner')
    && !html.includes('data-cf-dev-banner-style'),
    `${entryName}: a visible development corner badge survived packaging`);
  return html;
}
