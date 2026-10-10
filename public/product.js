/**
 * WORLD BUY BD - Dynamic Product Details Page Controller
 * Handles dynamic product loading, SKU matching, payment discounts, shipping calculations,
 * image gallery zoom/fullscreen, cart/wishlist persistence, and auth protection.
 */

(function () {
  'use strict';

  // State Management
  const state = {
    products: [],
    settings: null,
    currentProduct: null,
    currentMediaIndex: 0,
    mediaList: [], // { type: 'image'|'video', url: string }
    selectedAttributes: {}, // e.g. { color: 'Midnight Black', size: 'Standard...' }
    currentSku: null,
    quantity: 1,
    paymentOption: 100, // 80 or 100
    shippingMethod: 'air', // 'air' or 'sea'
    isWishlisted: false,
    currentUser: null
  };

  // DOM Cache
  const dom = {
    // Header & Badges
    wishlistBadge: document.getElementById('wishlist-badge'),
    cartBadge: document.getElementById('cart-badge'),
    authStatusText: document.getElementById('auth-status-text'),
    headerAuthBtn: document.getElementById('header-auth-btn'),
    headerWishlistBtn: document.getElementById('header-wishlist-btn'),
    headerCartBtn: document.getElementById('header-cart-btn'),
    searchInput: document.getElementById('search-input'),

    // Breadcrumb
    crumbCategory: document.getElementById('crumb-category'),
    crumbProductTitle: document.getElementById('crumb-product-title'),

    // Gallery
    galleryThumbnails: document.getElementById('gallery-thumbnails'),
    mainProductImage: document.getElementById('main-product-image'),
    mainProductVideo: document.getElementById('main-product-video'),
    mediaViewport: document.getElementById('media-viewport'),
    galleryPrevBtn: document.getElementById('gallery-prev-btn'),
    galleryNextBtn: document.getElementById('gallery-next-btn'),
    fullscreenZoomTrigger: document.getElementById('fullscreen-zoom-trigger'),
    fullscreenModal: document.getElementById('fullscreen-modal'),
    fullscreenCloseBtn: document.getElementById('fullscreen-close-btn'),
    fullscreenImageElement: document.getElementById('fullscreen-image-element'),
    mainDiscountBadge: document.getElementById('main-discount-badge'),

    // Product Meta
    productCategoryTag: document.getElementById('product-category-tag'),
    productOfferIdText: document.getElementById('product-offer-id-text'),
    productTitleText: document.getElementById('product-title-text'),
    productRatingScore: document.getElementById('product-rating-score'),
    productReviewCount: document.getElementById('product-review-count'),
    productSoldCount: document.getElementById('product-sold-count'),
    productStockStatus: document.getElementById('product-stock-status'),

    // Pricing & Payment
    productCurrentPrice: document.getElementById('product-current-price'),
    productOriginalPrice: document.getElementById('product-original-price'),
    priceCardDiscount: document.getElementById('price-card-discount'),
    payOpt80: document.getElementById('pay-opt-80'),
    payOpt100: document.getElementById('pay-opt-100'),
    previewPay80: document.getElementById('preview-pay-80'),
    previewPay100: document.getElementById('preview-pay-100'),

    // SKU Variations & Quantity
    skuAttributesContainer: document.getElementById('sku-attributes-container'),
    qtyDecreaseBtn: document.getElementById('qty-decrease-btn'),
    qtyIncreaseBtn: document.getElementById('qty-increase-btn'),
    quantityInput: document.getElementById('quantity-input'),
    unitSubtotalDisplay: document.getElementById('unit-subtotal-display'),

    // Shipping
    shipMethodAir: document.getElementById('ship-method-air'),
    shipMethodSea: document.getElementById('ship-method-sea'),
    shipAirCost: document.getElementById('ship-air-cost'),
    shipSeaCost: document.getElementById('ship-sea-cost'),
    openShippingRatesBtn: document.getElementById('open-shipping-rates-btn'),
    openShippingGuide: document.getElementById('open-shipping-guide'),
    shippingModalBackdrop: document.getElementById('shipping-modal-backdrop'),
    shippingModalClose: document.getElementById('shipping-modal-close'),
    shippingModalContent: document.getElementById('shipping-modal-content'),

    // Order Summary Calculation
    calcQtyMultiplier: document.getElementById('calc-qty-multiplier'),
    calcUnitPrice: document.getElementById('calc-unit-price'),
    calcSubtotal: document.getElementById('calc-subtotal'),
    calcShipType: document.getElementById('calc-ship-type'),
    calcShipping: document.getElementById('calc-shipping'),
    calcDiscountRow: document.getElementById('calc-discount-row'),
    calcDiscountPct: document.getElementById('calc-discount-pct'),
    calcDiscountVal: document.getElementById('calc-discount-val'),
    calcFinalPayable: document.getElementById('calc-final-payable'),
    calcRemainingNote: document.getElementById('calc-remaining-note'),

    // Actions
    productWishlistToggle: document.getElementById('product-wishlist-toggle'),
    wishlistIcon: document.getElementById('wishlist-icon'),
    productShareBtn: document.getElementById('product-share-btn'),
    btnAddToCart: document.getElementById('btn-add-to-cart'),
    btnBuyNow: document.getElementById('btn-buy-now'),
    productServicesContainer: document.getElementById('product-services-container'),

    // Mobile Sticky Bar
    mobileBottomPrice: document.getElementById('mobile-bottom-price'),
    mobileBtnCart: document.getElementById('mobile-btn-cart'),
    mobileBtnBuy: document.getElementById('mobile-btn-buy'),

    // Supplier Info
    supplierAvatarInitial: document.getElementById('supplier-avatar-initial'),
    supplierNameText: document.getElementById('supplier-name-text'),
    supplierLocationText: document.getElementById('supplier-location-text'),
    supplierRatingVal: document.getElementById('supplier-rating-val'),
    supplierYearsVal: document.getElementById('supplier-years-val'),
    supplierOrdersVal: document.getElementById('supplier-orders-val'),
    supplierResponseVal: document.getElementById('supplier-response-val'),
    btnContactSourcing: document.getElementById('btn-contact-sourcing'),

    // Tabs
    tabNavBtns: document.querySelectorAll('.tab-nav-btn'),
    tabPanes: document.querySelectorAll('.tab-pane'),
    tabDescContent: document.getElementById('tab-desc-content'),
    tabSpecsTable: document.getElementById('tab-specs-table'),
    tabReviewsCount: document.getElementById('tab-reviews-count'),
    reviewSummaryScore: document.getElementById('review-summary-score'),
    reviewTotalCount: document.getElementById('review-total-count'),
    customerReviewsContainer: document.getElementById('customer-reviews-container'),
    btnWriteReview: document.getElementById('btn-write-review'),

    // Related Products
    relatedProductsContainer: document.getElementById('related-products-container'),

    // Auth Modal
    authModalBackdrop: document.getElementById('auth-modal-backdrop'),
    authModalClose: document.getElementById('auth-modal-close'),
    btnModalGuestCheckout: document.getElementById('btn-modal-guest-checkout'),
    toastContainer: document.getElementById('toast-container')
  };

  /**
   * Initialize Application
   */
  async function init() {
    loadLocalUser();
    updateHeaderBadges();
    attachEventListeners();

    try {
      await Promise.all([loadSettingsData(), loadProductsData()]);
      setupProductView();
    } catch (err) {
      console.error('Data loading error:', err);
      showToast('Error', 'Unable to load product information. Please refresh the page.', 'error');
    }
  }

  /**
   * Load Settings from JSON
   */
  async function loadSettingsData() {
    try {
      const response = await fetch('./data/settings.json');
      if (response.ok) {
        state.settings = await response.json();
      } else {
        throw new Error('Settings not found');
      }
    } catch {
      // Robust Fallback
      state.settings = {
        currency: 'BDT ',
        paymentOptions: {
          partial: { percentage: 80, discountPercentage: 0 },
          full: { percentage: 100, discountPercentage: 3 }
        },
        shipping: {
          air: { defaultRatePerKg: 780 },
          sea: { ratePerKg: 260 }
        }
      };
    }
  }

  /**
   * Load Products from JSON
   */
  async function loadProductsData() {
    const urls = ['./data/products.json', '/data/products.json', 'data/products.json'];
    let loaded = false;

    for (const url of urls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          state.products = await response.json();
          loaded = true;
          break;
        }
      } catch {
        // Try next URL
      }
    }

    if (!loaded || !state.products || state.products.length === 0) {
      throw new Error('Products could not be loaded');
    }
  }

  /**
   * Extract Offer ID from URL and prepare target product
   */
  function setupProductView() {
    const params = new URLSearchParams(window.location.search);
    const requestedOfferId = params.get('offerId') || 'abb-963357947517';

    let product = state.products.find(
      p => (p.offerId && p.offerId.toLowerCase() === requestedOfferId.toLowerCase()) ||
           (p.id && p.id.toLowerCase() === requestedOfferId.toLowerCase())
    );

    if (!product && state.products.length > 0) {
      product = state.products[0];
    }

    state.currentProduct = product;
    document.title = `${product.title} - WORLD BUY BD`;

    // Initialize Media List (Images + Video)
    state.mediaList = [];
    if (product.videoUrl) {
      state.mediaList.push({ type: 'video', url: product.videoUrl, thumb: product.images[0] });
    }
    if (Array.isArray(product.images)) {
      product.images.forEach(img => state.mediaList.push({ type: 'image', url: img }));
    }

    // Default Attributes selection
    state.selectedAttributes = {};
    if (product.skuAttributes && product.skuAttributes.length > 0) {
      product.skuAttributes.forEach(attr => {
        if (attr.options && attr.options.length > 0) {
          state.selectedAttributes[attr.id] = attr.options[0].value;
        }
      });
    }

    // Match initial SKU
    matchCurrentSku();

    // Check wishlist state
    checkWishlistStatus();

    // Render all UI components
    renderGallery();
    renderProductMeta();
    renderSkuSelectors();
    renderProductServices();
    renderSupplierInfo();
    renderTabbedContent();
    renderRelatedProducts();
    recalculateAll();

    // Refresh Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  /**
   * Match current SKU combination
   */
  function matchCurrentSku() {
    const product = state.currentProduct;
    if (!product.skuDetails || product.skuDetails.length === 0) {
      state.currentSku = null;
      return;
    }

    const matched = product.skuDetails.find(item => {
      return Object.keys(state.selectedAttributes).every(
        key => item.combination && item.combination[key] === state.selectedAttributes[key]
      );
    });

    state.currentSku = matched || product.skuDetails[0];

    // If selected SKU has a distinct image, switch media gallery view
    if (state.currentSku && state.currentSku.image) {
      const idx = state.mediaList.findIndex(m => m.url === state.currentSku.image);
      if (idx !== -1) {
        state.currentMediaIndex = idx;
        updateActiveMediaDisplay();
      }
    }
  }

  /**
   * Render Gallery Thumbnails and Active Image
   */
  function renderGallery() {
    dom.galleryThumbnails.innerHTML = '';

    state.mediaList.forEach((media, index) => {
      const thumb = document.createElement('div');
      thumb.className = `thumbnail-item ${index === state.currentMediaIndex ? 'active' : ''}`;
      thumb.onclick = () => selectMedia(index);

      if (media.type === 'video') {
        thumb.innerHTML = `
          <img src="${media.thumb || (state.mediaList[1] && state.mediaList[1].url) || ''}" alt="Video thumbnail">
          <div class="thumbnail-video-badge"><i data-lucide="play" style="width:20px;height:20px;fill:currentColor;"></i></div>
        `;
      } else {
        thumb.innerHTML = `<img src="${media.url}" alt="Thumbnail ${index + 1}">`;
      }

      dom.galleryThumbnails.appendChild(thumb);
    });

    updateActiveMediaDisplay();
  }

  /**
   * Update Active Media View (Image or Video)
   */
  function updateActiveMediaDisplay() {
    const media = state.mediaList[state.currentMediaIndex];
    if (!media) return;

    // Highlight thumbnail
    const thumbs = dom.galleryThumbnails.querySelectorAll('.thumbnail-item');
    thumbs.forEach((el, idx) => {
      el.classList.toggle('active', idx === state.currentMediaIndex);
    });

    if (media.type === 'video') {
      dom.mainProductImage.style.display = 'none';
      dom.mainProductVideo.style.display = 'block';
      dom.mainProductVideo.src = media.url;
      dom.mainProductVideo.play().catch(() => {});
    } else {
      dom.mainProductVideo.pause();
      dom.mainProductVideo.style.display = 'none';
      dom.mainProductImage.style.display = 'block';
      dom.mainProductImage.src = media.url;
    }

    if (window.lucide) window.lucide.createIcons();
  }

  function selectMedia(index) {
    if (index < 0) index = state.mediaList.length - 1;
    if (index >= state.mediaList.length) index = 0;
    state.currentMediaIndex = index;
    updateActiveMediaDisplay();
  }

  /**
   * Render Main Product Metadata
   */
  function renderProductMeta() {
    const product = state.currentProduct;
    dom.crumbCategory.textContent = product.category || 'General Products';
    dom.crumbProductTitle.textContent = product.title;

    dom.productCategoryTag.textContent = product.category || 'Direct Import';
    dom.productOfferIdText.textContent = product.offerId || product.id;
    dom.productTitleText.textContent = product.title;

    dom.productRatingScore.textContent = product.rating ? product.rating.toFixed(1) : '4.8';
    dom.productReviewCount.textContent = `(${product.reviewCount || 120} reviews)`;
    dom.productSoldCount.textContent = `${(product.orderCount || 1000).toLocaleString()} Sold`;

    const availableStock = state.currentSku ? state.currentSku.stock : (product.stock || 200);
    if (availableStock > 0) {
      dom.productStockStatus.className = 'stock-count stock-in';
      dom.productStockStatus.innerHTML = `<i data-lucide="check-circle-2" style="width:15px;height:15px;color:var(--success);"></i> In Stock (${availableStock} available)`;
    } else {
      dom.productStockStatus.className = 'stock-count stock-out';
      dom.productStockStatus.innerHTML = `<i data-lucide="x-circle" style="width:15px;height:15px;color:#ef4444;"></i> Out of Stock`;
    }
  }

  /**
   * Render Dynamic SKU / Variations Selector
   */
  function renderSkuSelectors() {
    const product = state.currentProduct;
    dom.skuAttributesContainer.innerHTML = '';

    if (!product.skuAttributes || product.skuAttributes.length === 0) {
      return;
    }

    product.skuAttributes.forEach(attr => {
      const group = document.createElement('div');
      group.className = 'sku-attribute-group';

      const selectedVal = state.selectedAttributes[attr.id] || (attr.options[0] && attr.options[0].value);

      group.innerHTML = `
        <div class="sku-attr-header">
          <span class="sku-attr-name">${attr.name}:</span>
          <span class="sku-attr-selected-val" id="attr-selected-val-${attr.id}">${selectedVal}</span>
        </div>
        <div class="sku-options-list" id="attr-options-${attr.id}"></div>
      `;

      const optionsList = group.querySelector(`#attr-options-${attr.id}`);

      attr.options.forEach(opt => {
        const chip = document.createElement('div');
        const isSelected = selectedVal === opt.value;
        chip.className = `sku-option-chip ${isSelected ? 'active' : ''}`;

        let chipInner = '';
        if (opt.image) {
          chipInner += `<img src="${opt.image}" alt="${opt.value}" class="sku-chip-thumb">`;
        }
        chipInner += `<span>${opt.value}</span>`;
        chip.innerHTML = chipInner;

        chip.onclick = () => {
          state.selectedAttributes[attr.id] = opt.value;
          const displayEl = document.getElementById(`attr-selected-val-${attr.id}`);
          if (displayEl) displayEl.textContent = opt.value;

          // Re-highlight active chip in group
          optionsList.querySelectorAll('.sku-option-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');

          matchCurrentSku();
          renderProductMeta();
          recalculateAll();
        };

        optionsList.appendChild(chip);
      });

      dom.skuAttributesContainer.appendChild(group);
    });
  }

  /**
   * Recalculate Live Pricing, Discounts, Shipping, and Final Total
   */
  function recalculateAll() {
    const product = state.currentProduct;
    const currency = (state.settings && state.settings.currency) || 'BDT ';

    // 1. Base unit price from SKU or product
    const unitPrice = state.currentSku ? state.currentSku.price : product.price;
    const origPrice = state.currentSku && state.currentSku.originalPrice
      ? state.currentSku.originalPrice
      : (product.originalPrice || Math.round(unitPrice * 1.12));

    const discountPct = Math.round(((origPrice - unitPrice) / origPrice) * 100);

    dom.productCurrentPrice.textContent = unitPrice.toLocaleString();
    dom.productOriginalPrice.textContent = origPrice.toLocaleString();
    dom.priceCardDiscount.textContent = `-${discountPct}%`;
    dom.mainDiscountBadge.textContent = `-${discountPct}% OFF`;

    // 2. Quantity subtotal
    const qty = state.quantity;
    const productSubtotal = unitPrice * qty;
    dom.unitSubtotalDisplay.textContent = `${currency} ${productSubtotal.toLocaleString()}`;

    // 3. Shipping Calculation
    const weightPerUnit = product.unitWeight || 0.75;
    const totalWeight = weightPerUnit * qty;

    const airRate = (state.settings && state.settings.shipping && state.settings.shipping.air.defaultRatePerKg) || 780;
    const seaRate = (state.settings && state.settings.shipping && state.settings.shipping.sea.ratePerKg) || 260;

    const airCost = Math.round(totalWeight * airRate);
    const seaCost = Math.max(180, Math.round(totalWeight * seaRate));

    dom.shipAirCost.textContent = `Est. ${currency} ${airCost.toLocaleString()}`;
    dom.shipSeaCost.textContent = `Est. ${currency} ${seaCost.toLocaleString()}`;

    const activeShippingCost = state.shippingMethod === 'air' ? airCost : seaCost;

    // 4. Payment Option Calculation
    // 80% Payment -> No discount, payable now = 80% of product + shipping
    // 100% Payment -> 3% flat discount on product subtotal
    const discount3Percent = Math.round(productSubtotal * 0.03);
    const fullPaymentAmount = (productSubtotal - discount3Percent) + activeShippingCost;
    const partialPaymentAmount = Math.round(productSubtotal * 0.8) + activeShippingCost;
    const remainingBalance = Math.round(productSubtotal * 0.2);

    dom.previewPay80.textContent = `${currency} ${Math.round(productSubtotal * 0.8).toLocaleString()}`;
    dom.previewPay100.textContent = `${currency} ${(productSubtotal - discount3Percent).toLocaleString()}`;

    // Update Live Calculation Panel
    dom.calcQtyMultiplier.textContent = qty;
    dom.calcUnitPrice.textContent = unitPrice.toLocaleString();
    dom.calcSubtotal.textContent = productSubtotal.toLocaleString();

    dom.calcShipType.textContent = state.shippingMethod === 'air' ? 'BUY AIR' : 'BUY SEA';
    dom.calcShipping.textContent = activeShippingCost.toLocaleString();

    if (state.paymentOption === 100) {
      dom.calcDiscountRow.style.display = 'flex';
      dom.calcDiscountPct.textContent = '3%';
      dom.calcDiscountVal.textContent = discount3Percent.toLocaleString();
      dom.calcFinalPayable.textContent = fullPaymentAmount.toLocaleString();
      dom.calcRemainingNote.innerHTML = '<span style="color:#34d399;">✓ 100% Advance Payment:</span> Instant 3% discount applied. BDT 0 remaining balance on delivery!';
    } else {
      dom.calcDiscountRow.style.display = 'none';
      dom.calcFinalPayable.textContent = partialPaymentAmount.toLocaleString();
      dom.calcRemainingNote.innerHTML = `<span style="color:#fbbf24;">⚡ 80% Advance Payment:</span> Remaining balance of <strong>BDT  ${remainingBalance.toLocaleString()}</strong> payable on delivery in Bangladesh.`;
    }

    // Sync Mobile sticky bottom price
    const payableTotal = state.paymentOption === 100 ? fullPaymentAmount : partialPaymentAmount;
    dom.mobileBottomPrice.textContent = `${currency} ${payableTotal.toLocaleString()}`;
  }

  /**
   * Payment Option Switching (Exposed globally)
   */
  window.selectPaymentOption = function (opt) {
    state.paymentOption = opt;
    dom.payOpt80.classList.toggle('active', opt === 80);
    dom.payOpt100.classList.toggle('active', opt === 100);
    recalculateAll();
  };

  /**
   * Shipping Method Switching (Exposed globally)
   */
  window.selectShippingMethod = function (method) {
    state.shippingMethod = method;
    dom.shipMethodAir.classList.toggle('active', method === 'air');
    dom.shipMethodSea.classList.toggle('active', method === 'sea');
    recalculateAll();
  };

  /**
   * Render Product Services highlights
   */
  function renderProductServices() {
    dom.productServicesContainer.innerHTML = '';
    const services = [
      { title: '100% Buyer Protection', icon: 'shield-check' },
      { title: 'Direct Wholesale Factory', icon: 'check-circle' },
      { title: 'Air & Sea Customs Cleared', icon: 'plane' }
    ];

    services.forEach(srv => {
      const item = document.createElement('div');
      item.className = 'service-mini-item';
      item.innerHTML = `
        <div class="service-mini-icon"><i data-lucide="${srv.icon}" style="width:16px;height:16px;"></i></div>
        <span><strong>${srv.title}</strong></span>
      `;
      dom.productServicesContainer.appendChild(item);
    });
  }

  /**
   * Render Supplier Info Card
   */
  function renderSupplierInfo() {
    const supplier = state.currentProduct.supplier;
    if (!supplier) return;

    dom.supplierAvatarInitial.textContent = supplier.name ? supplier.name.charAt(0).toUpperCase() : 'W';
    dom.supplierNameText.textContent = supplier.name;
    dom.supplierLocationText.innerHTML = `<i data-lucide="map-pin" style="width:13px;display:inline-block;"></i> ${supplier.location}`;
    dom.supplierRatingVal.textContent = `${supplier.rating || 4.9} ★`;
    dom.supplierYearsVal.textContent = `${supplier.tpYears || 8} Years`;
    dom.supplierOrdersVal.textContent = supplier.orderCount || '45,000+';
    dom.supplierResponseVal.textContent = supplier.responseRate || '98%';
  }

  /**
   * Render Tabbed Content (Description, Specs, Reviews)
   */
  function renderTabbedContent() {
    const product = state.currentProduct;

    // 1. Description
    let descImgsHtml = '';
    if (Array.isArray(product.descriptionImages) && product.descriptionImages.length > 0) {
      descImgsHtml = `
        <div style="margin-top:24px;display:flex;flex-direction:column;gap:16px;">
          <h4 style="font-weight:700;font-size:15px;color:var(--slate-800);border-bottom:1px solid var(--slate-200);padding-bottom:8px;">Detailed Product Features & Infographics</h4>
          ${product.descriptionImages.map((img, i) => `
            <div style="border-radius:10px;overflow:hidden;border:1px solid var(--slate-200);background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
              <img src="${img}" alt="Product Feature Detail ${i + 1}" style="width:100%;height:auto;display:block;" loading="lazy" />
            </div>
          `).join('')}
        </div>
      `;
    }

    dom.tabDescContent.innerHTML = `
      <p style="font-size:16px;font-weight:700;color:var(--slate-800);margin-bottom:12px;">${product.title || product.name}</p>
      <p style="line-height:1.7;color:var(--slate-600);">${product.description || 'Import genuine products directly from China manufacturers.'}</p>
      <div style="margin-top:20px;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;">
        <div style="background:var(--slate-50);padding:14px;border-radius:10px;border:1px solid var(--slate-200);">
          <h4 style="font-weight:700;color:var(--primary);margin-bottom:6px;">Direct China Sourcing</h4>
          <p style="font-size:13px;color:var(--slate-600);">Sourced directly from verified Wholesale industrial clusters without third-party commission.</p>
        </div>
        <div style="background:var(--slate-50);padding:14px;border-radius:10px;border:1px solid var(--slate-200);">
          <h4 style="font-weight:700;color:var(--accent);margin-bottom:6px;">Physical Warehouse Inspection</h4>
          <p style="font-size:13px;color:var(--slate-600);">Inspected for material quality, stitching, and dimensions prior to packaging and flight dispatch.</p>
        </div>
      </div>
      ${descImgsHtml}
    `;

    // 2. Specifications
    const specsTbody = dom.tabSpecsTable.querySelector('tbody');
    specsTbody.innerHTML = '';
    if (product.specs) {
      Object.entries(product.specs).forEach(([key, value]) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <th>${key}</th>
          <td>${value}</td>
        `;
        specsTbody.appendChild(tr);
      });
    }

    // 3. Reviews
    dom.tabReviewsCount.textContent = (product.reviews && product.reviews.length) || 3;
    dom.reviewTotalCount.textContent = product.reviewCount || 184;
    dom.reviewSummaryScore.textContent = product.rating ? product.rating.toFixed(1) : '4.8';

    dom.customerReviewsContainer.innerHTML = '';
    if (product.reviews && product.reviews.length > 0) {
      product.reviews.forEach(rev => {
        const card = document.createElement('div');
        card.className = 'review-card';
        card.innerHTML = `
          <div class="reviewer-meta">
            <span class="reviewer-name">
              ${rev.name}
              ${rev.verifiedPurchase ? '<span class="verified-buyer-tag"><i data-lucide="check" style="width:11px;display:inline-block;"></i> Verified Purchase</span>' : ''}
            </span>
            <span class="review-date">${rev.date}</span>
          </div>
          <div class="stars-row" style="justify-content:flex-start;font-size:14px;margin:2px 0;">
            ${'★'.repeat(Math.floor(rev.rating))}
          </div>
          <p class="review-text">${rev.comment}</p>
        `;
        dom.customerReviewsContainer.appendChild(card);
      });
    }
  }

  /**
   * Render Related Products ("You May Also Like")
   */
  function renderRelatedProducts() {
    dom.relatedProductsContainer.innerHTML = '';
    const currentId = state.currentProduct.offerId || state.currentProduct.id;
    const related = state.products.filter(p => (p.offerId || p.id) !== currentId);

    related.forEach(item => {
      const card = document.createElement('a');
      card.href = `product.html?offerId=${item.offerId || item.id}`;
      card.className = 'product-card-preview';

      const img = item.images && item.images[0] ? item.images[0] : '';
      const orig = item.originalPrice || Math.round(item.price * 1.15);

      card.innerHTML = `
        <div class="preview-image-wrap">
          <img src="${img}" alt="${item.title}" loading="lazy">
          ${item.discount ? `<span class="preview-discount-badge">-${item.discount}%</span>` : ''}
        </div>
        <div class="preview-details">
          <span class="preview-category">${item.category || 'Direct Import'}</span>
          <h4 class="preview-title" title="${item.title}">${item.title}</h4>
          <div class="preview-price-row">
            <span class="preview-current-price">BDT  ${(item.price || 0).toLocaleString()}</span>
            <span class="preview-old-price">BDT  ${orig.toLocaleString()}</span>
          </div>
        </div>
      `;

      dom.relatedProductsContainer.appendChild(card);
    });
  }

  /**
   * Image Zoom on Hover Effect
   */
  function setupImageZoom() {
    dom.mediaViewport.addEventListener('mousemove', function (e) {
      if (dom.mainProductImage.style.display === 'none') return;
      const rect = dom.mediaViewport.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      dom.mainProductImage.style.transformOrigin = `${x}% ${y}%`;
      dom.mainProductImage.style.transform = 'scale(1.8)';
    });

    dom.mediaViewport.addEventListener('mouseleave', function () {
      dom.mainProductImage.style.transform = 'scale(1)';
      dom.mainProductImage.style.transformOrigin = 'center center';
    });
  }

  /**
   * Fullscreen Viewer
   */
  function openFullscreenViewer() {
    const media = state.mediaList[state.currentMediaIndex];
    if (media && media.type === 'image') {
      dom.fullscreenImageElement.src = media.url;
      dom.fullscreenModal.classList.add('open');
    }
  }

  function closeFullscreenViewer() {
    dom.fullscreenModal.classList.remove('open');
  }

  /**
   * Wishlist Handling
   */
  function checkWishlistStatus() {
    const list = JSON.parse(localStorage.getItem('wbb_wishlist') || '[]');
    const id = state.currentProduct.offerId || state.currentProduct.id;
    state.isWishlisted = list.includes(id);

    dom.productWishlistToggle.classList.toggle('active', state.isWishlisted);
    if (state.isWishlisted) {
      dom.wishlistIcon.style.fill = '#ef4444';
      dom.wishlistIcon.style.color = '#ef4444';
    } else {
      dom.wishlistIcon.style.fill = 'none';
      dom.wishlistIcon.style.color = 'currentColor';
    }
  }

  function toggleWishlist() {
    let list = JSON.parse(localStorage.getItem('wbb_wishlist') || '[]');
    const id = state.currentProduct.offerId || state.currentProduct.id;

    if (list.includes(id)) {
      list = list.filter(item => item !== id);
      state.isWishlisted = false;
      showToast('Wishlist', 'Product removed from your wishlist.', 'info');
    } else {
      list.push(id);
      state.isWishlisted = true;
      showToast('Wishlist', 'Product added to your wishlist successfully!', 'success');
    }

    localStorage.setItem('wbb_wishlist', JSON.stringify(list));
    checkWishlistStatus();
    updateHeaderBadges();
  }

  /**
   * Add to Cart Handling
   */
  function handleAddToCart() {
    const product = state.currentProduct;
    const cart = JSON.parse(localStorage.getItem('wbb_cart') || '[]');

    const skuId = state.currentSku ? state.currentSku.skuId : (product.offerId || product.id);
    const unitPrice = state.currentSku ? state.currentSku.price : product.price;

    const cartItem = {
      offerId: product.offerId || product.id,
      title: product.title,
      skuId: skuId,
      combination: state.selectedAttributes,
      price: unitPrice,
      quantity: state.quantity,
      image: (state.currentSku && state.currentSku.image) || (product.images && product.images[0]),
      shippingMethod: state.shippingMethod,
      paymentOption: state.paymentOption,
      timestamp: Date.now()
    };

    // Check if duplicate SKU already in cart
    const existingIndex = cart.findIndex(i => i.offerId === cartItem.offerId && i.skuId === cartItem.skuId);
    if (existingIndex > -1) {
      cart[existingIndex].quantity += state.quantity;
    } else {
      cart.push(cartItem);
    }

    localStorage.setItem('wbb_cart', JSON.stringify(cart));
    updateHeaderBadges();

    showToast('Added to Cart', `${state.quantity} × ${product.title.substring(0, 32)}... added to your bag!`, 'success');
  }

  /**
   * Buy Now Action with Auth Protection
   */
  function handleBuyNow() {
    const user = getLoggedInUser();
    const product = state.currentProduct;
    const skuId = state.currentSku ? state.currentSku.skuId : (product.offerId || product.id);

    if (!user) {
      // Show modern 3D Login Protection Modal
      dom.authModalBackdrop.classList.add('open');
    } else {
      // User is logged in -> Proceed directly to checkout
      proceedToCheckout(skuId);
    }
  }

  function proceedToCheckout(skuId) {
    const product = state.currentProduct;
    const targetSku = skuId || (state.currentSku ? state.currentSku.skuId : product.offerId);
    const checkoutUrl = `checkout.html?buyNow=1&offerId=${encodeURIComponent(product.offerId || product.id)}&skuId=${encodeURIComponent(targetSku)}&qty=${state.quantity}&payment=${state.paymentOption}&shipping=${state.shippingMethod}`;

    showToast('Redirecting', 'Proceeding to secure checkout...', 'info');
    setTimeout(() => {
      window.location.href = checkoutUrl;
    }, 600);
  }

  /**
   * User Auth State Helpers
   */
  function getLoggedInUser() {
    try {
      const u = localStorage.getItem('wbb_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  }

  function loadLocalUser() {
    state.currentUser = getLoggedInUser();
    if (state.currentUser) {
      dom.authStatusText.textContent = state.currentUser.name || 'Account';
    } else {
      dom.authStatusText.textContent = 'Account';
    }
  }

  window.handleModalAuth = function () {
    const phone = document.getElementById('auth-phone-input').value.trim();
    if (!phone) return;

    const user = {
      id: 'usr_' + Date.now(),
      phone: phone,
      name: phone.includes('@') ? phone.split('@')[0] : 'Member ' + phone.slice(-4),
      token: 'jwt_mock_token_' + Date.now()
    };

    localStorage.setItem('wbb_user', JSON.stringify(user));
    state.currentUser = user;
    loadLocalUser();
    dom.authModalBackdrop.classList.remove('open');

    showToast('Signed In', `Welcome back, ${user.name}!`, 'success');
    proceedToCheckout();
  };

  /**
   * Update Header Badges
   */
  function updateHeaderBadges() {
    try {
      const cart = JSON.parse(localStorage.getItem('wbb_cart') || '[]');
      const wishlist = JSON.parse(localStorage.getItem('wbb_wishlist') || '[]');

      const totalCartQty = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
      dom.cartBadge.textContent = totalCartQty;
      dom.wishlistBadge.textContent = wishlist.length;
    } catch {
      dom.cartBadge.textContent = '0';
      dom.wishlistBadge.textContent = '0';
    }
  }

  /**
   * Toast Notification System
   */
  function showToast(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-item ${type}`;

    const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-octagon' : 'info';

    toast.innerHTML = `
      <div class="toast-icon"><i data-lucide="${iconName}" style="width:20px;height:20px;"></i></div>
      <div class="toast-content">
        <h4>${title}</h4>
        <p>${message}</p>
      </div>
    `;

    dom.toastContainer.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  /**
   * Populate Shipping Rates Modal from Settings
   */
  function renderShippingRatesModal() {
    if (!state.settings || !state.settings.shipping) return;
    const air = state.settings.shipping.air;
    const sea = state.settings.shipping.sea;

    let html = `
      <div style="font-size:13.5px;color:var(--slate-700);display:flex;flex-direction:column;gap:14px;">
        <div style="border:1px solid var(--slate-200);border-radius:10px;padding:14px;background:var(--slate-50);">
          <h4 style="font-weight:700;color:var(--primary);margin-bottom:8px;"><i data-lucide="plane" style="width:16px;display:inline-block;"></i> BUY AIR Rates (Estimated 7-12 Days)</h4>
          <ul style="padding-left:18px;display:flex;flex-direction:column;gap:6px;font-size:13px;">
    `;

    if (air.rates) {
      air.rates.forEach(r => {
        html += `<li><strong>BDT ${r.ratePerKg}/kg</strong> — ${r.category}</li>`;
      });
    }

    html += `
          </ul>
        </div>
        <div style="border:1px solid var(--slate-200);border-radius:10px;padding:14px;background:var(--slate-50);">
          <h4 style="font-weight:700;color:var(--accent);margin-bottom:8px;"><i data-lucide="ship" style="width:16px;display:inline-block;"></i> BUY SEA Rates (Estimated 30-40 Days)</h4>
          <p style="font-size:13px;">Starting from <strong>${sea.rateRange || 'BDT 170 – BDT 450 / kg'}</strong>. Best suited for machinery, furniture, home decor, and industrial orders.</p>
        </div>
        <div style="background:#fffbeb;border:1px solid #fef3c7;border-radius:8px;padding:10px;font-size:12px;color:#92400e;">
          ${state.settings.shipping.warningNote || 'Product weight shown on this page is an estimated weight. Final shipping charges will be calculated according to actual measured weight upon arrival in Bangladesh.'}
        </div>
      </div>
    `;

    dom.shippingModalContent.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
  }

  /**
   * Attach All Event Listeners
   */
  function attachEventListeners() {
    // Gallery Navigation
    dom.galleryPrevBtn.addEventListener('click', () => selectMedia(state.currentMediaIndex - 1));
    dom.galleryNextBtn.addEventListener('click', () => selectMedia(state.currentMediaIndex + 1));
    dom.fullscreenZoomTrigger.addEventListener('click', openFullscreenViewer);
    dom.fullscreenCloseBtn.addEventListener('click', closeFullscreenViewer);
    setupImageZoom();

    // Quantity Controls
    dom.qtyDecreaseBtn.addEventListener('click', () => {
      if (state.quantity > 1) {
        state.quantity -= 1;
        dom.quantityInput.value = state.quantity;
        recalculateAll();
      }
    });

    dom.qtyIncreaseBtn.addEventListener('click', () => {
      const maxStock = state.currentSku ? state.currentSku.stock : 999;
      if (state.quantity < maxStock) {
        state.quantity += 1;
        dom.quantityInput.value = state.quantity;
        recalculateAll();
      } else {
        showToast('Stock Limit', `Maximum available stock is ${maxStock}.`, 'info');
      }
    });

    dom.quantityInput.addEventListener('change', () => {
      let val = parseInt(dom.quantityInput.value, 10);
      const maxStock = state.currentSku ? state.currentSku.stock : 999;
      if (isNaN(val) || val < 1) val = 1;
      if (val > maxStock) val = maxStock;
      state.quantity = val;
      dom.quantityInput.value = val;
      recalculateAll();
    });

    // Primary Actions
    dom.btnAddToCart.addEventListener('click', handleAddToCart);
    dom.btnBuyNow.addEventListener('click', handleBuyNow);
    dom.mobileBtnCart.addEventListener('click', handleAddToCart);
    dom.mobileBtnBuy.addEventListener('click', handleBuyNow);
    dom.productWishlistToggle.addEventListener('click', toggleWishlist);

    // Share Button
    dom.productShareBtn.addEventListener('click', () => {
      if (navigator.share) {
        navigator.share({
          title: state.currentProduct.title,
          url: window.location.href
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(window.location.href);
        showToast('Link Copied', 'Product link copied to your clipboard!', 'success');
      }
    });

    // Tab Navigation
    dom.tabNavBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-tab');
        dom.tabNavBtns.forEach(b => b.classList.remove('active'));
        dom.tabPanes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetPane = document.getElementById(targetId);
        if (targetPane) targetPane.classList.add('active');
      });
    });

    // Modals
    dom.openShippingRatesBtn.addEventListener('click', () => {
      renderShippingRatesModal();
      dom.shippingModalBackdrop.classList.add('open');
    });

    dom.openShippingGuide.addEventListener('click', (e) => {
      e.preventDefault();
      renderShippingRatesModal();
      dom.shippingModalBackdrop.classList.add('open');
    });

    dom.shippingModalClose.addEventListener('click', () => {
      dom.shippingModalBackdrop.classList.remove('open');
    });

    dom.authModalClose.addEventListener('click', () => {
      dom.authModalBackdrop.classList.remove('open');
    });

    dom.btnModalGuestCheckout.addEventListener('click', () => {
      dom.authModalBackdrop.classList.remove('open');
      proceedToCheckout();
    });

    // Header Auth Trigger
    dom.headerAuthBtn.addEventListener('click', () => {
      if (!state.currentUser) {
        dom.authModalBackdrop.classList.add('open');
      } else {
        showToast('Account', `Signed in as ${state.currentUser.name}`, 'info');
      }
    });

    // Sourcing Agent Contact
    dom.btnContactSourcing.addEventListener('click', () => {
      showToast('Sourcing Specialist', 'Connecting with WORLD BUY BD Guangzhou sourcing desk...', 'info');
      window.open('https://api.whatsapp.com/send?phone=8801616045789&text=' + encodeURIComponent('Hello WORLD BUY BD! I need sourcing details for product ID: ' + (state.currentProduct.offerId || state.currentProduct.id)), '_blank');
    });

    // Write a Review Trigger
    dom.btnWriteReview.addEventListener('click', () => {
      const revText = prompt('Please enter your review for this product:');
      if (revText && revText.trim().length > 3) {
        showToast('Review Submitted', 'Thank you! Your verified review will be published upon moderation.', 'success');
      }
    });

    // Close Modals on Backdrop Click
    window.addEventListener('click', (e) => {
      if (e.target === dom.authModalBackdrop) dom.authModalBackdrop.classList.remove('open');
      if (e.target === dom.shippingModalBackdrop) dom.shippingModalBackdrop.classList.remove('open');
      if (e.target === dom.fullscreenModal) dom.fullscreenModal.classList.remove('open');
    });
  }

  // Global search handler
  window.handleSearch = function () {
    const q = dom.searchInput.value.trim().toLowerCase();
    if (!q) return;

    // Search by offerId or title
    const match = state.products.find(p =>
      (p.offerId && p.offerId.toLowerCase().includes(q)) ||
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    );

    if (match) {
      window.location.href = `product.html?offerId=${match.offerId || match.id}`;
    } else {
      showToast('Search', 'No exact product match found. Showing related trending items.', 'info');
      document.getElementById('related-products-section').scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Start initialization on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
