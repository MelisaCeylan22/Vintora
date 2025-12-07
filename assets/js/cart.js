(() => {
  const CART_KEY = 'vintora_cart';

  const loadCart = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch (err) {
      console.error('Cart parse error', err);
      return [];
    }
  };

  const saveCart = (items) => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  };

  const normalizeImage = (src = '') =>
    src.replace(/^\.?\.\//, '').replace('../assets', 'assets');

  const parsePrice = (priceStr = '') => {
    const cleaned = priceStr.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.');
    const value = parseFloat(cleaned);
    return Number.isFinite(value) ? value : 0;
  };

  const formatPrice = (value) =>
    new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(value);

  const getProduct = (id) => {
    if (typeof PRODUCTS === 'undefined') return null;
    return PRODUCTS[id] || null;
  };

  const addItem = (id, qty = 1) => {
    const product = getProduct(id);
    if (!product) return;
    const items = loadCart();
    const existing = items.find((it) => it.id === id);
    const numericPrice = parsePrice(product.price);
    const normalizedImage = normalizeImage(product.image);

    if (existing) {
      existing.qty += qty;
    } else {
      items.push({
        id,
        qty: qty > 0 ? qty : 1,
        title: product.title || 'Ürün',
        price: numericPrice,
        image: normalizedImage,
        desc: product.shortDesc || '',
      });
    }
    saveCart(items);
  };

  const updateQty = (id, qty) => {
    const items = loadCart();
    const item = items.find((it) => it.id === id);
    if (!item) return;
    item.qty = Math.max(1, qty);
    saveCart(items);
  };

  const removeItem = (id) => {
    const items = loadCart().filter((it) => it.id !== id);
    saveCart(items);
  };

  const clearCart = () => saveCart([]);

  const calculateTotals = () => {
    const items = loadCart();
    const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);
    const shipping = items.length ? 0 : 0;
    const total = subtotal + shipping;
    const count = items.reduce((sum, it) => sum + it.qty, 0);
    return { items, subtotal, shipping, total, count };
  };

  const renderCartCount = () => {
    const { count } = calculateTotals();
    document.querySelectorAll('.cart span').forEach((el) => {
      el.textContent = count;
    });
  };

  const renderCartPage = () => {
    const list = document.querySelector('[data-cart-list]');
    if (!list) return;
    const countBadge = document.querySelector('[data-cart-count]');
    const subtotalEl = document.querySelector('[data-cart-subtotal]');
    const shippingEl = document.querySelector('[data-cart-shipping]');
    const totalEl = document.querySelector('[data-cart-total]');
    const { items, subtotal, shipping, total, count } = calculateTotals();

    if (countBadge) countBadge.textContent = `(${count} Ürün)`;

    if (!items.length) {
      list.innerHTML = '<p class="mb-0 py-3">Sepetiniz boş.</p>';
      if (subtotalEl) subtotalEl.textContent = formatPrice(0);
      if (shippingEl) shippingEl.textContent = formatPrice(0);
      if (totalEl) totalEl.textContent = formatPrice(0);
      return;
    }

    list.innerHTML = items
      .map(
        (it) => `
        <div class="product d-sm-flex d-block align-items-center" data-item="${it.id}">
          <div class="product-details">
            <div class="product-image">
              <figure class="mb-0">
                <img src="${it.image}" alt="${it.title}" class="img-fluid">
              </figure>
            </div>
            <div class="product-content">
              <span class="product-title">${it.title}</span>
              <span class="product-color text">Adet: <span>${it.qty}</span></span>
            </div>
          </div>
          <div class="product-price"><span>${formatPrice(it.price)}</span></div>
          <div class="product-quantity d-flex">
            <div class="product-qty-details">
              <button class="value-button decrease-button" data-action="dec" title="">-</button>
              <div class="number">${it.qty}</div>
              <button class="value-button increase-button" data-action="inc" title="">+</button>
            </div>
          </div>
          <div class="product-line-price"><span>${formatPrice(it.price * it.qty)}</span></div>
          <div class="product-removal">
            <button class="remove-product" data-action="remove"><i class="fas fa-times"></i></button>
          </div>
        </div>`
      )
      .join('');

    if (!list.dataset.bound) {
      list.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const row = btn.closest('[data-item]');
        if (!row) return;
        const id = row.getAttribute('data-item');
        const current = loadCart().find((it) => it.id === id);
        if (!current) return;

        if (btn.dataset.action === 'inc') {
          updateQty(id, current.qty + 1);
        } else if (btn.dataset.action === 'dec') {
          updateQty(id, current.qty - 1);
        } else if (btn.dataset.action === 'remove') {
          removeItem(id);
        }
        renderCartPage();
        renderCartCount();
      });
      list.dataset.bound = '1';
    }

    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (shippingEl) shippingEl.textContent = formatPrice(shipping);
    if (totalEl) totalEl.textContent = formatPrice(total);
  };

  const renderCheckout = () => {
    const list = document.querySelector('[data-checkout-list]');
    if (!list) return;
    const totalEl = document.querySelector('[data-checkout-total]');
    const { items, total } = calculateTotals();
    if (!items.length) {
      list.innerHTML = '<p class="mb-0 py-2">Sepetiniz boş.</p>';
      if (totalEl) totalEl.textContent = formatPrice(0);
      return;
    }

    list.innerHTML = items
      .map(
        (it) => `
        <div class="each-item">
          <div class="product-items">
            <span class="heading">${it.qty} x ${it.title}</span>
            <p class="text-size-14 mb-0">${it.desc || ''}</p>
          </div>
          <div class="product-prices">
            <span class="dollar">${formatPrice(it.price * it.qty)}</span>
          </div>
        </div>`
      )
      .join('');

    if (totalEl) totalEl.textContent = formatPrice(total);
  };

  const showToast = (message) => {
    let toast = document.querySelector('.cart-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'cart-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1800);
  };

  const bindDetailPage = () => {
    const addBtn = document.querySelector('.add-to-cart[data-product-id]');
    if (!addBtn) return;
    const qtyNode = document.querySelector('.quatity_button_wrapper .number');

    addBtn.addEventListener('click', () => {
      const qty = qtyNode ? parseInt(qtyNode.textContent, 10) || 1 : 1;
      addItem(addBtn.dataset.productId, qty);
      renderCartCount();
      showToast('Sepete eklendi');
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    bindDetailPage();
    renderCartPage();
    renderCheckout();
    renderCartCount();
  });

  window.Cart = {
    add: addItem,
    updateQty,
    remove: removeItem,
    clear: clearCart,
    get: loadCart,
    totals: calculateTotals,
  };
})();
