/**
 * LifePlanner 7 – Einkaufsliste
 */
const Shopping = {
    init() {
        this.bindEvents();
        this.render();
        this.updateMeta();
    },

    bindEvents() {
        document.getElementById('btn-add-shopping').addEventListener('click', () => this.addItem());

        document.getElementById('shopping-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addItem();
        });

        document.getElementById('btn-clear-bought').addEventListener('click', () => {
            Store.clearBoughtItems();
            App.showToast('Gekaufte entfernt', 'success');
            this.render();
            this.updateMeta();
            App.refreshDashboard();
            App.refreshHeaderWidgets();
        });

        document.getElementById('shop-qty-minus')?.addEventListener('click', () => {
            const el = document.getElementById('shopping-qty');
            const v = Math.max(1, (parseInt(el.value, 10) || 1) - 1);
            el.value = v;
        });
        document.getElementById('shop-qty-plus')?.addEventListener('click', () => {
            const el = document.getElementById('shopping-qty');
            el.value = (parseInt(el.value, 10) || 1) + 1;
        });
    },

    addItem() {
        const nameInput = document.getElementById('shopping-input');
        const qtyInput = document.getElementById('shopping-qty');
        const catSelect = document.getElementById('shopping-category');
        const unitEl = document.getElementById('shopping-unit');

        const name = nameInput.value.trim();
        if (!name) {
            App.showToast('Artikelname eingeben', 'warning');
            return;
        }

        Store.addShoppingItem({
            name,
            quantity: parseInt(qtyInput.value, 10) || 1,
            category: catSelect.value,
            unit: unitEl ? unitEl.value : 'Stk'
        });

        nameInput.value = '';
        qtyInput.value = 1;
        nameInput.focus();

        App.showToast(`„${name}“ hinzugefügt`, 'success');
        this.render();
        this.updateMeta();
        App.refreshDashboard();
        App.refreshHeaderWidgets();
    },

    toggleItem(id) {
        Store.toggleShoppingItem(id);
        this.render();
        this.updateMeta();
    },

    deleteItem(id) {
        Store.deleteShoppingItem(id);
        this.render();
        this.updateMeta();
        App.refreshDashboard();
        App.refreshHeaderWidgets();
    },

    updateMeta() {
        const items = Store.getShoppingItems();
        const done = items.filter(i => i.bought).length;
        const el = document.getElementById('shopping-meta');
        if (el) el.textContent = `${done}/${items.length} erledigt`;
        const dashHint = document.getElementById('dash-m-shop-hint');
        if (dashHint) dashHint.textContent = `${items.length} Artikel`;
    },

    render() {
        const items = Store.getShoppingItems();
        const container = document.getElementById('shopping-list');

        if (!items.length) {
            container.innerHTML = '<p class="empty-state">Liste ist leer</p>';
            this.updateMeta();
            return;
        }

        const grouped = {};
        items.forEach(item => {
            const cat = item.category || 'Sonstiges';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(item);
        });

        let html = '';
        for (const [category, catItems] of Object.entries(grouped)) {
            const sortedItems = [...catItems].sort((a, b) => Number(a.bought) - Number(b.bought));
            html += `
                <div class="shopping-category-group">
                    <div class="shopping-category-header">${category}</div>
                    ${sortedItems.map(item => {
                        const q = item.quantity > 1 ? `${item.quantity}${item.unit || 'x'} ` : '';
                        return `
                        <div class="shopping-item ${item.bought ? 'bought' : ''}" data-id="${item.id}">
                            <button type="button" class="task-checkbox" onclick="Shopping.toggleItem('${item.id}')">
                                ${item.bought ? '✓' : ''}
                            </button>
                            <span class="shopping-item-name">${q}${item.name}</span>
                            <button type="button" class="task-action-btn delete" onclick="Shopping.deleteItem('${item.id}')">✕</button>
                        </div>`;
                    }).join('')}
                </div>`;
        }

        container.innerHTML = html;
        this.updateMeta();
    },

    renderDashboardPreview() {
        const container = document.getElementById('dashboard-shopping');
        if (!container) return;
        const items = Store.getShoppingItems().filter(i => !i.bought);
        if (!items.length) {
            container.innerHTML = '<p class="empty-state">Einkaufsliste leer</p>';
            return;
        }
        container.innerHTML = items.slice(0, 5).map(item => `
            <div class="shopping-item" style="box-shadow:none;padding:8px 0;">
                <span>• ${item.name}${item.quantity > 1 ? ` (${item.quantity}x)` : ''}</span>
            </div>`).join('');
    }
};
