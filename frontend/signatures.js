(() => {
  const box = document.querySelector('.signature-guest-box-component');
  const openButton = box?.querySelector('.signature-open-modal-btn');
  if (!box || !openButton) return;
  box.style.zIndex = '100';
  const actions = openButton.parentElement;
  actions.remove();
  const gallery = box.firstElementChild;
  gallery.replaceChildren();
  box.append(actions);
  actions.style.position = 'relative';
  actions.style.zIndex = '101';
  gallery.style.height = 'calc(100% - 52px)';
  gallery.classList.add('signature-gallery');
  const dialog = document.createElement('dialog');
  dialog.className = 'signature-dialog';
  dialog.innerHTML = '<form method="dialog" class="signature-form"><button type="button" class="signature-close" aria-label="Đóng bảng chữ ký">×</button><h2>Ký tên lưu niệm</h2><label for="signature-name">Họ và tên</label><input id="signature-name" maxlength="100" autocomplete="name" required><p>Vẽ bằng ngón tay hoặc chuột vào ô bên dưới.</p><canvas width="900" height="450" aria-label="Ô vẽ chữ ký"></canvas><div class="signature-actions"><button type="button" class="signature-clear">Vẽ lại</button><button type="submit" class="signature-save">Lưu chữ ký</button></div><p class="signature-message" role="status" aria-live="polite"></p></form>';
  document.body.append(dialog);
  const canvas = dialog.querySelector('canvas'), ctx = canvas.getContext('2d');
  const name = dialog.querySelector('input'), message = dialog.querySelector('.signature-message');
  const save = dialog.querySelector('.signature-save');
  let strokes = [], active = null, points = 0, saving = false;
  function point(event) {
    const rect = canvas.getBoundingClientRect();
    return [Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width)),Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height))];
  }
  function draw() {
    ctx.clearRect(0,0,900,450);ctx.strokeStyle='#a50010';ctx.fillStyle='#a50010';ctx.lineWidth=4;ctx.lineCap='round';ctx.lineJoin='round';
    strokes.forEach(stroke => {
      ctx.beginPath();ctx.moveTo(stroke[0][0]*900,stroke[0][1]*450);
      stroke.slice(1).forEach(p=>ctx.lineTo(p[0]*900,p[1]*450));ctx.stroke();
      if(stroke.length===1){ctx.beginPath();ctx.arc(stroke[0][0]*900,stroke[0][1]*450,2,0,Math.PI*2);ctx.fill();}
    });
  }
  canvas.addEventListener('pointerdown',event=>{
    if(saving || active || (event.pointerType==='mouse' && event.button!==0))return;
    if(strokes.length>=150 || points>=5000){message.textContent='Chữ ký quá dài. Hãy chọn Vẽ lại.';return;}
    event.preventDefault();canvas.setPointerCapture(event.pointerId);
    active={id:event.pointerId,stroke:[point(event)]};strokes.push(active.stroke);points++;message.textContent='';draw();
  });
  canvas.addEventListener('pointermove',event=>{
    if(!active || active.id!==event.pointerId || points>=5000)return;
    active.stroke.push(point(event));points++;draw();
  });
  for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,event=>{if(active?.id===event.pointerId)active=null;});
  dialog.querySelector('.signature-clear').onclick=()=>{if(saving)return;strokes=[];points=0;active=null;draw();message.textContent='';};
  dialog.querySelector('.signature-close').onclick=()=>{if(!saving)dialog.close();};
  dialog.addEventListener('cancel',event=>{if(saving)event.preventDefault();});
  openButton.onclick=()=>{dialog.showModal();message.textContent='';name.focus();};
  function render(items) {
    gallery.replaceChildren();
    if(!items.length){const empty=document.createElement('p');empty.textContent='Hãy là người đầu tiên ký tên lưu niệm!';gallery.append(empty);return;}
    items.forEach(item=>{
      const card=document.createElement('figure');
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 900 450');svg.setAttribute('role','img');svg.setAttribute('aria-label','Chữ ký của '+item.name);
      item.strokes.forEach(stroke=>{
        const path=document.createElementNS(svg.namespaceURI,'path');
        const coords=stroke.map(p=>[p[0]*900,p[1]*450]);
        let d='M'+coords[0].join(' ')+coords.slice(1).map(p=>'L'+p.join(' ')).join('');
        if(coords.length===1)d+='l.1 0';
        path.setAttribute('d',d);path.setAttribute('fill','none');path.setAttribute('stroke','#a50010');path.setAttribute('stroke-width','5');path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');svg.append(path);
      });
      const caption=document.createElement('figcaption');caption.textContent=item.name;card.append(svg,caption);gallery.append(card);
    });
  }
  async function refresh() {
    const response=await fetch('/api/signatures');if(!response.ok)throw new Error('Không tải được lưu bút.');render(await response.json());
  }
  dialog.querySelector('form').addEventListener('submit',async event=>{
    event.preventDefault();if(saving)return;
    if(!name.value.trim()){message.textContent='Vui lòng nhập họ và tên.';name.focus();return;}
    if(!strokes.length){message.textContent='Bạn hãy vẽ chữ ký trước khi lưu.';return;}
    saving=true;save.disabled=true;save.textContent='Đang lưu…';message.textContent='';
    try {
      const response=await fetch('/api/signatures',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(15000),body:JSON.stringify({name:name.value.trim(),strokes})});
      const result=await response.json();if(!response.ok)throw new Error(result.error);
      strokes=[];points=0;active=null;draw();name.value='';
      message.textContent='Đã lưu chữ ký. Cảm ơn bạn!';
      await refresh().catch(()=>{message.textContent='Đã lưu chữ ký. Tải lại thiệp để xem chữ ký mới.';});
      setTimeout(()=>{if(dialog.open)dialog.close();},1800);
    }catch(error){message.textContent=error.name==='TimeoutError'?'Kết nối chậm. Vui lòng thử lại.':error.message;}
    finally{saving=false;save.disabled=false;save.textContent='Lưu chữ ký';}
  });
  refresh().catch(()=>{gallery.textContent='Chưa tải được lưu bút. Vui lòng tải lại trang.';});
})();
