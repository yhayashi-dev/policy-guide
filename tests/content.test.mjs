import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validate } from '../scripts/validate.mjs';
import { matches } from '../lib/search.ts';
const a = JSON.parse(readFileSync('content/articles.json'));
const s = JSON.parse(readFileSync('content/sources.json'));
const historical = JSON.parse(readFileSync('tests/fixtures/articles-2026-09-12.json'));
const activeSlugs = ['political-donations', 'disability-lifelong-support', 'vehicle-tax-surcharge', 'vehicle-theft', 'special-city', 'small-business-support', 'housing-speculation-tax'];
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
  assert.equal(a.filter(x => matches(x, '', 'すべて', '審議中')).length, activeSlugs.length + 10);
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
    ['hepatitis-b-claim-extension','pollution-survivor-compensation','local-public-survivor-compensation','elderly-medical-financial-income','child-safety-dbs','disaster-agency','guardianship-wills','high-cost-medical','income-tax-2026','junior-high-classes','pension-reform','personal-data-reform','public-data-use','social-insurance','solar-panel-recycling','workers-compensation'].sort(),
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

test('rejected House bill remains archived and outside active or enacted results', () => {
  const topic = a.find(x => x.slug === 'worker-tax-insurance-relief');
  assert.equal(topic.status, '廃案');
  assert.equal(topic.enacted, false);
  assert.equal(topic.pending, false);
  for (const status of ['審議中', '成立済み', '施行待ち']) assert.equal(matches(topic, '', 'すべて', status), false);
  assert.ok(topic.current.text.includes('否決') && topic.current.text.includes('本院議了'));
});

// New-session bills are separate identities; an article does not make a proposal law.
test('222 session priority bills retain identities and confirmed enactment stages', () => {
  const expected = {'food-tax-worker-support': 1, 'hepatitis-b-claim-extension': 9, 'pollution-survivor-compensation': 14, 'local-public-survivor-compensation': 5, 'school-medical-compensation-limit': 8};
  for (const [slug, number] of Object.entries(expected)) {
    const topic = a.find(x => x.slug === slug);
    assert.ok(topic, slug);
    const enacted = [5, 9, 14].includes(number);
    assert.equal(topic.lawId, enacted ? `令和8年法律第${({5:86,9:88,14:87})[number]}号（第222回国会 閣法第${number}号）` : `第222回国会 閣法第${number}号（未成立）`);
    assert.equal(topic.status, enacted ? '公布' : '参議院審議');
    assert.equal(topic.enacted, enacted);
    assert.equal(topic.pending, enacted);
    assert.equal(matches(topic, '', 'すべて', '成立済み'), enacted);
    assert.equal(matches(topic, '', 'すべて', '施行待ち'), enacted);
    assert.ok(topic.current.text.includes('成立'));
    assert.ok(topic.next.some(x => x.text.includes('施行')));
    assert.ok(topic.events.filter(x => x.date > topic.checkedAt).every(x => x.planned));
  }
});

test('Senate tax measures proposal stays separate from government tax bill and rejected House bill', () => {
  const x = a.find(x => x.slug === 'consumption-tax-five-percent-measures');
  assert.equal(x.lawId, '第222回国会 参法第2号（未成立）');
  assert.equal(x.status, '参議院審議');
  assert.equal(x.enacted, false); assert.equal(x.pending, false);
  assert.equal(matches(x, '消費税', '税金', '審議中'), true);
  assert.equal(matches(x, '', 'すべて', '成立済み'), false);
  assert.ok(x.changes.some(b => b.text.includes('法制上の措置')));
  const date = x.events.find(e => e.date === '2027-04-01');
  assert.equal(date.planned, true);
  assert.equal(a.find(x => x.slug === 'worker-tax-insurance-relief').status, '廃案');
});

test('local election act enactment remains distinct from promulgation and commencement', () => {
  const x = a.find(x => x.slug === 'local-election-dates-2027');
  assert.equal(x.status, '施行済み'); assert.equal(x.enacted, true); assert.equal(x.pending, false);
  assert.equal(matches(x, '', 'すべて', '審議中'), false);
  assert.equal(matches(x, '', 'すべて', '施行待ち'), false);
  assert.equal(matches(x, '', 'すべて', '成立済み'), true);
  assert.match(x.current.text, /11月18日施行/); assert.ok(x.current.refs.includes('local-elections-2027-law83'));
  assert.equal(x.events.find(e => e.date === '2026-11-11').planned, false);
  assert.equal(x.events.find(e => e.date === '2027-04-11').planned, true);
});

test('new Senate worker relief proposal does not revive the rejected same-title House bill', () => {
  const x = a.find(x => x.slug === 'worker-tax-insurance-relief-senate');
  const old = a.find(x => x.slug === 'worker-tax-insurance-relief');
  assert.equal(x.lawId, '第222回国会 参法第3号（未成立）');
  assert.equal(x.status, '参議院審議'); assert.equal(x.enacted, false); assert.equal(x.pending, false);
  assert.equal(old.status, '廃案');
  assert.equal(matches(old, '', 'すべて', '審議中'), false);
  assert.equal(matches(x, '', 'すべて', '審議中'), true);
  assert.ok(x.changes.some(b => b.text.includes('2027年分')));
  assert.ok(x.changes.some(b => b.text.includes('2028年度分')));
  assert.ok(x.current.refs.includes('sn222-3-text'));
});

test('rejected pollution amendment is not described as adopted law or commenced benefit', () => {
  for (const slug of ['hepatitis-b-claim-extension','pollution-survivor-compensation','local-public-survivor-compensation']) {
    const topic = a.find(x => x.slug === slug);
    for (const event of topic.events.filter(e => e.date > topic.checkedAt)) {
      assert.equal(event.planned, true);
      assert.ok(!event.label.includes('未成立'), slug);
    }
  }
  const x = a.find(x => x.slug === 'pollution-survivor-compensation');
  assert.equal(x.status, '公布'); assert.equal(x.pending, true);
  assert.match(x.current.text, /令和8年法律第87号/); assert.match(x.current.text, /施行の正式情報は今回確認できていません/);
  const block = x.misunderstandings.find(b => b.refs.includes('k222-14-rejected-amendment'));
  assert.match(block.text, /否決/); assert.match(block.text, /成立した改正内容として案内しません/);
});

// Newly published bills remain proposals, with distinct identities and conditional rules.
test('new electoral bill does not replace the carried-over bill or enact a fixed election date', () => {
  const x=a.find(x=>x.slug==='house-electoral-system-revision-222');
  assert.equal(x.lawId,'第222回国会 衆法第3号（未成立）');assert.equal(x.enacted,false);assert.equal(x.pending,false);
  assert.equal(a.find(x=>x.slug==='electoral-reform').lawId,historical.find(x=>x.slug==='electoral-reform').lawId);
  const text=JSON.stringify(x);for(const word of ['145','434','1.4','別の法律','第221回衆法28号'])assert.ok(text.includes(word));
});
test('street speech proposal separates excluded election campaigns and command-violation penalties', () => {
  const x=a.find(x=>x.slug==='street-speech-obstruction-bill');assert.equal(x.enacted,false);assert.equal(x.pending,false);assert.equal(x.status,'参議院審議');
  const text=JSON.stringify(x);for(const word of ['選挙運動を除く','命令に違反','6か月','20万円','3か月','不当に侵害'])assert.ok(text.includes(word));
});

test('withdrawn electoral proposal remains archived separately from the new proposal', () => {
 const old=a.find(x=>x.slug==='electoral-reform'), fresh=a.find(x=>x.slug==='house-electoral-system-revision-222');
 assert.equal(old.status,'廃案');assert.equal(old.enacted,false);assert.equal(old.pending,false);assert.equal(old.lawId,historical.find(x=>x.slug===old.slug).lawId);
 assert.ok(old.current.text.includes('撤回許可'));assert.ok(old.current.text.includes('否決や成立'));assert.ok(old.events.some(x=>x.date==='2026-11-17'&&x.label.includes('撤回許可')&&!x.planned));
 assert.equal(fresh.status,'衆議院審議');assert.equal(fresh.enacted,false);assert.ok(fresh.misunderstandings.some(x=>x.text.includes('撤回が許可')));
});

// Safety distinctions for newly available primary material.
test('child allowances proposal preserves eligibility and adult allowance distinctions', () => {
 const x=a.find(x=>x.slug==='disabled-child-allowance-income-limits');
 assert.equal(x.enacted,false);assert.equal(x.pending,false);assert.equal(x.status,'参議院審議');
 assert.ok(x.changes.some(b=>b.text.includes('施行日に')&&b.text.includes('支給要件')&&b.text.includes('9月30日')));
 assert.ok(x.misunderstandings.some(b=>b.text.includes('特別障害者手当の所得制限を撤廃するものではなく')));
 assert.ok(x.changes.some(b=>b.text.includes('別途必要な法制上の措置')));
 assert.ok(x.events.filter(e=>e.date>x.checkedAt).every(e=>e.planned));
});
test('DBS system pause does not postpone legal commencement or invent an alternative process',()=>{
 const x=a.find(x=>x.slug==='child-safety-dbs');assert.equal(x.status,'施行待ち');assert.equal(x.pending,true);
 assert.ok(x.current.text.includes('システム以外の手続')&&x.current.text.includes('代替手続が既に確定したという意味ではありません'));
 assert.ok(x.current.text.includes('法律の施行延期や義務全体の停止を発表したものとは扱いません'));
 assert.equal(x.events.find(e=>e.date==='2026-12-25').planned,true);
});
