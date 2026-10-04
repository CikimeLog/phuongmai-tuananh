// Configure SPREADSHEET_ID and RSVP_SECRET in Project Settings > Script properties.
function doPost(e) {
  const reply = value => ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
  let lock;
  try {
    const props = PropertiesService.getScriptProperties();
    const secret = props.getProperty('RSVP_SECRET');
    const data = JSON.parse(e.postData.contents);
    if (!secret || data.secret !== secret) return reply({ok:false,error:'Unauthorized'});
    const r = data.rsvp;
    if (!r || typeof r.id !== 'string' || !/^[a-f0-9-]{36}$/i.test(r.id) ||
        typeof r.name !== 'string' || !r.name.trim() || r.name.length > 100 ||
        !['yes','no'].includes(r.attendance) || !Number.isInteger(r.count) ||
        (r.attendance === 'yes' ? r.count < 1 || r.count > 10 : r.count !== 0) ||
        typeof r.message !== 'string' || r.message.length > 2000 || !Number.isFinite(Date.parse(r.createdAt))) {
      return reply({ok:false,error:'Invalid RSVP'});
    }
    lock = LockService.getScriptLock();
    lock.waitLock(20000);
    const book = SpreadsheetApp.openById(props.getProperty('SPREADSHEET_ID'));
    const sheet = book.getSheetByName('RSVP');
    if (!sheet) return reply({ok:false,error:'Missing RSVP tab'});
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
    return reply({ok:true,id:r.id});
  } catch {
    return reply({ok:false,error:'Unable to save RSVP'});
  } finally { if (lock && lock.hasLock()) lock.releaseLock(); }
}
