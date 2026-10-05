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
    target.style.opacity = '1';
    const key = target.dataset.transitionKey;
    const match = key.match(/-(slide-left|slide-right|slide-up|slide-down|fade-in)-([\d.]+)-([\d.]+)-/);
    if (match) {
      const transforms = {'slide-left':'translateX(100%)','slide-right':'translateX(-100%)','slide-up':'translateY(100%)','slide-down':'translateY(-100%)','fade-in':'none'};
      target.animate([{opacity:0,transform:transforms[match[1]]},{opacity:1,transform:'none'}], {duration:Number(match[2])*1000,delay:Number(match[3])*1000,easing:'ease-out',fill:'backwards'});
    }
    observer.unobserve(target);
  });
// Start entrance effects inside the viewing area, above the bottom edge.
}, {rootMargin:`0px 0px -${Math.round(window.innerHeight * 0.3)}px 0px`,threshold:0}) : null;
document.querySelectorAll('[data-transition-key]').forEach(el => {
  el.style.opacity = observer ? '0' : '1';
  el.style.visibility = 'visible'; el.style.animation = 'none';
  // Observe after the envelope opens so entrance effects remain visible.
});
const music = document.getElementById('music');
const musicButton = document.getElementById('music-button');
musicButton.innerHTML = '<span class="record" aria-hidden="true"><span>♫</span></span>';
music.preload = 'auto';
let musicWanted = true;
let invitationOpened = false;
const invitationCover = document.createElement('dialog');
invitationCover.className = 'invitation-cover';
invitationCover.tabIndex = -1;
invitationCover.setAttribute('autofocus', '');
invitationCover.setAttribute('aria-label', 'Mở thiệp cưới');
invitationCover.innerHTML = '<div class="cover-card"><p class="cover-eyebrow">THIỆP MỜI LỄ THÀNH HÔN</p><div class="cover-envelope" aria-hidden="true"><div class="cover-letter"><span>Trân trọng kính mời</span><strong>Anh & Mai</strong><small>Đang tải ngày cưới…</small></div><div class="cover-pocket"></div><div class="cover-flap"></div><span class="cover-seal">A <i>&</i> M</span></div><h1><span class="cover-groom">Tuấn Anh</span><em>&</em><span class="cover-bride">Phương Mai</span></h1><p class="cover-date">Đang tải ngày cưới…</p><p class="cover-message">Một ngày đặc biệt, một lời mời dành cho bạn.</p><button type="button" class="cover-open">Mở thiệp <span aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m3 7 9 6 9-6"></path></svg></span></button></div>';
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
  if (!reduced) setTimeout(() => invitationCover.classList.add('opening'), 2150);
  setTimeout(() => {
    invitationCover.close();
    document.documentElement.style.overflow = previousOverflow;
    window.scrollTo({top:0,behavior:'instant'});
    scrollPosition = 0;
    document.querySelectorAll('[data-transition-key]').forEach(el => observer?.observe(el));
    resumeAt = performance.now() + 3000;
    musicButton.focus({preventScroll:true});
  }, reduced ? 0 : 2800);
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
  const coverDateText = Number.isFinite(coverDate) ? new Intl.DateTimeFormat('vi-VN',{timeZone:config.timeZone || 'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit',year:'numeric'}).format(coverDate).replaceAll('/', ' · ') : 'Ngày cưới chưa được cập nhật';
  invitationCover.querySelectorAll('.cover-date,.cover-letter small').forEach(el => el.textContent = coverDateText);
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
  document.querySelectorAll('[data-config="venueName"]').forEach(el => {
    if (Number.isFinite(config.venueNameFontSize)) el.style.fontSize = Math.max(18, Math.min(36, config.venueNameFontSize)) + 'px';
    el.style.whiteSpace = 'nowrap';
    if (!config.venueHall) return;
    const hall = document.createElement('span');
    hall.className = 'venue-hall';
    hall.textContent = config.venueHall;
    el.before(hall);
  });
  document.querySelectorAll('[data-config="venue"]').forEach(el => {
    el.style.display = 'block';
    el.style.width = '340px';
    el.style.maxWidth = '100%';
    el.style.margin = '0 auto';
    el.style.fontSize = '13px';
    el.style.lineHeight = '1.45';
    el.style.textWrap = 'balance';
    el.style.whiteSpace = 'pre-line';
  });
  function spaceWeddingTime() {
    const address = document.querySelector('.text-box-component[data-node-id="PgIa1pbqS-"]');
    const text = address?.querySelector('[contenteditable]');
    if (!text) return;
    const timeTop = Math.max(1455.48, 1405.18 + text.offsetHeight + 14);
    const shift = timeTop - 1455.48;
    const positions = {hQO6Cfwv4H:timeTop, WasT3iVjkw:1515.73 + shift, U_zDbp2bSZ:1577.77 + shift, '3yQAnYMOcB':1616.25 + shift, XdieWgAun8:1681.15 + shift};
    Object.entries(positions).forEach(([id, top]) => {
      document.querySelector(`.text-box-component[data-node-id="${id}"]`)?.style.setProperty('top', `${top}px`, 'important');
    });
  }
  requestAnimationFrame(spaceWeddingTime);
  document.fonts.ready.then(spaceWeddingTime);
  window.addEventListener('resize', spaceWeddingTime);
  document.querySelectorAll('[data-config="dateWithWeekday"]').forEach(el => {
    if (!validDate) return;
    const weekday = document.createElement('span');
    weekday.textContent = formatter({weekday:'long'}).format(date);
    const day = document.createElement('span');
    day.textContent = dateText;
    weekday.style.textAlign = 'center';
    day.style.textAlign = 'center';
    el.style.display = 'inline-grid';
    el.style.gridTemplateColumns = '1fr 1fr';
    el.style.columnGap = '0';
    el.style.whiteSpace = 'nowrap';
    el.style.width = '260px';
    el.style.height = '46px';
    el.style.alignItems = 'center';
    el.style.borderTop = '1.8px solid #000';
    el.style.borderBottom = '1.8px solid #000';
    el.style.boxSizing = 'border-box';
    weekday.style.height = '100%';
    weekday.style.display = 'grid';
    weekday.style.placeItems = 'center';
    weekday.style.borderRight = '1.8px solid #000';
    ['lInKG5IGgk','yuTVUF9Dvk','3YMBR2p2LJ'].forEach(id => document.querySelectorAll('[data-node-id="'+id+'"]').forEach(node => node.hidden = true));
    document.querySelector('[data-node-id="WasT3iVjkw"]').style.top = '1487.3px';
    el.replaceChildren(weekday, day);
  });
  document.title = config.invitationSide === 'bride'
    ? `${values['bride.name']} & ${values['groom.name']} | Thiệp cưới`
    : `${values['groom.name']} & ${values['bride.name']} | Thiệp cưới`;
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
// View wedding photos at full size without leaving the invitation.
const photoViewer = document.createElement('dialog');
photoViewer.className = 'photo-viewer';
photoViewer.setAttribute('aria-label', 'Xem ảnh cưới');
photoViewer.innerHTML = '<div class="photo-viewer-toolbar"><button type="button" data-zoom="out" aria-label="Thu nhỏ">−</button><button type="button" data-zoom="reset" aria-label="Về kích thước ban đầu">100%</button><button type="button" data-zoom="in" aria-label="Phóng to">+</button><button type="button" class="photo-viewer-close" aria-label="Đóng ảnh">×</button></div><div class="photo-viewer-stage"><img alt="Ảnh cưới Tuấn Anh và Phương Mai" draggable="false"></div><p class="photo-viewer-hint">Chạm hai lần hoặc dùng hai ngón tay để phóng to</p>';
document.body.append(photoViewer);
const photoStage = photoViewer.querySelector('.photo-viewer-stage');
const fullPhoto = photoViewer.querySelector('img');
const zoomLabel = photoViewer.querySelector('[data-zoom="reset"]');
let photoZoom = 1, photoX = 0, photoY = 0, photoOverflow = '', photoTrigger;
const photoPointers = new Map();
function renderPhoto() {
  const bounds = photoStage.getBoundingClientRect();
  const maxX = Math.max(0, (fullPhoto.clientWidth * photoZoom - bounds.width) / 2);
  const maxY = Math.max(0, (fullPhoto.clientHeight * photoZoom - bounds.height) / 2);
  photoX = Math.max(-maxX, Math.min(maxX, photoX));
  photoY = Math.max(-maxY, Math.min(maxY, photoY));
  fullPhoto.style.transform = `translate(${photoX}px,${photoY}px) scale(${photoZoom})`;
  zoomLabel.textContent = `${Math.round(photoZoom * 100)}%`;
}
function zoomPhoto(value) {
  photoZoom = Math.max(1, Math.min(4, value));
  renderPhoto();
}
fullPhoto.addEventListener('load', renderPhoto);
photoViewer.querySelectorAll('[data-zoom]').forEach(button => button.onclick = () => {
  zoomPhoto(button.dataset.zoom === 'reset' ? 1 : photoZoom + (button.dataset.zoom === 'in' ? .5 : -.5));
});
photoViewer.querySelector('.photo-viewer-close').onclick = () => photoViewer.close();
photoViewer.addEventListener('close', () => {
  document.documentElement.style.overflow = photoOverflow;
  photoPointers.clear();
  pauseScroll();
  photoTrigger?.focus({preventScroll:true});
});
function openPhoto(element) {
  const background = getComputedStyle(element).backgroundImage;
  const match = background.match(/^url\(["']?(.*?)["']?\)$/);
  if (!match || photoViewer.open) return;
  photoTrigger = element;
  photoOverflow = document.documentElement.style.overflow;
  document.documentElement.style.overflow = 'hidden';
  photoZoom = 1; photoX = 0; photoY = 0;
  fullPhoto.src = match[1];
  photoViewer.showModal();
  renderPhoto();
}
document.querySelectorAll('[data-photo]').forEach(element => {
  element.setAttribute('role', 'button');
  element.tabIndex = 0;
  element.setAttribute('aria-label', 'Phóng to ảnh cưới');
  element.onclick = () => openPhoto(element);
  element.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openPhoto(element); }
  });
});
photoStage.addEventListener('dblclick', () => zoomPhoto(photoZoom > 1 ? 1 : 2));
photoStage.addEventListener('wheel', event => {
  event.preventDefault(); zoomPhoto(photoZoom - event.deltaY * .002);
}, {passive:false});
let lastPhotoTap = 0;
let photoGestureMoved = false;
let photoPointerStart;
photoStage.addEventListener('pointerdown', event => {
  if (photoPointers.size === 0) {
    photoGestureMoved = false;
    photoPointerStart = {x:event.clientX, y:event.clientY};
  }
  photoPointers.set(event.pointerId, {x:event.clientX, y:event.clientY});
  if (photoPointers.size > 1) { photoGestureMoved = true; lastPhotoTap = 0; }
  photoStage.setPointerCapture(event.pointerId);
});
photoStage.addEventListener('pointermove', event => {
  const before = photoPointers.get(event.pointerId);
  if (!before) return;
  const other = [...photoPointers.entries()].find(([id]) => id !== event.pointerId)?.[1];
  if (other) {
    const oldDistance = Math.hypot(before.x - other.x, before.y - other.y);
    const newDistance = Math.hypot(event.clientX - other.x, event.clientY - other.y);
    if (oldDistance > 0) zoomPhoto(photoZoom * newDistance / oldDistance);
    lastPhotoTap = 0;
  } else if (photoZoom > 1) {
    photoX += event.clientX - before.x; photoY += event.clientY - before.y;
    renderPhoto();
  }
  if (Math.hypot(event.clientX - before.x, event.clientY - before.y) > 3) { photoGestureMoved = true; lastPhotoTap = 0; }
  photoPointers.set(event.pointerId, {x:event.clientX, y:event.clientY});
});
photoStage.addEventListener('pointerup', event => {
  const moved = photoGestureMoved || !photoPointerStart || Math.hypot(event.clientX - photoPointerStart.x, event.clientY - photoPointerStart.y) > 6;
  const bounds = fullPhoto.getBoundingClientRect();
  const outsidePhoto = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  if (photoPointers.size === 1 && !moved && outsidePhoto) {
    photoPointers.delete(event.pointerId);
    photoViewer.close();
    lastPhotoTap = 0;
    return;
  }
  if (event.pointerType === 'touch' && photoPointers.size === 1 && !photoGestureMoved) {
    const now = performance.now();
    if (lastPhotoTap && now - lastPhotoTap < 300) { zoomPhoto(photoZoom > 1 ? 1 : 2); lastPhotoTap = 0; }
    else lastPhotoTap = now;
  }
  photoPointers.delete(event.pointerId);
});
photoStage.addEventListener('pointercancel', event => { photoPointers.delete(event.pointerId); lastPhotoTap = 0; });
photoViewer.addEventListener('click', event => {
  if (event.target === photoViewer || event.target.classList.contains('photo-viewer-hint') || event.target.classList.contains('photo-viewer-toolbar')) photoViewer.close();
});
window.addEventListener('resize', () => { if (photoViewer.open) renderPhoto(); });
const form=document.querySelector('form');
if(form) {
  const feedback = document.createElement('div');
  feedback.className = 'rsvp-feedback';
  feedback.setAttribute('role','status');
  feedback.setAttribute('aria-live','polite');
  feedback.hidden = true;
  document.body.append(feedback);
  let feedbackTimer;
  function hideFeedback() {
    clearTimeout(feedbackTimer);
    feedback.hidden = true;
  }
  function showFeedback(message, state) {
    clearTimeout(feedbackTimer);
    feedback.textContent = message;
    feedback.dataset.state = state;
    feedback.hidden = false;
    if (state !== 'pending') feedbackTimer = setTimeout(hideFeedback, 4000);
  }
  form.addEventListener('invalid', event => {
    const message = event.target.id === 'rsvp-name' ? 'Vui lòng nhập họ và tên.' : 'Vui lòng chọn số người tham dự.';
    showFeedback(message,'error');
  }, true);
  form.addEventListener('input', hideFeedback);
  form.addEventListener('change', hideFeedback);
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
      const invitationConfig=await (await fetch(location.hostname.endsWith('github.io')?'config.json':'/api/config')).json();
      const data={invitationSide:invitationConfig.invitationSide,name:name.value.trim(),attendance,count:attendance==='no'?0:Number(count?.value||1),message:''};
      const onPages=location.hostname.endsWith('github.io');
      let endpoint='/api/rsvp',payload=data;
      if(onPages){
        const config=invitationConfig;endpoint=config.rsvpEndpoint;
        if(!endpoint)throw new Error('Kết nối xác nhận chưa được cập nhật.');
        const fingerprint=JSON.stringify(data);
        if(!pendingRsvp||pendingRsvp.fingerprint!==fingerprint)pendingRsvp={fingerprint,id:crypto.randomUUID()};
        payload={action:'public-rsvp',rsvp:{...data,id:pendingRsvp.id,createdAt:new Date().toISOString()}};
      }
      const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':onPages?'text/plain;charset=UTF-8':'application/json'},signal:AbortSignal.timeout(30000),body:JSON.stringify(payload)});
      const result=await response.json();if(!response.ok||result.ok!==true)throw new Error(result.error||'Không gửi được xác nhận.');
      pendingRsvp=null;
      document.getElementById('status').textContent='';
      showFeedback('Đã gửi xác nhận. Cảm ơn bạn!','success');
    }catch(error){
      const message = error.name === 'TimeoutError' ? 'Kết nối chậm. Vui lòng kiểm tra mạng và thử lại.' : error instanceof TypeError ? 'Không thể kết nối. Vui lòng kiểm tra mạng và thử lại.' : error.message;
      document.getElementById('status').textContent=message;
      showFeedback(message,'error');
    }
    finally{sending=false;button.disabled=false;button.textContent=originalLabel;form.removeAttribute('aria-busy');}
  });
}
