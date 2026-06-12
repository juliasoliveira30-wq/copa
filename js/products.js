// Mercado da Copa - Products Module

const DEMO_PRODUCTS = [
    {
        id: 'b1a2c3d4-e5f6-7890-abcd-ef1234567801',
        name: 'Camisa Brasil 2002',
        description: 'Camisa clássica da seleção brasileira pentacampeã em 2002. Tamanho M. Estado: Ótimo.',
        price: 189.90,
        category: 'camisa',
        team: 'Brasil',
        image_url: 'assets/images/camisa_brasil.png',
        stock: 3,
        seller_id: 'demo-user',
        created_at: '2026-01-15T10:00:00.000Z'
    },
    {
        id: 'b1a2c3d4-e5f6-7890-abcd-ef1234567802',
        name: 'Camisa Argentina 1986',
        description: 'Relíquia da era Maradona. Camisa da seleção argentina campeã em 1986. Tamanho G.',
        price: 249.90,
        category: 'camisa',
        team: 'Argentina',
        image_url: 'assets/images/camisa_argentina.png',
        stock: 1,
        seller_id: 'demo-user',
        created_at: '2026-01-16T10:00:00.000Z'
    },
    {
        id: 'b1a2c3d4-e5f6-7890-abcd-ef1234567803',
        name: 'Camisa Alemanha 2014',
        description: 'Camisa da seleção alemã campeã no Brasil. Tamanho M. Estado: Bom.',
        price: 159.90,
        category: 'camisa',
        team: 'Alemanha',
        image_url: 'assets/images/camisa_alemanha.png',
        stock: 5,
        seller_id: 'demo-user',
        created_at: '2026-01-17T10:00:00.000Z'
    },
    {
        id: 'b1a2c3d4-e5f6-7890-abcd-ef1234567804',
        name: 'Camisa França 2018',
        description: 'Camisa da França bicampeã mundial em 2018. Tamanho G. Estado: Novo.',
        price: 199.90,
        category: 'camisa',
        team: 'França',
        image_url: 'assets/images/camisa_franca.png',
        stock: 2,
        seller_id: 'demo-user',
        created_at: '2026-01-18T10:00:00.000Z'
    },
    {
        id: 'b1a2c3d4-e5f6-7890-abcd-ef1234567805',
        name: 'Boné Copa 2022',
        description: 'Boné oficial da Copa do Mundo 2022 no Qatar. Aba curva, ajustável.',
        price: 79.90,
        category: 'bone',
        team: 'FIFA',
        image_url: 'assets/images/bone_copa.png',
        stock: 8,
        seller_id: 'demo-user',
        created_at: '2026-01-19T10:00:00.000Z'
    },
    {
        id: 'b1a2c3d4-e5f6-7890-abcd-ef1234567806',
        name: 'Casaco Windbreaker Copa',
        description: 'Casaco windbreaker retrô estilo anos 90 com detalhes da Copa. Tamanho G.',
        price: 299.90,
        category: 'casaco',
        team: 'FIFA',
        image_url: 'assets/images/casaco_copa.png',
        stock: 2,
        seller_id: 'demo-user',
        created_at: '2026-01-20T10:00:00.000Z'
    },
    {
        id: 'b1a2c3d4-e5f6-7890-abcd-ef1234567807',
        name: 'Boné Brasil Vintage',
        description: 'Boné verde e amarelo do Brasil, estilo vintage anos 2000. Ajustável.',
        price: 59.90,
        category: 'bone',
        team: 'Brasil',
        image_url: 'assets/images/bone 2.webp',
        stock: 4,
        seller_id: 'demo-user',
        created_at: '2026-01-21T10:00:00.000Z'
    },
    {
        id: 'b1a2c3d4-e5f6-7890-abcd-ef1234567808',
        name: 'Casaco Seleção Brasil',
        description: 'Casaco oficial do agasalho da seleção brasileira. Raridade. Tamanho GG.',
        price: 349.90,
        category: 'casaco',
        team: 'Brasil',
        image_url: 'assets/images/casaco selecao.jpg',
        stock: 1,
        seller_id: 'demo-user',
        created_at: '2026-01-22T10:00:00.000Z'
    }
];

async function fetchProducts(filters = {}) {
    if (isDemoMode()) {
        let results = [...DEMO_PRODUCTS];

        // Apply category filter
        if (filters.category) {
            results = results.filter(p => p.category === filters.category);
        }

        // Apply team filter
        if (filters.team) {
            results = results.filter(p => p.team.toLowerCase() === filters.team.toLowerCase());
        }

        // Apply search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            results = results.filter(p =>
                p.name.toLowerCase().includes(searchLower) ||
                p.description.toLowerCase().includes(searchLower) ||
                p.team.toLowerCase().includes(searchLower)
            );
        }

        // Apply price filters
        if (filters.minPrice !== undefined) {
            results = results.filter(p => p.price >= filters.minPrice);
        }
        if (filters.maxPrice !== undefined) {
            results = results.filter(p => p.price <= filters.maxPrice);
        }

        // Apply sorting
        if (filters.sortBy) {
            switch (filters.sortBy) {
                case 'price_asc':
                    results.sort((a, b) => a.price - b.price);
                    break;
                case 'price_desc':
                    results.sort((a, b) => b.price - a.price);
                    break;
                case 'name':
                    results.sort((a, b) => a.name.localeCompare(b.name));
                    break;
            }
        }

        return results;
    } else {
        const sb = getSupabase();
        let query = sb.from('products').select('*');

        if (filters.category) {
            query = query.eq('category', filters.category);
        }
        if (filters.team) {
            query = query.ilike('team', filters.team);
        }
        if (filters.search) {
            query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }
        if (filters.minPrice !== undefined) {
            query = query.gte('price', filters.minPrice);
        }
        if (filters.maxPrice !== undefined) {
            query = query.lte('price', filters.maxPrice);
        }
        if (filters.sortBy) {
            switch (filters.sortBy) {
                case 'price_asc':
                    query = query.order('price', { ascending: true });
                    break;
                case 'price_desc':
                    query = query.order('price', { ascending: false });
                    break;
                case 'name':
                    query = query.order('name', { ascending: true });
                    break;
            }
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching products:', error);
            return [];
        }
        return data || [];
    }
}

async function getProduct(id) {
    if (isDemoMode()) {
        return DEMO_PRODUCTS.find(p => p.id === id) || null;
    } else {
        const sb = getSupabase();
        const { data, error } = await sb.from('products').select('*').eq('id', id).single();
        if (error) {
            console.error('Error fetching product:', error);
            return null;
        }
        return data;
    }
}

async function createProduct(productData) {
    if (isDemoMode()) {
        const product = {
            id: crypto.randomUUID(),
            name: productData.name,
            description: productData.description || '',
            price: parseFloat(productData.price) || 0,
            category: productData.category || 'camisa',
            team: productData.team || '',
            image_url: productData.image_url || 'assets/images/camisa_brasil.png',
            stock: parseInt(productData.stock) || 1,
            seller_id: getUser()?.id || 'demo-user',
            created_at: new Date().toISOString()
        };
        DEMO_PRODUCTS.push(product);
        return { product, error: null };
    } else {
        const sb = getSupabase();
        const { data, error } = await sb.from('products').insert([{
            name: productData.name,
            description: productData.description || '',
            price: parseFloat(productData.price) || 0,
            category: productData.category || 'camisa',
            team: productData.team || '',
            image_url: productData.image_url || '',
            stock: parseInt(productData.stock) || 1,
            seller_id: getUser()?.id
        }]).select().single();

        if (error) {
            return { product: null, error: error.message };
        }
        return { product: data, error: null };
    }
}

async function updateStock(productId, quantityChange) {
    if (isDemoMode()) {
        const product = DEMO_PRODUCTS.find(p => p.id === productId);
        if (!product) {
            return { success: false, error: 'Produto não encontrado.' };
        }
        const newStock = product.stock + quantityChange;
        if (newStock < 0) {
            return { success: false, error: 'Estoque insuficiente.' };
        }
        product.stock = newStock;
        return { success: true, error: null };
    } else {
        const sb = getSupabase();
        const { data, error } = await sb.rpc('update_stock', {
            p_product_id: productId,
            p_quantity_change: quantityChange
        });

        if (error) {
            // Fallback: fetch current stock, compute new, update
            const { data: product, error: fetchErr } = await sb.from('products').select('stock').eq('id', productId).single();
            if (fetchErr) return { success: false, error: fetchErr.message };

            const newStock = product.stock + quantityChange;
            if (newStock < 0) return { success: false, error: 'Estoque insuficiente.' };

            const { error: updateErr } = await sb.from('products').update({ stock: newStock }).eq('id', productId);
            if (updateErr) return { success: false, error: updateErr.message };
            return { success: true, error: null };
        }
        return { success: true, error: null };
    }
}

async function getProductsByUser(userId) {
    if (isDemoMode()) {
        return DEMO_PRODUCTS.filter(p => p.seller_id === userId);
    } else {
        const sb = getSupabase();
        const { data, error } = await sb.from('products').select('*').eq('seller_id', userId);
        if (error) {
            console.error('Error fetching user products:', error);
            return [];
        }
        return data || [];
    }
}

function renderProductCard(product) {
    const badgeHTML = product.stock <= 2 && product.stock > 0
        ? `<span class="product-badge">Últimas unidades</span>`
        : product.stock <= 0
        ? `<span class="product-badge" style="background: var(--text-muted);">Esgotado</span>`
        : '';

    // Stock display with color coding
    let stockDisplay = '';
    if (product.stock <= 0) {
        stockDisplay = '<span class="product-stock" style="color: var(--red-light); font-weight: 600;">❌ Esgotado</span>';
    } else if (product.stock === 1) {
        stockDisplay = '<span class="product-stock" style="color: var(--red-light); font-weight: 600;">🔥 1 un.</span>';
    } else if (product.stock <= 3) {
        stockDisplay = `<span class="product-stock" style="color: var(--gold); font-weight: 600;">⚠️ ${product.stock} un.</span>`;
    } else {
        stockDisplay = `<span class="product-stock" style="color: var(--green-light);">✅ ${product.stock} un.</span>`;
    }

    return `
        <div class="product-card" data-product-id="${product.id}">
            ${badgeHTML}
            <div class="product-image">
                <img src="${product.image_url}" alt="${product.name}" loading="lazy"
                     onerror="this.src='assets/images/placeholder.svg'; this.onerror=null;">
            </div>
            <div class="product-info">
                <span class="product-team">${getCategoryIcon(product.category)} ${product.team}</span>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">${formatPrice(product.price)}</p>
            </div>
            <div class="product-footer">
                ${stockDisplay}
                <button class="add-cart-btn" data-product-id="${product.id}" ${product.stock <= 0 ? 'disabled' : ''}>
                    <span class="btn-icon">+</span>
                </button>
            </div>
        </div>
    `;
}

function renderProductGrid(products) {
    if (!products || products.length === 0) {
        return `
            <div class="empty-state">
                <span class="empty-icon">⚽</span>
                <h3>Nenhum produto encontrado</h3>
                <p>Tente ajustar seus filtros ou busque por outro termo.</p>
            </div>
        `;
    }

    const cards = products.map(p => renderProductCard(p)).join('');
    return `<div class="products-grid">${cards}</div>`;
}

function getCategoryIcon(category) {
    switch (category) {
        case 'camisa': return '👕';
        case 'bone': return '🧢';
        case 'casaco': return '🧥';
        default: return '⚽';
    }
}

function getCategoryName(category) {
    switch (category) {
        case 'camisa': return 'Camisas';
        case 'bone': return 'Bonés';
        case 'casaco': return 'Casacos';
        default: return 'Todos';
    }
}

function formatPrice(price) {
    return price.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}
