import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  unlinkSync,
  readdirSync,
} from 'node:fs';
import path from 'node:path';
const root = 'dist/client';
const articles = JSON.parse(readFileSync('content/articles.json'));
const site = process.env.SITE_URL?.replace(/\/$/, '');
const base = process.env.BASE_PATH || '';
if (base && !/^\/[a-zA-Z0-9_-]+$/.test(base))
  throw Error('BASE_PATH must be empty or /repository-name');
if (site) {
  const u = new URL(site);
  if (u.protocol !== 'https:' || u.pathname.replace(/\/$/, '') !== base)
    throw Error('SITE_URL must be HTTPS and its path must match BASE_PATH');
}
const esc = (s) =>
  s.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const pages = [
  {
    path: '/',
    updatedAt: articles
      .map((a) => a.updatedAt)
      .sort()
      .at(-1),
  },
  { path: '/about/', updatedAt: '2026-09-12' },
  { path: '/privacy/', updatedAt: '2026-09-12' },
  { path: '/contact/', updatedAt: '2026-09-12' },
  ...articles.map((a) => ({
    path: `/topics/${a.slug}/`,
    updatedAt: a.updatedAt,
  })),
];
for (const page of pages) {
  const file = path.join(root, page.path, 'index.html');
  const flat = path.join(root, page.path.replace(/\/$/, '') + '.html');
  if (!existsSync(file) && existsSync(flat)) {
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, readFileSync(flat));
  }
  if (!existsSync(file)) throw Error(`Missing exported route: ${page.path}`);
  let html = readFileSync(file, 'utf8');
  const meta = site
    ? `<link rel="canonical" href="${esc(site + page.path)}"><meta property="og:url" content="${esc(site + page.path)}">`
    : '<meta name="robots" content="noindex,nofollow">';
  html = html.replace('</head>', `${meta}</head>`);
  writeFileSync(file, html);
  if (flat !== file && existsSync(flat)) unlinkSync(flat);
}
// Prefix generated module and icon URLs for project Pages. App links already use NEXT_PUBLIC_BASE_PATH.
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(path.join(dir, e.name)) : [path.join(dir, e.name)],
  );
}
if (base)
  for (const file of files(root).filter((f) =>
    /\.(html|js|css|rsc)$/.test(f),
  )) {
    let text = readFileSync(file, 'utf8');
    text = text.replace(/(?<![a-zA-Z0-9_-])\/_next\//g, `${base}/_next/`);
    text = text.replace(/(["'])\/favicon\.svg/g, `$1${base}/favicon.svg`);
    text = text.replace(/(["'])_next\//g, `$1${base.slice(1)}/_next/`);
    writeFileSync(file, text);
  }
writeFileSync(`${root}/.nojekyll`, '');
writeFileSync(
  `${root}/robots.txt`,
  site
    ? `User-agent: *\nAllow: /\nSitemap: ${site}/sitemap.xml\n`
    : 'User-agent: *\nDisallow: /\n',
);
writeFileSync(
  `${root}/sitemap.xml`,
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    (site
      ? pages
          .map(
            (p) =>
              `<url><loc>${esc(site + p.path)}</loc><lastmod>${p.updatedAt}</lastmod></url>`,
          )
          .join('')
      : '') +
    '</urlset>\n',
);
console.log(
  site
    ? `Publication metadata generated for ${site}`
    : 'Preview build: noindex. Set SITE_URL and BASE_PATH for a public sitemap.',
);
