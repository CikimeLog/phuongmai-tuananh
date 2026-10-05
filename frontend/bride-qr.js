(() => {
  const box = document.querySelector('.signature-guest-box-component');
  if (!box) return;
  box.remove();
  const canvas = document.getElementById('page-root-container');
  const rsvp = canvas?.querySelector('.rsvp-form-container');
  if (!rsvp) return;
  const panel = document.createElement('div');
  panel.className = 'wedding-gift-panel';
  panel.dataset.transitionKey = 'wedding-gift-slide-up-0.9-0.15-false';
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
  dialog.innerHTML = '<button type="button" class="bride-qr-close" aria-label="Đóng ảnh QR">×</button><h2>Hộp mừng cưới online</h2><p class="bride-qr-message" role="status"></p><img alt="Mã QR cô dâu" hidden><div class="bride-qr-actions"><button type="button" class="bank-copy-button" hidden>Copy số tài khoản</button><a class="bride-qr-download" hidden download="QR-co-dau">Tải ảnh QR</a></div><input class="bank-account-number" aria-label="Số tài khoản" readonly hidden><p class="bank-copy-status" role="status" aria-live="polite"></p>';
  document.body.append(dialog);
  const image = dialog.querySelector('img'), link = dialog.querySelector('a'), message = dialog.querySelector('p');
  const accountInput = dialog.querySelector('.bank-account-number');
  const copyButton = dialog.querySelector('.bank-copy-button');
  const copyStatus = dialog.querySelector('.bank-copy-status');
  let copyTimer;
  copyButton.onclick = async () => {
    clearTimeout(copyTimer);
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(accountInput.value);
      else {
        accountInput.hidden = false; accountInput.focus(); accountInput.select(); accountInput.setSelectionRange(0, accountInput.value.length);
        if (!document.execCommand('copy')) throw new Error('copy');
        accountInput.hidden = true;
      }
      copyStatus.textContent = 'Đã sao chép số tài khoản';
    } catch {
      accountInput.hidden = false; accountInput.focus(); accountInput.select(); accountInput.setSelectionRange(0, accountInput.value.length);
      copyStatus.textContent = 'Vui lòng nhấn giữ số tài khoản và chọn Sao chép.';
    }
    copyTimer = setTimeout(() => { copyStatus.textContent = ''; }, 4000);
  };
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
    clearTimeout(copyTimer);
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
    image.hidden = true;link.hidden = true;copyButton.hidden = true;copyStatus.textContent = '';accountInput.hidden = true;message.textContent = 'Đang tải ảnh QR…';
    try {
      const response = await fetch(location.hostname.endsWith('github.io') ? 'config.json' : '/api/config', {cache:'no-store'});
      if(!response.ok) throw new Error('Không tải được ảnh QR. Vui lòng thử lại.');
      const config = await response.json();
      const recipient = config[config.invitationSide || 'groom'];
      const label = config.invitationSide === 'bride' ? 'cô dâu' : 'chú rể';
      image.alt = 'Mã QR ' + label;
      link.download = config.invitationSide === 'bride' ? 'QR-co-dau' : 'QR-chu-re';
      const accountNo = String(recipient?.accountNo || config.bank?.accountNo || '').trim();
      if (accountNo && accountNo !== 'SO_TAI_KHOAN_MAU') {
        accountInput.value = accountNo;

        copyButton.hidden = false;
      }
      const file = recipient?.qrImage || config.bank?.qrImage;
      if(!file) {message.textContent = 'Ảnh QR ' + label + ' chưa được cập nhật.';return;}
      const url = new URL(file,location.href);
      if(url.origin !== location.origin) throw new Error('Ảnh QR chưa được cấu hình đúng.');
      message.textContent = '';image.src = url.href;image.hidden = false;link.href = url.href;link.hidden = false;
    }catch(error){message.textContent = error.message;}
  };
})();
