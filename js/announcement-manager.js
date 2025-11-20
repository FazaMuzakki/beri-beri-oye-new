/**
 * ANNOUNCEMENT MANAGER
 * Mengelola pengumuman yang ditampilkan di:
 * - index.html (Pengumuman Content) - Max 20 pengumuman
 * - dashboard-penilaian.html (semua level: masyarakat, kabupaten/kota, provinsi) - Max 30 pengumuman
 * 
 * Pengumuman lama akan dihapus otomatis ketika melebihi batas maksimal
 */

class AnnouncementManager {
    constructor() {
        // Separate storage keys for different targets
        this.storageKeyBeranda = 'berseri_announcements_beranda';
        this.storageKeyDashboard = 'berseri_announcements_dashboard';
        
        this.maxAnnouncementsBeranda = 30;
        this.maxAnnouncementsDashboard = 40;
        
        this.init();
    }

    init() {
        // Initialize beranda announcements
        if (!localStorage.getItem(this.storageKeyBeranda)) {
            localStorage.setItem(this.storageKeyBeranda, JSON.stringify([]));
        }
        
        // Initialize dashboard announcements
        if (!localStorage.getItem(this.storageKeyDashboard)) {
            localStorage.setItem(this.storageKeyDashboard, JSON.stringify([]));
        }
    }

    /**
     * Get storage key berdasarkan target
     */
    getStorageKey(target = 'beranda') {
        return target === 'beranda' ? this.storageKeyBeranda : this.storageKeyDashboard;
    }

    /**
     * Get max announcements berdasarkan target
     */
    getMaxAnnouncements(target = 'beranda') {
        return target === 'beranda' ? this.maxAnnouncementsBeranda : this.maxAnnouncementsDashboard;
    }

    /**
     * Tambah pengumuman baru
     * @param {Object} announcement - { title, description, imageUrl, date, targets, dashboardRoles }
     * targets adalah array yang bisa berisi 'beranda' dan/atau 'dashboard'
     * dashboardRoles adalah array untuk menentukan role mana yang melihat (jika ada 'dashboard' di targets)
     */
    addAnnouncement(announcement) {
        // Validasi
        if (!announcement.title || !announcement.description) {
            throw new Error('Judul dan deskripsi harus diisi');
        }

        // Default targets jika tidak ditentukan
        const targets = announcement.targets || ['beranda', 'dashboard'];
        const dashboardRoles = announcement.dashboardRoles || ['masyarakat', 'kabkota', 'provinsi'];

        // Buat object pengumuman baru dengan metadata
        const newAnnouncement = {
            id: this.generateId(),
            title: announcement.title,
            description: announcement.description,
            imageUrl: announcement.imageUrl || '',
            date: announcement.date || new Date().toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            uploadDate: new Date().toISOString(),
            visible: true,
            targets: targets,
            dashboardRoles: dashboardRoles // Simpan role yang dituju
        };

        // Tambah ke setiap target
        targets.forEach(target => {
            const storageKey = this.getStorageKey(target);
            let announcements = JSON.parse(localStorage.getItem(storageKey)) || [];

            // Tambah ke awal array (terbaru di paling atas)
            announcements.unshift(newAnnouncement);

            // Jika melebihi max, hapus yang tertua
            const maxAnn = this.getMaxAnnouncements(target);
            if (announcements.length > maxAnn) {
                announcements.pop();
            }

            // Simpan ke localStorage
            localStorage.setItem(storageKey, JSON.stringify(announcements));
        });

        // Emit event untuk sync
        this.emitUpdateEvent();
        
        return newAnnouncement;
    }

    /**
     * Ambil semua pengumuman dari target tertentu
     */
    getAnnouncements(target = 'beranda') {
        const storageKey = this.getStorageKey(target);
        const data = localStorage.getItem(storageKey);
        return data ? JSON.parse(data) : [];
    }

    /**
     * Ambil pengumuman yang terlihat saja
     */
    getVisibleAnnouncements(target = 'beranda') {
        return this.getAnnouncements(target).filter(a => a.visible);
    }

    /**
     * Update pengumuman berdasarkan ID
     */
    updateAnnouncement(id, updates, target = 'beranda') {
        const storageKey = this.getStorageKey(target);
        let announcements = JSON.parse(localStorage.getItem(storageKey)) || [];
        const index = announcements.findIndex(a => a.id === id);

        if (index === -1) {
            throw new Error('Pengumuman tidak ditemukan');
        }

        announcements[index] = {
            ...announcements[index],
            ...updates,
            id: announcements[index].id,
            uploadDate: announcements[index].uploadDate
        };

        localStorage.setItem(storageKey, JSON.stringify(announcements));
        this.emitUpdateEvent();
        return announcements[index];
    }

    /**
     * Hapus pengumuman berdasarkan ID
     */
    deleteAnnouncement(id, target = 'beranda') {
        const storageKey = this.getStorageKey(target);
        let announcements = JSON.parse(localStorage.getItem(storageKey)) || [];
        announcements = announcements.filter(a => a.id !== id);
        localStorage.setItem(storageKey, JSON.stringify(announcements));
        this.emitUpdateEvent();
    }

    /**
     * Hapus pengumuman dari semua target
     */
    deleteAnnouncementFromAll(id) {
        this.deleteAnnouncement(id, 'beranda');
        this.deleteAnnouncement(id, 'dashboard');
    }

    /**
     * Toggle visibility pengumuman
     */
    toggleVisibility(id, target = 'beranda') {
        const storageKey = this.getStorageKey(target);
        let announcements = JSON.parse(localStorage.getItem(storageKey)) || [];
        const index = announcements.findIndex(a => a.id === id);

        if (index !== -1) {
            announcements[index].visible = !announcements[index].visible;
            localStorage.setItem(storageKey, JSON.stringify(announcements));
            this.emitUpdateEvent();
        }
    }

    /**
     * Generate ID unik untuk pengumuman
     */
    generateId() {
        return 'ann_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Convert image file to base64
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            // Check file size (max 1MB = 1048576 bytes)
            if (file.size > 1048576) {
                reject(new Error('Ukuran gambar maksimal 1MB'));
                return;
            }

            // Check file type
            if (!file.type.startsWith('image/')) {
                reject(new Error('File harus berupa gambar'));
                return;
            }

            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }

    /**
     * Emit event untuk notifikasi update
     */
    emitUpdateEvent() {
        const event = new CustomEvent('announcementsUpdated', {
            detail: { timestamp: Date.now() }
        });
        window.dispatchEvent(event);
    }

    /**
     * Clear semua pengumuman (untuk testing)
     */
    clearAll() {
        localStorage.setItem(this.storageKeyBeranda, JSON.stringify([]));
        localStorage.setItem(this.storageKeyDashboard, JSON.stringify([]));
    }
}

// Create global instance
const announcementManager = new AnnouncementManager();
