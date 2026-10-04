const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const code = fs.readFileSync(require('node:path').join(__dirname,'google-sheets.gs'),'utf8');
function script() {
  const rows=[['Mã xác nhận','Thời gian gửi','Họ và tên','Tham dự','Số người','Lời nhắn']];
  let locked=false;
  const sheet={getLastRow:()=>rows.length,getMaxRows:()=>1000,getRange:(row,col,height=1,width=1)=>({
    getValues:()=>rows.slice(row-1,row-1+height).map(r=>r.slice(col-1,col-1+width)),
    createTextFinder:value=>({matchEntireCell:()=>({findNext:()=>rows.slice(1).some(r=>r[0]===value)})}),
    setValues:values=>{rows[row-1]=values[0];},setNumberFormat(){},setWrap(){}
  })};
  const context=vm.createContext({PropertiesService:{getScriptProperties:()=>({getProperty:key=>key==='RSVP_SECRET'?'secret':'sheet-id'})},
    ContentService:{MimeType:{JSON:'json'},createTextOutput:value=>({setMimeType:()=>JSON.parse(value)})},
    LockService:{getScriptLock:()=>({waitLock:()=>{locked=true;},hasLock:()=>locked,releaseLock:()=>{locked=false;}})},
    SpreadsheetApp:{openById:()=>({getSheetByName:()=>sheet}),flush(){}}});
  vm.runInContext(code,context);
  return {rows,submit:body=>context.doPost({postData:{contents:JSON.stringify(body)}}),locked:()=>locked};
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
