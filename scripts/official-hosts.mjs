// Add only individually verified official hosts; never suffix-match this list.
// Kanagawa Prefecture official website, reviewed 2026-09-12.
const verifiedOfficialHosts = new Set([
  'www.pref.kanagawa.jp',
  'pref.kanagawa.jp',
]);

export function isOfficialSourceUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' &&
      (/^(?:[a-z0-9-]+\.)*go\.jp$/.test(url.hostname) ||
        verifiedOfficialHosts.has(url.hostname));
  } catch {
    return false;
  }
}
