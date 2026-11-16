import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildStaging, updateSitemap } from './staging.mjs';

const anchor = '2026-11-17';
const workspace = await mkdtemp(join(tmpdir(), 'adjuto-seo-test-'));
const day = '2026-11-19';
const source = { id: 'test', kind: 'company', original: true, public: true, service: '遺品整理・生前整理',
  fact: '動作確認専用の架空の根拠', checkedOn: anchor, url: 'https://example.invalid/' };
const input = {
  topic: { slug: 'fixture-estate', question: '試作用の記事はどのように出力するか', service: source.service },
  sources: [source], existing: [{ path: '/', title: 'トップページ', body: 'トップの本文' }]
};
const baseline = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');
const article = { title: '動作確認専用の記事', description: '架空のプレビューです。', sections: [
  { heading: '試作の見出し', body: '試作の内容です。', sourceIds: ['test'] },
  { heading: '次の見出し', body: '試作のみに使います。', sourceIds: ['test'] }
] };
const keys = ['accuracy', 'originality', 'usefulness', 'trust', 'seo', 'brand', 'safety'];
const pass = Object.fromEntries(keys.map(key => [key, { status: '合格', reason: 'テスト専用', critical: false }]));
const request = { input, anchor, day, workspace };
const never = async () => { assert.fail('この条件ではAIを呼ばない'); };
try {
  assert.equal((await buildStaging({ ...request, day: '2026-11-18', ask: never })).status, '対象日外');
  assert.equal((await buildStaging({ ...request, input: { ...input, sources: [] }, ask: never })).status, '保留');
  let index = 0;
  assert.equal((await buildStaging({ ...request, ask: async () => [article, {}][index++] })).status, '保留');
  await assert.rejects(buildStaging({ ...request, ask: async () => { throw Error('API failure'); } }), /API failure/);
  assert.deepEqual(await readdir(workspace), []);

  index = 0;
  const result = await buildStaging({ ...request, ask: async () => [article, pass][index++] });
  const page = await readFile(join(result.output, 'articles', 'fixture-estate', 'index.html'), 'utf8');
  const xml = await readFile(join(result.output, 'sitemap.xml'), 'utf8');
  assert.match(page, /noindex,nofollow/);
  assert.equal(updateSitemap(baseline, result.path, day), xml);
  assert.equal(xml.replace(/  <url>\n    <loc>[^<]*fixture-estate\/<\/loc>\n    <lastmod>[^<]*<\/lastmod>\n  <\/url>\n/, ''), baseline);
  assert.throws(() => updateSitemap(xml, result.path, day), /既に/);
  assert.throws(() => updateSitemap(baseline, '/articles/../', day), /パス/);
  assert.throws(() => updateSitemap('<bad/>', result.path, day), /形式/);
  for (const name of ['index.html', 'contact.html', 'first-guide.html', 'company.html', 'privacy.html', 'robots.txt', 'CSS/style.css', 'js/contact-form.js']) {
    assert.deepEqual(await readFile(join(result.output, name)), await readFile(new URL('../' + name, import.meta.url)));
  }
  const invalidWorkspace = join(workspace, 'file');
  await writeFile(invalidWorkspace, 'invalid');
  index = 0;
  await assert.rejects(buildStaging({ ...request, workspace: invalidWorkspace, ask: async () => [article, pass][index++] }));
  assert.equal(await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8'), baseline);
  console.log('隔日判定・審査による停止・サイトマップへの追記・既存サイトの保全を確認');
} finally {
  await rm(workspace, { recursive: true, force: true });
}
