import { href } from '@/lib/site';
export default function NotFound() {
  return (
    <main id="main">
      <div className="policy">
        <h1>ページが見つかりません</h1>
        <p>アドレスが変更されたか、掲載されていないページです。</p>
        <a href={href('/')}>テーマ一覧へ戻る</a>
      </div>
    </main>
  );
}
