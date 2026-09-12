import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { articles, sources, type Block } from '@/lib/content';
import { href } from '@/lib/site';
export const dynamicParams = false;
export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = articles.find((a) => a.slug === slug);
  return a
    ? {
        title: a.title,
        description: a.summary,
        openGraph: {
          title: a.title,
          description: a.summary,
          type: 'article',
          modifiedTime: a.updatedAt,
        },
      }
    : {};
}
const sections = [
  'ひとことで言うと',
  '何が変わるのか',
  '現在の状況',
  '法案・制度の進行状況',
  '主な日付',
  '誰に影響するか',
  'なぜ議論になっているか',
  '賛成側の主な理由',
  '反対・慎重側の主な理由',
  '誤解しやすい点',
  '今後どうなるか',
  '一次情報・出典',
  '最終確認日',
];
function Refs({ refs }: { refs: string[] }) {
  return refs.map((id) => (
    <a
      className="ref"
      key={id}
      href={`#source-${id}`}
      aria-label={`出典：${sources.find((s) => s.id === id)?.title}`}
    >
      [{sources.findIndex((s) => s.id === id) + 1}]
    </a>
  ));
}
function Text({ block }: { block: Block }) {
  return (
    <p>
      {block.text}
      <Refs refs={block.refs} />
    </p>
  );
}
function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => (
        <Text key={i} block={b} />
      ))}
    </>
  );
}
export default async function Topic({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = articles.find((a) => a.slug === slug);
  if (!a) notFound();
  const used = new Set([
    ...a.summaryRefs,
    ...a.events.map((e) => e.ref),
    ...[
      ...a.changes,
      a.current,
      ...a.affected,
      a.debate,
      ...a.pros,
      ...a.cons,
      ...a.misunderstandings,
      ...a.next,
    ].flatMap((b) => b.refs),
  ]);
  const section = (n: number, children: React.ReactNode) => (
    <section className="article-section" id={`section-${n}`}>
      <h2>
        <span className="section-number">{String(n).padStart(2, '0')}</span>
        {sections[n - 1]}
      </h2>
      {children}
    </section>
  );
  return (
    <main id="main">
      <div className="crumb">
        <a href={href('/')}>テーマ一覧</a> / {a.title}
      </div>
      <div className="article-layout">
        <nav className="toc" aria-label="この記事の目次">
          <h2>この記事でわかること</h2>
          {sections.map((s, i) => (
            <a key={s} href={`#section-${i + 1}`}>
              {String(i + 1).padStart(2, '0')}　{s}
            </a>
          ))}
        </nav>
        <article>
          <header className="article-head">
            <div className="card-meta">
              <span className={`badge ${a.pending ? 'wait' : 'active'}`}>
                {a.status}
              </span>
              {a.categories.join(' / ')}
            </div>
            <h1>{a.title}</h1>
            <p>{a.subtitle}</p>
            <p className="meta">
              {a.kind} · 最終確認{' '}
              <time dateTime={a.checkedAt}>{a.checkedAt}</time>
              <br />
              {a.lawId}
            </p>
          </header>
          <details className="mobile-toc">
            <summary>この記事の目次を開く</summary>
            <nav aria-label="この記事の目次（モバイル）">
              {sections.map((s, i) => (
                <a key={s} href={`#section-${i + 1}`}>
                  {String(i + 1).padStart(2, '0')}　{s}
                </a>
              ))}
            </nav>
          </details>
          <section className="summary" id="section-1">
            <h2>01　ひとことで言うと</h2>
            <p>{a.summary}</p>
            <Refs refs={a.summaryRefs} />
          </section>
          {section(2, <Blocks blocks={a.changes} />)}
          {section(
            3,
            <>
              <span className="kind">確認できた事実</span>
              <Text block={a.current} />
            </>,
          )}
          {section(
            4,
            <>
              <p className="note">
                資料で確認できた節目を表示しています。「予定」は実施済みを意味しません。
              </p>
              <ol className="timeline">
                {a.events.map((e, i) => (
                  <li key={i} className={e.planned ? 'planned' : 'done'}>
                    <strong>{e.label}</strong>
                    <span>
                      <time dateTime={e.date}>{e.date}</time> ·{' '}
                      {e.planned ? '予定' : '確認済み'}
                      <Refs refs={[e.ref]} />
                    </span>
                  </li>
                ))}
              </ol>
            </>,
          )}
          {section(
            5,
            <table className="dates">
              <caption className="note">成立・公布・適用開始の主な日付</caption>
              <tbody>
                {a.events.map((e, i) => (
                  <tr key={i}>
                    <th scope="row">{e.date}</th>
                    <td>
                      {e.label}
                      <Refs refs={[e.ref]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>,
          )}
          {section(6, <Blocks blocks={a.affected} />)}
          {section(
            7,
            <>
              <span className="kind">論点の整理</span>
              <Text block={a.debate} />
            </>,
          )}
          {section(
            8,
            <>
              <span className="kind">意見・制度を進める側の説明の要約</span>
              <Blocks blocks={a.pros} />
            </>,
          )}
          {section(
            9,
            <>
              <span className="kind">
                意見・留意点の要約（制度全体への反対とは限りません）
              </span>
              <Blocks blocks={a.cons} />
            </>,
          )}
          {section(10, <Blocks blocks={a.misunderstandings} />)}
          {section(11, <Blocks blocks={a.next} />)}
          {section(
            12,
            <>
              <p className="note">
                本文の番号から、根拠にした資料をたどれます。見解の紹介は当サイトの賛否を示すものではありません。
              </p>
              <ol className="source-list">
                {sources
                  .filter((s) => used.has(s.id))
                  .map((s) => (
                    <li
                      value={sources.findIndex((x) => x.id === s.id) + 1}
                      id={`source-${s.id}`}
                      key={s.id}
                    >
                      <a href={s.url}>{s.title} ↗</a>
                      <small>
                        {s.publisher} · 確認 {s.checkedAt}
                        <br />
                        {s.note}
                      </small>
                    </li>
                  ))}
              </ol>
            </>,
          )}
          {section(
            13,
            <>
              <p>
                最終確認日：<time dateTime={a.checkedAt}>{a.checkedAt}</time>
                <br />
                記事更新日：{a.updatedAt}
              </p>
              <p className="note">
                {a.reviewNote}{' '}
                内容が更新される可能性があります。個別の適用や手続きは、最新の公式案内でご確認ください。
              </p>
              <a href={href('/about/')}>更新方針と訂正の扱い</a>
            </>,
          )}
          <p>
            <a href={href('/')}>← テーマ一覧に戻る</a>
          </p>
        </article>
      </div>
    </main>
  );
}
