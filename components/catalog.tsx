'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { articles, matches } from '@/lib/content';
import { href } from '@/lib/site';
export default function Catalog() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('すべて');
  const [status, setStatus] = useState('すべて');
  const categories = [
    'すべて',
    ...new Set(articles.flatMap((a) => a.categories)),
  ];
  const filtered = articles
    .filter((a) => matches(a, query, category, status))
    .sort(
      (a, b) =>
        b.updatedAt.localeCompare(a.updatedAt) || a.slug.localeCompare(b.slug),
    );
  function reset() {
    setQuery('');
    setCategory('すべて');
    setStatus('すべて');
  }
  return (
    <>
      <div className="status-grid" aria-label="状況で絞り込み">
        {['すべて', '審議中・継続審査', '成立済み', '施行待ち'].map((s) => (
          <button
            type="button"
            className="stat"
            key={s}
            aria-pressed={status === s}
            onClick={() => setStatus(s)}
          >
            <span>{s === 'すべて' ? '掲載テーマ' : s}</span>
            <strong>
              {articles.filter((a) => matches(a, '', 'すべて', s)).length}
              <span> 件</span>
            </strong>
          </button>
        ))}
      </div>
      <p className="note">
        掲載テーマ内の件数です。継続審査は閉会中審査を含み、現在会議で審議している意味ではありません。成立済みと施行待ちは重複します。同じ法律を扱うテーマもあります。
      </p>
      <div className="catalog-layout">
        <div>
          <div className="tools">
            <label className="search-label" htmlFor="search">
              気になるテーマを探す
            </label>
            <div className="search-wrap">
              <Input
                id="search"
                type="search"
                placeholder="キーワードで検索（例：パート、医療費）"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <p className="search-label">現在地を選ぶ</p>
            <div className="categories" aria-label="現在地を詳しく絞り込み">
              {[
                'すべて',
                '審議中',
                '継続審査',
                '成立済み',
                '施行待ち',
                '一部施行',
                '施行済み',
              ].map((s) => (
                <button
                  type="button"
                  className="chip"
                  key={s}
                  aria-pressed={status === s}
                  onClick={() => setStatus(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="search-label">分野を選ぶ</p>
            <div className="categories" aria-label="分野で絞り込み">
              {categories.map((c) => (
                <button
                  type="button"
                  className="chip"
                  key={c}
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="results-heading">
            <h2>
              最近更新されたテーマ{' '}
              <span aria-live="polite" aria-atomic="true">
                ／ {filtered.length}件
              </span>
            </h2>
            <button className="reset" onClick={reset}>
              条件をリセット
            </button>
          </div>
          {filtered.length === 0 ? (
            <div className="empty">
              <h3>該当する掲載テーマはありません</h3>
              <p>
                別のキーワードや条件でお試しください。未掲載の法案・政策の状況を示すものではありません。
              </p>
              <button className="chip" onClick={reset}>
                すべてのテーマを見る
              </button>
            </div>
          ) : (
            filtered.map((a) => (
              <article key={a.slug} className="topic-card">
                <div className="card-meta">
                  <span
                    className={`badge ${a.status === '施行待ち' ? 'wait' : 'active'}`}
                  >
                    {a.status}
                  </span>
                  <span>{a.categories.join(' / ')}</span>
                </div>
                <h3>
                  <a href={href(`/topics/${a.slug}/`)}>{a.title}</a>
                </h3>
                <p>{a.summary}</p>
                <div className="card-bottom">
                  <span>
                    最終確認{' '}
                    <time dateTime={a.checkedAt}>
                      {a.checkedAt.replaceAll('-', '.')}
                    </time>
                  </span>
                  <a
                    className="read-link"
                    href={href(`/topics/${a.slug}/`)}
                    aria-label={`${a.title}の解説を読む`}
                  >
                    解説を読む <span aria-hidden="true">→</span>
                  </a>
                </div>
              </article>
            ))
          )}
          <noscript>
            検索・絞り込みにはJavaScriptが必要です。すべての記事は上のリンクから読めます。
          </noscript>
        </div>
        <aside className="sidebar">
          <section className="side-panel">
            <p className="eyebrow">READING GUIDE</p>
            <h2>
              「成立」と「施行」は
              <br />
              違う段階です。
            </h2>
            <ol>
              <li>
                <strong>審議</strong>：国会で内容を話し合う
              </li>
              <li>
                <strong>成立</strong>：法律ができる
              </li>
              <li>
                <strong>公布</strong>：法律を正式に知らせる
              </li>
              <li>
                <strong>施行</strong>：法律の適用が始まる
              </li>
            </ol>
            <p>一つの法律でも、項目ごとに開始日が違う場合があります。</p>
            <a className="side-link" href={href('/about/')}>
              進行状況の読み方 →
            </a>
          </section>
          <section className="side-panel">
            <h2>一次情報を、出発点に。</h2>
            <p>
              政府・省庁・国会の資料を確認し、事実と意見を分けて整理しています。賛否を決めるのは、読む人自身です。
            </p>
            <div className="legend">
              <span className="dot" aria-hidden="true" />
              出典と最終確認日を掲載
            </div>
            <a className="side-link" href={href('/about/')}>
              編集方針・更新方法 →
            </a>
          </section>
        </aside>
      </div>
    </>
  );
}
