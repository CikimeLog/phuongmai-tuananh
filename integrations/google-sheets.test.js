const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const code = fs.readFileSync(require('node:path').join(__dirname,'google-sheets.gs'),'utf8');
function script() {
  const books = {}, messages = [], properties = {};
  const rows=[['Mã xác nhận','Thời gian gửi','Họ và tên','Tham dự','Số người','Lời nhắn']];
  let locked=false;
  const sheet={getLastRow:()=>rows.length,getMaxRows:()=>1000,getRange:(row,col,height=1,width=1)=>({
    getValues:()=>rows.slice(row-1,row-1+height).map(r=>r.slice(col-1,col-1+width)),
    createTextFinder:value=>({matchEntireCell:()=>({findNext:()=>rows.slice(1).some(r=>r[0]===value)})}),
    setValues:values=>{rows[row-1]=values[0];},setNumberFormat(){},setWrap(){}
  })};
  function scriptSheet() {
    const targetRows = [rows[0].slice()];
    return {rows:targetRows,sheet:{...sheet,getLastRow:()=>targetRows.length,getRange:(row,col,height=1,width=1)=>({
      getValues:()=>targetRows.slice(row-1,row-1+height).map(r=>r.slice(col-1,col-1+width)),
      createTextFinder:value=>({matchEntireCell:()=>({findNext:()=>targetRows.slice(1).some(r=>r[0]===value)})}),
      setValues:values=>{targetRows[row-1]=values[0]; if(row>1)rows[row-1]=values[0];},setNumberFormat(){},setWrap(){}
    })}};
  }
  const context=vm.createContext({PropertiesService:{getScriptProperties:()=>({getProperty:key=>key==='RSVP_SECRET'?'secret':key.startsWith('RSVP_TAB_')?null:key==='SPREADSHEET_ID_BRIDE'?'bride-book':key==='SPREADSHEET_ID_GROOM'?'groom-book':key==='SPREADSHEET_ID'?'sheet-id':key.startsWith('TELEGRAM_')?'test':null,setProperty:(key,value)=>properties[key]=value,deleteProperty:key=>delete properties[key]})},
    ContentService:{MimeType:{JSON:'json'},createTextOutput:value=>({setMimeType:()=>JSON.parse(value)})},
    LockService:{getScriptLock:()=>({waitLock:()=>{locked=true;},hasLock:()=>locked,releaseLock:()=>{locked=false;}})},
    SpreadsheetApp:{openById:id=>({getSheetByName:name=>{books[id] ||= {}; if(!books[id][name]) {const copy=scriptSheet();books[id][name]=copy;} return books[id][name].sheet;} }),flush(){}},
    Utilities:{formatDate:()=>'time'},UrlFetchApp:{fetch:(_url,options)=>{messages.push(JSON.parse(options.payload).text);return {getContentText:()=>'{"ok":true}'};}}});
  vm.runInContext(code,context);
  return {rows,books,messages,properties,submit:body=>context.doPost({postData:{contents:JSON.stringify(body)}}),locked:()=>locked};
}
const rsvp={id:'12345678-1234-1234-1234-123456789012',name:'=IMPORTXML("url")',attendance:'yes',count:2,message:'Hello',createdAt:'2026-10-04T02:00:00Z'};
test('Apps Script authenticates, saves safe text, deduplicates and releases lock',()=>{
  const s=script();
  assert.equal(s.submit({secret:'wrong',rsvp}).ok,false); assert.equal(s.rows.length,1);
  assert.equal(s.submit({secret:'secret',rsvp}).ok,true); assert.equal(s.rows.length,2);
  assert.ok(s.rows[1][2].startsWith("'=")); assert.equal(s.rows[1][4],2); assert.equal(s.locked(),false);
  assert.equal(s.submit({secret:'secret',rsvp}).duplicate,true); assert.equal(s.rows.length,2);
});
test('Apps Script rejects invalid counts and accepts non-attendance with zero',()=>{
  const s=script();
  assert.equal(s.submit({secret:'secret',rsvp:{...rsvp,count:11}}).ok,false);
  assert.equal(s.submit({secret:'secret',rsvp:{...rsvp,attendance:'no',count:0}}).ok,true);
  assert.equal(s.rows[1][3],'Không'); assert.equal(s.rows[1][4],0);
});

test('routes groom and bride to separate spreadsheets and labels Telegram including duplicate retries',()=>{
  const s=script();
  for(const side of ['groom','bride']) {
    const body={action:'public-rsvp',rsvp:{...rsvp,invitationSide:side}};
    assert.equal(s.submit(body).ok,true);
    assert.equal(s.submit(body).duplicate,true);
  }
  assert.equal(s.books['groom-book'].RSVP_ChuRe.rows.length,2);
  assert.equal(s.books['bride-book'].RSVP_CoDau.rows.length,2);
  assert.match(s.messages[0],/Phía: Chú rể/);
  assert.match(s.messages[1],/Phía: Cô dâu/);
  assert.equal(s.submit({action:'public-rsvp',rsvp:{...rsvp,invitationSide:'unknown'}}).ok,false);
});
