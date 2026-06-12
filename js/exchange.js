// Mercado da Copa - Exchange Module
// Handles jersey exchange functionality

// ============================================
// EXCHANGE DATA (Demo Mode)
// ============================================
const EXCHANGE_ITEMS = [
    {
        id: 'exc-001',
        name: 'Camisa Brasil 1994',
        description: 'Camisa tetra do Brasil, edição especial retro. Disponível para troca!',
        team: 'Brasil',
        year: '1994',
        size: 'M',
        condition: 'otimo',
        image_url: 'assets/images/camisa_brasil.png',
        exchange_value: 150,
        stock: 2,
        category: 'camisa'
    },
    {
        id: 'exc-002',
        name: 'Camisa Itália 2006',
        description: 'Camisa da Itália campeã em 2006 na Alemanha. Peça rara de colecionador.',
        team: 'Itália',
        year: '2006',
        size: 'G',
        condition: 'bom',
        image_url: 'assets/images/camisa_franca.png',
        exchange_value: 180,
        stock: 1,
        category: 'camisa'
    },
    {
        id: 'exc-003',
        name: 'Camisa Espanha 2010',
        description: 'Camisa da Espanha campeã na África do Sul. Estado impecável.',
        team: 'Espanha',
        year: '2010',
        size: 'M',
        condition: 'novo',
        image_url: 'assets/images/camisa_alemanha.png',
        exchange_value: 200,
        stock: 3,
        category: 'camisa'
    },
    {
        id: 'exc-004',
        name: 'Camisa Argentina 2022',
        description: 'Camisa da Argentina tricampeã no Qatar. Peça clássica do Messi.',
        team: 'Argentina',
        year: '2022',
        size: 'G',
        condition: 'novo',
        image_url: 'assets/images/camisa_argentina.png',
        exchange_value: 220,
        stock: 4,
        category: 'camisa'
    },
    {
        id: 'exc-005',
        name: 'Camisa Alemanha 1990',
        description: 'Camisa da Alemanha campeã em 1990 na Itália. Retro original.',
        team: 'Alemanha',
        year: '1990',
        size: 'GG',
        condition: 'bom',
        image_url: 'assets/images/camisa_alemanha.png',
        exchange_value: 170,
        stock: 1,
        category: 'camisa'
    },
    {
        id: 'exc-006',
        name: 'Camisa França 1998',
        description: 'Camisa da França campeã em casa. Zidane era. Peça histórica.',
        team: 'França',
        year: '1998',
        size: 'M',
        condition: 'otimo',
        image_url: 'assets/images/camisa_franca.png',
        exchange_value: 250,
        stock: 2,
        category: 'camisa'
    }
];

// ============================================
// EXCHANGE PAGE INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';

    if (page === 'trocas.html') {
        initExchangePage();
    }
});

function initExchangePage() {
    loadExchangeProducts();
    setupExchangeForm();
    loadMyExchanges();
    setupExchangeEstimate();
}

// ============================================
// LOAD EXCHANGE PRODUCTS WITH STOCK
// ============================================
function loadExchangeProducts() {
    const container = document.getElementById('exchange-products');
    if (!container) return;

    // Simulate loading delay
    setTimeout(() => {
        if (EXCHANGE_ITEMS.length > 0) {
            container.innerHTML = EXCHANGE_ITEMS.map(item => renderExchangeCard(item)).join('');
            attachExchangeCardListeners(container);
        } else {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-state-icon">🔄</div>
                    <div class="empty-state-text">Nenhuma camisa disponível para troca no momento</div>
                </div>
            `;
        }
    }, 600);
}

function renderExchangeCard(item) {
    const conditionLabels = {
        'novo': '✨ Novo',
        'otimo': '⭐ Ótimo',
        'bom': '👍 Bom',
        'regular': '👌 Regular'
    };

    const conditionClass = item.condition === 'novo' ? 'condition-new' :
                           item.condition === 'otimo' ? 'condition-great' :
                           item.condition === 'bom' ? 'condition-good' : 'condition-regular';

    // Stock indicator
    let stockHTML = '';
    let stockClass = '';
    if (item.stock <= 0) {
        stockHTML = '<span class="exchange-stock-badge stock-out">Esgotado</span>';
        stockClass = 'out-of-stock';
    } else if (item.stock === 1) {
        stockHTML = `<span class="exchange-stock-badge stock-critical">🔥 Última unidade!</span>`;
        stockClass = 'stock-critical-card';
    } else if (item.stock <= 3) {
        stockHTML = `<span class="exchange-stock-badge stock-low">⚠️ Restam ${item.stock}</span>`;
        stockClass = 'stock-low-card';
    } else {
        stockHTML = `<span class="exchange-stock-badge stock-ok">✅ ${item.stock} em estoque</span>`;
        stockClass = '';
    }

    return `
        <div class="exchange-card animate-fade-in ${stockClass}" data-exchange-id="${item.id}">
            <div class="exchange-card-image">
                <img src="${item.image_url}" alt="${item.name}" loading="lazy"
                     onerror="this.src='assets/images/placeholder.svg'; this.onerror=null;">
                <span class="exchange-card-year">${item.year}</span>
                ${stockHTML}
            </div>
            <div class="exchange-card-body">
                <div class="exchange-card-team">${getTeamFlag(item.team)} ${item.team}</div>
                <h3 class="exchange-card-name">${item.name}</h3>
                <div class="exchange-card-meta">
                    <span class="exchange-condition-badge ${conditionClass}">${conditionLabels[item.condition] || item.condition}</span>
                    <span class="exchange-size-badge">Tam. ${item.size}</span>
                </div>
                <div class="exchange-card-footer">
                    <div class="exchange-card-value">
                        <span class="exchange-value-label">Valor de troca</span>
                        <span class="exchange-value-amount">${formatPrice(item.exchange_value)}</span>
                    </div>
                    <div class="exchange-stock-indicator">
                        <div class="stock-bar">
                            <div class="stock-bar-fill" style="width: ${Math.min((item.stock / 5) * 100, 100)}%"></div>
                        </div>
                        <span class="stock-text">${item.stock > 0 ? item.stock + ' un.' : 'Esgotado'}</span>
                    </div>
                </div>
                <button class="btn btn-primary btn-full btn-exchange-select" 
                        data-exchange-id="${item.id}" ${item.stock <= 0 ? 'disabled' : ''}>
                    ${item.stock > 0 ? '🔄 Quero esta camisa' : '❌ Indisponível'}
                </button>
            </div>
        </div>
    `;
}

function getTeamFlag(team) {
    const flags = {
        'Brasil': '🇧🇷',
        'Argentina': '🇦🇷',
        'Alemanha': '🇩🇪',
        'França': '🇫🇷',
        'Itália': '🇮🇹',
        'Espanha': '🇪🇸',
        'Inglaterra': '🏴',
        'Uruguai': '🇺🇾',
        'Portugal': '🇵🇹',
        'Holanda': '🇳🇱'
    };
    return flags[team] || '🌍';
}

// ============================================
// EXCHANGE FORM
// ============================================
function setupExchangeForm() {
    const form = document.getElementById('exchange-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!isLoggedIn()) {
            showToast('Faça login para cadastrar uma troca!', 'error');
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 1000);
            return;
        }

        const exchangeData = {
            id: 'my-exc-' + Date.now(),
            team: document.getElementById('exchange-team').value,
            year: document.getElementById('exchange-year').value,
            size: document.getElementById('exchange-size').value,
            condition: document.getElementById('exchange-condition').value,
            description: document.getElementById('exchange-description').value,
            status: 'pending',
            estimated_value: calculateEstimate(),
            created_at: new Date().toISOString()
        };

        // Save to localStorage
        const exchanges = JSON.parse(localStorage.getItem('mercadoCopa_exchanges') || '[]');
        exchanges.unshift(exchangeData);
        localStorage.setItem('mercadoCopa_exchanges', JSON.stringify(exchanges));

        // Reset form
        form.reset();
        document.getElementById('exchange-estimate').style.display = 'none';

        showToast('Camisa cadastrada para troca com sucesso! 🎉', 'success');
        loadMyExchanges();
    });
}

function setupExchangeEstimate() {
    const teamSelect = document.getElementById('exchange-team');
    const yearSelect = document.getElementById('exchange-year');
    const conditionSelect = document.getElementById('exchange-condition');
    const sizeSelect = document.getElementById('exchange-size');

    const inputs = [teamSelect, yearSelect, conditionSelect, sizeSelect];
    inputs.forEach(input => {
        if (input) {
            input.addEventListener('change', updateEstimate);
        }
    });
}

function updateEstimate() {
    const team = document.getElementById('exchange-team').value;
    const year = document.getElementById('exchange-year').value;
    const condition = document.getElementById('exchange-condition').value;
    const estimateEl = document.getElementById('exchange-estimate');
    const estimateValueEl = document.getElementById('exchange-estimate-value');

    if (team && year && condition) {
        const value = calculateEstimate();
        estimateValueEl.textContent = formatPrice(value);
        estimateEl.style.display = 'block';
        estimateEl.classList.add('animate-fade-in');
    } else {
        estimateEl.style.display = 'none';
    }
}

function calculateEstimate() {
    const year = document.getElementById('exchange-year').value;
    const condition = document.getElementById('exchange-condition').value;
    const team = document.getElementById('exchange-team').value;

    let baseValue = 80;

    // Year multiplier (older = more valuable)
    const yearNum = parseInt(year);
    if (yearNum && yearNum < 1990) baseValue += 120;
    else if (yearNum && yearNum < 2000) baseValue += 80;
    else if (yearNum && yearNum < 2010) baseValue += 50;
    else if (yearNum && yearNum < 2020) baseValue += 30;
    else baseValue += 10;

    // Condition multiplier
    const conditionMultipliers = {
        'novo': 1.5,
        'otimo': 1.2,
        'bom': 1.0,
        'regular': 0.7
    };
    baseValue *= (conditionMultipliers[condition] || 1.0);

    // Team bonus (champion teams = more valuable)
    const champTeams = ['Brasil', 'Alemanha', 'Itália', 'Argentina', 'França', 'Uruguai'];
    if (champTeams.includes(team)) {
        baseValue *= 1.2;
    }

    return Math.round(baseValue * 100) / 100;
}

// ============================================
// MY EXCHANGES LIST
// ============================================
function loadMyExchanges() {
    const container = document.getElementById('my-exchanges-list');
    if (!container) return;

    const exchanges = JSON.parse(localStorage.getItem('mercadoCopa_exchanges') || '[]');

    if (exchanges.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔄</div>
                <div class="empty-state-text">Você ainda não cadastrou nenhuma camisa para troca</div>
                <p style="color: var(--text-muted); font-size: 0.8rem; margin-top: 8px;">
                    Use o formulário acima para cadastrar sua primeira camisa!
                </p>
            </div>
        `;
        return;
    }

    container.innerHTML = exchanges.map(exc => {
        const date = new Date(exc.created_at);
        const formattedDate = date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        const statusLabels = {
            'pending': { label: '⏳ Aguardando', class: 'exchange-status-pending' },
            'approved': { label: '✅ Aprovada', class: 'exchange-status-approved' },
            'rejected': { label: '❌ Recusada', class: 'exchange-status-rejected' },
            'completed': { label: '🎉 Concluída', class: 'exchange-status-completed' }
        };

        const status = statusLabels[exc.status] || statusLabels['pending'];

        const conditionLabels = {
            'novo': 'Novo',
            'otimo': 'Ótimo',
            'bom': 'Bom',
            'regular': 'Regular'
        };

        return `
            <div class="exchange-history-card animate-fade-in">
                <div class="exchange-history-header">
                    <div class="exchange-history-info">
                        <span class="exchange-history-team">${getTeamFlag(exc.team)} ${exc.team} ${exc.year}</span>
                        <span class="exchange-history-date">${formattedDate}</span>
                    </div>
                    <span class="exchange-status-badge ${status.class}">${status.label}</span>
                </div>
                <div class="exchange-history-details">
                    <span>Tam. ${exc.size}</span>
                    <span>•</span>
                    <span>${conditionLabels[exc.condition] || exc.condition}</span>
                    <span>•</span>
                    <span class="gold">${formatPrice(exc.estimated_value)}</span>
                </div>
                ${exc.description ? `<p class="exchange-history-desc">${exc.description}</p>` : ''}
            </div>
        `;
    }).join('');
}

// ============================================
// EXCHANGE CARD INTERACTIONS
// ============================================
function attachExchangeCardListeners(container) {
    container.querySelectorAll('.btn-exchange-select').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const exchangeId = btn.dataset.exchangeId;
            handleExchangeSelect(exchangeId);
        });
    });
}

function handleExchangeSelect(exchangeId) {
    const item = EXCHANGE_ITEMS.find(i => i.id === exchangeId);
    if (!item) return;

    if (item.stock <= 0) {
        showToast('Esta camisa está esgotada!', 'error');
        return;
    }

    if (!isLoggedIn()) {
        showToast('Faça login para solicitar uma troca!', 'error');
        setTimeout(() => {
            window.location.href = 'profile.html';
        }, 1000);
        return;
    }

    // Decrease stock
    item.stock -= 1;

    // Add to exchange list as a "selected" exchange
    const exchanges = JSON.parse(localStorage.getItem('mercadoCopa_exchanges') || '[]');
    exchanges.unshift({
        id: 'sel-' + Date.now(),
        team: item.team,
        year: item.year,
        size: item.size,
        condition: item.condition,
        description: `Troca solicitada: ${item.name}`,
        status: 'pending',
        estimated_value: item.exchange_value,
        created_at: new Date().toISOString(),
        type: 'received'
    });
    localStorage.setItem('mercadoCopa_exchanges', JSON.stringify(exchanges));

    showToast(`Troca solicitada: ${item.name}! 🎉`, 'success');

    // Reload to update stock display
    loadExchangeProducts();
    loadMyExchanges();
}
