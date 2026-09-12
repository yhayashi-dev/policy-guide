import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { isOfficialSourceUrl } from './official-hosts.mjs';
export function validate(articles, sources) {
  const errors = [];
  const fail = (m) => errors.push(m);
  const ids = new Set(sources.map((s) => s.id));
  if (ids.size !== sources.length) fail('Duplicate source IDs');
  const slugs = new Set();
  const date = /^\d{4}-\d{2}-\d{2}$/;
  const eventDate = /^\d{4}-\d{2}(-\d{2})?$/;
  const validDate = (d) =>
    date.test(d) &&
    !Number.isNaN(Date.parse(d)) &&
    new Date(d).toISOString().slice(0, 10) === d;
  for (const s of sources) {
    if (!s.id || !s.title || !s.publisher || !validDate(s.checkedAt) || !s.note)
      fail('Incomplete source');
    try {
      const u = new URL(s.url);
      if (!isOfficialSourceUrl(u))
        fail(`Non-official source: ${s.id}`);
    } catch {
      fail(`Invalid source URL: ${s.id}`);
    }
  }
  for (const a of articles) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(a.slug) || slugs.has(a.slug))
      fail('Invalid or duplicate slug');
    slugs.add(a.slug);
    for (const key of [
      'title',
      'subtitle',
      'kind',
      'lawId',
      'summary',
      'reviewNote',
    ])
      if (!a[key]?.trim()) fail(`${a.slug}: missing ${key}`);
    for (const key of ['checkedAt', 'updatedAt', 'publishedAt', 'reviewAfter'])
      if (!validDate(a[key])) fail(`${a.slug}: invalid ${key}`);
    if (
      a.publishedAt > a.updatedAt ||
      a.checkedAt > a.updatedAt ||
      a.reviewAfter <= a.checkedAt
    )
      fail(`${a.slug}: date order`);
    if (typeof a.enacted !== 'boolean' || typeof a.pending !== 'boolean')
      fail(`${a.slug}: flags`);
    if (
      ![
        '検討中',
        '法案提出',
        '衆議院審議',
        '参議院審議',
        '成立',
        '公布',
        '施行待ち',
        '一部施行',
        '施行済み',
        '継続審査',
        '廃案',
        '確認中',
      ].includes(a.status)
    )
      fail(`${a.slug}: invalid status`);
    if (['検討中', '法案提出', '衆議院審議', '参議院審議', '継続審査', '廃案'].includes(a.status) && (a.enacted || a.pending)) fail(`${a.slug}: unpassed proposal flags`);
    if (a.pending && !a.enacted) fail(`${a.slug}: pending without enactment`);
    if (a.status === '施行済み' && a.pending)
      fail(`${a.slug}: implemented and pending`);
    if (!a.categories?.length) fail(`${a.slug}: no categories`);
    const refs = (r) => {
      if (!Array.isArray(r)) {
        fail('Missing references');
        return;
      }
      for (const id of r) if (!ids.has(id)) fail(`Unknown source ${id}`);
    };
    refs(a.summaryRefs);
    if (!a.summaryRefs?.length) fail('Summary has no evidence');
    for (const key of [
      'changes',
      'affected',
      'pros',
      'cons',
      'misunderstandings',
      'next',
    ]) {
      if (!a[key]?.length) fail(`Missing ${key}`);
      for (const b of a[key] || []) {
        if (!b.text) fail('Empty block');
        refs(b.refs);
        if (!b.refs?.length && !(key === 'cons' && b.text.includes('確認')))
          fail('Unsourced block');
      }
    }
    for (const key of ['current', 'debate']) {
      if (!a[key]?.text || !a[key]?.refs?.length)
        fail(`Unsubstantiated ${key}`);
      refs(a[key]?.refs);
    }
    if (!a.events?.length) fail('No events');
    for (const e of a.events || []) {
      refs([e.ref]);
      if (!eventDate.test(e.date) || !e.label || typeof e.planned !== 'boolean')
        fail('Invalid event');
      if (!e.planned && e.date > a.checkedAt)
        fail('Future event marked complete');
    }
  }
  return errors;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const a = JSON.parse(readFileSync('content/articles.json'));
  const s = JSON.parse(readFileSync('content/sources.json'));
  const errors = validate(a, s);
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
  console.log(`Validated ${a.length} topics and ${s.length} official sources.`);
}
