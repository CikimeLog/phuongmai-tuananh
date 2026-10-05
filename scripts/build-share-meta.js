const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'frontend/config.json'), 'utf8'));
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const match = config.weddingDateTime?.match(/^(\d{2})\/(\d{2})\/(\d{4})\s/);
const date = match ? `${match[1]}.${match[2]}.${match[3]}` : '';
const title = `Thiệp cưới ${config.groom?.name || ''} & ${config.bride?.name || ''}`;
const description = `Trân trọng kính mời bạn chung vui cùng chúng mình${date ? ` · ${date}` : ''}`;
const url = 'https://cikimelog.github.io/weding/';
const image = `${url}assets/thumb.jpg`;
if (!fs.existsSync(path.join(root, 'frontend/assets/thumb.jpg'))) throw new Error('Missing frontend/assets/thumb.jpg');
const tags = [
  `<title>${escape(title)}</title>`,
  `<meta name="description" content="${escape(description)}">`,
  ...Object.entries({'og:type':'website','og:title':title,'og:description':description,'og:url':url,'og:image':image,'og:image:alt':title,'og:locale':'vi_VN'}).map(([key, value]) => `<meta property="${key}" content="${escape(value)}">`),
  '<meta name="twitter:card" content="summary_large_image">',
  `<meta name="twitter:title" content="${escape(title)}">`,
  `<meta name="twitter:description" content="${escape(description)}">`,
  `<meta name="twitter:image" content="${escape(image)}">`,
].join('\n');
const htmlPath = path.join(root, 'frontend/index.html');
let html = fs.readFileSync(htmlPath, 'utf8');
html = html.replace(/<!-- share-meta:start -->[\s\S]*?<!-- share-meta:end -->\s*/g, '').replace(/<title>[\s\S]*?<\/title>/, '');
html = html.replace('</head>', `<!-- share-meta:start -->\n${tags}\n<!-- share-meta:end -->\n</head>`);
fs.writeFileSync(htmlPath, html);
console.log('Share preview updated from frontend/config.json');
