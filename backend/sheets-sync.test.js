const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createSheetsSync} = require('./sheets-sync');
const seed = () => ({id:'a',name:'Khách thử',attendance:'yes',count:2,message:'',createdAt:'2026-10-04T00:00:00Z'});
function setup(fetchImpl) {
  let rows = [seed()];
  const worker = createSheetsSync({read:()=>structuredClone(rows),write:value=>{rows=value;},settings:()=>({webhookUrl:'https://example.test',secret:'test-secret'}),fetchImpl,logger:{warn(){}}});
  return {worker,get:()=>rows,add:r=>rows.push(r)};
}
test('success is recorded and already-synced entries are skipped',async()=>{
  let calls=0;
  const s=setup(async(_url,options)=>{calls++; const data=JSON.parse(options.body); assert.equal(data.secret,'test-secret'); return {ok:true,json:async()=>({ok:true,id:data.rsvp.id})};});
  await s.worker.sync(); await s.worker.sync();
  assert.equal(calls,1); assert.ok(s.get()[0].sheetSyncedAt);
});
test('failure remains pending and succeeds on retry',async()=>{
  let attempts=0;
  const s=setup(async()=>{if(!attempts++) throw new Error('offline'); return {ok:true,json:async()=>({ok:true,id:'a'})};});
  await s.worker.sync(); assert.equal(s.get()[0].sheetSyncedAt,undefined);
  await s.worker.sync(); assert.ok(s.get()[0].sheetSyncedAt);
});
test('concurrent submissions are preserved and only one sync pass runs',async()=>{
  let resolve; let calls=0;
  const s=setup(()=>{calls++;return new Promise(r=>{resolve=r;});});
  const pending=s.worker.sync(); await s.worker.sync();
  s.add({...seed(),id:'b'});
  resolve({ok:true,json:async()=>({ok:true,id:'a'})}); await pending;
  assert.equal(calls,1); assert.equal(s.get().length,2); assert.equal(s.get()[1].sheetSyncedAt,undefined);
});
test('HTML/login response or wrong acknowledgement never marks success',async()=>{
  const s=setup(async()=>({ok:true,json:async()=>({ok:true,id:'wrong'})}));
  await s.worker.sync(); assert.equal(s.get()[0].sheetSyncedAt,undefined);
});
test('disabled connection sends no data',async()=>{
  let calls=0;
  const worker=createSheetsSync({read:()=>[seed()],write(){},settings:()=>({}),fetchImpl:async()=>calls++});
  await worker.sync(); assert.equal(calls,0);
});
