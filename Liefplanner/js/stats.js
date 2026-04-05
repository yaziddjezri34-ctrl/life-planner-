/**
 * LifePlanner 7 – Statistik (offizielles Layout)
 */
const Stats = {
    init() {
        this.render();
    },

    render() {
        this.renderWeekChart();
        this.renderCategories();
        this.renderPriorities();
        this.renderRanking();
    },

    renderWeekChart() {
        const container = document.getElementById('stats-week-chart');
        if (!container) return;

        const labels = [];
        const doneC = [];
        const openC = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            const ds = d.toISOString().split('T')[0];
            labels.push(d.toLocaleDateString('de-DE', { weekday: 'short' }));
            const dayTasks = Store.getTasks().filter(t => t.date === ds);
            doneC.push(dayTasks.filter(t => t.status === 'done').length);
            openC.push(dayTasks.filter(t => t.status !== 'done').length);
        }

        const max = Math.max(1, ...doneC.map((v, i) => v + openC[i]));

        container.innerHTML = labels.map((lb, i) => {
            const total = doneC[i] + openC[i];
            const barH = total ? Math.max(10, Math.round((total / max) * 140)) : 4;
            const dH = total ? Math.round((doneC[i] / total) * barH) : 0;
            const oH = Math.max(0, barH - dH);
            return `
                <div class="wk-bar">
                    <div class="wk-bar-inner" style="height:${barH}px">
                        ${oH ? `<div class="wk-seg-open" style="height:${oH}px"></div>` : ''}
                        ${dH ? `<div class="wk-seg-done" style="height:${dH}px"></div>` : ''}
                    </div>
                    <span class="wk-label">${lb}</span>
                </div>`;
        }).join('');
    },

    renderCategories() {
        const container = document.getElementById('stats-categories');
        if (!container) return;

        const tasks = Store.getTasks().filter(t => t.status !== 'done');
        const catCount = {};
        tasks.forEach(t => {
            const c = t.category || 'Haushalt';
            catCount[c] = (catCount[c] || 0) + 1;
        });
        const entries = Object.entries(catCount);
        if (!entries.length) {
            container.innerHTML = '<p class="empty-state">Keine offenen Aufgaben</p>';
            return;
        }
        const max = Math.max(...entries.map(([, n]) => n), 1);
        const total = tasks.length || 1;
        container.innerHTML = entries.map(([name, count]) => {
            const pct = Math.round((count / max) * 100);
            return `
                <div class="stat-bar-item">
                    <div class="stat-bar-label"><span>${name}</span><span>${count} (${Math.round((count / total) * 100)}%)</span></div>
                    <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${pct}%"></div></div>
                </div>`;
        }).join('');
    },

    renderPriorities() {
        const container = document.getElementById('stats-priorities');
        if (!container) return;

        const tasks = Store.getTasks().filter(t => t.status !== 'done');
        const counts = { high: 0, medium: 0, low: 0 };
        tasks.forEach(t => {
            if (counts[t.priority] !== undefined) counts[t.priority]++;
            else counts.medium++;
        });
        const total = tasks.length || 1;
        container.innerHTML = `
            <div class="prio-card high">${counts.high} Hoch<br><small>${Math.round((counts.high / total) * 100)}%</small></div>
            <div class="prio-card medium">${counts.medium} Mittel<br><small>${Math.round((counts.medium / total) * 100)}%</small></div>
            <div class="prio-card low">${counts.low} Niedrig<br><small>${Math.round((counts.low / total) * 100)}%</small></div>`;
    },

    renderRanking() {
        const container = document.getElementById('stats-ranking');
        if (!container) return;

        const members = Store.getMembers();
        const doneTasks = Store.getTasks().filter(t => t.status === 'done');
        const weekAgo = new Date(Date.now() - 7 * 86400000);
        const recentDone = doneTasks.filter(t => new Date(t.completedAt || t.date) >= weekAgo);

        if (!members.length) {
            container.innerHTML = '<p class="empty-state">Keine Mitglieder</p>';
            return;
        }

        const counts = {};
        members.forEach(m => { counts[m.id] = 0; });
        recentDone.forEach(t => {
            if (counts[t.personId] !== undefined) counts[t.personId]++;
        });

        const ranking = members.map(m => ({ ...m, count: counts[m.id] || 0 }))
            .sort((a, b) => b.count - a.count);
        const max = Math.max(...ranking.map(m => m.count), 1);
        const medals = ['🥇', '🥈', '🥉'];

        container.innerHTML = ranking.map((m, i) => {
            const openFor = Store.getTasks().filter(t => t.personId === m.id && t.status !== 'done').length;
            const pct = Math.round((m.count / max) * 100);
            return `
                <div class="ranking-item">
                    <span>${medals[i] || i + 1 + '.'}</span>
                    <span style="font-size:1.5rem">${m.avatar}</span>
                    <div style="flex:1">
                        <div style="font-weight:700">${m.name}</div>
                        <div class="stat-bar-track" style="margin-top:6px"><div class="stat-bar-fill" style="width:${pct}%"></div></div>
                        <small>${m.count} erledigt (7 T.) · ${openFor} offen</small>
                    </div>
                </div>`;
        }).join('');
    }
};
