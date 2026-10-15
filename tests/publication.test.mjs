import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const script = path.resolve('scripts/postbuild.mjs');
const articles = JSON.parse(readFileSync('content/articles.json'));
function run(site, base = '') {
 const dir = mkdtempSync(path.join(tmpdir(), 'p08-meta-'));
 mkdirSync(path.join(dir, 'content'));
 writeFileSync(path.join(dir, 'content/articles.json'), JSON.stringify(articles));
 const routes = ['/', '/about/', '/privacy/', '/contact/', ...articles.map(a => `/topics/${a.slug}/`)];
 for (const r of routes) {
  const p = path.join(dir, 'dist/client', r); mkdirSync(p, {recursive:true});
  writeFileSync(path.join(p, 'index.html'), '<html><head><title>test</title></head><body><a href="/_next/test.js">test</a></body></html>');
 }
 const env = {...process.env, BASE_PATH:base}; delete env.SITE_URL;
 if (site) env.SITE_URL = site;
 const result = spawnSync(process.execPath, [script], {cwd:dir, env, encoding:'utf8'});
 const read = p => readFileSync(path.join(dir,'dist/client',p),'utf8');
 return {result,read,clean:()=>rmSync(dir,{recursive:true,force:true})};
}
test('preview is noindex and has no public sitemap URLs',()=>{
 const x=run();try {assert.equal(x.result.status,0); assert.match(x.read('privacy/index.html'),/noindex,nofollow/); assert.match(x.read('robots.txt'),/Disallow: \//); assert.doesNotMatch(x.read('sitemap.xml'),/<loc>/);}finally{x.clean();}
});
test('public metadata includes all articles and 4 general routes',()=>{
 const x=run('https://example.org');try{assert.equal(x.result.status,0);assert.equal((x.read('sitemap.xml').match(/<loc>/g)||[]).length,articles.length+4);for(const route of ['about','privacy','contact'])assert.match(x.read(`${route}/index.html`),new RegExp(`canonical" href="https://example.org/${route}/`));}finally{x.clean();}
});
test('project Pages base path is applied to metadata and assets',()=>{
 const x=run('https://example.org/p08','/p08');try{assert.equal(x.result.status,0);assert.match(x.read('contact/index.html'),/https:\/\/example.org\/p08\/contact\//);assert.match(x.read('contact/index.html'),/\/p08\/_next\//);assert.match(x.read('robots.txt'),/https:\/\/example.org\/p08\/sitemap.xml/);}finally{x.clean();}
});
for(const [name,site,base]of [['HTTP','http://example.org',''],['wrong base','https://example.org/wrong','/p08']])test(`reject invalid publication config: ${name}`,()=>{const x=run(site,base);try{assert.notEqual(x.result.status,0);}finally{x.clean();}});
test('national intelligence effective date uses reachable official decree, not old 404',()=>{
 const a=articles.find(a=>a.slug==='national-intelligence');const s=JSON.parse(readFileSync('content/sources.json')).find(s=>s.id==='intelligence-2026');assert.equal(a.verification,'公式本文確認済み');assert.equal(s.url,'https://public-comment.e-gov.go.jp/pcm/download?seqNo=0000318534');assert.match(a.current.text,/附則第1条/);assert.equal(a.events.at(-1).date,'2026-07-31');
});
