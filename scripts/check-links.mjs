import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const root = path.resolve('dist/client');
const base = process.env.BASE_PATH || '';
let checked = 0;
const errors = [];
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)],
  );
}
for (const file of walk(root).filter((f) => f.endsWith('.html'))) {
  const html = readFileSync(file, 'utf8');
  if (!html.includes('lang="ja"'))
    errors.push(`${file}: missing Japanese language`);
  if ((html.match(/<h1[ >]/g) || []).length !== 1)
    errors.push(`${file}: h1 count`);
  const localUrl =
    'https://local.test' +
    base +
    '/' +
    path.relative(root, file).replace(/index\.html$/, '');
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const raw = match[1].replaceAll('&amp;', '&');
    if (/^(https?:|mailto:|data:)/.test(raw)) continue;
    const u = new URL(raw, localUrl);
    let pathname = decodeURIComponent(u.pathname);
    if (base) {
      if (!pathname.startsWith(base + '/') && pathname !== base) {
        errors.push(`Missing base path: ${raw}`);
        continue;
      }
      pathname = pathname.slice(base.length);
    }
    let dest = path.join(root, pathname);
    if (pathname.endsWith('/')) dest = path.join(dest, 'index.html');
    else if (!path.extname(dest))
      dest = existsSync(dest + '.html')
        ? dest + '.html'
        : path.join(dest, 'index.html');
    if (!existsSync(dest)) {
      errors.push(`Missing link: ${raw} in ${path.relative(root, file)}`);
      continue;
    }
    if (u.hash && dest.endsWith('.html')) {
      const target = readFileSync(dest, 'utf8');
      if (!target.includes(`id="${decodeURIComponent(u.hash.slice(1))}"`))
        errors.push(`Missing anchor ${raw}`);
    }
    checked++;
  }
}
console.log(`Checked ${checked} internal links/assets and anchors.`);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
if (process.argv.includes('--external')) {
  const sources = JSON.parse(readFileSync('content/sources.json'));
  const results = Array.from({ length: sources.length });
  let next = 0;
  async function worker() {
    while (next < sources.length) {
      const index = next++;
      const s = sources[index];
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const r = await fetch(s.url, {
            signal: AbortSignal.timeout(30000),
            redirect: 'follow',
          });
          await r.body?.cancel();
          results[index] = {
            id: s.id,
            url: s.url,
            status: r.status,
            ok: r.ok,
            attempt,
          };
        } catch (e) {
          results[index] = {
            id: s.id,
            url: s.url,
            ok: false,
            error: e.message,
            attempt,
          };
        }
        if (results[index].ok) break;
      }
    }
  }
  await Promise.all(Array.from({ length: 3 }, () => worker()));
  writeFileSync(
    'docs/link-check.json',
    JSON.stringify(
      { checkedAt: new Date().toISOString(), internalLinks: checked, results },
      null,
      2,
    ) + '\n',
  );
  console.log(results.map((r) => `${r.id}: ${r.status || r.error}`).join('\n'));
  if (results.some((r) => !r.ok)) process.exitCode = 1;
}
