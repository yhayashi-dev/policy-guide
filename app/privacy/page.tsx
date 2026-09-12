import type { Metadata } from 'next';
import { href } from '@/lib/site';
export const metadata: Metadata = { title: 'プライバシーポリシー', description: 'サイト内検索、外部リンク、問い合わせに関する情報の取扱い。' };
export default function Privacy() {
 return <main id="main"><article className="policy">
 <p className="eyebrow">情報の取扱い</p><h1>プライバシーポリシー</h1>
 <h2>このサイトで扱う情報</h2>
 <p>現在、会員登録、広告、アクセス解析、サイト内の送信フォームは設置していません。問い合わせは外部のGoogle Formsを利用します。当サイト独自のCookieやブラウザへの永続保存も使用していません。</p>
 <p>テーマ検索と絞り込みはブラウザ内で処理します。入力した検索語を当サイトからサーバーや外部サービスへ送信する仕組みはありません。</p>
 <h2>外部サイトへのリンク</h2>
 <p>出典などのリンク先では、そのサイトのプライバシーポリシーが適用されます。移動先が取得する情報については各サイトの案内をご確認ください。</p>
 <h2>問い合わせ</h2>
 <p>問い合わせ・訂正連絡はGoogle Formsで受け付けます。問い合わせ内容、記事URL、任意の根拠URL、返信希望時の任意メールアドレスを、内容の確認・訂正・必要な返信に使用します。回答内容をそのまま公開することはありません。個人番号や医療情報など、不要な個人情報・秘密情報は送信しないでください。</p>
 <p><a href={href('/contact/')}>問い合わせ・訂正窓口</a></p>
 <p>Google Formsでの情報の取扱いは<a href="https://policies.google.com/privacy">Googleのプライバシーポリシー</a>もご確認ください。</p><h2>配信サービスと方針の変更</h2>
 <p>当サイトはGitHub Pagesで配信します。配信に伴うIPアドレス等の通信情報はGitHubが取り扱う場合があります。当サイト独自のアクセス解析とは区別されます。機能や外部サービスを追加する際には、実際の取扱いに合わせて本方針を更新します。</p>
 <p><a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">GitHubのプライバシーに関する方針</a></p><p className="note">更新日：2026年9月12日</p>
 </article></main>;
}
