export function matches(
  a: {
    categories: string[];
    status: string;
    enacted: boolean;
    pending: boolean;
  },
  query: string,
  category: string,
  status: string,
) {
  const words = query
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const searchable = JSON.stringify(a).normalize('NFKC').toLowerCase();
  return (
    words.every((word) => searchable.includes(word)) &&
    (category === 'すべて' || a.categories.includes(category)) &&
    (status === 'すべて' ||
      (status === '成立済み'
        ? a.enacted
        : status === '施行待ち'
          ? a.pending
          : status === '審議中・継続審査'
            ? ['衆議院審議', '参議院審議', '法案提出', '継続審査'].includes(
                a.status,
              )
            : status === '審議中'
              ? ['衆議院審議', '参議院審議', '法案提出'].includes(a.status)
              : a.status === status))
  );
}
