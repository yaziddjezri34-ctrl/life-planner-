/**
 * LifePlanner 7 – Notification System
 */
const NotificationManager = {
    init() {
        this.checkAndCreateReminders();
        // Check every minute
        setInterval(() => this.checkAndCreateReminders(), 60000);
    },

    checkAndCreateReminders() {
        const tasks = Store.getTasks();
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        tasks.forEach(task => {
            if (task.status === 'done') return;
            if (task.date !== today) return;

            // Check if reminder already exists for this task today
            const notifications = Store.getNotifications();
            const alreadyNotified = notifications.some(
                n => n.taskId === task.id && n.createdAt.startsWith(today)
            );

            if (!alreadyNotified) {
                const member = Store.getMemberById(task.personId);
                const memberName = member ? member.name : 'Jemand';
                const icon = task.priority === 'high' ? '🔴' : '📋';

                Store.addNotification({
                    taskId: task.id,
                    icon: icon,
                    text: `${memberName}: "${task.name}" ist heute fällig${task.time ? ' um ' + task.time : ''}!`,
                    type: task.priority === 'high' ? 'urgent' : 'reminder'
                });

                // Browser notification
                this.sendBrowserNotification(
                    `${icon} ${task.name}`,
                    `Heute${task.time ? ' um ' + task.time : ''} – ${memberName}`
                );
            }
        });

        this.updateBadge();
    },

    sendBrowserNotification(title, body) {
        const settings = Store.getSettings();
        if (!settings.notifications) return;

        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body, icon: '🏠' });
        }
    },

    requestPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    },

    updateBadge() {
        const count = Store.getUnreadCount();
        const badge = document.getElementById('notification-badge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    },

    renderNotifications() {
        const container = document.getElementById('notifications-list');
        const notifications = Store.getNotifications();

        if (notifications.length === 0) {
            container.innerHTML = '<p class="empty-state">Keine Erinnerungen 🎉</p>';
            return;
        }

        container.innerHTML = notifications.map(n => {
            const time = new Date(n.createdAt);
            const timeStr = time.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
            const dateStr = time.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

            return `
                <div class="notification-item ${n.read ? '' : 'unread'}">
                    <span class="notif-icon">${n.icon || '🔔'}</span>
                    <span class="notif-text">${n.text}</span>
                    <span class="notif-time">${dateStr} ${timeStr}</span>
                </div>
            `;
        }).join('');

        // Mark all as read
        Store.markAllRead();
        this.updateBadge();
    }
};
