import { cp, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gemini, isPublicationDay, renderPreview, runPrototype } from './prototype.mjs';

const site = 'https://adjuto-service.github.io';
const root = fileURLToPath(new URL('../', import.meta.url));
const required = ['index.html', 'company.html', 'contact.html', 'first-guide.html', 'privacy.html', 'robots.txt', 'sitemap.xml'];
const assets = new Set(['CSS', 'images', 'js']);
const pathPattern = /^\/articles\/[a-z0-9][a-z0-9-]{0,79}\/$/;

export function updateSitemap(xml, path, day) {
  if (!pathPattern.test(path)) throw new Error('記事パスが無効です');
  isPublicationDay(day, day);
  const close = /<\/urlset>\s*$/;
  if (!/^<\?xml [^>]*\?>\s*<urlset\b/.test(xml) || !close.test(xml) || !xml.includes('<loc>' + site + '/</loc>')) {
    throw new Error('既存サイトマップの形式を確認してください');
  }
  const url = site + path;
  if (xml.includes('<loc>' + url + '</loc>') || xml.includes('<loc>' + url + 'index.html</loc>')) {
    throw new Error('記事URLが既にサイトマップに存在します');
  }
  return xml.replace(close, '  <url>\n    <loc>' + url + '</loc>\n    <lastmod>' + day + '</lastmod>\n  </url>\n$&');
}

export async function buildStaging({ input, ask, anchor, day, workspace = tmpdir() }) {
  if (!isPublicationDay(anchor, day)) return { status: '対象日外' };
  const result = await runPrototype(input, ask, day);
  if (result.status !== '合格') return { status: result.status, reason: result.reason ?? '審査条件を満たしていません' };
  const xml = updateSitemap(await readFile(join(root, 'sitemap.xml'), 'utf8'), result.path, day);
  const directory = await mkdtemp(join(workspace, 'adjuto-seo-'));
  const pending = join(directory, 'building');
  const output = join(directory, 'site');
  try {
    await mkdir(pending);
    const entries = await readdir(root, { withFileTypes: true });
    if (!required.every(name => entries.some(entry => entry.name === name && entry.isFile()))) {
      throw new Error('既存ページの構成が変わりました');
    }
    if (entries.some(entry => entry.name === 'articles')) throw new Error('試作は既存の記事ディレクトリを含む運用には未対応です');
    for (const entry of entries) {
      if (entry.isFile() && (required.includes(entry.name) || /^[a-zA-Z0-9_-]+\.html$/.test(entry.name))) {
        await cp(join(root, entry.name), join(pending, entry.name), { force: false, errorOnExist: true });
      } else if (entry.isDirectory() && assets.has(entry.name)) {
        await cp(join(root, entry.name), join(pending, entry.name), { recursive: true, force: false, errorOnExist: true });
      }
    }
    const articleDir = join(pending, result.path.slice(1));
    await mkdir(articleDir, { recursive: true });
    await writeFile(join(articleDir, 'index.html'), renderPreview(result), { flag: 'wx' });
    await writeFile(join(pending, 'sitemap.xml'), xml);
    await rename(pending, output);
    return { status: result.status, path: result.path, day, output };
  } catch (error) {
    await rm(directory, { recursive: true, force: true });
    throw error;
  }
}

async function main() {
  const [inputFile, anchor] = process.argv.slice(2);
  if (!inputFile || !anchor) throw new Error('使い方: node seo/staging.mjs 入力.json 開始日(YYYY-MM-DD)');
  const day = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date());
  const input = JSON.parse(await readFile(resolve(inputFile), 'utf8'));
  const result = await buildStaging({
    input, anchor, day,
    ask: (...args) => gemini(process.env.GEMINI_MODEL, process.env.GEMINI_API_KEY)(...args)
  });
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
