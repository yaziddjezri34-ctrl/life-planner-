/**
 * LifePlanner 7 – Zusatzseiten (Essen, Notizen, Automatik, Login, Backend)
 */
const Pages = {
    updateBackendStatus() {
        const st = document.getElementById('backend-status');
        if (!st) return;
        const s = Store.getSettings();
        if (s.backendMode === 'supabase') {
            st.textContent = 'Aktuell: Supabase – nach Verbindungstest / Sync nutzen';
        } else {
            st.textContent = 'Aktuell: Demo / Local Storage';
        }
    },

    tagClass(tag) {
        const k = (tag || '').toLowerCase().replace(/\s/g, '');
        const map = {
            schnell: 'tag-schnell',
            protein: 'tag-protein',
            gesund: 'tag-gesund',
            budget: 'tag-budget',
            familie: 'tag-familie',
            leicht: 'tag-leicht',
            wochenende: 'tag-wochenende'
        };
        return map[k] || 'tag-schnell';
    },

    init() {
        const days = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
        const sel = document.getElementById('meal-day-select');
        if (sel) {
            sel.innerHTML = days.map(d => `<option value="${d}">${d}</option>`).join('');
        }

        document.getElementById('btn-meal-save')?.addEventListener('click', () => {
            const day = document.getElementById('meal-day-select').value;
            const dish = document.getElementById('meal-dish-input').value.trim();
            const tag = document.getElementById('meal-tag-select').value;
            if (!dish) {
                App.showToast('Bitte Gericht eingeben', 'warning');
                return;
            }
            Store.upsertMeal(day, dish, tag);
            document.getElementById('meal-dish-input').value = '';
            this.renderMeals();
            App.refreshHeaderWidgets();
            App.showToast('🍴 Gespeichert', 'success');
        });

        document.getElementById('btn-note-add')?.addEventListener('click', () => {
            const title = document.getElementById('note-title').value.trim();
            const body = document.getElementById('note-body').value.trim();
            if (!title) {
                App.showToast('Titel fehlt', 'warning');
                return;
            }
            const colors = ['blue', 'rose', 'amber', 'mint'];
            Store.addNote({ title, body, color: colors[Store.getNotes().length % colors.length] });
            document.getElementById('note-title').value = '';
            document.getElementById('note-body').value = '';
            this.renderNotes();
            App.showToast('📝 Notiz erstellt', 'success');
        });

        document.getElementById('btn-rem-add')?.addEventListener('click', () => {
            const time = document.getElementById('rem-time').value;
            const text = document.getElementById('rem-text').value.trim();
            if (!text) return;
            Store.addCustomReminder({ time, text, tag: 'Routine' });
            document.getElementById('rem-text').value = '';
            this.renderAutomation();
            App.refreshHeaderWidgets();
            App.showToast('⏰ Erinnerung hinzugefügt', 'success');
        });

        document.getElementById('form-login')?.addEventListener('submit', (e) => {
            e.preventDefault();
            App.showToast('Noch nicht verbunden (Demo-Modus)', 'warning');
        });

        document.getElementById('btn-push-enable')?.addEventListener('click', () => {
            NotificationManager.requestPermission();
            document.getElementById('push-status').textContent =
                Notification.permission === 'granted' ? 'Aktiv ✓' : 'Berechtigung prüfen…';
        });

        document.getElementById('btn-backend-seed')?.addEventListener('click', () => {
            if (confirm('Testdaten laden? Bestehende Demo-Daten werden ersetzt.')) {
                Store.applyOfficialSeed();
                location.reload();
            }
        });

        document.getElementById('btn-backend-reset')?.addEventListener('click', () => {
            if (confirm('Alles löschen und neu laden?')) {
                Store.resetAll();
                location.reload();
            }
        });

        document.getElementById('btn-backend-pdf-all')?.addEventListener('click', () => App.exportPdf('LifePlanner – Gesamt'));
        document.getElementById('btn-backend-pdf-shop')?.addEventListener('click', () => App.exportPdf('Einkaufsliste'));

        const bm = document.getElementById('backend-mode');
        const bu = document.getElementById('backend-url');
        const bk = document.getElementById('backend-key');

        const loadBackendUi = () => {
            const s = Store.getSettings();
            if (bm) bm.value = s.backendMode === 'supabase' ? 'supabase' : 'demo';
            if (bu) bu.value = s.supabaseUrl || '';
            if (bk) bk.value = s.supabaseAnonKey || '';
            Pages.updateBackendStatus();
        };

        const saveBackendSettings = () => {
            Store.saveSetting('backendMode', bm?.value || 'demo');
            Store.saveSetting('supabaseUrl', (bu?.value || '').trim());
            Store.saveSetting('supabaseAnonKey', (bk?.value || '').trim());
            Pages.updateBackendStatus();
        };

        loadBackendUi();

        bm?.addEventListener('change', saveBackendSettings);
        bu?.addEventListener('blur', saveBackendSettings);
        bk?.addEventListener('blur', saveBackendSettings);

        document.getElementById('btn-supabase-test')?.addEventListener('click', async () => {
            saveBackendSettings();
            try {
                await SupabaseBridge.testConnection();
                App.showToast('Supabase: Verbindung OK', 'success');
            } catch (err) {
                App.showToast(err.message || String(err), 'warning');
            }
        });

        document.getElementById('btn-supabase-push')?.addEventListener('click', async () => {
            saveBackendSettings();
            try {
                await SupabaseBridge.push();
                App.showToast('Daten in Supabase gespeichert', 'success');
            } catch (err) {
                App.showToast(err.message || String(err), 'warning');
            }
        });

        document.getElementById('btn-supabase-pull')?.addEventListener('click', async () => {
            saveBackendSettings();
            try {
                await SupabaseBridge.pull();
                App.showToast('Daten aus Supabase geladen – Seite neu…', 'success');
                setTimeout(() => location.reload(), 600);
            } catch (err) {
                App.showToast(err.message || String(err), 'warning');
            }
        });

        const pushSt = document.getElementById('push-status');
        if (pushSt && 'Notification' in window) {
            pushSt.textContent = Notification.permission === 'granted' ? 'Aktiv ✓' : 'Noch nicht aktiviert';
        }

        document.getElementById('btn-fam-invite')?.addEventListener('click', () => {
            const name = document.getElementById('fam-name').value.trim();
            const email = document.getElementById('fam-email').value.trim();
            const role = document.getElementById('fam-role').value;
            if (!name) {
                App.showToast('Name fehlt', 'warning');
                return;
            }
            Store.addMember({ name, email, role, avatar: '👤' });
            document.getElementById('fam-name').value = '';
            document.getElementById('fam-email').value = '';
            Household.renderFamilyPage();
            TaskManager.populatePersonSelect();
            TaskManager.populateDashPersonSelect();
            App.showToast('Eingeladen (lokal)', 'success');
        });
    },

    renderMeals() {
        const grid = document.getElementById('meal-grid');
        if (!grid) return;
        const days = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
        const meals = Store.getMeals();
        const byDay = Object.fromEntries(meals.map(m => [m.day, m]));
        grid.innerHTML = days.map(day => {
            const m = byDay[day] || { dish: '—', tag: 'Schnell' };
            return `
                <div class="meal-card">
                    <div class="meal-card-head">
                        <span>${day}</span>
                        <span class="meal-tag ${this.tagClass(m.tag)}">${m.tag}</span>
                    </div>
                    <div class="meal-dish">${m.dish}</div>
                </div>`;
        }).join('');
    },

    renderNotes() {
        const el = document.getElementById('notes-grid');
        if (!el) return;
        const notes = Store.getNotes();
        if (!notes.length) {
            el.innerHTML = '<p class="empty-state">Noch keine Notizen</p>';
            return;
        }
        el.innerHTML = notes.map(n => {
            const dt = new Date(n.createdAt).toLocaleString('de-DE');
            return `
                <div class="note-card c-${n.color || 'blue'}">
                    <h4>${n.title}</h4>
                    <p>${n.body || ''}</p>
                    <time>${dt}</time>
                </div>`;
        }).join('');
    },

    renderAutomation() {
        const tasks = Store.getTasks();
        const recurring = tasks.filter(t => t.repeat && t.repeat !== 'none');
        const uniq = [];
        const seen = new Set();
        recurring.forEach(t => {
            const k = t.name + t.repeat;
            if (seen.has(k)) return;
            seen.add(k);
            uniq.push(t);
        });

        document.getElementById('auto-recurring-count').textContent = `${uniq.length} aktive Automatisierungen`;
        const list = document.getElementById('auto-recurring-list');
        const icons = { weekly: '🔄', daily: '📅', biweekly: '📆', monthly: '🗓️' };
        list.innerHTML = uniq.length
            ? uniq.map(t => {
                const m = Store.getMemberById(t.personId);
                const who = m ? m.name : '';
                const sched = { daily: 'Täglich', weekly: 'Wöchentlich', biweekly: 'Alle 2 Wochen', monthly: 'Monatlich' }[t.repeat] || t.repeat;
                return `
                    <div class="rec-card">
                        <span class="rec-card-ic">${icons[t.repeat] || '🔁'}</span>
                        <div class="rec-card-body">
                            <div class="rec-card-title">${TaskManager.getTaskIcon(t.name)} ${t.name}</div>
                            <div class="rec-card-sub">${sched}${who ? ' • ' + who : ''}</div>
                        </div>
                        <span class="rec-badge">Aktiv</span>
                    </div>`;
            }).join('')
            : '<p class="empty-state">Keine wiederkehrenden Aufgaben</p>';

        const rems = Store.getCustomReminders();
        document.getElementById('auto-rem-count').textContent = `${rems.length} aktiv`;
        const rlist = document.getElementById('auto-reminders-list');
        if (rlist) {
            rlist.innerHTML = rems.length
                ? rems.map(r => `
                    <div class="rem-item">
                        <span>🕐 ${r.time} – ${r.text} <small>(${r.tag || 'Routine'})</small></span>
                        <button type="button" class="task-row-del js-del-rem" data-rid="${r.id}">✕</button>
                    </div>`).join('')
                : '';
            rlist.querySelectorAll('.js-del-rem').forEach(btn => {
                btn.addEventListener('click', () => {
                    Store.deleteCustomReminder(btn.dataset.rid);
                    Pages.renderAutomation();
                    App.refreshHeaderWidgets();
                });
            });
        }
    },

    renderBackendCounts() {
        const el = document.getElementById('backend-counts');
        if (!el) return;
        const t = Store.getTasks();
        const s = Store.getShoppingItems();
        const m = Store.getMembers();
        const n = Store.getNotes();
        const meals = Store.getMeals();
        const g = Store.getGamification();
        el.innerHTML = `
            <div>Aufgaben: <strong>${t.length}</strong></div>
            <div>Einkauf: <strong>${s.length}</strong></div>
            <div>Mitglieder: <strong>${m.length}</strong></div>
            <div>Notizen: <strong>${n.length}</strong></div>
            <div>Essensplan: <strong>${meals.length}</strong> Tage</div>
            <div>Streak: <strong>${g.streak || 0}</strong></div>`;
    }
};
