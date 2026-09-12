import test from 'node:test';
import assert from 'node:assert/strict';
import { isOfficialSourceUrl } from '../scripts/official-hosts.mjs';
import { validate } from '../scripts/validate.mjs';

for (const [url, expected] of [
  ['https://www.pref.kanagawa.jp/chiji/', true],
  ['https://pref.kanagawa.jp/chiji/', true],
  ['HTTPS://WWW.PREF.KANAGAWA.JP:443/chiji/', true],
  ['https://www.mhlw.go.jp/', true],
  ['https://laws.e-gov.go.jp/law/', true],
  ['https://pref.kanagawa.jp.example.com/', false],
  ['https://evil-pref.kanagawa.jp/', false],
  ['https://pref-kanagawa.jp/', false],
  ['https://example.com/?url=pref.kanagawa.jp', false],
  ['http://www.pref.kanagawa.jp/', false],
  ['http://www.mhlw.go.jp/', false],
  ['ftp://pref.kanagawa.jp/', false],
  ['https://pref.kanagawa.jp@example.com/', false],
  ['https://www.mhlw.go.jp.example.com/', false],
  ['https://evilgo.jp/', false],
  ['https://example.jp/', false],
  ['https://other.pref.kanagawa.jp/', false],
  ['not a URL', false],
]) {
  test(`official source ${expected ? 'accepts' : 'rejects'} ${url}`, () => {
    assert.equal(isOfficialSourceUrl(url), expected);
    const errors = validate([], [{ id: 'probe', title: 'probe', publisher: 'probe',
      checkedAt: '2026-09-12', note: 'test', url }]);
    const sourceError = errors.some(e => /Non-official source|Invalid source URL/.test(e));
    assert.equal(sourceError, !expected);
  });
}
