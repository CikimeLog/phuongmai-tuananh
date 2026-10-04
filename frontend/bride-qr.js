(() => {
  const box = document.querySelector('.signature-guest-box-component');
  if (!box) return;
  box.remove();
  const canvas = document.getElementById('page-root-container');
  const rsvp = canvas?.querySelector('.rsvp-form-container');
  if (!rsvp) return;
  const panel = document.createElement('div');
  panel.className = 'wedding-gift-panel';
  panel.style.top = (parseFloat(rsvp.style.top) + parseFloat(rsvp.style.height) + 205) + 'px';
  canvas.append(panel);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'bride-qr-button';
  button.setAttribute('aria-label','Hộp mừng cưới online');
  button.innerHTML = '<span class="gift-art" aria-hidden="true"><span class="gift-lid"></span><span class="gift-body"></span><span class="gift-heart">♥</span></span><span class="gift-label"><span class="gift-title">Hộp mừng cưới</span><span class="gift-subtitle">ONLINE</span></span>'; 
  panel.append(button);
  const dialog = document.createElement('dialog');
  dialog.className = 'bride-qr-dialog';
  dialog.innerHTML = '<button type="button" class="bride-qr-close" aria-label="Đóng ảnh QR">×</button><h2>Hộp mừng cưới online</h2><p class="bride-qr-message" role="status"></p><img alt="Mã QR cô dâu" hidden><a class="bride-qr-download" hidden download="QR-co-dau">Tải ảnh QR</a>';
  document.body.append(dialog);
  const image = dialog.querySelector('img'), link = dialog.querySelector('a'), message = dialog.querySelector('p');
  dialog.querySelector('button').onclick = () => dialog.close();
  let pressedOutside = false;
  function outside(event) {
    const rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  }
  dialog.addEventListener('pointerdown', event => { pressedOutside = event.target === dialog && outside(event); });
  dialog.addEventListener('click', event => {
    if (pressedOutside && event.target === dialog && outside(event)) dialog.close();
    pressedOutside = false;
  });
  let savedScroll = 0;
  dialog.addEventListener('close', () => {
    button.focus({preventScroll:true});
    window.scrollTo({top:savedScroll,behavior:'instant'});
  });
  image.onerror = () => {image.hidden = true;link.hidden = true;message.textContent = 'Chưa tải được ảnh QR. Vui lòng thử lại.';};
  button.onclick = async () => {
    if (button.disabled) return;
    savedScroll = window.scrollY;
    button.disabled = true;
    button.classList.add('gift-opening');
    await new Promise(resolve => setTimeout(resolve, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 750));
    button.disabled = false;
    button.classList.remove('gift-opening');
    dialog.showModal();
    dialog.querySelector('button').focus({preventScroll:true});
    window.scrollTo({top:savedScroll,behavior:'instant'});
    image.hidden = true;link.hidden = true;message.textContent = 'Đang tải ảnh QR…';
    try {
      const response = await fetch(location.hostname.endsWith('github.io') ? 'config.json' : '/api/config');
      if(!response.ok) throw new Error('Không tải được ảnh QR. Vui lòng thử lại.');
      const config = await response.json();
      const file = config.bride?.qrImage || config.bank?.qrImage;
      if(!file) {message.textContent = 'Ảnh QR cô dâu chưa được cập nhật.';return;}
      const url = new URL(file,location.href);
      if(url.origin !== location.origin) throw new Error('Ảnh QR chưa được cấu hình đúng.');
      message.textContent = '';image.src = url.href;image.hidden = false;link.href = url.href;link.hidden = false;
    }catch(error){message.textContent = error.message;}
  };
})();
