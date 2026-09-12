import type { Metadata } from 'next';
import { href } from '@/lib/site';
export const metadata: Metadata = { title: '問い合わせ・訂正窓口', description: '記事の訂正連絡・問い合わせの受付状況と、連絡に必要な情報。' };
export default function Contact() {
 return <main id="main"><article className="policy">
 <p className="eyebrow">問い合わせ・訂正</p><h1>記事についてのご連絡</h1>
 <p><a href="https://docs.google.com/forms/d/e/1FAIpQLSctt-PMHSHQmo_s-BiMGLCp1P0E7Y3ZSDh8lCPW3r9LFL458g/viewform?usp=publish-editor" target="_blank" rel="noopener noreferrer">問い合わせ・訂正連絡フォームを開く（Google Forms・別タブ）</a></p><p className="note">返信を希望する場合のみ、フォームの任意メール欄をご利用ください。</p>
 <h2>お知らせいただきたいこと</h2>
 <ul><li>対象の記事名またはURL</li><li>訂正が必要と思われる箇所と理由</li><li>確認に使える公式資料のURL（分かる場合）</li></ul>
 <p>氏名、住所、個人番号、口座情報、医療情報などの個人情報や秘密情報は送らないでください。個別の申請や給付の相談は、それぞれの公式窓口をご利用ください。</p>
 <h2>訂正の進め方</h2>
 <p>一次情報と該当する記述を再確認し、誤りが確認された場合は訂正します。重要な変更は記事更新日と更新履歴に反映します。ご指摘の採用や個別の回答を保証するものではありません。</p>
 <p><a href={href('/about/')}>編集・出典・更新方針</a> ／ <a href={href('/privacy/')}>プライバシーポリシー</a></p>
 </article></main>;
}
