import type { Metadata } from 'next';
import { href, siteName } from '@/lib/site';
import './globals.css';
export const metadata: Metadata = {
  icons: { icon: href('/favicon.svg') },
  openGraph: { title: siteName, description: '法案や政策の現在地を一次情報とともにやさしく整理します。', type: 'website', locale: 'ja_JP', siteName },
  title: { default: siteName, template: `%s | ${siteName}` },
  description:
    '日本の法案と制度改正を、現在の状況・暮らしへの影響・議論の理由からやさしく読む。一次情報と最終確認日を掲載。',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <a className="skip" href="#main">
          本文へ移動
        </a>
        <header className="site-header">
          <a className="brand" href={href('/')}>
            <span className="brand-mark" aria-hidden="true">
              論
            </span>
            <span>
              法案・政策論点<span className="brand-sub">やさしい解説</span>
            </span>
          </a>
          <nav aria-label="メインナビゲーション">
            <a href={href('/')}>テーマ一覧</a>
            <a href={href('/about/')}>編集方針・読み方</a>
          </nav>
        </header>
        {children}
        <footer>
          <div>
            <strong>法案・政策論点のやさしい解説</strong>
            <p>一次情報から、暮らしに関わる変化を読む。</p>
          </div>
          <nav className="footer-links" aria-label="運営情報">
            <a href={href('/about/')}>このサイト・編集方針</a>
            <a href={href('/privacy/')}>プライバシーポリシー</a>
            <a href={href('/contact/')}>問い合わせ・訂正</a>
          </nav>
          <p className="footer-note">
            政府・行政機関の公式サイトではありません。掲載時点の情報を整理した解説です。
          </p>
        </footer>
      </body>
    </html>
  );
}
