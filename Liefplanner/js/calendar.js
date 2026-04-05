/**
 * LifePlanner 7 – Monatskalender + Termin-Seitenleiste
 */
const Calendar = {
    visibleMonth: new Date(),

    init() {
        this.visibleMonth = new Date();
        this.visibleMonth.setDate(1);
        this.visibleMonth.setHours(0, 0, 0, 0);
        document.getElementById('cal-prev').addEventListener('click', () => {
            this.visibleMonth.setMonth(this.visibleMonth.getMonth() - 1);
            this.render();
        });
        document.getElementById('cal-next').addEventListener('click', () => {
            this.visibleMonth.setMonth(this.visibleMonth.getMonth() + 1);
            this.render();
        });
        this.render();
    },

    render() {
        const y = this.visibleMonth.getFullYear();
        const m = this.visibleMonth.getMonth();
        const label = document.getElementById('cal-month-label');
        label.textContent = new Date(y, m, 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

        const first = new Date(y, m, 1);
        const startPad = (first.getDay() + 6) % 7;
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        const grid = document.getElementById('cal-grid');
        const todayStr = new Date().toISOString().split('T')[0];

        let html = '';
        const prevMonthDays = new Date(y, m, 0).getDate();
        for (let i = 0; i < startPad; i++) {
            const d = prevMonthDays - startPad + i + 1;
            html += `<div class="cal-cell muted"><span>${d}</span></div>`;
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const tasks = Store.getTasksForDate(dateStr);
            const openCount = tasks.filter(t => t.status !== 'done').length;
            const isToday = dateStr === todayStr;
            html += `
                <div class="cal-cell ${isToday ? 'today' : ''}" data-date="${dateStr}">
                    <span>${d}</span>
                    ${tasks.length ? `<span class="cal-cell-dot">${tasks.length}</span>` : ''}
                </div>`;
        }
        const totalCells = startPad + daysInMonth;
        const endPad = (7 - (totalCells % 7)) % 7;
        for (let i = 1; i <= endPad; i++) {
            html += `<div class="cal-cell muted"><span>${i}</span></div>`;
        }
        grid.innerHTML = html;

        this.renderSidebar();
    },

    renderSidebar() {
        const today = new Date().toISOString().split('T')[0];
        const tasks = Store.getTasks().filter(t => t.status !== 'done');
        const todayTasks = tasks.filter(t => t.date === today).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
        const future = tasks.filter(t => t.date > today).sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));

        const fmt = (t) => {
            const ds = new Date(t.date).toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' });
            const tm = t.time ? ` ${t.time}` : '';
            return `${ds}${tm}`;
        };

        let html = '';
        todayTasks.forEach(t => {
            html += `
                <div class="cal-appt today-appt">
                    <span class="cal-appt-pin">📌</span>
                    <strong>Heute</strong><br>
                    ${TaskManager.getTaskIcon(t.name)} ${t.name}
                    ${t.time ? `<br><small>${t.time}</small>` : ''}
                </div>`;
        });
        future.slice(0, 12).forEach(t => {
            html += `
                <div class="cal-appt">
                    ${TaskManager.getTaskIcon(t.name)} ${t.name}<br>
                    <small>${fmt(t)}</small>
                </div>`;
        });
        if (!html) html = '<p class="empty-state">Keine Termine</p>';
        document.getElementById('cal-sidebar').innerHTML = html;
    }
};

const WeekPlan = Calendar;
