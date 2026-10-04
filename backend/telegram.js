const fs = require('node:fs');
function loadTelegram(filename) {
  const local=fs.existsSync(filename)?JSON.parse(fs.readFileSync(filename,'utf8').replace(/^\uFEFF/,'')):{};
  return {botToken:process.env.TELEGRAM_BOT_TOKEN||local.botToken||'',chatId:process.env.TELEGRAM_CHAT_ID||local.chatId||''};
}
function messageFor(item) {
  const time=new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',dateStyle:'short',timeStyle:'short'}).format(new Date(item.createdAt));
  return `XÁC NHẬN THAM DỰ MỚI\nHọ tên: ${item.name}\nTham dự: ${item.attendance==='yes'?'Có':'Không'}\nSố người: ${item.count}\nThời gian: ${time}\nMã: ${item.id}`;
}
function createTelegramNotifier({read,write,settings,fetchImpl=fetch,logger=console}) {
  let running=false, retryAt=0;
  async function sync() {
    if(running || Date.now()<retryAt)return;
    const config=settings();if(!config.botToken||!config.chatId)return;
    running=true;
    try {
      for(const item of read().filter(r=>r.telegramPending&&!r.telegramSentAt)) {
        try {
          const response=await fetchImpl(`https://api.telegram.org/bot${config.botToken}/sendMessage`,{
            method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(15000),
            body:JSON.stringify({chat_id:config.chatId,text:messageFor(item)})
          });
          const result=await response.json();
          if(!response.ok||result.ok!==true){
            retryAt=Date.now()+Math.max(30,Number(result.parameters?.retry_after)||30)*1000;
            throw new Error('Telegram rejected message');
          }
          const latest=read(),saved=latest.find(r=>r.id===item.id);
          if(saved){saved.telegramSentAt=new Date().toISOString();saved.telegramMessageId=result.result?.message_id;delete saved.telegramPending;write(latest);}
        }catch{logger.warn('Telegram chưa gửi được thông báo; sẽ thử lại.');break;}
      }
    }finally{running=false;}
  }
  return {sync};
}
module.exports={loadTelegram,messageFor,createTelegramNotifier};
