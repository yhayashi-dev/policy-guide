import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validate } from '../scripts/validate.mjs';
import { matches } from '../lib/search.ts';
const a = JSON.parse(readFileSync('content/articles.json'));
const s = JSON.parse(readFileSync('content/sources.json'));
test('published data is valid', () => assert.deepEqual(validate(a, s), []));
for (const [name, mutate] of [
  ['missing source', (x) => (x[0].summaryRefs = ['missing'])],
  ['future event marked complete', (x) => (x[0].events[0].date = '2099-01-01')],
  ['missing confirmation date', (x) => (x[0].checkedAt = '')],
  ['invalid calendar date', (x) => (x[0].updatedAt = '2026-02-30')],
  ['duplicate slug', (x) => (x[1].slug = x[0].slug)],
  ['invalid status', (x) => (x[0].status = 'guess')],
  [
    'inconsistent implementation',
    (x) => {
      x[0].status = '施行済み';
      x[0].pending = true;
    },
  ],
  ['missing dissent section', (x) => (x[0].cons = [])],
])
  test(`rejects ${String(name)}`, () => {
    const x = structuredClone(a);
    mutate(x);
    assert.ok(validate(x, s).length > 0);
  });
test('no fictional deliberating topic', () =>
  assert.equal(a.filter((x) => matches(x, '', 'すべて', '審議中')).length, 0));
test('pending includes partial implementations', () =>
  assert.equal(
    a.filter((x) => matches(x, '', 'すべて', '施行待ち')).length,
    16,
  ));
test('Japanese keyword and category combine', () =>
  assert.deepEqual(
    a.filter((x) => matches(x, '医療費', '医療', 'すべて')).map((x) => x.slug),
    ['high-cost-medical'],
  ));
test('width normalization works', () =>
  assert.equal(
    matches(
      a.find((x) => x.slug === 'social-insurance'),
      '１０６',
      'すべて',
      'すべて',
    ),
    true,
  ));
test('multiple keywords use AND', () =>
  assert.equal(
    a.filter((x) => matches(x, '医療費 架空語', 'すべて', 'すべて')).length,
    0,
  ));
test('source content is not executable markup', () =>
  assert.ok(!JSON.stringify(a).includes('<script')));

test('at least thirty topics and all original slugs preserved', () => {
  assert.ok(a.length >= 30);
  for (const slug of ['pension-reform','social-insurance','high-cost-medical','working-pension','childcare-pension']) assert.ok(a.some(x => x.slug === slug));
});
test('recess review stays distinct from active deliberation and enacted laws', () => {
  const recess = a.filter(x => matches(x, '', 'すべて', '継続審査'));
  assert.equal(recess.length, 8);
  for (const topic of recess) {
    assert.equal(matches(topic, '', 'すべて', '審議中'), false);
    assert.equal(matches(topic, '', 'すべて', '審議中・継続審査'), true);
    assert.equal(matches(topic, '', 'すべて', '成立済み'), false);
    assert.equal(matches(topic, '', 'すべて', '施行待ち'), false);
  }
});
test('new topics combine keyword, category and status', () => {
  assert.deepEqual(a.filter(x => matches(x, '住宅', '税金', '継続審査')).map(x => x.slug), ['housing-speculation-tax']);
  assert.deepEqual(a.filter(x => matches(x, 'パスポート', '行政', '施行済み')).map(x => x.slug), ['passport-reform']);
});
test('all requested fields have published coverage', () => {
  const categories = new Set(a.flatMap(x => x.categories));
  for (const c of ['税金','社会保障','年金','医療','雇用','子育て','教育','家族制度','行政','デジタル','経済','安全保障','皇室']) assert.ok(categories.has(c), c);
});
test('unpassed proposals cannot acquire enacted or waiting flags', () => {
  const x = structuredClone(a);
  const topic = x.find(x => x.status === '継続審査');
  topic.enacted = true;
  assert.ok(validate(x, s).length);
});
