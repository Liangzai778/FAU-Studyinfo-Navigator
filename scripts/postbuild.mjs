import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// Target host is Cloudflare Pages (see wrangler.jsonc). Cloudflare Pages serves
// index.html for unknown paths by default (assets.not_found_handling =
// "single-page-application"), so client routes such as /degree work on direct
// load and refresh without any helper file.
//
// Do NOT ship a root-level 404.html here: Cloudflare treats that file as an
// authoritative not-found response and serves it with HTTP 404 instead of
// falling back to index.html, which breaks deep links. This was verified with
// `wrangler pages dev dist` — adding 404.html turns /degree into 404, removing
// it restores 200.
const dist = 'dist';
// .nojekyll is harmless on Cloudflare and keeps GitHub Pages usable as a
// secondary preview target.
await writeFile(join(dist, '.nojekyll'), '');
console.log('postbuild: wrote dist/.nojekyll (no 404.html: SPA fallback is handled by Cloudflare Pages)');
