/**
 * CostcoHealth USA - Interactive JavaScript Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mainNav = document.getElementById('mainNav');

  if (mobileMenuBtn && mainNav) {
    mobileMenuBtn.addEventListener('click', () => {
      if (mainNav.style.display === 'block') {
        mainNav.style.display = 'none';
      } else {
        mainNav.style.display = 'block';
        mainNav.style.position = 'absolute';
        mainNav.style.top = '76px';
        mainNav.style.left = '0';
        mainNav.style.width = '100%';
        mainNav.style.background = '#ffffff';
        mainNav.style.padding = '20px';
        mainNav.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
      }
    });
  }

  // 2. Active Header on Scroll
  const siteHeader = document.getElementById('siteHeader');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      siteHeader.style.boxShadow = '0 4px 20px rgba(15, 23, 42, 0.08)';
    } else {
      siteHeader.style.boxShadow = 'var(--shadow-sm)';
    }
  });

  // 3. Smooth Scrolling for all anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = targetEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });

        // Close mobile nav if opened
        if (window.innerWidth <= 768 && mainNav) {
          mainNav.style.display = 'none';
        }
      }
    });
  });

  // 4. Smart Image Fallback Handler for Local & Live Production
  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', function() {
      if (!this.dataset.fallbackTried) {
        this.dataset.fallbackTried = 'true';
        const currentSrc = this.getAttribute('src') || '';
        if (window.location.protocol === 'file:') {
          const filename = currentSrc.substring(currentSrc.lastIndexOf('/') + 1);
          this.src = `../../brain/3e036d56-f8db-415b-bd1e-81607adc9a65/${filename}`;
        }
      }
    });
  });

  // 5. FAQ Accordion Toggle
  document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', function() {
      const answer = this.nextElementSibling;
      const icon = this.querySelector('.faq-toggle-icon');
      if (answer.style.display === 'none') {
        answer.style.display = 'block';
        if (icon) icon.textContent = '−';
      } else {
        answer.style.display = 'none';
        if (icon) icon.textContent = '+';
      }
    });
  });
});

/**
 * Cấu hình Google Sheets Webhook (Tùy chọn):
 * Dán link Web App (https://script.google.com/macros/s/.../exec) vào đây nếu có.
 */
const GOOGLE_SHEET_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbxhYoywMBUvKXV7kM4l0h9pf_7TC-lIul1_6bt1aiC5mp7y6cdnEu3KcDLJpLDk5KvSCQ/exec';

/* ==========================================================================
   1. SHOPPING CART ENGINE (LOCALSTORAGE & REACTIVE UI)
   ========================================================================== */
const PRODUCT_CATALOG = {
  'p1': { name: 'Kirkland Glucosamine 1500mg (375v)', price: 595000, originalPrice: 680000, image: 'product1.jpg' },
  'p2': { name: 'Kirkland Wild Alaskan Fish Oil (230v)', price: 620000, originalPrice: 710000, image: 'product2.jpg' },
  'p3': { name: 'Youtheory Collagen Advanced (390v)', price: 620000, originalPrice: 790000, image: 'product3.jpg' },
  'p4': { name: 'Schiff Move Free Ultra (75v)', price: 720000, originalPrice: 850000, image: 'product4.jpg' },
  'p5': { name: 'Natrol Biotin 10,000 mcg (60v)', price: 380000, originalPrice: 450000, image: 'product5.jpg' },
  'p6': { name: 'Trunature Ginkgo Biloba 120mg (300v)', price: 540000, originalPrice: 630000, image: 'product6.jpg' }
};

let cart = [];
try {
  const savedCart = localStorage.getItem('costco_cart');
  if (savedCart) cart = JSON.parse(savedCart);
  // Auto-sync existing cart items with the latest catalog prices
  if (Array.isArray(cart) && cart.length > 0) {
    cart.forEach(item => {
      if (PRODUCT_CATALOG[item.id]) {
        item.price = PRODUCT_CATALOG[item.id].price;
        item.originalPrice = PRODUCT_CATALOG[item.id].originalPrice;
        item.name = PRODUCT_CATALOG[item.id].name;
      }
    });
  }
} catch (e) {
  cart = [];
}

let appliedVoucher = null;
try {
  const savedV = localStorage.getItem('costco_applied_voucher');
  if (savedV) appliedVoucher = JSON.parse(savedV);
} catch (e) {}

function saveCart() {
  try {
    localStorage.setItem('costco_cart', JSON.stringify(cart));
    if (appliedVoucher) {
      localStorage.setItem('costco_applied_voucher', JSON.stringify(appliedVoucher));
    } else {
      localStorage.removeItem('costco_applied_voucher');
    }

    if (cart.length > 0) {
      const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
      const discount = appliedVoucher ? appliedVoucher.discount : 0;
      const finalTotal = Math.max(0, subtotal - discount);
      const productNames = cart.map(i => `${i.name} (x${i.qty})`).join(', ');

      const name = document.getElementById('cartCustomerName') ? document.getElementById('cartCustomerName').value.trim() : '';
      const phone = document.getElementById('cartCustomerPhone') ? document.getElementById('cartCustomerPhone').value.trim() : '';
      const address = document.getElementById('cartCustomerAddress') ? document.getElementById('cartCustomerAddress').value.trim() : '';
      const note = document.getElementById('cartCustomerNote') ? document.getElementById('cartCustomerNote').value.trim() : '';

      localStorage.setItem('costco_checkout_data', JSON.stringify({
        name: name,
        phone: phone,
        address: address,
        note: note,
        amount: finalTotal,
        product: productNames,
        cartItems: cart,
        discount: discount,
        voucher: appliedVoucher ? appliedVoucher.code : ''
      }));
    }
  } catch (e) {}
}

function clearCart() {
  if (confirm('Bạn có chắc chắn muốn xóa toàn bộ sản phẩm trong giỏ hàng?')) {
    cart = [];
    appliedVoucher = null;
    saveCart();
    updateCartBadges();
    renderCart();
    showToast('Đã xóa toàn bộ giỏ hàng!');
  }
}

function updateCartBadges() {
  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
  
  const headerBadge = document.getElementById('cartCountBadge');
  const drawerBadge = document.getElementById('drawerCartBadge');
  const floatingBadge = document.getElementById('floatingCartBadge');

  [headerBadge, drawerBadge, floatingBadge].forEach(badge => {
    if (badge) {
      badge.textContent = totalCount;
      badge.classList.add('bump');
      setTimeout(() => badge.classList.remove('bump'), 250);
    }
  });

  const floatingBtn = document.getElementById('floatingCartBtn');
  if (floatingBtn) {
    floatingBtn.style.display = totalCount > 0 ? 'flex' : 'none';
  }
}

function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

function addToCart(id, name, price, originalPrice, image) {
  const existingIndex = cart.findIndex(item => item.id === id);
  if (existingIndex > -1) {
    cart[existingIndex].qty += 1;
  } else {
    cart.push({
      id: id,
      name: name,
      price: price,
      originalPrice: originalPrice,
      image: image,
      qty: 1
    });
  }

  saveCart();
  updateCartBadges();
  renderCart();
  showToast(`Đã thêm "${name}" vào giỏ hàng!`);
}

function buyNow(id, name, price, originalPrice, image) {
  addToCart(id, name, price, originalPrice, image);
  openCart();
}

function filterProducts(category, btnElement) {
  const tabs = document.querySelectorAll('.filter-tab-btn');
  tabs.forEach(tab => tab.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');

  const cards = document.querySelectorAll('.products-grid .product-card');
  cards.forEach(card => {
    const cardCat = card.getAttribute('data-category');
    if (!category || category === 'all' || cardCat === category) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
}

function updateCartQty(id, delta) {
  const itemIndex = cart.findIndex(item => item.id === id);
  if (itemIndex > -1) {
    cart[itemIndex].qty += delta;
    if (cart[itemIndex].qty <= 0) {
      cart.splice(itemIndex, 1);
    }
    saveCart();
    updateCartBadges();
    renderCart();
  }
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  saveCart();
  updateCartBadges();
  renderCart();
  showToast('Đã xóa sản phẩm khỏi giỏ hàng!');
}

function renderCart() {
  const emptyState = document.getElementById('cartEmptyState');
  const itemsContainer = document.getElementById('cartItemsContainer');
  const itemsList = document.getElementById('cartItemsList');

  if (!emptyState || !itemsContainer || !itemsList) return;

  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);

  if (totalCount === 0) {
    emptyState.style.display = 'block';
    itemsContainer.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  itemsContainer.style.display = 'block';

  // Render items
  itemsList.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" onerror="this.src='images/${item.image}'" alt="${item.name}" class="cart-item-img">
      <div class="cart-item-info">
        <div class="cart-item-name" title="${item.name}">${item.name}</div>
        <div class="cart-item-price">${formatVND(item.price)}</div>
        <div class="cart-item-actions">
          <button type="button" class="cart-qty-btn" onclick="updateCartQty('${item.id}', -1)" aria-label="Giảm">－</button>
          <span class="cart-qty-val">${item.qty}</span>
          <button type="button" class="cart-qty-btn" onclick="updateCartQty('${item.id}', 1)" aria-label="Tăng">＋</button>
        </div>
      </div>
      <button type="button" class="cart-item-remove" onclick="removeFromCart('${item.id}')" title="Xóa món này">🗑️</button>
    </div>
  `).join('');

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  let discountAmount = 0;

  if (appliedVoucher) {
    discountAmount = appliedVoucher.discount;
  }

  const finalTotal = Math.max(0, subtotal - discountAmount);

  // Update Summary UI
  const subtotalEl = document.getElementById('summarySubtotal');
  const countEl = document.getElementById('summaryItemCount');
  const discountRow = document.getElementById('voucherDiscountRow');
  const discountEl = document.getElementById('summaryDiscount');
  const totalEl = document.getElementById('summaryTotal');

  if (countEl) countEl.textContent = totalCount;
  if (subtotalEl) subtotalEl.textContent = formatVND(subtotal);

  if (discountRow && discountEl) {
    if (discountAmount > 0) {
      discountRow.style.display = 'flex';
      discountEl.textContent = '-' + formatVND(discountAmount);
    } else {
      discountRow.style.display = 'none';
    }
  }

  if (totalEl) totalEl.textContent = formatVND(finalTotal);
}

function openCart() {
  const overlay = document.getElementById('cartOverlay');
  if (overlay) {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    renderCart();
  }
}

function closeCart() {
  const overlay = document.getElementById('cartOverlay');
  if (overlay) {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function closeCartOnOverlay(event) {
  if (event.target.id === 'cartOverlay') {
    closeCart();
  }
}

function applyCartVoucher() {
  const input = document.getElementById('voucherInput');
  const statusMsg = document.getElementById('voucherStatusMsg');
  if (!input || !statusMsg) return;

  const code = input.value.trim().toUpperCase();
  if (code === 'COSTCO100K' || code === 'VOUCHER100K') {
    appliedVoucher = { code: code, discount: 100000 };
    saveCart();
    statusMsg.style.display = 'block';
    statusMsg.style.color = '#16a34a';
    statusMsg.innerHTML = '✅ Đã áp dụng mã <strong>' + code + '</strong>: Giảm ngay 100.000đ!';
    renderCart();
  } else if (code === 'COSTCO50K' || code === 'VOUCHER50K') {
    appliedVoucher = { code: code, discount: 50000 };
    saveCart();
    statusMsg.style.display = 'block';
    statusMsg.style.color = '#16a34a';
    statusMsg.innerHTML = '✅ Đã áp dụng mã <strong>' + code + '</strong>: Giảm ngay 50.000đ!';
    renderCart();
  } else {
    statusMsg.style.display = 'block';
    statusMsg.style.color = '#dc2626';
    statusMsg.textContent = '❌ Mã không hợp lệ hoặc đã hết hạn!';
  }
}

function handleCartOrderSubmit(event) {
  event.preventDefault();

  if (cart.length === 0) {
    alert('Giỏ hàng của bạn đang trống! Vui lòng chọn sản phẩm.');
    return;
  }

  const name = document.getElementById('cartCustomerName').value.trim();
  const phone = document.getElementById('cartCustomerPhone').value.trim();
  const email = document.getElementById('cartCustomerEmail') ? document.getElementById('cartCustomerEmail').value.trim() : '';
  const address = document.getElementById('cartCustomerAddress').value.trim();
  const note = document.getElementById('cartCustomerNote') ? document.getElementById('cartCustomerNote').value.trim() : '';

  if (!name || !phone || !address) {
    alert('Vui lòng điền đủ Họ tên, Số điện thoại và Địa chỉ giao hàng!');
    return;
  }

  const submitBtn = document.getElementById('btnCartSubmit');
  let originalHtml = '';
  if (submitBtn) {
    originalHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>⏳ Đang xử lý đặt hàng...</span>';
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discount = appliedVoucher ? appliedVoucher.discount : 0;
  const finalTotal = Math.max(0, subtotal - discount);

  const itemsDetail = cart.map((item, idx) => `${idx + 1}. ${item.name} (Số lượng: ${item.qty}) - Đơn giá: ${formatVND(item.price)}`).join('\n');
  const timestamp = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  const orderPayload = {
    "Loại form": "ĐƠN ĐẶT HÀNG TỪ GIỎ HÀNG",
    "Thời gian": timestamp,
    "Họ và tên": name,
    "Số điện thoại": phone,
    "Email": email || "Không cung cấp",
    "Địa chỉ giao hàng": address,
    "Ghi chú đơn hàng": note || "Không có",
    "Danh sách sản phẩm": itemsDetail,
    "Tạm tính": formatVND(subtotal),
    "Voucher áp dụng": appliedVoucher ? `${appliedVoucher.code} (-${formatVND(discount)})` : "Không dùng",
    "Tổng thanh toán (COD)": formatVND(finalTotal),
    "_subject": `[ĐƠN HÀNG MỚI - GIỎ HÀNG] ${name} - SĐT: ${phone} - Tổng: ${formatVND(finalTotal)}`,
    "_captcha": "false",
    "_template": "table"
  };

  // Send to FormSubmit
  fetch('https://formsubmit.co/ajax/masiehoang17@gmail.com', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(orderPayload)
  }).catch(e => console.log('Cart email error:', e));

  // Send to Google Sheets webhook if set
  if (GOOGLE_SHEET_WEBHOOK_URL) {
    fetch(GOOGLE_SHEET_WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    }).catch(e => console.log('Google Sheets error:', e));
  }

  // 1. Tự động trừ kho trong costco_products & Lưu đơn hàng vào CRM costco_orders
  try {
    let defaultProds = [
      { id: 1, name: "Kirkland Glucosamine 1500mg with MSM (375v)", type: "physical", price: 495000, stock: 16 },
      { id: 2, name: "Kirkland Wild Alaskan Fish Oil (230v)", type: "physical", price: 520000, stock: 12 },
      { id: 3, name: "Youtheory Collagen Advanced Formula (390v)", type: "physical", price: 520000, stock: 12 },
      { id: 4, name: "Schiff Move Free Ultra Triple Action (75v)", type: "physical", price: 620000, stock: 18 },
      { id: 5, name: "Natrol Biotin 10,000 mcg Maximum Strength (60v)", type: "physical", price: 280000, stock: 20 },
      { id: 6, name: "Trunature Ginkgo Biloba 120mg (300v)", type: "physical", price: 440000, stock: 22 },
      { id: 7, name: "Ebook Cẩm Nang Phân Biệt TPCN Mỹ Thật - Giả & Đọc Bill Costco", type: "digital", price: 0, stock: null },
      { id: 8, name: "Dịch Vụ Mua Hộ Hàng Siêu Thị Costco Mỹ Theo Yêu Cầu", type: "service", price: 50000, stock: null }
    ];

    let prods = JSON.parse(localStorage.getItem('costco_products') || 'null') || defaultProds;
    
    // Trừ kho cho từng sản phẩm trong giỏ
    cart.forEach(item => {
      const pId = parseInt((item.id || '').replace('p', ''));
      let targetP = prods.find(p => p.id === pId);
      if (!targetP) {
        const itemLower = (item.name || '').toLowerCase();
        if (itemLower.includes('biotin')) targetP = prods.find(p => p.id === 5);
        else if (itemLower.includes('glucosamine')) targetP = prods.find(p => p.id === 1);
        else if (itemLower.includes('fish oil') || itemLower.includes('dầu cá')) targetP = prods.find(p => p.id === 2);
        else if (itemLower.includes('collagen')) targetP = prods.find(p => p.id === 3);
        else if (itemLower.includes('move free')) targetP = prods.find(p => p.id === 4);
        else if (itemLower.includes('ginkgo')) targetP = prods.find(p => p.id === 6);
      }

      if (targetP && targetP.type === 'physical' && targetP.stock !== null) {
        targetP.stock = Math.max(0, parseInt(targetP.stock) - (item.qty || 1));
      }
    });
    localStorage.setItem('costco_products', JSON.stringify(prods));

    // Lưu vào danh sách orders của CRM
    const orderCode = 'DH' + Math.floor(1000 + Math.random() * 9000);
    const existingOrders = JSON.parse(localStorage.getItem('costco_orders') || '[]');
    existingOrders.unshift({
      id: orderCode,
      order_id: orderCode,
      customer_name: name,
      customer_phone: phone,
      customer_address: address,
      product_name: cart.map(i => `${i.name} (x${i.qty})`).join(', '),
      product_type: 'physical',
      amount: finalTotal,
      status: 'pending',
      stock_deducted: true,
      created_at: timestamp
    });
    localStorage.setItem('costco_orders', JSON.stringify(existingOrders));
  } catch (err) {
    console.error('CRM Stock update error:', err);
  }

  setTimeout(() => {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;
    }

    closeCart();
    // Clear cart
    cart = [];
    appliedVoucher = null;
    saveCart();
    updateCartBadges();
    renderCart();

    // Show Success Modal
    showOrderSuccessModal(name, phone, finalTotal, address);
  }, 600);
}

function checkoutWithVietQR(e) {
  if (e) e.preventDefault();

  if (!cart || cart.length === 0) {
    alert('Giỏ hàng của bạn đang trống! Hãy chọn sản phẩm trước khi thanh toán nhée.');
    return;
  }

  // Lấy thông tin khách hàng đã nhập (nếu có)
  const name = document.getElementById('cartCustomerName') ? document.getElementById('cartCustomerName').value.trim() : '';
  const phone = document.getElementById('cartCustomerPhone') ? document.getElementById('cartCustomerPhone').value.trim() : '';
  const address = document.getElementById('cartCustomerAddress') ? document.getElementById('cartCustomerAddress').value.trim() : '';
  const note = document.getElementById('cartCustomerNote') ? document.getElementById('cartCustomerNote').value.trim() : '';

  // Tính toán chính xác tổng tiền sau khi áp voucher
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discount = appliedVoucher ? appliedVoucher.discount : 0;
  const finalTotal = Math.max(0, subtotal - discount);

  // Danh sách tên sản phẩm
  const productNames = cart.map(i => `${i.name} (x${i.qty})`).join(', ');

  // Lưu dữ liệu giỏ hàng vào localStorage để trang thanh toán đọc
  const checkoutPayload = {
    name: name,
    phone: phone,
    address: address,
    note: note,
    amount: finalTotal,
    product: productNames,
    cartItems: cart,
    discount: discount,
    voucher: appliedVoucher ? appliedVoucher.code : ''
  };
  localStorage.setItem('costco_checkout_data', JSON.stringify(checkoutPayload));

  // Tạo URL Parameters an toàn để chuyển sang thanh-toan.html
  const params = new URLSearchParams();
  params.set('amount', finalTotal);
  if (name) params.set('name', name);
  if (phone) params.set('phone', phone);
  if (address) params.set('address', address);
  params.set('product', productNames);

  // Chuyển hướng người dùng sang cổng thanh toán VietQR
  window.location.href = `thanh-toan.html?${params.toString()}`;
}

function orderViaZalo() {
  if (cart.length === 0) {
    alert('Giỏ hàng trống! Hãy thêm sản phẩm trước khi gửi đơn qua Zalo.');
    return;
  }

  const name = document.getElementById('cartCustomerName') ? document.getElementById('cartCustomerName').value.trim() : '';
  const phone = document.getElementById('cartCustomerPhone') ? document.getElementById('cartCustomerPhone').value.trim() : '';
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discount = appliedVoucher ? appliedVoucher.discount : 0;
  const total = Math.max(0, subtotal - discount);

  const itemsText = cart.map(item => `• ${item.name} x${item.qty} (${formatVND(item.price * item.qty)})`).join('%0A');
  const msg = `Chào Shop CostcoHealth USA, mình muốn đặt hàng:%0A${itemsText}%0A%0ATổng tiền: ${formatVND(total)}${appliedVoucher ? ' (Đã trừ voucher 100k)' : ''}%0ANgười nhận: ${name || 'Khách hàng'}%0ASĐT: ${phone || ''}%0ANhờ shop xác nhận đơn và gửi hàng giúp mình nhé!`;

  window.open(`https://zalo.me/0336822318?text=${msg}`, '_blank');
}

function showOrderSuccessModal(name, phone, total, address) {
  let modal = document.getElementById('orderSuccessModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'orderSuccessModal';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.82); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 100002; animation: fadeIn 0.3s ease; padding: 20px;">
      <div class="modal-card" style="background: #ffffff; border-radius: 24px; padding: 36px 32px; max-width: 500px; width: 100%; text-align: center; box-shadow: 0 25px 60px rgba(0,0,0,0.35); border: 1px solid #e2e8f0;">
        <div style="width: 70px; height: 70px; background: #dcfce7; color: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 34px; margin: 0 auto 16px auto;">🎉</div>
        <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.5rem; font-weight: 800; color: #0f2b48; margin-bottom: 8px;">Đặt Hàng Thành Công!</h3>
        <p style="font-size: 0.95rem; color: #475569; line-height: 1.6; margin-bottom: 18px;">
          Cảm ơn bạn <strong style="color: #0f2b48;">${name}</strong>!<br>
          Shop đã nhận đơn hàng trị giá <strong style="color: #dc2626;">${formatVND(total)}</strong> giao đến <strong>${address}</strong>. Dược sĩ sẽ gọi điện thoại <strong style="color: #dc2626;">${phone}</strong> trong vòng 15 phút để xác nhận và đóng gói gửi hàng sớm nhất!
        </p>
        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
          <a href="https://zalo.me/0336822318" target="_blank" style="background: #0068ff; color: #ffffff; padding: 12px 24px; border-radius: 9999px; font-weight: 700; font-size: 0.92rem; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
            <span>💬 Nhắn Zalo Shop Ngay</span>
          </a>
          <button onclick="document.getElementById('orderSuccessModal').style.display='none'" style="background: #0f2b48; color: #ffffff; border: none; padding: 12px 26px; border-radius: 9999px; font-weight: 700; font-size: 0.92rem; cursor: pointer;">
            Đã Hiểu
          </button>
        </div>
      </div>
    </div>
  `;
  modal.style.display = 'block';
}

function showToast(message) {
  const toast = document.getElementById('cartToast');
  const msgEl = document.getElementById('cartToastMsg');
  if (toast && msgEl) {
    msgEl.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  }
}

/* ==========================================================================
   2. PRODUCT FILTER TABS
   ========================================================================== */
function filterProducts(category, btnElement) {
  // Update active tab button
  document.querySelectorAll('.filter-tab-btn').forEach(btn => btn.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');

  // Filter cards
  const cards = document.querySelectorAll('.product-card');
  cards.forEach(card => {
    const cardCat = card.getAttribute('data-category');
    if (category === 'all' || cardCat === category) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  renderCart();
  updateCartBadges();
});

/* ==========================================================================
   3. SURVEY FORM & GOOGLE FORM TAB LOGIC
   ========================================================================== */
function switchSurveyMode(mode) {
  const nativeWrap = document.getElementById('nativeFormWrapper');
  const googleWrap = document.getElementById('googleFormEmbedContainer');
  const btnNative = document.getElementById('btnModeNative');
  const btnGoogle = document.getElementById('btnModeGoogle');

  if (mode === 'google') {
    if (nativeWrap) nativeWrap.style.display = 'none';
    if (googleWrap) googleWrap.style.display = 'block';
    if (btnNative) btnNative.classList.remove('active');
    if (btnGoogle) btnGoogle.classList.add('active');
  } else {
    if (nativeWrap) nativeWrap.style.display = 'block';
    if (googleWrap) googleWrap.style.display = 'none';
    if (btnNative) btnNative.classList.add('active');
    if (btnGoogle) btnGoogle.classList.remove('active');
  }
}

function selectProduct(productName) {
  const customerNote = document.getElementById('customerNote');
  if (customerNote) {
    customerNote.value = `Tôi muốn đặt mua / nhận tư vấn về sản phẩm: ${productName}`;
  }

  const tpcnCheckbox = document.querySelector('input[name="productCategories"][value*="Thực phẩm chức năng"]');
  if (tpcnCheckbox) {
    tpcnCheckbox.checked = true;
  }

  const surveySection = document.getElementById('lien-he');
  if (surveySection) {
    const headerOffset = 80;
    const elementPosition = surveySection.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
  }

  setTimeout(() => {
    const nameInput = document.getElementById('fullName');
    if (nameInput) nameInput.focus();
  }, 600);
}

function handleFormSubmit(event) {
  event.preventDefault();

  const formEl = event.target;
  const fullName = document.getElementById('fullName') ? document.getElementById('fullName').value.trim() : '';
  const phoneNumber = document.getElementById('phoneNumber') ? document.getElementById('phoneNumber').value.trim() : '';
  const email = document.getElementById('email') ? document.getElementById('email').value.trim() : '';
  const customerNote = document.getElementById('customerNote') ? document.getElementById('customerNote').value.trim() : '';

  const categoryEls = document.querySelectorAll('input[name="productCategories"]:checked');
  const selectedCategories = Array.from(categoryEls).map(el => el.value);
  const categoriesText = selectedCategories.length > 0 ? selectedCategories.join('; ') : 'Chưa chọn';

  const priorityEl = document.querySelector('input[name="mainPriority"]:checked');
  const mainPriority = priorityEl ? priorityEl.value : 'Chưa chọn';

  const zaloNoticeEl = document.querySelector('input[name="zaloNotice"]:checked');
  const zaloNotice = zaloNoticeEl ? zaloNoticeEl.value : 'Chưa chọn';

  if (!fullName || !phoneNumber || !email) {
    alert('Vui lòng điền đầy đủ Họ tên, Số điện thoại và Email để shop gửi Voucher 100k và cẩm nang!');
    return;
  }

  // Validate định dạng Email chuẩn quốc tế
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    alert('Địa chỉ email không hợp lệ! Vui lòng kiểm tra lại định dạng email (ví dụ: hoten@gmail.com).');
    const emailInput = document.getElementById('email');
    if (emailInput) emailInput.focus();
    return;
  }

  // Validate định dạng Số điện thoại Việt Nam (10 số, đầu 03, 05, 07, 08, 09 hoặc +84)
  const cleanPhone = phoneNumber.replace(/[\s.-]/g, '');
  const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
  if (!phoneRegex.test(cleanPhone)) {
    alert('Số điện thoại không hợp lệ! Vui lòng nhập đúng số điện thoại di động Việt Nam (10 chữ số, ví dụ: 0912345678 hoặc 0336822318).');
    const phoneInput = document.getElementById('phoneNumber');
    if (phoneInput) phoneInput.focus();
    return;
  }

  const submitBtn = document.getElementById('submitBtn');
  let originalBtnHtml = '';
  if (submitBtn) {
    originalBtnHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>⏳ Đang gửi dữ liệu khảo sát...</span>';
  }

  const timestamp = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const surveyPayload = {
    "Thời gian": timestamp,
    "Câu 1 - Họ tên": fullName,
    "Câu 2 - SĐT/Zalo": phoneNumber,
    "Câu 3 - Email": email,
    "Câu 4 - Nhóm hàng quan tâm": categoriesText,
    "Câu 5 - Ưu tiên hàng đầu": mainPriority,
    "Câu 6 - Nhận tin săn sale Zalo": zaloNotice,
    "Ghi chú thêm": customerNote || "Không có",
    "Mã Voucher": "COSTCO100K",
    "_subject": `[KHẢO SÁT HÀNG MỸ MỚI] ${fullName} - Email: ${email} - SĐT: ${phoneNumber}`,
    "_captcha": "false",
    "_template": "table"
  };

  // Lưu khách hàng mới vào CRM (localStorage costco_customers)
  try {
    const rawCusts = localStorage.getItem('costco_customers');
    let localCusts = rawCusts ? JSON.parse(rawCusts) : [];
    const newId = localCusts.length > 0 ? Math.max(...localCusts.map(c => c.id || 0)) + 1 : 1;
    localCusts.unshift({
      id: newId,
      name: fullName,
      phone: phoneNumber,
      email: email,
      zalo: phoneNumber,
      product: categoriesText,
      registered_at: timestamp
    });
    localStorage.setItem('costco_customers', JSON.stringify(localCusts));
  } catch (e) {
    console.error('Lỗi lưu khách hàng vào local CRM:', e);
  }

  // Kích hoạt gửi chuỗi Email Sequence tự động qua Resend API (hỗ trợ chế độ +test)
  const isTestMode = email.includes('+test');
  fetch('/api/send-sequence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: fullName,
      email: email,
      phone: phoneNumber,
      category: categoriesText,
      testMode: isTestMode
    })
  })
  .then(res => res.json())
  .then(data => console.log('Resend sequence status:', data))
  .catch(err => console.error('Lỗi trigger Resend sequence:', err));

  if (GOOGLE_SHEET_WEBHOOK_URL) {
    fetch(GOOGLE_SHEET_WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(surveyPayload)
    }).catch(err => console.log('Google Sheets submit status:', err));
  }

  fetch('https://formsubmit.co/ajax/masiehoang17@gmail.com', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(surveyPayload)
  })
  .then(res => res.json())
  .catch(err => console.log('FormSubmit error:', err))
  .finally(() => {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHtml;
    }
    showSuccessModal(fullName, phoneNumber, categoriesText);
    formEl.reset();
  });
}

function showSuccessModal(name, phone, categories) {
  let modal = document.getElementById('successModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'successModal';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.82); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 99999; animation: fadeIn 0.3s ease; padding: 20px;">
      <div class="modal-card" style="background: #ffffff; border-radius: 24px; padding: 36px 32px; max-width: 520px; width: 100%; text-align: center; box-shadow: 0 25px 60px rgba(0,0,0,0.35); border: 1px solid #e2e8f0; position: relative;">
        <div style="width: 72px; height: 72px; background: #ecfdf5; color: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 34px; margin: 0 auto 16px auto;">🎉</div>
        <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.55rem; font-weight: 800; color: #0f2b48; margin-bottom: 8px;">Cảm Ơn Anh/Chị Đã Hoàn Thành Khảo Sát!</h3>
        <p style="font-size: 0.95rem; color: #475569; line-height: 1.6; margin-bottom: 20px;">
          Shop đã tiếp nhận câu trả lời của <strong>${name}</strong>. Dược sĩ sẽ liên hệ qua Zalo <strong style="color: #dc2626;">${phone}</strong> để tư vấn theo đúng nhu cầu.
        </p>
        <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 2px dashed #f59e0b; border-radius: 16px; padding: 18px 20px; margin-bottom: 24px;">
          <div style="font-size: 0.82rem; font-weight: 800; color: #b45309; text-transform: uppercase; margin-bottom: 4px;">MÃ VOUCHER DÀNH RIÊNG CHO ANH/CHỊ:</div>
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.8rem; font-weight: 900; color: #dc2626; letter-spacing: 2px; margin-bottom: 6px;">COSTCO100K</div>
          <div style="font-size: 0.86rem; color: #78350f;">Giảm ngay <strong>100.000đ</strong> khi thêm vào Giỏ hàng hoặc đặt mua!</div>
        </div>
        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <button onclick="closeSuccessModal(); openCart();" style="background: #dc2626; color: #ffffff; border: none; padding: 12px 24px; border-radius: 9999px; font-weight: 700; font-size: 0.95rem; cursor: pointer;">
            🛒 Dùng Mã Mua Ngay
          </button>
          <a href="https://zalo.me/0336822318" target="_blank" style="background: #0068ff; color: #ffffff; padding: 12px 24px; border-radius: 9999px; font-weight: 700; font-size: 0.95rem; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
            <span>💬 Nhắn Zalo Shop</span>
          </a>
        </div>
      </div>
    </div>
  `;
  modal.style.display = 'block';
}

function closeSuccessModal() {
  const modal = document.getElementById('successModal');
  if (modal) modal.style.display = 'none';
}

/* ==========================================================================
   13. AI SALES CHATBOT ENGINE (SALES_SCRIPT.MD INTEGRATION)
   ========================================================================== */

let chatHistory = [];
let isChatbotInitialized = false;

function initChatbot() {
  if (isChatbotInitialized) return;
  isChatbotInitialized = true;

  const currentHour = new Date().getHours();
  let welcomeGreeting = '';

  if (currentHour >= 20 || currentHour < 6) {
    welcomeGreeting = `Chào bạn, buổi tối thảnh thơi nhée! 
Mình là trợ lý tự động của CostcoHealth USA. 
Đơn giản thôi, bạn cứ để lại thắc mắc hoặc tình trạng sức khỏe đang quan tâm (xương khớp, mất ngủ, rụng tóc hay mỏi mắt...), mình sẽ phản hồi ngay và gửi tặng bạn mã Voucher 100k cho chuyến hàng bay Air đợt này nhée!`;
  } else {
    welcomeGreeting = `Chào bạn nhée! 
Thật ra, mua thực phẩm chức năng sợ nhất là gặp phải hàng giả hoặc hàng đi tàu biển nóng biến chất. 
Đồ bên mình là 100% người nhà tự tay vào quầy siêu thị Costco Mỹ mua, gửi máy bay (bay Air) về kèm hóa đơn gốc đàng hoàng. 
Bạn đang cần tìm sản phẩm bổ khớp cho bố mẹ, sáng mắt giảm mỡ máu hay chăm sóc da tóc? Nhắn mình tư vấn đúng loại cho nhée!`;
  }

  appendBotMessage(welcomeGreeting);

  // Hiển thị hint bubble sau 2 giây nếu khách chưa mở chat
  setTimeout(() => {
    const hint = document.getElementById('chatbotHintBubble');
    const win = document.getElementById('chatbotWindow');
    if (hint && win && !win.classList.contains('active')) {
      hint.style.display = 'flex';
    }
  }, 2000);
}

function toggleChatbot() {
  const chatWin = document.getElementById('chatbotWindow');
  const toggleBtn = document.getElementById('chatbotToggleBtn');
  const hint = document.getElementById('chatbotHintBubble');

  if (!chatWin) return;

  const isOpen = chatWin.classList.toggle('active');
  if (toggleBtn) toggleBtn.classList.toggle('open', isOpen);
  if (hint) hint.style.display = 'none';

  if (isOpen) {
    initChatbot();
    scrollChatToBottom();
    setTimeout(() => {
      const input = document.getElementById('chatInput');
      if (input) input.focus();
    }, 200);
  }
}

function closeChatbotHint() {
  const hint = document.getElementById('chatbotHintBubble');
  if (hint) hint.style.display = 'none';
}

function closeChatbotAndScroll(selector) {
  const chatWin = document.getElementById('chatbotWindow');
  const toggleBtn = document.getElementById('chatbotToggleBtn');
  if (chatWin) chatWin.classList.remove('active');
  if (toggleBtn) toggleBtn.classList.remove('open');

  const targetEl = document.querySelector(selector);
  if (targetEl) {
    const headerOffset = 70;
    const elementPosition = targetEl.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
}

function openCartFromChat() {
  const chatWin = document.getElementById('chatbotWindow');
  const toggleBtn = document.getElementById('chatbotToggleBtn');
  if (chatWin) chatWin.classList.remove('active');
  if (toggleBtn) toggleBtn.classList.remove('open');
  if (typeof openCart === 'function') openCart();
}

function handleChipClick(chipText) {
  sendChatMessage(chipText);
}

function scrollChatToBottom() {
  const msgBox = document.getElementById('chatbotMessages');
  if (msgBox) {
    setTimeout(() => {
      msgBox.scrollTop = msgBox.scrollHeight;
    }, 50);
  }
}

function appendUserMessage(text) {
  const msgBox = document.getElementById('chatbotMessages');
  if (!msgBox) return;

  const msgEl = document.createElement('div');
  msgEl.className = 'chat-msg user';
  msgEl.innerHTML = `
    <div class="chat-bubble">${escapeHtml(text)}</div>
  `;
  msgBox.appendChild(msgEl);
  scrollChatToBottom();
}

function appendBotMessage(text, actionsHtml = '') {
  const msgBox = document.getElementById('chatbotMessages');
  if (!msgBox) return;

  const msgEl = document.createElement('div');
  msgEl.className = 'chat-msg bot';
  msgEl.innerHTML = `
    <div class="chat-msg-avatar">👩‍⚕️</div>
    <div class="chat-bubble">
      <div>${formatChatMessage(text)}</div>
      ${actionsHtml ? `<div class="chat-actions-container">${actionsHtml}</div>` : ''}
    </div>
  `;
  msgBox.appendChild(msgEl);
  scrollChatToBottom();
}

function showTypingIndicator() {
  const msgBox = document.getElementById('chatbotMessages');
  if (!msgBox) return null;

  const indicator = document.createElement('div');
  indicator.id = 'chatTypingIndicator';
  indicator.className = 'chat-msg bot';
  indicator.innerHTML = `
    <div class="chat-msg-avatar">👩‍⚕️</div>
    <div class="typing-indicator">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>
  `;
  msgBox.appendChild(indicator);
  scrollChatToBottom();
  return indicator;
}

function removeTypingIndicator() {
  const indicator = document.getElementById('chatTypingIndicator');
  if (indicator) indicator.remove();
}

function escapeHtml(string) {
  const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return String(string).replace(/[&<>"']/g, s => entityMap[s]);
}

function formatChatMessage(text) {
  return text
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

function sendChatMessage(overrideText) {
  const input = document.getElementById('chatInput');
  const text = (overrideText || (input ? input.value : '')).trim();

  if (!text) return;
  if (input && !overrideText) input.value = '';

  appendUserMessage(text);
  showTypingIndicator();

  // Tạo độ trễ tự nhiên (500ms) như người thật gõ phản hồi
  setTimeout(() => {
    removeTypingIndicator();
    const response = generateSalesBotResponse(text);
    appendBotMessage(response.text, response.actions);
  }, 500);
}

function generateSalesBotResponse(userMsg) {
  const query = userMsg.toLowerCase();

  // 0. GUARDRAIL AN TOÀN Y TẾ & BỆNH LÝ NỀN (Tuân thủ y tế / TPCN)
  if (
    query.includes('bệnh nền') || query.includes('thuốc điều trị') || query.includes('toa thuốc') || 
    query.includes('suy thận') || query.includes('suy gan') || query.includes('tiểu đường') || 
    query.includes('huyết áp') || query.includes('tim mạch') || query.includes('ung thư') || 
    query.includes('đang có bầu') || query.includes('mang thai') || query.includes('cho con bú') || 
    query.includes('mẹ bầu') || query.includes('uống chung với thuốc') || query.includes('tác dụng phụ') ||
    query.includes('dị ứng')
  ) {
    return {
      text: `⚠️ **Lưu ý an toàn y tế từ Dược sĩ:**
Các sản phẩm bên mình là thực phẩm bảo vệ sức khỏe (TPCN), **không phải là thuốc và không có tác dụng thay thế thuốc chữa bệnh**.

Với trường hợp có **bệnh lý nền** (tim mạch, huyết áp, suy gan/thận, tiểu đường...), **phụ nữ mang thai / cho con bú** hoặc đang uống **thuốc kê đơn**:
- Tuyệt đối không tự ý kết hợp TPCN liều cao mà nên hỏi ý kiến bác sĩ đang điều trị trực tiếp.
- Bạn vui lòng bấm nút gửi ảnh toa thuốc hoặc nhắn Zalo **0336.822.318** để Dược sĩ đối soát thành phần và chống chỉ định cẩn thận trước nhée!`,
      actions: `
        <a href="https://zalo.me/0336822318" target="_blank" class="btn-chat-cta-cart">🩺 Nhắn Zalo Dược Sĩ Xem Toa Thuốc (0336.822.318)</a>
        <a href="#lien-he" onclick="closeChatbotAndScroll('#lien-he')" class="btn-chat-cta-form">📋 Để Lại Số ĐT Nhận Tư Vấn Chuyên Sâu</a>
      `
    };
  }

  // 1. Mua hàng / Chốt đơn
  if (query.includes('mua') || query.includes('đặt') || query.includes('order') || query.includes('chốt') || query.includes('lấy cho tôi') || query.includes('ship cho tôi')) {
    return {
      text: `Dạ tuyệt vời quá bạn nhée!
Đợt này bên mình đang gom chuyến bay Air hỏa tốc trực tiếp từ siêu thị Costco Mỹ về. 
Mình tặng bạn ngay mã **Voucher 100.000đ** trừ thẳng vào đơn hàng và **Freeship 100% tận nhà**!

Đơn giản thôi, bạn bấm vào nút dưới để điền thông tin vào form danh sách chờ, hoặc mở giỏ hàng đặt nhanh nhée!`,
      actions: `
        <a href="#lien-he" onclick="closeChatbotAndScroll('#lien-he')" class="btn-chat-cta-form">🎁 Điền Form Nhận Voucher 100k Ngay</a>
        <button type="button" onclick="openCartFromChat()" class="btn-chat-cta-cart">🛒 Mở Giỏ Hàng Đặt Mua</button>
      `
    };
  }

  // 2. Chần chừ / Cần hỏi người nhà / Bác sĩ (Kịch bản Nurturing phần 4)
  if (query.includes('nghĩ') || query.includes('xem thêm') || query.includes('hỏi') || query.includes('người nhà') || query.includes('bác sĩ') || query.includes('chưa') || query.includes('sau')) {
    return {
      text: `Dạ không sao bạn nhée! Đồ uống bảo vệ sức khỏe thì cứ cẩn thận hỏi ý kiến bố mẹ hoặc bác sĩ cho thật yên tâm đã.

Tiện đây bên mình có form khảo sát nhanh 5 câu, mất chưa tới 45 giây để điền. Bạn điền giúp mình để hệ thống tự động lưu mã **Voucher 100k** theo số điện thoại của bạn trong 48 giờ nhée! Khi nào bạn hỏi xong muốn đặt là được giảm ngay:`,
      actions: `
        <a href="#lien-he" onclick="closeChatbotAndScroll('#lien-he')" class="btn-chat-cta-form">🎁 Bấm Vào Đây Để Điền Form & Giữ Voucher 100k</a>
      `
    };
  }

  // 3. Xương khớp cho bố mẹ / Glucosamine / Move Free
  if (query.includes('khớp') || query.includes('gối') || query.includes('lục cục') || query.includes('lạo xạo') || query.includes('glucosamine') || query.includes('move free') || query.includes('sụn') || query.includes('bố mẹ') || query.includes('ông bà')) {
    return {
      text: `Trường hợp của bác là bị thoái hóa khớp và khô dịch khớp tuổi già rồi bạn nhé. Bạn nên chọn 1 trong 2 loại chuẩn Costco này:

1. **Kirkland Glucosamine 1500mg with MSM (Lọ to 375 viên - 595.000đ):** Dòng bổ khớp quốc dân đạt chuẩn Dược điển Mỹ USP Verified. Bác uống 2 viên/ngày sau ăn no. Tầm 3–4 tuần là đầu gối bớt lạo xạo, đi lại lên cầu thang êm ru. Một lọ uống được tận 6 tháng.
2. **Schiff Move Free Ultra (Lọ 75 viên - 720.000đ):** Nếu bác sợ nuốt viên to hoặc có tiền sử dạ dày thì chọn loại này. Viên bé xíu như hạt đậu, mỗi ngày chỉ 1 viên duy nhất, giảm đau nhanh sau 10–14 ngày.

Đợt này có Voucher 100k và Freeship cho bạn nhée!`,
      actions: `
        <a href="#lien-he" onclick="closeChatbotAndScroll('#lien-he')" class="btn-chat-cta-form">🎁 Nhận Voucher 100k Đặt Cho Bố Mẹ</a>
        <button type="button" onclick="addToCart('p1', 'Kirkland Glucosamine 1500mg (375v)', 595000, 680000, 'product1.jpg'); openCartFromChat();" class="btn-chat-cta-cart">🛒 Thêm Glucosamine (595k) Vào Giỏ</button>
      `
    };
  }

  // 4. Giá cả / So sánh Shopee / Lazada / Đắt
  if (query.includes('giá') || query.includes('shopee') || query.includes('lazada') || query.includes('tiktok') || query.includes('đắt') || query.includes('400k') || query.includes('nhiêu')) {
    return {
      text: `Dạ mới nhìn qua thì ai cũng thấy băn khoăn về giá cả. Nhưng thật ra thế này bạn nè:

Một lọ Glucosamine nặng gần 0.8kg, giá niêm yết trên kệ siêu thị Costco bên Mỹ đã tầm $17 - $19 USD (gần 500.000đ tiền vốn mua tại quầy rồi). 
Nếu nơi nào bán 400k thì chắc chắn là hàng container đường biển nằm hầm tàu nóng 50–60°C cả 2 tháng làm chảy dầu biến chất, hoặc hàng gom cận date dập lại.

Bên mình 100% bay Air giữ lạnh, có hóa đơn giấy in rõ ngày giờ mua tại quầy Mỹ kèm theo. Nhận hàng bạn được mở hộp kiểm tra đúng bill mới thanh toán. 
Đợt này áp mã Voucher 100k từ khảo sát thì giá chỉ còn **495.000đ** kèm Freeship tận nhà luôn nhée!`,
      actions: `
        <a href="#lien-he" onclick="closeChatbotAndScroll('#lien-he')" class="btn-chat-cta-form">🎁 Điền Form Nhận Voucher 100k Giảm Còn 495k</a>
      `
    };
  }

  // 5. Check bill / Hóa đơn thật / Giả / Fake / Uy tín
  if (query.includes('bill') || query.includes('hóa đơn') || query.includes('thật') || query.includes('giả') || query.includes('fake') || query.includes('lừa') || query.includes('chính hãng') || query.includes('receipt')) {
    return {
      text: `Thật ra, đồ uống vào cơ thể thì cẩn thận như bạn là hoàn toàn chuẩn xác. Đơn giản thôi, bạn có thể kiểm tra 3 điểm bảo chứng này:

1. **Hóa đơn giấy Costco gốc:** In rõ ngày giờ mua tại quầy bên Mỹ, mã thẻ hội viên chính chủ và mã mặt hàng (Item #) khớp từng con số với mã vạch trên lọ thuốc.
2. **Chất giấy in nhiệt độc quyền:** Mặt sau có logo chìm Costco Wholesale, miết móng tay mạnh sẽ tạo vệt xám nhiệt hóa học đặc trưng không thể photoshop.
3. **Đồng kiểm tận tay:** Shipper giao tới, bạn được mở thùng ra kiểm tra hóa đơn và màng seal nắp hộp trước khi thanh toán. Phát hiện hàng giả, bên mình đền tiền gấp 10 lần ngay lập tức nhée!`,
      actions: `
        <a href="#lien-he" onclick="closeChatbotAndScroll('#lien-he')" class="btn-chat-cta-form">🎁 Đăng Ký Chuyến Bay Air Kèm Bill Gốc</a>
      `
    };
  }

  // 6. Dầu cá / Mắt / Tanh / Alaska
  if (query.includes('dầu cá') || query.includes('cá hồi') || query.includes('tanh') || query.includes('mắt') || query.includes('mỡ máu') || query.includes('omega') || query.includes('alaska')) {
    return {
      text: `Hoàn toàn không tanh ợ ngược bạn nhée!

Lọ **Kirkland Wild Alaskan Fish Oil (230 viên - 620.000đ)** bên mình chiết xuất từ cá hoang dã vùng biển lạnh Alaska, ép lạnh giữ nguyên dinh dưỡng. Hàng chuyển máy bay khoang mát nên viên nang vàng óng trong suốt, uống sau ăn trưa êm ru, không tanh nồng cuống họng. 

Dân văn phòng hay người làm việc máy tính nhiều dùng loại này tầm 1–2 tuần là mắt dịu hẳn, giảm mỏi rát rõ rệt. Lọ 230 viên dùng được gần 8 tháng!`,
      actions: `
        <button type="button" onclick="addToCart('p2', 'Kirkland Wild Alaskan Fish Oil (230v)', 620000, 710000, 'product2.jpg'); openCartFromChat();" class="btn-chat-cta-cart">🛒 Thêm Dầu Cá Alaska (620k) Vào Giỏ</button>
      `
    };
  }

  // 7. Collagen / Da / Nóng / Mụn / Youtheory
  if (query.includes('collagen') || query.includes('da') || query.includes('nóng') || query.includes('mụn') || query.includes('nám') || query.includes('sạm') || query.includes('youtheory')) {
    return {
      text: `Không hề bị nóng nếu bạn dùng đúng cách nhée!

**Youtheory Collagen Advanced (Lọ 390 viên - 620.000đ)** bổ sung Collagen Type 1, 2, 3 kết hợp Vitamin C và Biotin giúp căng mịn da và mờ nám. 
Đơn giản thôi: Mỗi ngày bạn chỉ cần uống đủ 1.5L – 2L nước lọc, collagen sẽ chuyển hóa êm ru, da dẻ mịn màng sáng khỏe mà không lo nổi mụn hay tăng cân gì cả. Đợt này date xa tận 2028 lận nhée!`,
      actions: `
        <button type="button" onclick="addToCart('p3', 'Youtheory Collagen Advanced (390v)', 620000, 790000, 'product3.jpg'); openCartFromChat();" class="btn-chat-cta-cart">🛒 Thêm Collagen Youtheory (620k) Vào Giỏ</button>
      `
    };
  }

  // 8. Rụng tóc / Mọc tóc / Móng / Biotin
  if (query.includes('tóc') || query.includes('rụng') || query.includes('biotin') || query.includes('móng') || query.includes('hói')) {
    return {
      text: `Bạn dùng ngay **Natrol Biotin 10,000 mcg (60 viên - 380.000đ)** nhée!

Loại này có công nghệ ngậm tan nhanh trong miệng sau 30 giây, vị dâu thơm ngon như kẹo, không cần dùng nước. Hàm lượng cao 10.000 mcg kích thích chân tóc mọc tua tủa, dứt điểm rụng tóc sau sinh và phục hồi móng tay yếu gãy sau 3–4 tuần!`,
      actions: `
        <button type="button" onclick="addToCart('p5', 'Natrol Biotin 10,000 mcg (60v)', 380000, 450000, 'product5.jpg'); openCartFromChat();" class="btn-chat-cta-cart">🛒 Thêm Natrol Biotin (380k) Vào Giỏ</button>
      `
    };
  }

  // 9. Bổ não / Trí nhớ / Tiền đình / Mất ngủ / Chóng mặt
  if (query.includes('não') || query.includes('tiền đình') || query.includes('chóng mặt') || query.includes('mất ngủ') || query.includes('ngủ') || query.includes('hoa mắt') || query.includes('ginkgo') || query.includes('đầu')) {
    return {
      text: `Triệu chứng này là do máu lên não kém và rối loạn tiền đình bạn nhé.

Bạn dùng **Trunature Ginkgo Biloba 120mg (Lọ to 300 viên - 540.000đ)**:
Chiết xuất bạch quả tiêu chuẩn hóa giúp tăng tuần hoàn não, dứt điểm hoa mắt chóng mặt sau 7–10 ngày, đêm ngủ một mạch tới sáng không trằn trọc. Lọ 300 viên uống được tới 5 tháng liên tục!`,
      actions: `
        <button type="button" onclick="addToCart('p6', 'Trunature Ginkgo Biloba 120mg (300v)', 540000, 630000, 'product6.jpg'); openCartFromChat();" class="btn-chat-cta-cart">🛒 Thêm Ginkgo Biloba (540k) Vào Giỏ</button>
      `
    };
  }

  // 10. Vận chuyển / Phí ship / Thời gian giao
  if (query.includes('ship') || query.includes('vận chuyển') || query.includes('tỉnh') || query.includes('bao lâu') || query.includes('giao')) {
    return {
      text: `Thời gian giao hàng cực nhanh và an toàn nhée:
- **Hà Nội & TP.HCM:** Nhận trong ngày hoặc sau 24h.
- **Tỉnh khác:** Nhận sau 2–3 ngày qua Viettel Post/GHTK, đóng thùng 3 lớp chống sốc chắc chắn.
- **Freeship 100%:** Áp dụng cho đơn từ 2 lọ hoặc khi bạn có Voucher từ bài khảo sát nhée!`,
      actions: `
        <a href="#lien-he" onclick="closeChatbotAndScroll('#lien-he')" class="btn-chat-cta-form">🎁 Điền Khảo Sát Nhận Freeship & Voucher 100k</a>
      `
    };
  }

  // 11. Voucher / Ưu đãi / Khuyến mãi
  if (query.includes('voucher') || query.includes('mã') || query.includes('khuyến mãi') || query.includes('giảm giá')) {
    return {
      text: `Bên mình đang có chương trình tặng mã **Voucher 100.000đ** cho khách điền bảng khảo sát nhu cầu hàng Mỹ (chỉ mất 45 giây).
Điền xong là bạn nhận ngay mã \`COSTCO100K\` để trừ thẳng vào đơn hàng đợt này nhée!`,
      actions: `
        <a href="#lien-he" onclick="closeChatbotAndScroll('#lien-he')" class="btn-chat-cta-form">🎁 Bấm Vào Đây Điền Form Lấy Voucher 100k</a>
      `
    };
  }

  // Mặc định: Trả lời thân tình và hướng dẫn điền form / chat Zalo
  return {
    text: `Dạ mình đã ghi nhận câu hỏi của bạn nhée! 
Thật ra đồ xách tay bay Air giữ lạnh từ Costco Mỹ bên mình mỗi tuần về số lượng có hạn để đảm bảo date mới tinh 2027–2028.

Bạn có thể bấm vào nút dưới để điền form danh sách chờ nhận ngay **Voucher 100k**, hoặc nhắn qua Zalo **0336.822.318** để dược sĩ bên mình hỗ trợ trực tiếp ngay nhé!`,
    actions: `
      <a href="#lien-he" onclick="closeChatbotAndScroll('#lien-he')" class="btn-chat-cta-form">🎁 Điền Form Nhận Ngay Voucher 100k</a>
      <a href="https://zalo.me/0336822318" target="_blank" class="btn-chat-cta-cart">💬 Nhắn Zalo Dược Sĩ (0336.822.318)</a>
    `
  };
}

// Khởi tạo Chatbot tự động khi load trang
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initChatbot, 1000);
});



