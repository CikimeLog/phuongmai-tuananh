// Friendly config dates are interpreted in Vietnam time (UTC+07:00).
function parseWeddingDate(value) {
  if (typeof value !== 'string') return NaN;
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)$/i);
  if (!match) {
    return /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? Date.parse(value) : NaN;
  }
  const [, dd, mm, yyyy, hh, mi, ss, period] = match;
  const day = Number(dd), month = Number(mm), year = Number(yyyy);
  const hour12 = Number(hh), minute = Number(mi), second = Number(ss);
  if (year < 1000 || month < 1 || month > 12 || day < 1 || hour12 < 1 || hour12 > 12 || minute > 59 || second > 59) return NaN;
  const hour = hour12 % 12 + (period.toUpperCase() === 'PM' ? 12 : 0);
  const local = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  if (local.getUTCFullYear() !== year || local.getUTCMonth() !== month - 1 || local.getUTCDate() !== day) return NaN;
  return local.getTime() - 7 * 3600000;
}
const canvas = document.getElementById('page-root-container');
const height = parseFloat(canvas.style.height);
const width = parseFloat(canvas.style.width);
function resize() {
  const scale = Math.min(1, document.getElementById('frame').clientWidth / width);
  canvas.style.transform = `scale(${scale})`;
  document.getElementById('canvas-size').style.height = `${height * scale}px`;
}
resize(); window.addEventListener('resize', resize);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const observer = !reduced && 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  entries.forEach(({target, isIntersecting}) => {
    if (!isIntersecting) return;
    const key = target.dataset.transitionKey;
    const match = key.match(/-(slide-left|slide-right|slide-up|slide-down|fade-in)-([\d.]+)-([\d.]+)-/);
    if (match) {
      const transforms = {'slide-left':'translateX(100%)','slide-right':'translateX(-100%)','slide-up':'translateY(100%)','slide-down':'translateY(-100%)','fade-in':'none'};
      target.animate([{opacity:0,transform:transforms[match[1]]},{opacity:1,transform:'none'}], {duration:Number(match[2])*1000,delay:Number(match[3])*1000,easing:'ease-out',fill:'backwards'});
    }
    observer.unobserve(target);
  });
}, {threshold:0.05}) : null;
document.querySelectorAll('[data-transition-key]').forEach(el => {
  el.style.opacity = '1'; el.style.visibility = 'visible'; el.style.animation = 'none';
  observer?.observe(el);
});
const music = document.getElementById('music');
const musicButton = document.getElementById('music-button');
musicButton.innerHTML = '<span class="record" aria-hidden="true"><span>♫</span></span>';
music.preload = 'auto';
let musicWanted = true;
let invitationOpened = false;
const invitationCover = document.createElement('dialog');
invitationCover.className = 'invitation-cover';
invitationCover.setAttribute('aria-label', 'Mở thiệp cưới');
invitationCover.innerHTML = '<div class="cover-card"><p class="cover-eyebrow">THIỆP MỜI LỄ THÀNH HÔN</p><div class="cover-envelope" aria-hidden="true"><div class="cover-letter"><span>Trân trọng kính mời</span><strong>Mai & Anh</strong><small>25 · 10 · 2026</small></div><div class="cover-pocket"></div><div class="cover-flap"></div><span class="cover-seal">M <i>&</i> A</span></div><h1><span class="cover-bride">Phương Mai</span><em>&</em><span class="cover-groom">Tuấn Anh</span></h1><p class="cover-date">25 · 10 · 2026</p><p class="cover-message">Một ngày đặc biệt, một lời mời dành cho bạn.</p><button type="button" class="cover-open">Mở thiệp <span aria-hidden="true">↗</span></button></div>';
document.body.append(invitationCover);
const previousOverflow = document.documentElement.style.overflow;
document.documentElement.style.overflow = 'hidden';
invitationCover.showModal();
invitationCover.addEventListener('cancel', event => event.preventDefault());
invitationCover.querySelector('.cover-open').onclick = () => {
  if (invitationOpened) return;
  invitationOpened = true;
  musicWanted = true;
  startMusic();
  invitationCover.querySelector('.cover-open').disabled = true;
  invitationCover.classList.add('unsealing');
  if (!reduced) setTimeout(() => invitationCover.classList.add('opening'), 1600);
  setTimeout(() => {
    invitationCover.close();
    document.documentElement.style.overflow = previousOverflow;
    window.scrollTo({top:0,behavior:'instant'});
    scrollPosition = 0;
    resumeAt = performance.now() + 3000;
    musicButton.focus({preventScroll:true});
  }, reduced ? 0 : 2250);
};
const musicPrompt = document.createElement('button');
musicPrompt.className = 'music-prompt';
musicPrompt.textContent = '♫ Chạm để mở thiệp cùng nhạc';
musicPrompt.hidden = true;
document.body.append(musicPrompt);
musicPrompt.onclick = () => { musicWanted = true; startMusic(); };
function syncMusic() {
  const playing = !music.paused;
  musicButton.classList.toggle('playing', playing);
  musicButton.setAttribute('aria-pressed', String(playing));
  musicButton.setAttribute('aria-label', playing ? 'Tắt nhạc' : 'Bật nhạc');
  musicButton.title = playing ? 'Tắt nhạc' : 'Chạm để bật nhạc';
  if (playing || !musicWanted) musicPrompt.hidden = true;
}
async function startMusic() {
  if (!invitationOpened || !musicWanted || !music.paused) return;
  try { await music.play(); } catch (error) {
    if (error.name === 'NotAllowedError' && musicWanted) musicPrompt.hidden = false;
  }
  syncMusic();
}
music.addEventListener('play', syncMusic);
music.addEventListener('pause', syncMusic);
musicButton.onclick = () => {
  musicWanted = music.paused;
  if (musicWanted) startMusic(); else music.pause();
};
// Mobile browsers grant audio activation on tap completion, not pointerdown.
for (const event of ['click', 'touchend', 'keydown']) {
  document.addEventListener(event, e => {
    if (!e.target.closest?.('#music-button,.music-prompt')) startMusic();
  }, {passive:true});
}
syncMusic();

const scrollButton = document.createElement('button');
scrollButton.id = 'auto-scroll-button';
scrollButton.className = 'auto-scroll';
document.body.append(scrollButton);
let autoScroll = !reduced;
let lastFrame = 0;
let resumeAt = performance.now() + 3000;
let scrollPosition = window.scrollY;
function syncScroll() {
  scrollButton.textContent = autoScroll ? 'Ⅱ' : '↓';
  scrollButton.setAttribute('aria-pressed', String(autoScroll));
  scrollButton.setAttribute('aria-label', autoScroll ? 'Dừng cuộn tự động' : 'Bật cuộn tự động');
  scrollButton.title = autoScroll ? 'Dừng cuộn tự động' : 'Bật cuộn tự động';
}
scrollButton.onclick = () => {
  autoScroll = !autoScroll;
  resumeAt = performance.now();
  scrollPosition = window.scrollY;
  syncScroll();
};
function pauseScroll() {
  resumeAt = performance.now() + 6000;
  scrollPosition = window.scrollY;
}
window.addEventListener('wheel', pauseScroll, {passive:true});
window.addEventListener('touchstart', pauseScroll, {passive:true});
window.addEventListener('touchmove', pauseScroll, {passive:true});
document.addEventListener('pointerdown', pauseScroll, {passive:true});
document.addEventListener('keydown', pauseScroll);
document.addEventListener('visibilitychange', () => { lastFrame = 0; pauseScroll(); });
function scrollFrame(now) {
  const elapsed = lastFrame ? Math.min(now - lastFrame, 50) : 0;
  lastFrame = now;
  const editing = document.activeElement?.matches('input,textarea,select,[contenteditable="true"]');
  if (autoScroll && !document.hidden && !editing && !document.querySelector('dialog[open]') && now >= resumeAt) {
    const bottom = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    if (window.scrollY >= bottom - 1) {
      autoScroll = false;
      syncScroll();
    } else {
      if (Math.abs(window.scrollY - scrollPosition) > 2) scrollPosition = window.scrollY;
      scrollPosition = Math.min(bottom, scrollPosition + elapsed * 0.025);
      window.scrollTo({top:scrollPosition, behavior:'instant'});
    }
  } else scrollPosition = window.scrollY;
  requestAnimationFrame(scrollFrame);
}
syncScroll();
requestAnimationFrame(scrollFrame);
async function init() {
  const response = await fetch(location.hostname.endsWith('github.io') ? 'config.json' : '/api/config'); if(!response.ok) throw new Error('Không tải được cấu hình.');
  const config = await response.json();
  invitationCover.querySelector('.cover-bride').textContent = config.bride?.name || 'Phương Mai';
  invitationCover.querySelector('.cover-groom').textContent = config.groom?.name || 'Tuấn Anh';
  const coverDate = parseWeddingDate(config.weddingDateTime);
  if (Number.isFinite(coverDate)) invitationCover.querySelector('.cover-date').textContent = new Intl.DateTimeFormat('vi-VN',{timeZone:config.timeZone || 'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit',year:'numeric'}).format(coverDate).replaceAll('/', ' · ');
  const imageVersion = Date.now();
  document.querySelectorAll('[data-photo]').forEach(el => {
    const file = config.photos?.[el.dataset.photo];
    if (!file) return;
    const url = new URL(file, location.href);
    if (!['http:', 'https:'].includes(url.protocol)) return;
    if (url.origin === location.origin) url.searchParams.set('v', imageVersion);
    el.style.backgroundImage = `url(${JSON.stringify(url.href)})`;
  });
  const date = parseWeddingDate(config.weddingDateTime);
  const validDate = Number.isFinite(date);
  const formatter = options => new Intl.DateTimeFormat('vi-VN', {timeZone:config.timeZone || 'Asia/Ho_Chi_Minh', ...options});
  const dateText = validDate ? formatter({day:'2-digit',month:'2-digit',year:'numeric'}).format(date).replaceAll('/', '.') : 'Ngày cưới';
  const values = {
    'bride.name':config.bride?.name || 'Tên cô dâu',
    'groom.name':config.groom?.name || 'Tên chú rể',
    date:dateText,
    lunarDate:validDate && config.lunarDate?.solarDate === dateText ? config.lunarDate.text || '' : '',
    dateWithWeekday:validDate ? formatter({weekday:'long'}).format(date)+'   '+dateText : 'Ngày cưới',
    time:validDate ? formatter({hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(date) : 'Giờ cưới',
    venueName:config.venueName || 'Tên địa điểm',
    venue:config.venue || 'Địa chỉ tổ chức',
    story:config.story || 'Câu chuyện của chúng mình'
  };
  document.querySelectorAll('[data-config]').forEach(el=>{el.textContent=values[el.dataset.config] || '';});
  document.querySelectorAll('[data-config="dateWithWeekday"]').forEach(el => {
    if (!validDate) return;
    const weekday = document.createElement('span');
    weekday.textContent = formatter({weekday:'long'}).format(date);
    const day = document.createElement('span');
    day.textContent = dateText;
    weekday.style.textAlign = 'right';
    day.style.textAlign = 'left';
    el.style.display = 'inline-grid';
    el.style.gridTemplateColumns = '1fr 1fr';
    el.style.columnGap = '24px';
    el.style.whiteSpace = 'nowrap';
    el.style.width = '260px';
    el.replaceChildren(weekday, day);
  });
  document.title = `${values['bride.name']} & ${values['groom.name']} | Thiệp cưới`;
  if(config.music && new URL(config.music, location.href).href !== music.src) music.src = config.music;
  startMusic();
  const directions = document.getElementById('directions');
  const mapsUrl = config.mapsUrl || (config.venue ? 'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(config.venue) : '');
  directions.hidden = !mapsUrl;
  if(mapsUrl) {
    const url = new URL(mapsUrl);
    if(['http:','https:'].includes(url.protocol)) directions.href = url.href;
    else directions.hidden = true;
  }
  const boxes = ['Ngày','Giờ','Phút','Giây'].map(label => {
    const box=document.createElement('div'); const n=document.createElement('strong'); n.textContent='00'; box.append(n,document.createTextNode(label)); document.getElementById('timer').append(box); return n;
  });
  function tick() {
    if(!validDate) {
      document.getElementById('countdown-status').textContent=config.weddingDateTime ? 'Ngày giờ không hợp lệ. Dùng định dạng DD/MM/YYYY hh:mm:ss AM hoặc PM.' : 'Ngày cưới chưa được cập nhật.';
      return;
    }
    const seconds=Math.max(0,Math.floor((date-Date.now())/1000));
    [Math.floor(seconds/86400),Math.floor(seconds%86400/3600),Math.floor(seconds%3600/60),seconds%60].forEach((v,i)=>boxes[i].textContent=String(v).padStart(2,'0'));
    document.getElementById('countdown-status').textContent= date<=Date.now() ? 'Ngày vui đã diễn ra.' : '';
  }
  tick(); setInterval(tick,1000);
}
init().catch(error => document.getElementById('status').textContent=error.message);
const form=document.querySelector('form');
if(form) {
  const feedback = document.createElement('div');
  feedback.className = 'rsvp-feedback';
  feedback.setAttribute('role','status');
  feedback.setAttribute('aria-live','polite');
  feedback.hidden = true;
  document.body.append(feedback);
  let feedbackTimer;
  function showFeedback(message, state) {
    clearTimeout(feedbackTimer);
    feedback.textContent = message;
    feedback.dataset.state = state;
    feedback.hidden = false;
    if (state === 'success') feedbackTimer = setTimeout(() => { feedback.hidden = true; }, 4000);
  }
  form.addEventListener('invalid', event => {
    const message = event.target.id === 'rsvp-name' ? 'Vui lòng nhập họ và tên.' : 'Vui lòng chọn số người tham dự.';
    showFeedback(message,'error');
  }, true);
  form.addEventListener('input', () => { feedback.hidden = true; });
  form.addEventListener('change', () => { feedback.hidden = true; });
  let sending = false;
  let pendingRsvp = null;
  const name=form.querySelector('#rsvp-name'); name.required=true;
  const radios = form.querySelectorAll('input[type=radio]');
  radios.forEach(el=>{el.name='attendance';});
  const count=form.querySelector('#rsvp-attendee-count');
  function updateAttendance() {
    const attending = form.querySelector('input[type=radio]:checked')?.value === 'yes';
    if(count) {count.disabled = !attending; count.required = attending;}
    radios.forEach(radio => {
      radio.closest('.ant-radio')?.classList.toggle('ant-radio-checked', radio.checked);
      radio.closest('.ant-radio-wrapper')?.classList.toggle('ant-radio-wrapper-checked', radio.checked);
    });
  }
  radios.forEach(radio=>radio.addEventListener('change',updateAttendance));
  updateAttendance();
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if (sending) return;
    if (!name.value.trim()) { showFeedback('Vui lòng nhập họ và tên.','error'); name.focus(); return; }
    const button=form.querySelector('button[type=submit]');
    const originalLabel = button.textContent;
    sending=true; button.disabled=true; button.textContent='Đang gửi…';
    form.setAttribute('aria-busy','true');
    showFeedback('Đang gửi xác nhận…','pending');
    try {
      const attendance=form.querySelector('input[type=radio]:checked')?.value||'yes';
      const data={name:name.value.trim(),attendance,count:attendance==='no'?0:Number(count?.value||1),message:''};
      const onPages=location.hostname.endsWith('github.io');
      let endpoint='/api/rsvp',payload=data;
      if(onPages){
        const config=await (await fetch('config.json')).json();endpoint=config.rsvpEndpoint;
        if(!endpoint)throw new Error('Kết nối xác nhận chưa được cập nhật.');
        const fingerprint=JSON.stringify(data);
        if(!pendingRsvp||pendingRsvp.fingerprint!==fingerprint)pendingRsvp={fingerprint,id:crypto.randomUUID()};
        payload={action:'public-rsvp',rsvp:{...data,id:pendingRsvp.id,createdAt:new Date().toISOString()}};
      }
      const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':onPages?'text/plain;charset=UTF-8':'application/json'},signal:AbortSignal.timeout(30000),body:JSON.stringify(payload)});
      const result=await response.json();if(!response.ok||result.ok!==true)throw new Error(result.error||'Không gửi được xác nhận.');
      pendingRsvp=null;
      document.getElementById('status').textContent='Đã gửi xác nhận. Cảm ơn bạn!';
      showFeedback('Đã gửi xác nhận. Cảm ơn bạn!','success');
    }catch(error){
      const message = error.name === 'TimeoutError' ? 'Kết nối chậm. Vui lòng kiểm tra mạng và thử lại.' : error instanceof TypeError ? 'Không thể kết nối. Vui lòng kiểm tra mạng và thử lại.' : error.message;
      document.getElementById('status').textContent=message;
      showFeedback(message,'error');
    }
    finally{sending=false;button.disabled=false;button.textContent=originalLabel;form.removeAttribute('aria-busy');}
  });
}
