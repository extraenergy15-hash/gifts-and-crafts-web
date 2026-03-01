// === 1. Configuration & Data (Updated for Snehacrafts) ===
const productsConfig = [
    { 
        id: 1, title: "Terracotta Artisan Vase", price: 85, originalPrice: 110, category: "ceramic", stock: 3, 
        img: "https://images.unsplash.com/photo-1617361270806-c4ae3c316a3c?auto=format&fit=crop&w=600&q=80", 
        glb: "https://modelviewer.dev/shared-assets/models/Astronaut.glb", // Using sample AR
        desc: "Hand-thrown by master artisans. This terracotta vase is the ultimate centerpiece for the modern, mindful home, bringing earthy warmth to any room.",
        specs: ["Reclaimed Natural Clay", "Solar Kiln Fired", "Dimensions: 8\" D x 10\" H", "Handcrafted in Artisan Valley"]
    },
    { 
        id: 2, title: "Organic Macrame Wall Hanging", price: 120, category: "decor", stock: 12, 
        img: "https://images.unsplash.com/photo-1522771730849-478c24f46487?auto=format&fit=crop&w=600&q=80", 
        glb: "https://modelviewer.dev/shared-assets/models/shishkebab.glb",
        desc: "Add texture to your sanctuary with this 100% organic cotton macrame piece. Knotted by hand, it offers a soothing, bohemian aesthetic.",
        specs: ["100% Organic Cotton Cord", "Sustainably Sourced Wood Drift", "Dimensions: 30\" x 45\"", "Hand-knotted"]
    },
    { 
        id: 3, title: "Carved Teakwood Bowl", price: 65, category: "decor", stock: 2, 
        img: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=600&q=80", 
        glb: "https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/DamagedHelmet/glTF/DamagedHelmet.gltf",
        desc: "Embrace the beauty of natural wood grain. Perfect for holding fresh fruit or standing alone as a sculptural piece on your dining table.",
        specs: ["Responsibly sourced Teak", "Food-safe natural oil finish", "Water-resistant", "Each piece is completely unique"]
    },
    { 
        id: 4, title: "Woven Rattan Basket", price: 55, category: "textile", stock: 8, 
        img: "https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&w=600&q=80", 
        glb: "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
        desc: "Beautiful and practical storage. Hand-woven by artisans using sustainably harvested rattan, perfect for storing textiles or magazines.",
        specs: ["Sustainably harvested rattan", "Lightweight but durable", "Hand-woven design"]
    }
];

// === 2. Proxy State Management ===
const CART_KEY = 'snehacrafts_cart';
const WISHLIST_KEY = 'snehacrafts_wishlist';
const PREFS_KEY = 'snehacrafts_prefs';

const cartHandler = {
    set(target, prop, val) {
        target[prop] = val;
        if (prop === 'items' || prop === 'promoApplied') {
            localStorage.setItem(CART_KEY, JSON.stringify(target));
            window.updateCartUI();
        }
        return true;
    }
};

const wishHandler = {
    set(target, prop, val) {
        target[prop] = val;
        if (prop === 'ids') {
            localStorage.setItem(WISHLIST_KEY, JSON.stringify(target));
            window.applyFilters();
            window.updateProfileWishlistUI();
            if (document.getElementById('product-section').classList.contains('active')) {
                const activeProductId = window.currentPDPId;
                if(activeProductId) window.viewProductDetails(activeProductId);
            }
        }
        return true;
    }
};

const prefsHandler = {
    set(target, prop, val) {
        target[prop] = val;
        localStorage.setItem(PREFS_KEY, JSON.stringify(target));
        return true;
    }
};

window.cartState = new Proxy(JSON.parse(localStorage.getItem(CART_KEY)) || { items: [], promoApplied: false }, cartHandler);
window.wishlistState = new Proxy(JSON.parse(localStorage.getItem(WISHLIST_KEY)) || { ids: [] }, wishHandler);
window.userPrefsState = new Proxy(JSON.parse(localStorage.getItem(PREFS_KEY)) || { saveCard: false }, prefsHandler);

// === 3. Navigation & Animations ===
window.navigateTo = (sectionId) => {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId + '-section').classList.add('active');
    
    if(sectionId !== 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

window.toggleMobileMenu = () => {
    const nav = document.getElementById('mobileNav');
    nav.classList.toggle('open');
};

document.querySelectorAll('.mobile-nav a').forEach(link => {
    link.addEventListener('click', () => {
        document.getElementById('mobileNav').classList.remove('open');
    });
});

const observeElements = () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
};

// === 4. Global AR Logic ===
window.openAR = (id, event) => {
    if (event) event.stopPropagation();
    const product = productsConfig.find(p => p.id === id);
    if (!product || !product.glb) return;

    const modal = document.getElementById('arModalOverlay');
    const viewer = document.getElementById('globalModelViewer');
    const title = document.getElementById('arModalTitle');

    viewer.src = product.glb;
    title.innerText = product.title;

    modal.style.display = 'flex';
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
        });
    });
};

window.closeAR = () => {
    const modal = document.getElementById('arModalOverlay');
    const viewer = document.getElementById('globalModelViewer');
    modal.style.opacity = '0';
    setTimeout(() => {
        modal.style.display = 'none';
        viewer.src = ''; 
    }, 300);
};

// === 5. Dynamic Product Rendering ===
window.viewProductDetails = (id) => {
    const product = productsConfig.find(p => p.id === id);
    if (!product) return;
    window.currentPDPId = id; 

    const pdpContent = document.getElementById('pdpContent');
    const isOnSale = product.originalPrice && product.price < product.originalPrice;
    const isSaved = window.wishlistState.ids.includes(product.id);
    const specsHtml = product.specs ? product.specs.map(s => `<li><i class="fa-solid fa-check text-success" style="margin-right: 8px;"></i>${s}</li>`).join('') : '';

    let stockHtml = '';
    if (product.stock > 0) {
        if (product.stock < 5) stockHtml = `<span class="stock-badge stock-low"><i class="fa-solid fa-fire"></i> Only ${product.stock} left</span>`;
        else stockHtml = `<span class="stock-badge stock-high"><i class="fa-solid fa-check"></i> In Stock</span>`;
    } else {
        stockHtml = `<span class="stock-badge stock-out"><i class="fa-solid fa-xmark"></i> Out of Stock</span>`;
    }

    pdpContent.innerHTML = `
        <div class="pdp-img-container">
            <img src="${product.img}" alt="${product.title}">
            <button class="btn btn-ar-small" onclick="window.openAR(${product.id}, event)">
                <i class="fa-solid fa-cube"></i> View in AR
            </button>
            ${isOnSale ? `<span class="card-badge">SALE</span>` : ''}
        </div>
        
        <div class="pdp-details">
            <div class="pdp-title-row">
                <h1>${product.title}</h1>
                <button onclick="window.toggleWishlist(${product.id})" class="btn-wishlist-large" style="color: ${isSaved ? 'var(--primary)' : 'var(--text-muted)'}">
                    <i class="${isSaved ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                </button>
            </div>
            
            <div class="pdp-price-row">
                <span class="pdp-price">$${product.price.toFixed(2)}</span>
                ${isOnSale ? `<span class="price-original">$${product.originalPrice.toFixed(2)}</span>` : ''}
            </div>

            <p class="pdp-desc">${product.desc}</p>
            ${specsHtml ? `<ul class="pdp-specs">${specsHtml}</ul>` : ''}
            ${stockHtml}

            <button onclick="window.addToCart(${product.id})" class="btn btn-primary btn-block" ${product.stock === 0 ? 'disabled' : ''}>
                ${product.stock === 0 ? 'Out of Stock' : 'Add to Cart - $' + product.price.toFixed(2)}
            </button>
        </div>
    `;
    
    window.navigateTo('product');
};

// === 6. Search & Filters ===
window.applyFilters = () => {
    const searchInput = document.getElementById('discoverSearch');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const activeMaterials = Array.from(document.querySelectorAll('.filter-cb:checked')).map(cb => cb.value);
    const activePrice = document.querySelector('.filter-radio:checked')?.value || 'all';
    const sortValue = document.getElementById('productSort')?.value || 'featured';

    let filteredProducts = productsConfig.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(query) || p.category.toLowerCase().includes(query);
        const matchesMaterial = activeMaterials.length === 0 || activeMaterials.includes(p.category);
        
        let matchesPrice = true;
        if (activePrice === 'under50') matchesPrice = p.price < 50;
        else if (activePrice === '50to100') matchesPrice = p.price >= 50 && p.price <= 100;
        else if (activePrice === 'over100') matchesPrice = p.price > 100;

        return matchesSearch && matchesMaterial && matchesPrice;
    });

    if (sortValue === 'priceLow') filteredProducts.sort((a, b) => a.price - b.price);
    else if (sortValue === 'priceHigh') filteredProducts.sort((a, b) => b.price - a.price);
    else if (sortValue === 'alpha') filteredProducts.sort((a, b) => a.title.localeCompare(b.title));

    renderProducts(filteredProducts);
};

window.clearAllFilters = () => {
    const searchBar = document.getElementById('discoverSearch');
    if (searchBar) searchBar.value = '';
    document.querySelectorAll('.filter-cb').forEach(cb => cb.checked = false);
    const allPriceRadio = document.querySelector('.filter-radio[value="all"]');
    if (allPriceRadio) allPriceRadio.checked = true;
    const sortDropdown = document.getElementById('productSort');
    if (sortDropdown) sortDropdown.value = 'featured';
    window.applyFilters();
};

function renderProducts(productsToRender) {
    const grid = document.getElementById('productGrid');
    const savedIds = window.wishlistState.ids;
    
    if (productsToRender.length === 0) {
        grid.innerHTML = `<div class="empty-state">
            <i class="fa-solid fa-leaf" style="font-size: 3rem; color: var(--text-muted); opacity: 0.5; margin-bottom: 16px;"></i>
            <h3>No crafts found.</h3><p class="text-muted">Try adjusting your filters.</p>
        </div>`;
        return;
    }

    grid.innerHTML = productsToRender.map(p => {
        const isOnSale = p.originalPrice && p.price < p.originalPrice;
        const discountPercent = isOnSale ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
        const isLowStock = p.stock > 0 && p.stock < 5;
        const isSaved = savedIds.includes(p.id);

        return `
        <div class="product-card">
            <button onclick="window.toggleWishlist(${p.id}, event)" class="btn-wishlist-card" style="color: ${isSaved ? 'var(--primary)' : 'var(--text-muted)'}">
                <i class="${isSaved ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
            </button>
            ${isOnSale ? `<span class="card-badge">-${discountPercent}%</span>` : ''}
            
            <div class="card-img-wrap">
                <img src="${p.img}" alt="${p.title}" onclick="window.viewProductDetails(${p.id})">
                <button class="btn-ar-small" onclick="window.openAR(${p.id}, event)">
                    <i class="fa-solid fa-cube"></i> AR
                </button>
            </div>

            <div class="card-info">
                <div>
                    <h3 class="card-title" onclick="window.viewProductDetails(${p.id})">${p.title}</h3>
                    ${isLowStock ? `<span class="card-stock-alert"><i class="fa-solid fa-fire"></i> ${p.stock} Left</span>` : ''}
                </div>
                <div class="price-row">
                    <div class="price-block">
                        ${isOnSale ? `<span class="price-original">$${p.originalPrice.toFixed(2)}</span>` : ''}
                        <span class="price-current">$${p.price.toFixed(2)}</span>
                    </div>
                    <button onclick="window.addToCart(${p.id})" class="btn btn-primary" style="padding: 10px 16px; border-radius: 50px;" ${p.stock === 0 ? 'disabled' : ''}>
                        ${p.stock === 0 ? 'Out of Stock' : '<i class="fa-solid fa-plus"></i> Add'}
                    </button>
                </div>
            </div>
        </div>`;
    }).join('');
}

// === 7. Wishlist & Profile ===
window.toggleWishlist = (productId, event) => {
    if (event) event.stopPropagation();
    let currentIds = [...window.wishlistState.ids];
    const index = currentIds.indexOf(productId);
    if (index > -1) currentIds.splice(index, 1);
    else currentIds.push(productId);
    window.wishlistState.ids = currentIds;
};

window.updateProfileWishlistUI = () => {
    const container = document.getElementById('wishlistScrollContainer');
    const label = document.getElementById('wishlistCountLabel');
    const btn = document.getElementById('addAllToCartBtn');
    if (!container) return;

    const savedIds = window.wishlistState.ids;
    label.innerText = `${savedIds.length} Item${savedIds.length !== 1 ? 's' : ''}`;
    btn.style.display = savedIds.length > 0 ? 'inline-block' : 'none';

    if (savedIds.length === 0) {
        container.innerHTML = `<div class="empty-state" style="width: 100%;"><p>No favorites saved yet. Start exploring!</p></div>`;
        return;
    }

    const savedProducts = savedIds.map(id => productsConfig.find(p => p.id === id)).filter(Boolean);
    container.innerHTML = savedProducts.map(p => `
        <div class="wishlist-item">
            <button onclick="window.toggleWishlist(${p.id}, event)" class="btn-wishlist-remove">
                <i class="fa-solid fa-xmark"></i>
            </button>
            <div class="wishlist-img-box">
                <img src="${p.img}" alt="${p.title}" onclick="window.viewProductDetails(${p.id})">
            </div>
            <div class="wishlist-info">
                <h5 onclick="window.viewProductDetails(${p.id})">${p.title}</h5>
                <p>$${p.price.toFixed(2)}</p>
            </div>
        </div>
    `).join('');
};

window.addAllWishlistToCart = () => {
    const savedIds = window.wishlistState.ids;
    if (savedIds.length === 0) return;
    const currentCart = [...window.cartState.items];
    savedIds.forEach(id => {
        const product = productsConfig.find(p => p.id === id);
        if (!product) return;
        const existing = currentCart.find(item => item.id === id);
        if (existing) existing.qty++;
        else currentCart.push({ id: product.id, title: product.title, price: product.price, qty: 1, img: product.img });
    });
    window.cartState.items = currentCart;
    window.toggleCart(true);
};

// === 8. Cart & Promo Logic ===
window.toggleCart = (forceOpen = false) => {
    const drawer = document.getElementById('cartDrawer');
    if(forceOpen === true) drawer.classList.add('open');
    else drawer.classList.toggle('open');
};

window.addToCart = (productId) => {
    const product = productsConfig.find(p => p.id === productId);
    if (!product) return;
    const currentItems = [...window.cartState.items];
    const existing = currentItems.find(i => i.id === productId);
    if (existing) existing.qty++;
    else currentItems.push({ id: product.id, title: product.title, price: product.price, qty: 1, img: product.img });
    window.cartState.items = currentItems;
    window.toggleCart(true);
};

window.updateQuantity = (id, change) => {
    let currentItems = [...window.cartState.items];
    const index = currentItems.findIndex(i => i.id === id);
    if (index > -1) {
        currentItems[index].qty += change;
        if (currentItems[index].qty <= 0) currentItems.splice(index, 1);
        window.cartState.items = currentItems;
    }
};

window.applyPromoCode = () => {
    const input = document.getElementById('promoInput');
    const feedback = document.getElementById('promoFeedback');
    const code = input.value.trim().toUpperCase();
    if (code === "SNEHA10") {
        window.cartState.promoApplied = true;
        feedback.innerText = "Code applied successfully!";
        feedback.classList.add('text-success');
        feedback.classList.remove('text-brand');
        feedback.style.display = "block";
    } else {
        window.cartState.promoApplied = false;
        feedback.innerText = "Invalid promo code.";
        feedback.classList.remove('text-success');
        feedback.classList.add('text-brand');
        feedback.style.display = "block";
    }
    window.updateCartUI(); 
};

window.updateCartUI = () => {
    const container = document.getElementById('cartItems');
    const countBadge = document.getElementById('cartCount');
    const subtotalEl = document.getElementById('cartSubtotal');
    const discountEl = document.getElementById('cartDiscount');
    const totalEl = document.getElementById('cartTotal');
    const promoRow = document.getElementById('promoRow');
    const promoAmountEl = document.getElementById('promoAmount');
    
    const statusText = document.getElementById('shippingStatusText');
    const progressBar = document.getElementById('shippingProgressBar');
    const upsellContainer = document.getElementById('cartUpsell');
    const upsellList = document.getElementById('upsellList');
    const threshold = 150;
    
    if (!container) return;

    const items = window.cartState.items || [];
    const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);

    if (countBadge) {
        countBadge.innerText = totalQty;
        countBadge.classList.toggle('active', totalQty > 0);
    }

    if (statusText && progressBar) {
        const remaining = threshold - subtotal;
        progressBar.style.width = `${Math.min((subtotal / threshold) * 100, 100)}%`;
        
        if (subtotal <= 0) {
            statusText.innerText = `Free Shipping at $${threshold.toFixed(2)}`;
            progressBar.style.background = 'var(--border)';
        } else if (remaining > 0) {
            statusText.innerHTML = `Add <span style="color:var(--primary)">$${remaining.toFixed(2)}</span> for Free Shipping`;
            progressBar.style.background = 'var(--primary)';
        } else {
            statusText.innerHTML = `<span style="color:var(--success)"><i class="fa-solid fa-circle-check"></i> Free Shipping Unlocked!</span>`;
            progressBar.style.background = 'var(--success)';
        }

        if (remaining > 0 && remaining <= 50 && upsellContainer && upsellList) {
            upsellContainer.style.display = 'block';
            const currentIds = items.map(i => i.id);
            const suggestions = productsConfig.filter(p => !currentIds.includes(p.id)).slice(0, 2);
            
            if (suggestions.length > 0) {
                upsellList.innerHTML = suggestions.map(p => `
                    <div style="min-width: 170px; background: var(--surface); border-radius: 12px; padding: 10px; display: flex; align-items: center; gap: 10px; box-shadow: var(--shadow-sm); border: 1px solid var(--border);">
                        <img src="${p.img}" alt="${p.title}" style="width: 45px; height: 45px; border-radius: 8px; object-fit: cover;">
                        <div style="flex: 1; overflow: hidden;">
                            <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-dark); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.title}</div>
                            <div style="font-size: 0.7rem; color: var(--primary); font-weight: 700;">$${p.price.toFixed(2)}</div>
                            <button type="button" onclick="window.addToCart(${p.id})" style="color: var(--text-dark); font-size: 0.65rem; font-weight: 700; margin-top: 2px; background:none; border:none; cursor:pointer;">+ Add</button>
                        </div>
                    </div>`).join('');
            } else upsellContainer.style.display = 'none';
        } else if (upsellContainer) {
            upsellContainer.style.display = 'none';
        }
    }

    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-cart-view">
                <i class="fa-solid fa-basket-shopping"></i>
                <p>Your sanctuary is currently empty.</p>
                <a href="#shop" class="btn btn-outline" onclick="window.toggleCart(false); window.navigateTo('home');">Continue Shopping</a>
            </div>`;
        
        if (subtotalEl) {
            subtotalEl.innerText = '$0.00'; 
            if (discountEl) discountEl.innerText = '-$0.00'; 
            if (totalEl) totalEl.innerText = '$0.00';
            if (promoRow) promoRow.style.display = 'none';
        }
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="cart-item">
            <img src="${item.img}" class="cart-item-img" alt="${item.title} product image">
            <div class="cart-item-info">
                <div class="cart-item-title">${item.title}</div>
                <div class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</div>
                
                <div class="cart-item-actions">
                    <div class="qty-controls" aria-label="Quantity controls">
                        <button type="button" class="qty-btn" aria-label="Decrease quantity" onclick="window.updateQuantity(${item.id}, -1)">−</button>
                        <span class="qty-val">${item.qty}</span>
                        <button type="button" class="qty-btn" aria-label="Increase quantity" onclick="window.updateQuantity(${item.id}, 1)">+</button>
                    </div>
                    <button type="button" class="remove-btn" aria-label="Remove item" onclick="window.updateQuantity(${item.id}, -${item.qty})">Remove</button>
                </div>
            </div>
        </div>`).join('');
    
    if (subtotalEl) {
        const ecoDiscount = subtotal * 0.05;
        let promoDiscount = 0;

        if (window.cartState.promoApplied) {
            promoDiscount = subtotal * 0.10; 
            if (promoRow) promoRow.style.display = 'flex';
            if (promoAmountEl) promoAmountEl.innerText = '-$' + promoDiscount.toFixed(2);
        } else {
            if (promoRow) promoRow.style.display = 'none';
        }

        const finalTotal = subtotal - ecoDiscount - promoDiscount;
        
        subtotalEl.innerText = '$' + subtotal.toFixed(2);
        if (discountEl) discountEl.innerText = '-$' + ecoDiscount.toFixed(2);
        if (totalEl) totalEl.innerText = '$' + Math.max(0, finalTotal).toFixed(2);
    }
};

// === 9. Secure Checkout ===
window.openCheckout = () => {
    const items = window.cartState.items || [];
    if (items.length === 0) {
        console.warn("Attempted to checkout with an empty cart.");
        return; 
    }
    
    window.toggleCart(false);
    window.navigateTo('checkout');
    
    const saveCardBox = document.getElementById('saveCardCheckbox');
    if (saveCardBox) {
        saveCardBox.checked = !!window.userPrefsState.saveCard;
    }
    
    const summaryContainer = document.getElementById('checkoutSummaryItems');
    if (summaryContainer) {
        summaryContainer.innerHTML = items.map(item => `
            <div class="summary-item-row">
                <span class="text-muted">${item.qty}x ${item.title}</span>
                <span style="font-weight: 600; color: var(--text-dark);">$${(item.price * item.qty).toFixed(2)}</span>
            </div>
        `).join('');
    }

    const cartTotalEl = document.getElementById('cartTotal');
    const checkoutTotalEl = document.getElementById('checkoutFinalTotal');
    if (cartTotalEl && checkoutTotalEl) {
        checkoutTotalEl.innerText = cartTotalEl.innerText;
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.processSimulatedOrder = (event) => {
    event.preventDefault(); 
    
    const btn = document.getElementById('payBtn');
    const saveCardBox = document.getElementById('saveCardCheckbox');
    const cartTotalEl = document.getElementById('cartTotal');
    
    if (!btn || !cartTotalEl) return;

    if (saveCardBox) {
        window.userPrefsState.saveCard = saveCardBox.checked;
    }
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin" style="margin-right: 8px;"></i> Processing Payment...';

    setTimeout(() => {
        const currentDate = new Intl.DateTimeFormat('en-US', { 
            year: 'numeric', month: 'long', day: 'numeric' 
        }).format(new Date());

        window.lastOrderSnapshot = {
            orderId: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
            items: JSON.parse(JSON.stringify(window.cartState.items)), 
            total: cartTotalEl.innerText,
            date: currentDate
        };

        window.cartState.items = [];
        window.cartState.promoApplied = false;

        window.navigateTo('home');
        
        const confirmModal = document.getElementById('orderConfirmation');
        if (confirmModal) {
            confirmModal.style.display = 'flex';
        }
        
        btn.disabled = false;
        btn.innerHTML = 'Confirm Order & Pay';
        if (event.target && typeof event.target.reset === 'function') {
            event.target.reset(); 
        }

    }, 2000);
};

// === 10. MODAL GLOBAL LOGIC ===
window.continueShopping = () => {
    const confirmModal = document.getElementById('orderConfirmation');
    if (confirmModal) confirmModal.style.display = 'none';
    
    window.navigateTo('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.viewReceipt = () => {
    const order = window.lastOrderSnapshot;
    if (!order) {
        console.error("Order snapshot missing.");
        return; 
    }

    const confirmModal = document.getElementById('orderConfirmation');
    if (confirmModal) confirmModal.style.display = 'none';

    window.navigateTo('home');

    const setElText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    };

    setElText('receiptDate', order.date);
    setElText('receiptOrderNum', order.orderId);
    setElText('receiptTotal', order.total);
    
    const receiptItemsContainer = document.getElementById('receiptItems');
    if (receiptItemsContainer) {
        receiptItemsContainer.innerHTML = order.items.map(i => `
            <div class="receipt-item-row">
                <span class="text-muted">${i.qty}x ${i.title}</span>
                <span style="font-weight: 500; color: var(--text-dark);">$${(i.price * i.qty).toFixed(2)}</span>
            </div>
        `).join('');
    }
    
    const overlay = document.getElementById('receiptModalOverlay');
    const content = document.getElementById('receiptModalContent');
    
    if (overlay && content) {
        overlay.style.display = 'flex';
        setTimeout(() => {
            overlay.style.opacity = '1';
            content.style.transform = 'translateY(0)';
        }, 10);
    }
};

window.closeReceipt = () => {
    const overlay = document.getElementById('receiptModalOverlay');
    const content = document.getElementById('receiptModalContent');
    
    if (overlay && content) {
        overlay.style.opacity = '0';
        content.style.transform = 'translateY(20px)';
        
        setTimeout(() => { 
            overlay.style.display = 'none'; 
        }, 300);
    }
};

// === 11. Initialization ===
document.addEventListener('DOMContentLoaded', () => {
    const searchBar = document.getElementById('discoverSearch');
    if(searchBar) searchBar.addEventListener('input', window.applyFilters);
    document.querySelectorAll('.filter-cb, .filter-radio').forEach(input => input.addEventListener('change', window.applyFilters));
    
    window.applyFilters();
    window.updateCartUI();
    window.updateProfileWishlistUI();
    observeElements();
});
