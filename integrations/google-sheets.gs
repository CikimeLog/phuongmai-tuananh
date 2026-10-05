// Configure SPREADSHEET_ID and RSVP_SECRET in Project Settings > Script properties.
function doPost(e) {
  const reply = value => ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
  let lock;
  try {
    const props = PropertiesService.getScriptProperties();
    const secret = props.getProperty('RSVP_SECRET');
    const data = JSON.parse(e.postData.contents);
    const publicRequest = data.action === 'public-rsvp';
    if (!publicRequest && (!secret || data.secret !== secret)) return reply({ok:false,error:'Unauthorized'});
    const r = data.rsvp;
    if (!r || typeof r.id !== 'string' || !/^[a-f0-9-]{36}$/i.test(r.id) ||
        typeof r.name !== 'string' || !r.name.trim() || r.name.length > 100 ||
        !['yes','no'].includes(r.attendance) || !Number.isInteger(r.count) ||
        (r.attendance === 'yes' ? r.count < 1 || r.count > 10 : r.count !== 0) ||
        typeof r.message !== 'string' || r.message.length > 2000 || !Number.isFinite(Date.parse(r.createdAt))) {
      return reply({ok:false,error:'Invalid RSVP'});
    }
    if (r.invitationSide === undefined) r.invitationSide = 'groom'; // Legacy submissions.
    if (!['groom','bride'].includes(r.invitationSide)) return reply({ok:false,error:'Invalid invitation side'});
    if (publicRequest) r.createdAt = new Date().toISOString();
    lock = LockService.getScriptLock();
    lock.waitLock(20000);
    const suffix = r.invitationSide.toUpperCase();
    const spreadsheetId = props.getProperty('SPREADSHEET_ID_' + suffix) || props.getProperty('SPREADSHEET_ID');
    const tabName = props.getProperty('RSVP_TAB_' + suffix) || (r.invitationSide === 'bride' ? 'RSVP_CoDau' : 'RSVP_ChuRe');
    const book = SpreadsheetApp.openById(spreadsheetId);
    let sheet = book.getSheetByName(tabName);
    if (!sheet) {
      sheet = book.insertSheet(tabName);
      sheet.getRange(1,1,1,6).setValues([['Mã xác nhận','Thời gian gửi','Họ và tên','Tham dự','Số người','Lời nhắn']]);
    }
    const headers = ['Mã xác nhận','Thời gian gửi','Họ và tên','Tham dự','Số người','Lời nhắn'];
    if (JSON.stringify(sheet.getRange(1,1,1,6).getValues()[0]) !== JSON.stringify(headers)) {
      return reply({ok:false,error:'Unexpected headers'});
    }
    const last = sheet.getLastRow();
    if (last > 1 && sheet.getRange(2,1,last-1,1).createTextFinder(r.id).matchEntireCell(true).findNext()) {
      return reply({ok:true,id:r.id,duplicate:true});
    }
    // User text remains text even if it starts with a formula character.
    const text = value => /^[=+\-@]/.test(value) ? "'" + value : value;
    const row = last + 1;
    if (row > sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(),100);
    sheet.getRange(row,1,1,6).setValues([[r.id,new Date(r.createdAt),text(r.name),r.attendance==='yes'?'Có':'Không',r.count,text(r.message)]]);
    sheet.getRange(row,2).setNumberFormat('dd/MM/yyyy HH:mm:ss');
    sheet.getRange(row,5).setNumberFormat('0');
    sheet.getRange(row,3,1,4).setWrap(true);
    SpreadsheetApp.flush();
    if (publicRequest) {
      props.setProperty('telegram_pending_' + r.id, JSON.stringify(r));
      try { sendTelegramRsvp(r,props); } catch { /* Retry via trigger. */ }
    }
    return reply({ok:true,id:r.id});
  } catch {
    return reply({ok:false,error:'Unable to save RSVP'});
  } finally { if (lock && lock.hasLock()) lock.releaseLock(); }
}

function sendTelegramRsvp(r,props) {
  const token=props.getProperty('TELEGRAM_BOT_TOKEN'),chat=props.getProperty('TELEGRAM_CHAT_ID');
  if(!token||!chat)return;
  const text='XÁC NHẬN THAM DỰ MỚI\nPhía: '+(r.invitationSide==='bride'?'Cô dâu':'Chú rể')+'\nHọ tên: '+r.name+'\nTham dự: '+(r.attendance==='yes'?'Có':'Không')+'\nSố người: '+r.count+'\nThời gian: '+Utilities.formatDate(new Date(r.createdAt),'Asia/Ho_Chi_Minh','dd/MM/yyyy HH:mm:ss')+'\nMã: '+r.id;
  const response=UrlFetchApp.fetch('https://api.telegram.org/bot'+token+'/sendMessage',{method:'post',contentType:'application/json',payload:JSON.stringify({chat_id:chat,text}),muteHttpExceptions:true});
  if(JSON.parse(response.getContentText()).ok)props.deleteProperty('telegram_pending_'+r.id);
}

function retryTelegramRsvps() {
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(1000))return;
  try {
    const props=PropertiesService.getScriptProperties(),values=props.getProperties();
    Object.keys(values).filter(key=>key.startsWith('telegram_pending_')).slice(0,20).forEach(key=>{
      try{sendTelegramRsvp(JSON.parse(values[key]),props);}catch{}
    });
  }finally{lock.releaseLock();}
}

function setupTelegramRetry() {
  if(!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='retryTelegramRsvps'))ScriptApp.newTrigger('retryTelegramRsvps').timeBased().everyMinutes(1).create();
}
