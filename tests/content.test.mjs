import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validate } from '../scripts/validate.mjs';
import { matches } from '../lib/search.ts';
const a = JSON.parse(readFileSync('content/articles.json'));
const s = JSON.parse(readFileSync('content/sources.json'));
const historical = JSON.parse(readFileSync('tests/fixtures/articles-2026-09-12.json'));
const activeSlugs = ['political-donations', 'disability-lifelong-support', 'vehicle-tax-surcharge', 'vehicle-theft', 'special-city', 'electoral-reform', 'small-business-support', 'housing-speculation-tax'];
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
test('current deliberating topics retain exact original bill identities', () => {
  const active = a.filter(x => activeSlugs.includes(x.slug));
  assert.equal(a.filter(x => matches(x, '', 'すべて', '審議中')).length, activeSlugs.length + 5);
  assert.deepEqual(active.map(x => x.slug).sort(), [...activeSlugs].sort());
  for (const topic of active) {
    assert.equal(topic.status, '衆議院審議');
    assert.equal(topic.lawId, historical.find(x => x.slug === topic.slug).lawId);
    assert.equal(topic.enacted, false);
    assert.equal(topic.pending, false);
    assert.ok(topic.current.text.includes('第222回国会'));
    assert.ok(topic.current.text.includes('第221回国会'));
    assert.ok(topic.current.refs.includes('diet-221'));
  }
});
test('pending includes exact future and partial implementations', () =>
  assert.deepEqual(
    a.filter((x) => matches(x, '', 'すべて', '施行待ち')).map(x => x.slug).sort(),
    ['elderly-medical-financial-income','child-safety-dbs','disaster-agency','guardianship-wills','high-cost-medical','imperial-household','income-tax-2026','junior-high-classes','pension-reform','personal-data-reform','public-data-use','social-insurance','solar-panel-recycling','workers-compensation'].sort(),
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
  const recess = historical.filter(x => matches(x, '', 'すべて', '継続審査'));
  assert.equal(historical.length, 30);
  assert.deepEqual(validate(historical, s), []);
  assert.equal(historical.filter(x => matches(x, '', 'すべて', '審議中')).length, 0);
  assert.equal(recess.length, 8);
  for (const topic of recess) {
    assert.equal(matches(topic, '', 'すべて', '審議中'), false);
    assert.equal(matches(topic, '', 'すべて', '審議中・継続審査'), true);
    assert.equal(matches(topic, '', 'すべて', '成立済み'), false);
    assert.equal(matches(topic, '', 'すべて', '施行待ち'), false);
  }
});
test('new topics combine keyword, category and status', () => {
  assert.deepEqual(a.filter(x => matches(x, '住宅', '税金', '衆議院審議')).map(x => x.slug), ['housing-speculation-tax']);
  assert.deepEqual(a.filter(x => matches(x, 'パスポート', '行政', '施行済み')).map(x => x.slug), ['passport-reform']);
});
test('all requested fields have published coverage', () => {
  const categories = new Set(a.flatMap(x => x.categories));
  for (const c of ['税金','社会保障','年金','医療','雇用','子育て','教育','家族制度','行政','デジタル','経済','安全保障','皇室']) assert.ok(categories.has(c), c);
});
test('unpassed proposals cannot acquire enacted or waiting flags', () => {
  for (const original of [a, historical]) {
    for (const flag of ['enacted', 'pending']) {
      const x = structuredClone(original);
      const topic = x.find(x => x.slug === 'political-donations');
      topic[flag] = true;
      assert.ok(validate(x, s).includes(`${topic.slug}: unpassed proposal flags`));
    }
  }
});

// New-session bills are separate identities; an article does not make a proposal law.
test('222 session priority proposals remain unpassed and separate from existing laws', () => {
  const expected = {'food-tax-worker-support': 1, 'hepatitis-b-claim-extension': 9, 'pollution-survivor-compensation': 14, 'local-public-survivor-compensation': 5, 'school-medical-compensation-limit': 8};
  for (const [slug, number] of Object.entries(expected)) {
    const topic = a.find(x => x.slug === slug);
    assert.ok(topic, slug);
    assert.equal(topic.lawId, `第222回国会 閣法第${number}号（未成立）`);
    assert.equal(topic.status, '衆議院審議');
    assert.equal(topic.enacted, false);
    assert.equal(topic.pending, false);
    assert.equal(matches(topic, '', 'すべて', '成立済み'), false);
    assert.equal(matches(topic, '', 'すべて', '施行待ち'), false);
    assert.ok(topic.current.text.includes('成立'));
    assert.ok(topic.next.some(x => x.text.includes('施行')));
    assert.ok(topic.events.filter(x => x.date > topic.checkedAt).every(x => x.planned));
  }
});
