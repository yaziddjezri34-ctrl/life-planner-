/**
 * LifePlanner 7 – Aufgaben (inkl. Drag & Drop bei manueller Sortierung)
 */
const TaskManager = {
    currentFilter: 'all',
    currentSort: 'date-asc',
    currentPersonFilter: 'all',
    searchQuery: '',

    init() {
        const savedSort = localStorage.getItem('lp7_ui_task_sort');
        const sortEl = document.getElementById('task-sort');
        if (savedSort && sortEl?.querySelector(`option[value="${savedSort}"]`)) {
            sortEl.value = savedSort;
            this.currentSort = savedSort;
        }
        this.bindEvents();
        this.bindTaskListDrag();
        this.render();
    },

    bindEvents() {
        document.getElementById('btn-new-task').addEventListener('click', () => this.openModal());

        document.querySelectorAll('.quick-task').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.quick-task').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                document.getElementById('task-name').value = btn.dataset.task;
            });
        });

        document.getElementById('form-task').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTask();
        });

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.render();
            });
        });

        document.getElementById('task-sort').addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            localStorage.setItem('lp7_ui_task_sort', e.target.value);
            if (e.target.value === 'manual' && !Store.getTaskOrder()) {
                Store.saveTaskOrder(this.computeDefaultOrderIds());
            }
            this.render();
        });

        document.getElementById('task-filter-person').addEventListener('change', (e) => {
            this.currentPersonFilter = e.target.value;
            this.render();
        });

        document.getElementById('task-search')?.addEventListener('input', (e) => {
            this.searchQuery = (e.target.value || '').trim().toLowerCase();
            this.render();
        });

        document.getElementById('btn-tasks-pdf')?.addEventListener('click', () => App.exportPdf('Alle Aufgaben'));

        document.getElementById('task-date').valueAsDate = new Date();
    },

    computeDefaultOrderIds() {
        const tasks = [...Store.getTasks()];
        tasks.sort((a, b) => new Date(a.date) - new Date(b.date) || (a.name || '').localeCompare(b.name || ''));
        return tasks.map(t => t.id);
    },

    applyManualOrder(tasks, order) {
        const idx = new Map(order.map((id, i) => [id, i]));
        return [...tasks].sort((a, b) => {
            const ia = idx.has(a.id) ? idx.get(a.id) : 99999;
            const ib = idx.has(b.id) ? idx.get(b.id) : 99999;
            if (ia !== ib) return ia - ib;
            return new Date(a.date) - new Date(b.date);
        });
    },

    bindTaskListDrag() {
        const container = document.getElementById('tasks-list');
        if (!container || container._lpDragBound) return;
        container._lpDragBound = true;

        let dragRow = null;

        container.addEventListener('dragstart', (e) => {
            if (this.currentSort !== 'manual') {
                e.preventDefault();
                return;
            }
            const handle = e.target.closest('.drag-dots');
            if (!handle || !handle.draggable) {
                e.preventDefault();
                return;
            }
            dragRow = handle.closest('.task-row-pro');
            if (!dragRow) return;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', dragRow.dataset.id);
            dragRow.classList.add('dragging');
        });

        container.addEventListener('dragend', () => {
            if (dragRow) dragRow.classList.remove('dragging');
            container.querySelectorAll('.task-row-pro.drag-over').forEach(el => el.classList.remove('drag-over'));
            dragRow = null;
        });

        container.addEventListener('dragover', (e) => {
            if (this.currentSort !== 'manual') return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const row = e.target.closest('.task-row-pro');
            container.querySelectorAll('.task-row-pro.drag-over').forEach(el => {
                if (el !== row) el.classList.remove('drag-over');
            });
            if (row && row !== dragRow) row.classList.add('drag-over');
        });

        container.addEventListener('dragleave', (e) => {
            const row = e.target.closest('.task-row-pro');
            if (row && e.relatedTarget && !row.contains(e.relatedTarget)) {
                row.classList.remove('drag-over');
            }
        });

        container.addEventListener('drop', (e) => {
            if (this.currentSort !== 'manual' || !dragRow) return;
            e.preventDefault();
            const targetRow = e.target.closest('.task-row-pro');
            if (!targetRow || targetRow === dragRow) return;

            const rect = targetRow.getBoundingClientRect();
            const before = e.clientY < rect.top + rect.height / 2;
            if (before) {
                targetRow.parentNode.insertBefore(dragRow, targetRow);
            } else {
                targetRow.parentNode.insertBefore(dragRow, targetRow.nextSibling);
            }

            const visibleIds = [...container.querySelectorAll('.task-row-pro')].map(r => r.dataset.id);
            const base = Store.getTaskOrder() || Store.getTasks().map(t => t.id);
            Store.saveTaskOrder(Store.mergeVisibleReorder(base, visibleIds));
            targetRow.classList.remove('drag-over');
            this.render();
            App.showToast('Reihenfolge gespeichert', 'success');
        });
    },

    openModal(taskId = null) {
        const modal = document.getElementById('modal-task');
        const title = document.getElementById('modal-task-title');
        const form = document.getElementById('form-task');

        this.populatePersonSelect();

        if (taskId) {
            const task = Store.getTasks().find(t => t.id === taskId);
            if (!task) return;

            title.textContent = 'Aufgabe bearbeiten';
            document.getElementById('task-id').value = task.id;
            document.getElementById('task-name').value = task.name;
            document.getElementById('task-date').value = task.date;
            document.getElementById('task-time').value = task.time || '';
            document.getElementById('task-person').value = task.personId;
            document.getElementById('task-repeat').value = task.repeat || 'none';
            document.getElementById('task-notes').value = task.notes || '';
            document.getElementById('task-category').value = task.category || 'Haushalt';

            const priorityRadio = form.querySelector(`input[name="task-priority"][value="${task.priority}"]`);
            if (priorityRadio) priorityRadio.checked = true;

            document.querySelectorAll('.quick-task').forEach(btn => {
                btn.classList.toggle('selected', btn.dataset.task === task.name);
            });
        } else {
            title.textContent = 'Neue Aufgabe';
            form.reset();
            document.getElementById('task-id').value = '';
            document.getElementById('task-date').valueAsDate = new Date();
            document.querySelectorAll('.quick-task').forEach(b => b.classList.remove('selected'));
            form.querySelector('input[name="task-priority"][value="medium"]').checked = true;
            document.getElementById('task-category').value = 'Haushalt';
        }

        modal.classList.add('active');
    },

    closeModal() {
        document.getElementById('modal-task').classList.remove('active');
    },

    populatePersonSelect() {
        const members = Store.getMembers();
        const select = document.getElementById('task-person');
        const filterSelect = document.getElementById('task-filter-person');

        select.innerHTML = '<option value="">Person wählen…</option>';
        filterSelect.innerHTML = '<option value="all">Alle Personen</option>';

        members.forEach(m => {
            const label = `${m.avatar} ${m.name}`;
            select.innerHTML += `<option value="${m.id}">${label}</option>`;
            filterSelect.innerHTML += `<option value="${m.id}">${label}</option>`;
        });
    },

    populateDashPersonSelect() {
        const sel = document.getElementById('dash-task-person');
        if (!sel) return;
        const members = Store.getMembers();
        sel.innerHTML = members.map(m => `<option value="${m.id}">${m.avatar} ${m.name}</option>`).join('');
    },

    saveTask() {
        const id = document.getElementById('task-id').value;
        const taskData = {
            name: document.getElementById('task-name').value.trim(),
            date: document.getElementById('task-date').value,
            time: document.getElementById('task-time').value,
            personId: document.getElementById('task-person').value,
            priority: document.querySelector('input[name="task-priority"]:checked').value,
            repeat: document.getElementById('task-repeat').value,
            notes: document.getElementById('task-notes').value.trim(),
            category: document.getElementById('task-category').value
        };

        if (!taskData.name || !taskData.date || !taskData.personId) {
            App.showToast('Bitte alle Pflichtfelder ausfüllen.', 'warning');
            return;
        }

        if (id) {
            Store.updateTask(id, taskData);
            App.showToast('✅ Aktualisiert', 'success');
        } else {
            const newTask = Store.addTask(taskData);
            App.showToast('✅ Erstellt', 'success');
            this.handleRepeat(newTask);
        }

        this.closeModal();
        this.render();
        App.refreshDashboard();
        App.refreshHeaderWidgets();
        Calendar.render();
        Stats.render();
        Household.renderFamilyPage();
    },

    handleRepeat(task) {
        if (!task.repeat || task.repeat === 'none') return;

        const intervals = { daily: 1, weekly: 7, biweekly: 14, monthly: 30 };
        const days = intervals[task.repeat];
        if (!days) return;

        for (let i = 1; i <= 4; i++) {
            const futureDate = new Date(task.date);
            futureDate.setDate(futureDate.getDate() + days * i);
            Store.addTask({
                name: task.name,
                date: futureDate.toISOString().split('T')[0],
                time: task.time,
                personId: task.personId,
                priority: task.priority,
                repeat: task.repeat,
                notes: task.notes,
                category: task.category || 'Haushalt'
            });
        }
    },

    toggleTask(id) {
        const task = Store.toggleTask(id);
        if (task && task.status === 'done') {
            App.showToast('🎉 Erledigt!', 'success');
        }
        this.render();
        App.refreshDashboard();
        App.refreshHeaderWidgets();
        Calendar.render();
        Stats.render();
        Household.renderFamilyPage();
    },

    deleteTask(id) {
        if (confirm('Aufgabe wirklich löschen?')) {
            Store.deleteTask(id);
            App.showToast('Gelöscht', 'warning');
            this.render();
            App.refreshDashboard();
            App.refreshHeaderWidgets();
            Calendar.render();
        }
    },

    render() {
        let tasks = Store.getTasks();

        if (this.currentFilter === 'open') {
            tasks = tasks.filter(t => t.status !== 'done');
        } else if (this.currentFilter === 'done') {
            tasks = tasks.filter(t => t.status === 'done');
        } else if (this.currentFilter === 'urgent') {
            tasks = tasks.filter(t => t.priority === 'high' && t.status !== 'done');
        }

        if (this.currentPersonFilter !== 'all') {
            tasks = tasks.filter(t => t.personId === this.currentPersonFilter);
        }

        if (this.searchQuery) {
            tasks = tasks.filter(t => t.name.toLowerCase().includes(this.searchQuery));
        }

        if (this.currentSort === 'manual') {
            let order = Store.getTaskOrder();
            if (!order || !order.length) {
                order = this.computeDefaultOrderIds();
                Store.saveTaskOrder(order);
            }
            tasks = this.applyManualOrder(tasks, order);
        } else {
            tasks.sort((a, b) => {
                switch (this.currentSort) {
                    case 'date-asc':
                        return new Date(a.date) - new Date(b.date);
                    case 'date-desc':
                        return new Date(b.date) - new Date(a.date);
                    case 'priority': {
                        const order = { high: 0, medium: 1, low: 2 };
                        return (order[a.priority] || 1) - (order[b.priority] || 1);
                    }
                    case 'person':
                        return (a.personId || '').localeCompare(b.personId || '');
                    default:
                        return 0;
                }
            });
        }

        const total = Store.getTasks().length;
        const done = Store.getTasks().filter(t => t.status === 'done').length;
        const meta = document.getElementById('tasks-meta');
        if (meta) {
            const dragHint = this.currentSort === 'manual' ? ' • ⋮⋮ am Griff ziehen' : '';
            meta.textContent = `${tasks.length} angezeigt • ${total} gesamt • ${done} erledigt${dragHint}`;
        }

        const container = document.getElementById('tasks-list');
        if (!tasks.length) {
            container.innerHTML = '<p class="empty-state">Keine Aufgaben gefunden</p>';
            return;
        }

        const allowDrag = this.currentSort === 'manual';
        container.innerHTML = tasks.map(t => this.renderTaskRowPro(t, allowDrag)).join('');
    },

    priorityLabel(p) {
        if (p === 'high') return { key: 'high', text: 'Hoch' };
        if (p === 'low') return { key: 'low', text: 'Niedrig' };
        return { key: 'medium', text: 'Mittel' };
    },

    renderTaskRowPro(task, allowDrag = false) {
        const member = Store.getMemberById(task.personId);
        const memberName = member ? member.name : 'Unbekannt';
        const cat = task.category || 'Haushalt';
        const pr = this.priorityLabel(task.priority);
        const dateFormatted = new Date(task.date).toLocaleDateString('de-DE', {
            year: 'numeric', day: '2-digit', month: '2-digit'
        });
        const done = task.status === 'done';
        const borderClass = pr.key === 'high' ? 'priority-high' : pr.key === 'low' ? 'priority-low' : 'priority-medium';
        const dragAttr = allowDrag ? 'draggable="true"' : 'draggable="false"';
        const dragCls = allowDrag ? 'drag-dots' : 'drag-dots drag-dots--disabled';

        return `
            <div class="task-row-pro ${borderClass} ${done ? 'done' : ''}" data-id="${task.id}">
                <span class="${dragCls}" title="${allowDrag ? 'Ziehen zum Sortieren' : 'Sortierung: „Manuelle Reihenfolge“ wählen'}" ${dragAttr}>⋮⋮</span>
                <button type="button" class="task-check" onclick="TaskManager.toggleTask('${task.id}')" aria-label="Erledigt">${done ? '✓' : ''}</button>
                <div class="task-row-main" onclick="TaskManager.openModal('${task.id}')">
                    <div class="task-row-title">${this.getTaskIcon(task.name)} ${task.name}</div>
                    <div class="task-row-meta">${cat} • ${memberName} • ${dateFormatted}</div>
                </div>
                <span class="prio-pill ${pr.key}">${pr.text}</span>
                <button type="button" class="task-row-del" onclick="event.stopPropagation(); TaskManager.deleteTask('${task.id}')" title="Löschen">🗑️</button>
            </div>`;
    },

    getTaskIcon(name) {
        const icons = {
            Waschen: '🧺',
            'Wäsche waschen': '🧺',
            Putzen: '🧹',
            'Küche putzen': '🧹',
            'Bad putzen': '🧹',
            Einkaufen: '🛒',
            Kochen: '🍳',
            'Müll rausbringen': '🗑️',
            Müll: '🗑️',
            Staubsaugen: '🧹',
            Abspülen: '🍽️',
            Aufräumen: '🏠',
            Bügeln: '👔',
            Garten: '🌱'
        };
        const lower = name.toLowerCase();
        for (const [key, icon] of Object.entries(icons)) {
            if (lower.includes(key.toLowerCase())) return icon;
        }
        return '📋';
    },

    renderTodayTasks() {
        const today = new Date().toISOString().split('T')[0];
        const tasks = Store.getTasksForDate(today).filter(t => t.status !== 'done');
        const container = document.getElementById('today-tasks');
        const focusBody = document.getElementById('dash-focus-body');
        if (!container) return;

        if (!tasks.length) {
            container.innerHTML = `
                <div class="empty-focus">
                    <span class="big-check">✅</span>
                    <p><strong>Alles erledigt!</strong> 🎉</p>
                </div>`;
            if (focusBody) focusBody.classList.remove('has-tasks');
            return;
        }
        if (focusBody) focusBody.classList.add('has-tasks');
        tasks.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
        container.innerHTML = tasks.map(t => this.renderTaskRowPro(t, false)).join('');
    },

    renderUpcoming() {
        const el = document.getElementById('dash-upcoming');
        if (!el) return;
        const today = new Date().toISOString().split('T')[0];
        const upcoming = Store.getTasks()
            .filter(t => t.status !== 'done' && t.date > today)
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 6);

        if (!upcoming.length) {
            el.innerHTML = '<p class="empty-state" style="padding:8px">Nichts geplant</p>';
            return;
        }
        el.innerHTML = upcoming.map(t => {
            const ds = new Date(t.date).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
            return `<div class="upcoming-item"><span>${this.getTaskIcon(t.name)} ${t.name}</span><span>${ds}</span></div>`;
        }).join('');
    }
};
