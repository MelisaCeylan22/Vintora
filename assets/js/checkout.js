(() => {
  const cities = [
    { name: 'İstanbul', districts: ['Kadıköy', 'Üsküdar', 'Beşiktaş', 'Şişli', 'Ataşehir'] },
    { name: 'Ankara', districts: ['Çankaya', 'Keçiören', 'Yenimahalle', 'Mamak', 'Etimesgut'] },
    { name: 'İzmir', districts: ['Konak', 'Karşıyaka', 'Bornova', 'Buca', 'Gaziemir'] },
    { name: 'Bursa', districts: ['Nilüfer', 'Osmangazi', 'Yıldırım'] },
    { name: 'Antalya', districts: ['Muratpaşa', 'Konyaaltı', 'Kepez'] },
  ];

  const ordersKey = 'vintora_orders';

  const loadOrders = () => {
    try {
      const data = JSON.parse(localStorage.getItem(ordersKey) || '[]');
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  };
  const saveOrder = (order) => {
    const all = loadOrders();
    all.push(order);
    localStorage.setItem(ordersKey, JSON.stringify(all));
  };

  const luhnCheck = (num) => {
    const arr = (num + '')
      .replace(/\s+/g, '')
      .split('')
      .reverse()
      .map((x) => parseInt(x, 10));
    if (!arr.length || arr.some(Number.isNaN)) return false;
    const sum = arr.reduce((acc, val, idx) => {
      if (idx % 2) {
        const dbl = val * 2;
        return acc + (dbl > 9 ? dbl - 9 : dbl);
      }
      return acc + val;
    }, 0);
    return sum % 10 === 0;
  };

  const showToast = (msg) => {
    let toast = document.querySelector('.checkout-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'checkout-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2200);
  };

  const showError = (el, msg) => {
    if (!el) return;
    el.classList.add('field-error');
    let holder = el.parentElement;
    if (holder) {
      let text = holder.querySelector('.field-error-msg');
      if (!text) {
        text = document.createElement('small');
        text.className = 'field-error-msg';
        holder.appendChild(text);
      }
      text.textContent = msg;
    }
  };

  const clearErrors = (form) => {
    form.querySelectorAll('.field-error').forEach((f) => f.classList.remove('field-error'));
    form.querySelectorAll('.field-error-msg').forEach((n) => n.remove());
  };

  const fillCityDistrict = () => {
    const citySel = document.getElementById('city');
    const distSel = document.getElementById('district');
    if (!citySel || !distSel) return;
    const setCities = (list) => {
      citySel.innerHTML = '<option value=\"\" disabled selected hidden>Şehir Seç</option>';
      list.forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = c.name;
        citySel.appendChild(opt);
      });
    };
    const setDistricts = (cityName) => {
      const selected = currentCities.find((c) => c.name === cityName);
      distSel.innerHTML = '<option value=\"\" disabled selected hidden>Mahalle Seç</option>';
      (selected?.districts || []).forEach((d) => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        distSel.appendChild(opt);
      });
    };

    let currentCities = cities;
    setCities(currentCities);

    fetch('https://turkiyeapi.dev/api/v1/provinces')
      .then((res) => res.ok ? res.json() : Promise.reject(res.status))
      .then((data) => {
        if (data?.data?.length) {
          currentCities = data.data.map((p) => ({
            name: p.name,
            districts: p.districts?.map((d) => d.name) || [],
          }));
          setCities(currentCities);
        }
      })
      .catch(() => {
        // fallback to static list
      });

    citySel.addEventListener('change', () => setDistricts(citySel.value));
  };

  const buildPdf = (order) => {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) return null;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Vintora Sipariş Özeti', 20, 20);
    doc.setFontSize(12);
    doc.text(`Sipariş No: ${order.id}`, 20, 32);
    doc.text(`Müşteri: ${order.customer}`, 20, 40);
    doc.text(`E-posta: ${order.email}`, 20, 48);
    doc.text(`Adres: ${order.address}`, 20, 56);
    doc.text(`Toplam: ${order.total}`, 20, 64);
    doc.text('Ürünler:', 20, 76);
    const lines = doc.splitTextToSize(order.items || 'Sepet boş', 170);
    doc.text(lines, 20, 84);
    doc.text('Destek: info@vintora.com | +90 536 789 5652', 20, 200);
    return doc;
  };

  document.addEventListener('DOMContentLoaded', () => {
    fillCityDistrict();
    const monthSel = document.getElementById('exp-month');
    const yearSel = document.getElementById('exp-year');
    if (monthSel) {
      monthSel.innerHTML = '<option value=\"\" disabled selected hidden>Ay</option>';
      ['01','02','03','04','05','06','07','08','09','10','11','12'].forEach((m)=> {
        const opt = document.createElement('option'); opt.value = m; opt.textContent = m; monthSel.appendChild(opt);
      });
    }
    if (yearSel) {
      yearSel.innerHTML = '<option value=\"\" disabled selected hidden>Yıl</option>';
      const year = new Date().getFullYear();
      for (let y = year; y <= year + 10; y++) {
        const opt = document.createElement('option'); opt.value = y; opt.textContent = y; yearSel.appendChild(opt);
      }
    }

    const form = document.getElementById('checkout-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      clearErrors(form);
      const data = {
        fname: form.fname.value.trim(),
        lname: form.lname.value.trim(),
        email: form.email.value.trim(),
        city: form.querySelector('#city')?.value || '',
        district: form.querySelector('#district')?.value || '',
        code: form.code.value.trim(),
        card: form.cnumber.value.replace(/\s+/g, ''),
        month: form.querySelector('#exp-month')?.value || '',
        year: form.querySelector('#exp-year')?.value || '',
        cvv: form.scord.value.trim(),
      };

      let hasError = false;
      const mark = (el, msg) => { hasError = true; showError(el, msg); };

      if (data.fname.length < 2) mark(form.fname, 'Lütfen adınızı girin');
      if (data.lname.length < 2) mark(form.lname, 'Lütfen soyadınızı girin');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) mark(form.email, 'Geçerli e-posta girin');
      if (!data.city) mark(form.querySelector('#city'), 'Şehir seçin');
      if (!data.district) mark(form.querySelector('#district'), 'Mahalle seçin');
      if (!/^[0-9]{5}$/.test(data.code)) mark(form.code, '5 haneli posta kodu girin');
      if (data.card.length < 13 || !luhnCheck(data.card)) mark(form.cnumber, 'Kart numarası geçersiz');
      if (!data.month) mark(monthSel, 'Ay seçin');
      if (!data.year) mark(yearSel, 'Yıl seçin');
      const now = new Date();
      const exp = data.month && data.year ? new Date(parseInt(data.year, 10), parseInt(data.month, 10) - 1, 1) : null;
      if (exp && exp < new Date(now.getFullYear(), now.getMonth(), 1)) mark(yearSel, 'Kart son kullanma tarihi geçmiş');
      if (!/^[0-9]{3,4}$/.test(data.cvv)) mark(form.scord, 'CVV 3-4 haneli olmalı');

      if (hasError) {
        showToast('Lütfen bilgileri kontrol edin.');
        return;
      }

      const totals = window.Cart?.totals ? window.Cart.totals() : { items: [], total: 0 };
      const items = totals.items || [];
      const order = {
        id: 'VT-' + Date.now(),
        createdAt: new Date().toISOString(),
        customer: `${data.fname} ${data.lname}`,
        email: data.email,
        address: `${data.district} / ${data.city} ${data.code}`,
        items: items.map((it) => `${it.qty}x ${it.title}`).join(', ') || '',
        total: totals.total ? `${totals.total} TL` : '',
      };
      saveOrder(order);
      showToast('Ödeme alındı. Teşekkürler!');

      const pdfDoc = buildPdf(order);
      if (pdfDoc) {
        pdfDoc.save(`${order.id}.pdf`);
      } else {
        showToast('PDF oluşturulamadı.');
      }
      form.reset();
      window.Cart?.clear?.();
      window.location.href = 'thank-you.html';
    });
  });
})();
