const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {createSheetsSync,loadSettings} = require('./sheets-sync');
const {validSignature} = require('./signatures');
const {loadTelegram,createTelegramNotifier} = require('./telegram');
const root = path.resolve(__dirname, '../frontend');
const store = path.join(__dirname, 'data', 'rsvps.json');
const signatureStore = path.join(__dirname, 'data', 'signatures.json');
function readSignatures() { return fs.existsSync(signatureStore) ? JSON.parse(fs.readFileSync(signatureStore,'utf8')) : []; }
fs.mkdirSync(path.dirname(store), { recursive: true });
function read() { return fs.existsSync(store) ? JSON.parse(fs.readFileSync(store, 'utf8')) : []; }
function write(items) { fs.writeFileSync(store+'.tmp',JSON.stringify(items,null,2)); fs.renameSync(store+'.tmp',store); }
const sheetsSettings = path.join(__dirname,'google-sheets.local.json');
const sheetsSync = createSheetsSync({read,write,settings:()=>loadSettings(sheetsSettings)});
function syncSheets() { sheetsSync.sync().catch(()=>console.warn('Kiểm tra cấu hình Google Sheets trong backend/google-sheets.local.json.')); }
setInterval(syncSheets,30000).unref();
syncSheets();
const telegram = createTelegramNotifier({read,write,settings:()=>loadTelegram(path.join(__dirname,'telegram.local.json'))});
function notifyTelegram(){telegram.sync().catch(()=>console.warn('Kiểm tra cấu hình backend/telegram.local.json.'));}
setInterval(notifyTelegram,30000).unref();
notifyTelegram();
function json(res, status, data) { res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); res.end(JSON.stringify(data)); }
const mime = {'.html':'text/html; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.mp3':'audio/mpeg','.css':'text/css','.js':'text/javascript','.woff2':'font/woff2'};
const server = http.createServer(async (req, res) => {
 try {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'GET' && url.pathname === '/api/signatures') return json(res,200,readSignatures().slice(-30).reverse());
  if (req.method === 'POST' && url.pathname === '/api/signatures') {
   if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) return json(res,403,{error:'Yêu cầu không hợp lệ.'});
   let body=''; for await (const chunk of req) { body+=chunk; if(Buffer.byteLength(body)>150000) return json(res,413,{error:'Chữ ký quá lớn. Vui lòng vẽ lại ngắn hơn.'}); }
   let data; try {data=JSON.parse(body);} catch {return json(res,400,{error:'Dữ liệu không hợp lệ.'});}
   if(!validSignature(data)) return json(res,400,{error:'Vui lòng nhập tên và vẽ chữ ký hợp lệ.'});
   const item={id:crypto.randomUUID(),name:data.name.trim(),strokes:data.strokes,createdAt:new Date().toISOString()};
   const signatures=readSignatures();signatures.push(item);
   fs.writeFileSync(signatureStore+'.tmp',JSON.stringify(signatures));fs.renameSync(signatureStore+'.tmp',signatureStore);
   return json(res,201,{ok:true});
  }
  if (req.method === 'GET' && url.pathname === '/api/config') return json(res,200,JSON.parse(fs.readFileSync(path.join(__dirname,'config.json'),'utf8').replace(/^\uFEFF/,'')));
  if (req.method === 'GET' && url.pathname === '/api/wishes') return json(res,200,read().filter(x=>x.message).slice(-40).map(({name,message})=>({name,message})));
  if (req.method === 'POST' && url.pathname === '/api/rsvp') {
   if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) return json(res,403,{error:'Yêu cầu không hợp lệ.'});
   let body = ''; for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body)>8192) return json(res,413,{error:'Lời nhắn quá dài.'}); }
   let data; try {data=JSON.parse(body);} catch {return json(res,400,{error:'Dữ liệu không hợp lệ.'});}
   if (typeof data.name !== 'string' || !data.name.trim() || data.name.length>100 || !['yes','no'].includes(data.attendance) || typeof data.message !== 'string' || data.message.length>2000 || (data.attendance==='yes' && (!Number.isInteger(data.count)||data.count<1||data.count>10))) return json(res,400,{error:'Vui lòng kiểm tra tên, số người và lời chúc.'});
   const item={id:crypto.randomUUID(),name:data.name.trim(),attendance:data.attendance,count:data.attendance==='no'?0:data.count,message:data.message.trim(),createdAt:new Date().toISOString()};
   item.telegramPending=true;
   const items=read(); items.push(item); write(items);
   syncSheets();
   notifyTelegram();
   return json(res,201,{ok:true});
  }
  if (url.pathname.startsWith('/api/')) return json(res,404,{error:'Không tìm thấy API.'});
  if (!['GET','HEAD'].includes(req.method)) return json(res,405,{error:'Phương thức không hỗ trợ.'});
  const file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if (!file.startsWith(root+path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return json(res,404,{error:'Không tìm thấy trang.'});
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Content-Length':fs.statSync(file).size});
  if(req.method==='HEAD') return res.end(); fs.createReadStream(file).pipe(res);
 } catch(err) { console.error(err); if(!res.headersSent) json(res,500,{error:'Không thể xử lý yêu cầu.'}); else res.end(); }
});
server.listen(Number(process.env.PORT||3000),'127.0.0.1',()=>console.log('Thiệp cưới: http://localhost:'+server.address().port));
