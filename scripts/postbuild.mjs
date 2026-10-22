import { copyFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// GitHub Pages has no `_redirects` support, so ship a 404.html that mirrors
// index.html. The SPA router then resolves the path client-side.
const dist = 'dist';
await copyFile(join(dist, 'index.html'), join(dist, '404.html'));
// Prevent GitHub Pages from running Jekyll over the build output.
await writeFile(join(dist, '.nojekyll'), '');
console.log('postbuild: wrote dist/404.html and dist/.nojekyll');
