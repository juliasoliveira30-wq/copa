// Mercado da Copa - Main App Module
// Initializes all modules and handles page-specific logic

// ============================================
// TOAST NOTIFICATION SYSTEM
// ============================================
let toastTimeout = null;

function showToast(message, type = 'success') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    if (toastTimeout) {
        clearTimeout(toastTimeout);
    }

    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Auto-hide after 3 seconds
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Supabase
    initSupabase();

    // Initialize auth
    initAuth();

    // Initialize cart
    initCart();
    setupCartListeners();

    // Detect current page and initialize accordingly
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';

    if (page === 'index.html' || page === '' || page === '/') {
        initHomePage();
    } else if (page === 'shop.html') {
        initShopPage();
    } else if (page === 'profile.html') {
        initProfilePage();
    }
});

// ============================================
// HOME PAGE
// ============================================
async function initHomePage() {
    // Load featured products
    const featuredContainer = document.getElementById('featured-products');
    if (!featuredContainer) return;

    try {
        const products = await fetchProducts({});
        // Show first 4 products as featured
        const featured = products.slice(0, 4);

        if (featured.length > 0) {
            featuredContainer.innerHTML = featured.map(p => renderProductCard(p)).join('');
            attachAddToCartListeners(featuredContainer);
        } else {
            featuredContainer.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-state-icon">⚽</div>
                    <div class="empty-state-text">Nenhum produto disponível no momento</div>
                </div>
            `;
        }

        // Update stats
        const allProducts = await fetchProducts({});
        const teams = [...new Set(allProducts.map(p => p.team))];
        const categories = [...new Set(allProducts.map(p => p.category))];

        const statProducts = document.getElementById('stat-products');
        const statTeams = document.getElementById('stat-teams');
        const statCategories = document.getElementById('stat-categories');

        if (statProducts) animateNumber(statProducts, allProducts.length);
        if (statTeams) animateNumber(statTeams, teams.length);
        if (statCategories) animateNumber(statCategories, categories.length);
    } catch (err) {
        console.error('Error loading home page:', err);
        featuredContainer.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state-icon">😢</div>
                <div class="empty-state-text">Erro ao carregar produtos</div>
            </div>
        `;
    }

    // Category card click (home page)
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            if (category === 'all') {
                window.location.href = 'shop.html';
            } else {
                window.location.href = `shop.html?category=${category}`;
            }
        });
    });
}

// ============================================
// SHOP PAGE
// ============================================
let currentFilters = {
    category: null,
    sortBy: null,
    search: ''
};

async function initShopPage() {
    // Check URL params for initial category filter
    const urlParams = new URLSearchParams(window.location.search);
    const initialCategory = urlParams.get('category');
    if (initialCategory) {
        currentFilters.category = initialCategory;

        // Activate the correct filter chip
        document.querySelectorAll('.filter-chip[data-category]').forEach(chip => {
            chip.classList.remove('active');
            if (chip.dataset.category === initialCategory) {
                chip.classList.add('active');
            }
        });
    }

    // Load products
    await loadShopProducts();

    // Setup search
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentFilters.search = searchInput.value.trim();
                loadShopProducts();
            }, 300);
        });
    }

    // Setup filter chips
    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const category = chip.dataset.category;
            const sort = chip.dataset.sort;

            if (category) {
                // Remove active from all category chips
                document.querySelectorAll('.filter-chip[data-category]').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                currentFilters.category = category === 'all' ? null : category;
            }

            if (sort) {
                // Toggle sort
                document.querySelectorAll('.filter-chip[data-sort]').forEach(c => c.classList.remove('active'));
                if (currentFilters.sortBy === sort) {
                    currentFilters.sortBy = null;
                } else {
                    currentFilters.sortBy = sort;
                    chip.classList.add('active');
                }
            }

            loadShopProducts();
        });
    });

    // Setup product modal
    setupProductModal();
}

async function loadShopProducts() {
    const container = document.getElementById('products-container');
    const resultsCount = document.getElementById('results-count');
    if (!container) return;

    // Show loading
    container.innerHTML = `
        <div class="skeleton skeleton-card"></div>
        <div class="skeleton skeleton-card"></div>
        <div class="skeleton skeleton-card"></div>
        <div class="skeleton skeleton-card"></div>
    `;

    try {
        const filters = {};
        if (currentFilters.category) filters.category = currentFilters.category;
        if (currentFilters.sortBy) filters.sortBy = currentFilters.sortBy;
        if (currentFilters.search) filters.search = currentFilters.search;

        const products = await fetchProducts(filters);

        if (products.length > 0) {
            container.innerHTML = products.map(p => renderProductCard(p)).join('');
            attachAddToCartListeners(container);
            attachProductClickListeners(container);
        } else {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <span class="empty-state-icon">🔍</span>
                    <div class="empty-state-text">Nenhum produto encontrado</div>
                    <p style="color: var(--text-muted); font-size: 0.8rem; margin-top: 8px;">
                        Tente ajustar seus filtros ou busque por outro termo.
                    </p>
                </div>
            `;
        }

        if (resultsCount) {
            resultsCount.textContent = `${products.length} produto${products.length !== 1 ? 's' : ''} encontrado${products.length !== 1 ? 's' : ''}`;
        }
    } catch (err) {
        console.error('Error loading products:', err);
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <span class="empty-state-icon">😢</span>
                <div class="empty-state-text">Erro ao carregar produtos</div>
            </div>
        `;
    }
}

function setupProductModal() {
    const modalOverlay = document.getElementById('product-modal');
    const modalClose = document.getElementById('modal-close');

    if (modalClose) {
        modalClose.addEventListener('click', () => {
            modalOverlay.classList.remove('open');
        });
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove('open');
            }
        });
    }
}

async function openProductModal(productId) {
    const product = await getProduct(productId);
    if (!product) return;

    const modalOverlay = document.getElementById('product-modal');
    const modalTitle = document.getElementById('modal-product-title');
    const modalBody = document.getElementById('modal-product-body');

    if (modalTitle) modalTitle.textContent = product.name;
    if (modalBody) {
        // Stock status helpers
        let stockStatusHTML = '';
        let stockBarWidth = Math.min((product.stock / 10) * 100, 100);
        let stockBarColor = 'var(--accent-gradient)';
        
        if (product.stock <= 0) {
            stockStatusHTML = '<span style="color: var(--red-light); font-weight: 700; font-size: 0.85rem;">❌ Esgotado</span>';
            stockBarColor = 'rgba(193, 39, 45, 0.5)';
        } else if (product.stock === 1) {
            stockStatusHTML = '<span style="color: var(--red-light); font-weight: 700; font-size: 0.85rem; animation: pulse 1.5s infinite;">🔥 Última unidade!</span>';
            stockBarColor = 'linear-gradient(90deg, #C1272D, #E63946)';
        } else if (product.stock <= 3) {
            stockStatusHTML = `<span style="color: var(--gold); font-weight: 700; font-size: 0.85rem;">⚠️ Apenas ${product.stock} em estoque</span>`;
            stockBarColor = 'linear-gradient(90deg, #D4AF37, #F0D060)';
        } else {
            stockStatusHTML = `<span style="color: var(--green-light); font-weight: 600; font-size: 0.85rem;">✅ ${product.stock} em estoque</span>`;
        }

        modalBody.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="${product.image_url}" alt="${product.name}" 
                     style="width: 100%; max-height: 250px; object-fit: contain; border-radius: var(--radius-sm); background: var(--bg-primary);"
                     onerror="this.src='assets/images/placeholder.svg'; this.onerror=null;">
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                <span class="badge">${getCategoryIcon(product.category)} ${getCategoryName(product.category)}</span>
                <span class="badge-stock">${product.team}</span>
            </div>
            <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 16px; line-height: 1.6;">
                ${product.description || 'Sem descrição disponível.'}
            </p>
            
            <!-- Stock Indicator -->
            <div style="background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">📦 Estoque</span>
                    ${stockStatusHTML}
                </div>
                <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                    <div style="width: ${stockBarWidth}%; height: 100%; background: ${stockBarColor}; border-radius: 3px; transition: width 0.6s ease;"></div>
                </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--bg-card); border-radius: var(--radius-sm); border: 1px solid var(--glass-border);">
                <div>
                    <div class="price-tag" style="font-size: 1.5rem;">${formatPrice(product.price)}</div>
                </div>
                <button class="btn btn-primary" onclick="addToCart('${product.id}'); document.getElementById('product-modal').classList.remove('open');" 
                        ${product.stock <= 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                    ${product.stock > 0 ? '🛒 Comprar' : 'Esgotado'}
                </button>
            </div>
        `;
    }

    if (modalOverlay) modalOverlay.classList.add('open');
}

function attachProductClickListeners(container) {
    if (!container) return;
    container.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Don't open modal if clicking the add-to-cart button
            if (e.target.closest('.add-cart-btn')) return;

            const productId = card.dataset.productId;
            if (productId) openProductModal(productId);
        });
    });
}

// ============================================
// PROFILE PAGE
// ============================================
async function initProfilePage() {
    updateAuthUI();
    setupProfileListeners();

    if (isLoggedIn()) {
        showProfileDashboard();
        await loadProfileData();
    } else {
        showAuthSection();
    }
}

function showProfileDashboard() {
    const authSection = document.getElementById('auth-section');
    const profileSection = document.getElementById('profile-section');

    if (authSection) authSection.classList.add('hidden');
    if (profileSection) profileSection.classList.remove('hidden');
}

function showAuthSection() {
    const authSection = document.getElementById('auth-section');
    const profileSection = document.getElementById('profile-section');

    if (authSection) authSection.classList.remove('hidden');
    if (profileSection) profileSection.classList.add('hidden');
}

function setupProfileListeners() {
    // Auth tabs
    const tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;

            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const loginForm = document.getElementById('login-form');
            const registerForm = document.getElementById('register-form');

            if (targetTab === 'login') {
                if (loginForm) loginForm.classList.remove('hidden');
                if (registerForm) registerForm.classList.add('hidden');
            } else {
                if (loginForm) loginForm.classList.add('hidden');
                if (registerForm) registerForm.classList.remove('hidden');
            }
        });
    });

    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            const btnLogin = document.getElementById('btn-login');
            if (btnLogin) {
                btnLogin.disabled = true;
                btnLogin.textContent = 'Entrando...';
            }

            const result = await signIn(email, password);

            if (result.error) {
                showToast(result.error, 'error');
            } else {
                showToast(`Bem-vindo de volta, ${result.user.name}! ⚽`, 'success');
                showProfileDashboard();
                await loadProfileData();
            }

            if (btnLogin) {
                btnLogin.disabled = false;
                btnLogin.textContent = 'Entrar ⚡';
            }
        });
    }

    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;

            const btnRegister = document.getElementById('btn-register');
            if (btnRegister) {
                btnRegister.disabled = true;
                btnRegister.textContent = 'Criando conta...';
            }

            const result = await signUp(email, password, name);

            if (result.error) {
                showToast(result.error, 'error');
            } else {
                showToast(`Conta criada com sucesso! Bem-vindo, ${result.user.name}! 🎉`, 'success');
                showProfileDashboard();
                await loadProfileData();
            }

            if (btnRegister) {
                btnRegister.disabled = false;
                btnRegister.textContent = 'Criar conta 🚀';
            }
        });
    }

    // Logout
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            await signOut();
            showAuthSection();
            showToast('Você saiu da conta. Até logo! 👋', 'success');
        });
    }

    // Add product button
    const btnAddProduct = document.getElementById('btn-add-product');
    if (btnAddProduct) {
        btnAddProduct.addEventListener('click', () => {
            const modal = document.getElementById('add-product-modal');
            if (modal) modal.classList.add('open');
        });
    }

    // Close add product modal
    const addProductClose = document.getElementById('add-product-close');
    if (addProductClose) {
        addProductClose.addEventListener('click', () => {
            const modal = document.getElementById('add-product-modal');
            if (modal) modal.classList.remove('open');
        });
    }

    // Close modal on overlay click
    const addProductModal = document.getElementById('add-product-modal');
    if (addProductModal) {
        addProductModal.addEventListener('click', (e) => {
            if (e.target === addProductModal) {
                addProductModal.classList.remove('open');
            }
        });
    }

    // Add product form
    const addProductForm = document.getElementById('add-product-form');
    if (addProductForm) {
        addProductForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const productData = {
                name: document.getElementById('product-name').value,
                description: document.getElementById('product-description').value,
                category: document.getElementById('product-category').value,
                team: document.getElementById('product-team').value,
                price: document.getElementById('product-price').value,
                stock: document.getElementById('product-stock').value,
                image_url: document.getElementById('product-image').value || ''
            };

            const result = await createProduct(productData);

            if (result.error) {
                showToast(result.error, 'error');
            } else {
                showToast('Produto cadastrado com sucesso! 🚀', 'success');
                addProductForm.reset();
                document.getElementById('product-stock').value = '1';

                const modal = document.getElementById('add-product-modal');
                if (modal) modal.classList.remove('open');

                await loadProfileData();
            }
        });
    }
}

async function loadProfileData() {
    if (!isLoggedIn()) return;

    const user = getUser();

    // Update profile info
    const nameEl = document.getElementById('profile-name');
    const emailEl = document.getElementById('profile-email');
    const avatarEl = document.getElementById('profile-avatar');

    if (nameEl) nameEl.textContent = user.name;
    if (emailEl) emailEl.textContent = user.email;
    if (avatarEl) {
        const initials = user.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
        avatarEl.textContent = initials;
    }

    // Load user's products
    const userProducts = await getProductsByUser(user.id);
    const myProductsList = document.getElementById('my-products-list');
    if (myProductsList) {
        if (userProducts.length > 0) {
            myProductsList.innerHTML = userProducts.map(p => `
                <div class="profile-menu-item" style="cursor: default;">
                    <img src="${p.image_url}" alt="${p.name}" 
                         style="width: 50px; height: 50px; border-radius: var(--radius-sm); object-fit: cover; flex-shrink: 0;"
                         onerror="this.src='assets/images/placeholder.svg'; this.onerror=null;">
                    <div class="profile-menu-text">
                        <div class="profile-menu-title">${p.name}</div>
                        <div class="profile-menu-desc">${formatPrice(p.price)} · ${p.stock} em estoque</div>
                    </div>
                    <span class="badge">${getCategoryIcon(p.category)}</span>
                </div>
            `).join('');
        } else {
            myProductsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📦</div>
                    <div class="empty-state-text">Você ainda não cadastrou nenhum produto</div>
                </div>
            `;
        }
    }

    // Load orders
    const orders = await fetchOrders();
    const orderHistory = document.getElementById('order-history');
    if (orderHistory) {
        if (orders.length > 0) {
            orderHistory.innerHTML = orders.map(order => {
                const date = new Date(order.created_at);
                const formattedDate = date.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });

                const items = order.items || order.order_items || [];
                const statusLabel = order.status === 'completed' ? '✅ Concluído' :
                                   order.status === 'pending' ? '⏳ Pendente' : '❌ Cancelado';
                const statusClass = order.status;

                return `
                    <div class="order-card animate-fade-in">
                        <div class="order-header">
                            <span class="order-id">📋 ${formattedDate}</span>
                            <span class="order-status ${statusClass}">${statusLabel}</span>
                        </div>
                        <div class="order-items-list">
                            ${items.slice(0, 4).map(item => `
                                <div style="font-size: 0.8rem; color: var(--text-secondary);">
                                    ${item.product_name} × ${item.quantity}
                                </div>
                            `).join('')}
                            ${items.length > 4 ? `<div style="font-size: 0.8rem; color: var(--text-muted);">+${items.length - 4} itens</div>` : ''}
                        </div>
                        <div class="order-total">${formatPrice(order.total)}</div>
                    </div>
                `;
            }).join('');
        } else {
            orderHistory.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🧾</div>
                    <div class="empty-state-text">Nenhuma compra realizada ainda</div>
                </div>
            `;
        }
    }

    // Update stats
    const productsCount = document.getElementById('profile-products-count');
    const ordersCount = document.getElementById('profile-orders-count');
    const totalSpent = document.getElementById('profile-total-spent');

    if (productsCount) productsCount.textContent = userProducts.length;
    if (ordersCount) ordersCount.textContent = orders.length;
    if (totalSpent) {
        const spent = orders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
        totalSpent.textContent = formatPrice(spent);
    }
}

// ============================================
// UTILITIES
// ============================================
function attachAddToCartListeners(container) {
    if (!container) return;
    container.querySelectorAll('.add-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const productId = btn.dataset.productId;
            if (productId) addToCart(productId);
        });
    });
}

function animateNumber(element, target) {
    const start = parseInt(element.textContent) || 0;
    const duration = 800;
    const startTime = performance.now();

    function tick(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (target - start) * eased);

        element.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(tick);
        }
    }

    requestAnimationFrame(tick);
}

// Keyboard shortcut: ESC to close modals/cart
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeCart();

        // Close any open modal
        document.querySelectorAll('.modal-overlay.open').forEach(modal => {
            modal.classList.remove('open');
        });
    }
});
