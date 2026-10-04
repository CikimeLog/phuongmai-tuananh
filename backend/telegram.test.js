const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createTelegramNotifier,messageFor}=require('./telegram');
const item={id:'test-id',name:'Khách <test>',attendance:'yes',count:2,createdAt:'2026-10-04T13:00:00Z',telegramPending:true};
test('sends new RSVPs, preserves concurrent writes, skips sent and old records',async()=>{
  let rows=[{...item,id:'old',telegramPending:false},{...item}],calls=0;
  const worker=createTelegramNotifier({read:()=>structuredClone(rows),write:r=>rows=r,settings:()=>({botToken:'test',chatId:'123'}),fetchImpl:async(_url,options)=>{
    calls++;assert.equal(JSON.parse(options.body).chat_id,'123');rows.push({...item,id:'concurrent',telegramPending:false});return {ok:true,json:async()=>({ok:true,result:{message_id:5}})};
  }});
  await worker.sync();await worker.sync();assert.equal(calls,1);assert.equal(rows.length,3);assert.ok(rows[1].telegramSentAt);
});
test('network failures remain pending and retry',async()=>{
  let rows=[{...item}],calls=0;
  const worker=createTelegramNotifier({read:()=>structuredClone(rows),write:r=>rows=r,settings:()=>({botToken:'test',chatId:'123'}),logger:{warn(){}},fetchImpl:async()=>{if(!calls++)throw Error('offline');return {ok:true,json:async()=>({ok:true,result:{message_id:1}})};}});
  await worker.sync();assert.equal(rows[0].telegramSentAt,undefined);await worker.sync();assert.ok(rows[0].telegramSentAt);
});
test('disabled connection does not send',async()=>{
  const worker=createTelegramNotifier({read:()=>[item],write(){},settings:()=>({}),fetchImpl:()=>{throw Error('Must not send');}});await worker.sync();
  assert.match(messageFor({...item,attendance:'no',count:0}),/Tham dự: Không\nSố người: 0/);
});
