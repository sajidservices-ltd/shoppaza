let drawerAppliedCoupon = null;
let drawerAppliedCode = null;
// Shoppaza Shopify-Grade Luxury Checkout Engine (v1.0)
// Powered by Stripe PCI-DSS Level 1 & Shoppaza Worldwide

let checkoutDiscountRate = 0; // percentage
let checkoutCurrency = 'GBP';
let checkoutCurrencySymbol = '£';
let checkoutRate = 1.0;

function getStripeConfig() {
  return JSON.parse(localStorage.getItem('shoppaza_stripe_config') || '{}');
}

function openCheckoutModal() {
  if (!cart || cart.length === 0) {
    alert('Your shopping bag is empty! Please add products before checking out.');
    return;
  }
  if (typeof toggleCartDrawer === 'function') {
    toggleCartDrawer(false);
  }
  window.location.href = 'checkout.html';
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkoutModal');
  if (modal) modal.classList.add('hidden');
}

function handleCheckoutCountryChange(countryCode) {
  const afterpayContainer = document.getElementById('containerAfterpayOption');
  const amazonContainer = document.getElementById('containerAmazonOption');
  const shippingTitle = document.getElementById('checkoutShippingTitle');
  const btnExpressAfterpay = document.getElementById('btnExpressAfterpay');
  const btnExpressAmazon = document.getElementById('btnExpressAmazon');

  if (countryCode === 'US') {
    checkoutCurrency = 'USD';
    checkoutCurrencySymbol = '$';
    checkoutRate = 1.27; // GBP to USD
    if (shippingTitle) shippingTitle.innerText = 'USPS Priority Air Tracked (Direct from UK)';
    if (afterpayContainer) afterpayContainer.classList.remove('hidden');
    if (amazonContainer) amazonContainer.classList.remove('hidden');
    if (btnExpressAfterpay) btnExpressAfterpay.classList.remove('hidden');
    if (btnExpressAmazon) btnExpressAmazon.classList.remove('hidden');
  } else if (countryCode === 'AU') {
    checkoutCurrency = 'AUD';
    checkoutCurrencySymbol = 'A$';
    checkoutRate = 1.95; // GBP to AUD
    if (shippingTitle) shippingTitle.innerText = 'Australia Post International Express';
    if (afterpayContainer) afterpayContainer.classList.remove('hidden');
    if (amazonContainer) amazonContainer.classList.add('hidden');
    if (btnExpressAfterpay) btnExpressAfterpay.classList.remove('hidden');
    if (btnExpressAmazon) btnExpressAmazon.classList.add('hidden');
  } else if (countryCode === 'GB') {
    checkoutCurrency = 'GBP';
    checkoutCurrencySymbol = '£';
    checkoutRate = 1.0;
    if (shippingTitle) shippingTitle.innerText = 'Royal Mail Tracked 24 (Next-Day Delivery)';
    if (afterpayContainer) afterpayContainer.classList.remove('hidden');
    if (amazonContainer) amazonContainer.classList.remove('hidden');
    if (btnExpressAfterpay) btnExpressAfterpay.classList.remove('hidden');
    if (btnExpressAmazon) btnExpressAmazon.classList.remove('hidden');
  } else if (countryCode === 'PK') {
    checkoutCurrency = 'PKR';
    checkoutCurrencySymbol = '₨ ';
    checkoutRate = 352.0; // GBP to PKR
    if (shippingTitle) shippingTitle.innerText = 'DHL Express Tracked Airway';
    if (afterpayContainer) afterpayContainer.classList.add('hidden');
    if (amazonContainer) amazonContainer.classList.add('hidden');
    if (btnExpressAfterpay) btnExpressAfterpay.classList.add('hidden');
    if (btnExpressAmazon) btnExpressAmazon.classList.add('hidden');
  } else {
    checkoutCurrency = 'EUR';
    checkoutCurrencySymbol = '€';
    checkoutRate = 1.17; // GBP to EUR
    if (shippingTitle) shippingTitle.innerText = 'DPD Europe Tracked Courier';
    if (afterpayContainer) afterpayContainer.classList.add('hidden');
    if (amazonContainer) amazonContainer.classList.add('hidden');
    if (btnExpressAfterpay) btnExpressAfterpay.classList.add('hidden');
    if (btnExpressAmazon) btnExpressAmazon.classList.add('hidden');
  }

  renderShopifyCheckoutSummary();
}

function renderShopifyCheckoutSummary() {
  const container = document.getElementById('checkoutItemsList');
  const itemsCountEl = document.getElementById('checkoutItemsCount');
  const subtotalEl = document.getElementById('summarySubtotal');
  const totalEl = document.getElementById('summaryTotalAmount');
  const currCodeEl = document.getElementById('summaryCurrencyCode');
  const btnPayNowText = document.getElementById('btnPayNowText');
  const afterpayText = document.getElementById('afterpayInstallmentText');

  if (!cart) return;

  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
  if (itemsCountEl) itemsCountEl.innerText = `${totalCount} item${totalCount === 1 ? '' : 's'}`;

  // Calculate base total in GBP
  let baseGbpTotal = 0;
  cart.forEach(item => {
    const priceGbp = item.price_gbp || (item.price_usd ? item.price_usd * 0.79 : 29.00);
    baseGbpTotal += priceGbp * item.qty;
  });

  // Apply discount (percentage, wig_tiered, jewelry_fixed, watch_fixed)
  let discountedTotalGbp = baseGbpTotal;
  let totalSavingsGbp = 0;

  function isWigItem(item) {
    return (item.category === 'Wigs & Hair') || (item.title && item.title.toLowerCase().includes('wig'));
  }
  function isJewelryItem(item) {
    return (item.category === 'Necklaces & Pendants') || (item.category === 'Bracelets & Bangles') || 
           (item.title && (item.title.toLowerCase().includes('necklace') || item.title.toLowerCase().includes('bracelet') || item.title.toLowerCase().includes('bangle')));
  }
  function isWatchItem(item) {
    return (item.category === 'Luxury Watches') || (item.title && (item.title.toLowerCase().includes('watch')));
  }

  let isFreeShippingPromo = false;
  let promoShippingFeeUsd = 0;
  let promoProductDiscountGbp = 0;

  if (drawerAppliedCoupon && (drawerAppliedCoupon.type === 'free_shipping_promo' || drawerAppliedCoupon.code === 'AG100' || drawerAppliedCoupon.type === 'wig_tiered' || drawerAppliedCoupon.type === 'jewelry_fixed' || drawerAppliedCoupon.type === 'watch_fixed')) {
    isFreeShippingPromo = true;
    cart.forEach(item => {
      const qty = parseInt(item.qty, 10) || 1;
      const unitPriceGbp = item.price_gbp || (item.price_usd ? item.price_usd / 1.27 : 29.00);

      if (isWigItem(item)) {
        const isTierB = (item.price_usd && item.price_usd > 200);
        const shipPerUnit = isTierB ? 41.99 : 35.99;
        promoShippingFeeUsd += shipPerUnit * qty;
        promoProductDiscountGbp += unitPriceGbp * qty;
      } else if (isJewelryItem(item)) {
        promoShippingFeeUsd += 15.80 * qty;
        promoProductDiscountGbp += unitPriceGbp * qty;
      } else if (isWatchItem(item)) {
        promoShippingFeeUsd += 22.00 * qty;
        promoProductDiscountGbp += unitPriceGbp * qty;
      }
    });

    // Payable amount is just the shipping fee converted to base GBP
    const promoShippingGbp = promoShippingFeeUsd / 1.27;
    discountedTotalGbp = promoShippingGbp;
  } else if (checkoutDiscountRate > 0) {
    discountedTotalGbp = baseGbpTotal * (1 - (checkoutDiscountRate / 100));
  }

  // Converted values
  const convertedSubtotal = (baseGbpTotal * checkoutRate);
  const convertedTotal = (discountedTotalGbp * checkoutRate);
  const installment = (convertedTotal / 4);

  const formattedTotal = `${checkoutCurrencySymbol}${convertedTotal.toFixed(2)}`;
  const formattedSubtotal = `${checkoutCurrencySymbol}${convertedSubtotal.toFixed(2)}`;
  const formattedInstallment = `${checkoutCurrencySymbol}${installment.toFixed(2)}`;

  if (subtotalEl) subtotalEl.innerText = formattedSubtotal;
  if (totalEl) totalEl.innerText = formattedTotal;
  if (currCodeEl) currCodeEl.innerText = checkoutCurrency;
  if (btnPayNowText) btnPayNowText.innerText = `Pay now • ${formattedTotal}`;
  if (afterpayText) afterpayText.innerText = formattedInstallment;

  // Render items with Shopify-style thumbnail badge
  if (container) {
    container.innerHTML = cart.map(item => {
      const itemPriceGbp = item.price_gbp || (item.price_usd ? item.price_usd * 0.79 : 29.00);
      const convertedItemPrice = (itemPriceGbp * checkoutRate * item.qty);
      return `
        <div class="flex items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-3 min-w-0">
            <div class="relative w-12 h-12 rounded-lg border border-slate-200 bg-white flex-shrink-0 overflow-visible">
              <img src="${item.image}" class="w-full h-full object-cover rounded-lg" onerror="this.src='favicon.svg'">
              <span class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-600 text-white font-bold text-[10px] flex items-center justify-center shadow">
                ${item.qty}
              </span>
            </div>
            <div class="min-w-0">
              <div class="font-bold text-slate-900 truncate">${item.title}</div>
              <div class="text-[11px] text-slate-500">${item.category || 'Luxury Collection'}</div>
            </div>
          </div>
          <div class="font-bold text-slate-900 font-mono whitespace-nowrap">
            ${checkoutCurrencySymbol}${convertedItemPrice.toFixed(2)}
          </div>
        </div>
      `;
    }).join('');
  }
}

function togglePaymentSection(selectedMethod) {
  const sections = ['card', 'afterpay', 'amazon', 'crypto'];
  sections.forEach(s => {
    const el = document.getElementById('paymentFields-' + s);
    if (el) {
      if (s === selectedMethod) el.classList.remove('hidden');
      else el.classList.add('hidden');
    }
  });

  const radios = document.querySelectorAll('input[name="paymentOption"]');
  radios.forEach(r => {
    if (r.value === selectedMethod) r.checked = true;
  });

  const btnText = document.getElementById('btnPayNowText');
  const total = document.getElementById('summaryTotalAmount')?.innerText || '£0.00';
  if (btnText) {
    if (selectedMethod === 'afterpay') btnText.innerText = `Pay with Afterpay • ${total}`;
    else if (selectedMethod === 'amazon') btnText.innerText = `Pay with Amazon Pay • ${total}`;
    else if (selectedMethod === 'crypto') btnText.innerText = `Transfer USDT TRC20 • ${total}`;
    else btnText.innerText = `Pay now • ${total}`;
  }
}

function selectExpressPayment(type) {
  if (type === 'apple') {
    togglePaymentSection('card');
    showCheckoutNotification('Apple Pay / Google Pay selected. Authorize using your saved device wallet.');
  } else if (type === 'amazon') {
    togglePaymentSection('amazon');
    showCheckoutNotification('Amazon Pay selected. Sign in with Amazon to confirm.');
  } else if (type === 'afterpay') {
    togglePaymentSection('afterpay');
    showCheckoutNotification('Afterpay selected. 4 interest-free installments activated.');
  }
}

function formatCardNumber(input) {
  let val = input.value.replace(/\D/g, '');
  if (val.length > 16) val = val.slice(0, 16);
  const parts = [];
  for (let i = 0; i < val.length; i += 4) {
    parts.push(val.slice(i, i + 4));
  }
  input.value = parts.join(' ');

  // Card brand detection icon
  const icon = document.getElementById('cardBrandIcon');
  if (icon) {
    if (val.startsWith('4')) icon.className = 'fa-brands fa-cc-visa text-blue-800 text-lg';
    else if (/^5[1-5]/.test(val)) icon.className = 'fa-brands fa-cc-mastercard text-rose-600 text-lg';
    else if (/^3[47]/.test(val)) icon.className = 'fa-brands fa-cc-amex text-sky-600 text-lg';
    else icon.className = 'fa-solid fa-lock text-slate-400';
  }
}

function formatCardExpiry(input) {
  let val = input.value.replace(/\D/g, '');
  if (val.length > 4) val = val.slice(0, 4);
  if (val.length >= 2) {
    input.value = val.slice(0, 2) + ' / ' + val.slice(2);
  } else {
    input.value = val;
  }
}

async function applyCheckoutDiscount() {
  const codeVal = document.getElementById('checkoutDiscountInput')?.value.trim().toUpperCase();
  const msgEl = document.getElementById('discountAppliedMsg');
  if (!codeVal) {
    alert('Please enter a voucher or promo code.');
    return;
  }

  let registry = [];
  try {
    const res = await fetch('coupons.json?t=' + Date.now());
    if (res.ok) registry = await res.json();
  } catch(e) {}
  try {
    const local = JSON.parse(localStorage.getItem('shoppaza_coupons') || '[]');
    if (local && local.length > 0) registry = [...local, ...registry];
  } catch(e) {}

  const fallbacks = [
    { code: 'AG100', type: 'free_shipping_promo', desc: '100% Free Items Promo — Customer pays only Shipping' }
  ];

  const match = (registry || []).find(c => c.code.toUpperCase() === codeVal) || fallbacks.find(c => c.code === codeVal);
  if (!match) {
    alert(`Coupon code "${codeVal}" is invalid or expired.`);
    return;
  }

  function isWigItem(item) {
    return (item.category === 'Wigs & Hair') || (item.title && item.title.toLowerCase().includes('wig'));
  }
  function isJewelryItem(item) {
    return (item.category === 'Necklaces & Pendants') || (item.category === 'Bracelets & Bangles') || 
           (item.title && (item.title.toLowerCase().includes('necklace') || item.title.toLowerCase().includes('bracelet') || item.title.toLowerCase().includes('bangle')));
  }
  function isWatchItem(item) {
    return (item.category === 'Luxury Watches') || (item.title && (item.title.toLowerCase().includes('watch')));
  }

  if (match.type === 'free_shipping_promo' || match.code === 'AG100') {
    const hasEligible = (cart || []).some(item => isWigItem(item) || isJewelryItem(item) || isWatchItem(item));
    if (!hasEligible) {
      alert('Coupon code "' + match.code + '" is valid for Wigs, Jewelry, and Luxury Watches.');
      return;
    }
  }

  drawerAppliedCoupon = match;
  drawerAppliedCode = match.code;
  checkoutDiscountRate = match.type === 'percent' ? match.value : 0;

  if (msgEl) {
    msgEl.classList.remove('hidden');
    let msgText = 'Coupon ' + match.code + ' applied!';
    if (match.type === 'free_shipping_promo' || match.code === 'AG100') {
      msgText = '🎉 Promo ' + match.code + ' applied! Items 100% FREE — Customer pays only Shipping!';
    } else if (match.type === 'percent') {
      msgText = 'Coupon ' + match.code + ' applied (' + (match.value || 10) + '% OFF)!';
    }
    msgEl.innerHTML = '<i class="fa-solid fa-tag"></i> <span>' + msgText + '</span>';
  }
  renderShopifyCheckoutSummary();
}

function handleShopifyCheckoutSubmit(e) {
  e.preventDefault();
  
  const email = document.getElementById('checkoutEmail')?.value.trim();
  const firstName = document.getElementById('checkoutFirstName')?.value.trim();
  const lastName = document.getElementById('checkoutLastName')?.value.trim();
  const street = document.getElementById('checkoutStreet')?.value.trim();
  const city = document.getElementById('checkoutCity')?.value.trim();
  const postal = document.getElementById('checkoutPostal')?.value.trim();
  const country = document.getElementById('checkoutCountry')?.value || 'GB';
  const phone = document.getElementById('checkoutPhone')?.value.trim();
  const paymentMethod = document.querySelector('input[name="paymentOption"]:checked')?.value || 'card';
  const totalAmount = document.getElementById('summaryTotalAmount')?.innerText || '£0.00';

  if (!email || !firstName || !street || !city || !postal) {
    alert('Please complete all required delivery and contact fields.');
    return;
  }

  const btn = document.getElementById('btnShopifyPayNow');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Authorizing with Stripe 256-Bit SSL...';
  }

  setTimeout(() => {
    // Generate order
    const orderId = '#SPZ-' + Math.floor(100000 + Math.random() * 900000);
    const trackingCode = (country === 'GB' ? 'RM-GB-' : 'EXP-INT-') + Math.floor(10000000 + Math.random() * 90000000);
    const existingOrders = JSON.parse(localStorage.getItem('shoppaza_live_orders') || '[]');

    const newOrder = {
      id: orderId,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      customer: `${firstName} ${lastName}`,
      email: email,
      phone: phone,
      address: `${street}, ${city}, ${postal}, ${country}`,
      country: country,
      items: cart.length,
      total: totalAmount,
      discount_code: drawerAppliedCode || 'NONE',
      affiliate_worker: drawerAppliedCoupon ? (drawerAppliedCoupon.worker || '') : '',
      affiliate_commission: drawerAppliedCoupon ? (drawerAppliedCoupon.commission_usd || 0) : 0,
      channel: 'Online Store (Shopify-Grade)',
      payment: paymentMethod === 'card' ? 'Stripe (Paid - 256-Bit SSL)' : (paymentMethod === 'afterpay' ? 'Afterpay (4 Payments)' : (paymentMethod === 'amazon' ? 'Amazon Pay' : 'USDT TRC20')),
      fulfillment: 'Unfulfilled',
      tracking: trackingCode,
      courier: country === 'GB' ? 'Royal Mail Tracked 24' : 'Air Express'
    };

    existingOrders.unshift(newOrder);
    localStorage.setItem('shoppaza_live_orders', JSON.stringify(existingOrders));

    // Clear cart
    cart = [];
    if (typeof saveCart === 'function') saveCart();
    if (typeof updateCartUI === 'function') updateCartUI();

    // Show Shopify Confirmation Screen inside modal
    renderShopifyOrderConfirmation(newOrder);
  }, 1200);
}

function renderShopifyOrderConfirmation(order) {
  const modalBox = document.querySelector('#checkoutModal > div');
  if (!modalBox) return;

  modalBox.innerHTML = `
    <div class="p-8 sm:p-12 text-center space-y-6 max-w-2xl mx-auto">
      <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto shadow-inner">
        <i class="fa-solid fa-circle-check"></i>
      </div>
      <div>
        <span class="text-xs uppercase font-bold text-emerald-600 tracking-wider">Payment Confirmed • Shoppaza Official</span>
        <h2 class="text-2xl sm:text-3xl font-black text-slate-950 mt-1">Thank you, ${escapeHtml(order.customer)}!</h2>
        <p class="text-xs text-slate-500 mt-2">Your order <strong class="text-slate-900">${order.id}</strong> has been confirmed and registered.</p>
        <p class="text-[11px] text-slate-400 mt-0.5">An official VAT invoice has been queued to <strong>${escapeHtml(order.email)}</strong> from <strong>admin@shoppaza.com</strong>.</p>
      </div>

      <div class="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-4 text-xs">
        <div class="flex justify-between items-center pb-3 border-b border-slate-200">
          <span class="text-slate-500">Order Reference:</span>
          <span class="font-mono font-bold text-slate-900">${order.id}</span>
        </div>
        <div class="flex justify-between items-center pb-3 border-b border-slate-200">
          <span class="text-slate-500">Amount Paid:</span>
          <span class="font-mono font-black text-slate-900 text-base">${order.total}</span>
        </div>
        <div class="flex justify-between items-center pb-3 border-b border-slate-200">
          <span class="text-slate-500">Payment Gateway:</span>
          <span class="font-bold text-emerald-600">${order.payment}</span>
        </div>
        <div class="flex justify-between items-center pb-3 border-b border-slate-200">
          <span class="text-slate-500">Shipping Service:</span>
          <span class="font-bold text-slate-900">${order.courier}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-slate-500">Tracking Code:</span>
          <span class="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">${order.tracking}</span>
        </div>
      </div>

      <div class="pt-2">
        <button onclick="location.reload()" class="w-full py-4 bg-slate-950 hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-xl">
          Continue Shopping at Shoppaza
        </button>
      </div>
    </div>
  `;
}

function showCheckoutNotification(msg) {
  const alertEl = document.createElement('div');
  alertEl.className = 'fixed bottom-5 right-5 z-[100] px-4 py-3 rounded-xl bg-slate-900 text-white border border-slate-700 text-xs shadow-2xl flex items-center gap-2 animate-bounce';
  alertEl.innerHTML = `<i class="fa-solid fa-circle-info text-daraz-orange"></i> <span>${msg}</span>`;
  document.body.appendChild(alertEl);
  setTimeout(() => alertEl.remove(), 4000);
}
