/**
 * LifePlanner 7 – Haushalt / Familie
 */
const Household = {
    selectedAvatar: '😀',

    init() {
        this.bindEvents();
        this.render();
        this.renderFamilyPage();
    },

    bindEvents() {
        document.getElementById('btn-manage-household')?.addEventListener('click', () => this.openModal());

        document.getElementById('btn-add-member').addEventListener('click', () => {
            this.addMember();
        });

        document.getElementById('member-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addMember();
        });

        document.querySelectorAll('.avatar-option').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.avatar-option').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.selectedAvatar = btn.dataset.avatar;
            });
        });
    },

    openModal() {
        document.getElementById('modal-household').classList.add('active');
        this.renderMembersList();
    },

    addMember() {
        const nameInput = document.getElementById('member-name');
        const name = nameInput.value.trim();

        if (!name) {
            App.showToast('Bitte Namen eingeben', 'warning');
            return;
        }

        Store.addMember({
            name,
            avatar: this.selectedAvatar,
            role: 'member'
        });

        nameInput.value = '';
        App.showToast(`${this.selectedAvatar} ${name} hinzugefügt`, 'success');

        this.renderMembersList();
        this.render();
        this.renderFamilyPage();
        TaskManager.populatePersonSelect();
        TaskManager.populateDashPersonSelect();
    },

    deleteMember(id) {
        const member = Store.getMemberById(id);
        if (confirm(`„${member?.name}“ wirklich entfernen?`)) {
            Store.deleteMember(id);
            App.showToast('Mitglied entfernt', 'warning');
            this.renderMembersList();
            this.render();
            this.renderFamilyPage();
            TaskManager.populatePersonSelect();
            TaskManager.populateDashPersonSelect();
        }
    },

    memberTaskStats(memberId) {
        const tasks = Store.getTasks();
        const mine = tasks.filter(t => t.personId === memberId);
        const done = mine.filter(t => t.status === 'done').length;
        return { total: mine.length, done };
    },

    renderFamilyPage() {
        const cards = document.getElementById('family-member-cards');
        const assign = document.getElementById('family-assignments');
        if (!cards || !assign) return;

        const members = Store.getMembers();
        const gradients = ['purple', 'green', 'orange'];

        if (!members.length) {
            cards.innerHTML = '<p class="empty-state">Noch keine Mitglieder</p>';
            assign.innerHTML = '';
            return;
        }

        cards.innerHTML = members.map((m, i) => {
            const { total, done } = this.memberTaskStats(m.id);
            const g = gradients[i % gradients.length];
            const roleLabel = m.role === 'admin' ? 'Admin' : 'Mitglied';
            return `
                <div class="fam-card ${g}">
                    <span class="fam-card-role">${roleLabel}</span>
                    <h3>${m.avatar} ${m.name}</h3>
                    <p class="fam-card-stat">${done}/${total} erledigt</p>
                </div>`;
        }).join('');

        assign.innerHTML = members.map(m => {
            const { total, done } = this.memberTaskStats(m.id);
            const roleLabel = m.role === 'admin' ? 'Admin' : 'Mitglied';
            const chip = m.role === 'admin' ? 'admin' : '';
            return `
                <div class="assign-row">
                    <span>${m.avatar} <strong>${m.name}</strong></span>
                    <span>${total} Aufgaben (${done} ✓)</span>
                    <span class="role-chip ${chip}">${roleLabel}</span>
                </div>`;
        }).join('');
    },

    render() {
        const container = document.getElementById('household-members');
        if (!container) return;

        const members = Store.getMembers();
        if (!members.length) {
            container.innerHTML = '<p class="empty-state">Noch keine Mitglieder</p>';
            return;
        }

        container.innerHTML = members.map(m => `
            <div class="member-chip">
                <span class="avatar">${m.avatar}</span>
                <span>${m.name}</span>
            </div>`).join('');
    },

    renderMembersList() {
        const container = document.getElementById('members-list');
        const members = Store.getMembers();

        if (!members.length) {
            container.innerHTML = '<p class="empty-state">Noch keine Mitglieder</p>';
            return;
        }

        container.innerHTML = members.map(m => `
            <div class="member-manage-item">
                <div class="member-manage-info">
                    <span style="font-size:1.5em">${m.avatar}</span>
                    <span>${m.name}</span>
                </div>
                <button type="button" class="task-action-btn delete" onclick="Household.deleteMember('${m.id}')">🗑️</button>
            </div>`).join('');
    }
};
