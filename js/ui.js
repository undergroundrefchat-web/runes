// Оболочка интерфейса: нижний лист, всплывающее меню, боковое меню, страницы, тост.
const $ = s => document.querySelector(s);

// ── Нижний лист ──
const sheet = $('#sheet'), sheetBody = $('#sheet-body');
export function openSheet(html) {
  sheetBody.innerHTML = html;
  sheetBody.scrollTop = 0;
  sheet.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => sheet.classList.add('open')));
}
export function closeSheet() {
  sheet.classList.remove('open');
  setTimeout(() => { sheet.hidden = true; }, 260);
}
sheet.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeSheet(); });

// ── Тост ──
export function toast(t) {
  const x = $('#toast');
  x.textContent = t; x.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => { x.hidden = true; }, 1800);
}

// ── Всплывающее меню (расклады) ──
const menu = $('#menu');
export function openMenu(html, onPick) {
  menu.innerHTML = html;
  menu.hidden = false;
  const close = e => {
    if (e && menu.contains(e.target)) {
      const b = e.target.closest('[data-pick]');
      if (!b) return;
      onPick(b.dataset.pick);
    }
    menu.hidden = true;
    document.removeEventListener('click', close, true);
  };
  setTimeout(() => document.addEventListener('click', close, true));
}

// ── Боковое меню ──
const drawer = $('#drawer');
export function openDrawer() { drawer.hidden = false; requestAnimationFrame(() => requestAnimationFrame(() => drawer.classList.add('open'))); }
export function closeDrawer() { drawer.classList.remove('open'); setTimeout(() => { drawer.hidden = true; }, 260); }
drawer.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeDrawer(); });

// ── Страница поверх главного экрана ──
const page = $('#page'), pageTitle = $('#page-title'), pageBody = $('#page-body');
export function openPage(p) {
  pageTitle.textContent = p.title;
  pageBody.innerHTML = '';
  p.render(pageBody);
  page.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => page.classList.add('open')));
}
export function closePage() { page.classList.remove('open'); setTimeout(() => { page.hidden = true; }, 280); }
$('#page-back').addEventListener('click', closePage);
