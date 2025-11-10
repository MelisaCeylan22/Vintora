document.addEventListener('DOMContentLoaded', function () {
  
  const deTr = s => (s || '')
    .replace(/ç/gi,'c').replace(/ğ/gi,'g').replace(/ı/g,'i').replace(/İ/g,'I')
    .replace(/ö/gi,'o').replace(/ş/gi,'s').replace(/ü/gi,'u');
  const toSlug = s => deTr(s).trim().toLowerCase()
    .replace(/%20/g,' ').replace(/[\s_]+/g,'-').replace(/[^a-z0-9\-]/g,'');
  const toKey  = s => deTr(s).trim().toUpperCase().replace(/-/g,' ').replace(/\s+/g,' ');

  const raw = new URLSearchParams(location.search).get('code') || '';
  console.log('[PD] raw code =', raw);

  if (typeof PRODUCTS === 'undefined') {
    console.warn('[PD] PRODUCTS yok. products-data.js yolu/sırası yanlış.');
    return;
  }
  console.log('[PD] PRODUCTS keys =', Object.keys(PRODUCTS));

  
  let data = PRODUCTS[raw];
  
  if (!data) data = PRODUCTS[toKey(raw)];
  
  if (!data) {
    const mapBySlug = {};
    Object.keys(PRODUCTS).forEach(k => { mapBySlug[toSlug(k)] = k; });
    const hit = mapBySlug[toSlug(raw)];
    if (hit) data = PRODUCTS[hit];
  }

  console.log('[PD] matched data =', data ? data.title : null);
  if (!data) return;

  // Seçiciler 
  const allImages   = document.querySelectorAll('.product2-tab img.img-fluid');
  const titleEl     = document.querySelector('.types_content h4');
  const priceEl     = document.querySelector('.types_content .price');
  const shortDescEl = document.querySelector('.types_content p.text-size-16');
  const descParas   = document.querySelectorAll('#description .description_content p');
  const infoTbody   = document.querySelector('#information table tbody');

  // Doldurma
  allImages.forEach(img => {
    img.src = data.image;
    img.alt = (data.title || 'Ürün') + ' görseli';
  });

  if (titleEl)     titleEl.textContent     = data.title || '';
  if (priceEl)     priceEl.textContent     = data.price || '';
  if (shortDescEl) shortDescEl.textContent = data.shortDesc || '';

  if (descParas[0]) descParas[0].textContent = data.longDesc || '';
  if (descParas[1]) descParas[1].textContent = ''; 

  if (infoTbody) {
    const rows = [
      ['Types',     data.types     || '-'],
      ['Materials', data.materials || '-'],
      ['Features',  data.features  || '-'],
    ];
    infoTbody.innerHTML = rows.map(([k,v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('');
  }

  document.title = `${data.title} | Vintora`;
  console.log('[PD] doldurma bitti.');
});
