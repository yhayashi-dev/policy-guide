import Catalog from '@/components/catalog';
import { articles } from '@/lib/content';
export default function Home() {
  return (
    <main id="main">
      <section className="intro">
        <div>
          <p className="eyebrow">暮らしと制度をつなぐ</p>
          <h1>
            何が変わる？
            <br />
            いま、どの段階？
          </h1>
          <p>法案と政策の現在地を、やさしい言葉で確かめる。</p>
        </div>
        <p className="date-note">
          直近の情報確認
          <strong>
            {articles
              .map((a) => a.checkedAt)
              .sort()
              .at(-1)
              ?.replaceAll('-', '.')}
          </strong>
        </p>
      </section>
      <Catalog />
    </main>
  );
}
