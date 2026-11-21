import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { gemini, renderArticle, runPrototype } from './prototype.mjs';
import { updateSitemap } from './staging.mjs';

const [siteDir, outputDir, mode] = process.argv.slice(2);
if (!siteDir || !outputDir || (mode && mode !== '--check-input')) {
  throw new Error('使い方: node seo/first-article.mjs サイトのフォルダ 出力先 [--check-input]');
}
const origin = 'https://adjuto-service.github.io';
const brief = JSON.parse(await readFile(new URL('./first-article.json', import.meta.url), 'utf8'));
const day = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date());
const plain = html => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const compact = value => value.replace(/\s/g, '');
const pages = new Map();
const xml = await readFile(join(siteDir, 'sitemap.xml'), 'utf8');

for (const match of xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)) {
  const url = new URL(match[1]);
  if (url.origin !== origin || url.search || url.hash || !/^\/[a-zA-Z0-9./_-]*$/.test(url.pathname)) {
    throw new Error('サイトマップのURLを確認してください');
  }
  const file = url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname;
  const html = await readFile(join(siteDir, file), 'utf8');
  pages.set(url.pathname, { html, title: plain(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '') });
}

const sources = brief.references.map(({ id, path, anchor, quote }) => {
  const html = pages.get(path)?.html ?? '';
  if (!html.includes('id="' + anchor.slice(1) + '"') || !compact(plain(html)).includes(compact(quote))) {
    throw new Error('公式案内との照合が必要です: ' + id);
  }
  return { id, kind: 'company', original: true, public: true, service: brief.topic.service,
    fact: quote, url: origin + path + anchor, checkedOn: day };
});

// The first article overlaps the FAQ, first visit guide and any published articles.
// Send their editorial text only. The contact form and customer records are never inputs.
const existing = [];
for (const [path, page] of pages) {
  if (path !== '/' && path !== '/first-guide.html' && !path.startsWith('/articles/')) continue;
  const section = path === '/' ? page.html.match(/<section\b[^>]*\bid="faq"[^>]*>([\s\S]*?)<\/section>/i)
    : page.html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  if (!section || !page.title) throw new Error('既存記事の確認が必要です: ' + path);
  const body = plain(section[1]).replace(/[\w.+-]+@[\w.-]+\.[a-z]+/gi, '').replace(/0\d{1,4}[-‐]\d{1,4}[-‐]\d{4}/g, '');
  existing.push({ path, title: page.title, body });
}
const articlePath = '/articles/' + brief.topic.slug + '/';
const candidateSitemap = updateSitemap(xml, articlePath, day);
const contact = pages.get('/contact.html')?.html ?? '';
if (!contact.includes('id="contact-form"')) throw new Error('問い合わせ先を確認してください');
console.log('公式案内との照合: ' + sources.length + '件／重複検査の対象: ' + existing.length + 'ページ');

if (mode !== '--check-input') {
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  const ask = gemini(model, process.env.GEMINI_API_KEY);
  const result = await runPrototype({ topic: brief.topic, sources, existing }, ask, day);
  console.log('審査結果: ' + result.status);
  if (result.status !== '合格') {
    const explanation = result.reason ?? result.findings.map(item => item.criterion + '：' + item.reason).join('\n');
    throw new Error(explanation);
  }
  const html = renderArticle(result, { preview: false });
  if (!html.includes('rel="canonical" href="' + origin + articlePath + '"') || html.includes('noindex')) {
    throw new Error('公開ページのSEO設定を確認してください');
  }
  await mkdir(outputDir, { recursive: false });
  await writeFile(join(outputDir, 'index.html'), html, { flag: 'wx' });
  await writeFile(join(outputDir, 'sitemap.xml'), candidateSitemap, { flag: 'wx' });
  await writeFile(join(outputDir, 'review.json'), JSON.stringify({
    path: articlePath, date: day, model, status: result.status, findings: result.findings,
    sources: result.sources, siteCommit: process.env.SITE_COMMIT ?? null
  }, null, 2), { flag: 'wx' });
}
