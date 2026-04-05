/**
 * LifePlanner 7 – App Shell (offizielles Layout)
 */
const App = {
    init() {
        Store.seedDemoData();

        this.loadSettings();
        const dtd = document.getElementById('dash-task-date');
        if (dtd) dtd.valueAsDate = new Date();
        TaskManager.populateDashPersonSelect();
        TaskManager.init();
        Shopping.init();
        Calendar.init();
        Stats.init();
        Household.init();
        Pages.init();
        NotificationManager.init();

        this.bindNavigation();
        this.bindModals();
        this.bindSettings();
        this.bindChrome();

        document.getElementById('form-dash-task')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('dash-task-name').value.trim();
            const date = document.getElementById('dash-task-date').value;
            const priority = document.getElementById('dash-task-priority').value;
            const category = document.getElementById('dash-task-category').value;
            const personId = document.getElementById('dash-task-person').value;
            if (!name || !date || !personId) {
                this.showToast('Bitte Aufgabe, Datum und Person wählen.', 'warning');
                return;
            }
            Store.addTask({ name, date, time: '', personId, priority, repeat: 'none', notes: '', category });
            e.target.reset();
            document.getElementById('dash-task-date').valueAsDate = new Date();
            document.getElementById('dash-task-priority').value = 'medium';
            document.getElementById('dash-task-category').value = 'Haushalt';
            TaskManager.populateDashPersonSelect();
            this.showToast('✅ Aufgabe gespeichert', 'success');
            TaskManager.render();
            this.refreshDashboard();
            this.refreshHeaderWidgets();
            Calendar.render();
            Stats.render();
            Household.renderFamilyPage();
        });

        this.refreshDashboard();
        this.refreshHeaderWidgets();
        Pages.renderMeals();
        Pages.renderNotes();
        Pages.renderAutomation();
        Pages.renderBackendCounts();

        NotificationManager.requestPermission();

        this.registerServiceWorker();
    },

    registerServiceWorker() {
        if (!('serviceWorker' in navigator)) return;
        const local =
            location.hostname === 'localhost' ||
            location.hostname === '127.0.0.1' ||
            location.hostname === '[::1]';
        if (location.protocol !== 'https:' && !local) return;
        navigator.serviceWorker.register('./sw.js').catch(() => { });
    },

    bindChrome() {
        document.getElementById('btn-toggle-dark')?.addEventListener('click', () => {
            const dark = document.documentElement.getAttribute('data-theme') !== 'dark';
            document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
            Store.saveSetting('darkMode', dark);
            const cb = document.getElementById('setting-darkmode');
            if (cb) cb.checked = dark;
        });

        document.getElementById('btn-quick-pdf')?.addEventListener('click', () => this.exportPdf('LifePlanner 7'));
        document.getElementById('btn-dash-pdf')?.addEventListener('click', () => this.exportPdf('Dashboard / Heute'));
        document.getElementById('btn-meals-pdf')?.addEventListener('click', () => this.exportPdf('Essensplan'));
        document.getElementById('btn-shopping-side-pdf')?.addEventListener('click', () => this.exportPdf('Einkaufsliste'));
    },

    bindNavigation() {
        document.querySelectorAll('.nav-tab').forEach(item => {
            item.addEventListener('click', () => {
                const view = item.dataset.view;
                this.navigateTo(view);
                document.querySelectorAll('.nav-tab').forEach(n => n.classList.remove('active'));
                item.classList.add('active');
            });
        });
    },

    navigateTo(viewName) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const view = document.getElementById(`view-${viewName}`);
        if (view) {
            view.classList.add('active');
            switch (viewName) {
                case 'dashboard':
                    this.refreshDashboard();
                    break;
                case 'tasks':
                    TaskManager.render();
                    TaskManager.populatePersonSelect();
                    break;
                case 'meals':
                    Shopping.render();
                    Pages.renderMeals();
                    break;
                case 'calendar':
                    Calendar.render();
                    break;
                case 'stats':
                    Stats.render();
                    break;
                case 'family':
                    Household.renderFamilyPage();
                    break;
                case 'notes':
                    Pages.renderNotes();
                    break;
                case 'automation':
                    Pages.renderAutomation();
                    break;
                case 'backend':
                    Pages.renderBackendCounts();
                    break;
                default:
                    break;
            }
        }
        this.refreshHeaderWidgets();
    },

    refreshHeaderWidgets() {
        const hour = new Date().getHours();
        let greeting;
        if (hour < 6) greeting = 'Gute Nacht 🌙';
        else if (hour < 12) greeting = 'Guten Morgen ☀️';
        else if (hour < 18) greeting = 'Guten Tag 👋';
        else greeting = 'Guten Abend 🌆';

        const hg = document.getElementById('hero-greeting');
        if (hg) hg.textContent = greeting;

        const g = Store.getGamification();
        const ps = document.getElementById('pill-streak');
        const pl = document.getElementById('pill-level');
        const pm = document.getElementById('pill-meal');
        if (ps) ps.textContent = `🔥 ${g.streak || 0} Streak`;
        if (pl) pl.textContent = `🏆 ${g.level || 'Anfänger'} 🌱`;
        if (pm) pm.textContent = `🍴 Heute: ${g.todayMeal || '—'}`;

        const tasks = Store.getTasks();
        const done = tasks.filter(t => t.status === 'done').length;
        const open = tasks.filter(t => t.status !== 'done').length;
        const total = done + open;
        const pct = total ? Math.round((done / total) * 100) : 0;

        const pd = document.getElementById('progress-done');
        const po = document.getElementById('progress-open');
        const pp = document.getElementById('progress-pct');
        const ring = document.getElementById('progress-ring-fill');
        if (pd) pd.textContent = done;
        if (po) po.textContent = open;
        if (pp) pp.textContent = `${pct}%`;
        if (ring) ring.setAttribute('stroke-dasharray', `${pct}, 100`);

        const rems = Store.getCustomReminders();
        const todayTasks = Store.getTasks().filter(t => {
            const today = new Date().toISOString().split('T')[0];
            return t.date === today && t.status !== 'done' && t.time;
        }).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
        let line = '🔔 Planung läuft';
        if (rems.length) {
            const r = rems[0];
            line = `🔔 ${r.time} – ${r.text}`;
        } else if (todayTasks.length) {
            const t = todayTasks[0];
            line = `🔔 ${t.time} – ${t.name}`;
        }
        const hr = document.getElementById('hero-reminder');
        if (hr) hr.textContent = line;
    },

    refreshDashboard() {
        const tasks = Store.getTasks();
        const openTasks = tasks.filter(t => t.status !== 'done');
        const doneTasks = tasks.filter(t => t.status === 'done');

        const dOpen = document.getElementById('dash-m-open');
        const dDone = document.getElementById('dash-m-done');
        if (dOpen) dOpen.textContent = openTasks.length;
        if (dDone) dDone.textContent = doneTasks.length;

        const items = Store.getShoppingItems();
        const bought = items.filter(i => i.bought).length;
        const openShop = items.filter(i => !i.bought).length;
        const ds = document.getElementById('dash-m-shop');
        if (ds) ds.textContent = `${bought}/${items.length}`;
        const dh = document.getElementById('dash-m-shop-hint');
        if (dh) dh.textContent = `${openShop} Artikel`;

        const dm = document.getElementById('dash-m-meals');
        if (dm) dm.textContent = String(Store.getMeals().length || 7);

        const fd = document.getElementById('dash-focus-date');
        if (fd) {
            fd.textContent = new Date().toLocaleDateString('de-DE', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            });
        }

        TaskManager.renderTodayTasks();
        TaskManager.renderUpcoming();
        Shopping.renderDashboardPreview();
        Household.render();
        NotificationManager.updateBadge();
    },

    exportPdf(title) {
        const lines = [title, '═'.repeat(40), ''];
        lines.push(`Erstellt: ${new Date().toLocaleString('de-DE')}`, '');
        lines.push('— Aufgaben —');
        Store.getTasks().forEach(t => {
            lines.push(`• ${t.name} | ${t.date} | ${t.status} | ${t.category || ''}`);
        });
        lines.push('', '— Einkauf —');
        Store.getShoppingItems().forEach(i => {
            lines.push(`• ${i.name} ${i.bought ? '(✓)' : ''}`);
        });
        lines.push('', '— Essen —');
        Store.getMeals().forEach(m => {
            lines.push(`• ${m.day}: ${m.dish} [${m.tag}]`);
        });

        const root = document.getElementById('print-root');
        root.innerHTML = `<pre style="font-family:Inter,system-ui,sans-serif;padding:24px;white-space:pre-wrap;">${lines.join('\n')}</pre>`;
        root.hidden = false;
        window.print();
        root.hidden = true;
        root.innerHTML = '';
    },

    bindModals() {
        document.querySelectorAll('[data-close]').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.dataset.close;
                document.getElementById(modalId).classList.remove('active');
            });
        });

        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) overlay.classList.remove('active');
            });
        });

        document.getElementById('btn-notifications').addEventListener('click', () => {
            NotificationManager.renderNotifications();
            document.getElementById('modal-notifications').classList.add('active');
        });

        document.getElementById('btn-clear-notifications').addEventListener('click', () => {
            Store.clearNotifications();
            NotificationManager.renderNotifications();
            NotificationManager.updateBadge();
        });

        document.getElementById('btn-settings').addEventListener('click', () => {
            document.getElementById('modal-settings').classList.add('active');
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
            }
        });
    },

    bindSettings() {
        document.getElementById('setting-darkmode').addEventListener('change', (e) => {
            const dark = e.target.checked;
            document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
            Store.saveSetting('darkMode', dark);
        });

        document.getElementById('setting-notifications').addEventListener('change', (e) => {
            Store.saveSetting('notifications', e.target.checked);
            if (e.target.checked) NotificationManager.requestPermission();
        });

        document.getElementById('setting-household-name').addEventListener('change', (e) => {
            Store.saveSetting('householdName', e.target.value);
            this.showToast('Gespeichert', 'success');
        });

        document.getElementById('btn-reset-all').addEventListener('click', () => {
            if (confirm('Wirklich ALLE Daten löschen?')) {
                Store.resetAll();
                location.reload();
            }
        });
    },

    loadSettings() {
        const settings = Store.getSettings();
        if (settings.darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            const cb = document.getElementById('setting-darkmode');
            if (cb) cb.checked = true;
        }
        document.getElementById('setting-notifications').checked = settings.notifications !== false;
        document.getElementById('setting-household-name').value = settings.householdName || 'Mein Haushalt';
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3200);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
