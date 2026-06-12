// Mercado da Copa - Cart Module

let cart = [];

function initCart() {
    // Load cart from localStorage
    const stored = localStorage.getItem('mercadoCopa_cart');
    if (stored) {
        try {
            cart = JSON.parse(stored);
        } catch (e) {
            cart = [];
        }
    }

    // If Supabase is connected and user is logged in, sync with remote
    if (!isDemoMode() && isLoggedIn()) {
        syncCartFromSupabase();
    }

    updateCartUI();
    updateCartCount();
}

function saveCart() {
    localStorage.setItem('mercadoCopa_cart', JSON.stringify(cart));
    updateCartCount();
}

async function addToCart(productId) {
    const product = await getProduct(productId);
    if (!product) {
        showToast('Produto não encontrado.', 'error');
        return;
    }

    if (product.stock <= 0) {
        showToast('Produto esgotado!', 'error');
        return;
    }

    const existingItem = cart.find(item => item.product_id === productId);

    if (existingItem) {
        if (existingItem.quantity >= product.stock) {
            showToast('Estoque insuficiente!', 'error');
            return;
        }
        existingItem.quantity += 1;
    } else {
        cart.push({
            product_id: productId,
            product_name: product.name,
            product_price: product.price,
            product_image: product.image_url,
            product_team: product.team,
            product_category: product.category,
            quantity: 1,
            max_stock: product.stock
        });
    }

    // Sync with Supabase if connected
    if (!isDemoMode() && isLoggedIn()) {
        const sb = getSupabase();
        const user = getUser();
        try {
            await sb.from('cart_items').upsert({
                user_id: user.id,
                product_id: productId,
                quantity: existingItem ? existingItem.quantity : 1
            }, { onConflict: 'user_id,product_id' });
        } catch (err) {
            console.warn('Could not sync cart to Supabase:', err);
        }
    }

    saveCart();
    updateCartUI();
    showToast(`${product.name} adicionado ao carrinho!`, 'success');

    // Animate the cart button
    const cartBtn = document.getElementById('btn-cart');
    if (cartBtn) {
        cartBtn.classList.add('animate-scale-in');
        setTimeout(() => cartBtn.classList.remove('animate-scale-in'), 300);
    }
}

async function removeFromCart(productId) {
    cart = cart.filter(item => item.product_id !== productId);

    // Sync with Supabase
    if (!isDemoMode() && isLoggedIn()) {
        const sb = getSupabase();
        const user = getUser();
        try {
            await sb.from('cart_items')
                .delete()
                .eq('user_id', user.id)
                .eq('product_id', productId);
        } catch (err) {
            console.warn('Could not remove from Supabase cart:', err);
        }
    }

    saveCart();
    updateCartUI();
    showToast('Item removido do carrinho.', 'success');
}

async function updateCartItemQty(productId, newQty) {
    const item = cart.find(i => i.product_id === productId);
    if (!item) return;

    if (newQty <= 0) {
        removeFromCart(productId);
        return;
    }

    if (newQty > item.max_stock) {
        showToast('Estoque insuficiente!', 'error');
        return;
    }

    item.quantity = newQty;

    // Sync with Supabase
    if (!isDemoMode() && isLoggedIn()) {
        const sb = getSupabase();
        const user = getUser();
        try {
            await sb.from('cart_items')
                .update({ quantity: newQty })
                .eq('user_id', user.id)
                .eq('product_id', productId);
        } catch (err) {
            console.warn('Could not update Supabase cart:', err);
        }
    }

    saveCart();
    updateCartUI();
}

function getCartTotal() {
    return cart.reduce((total, item) => total + (item.product_price * item.quantity), 0);
}

function getCartItemCount() {
    return cart.reduce((count, item) => count + item.quantity, 0);
}

function updateCartCount() {
    const countElements = document.querySelectorAll('#cart-count');
    const count = getCartItemCount();

    countElements.forEach(el => {
        el.textContent = count;
        if (count > 0) {
            el.classList.add('show');
        } else {
            el.classList.remove('show');
        }
    });
}

function updateCartUI() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartFooter = document.getElementById('cart-footer');
    const cartTotalValue = document.getElementById('cart-total-value');

    if (!cartItemsContainer) return;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="cart-empty">
                <div class="cart-empty-icon">🛒</div>
                <div class="cart-empty-text">Seu carrinho está vazio</div>
                <p style="color: var(--text-muted); font-size: 0.8rem; margin-top: 8px;">
                    Explore nossos produtos e adicione itens!
                </p>
            </div>
        `;
        if (cartFooter) cartFooter.style.display = 'none';
        return;
    }

    if (cartFooter) cartFooter.style.display = 'block';

    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item animate-fade-in" data-product-id="${item.product_id}">
            <img src="${item.product_image}" alt="${item.product_name}" class="cart-item-image"
                 onerror="this.src='assets/images/placeholder.svg'; this.onerror=null;">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.product_name}</div>
                <div class="cart-item-price">${formatPrice(item.product_price)}</div>
                <div class="cart-item-qty">
                    <button class="qty-btn" onclick="updateCartItemQty('${item.product_id}', ${item.quantity - 1})">−</button>
                    <span class="qty-value">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateCartItemQty('${item.product_id}', ${item.quantity + 1})">+</button>
                </div>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart('${item.product_id}')" aria-label="Remover">
                🗑️
            </button>
        </div>
    `).join('');

    if (cartTotalValue) {
        cartTotalValue.textContent = formatPrice(getCartTotal());
    }

    updateCartCount();
}

function openCart() {
    const overlay = document.getElementById('cart-overlay');
    const drawer = document.getElementById('cart-drawer');
    if (overlay) overlay.classList.add('open');
    if (drawer) drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    const overlay = document.getElementById('cart-overlay');
    const drawer = document.getElementById('cart-drawer');
    if (overlay) overlay.classList.remove('open');
    if (drawer) drawer.classList.remove('open');
    document.body.style.overflow = '';
}

function setupCartListeners() {
    // Open cart button
    const btnCart = document.getElementById('btn-cart');
    if (btnCart) {
        btnCart.addEventListener('click', (e) => {
            e.preventDefault();
            openCart();
        });
    }

    // Close cart button
    const cartClose = document.getElementById('cart-close');
    if (cartClose) {
        cartClose.addEventListener('click', closeCart);
    }

    // Close cart on overlay click
    const cartOverlay = document.getElementById('cart-overlay');
    if (cartOverlay) {
        cartOverlay.addEventListener('click', (e) => {
            if (e.target === cartOverlay) {
                closeCart();
            }
        });
    }

    // Checkout button
    const checkoutBtn = document.getElementById('btn-checkout');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }
}

async function handleCheckout() {
    if (cart.length === 0) {
        showToast('Seu carrinho está vazio!', 'error');
        return;
    }

    if (!isLoggedIn()) {
        showToast('Faça login para finalizar a compra!', 'error');
        closeCart();
        setTimeout(() => {
            window.location.href = 'profile.html';
        }, 1000);
        return;
    }

    const user = getUser();
    const total = getCartTotal();

    if (isDemoMode()) {
        // Demo mode: simulate order
        const order = {
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            user_id: user.id,
            total: total,
            status: 'completed',
            items: cart.map(item => ({
                product_name: item.product_name,
                quantity: item.quantity,
                price: item.product_price,
                product_image: item.product_image
            }))
        };

        // Save order to localStorage
        const orders = JSON.parse(localStorage.getItem('mercadoCopa_orders') || '[]');
        orders.unshift(order);
        localStorage.setItem('mercadoCopa_orders', JSON.stringify(orders));

        // Update stock for each product
        for (const item of cart) {
            await updateStock(item.product_id, -item.quantity);
        }

        // Clear cart
        cart = [];
        saveCart();
        updateCartUI();
        closeCart();

        showToast(`Compra de ${formatPrice(total)} realizada com sucesso! 🎉`, 'success');
    } else {
        // Supabase mode: create real order
        const sb = getSupabase();

        try {
            // Create order
            const { data: orderData, error: orderError } = await sb.from('orders').insert([{
                user_id: user.id,
                total: total,
                status: 'completed'
            }]).select().single();

            if (orderError) throw orderError;

            // Create order items
            const orderItems = cart.map(item => ({
                order_id: orderData.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.product_price,
                product_name: item.product_name
            }));

            const { error: itemsError } = await sb.from('order_items').insert(orderItems);
            if (itemsError) throw itemsError;

            // Decrement stock for each product
            for (const item of cart) {
                try {
                    await sb.rpc('decrement_stock', {
                        product_id: item.product_id,
                        qty: item.quantity
                    });
                } catch (rpcErr) {
                    // Fallback: manual update
                    await updateStock(item.product_id, -item.quantity);
                }
            }

            // Clear Supabase cart
            await sb.from('cart_items').delete().eq('user_id', user.id);

            // Clear local cart
            cart = [];
            saveCart();
            updateCartUI();
            closeCart();

            showToast(`Compra de ${formatPrice(total)} realizada com sucesso! 🎉`, 'success');
        } catch (err) {
            console.error('Checkout error:', err);
            showToast('Erro ao finalizar compra. Tente novamente.', 'error');
        }
    }
}

async function syncCartFromSupabase() {
    if (isDemoMode() || !isLoggedIn()) return;

    const sb = getSupabase();
    const user = getUser();

    try {
        const { data, error } = await sb
            .from('cart_items')
            .select('*, products(*)')
            .eq('user_id', user.id);

        if (error) {
            console.warn('Could not sync cart from Supabase:', error);
            return;
        }

        if (data && data.length > 0) {
            cart = data.map(item => ({
                product_id: item.product_id,
                product_name: item.products.name,
                product_price: item.products.price,
                product_image: item.products.image_url,
                product_team: item.products.team,
                product_category: item.products.category,
                quantity: item.quantity,
                max_stock: item.products.stock
            }));
            saveCart();
            updateCartUI();
        }
    } catch (err) {
        console.warn('Error syncing cart:', err);
    }
}

function getOrders() {
    if (isDemoMode()) {
        return JSON.parse(localStorage.getItem('mercadoCopa_orders') || '[]');
    }
    return [];
}

async function fetchOrders() {
    if (isDemoMode()) {
        return getOrders();
    }

    if (!isLoggedIn()) return [];

    const sb = getSupabase();
    const user = getUser();

    try {
        const { data: orders, error } = await sb
            .from('orders')
            .select('*, order_items(*)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching orders:', error);
            return [];
        }

        return orders || [];
    } catch (err) {
        console.error('Error fetching orders:', err);
        return [];
    }
}
