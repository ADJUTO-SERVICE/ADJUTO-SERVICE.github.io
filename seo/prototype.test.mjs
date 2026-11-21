import assert from 'node:assert/strict';
import { isPublicationDay, runPrototype, renderArticle, renderPreview } from './prototype.mjs';

const today = '2026-11-17';
const topic = { slug: 'remote-estate-guide', question: '遠方から依頼するときの準備は？', service: '遺品整理・生前整理' };
const source = {
  id: 'test-fact', public: true, kind: 'company', original: true, service: topic.service,
  fact: '自動テスト専用の架空資料', url: 'https://example.invalid/test', checkedOn: today
};
const input = { topic, sources: [source], existing: [{ path: '/', title: '会社概要', body: '会社の紹介' }] };
const article = {
  title: '遠方から相談する前の確認',
  description: '相談前の準備を確認。',
  sections: [
    { heading: '事前準備', body: '<script>test</script>を含むテスト文字列', sourceIds: [source.id] },
    { heading: '相談時の確認', body: 'テスト用の文章。', sourceIds: [source.id] }
  ]
};
const keys = ['accuracy', 'originality', 'usefulness', 'trust', 'seo', 'brand', 'safety'];
const pass = Object.fromEntries(keys.map(key => [key, { status: '合格', reason: 'テスト応答', critical: false }]));
const fake = (draft = article, review = pass) => {
  const replies = [draft, review];
  return async () => replies.shift();
};
const blocked = async () => { throw new Error('AIは呼び出されないはず'); };

assert.equal(isPublicationDay(today, '2026-11-17'), true);
assert.equal(isPublicationDay(today, '2026-11-18'), false);
assert.equal(isPublicationDay(today, '2026-11-19'), true);
assert.equal(isPublicationDay('2026-11-30', '2026-12-02'), true);
assert.equal(isPublicationDay(today, '2026-11-15'), false);
assert.throws(() => isPublicationDay(today, '2026-11-31'));

const result = await runPrototype(input, fake(), today);
assert.equal(result.status, '合格');
assert.match(renderPreview(result), /&lt;script&gt;test/);
assert.match(renderPreview(result), /noindex,nofollow/);
assert.match(renderPreview(result), /contact\.html#contact-form/);
assert.throws(() => renderPreview({ status: '保留' }));
const releaseHtml = renderArticle(result, { preview: false });
assert.ok(releaseHtml.includes('rel="canonical" href="https://adjuto-service.github.io' + result.path + '"'));
assert.doesNotMatch(releaseHtml, /noindex|公開前試作/);
assert.match(releaseHtml, /&lt;script&gt;test/);
assert.throws(() => renderArticle({ ...result, path: '/contact.html' }, { preview: false }));

assert.equal((await runPrototype({ ...input, sources: [{ ...source, expiresOn: '2026-11-16' }] }, blocked, today)).status, '保留');
assert.equal((await runPrototype({ ...input, existing: [{ ...input.existing[0], path: result.path + 'index.html' }] }, blocked, today)).status, '不採用');
assert.equal((await runPrototype({ ...input, existing: [{ ...input.existing[0], title: article.title }] }, fake(), today)).status, '不採用');
assert.equal((await runPrototype(input, fake({ ...article, sections: article.sections.map(section => ({ ...section, sourceIds: ['invented'] })) }), today)).status, '保留');
assert.equal((await runPrototype(input, fake(article, { ...pass, safety: { ...pass.safety, critical: true } }), today)).status, '不採用');
assert.equal((await runPrototype(input, fake(article, { ...pass, accuracy: { ...pass.accuracy, status: '保留' } }), today)).status, '保留');
assert.equal((await runPrototype(input, fake(article, { ...pass, usefulness: { ...pass.usefulness, status: '修正' } }), today)).status, '修正');
assert.equal((await runPrototype(input, fake(article, {}), today)).status, '保留');
await assert.rejects(runPrototype(input, async () => { throw new Error('HTTP 429'); }, today), /429/);
console.log('Phase 2の試作チェックに合格');
