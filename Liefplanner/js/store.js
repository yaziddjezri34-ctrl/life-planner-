/**
 * LifePlanner 7 – Data Store (LocalStorage)
 */
const Store = {
    KEYS: {
        TASKS: 'lp7_tasks',
        MEMBERS: 'lp7_members',
        SHOPPING: 'lp7_shopping',
        NOTIFICATIONS: 'lp7_notifications',
        SETTINGS: 'lp7_settings',
        MEALS: 'lp7_meals',
        NOTES: 'lp7_notes',
        CUSTOM_REMINDERS: 'lp7_custom_reminders',
        GAMIFICATION: 'lp7_gamification',
        TASK_ORDER: 'lp7_task_order'
    },

    _get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Store read error:', e);
            return null;
        }
    },

    _set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Store write error:', e);
        }
    },

    getTasks() {
        return this._get(this.KEYS.TASKS) || [];
    },

    saveTasks(tasks) {
        this._set(this.KEYS.TASKS, tasks);
    },

    addTask(task) {
        const tasks = this.getTasks();
        task.id = this._generateId();
        task.createdAt = new Date().toISOString();
        if (!task.status) task.status = 'open';
        if (!task.category) task.category = 'Haushalt';
        tasks.push(task);
        this.saveTasks(tasks);
        const ord = this.getTaskOrder();
        if (ord && ord.length) this.saveTaskOrder([...ord, task.id]);
        return task;
    },

    updateTask(id, updates) {
        const tasks = this.getTasks();
        const index = tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...updates };
            this.saveTasks(tasks);
            return tasks[index];
        }
        return null;
    },

    deleteTask(id) {
        this.saveTasks(this.getTasks().filter(t => t.id !== id));
        const ord = this.getTaskOrder();
        if (ord && ord.length) this.saveTaskOrder(ord.filter(x => x !== id));
    },

    toggleTask(id) {
        const tasks = this.getTasks();
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.status = task.status === 'done' ? 'open' : 'done';
            if (task.status === 'done') {
                task.completedAt = new Date().toISOString();
            } else {
                delete task.completedAt;
            }
            this.saveTasks(tasks);
            return task;
        }
        return null;
    },

    getTasksForDate(dateStr) {
        return this.getTasks().filter(t => t.date === dateStr);
    },

    getTasksForWeek(startDate) {
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        return this.getTasks().filter(t => {
            const d = new Date(t.date);
            return d >= start && d < end;
        });
    },

    getMembers() {
        return this._get(this.KEYS.MEMBERS) || [];
    },

    saveMembers(members) {
        this._set(this.KEYS.MEMBERS, members);
    },

    addMember(member) {
        const members = this.getMembers();
        member.id = this._generateId();
        if (!member.role) member.role = 'member';
        if (!member.avatar) member.avatar = '😀';
        members.push(member);
        this.saveMembers(members);
        return member;
    },

    deleteMember(id) {
        this.saveMembers(this.getMembers().filter(m => m.id !== id));
    },

    getMemberById(id) {
        return this.getMembers().find(m => m.id === id) || null;
    },

    getShoppingItems() {
        return this._get(this.KEYS.SHOPPING) || [];
    },

    saveShoppingItems(items) {
        this._set(this.KEYS.SHOPPING, items);
    },

    addShoppingItem(item) {
        const items = this.getShoppingItems();
        item.id = this._generateId();
        item.bought = false;
        if (!item.unit) item.unit = 'Stk';
        items.push(item);
        this.saveShoppingItems(items);
        return item;
    },

    toggleShoppingItem(id) {
        const items = this.getShoppingItems();
        const found = items.find(i => i.id === id);
        if (found) {
            found.bought = !found.bought;
            this.saveShoppingItems(items);
            return found;
        }
        return null;
    },

    deleteShoppingItem(id) {
        this.saveShoppingItems(this.getShoppingItems().filter(i => i.id !== id));
    },

    clearBoughtItems() {
        this.saveShoppingItems(this.getShoppingItems().filter(i => !i.bought));
    },

    getNotifications() {
        return this._get(this.KEYS.NOTIFICATIONS) || [];
    },

    saveNotifications(notifications) {
        this._set(this.KEYS.NOTIFICATIONS, notifications);
    },

    addNotification(notification) {
        const notifications = this.getNotifications();
        notification.id = this._generateId();
        notification.createdAt = new Date().toISOString();
        notification.read = false;
        notifications.unshift(notification);
        if (notifications.length > 50) notifications.pop();
        this.saveNotifications(notifications);
        return notification;
    },

    clearNotifications() {
        this.saveNotifications([]);
    },

    getUnreadCount() {
        return this.getNotifications().filter(n => !n.read).length;
    },

    markAllRead() {
        this.saveNotifications(this.getNotifications().map(n => ({ ...n, read: true })));
    },

    getSettings() {
        const defaults = {
            darkMode: false,
            notifications: true,
            householdName: 'Mein Haushalt',
            backendMode: 'demo',
            supabaseUrl: '',
            supabaseAnonKey: ''
        };
        const raw = this._get(this.KEYS.SETTINGS);
        return raw ? { ...defaults, ...raw } : defaults;
    },

    saveSetting(key, value) {
        const settings = this.getSettings();
        settings[key] = value;
        this._set(this.KEYS.SETTINGS, settings);
    },

    getMeals() {
        return this._get(this.KEYS.MEALS) || [];
    },

    saveMeals(meals) {
        this._set(this.KEYS.MEALS, meals);
    },

    upsertMeal(day, dish, tag) {
        const meals = this.getMeals().filter(m => m.day !== day);
        meals.push({ day, dish, tag });
        this.saveMeals(meals);
    },

    getNotes() {
        return this._get(this.KEYS.NOTES) || [];
    },

    saveNotes(notes) {
        this._set(this.KEYS.NOTES, notes);
    },

    addNote(note) {
        const notes = this.getNotes();
        note.id = this._generateId();
        note.createdAt = new Date().toISOString();
        notes.unshift(note);
        this.saveNotes(notes);
        return note;
    },

    deleteNote(id) {
        this.saveNotes(this.getNotes().filter(n => n.id !== id));
    },

    getCustomReminders() {
        return this._get(this.KEYS.CUSTOM_REMINDERS) || [];
    },

    saveCustomReminders(list) {
        this._set(this.KEYS.CUSTOM_REMINDERS, list);
    },

    addCustomReminder(r) {
        const list = this.getCustomReminders();
        r.id = this._generateId();
        list.push(r);
        this.saveCustomReminders(list);
        return r;
    },

    deleteCustomReminder(id) {
        this.saveCustomReminders(this.getCustomReminders().filter(x => x.id !== id));
    },

    getGamification() {
        return this._get(this.KEYS.GAMIFICATION) || {
            streak: 3,
            level: 'Anfänger',
            todayMeal: 'Hähnchen mit Reis 🍗'
        };
    },

    saveGamification(g) {
        this._set(this.KEYS.GAMIFICATION, g);
    },

    getTaskOrder() {
        return this._get(this.KEYS.TASK_ORDER);
    },

    saveTaskOrder(ids) {
        this._set(this.KEYS.TASK_ORDER, ids);
    },

    clearTaskOrder() {
        localStorage.removeItem(this.KEYS.TASK_ORDER);
    },

    /**
     * Reihenfolge der sichtbaren Zeilen in die Gesamtliste mergen (bei Filter).
     */
    mergeVisibleReorder(allOrder, visibleOrderedIds) {
        const ids = new Set(this.getTasks().map(t => t.id));
        let order = (allOrder || []).filter(id => ids.has(id));
        const vis = new Set(visibleOrderedIds);
        const pos = new Map();
        order.forEach((id, i) => pos.set(id, i));
        const segmentIndices = visibleOrderedIds.map(id => pos.get(id)).filter(i => i !== undefined);
        if (!segmentIndices.length) {
            return [...order];
        }
        const lo = Math.min(...segmentIndices);
        const hi = Math.max(...segmentIndices);
        const segment = order.slice(lo, hi + 1);
        const hiddenInSegment = segment.filter(id => !vis.has(id));
        const visOrderedInSegment = visibleOrderedIds.filter(id => segment.includes(id));
        return [...order.slice(0, lo), ...visOrderedInSegment, ...hiddenInSegment, ...order.slice(hi + 1)];
    },

    /**
     * Kompletten App-Zustand aus Cloud-Payload wiederherstellen (Supabase).
     */
    hydrateFromCloudPayload(p) {
        if (!p || typeof p !== 'object') return;
        if (Array.isArray(p.tasks)) this.saveTasks(p.tasks);
        if (Array.isArray(p.members)) this.saveMembers(p.members);
        if (Array.isArray(p.shopping)) this.saveShoppingItems(p.shopping);
        if (Array.isArray(p.meals)) this.saveMeals(p.meals);
        if (Array.isArray(p.notes)) this.saveNotes(p.notes);
        if (Array.isArray(p.customReminders)) this.saveCustomReminders(p.customReminders);
        if (p.gamification && typeof p.gamification === 'object') this.saveGamification(p.gamification);
        if (Array.isArray(p.taskOrder)) this.saveTaskOrder(p.taskOrder);
        else if (p.taskOrder === null) this.clearTaskOrder();
        if (Array.isArray(p.notifications)) this.saveNotifications(p.notifications);
    },

    buildCloudPayload() {
        return {
            version: 1,
            updatedAt: new Date().toISOString(),
            tasks: this.getTasks(),
            members: this.getMembers(),
            shopping: this.getShoppingItems(),
            meals: this.getMeals(),
            notes: this.getNotes(),
            customReminders: this.getCustomReminders(),
            gamification: this.getGamification(),
            taskOrder: this.getTaskOrder() || null,
            notifications: this.getNotifications()
        };
    },

    resetAll() {
        Object.values(this.KEYS).forEach(key => localStorage.removeItem(key));
    },

    applyOfficialSeed() {
        this.resetAll();
        this._seedOfficialContent();
    },

    _generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    },

    _defaultMeals() {
        return [
            { day: 'Montag', dish: 'Pasta mit Gemüse 🍝', tag: 'Schnell' },
            { day: 'Dienstag', dish: 'Reis mit Hähnchen 🍗', tag: 'Protein' },
            { day: 'Mittwoch', dish: 'Linsensuppe 🥣', tag: 'Gesund' },
            { day: 'Donnerstag', dish: 'Ofengemüse 🥔', tag: 'Budget' },
            { day: 'Freitag', dish: 'Pizza-Abend 🍕', tag: 'Familie' },
            { day: 'Samstag', dish: 'Salat & Quiche 🥗', tag: 'Leicht' },
            { day: 'Sonntag', dish: 'Brunch 🥐', tag: 'Wochenende' }
        ];
    },

    _seedOfficialContent() {
        const members = [
            { id: this._generateId(), name: 'Mina', avatar: '👩', role: 'admin', email: '' },
            { id: this._generateId(), name: 'Yasin', avatar: '👨', role: 'member', email: '' },
            { id: this._generateId(), name: 'Sara', avatar: '👧', role: 'member', email: '' }
        ];
        this.saveMembers(members);

        const today = new Date();
        const fmt = (d) => d.toISOString().split('T')[0];
        const d0 = fmt(today);
        const d1 = fmt(new Date(today.getTime() + 86400000));
        const d2 = fmt(new Date(today.getTime() + 2 * 86400000));
        const d3 = fmt(new Date(today.getTime() + 3 * 86400000));

        const demoTasks = [
            { name: 'Staubsaugen', date: d0, time: '10:00', personId: members[1].id, priority: 'medium', repeat: 'weekly', notes: '', status: 'open', category: 'Reinigung' },
            { name: 'Fenster putzen', date: d1, time: '11:00', personId: members[2].id, priority: 'low', repeat: 'none', notes: '', status: 'open', category: 'Reinigung' },
            { name: 'Wocheneinkauf planen', date: d0, time: '09:00', personId: members[0].id, priority: 'high', repeat: 'none', notes: '', status: 'open', category: 'Einkauf' },
            { name: 'Kühlschrank aufräumen', date: d2, time: '15:00', personId: members[1].id, priority: 'low', repeat: 'none', notes: '', status: 'open', category: 'Haushalt' },
            { name: 'Küche putzen', date: d0, time: '08:00', personId: members[0].id, priority: 'high', repeat: 'weekly', notes: '', status: 'open', category: 'Reinigung' },
            { name: 'Abendessen vorbereiten', date: d0, time: '17:00', personId: members[2].id, priority: 'medium', repeat: 'none', notes: '', status: 'open', category: 'Haushalt' },
            { name: 'Video-Call mit Oma', date: d0, time: '16:00', personId: members[1].id, priority: 'low', repeat: 'none', notes: '', status: 'open', category: 'Haushalt' },
            { name: 'Post abholen', date: d0, time: '12:00', personId: members[0].id, priority: 'low', repeat: 'none', notes: '', status: 'open', category: 'Einkauf' },
            { name: 'Bettwäsche wechseln', date: d1, time: '10:00', personId: members[2].id, priority: 'medium', repeat: 'none', notes: '', status: 'open', category: 'Haushalt' },
            { name: 'Arzttermin', date: d3, time: '10:00', personId: members[0].id, priority: 'high', repeat: 'none', notes: '', status: 'open', category: 'Haushalt' }
        ];

        demoTasks.forEach(task => {
            task.id = this._generateId();
            task.createdAt = new Date().toISOString();
        });
        this.saveTasks(demoTasks);

        this.saveMeals(this._defaultMeals());

        this.saveNotes([
            { id: this._generateId(), title: 'Einkaufsliste Samstag', body: 'Milch, Brot, Obst nicht vergessen.', color: 'blue', createdAt: new Date().toISOString() },
            { id: this._generateId(), title: 'Geburtstag Sara', body: 'Kuchen bestellen + Geschenk.', color: 'rose', createdAt: new Date().toISOString() },
            { id: this._generateId(), title: 'Handwerker', body: 'Dienstag 14 Uhr – Wasserhahn.', color: 'amber', createdAt: new Date().toISOString() }
        ]);

        this.saveCustomReminders([
            { id: this._generateId(), time: '08:00', text: 'Wäsche starten', tag: 'Routine' },
            { id: this._generateId(), time: '12:00', text: 'Mittagessen vorbereiten', tag: 'Essen' },
            { id: this._generateId(), time: '18:00', text: 'Einkaufen für Abendessen', tag: 'Essen' }
        ]);

        this.saveGamification({ streak: 3, level: 'Anfänger', todayMeal: 'Hähnchen mit Reis 🍗' });
    },

    seedDemoData() {
        if (this.getMembers().length > 0) return;
        this._seedOfficialContent();
    }
};
