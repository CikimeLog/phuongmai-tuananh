const fs = require('node:fs');

// RSVP records themselves are the durable outbox. One worker owns each sync pass.
function createSheetsSync({read, write, settings, fetchImpl = fetch, logger = console}) {
  let running = false;
  async function sync() {
    if (running) return;
    const config = settings();
    if (!config.webhookUrl || !config.secret) return;
    running = true;
    try {
      const pending = read().filter(item => !item.sheetSyncedAt);
      for (const item of pending) {
        try {
          const response = await fetchImpl(config.webhookUrl, {
            method:'POST', headers:{'Content-Type':'application/json'},
            body:JSON.stringify({secret:config.secret, rsvp:{invitationSide:item.invitationSide||'groom',id:item.id,name:item.name,attendance:item.attendance,count:item.count,message:item.message,createdAt:item.createdAt}}),
            signal:AbortSignal.timeout(15000)
          });
          const result = await response.json();
          if (!response.ok || result.ok !== true || result.id !== item.id) throw new Error('Google Sheets chưa xác nhận bản ghi.');
          // Re-read after network I/O so concurrent submissions are preserved.
          const latest = read();
          const saved = latest.find(entry => entry.id === item.id);
          if (saved) { saved.sheetSyncedAt = new Date().toISOString(); write(latest); }
        } catch {
          logger.warn('Google Sheets chưa đồng bộ được; sẽ tự thử lại.');
          break;
        }
      }
    } finally { running = false; }
  }
  return {sync};
}

function loadSettings(filename) {
  const local = fs.existsSync(filename) ? JSON.parse(fs.readFileSync(filename,'utf8').replace(/^\uFEFF/,'')) : {};
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL || local.webhookUrl || '';
  const secret = process.env.GOOGLE_SHEETS_SECRET || local.secret || '';
  if (webhookUrl && !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(webhookUrl)) {
    throw new Error('Google Sheets cần URL Apps Script dạng https://script.google.com/macros/s/.../exec.');
  }
  return {webhookUrl,secret};
}
module.exports = {createSheetsSync,loadSettings};
