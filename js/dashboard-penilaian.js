// Dark Mode Management
class DarkModeManager {
    constructor() {
        this.storageKey = 'dashboard-penilaian-darkmode';
        this.init();
    }

    init() {
        // Check localStorage for saved preference
        const savedMode = localStorage.getItem(this.storageKey);
        
        if (savedMode === 'enabled') {
            this.enableDarkMode();
        }
        
        // Setup toggle buttons (both desktop and mobile)
        this.setupToggleButtons();
    }

    setupToggleButtons() {
        // Gunakan setTimeout untuk memastikan DOM sudah siap
        setTimeout(() => {
            const toggleBtnDesktop = document.getElementById('theme-toggle');
            const toggleBtnMobile = document.getElementById('theme-toggle-mobile');

            console.log('Desktop button:', toggleBtnDesktop);
            console.log('Mobile button:', toggleBtnMobile);

            if (toggleBtnDesktop) {
                toggleBtnDesktop.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Desktop button clicked!');
                    this.toggle();
                });
            }

            if (toggleBtnMobile) {
                toggleBtnMobile.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Mobile button clicked!');
                    this.toggle();
                });
            }
        }, 200);
    }

    enableDarkMode() {
        document.documentElement.classList.add('dark-mode');
        document.body.classList.add('dark-mode');
        localStorage.setItem(this.storageKey, 'enabled');
        this.updateIcons();
    }

    disableDarkMode() {
        document.documentElement.classList.remove('dark-mode');
        document.body.classList.remove('dark-mode');
        localStorage.setItem(this.storageKey, 'disabled');
        this.updateIcons();
    }

    toggle() {
        if (document.body.classList.contains('dark-mode')) {
            this.disableDarkMode();
        } else {
            this.enableDarkMode();
        }
    }

    updateIcons() {
        const isDark = document.body.classList.contains('dark-mode');
        
        // Update desktop icons
        const sunDesktop = document.querySelector('#theme-toggle .sun-icon');
        const moonDesktop = document.querySelector('#theme-toggle .moon-icon');
        
        if (sunDesktop) sunDesktop.style.display = isDark ? 'none' : 'inline-block';
        if (moonDesktop) moonDesktop.style.display = isDark ? 'inline-block' : 'none';

        // Update mobile icons
        const sunMobile = document.querySelector('#theme-toggle-mobile .sun-icon');
        const moonMobile = document.querySelector('#theme-toggle-mobile .moon-icon');
        
        if (sunMobile) sunMobile.style.display = isDark ? 'none' : 'inline-block';
        if (moonMobile) moonMobile.style.display = isDark ? 'inline-block' : 'none';
    }

    isEnabled() {
        return document.body.classList.contains('dark-mode');
    }
}

// Initialize dark mode manager
let darkModeManager;

// Mock Data
const mockData = {
    community: {
        announcements: [],
        submissions: [
            {
                id: "SA-2024-001",
                submitterName: "Current User",
                dateSubmitted: "2024-11-01",
                status: "pending",
                assessmentType: "Self-Assessment",
            },
            {
                id: "REG-2024-005",
                submitterName: "Current User",
                dateSubmitted: "2024-10-20",
                status: "approved",
                assessmentType: "Registration",
            }
        ]
    },
    district: {
        announcements: [],
        submissions: [
            {
                id: "SA-2024-001",
                submitterName: "Maria Garcia",
                dateSubmitted: "2024-11-01",
                status: "pending",
                assessmentType: "Self-Assessment",
            }
        ]
    },
    provincial: {
        announcements: [],
        submissions: [
            {
                id: "DA-2024-012",
                submitterName: "Metro District Office",
                dateSubmitted: "2024-11-02",
                status: "pending",
                assessmentType: "District Assessment",
            }
        ]
    }
};

let currentRole = 'community';

function init() {
    // Initialize dark mode manager
    darkModeManager = new DarkModeManager();
    
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // Jika tidak ada user di localStorage, redirect ke login
    if (!currentUser) {
        console.log('No user found, redirecting to login...');
        window.location.replace('login.html');
        return;
    }

    console.log('User logged in:', currentUser);

    // Set role based on user type
    const roleMap = {
        masyarakat: 'community',
        'kabupaten/kota': 'district',
        provinsi: 'provincial'
    };

    currentRole = roleMap[currentUser.role] || 'community';

    // Setup logout button
    window.logout = function() {
        console.log('Logging out...');
        localStorage.removeItem('currentUser');
        window.location.replace('login.html');
    };

    // Setup review button
    window.goToReview = function() {
        window.location.href = 'review-list.html';
    };

    // Update header dengan user info
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRole');
    
    if(userNameEl) userNameEl.textContent = currentUser.username;
    
    const roleText = {
        community: 'Masyarakat',
        district: 'Kabupaten/Kota',
        provincial: 'Provinsi'
    };
    
    if(userRoleEl) userRoleEl.textContent = roleText[currentRole];

    renderDashboard();
}

function renderDashboard() {
    const app = document.getElementById('app');
    app.innerHTML = '';
    
    if (currentRole === 'community') {
        renderCommunityDashboard(app);
    } else if (currentRole === 'district') {
        renderDistrictDashboard(app);
    } else if (currentRole === 'provincial') {
        renderProvincialDashboard(app);
    }
}

function renderCommunityDashboard(container) {
    const data = mockData.community;
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || { role: 'masyarakat' };
    
    container.innerHTML = `
        <div class="mb-4">
            <h1 class="text-3xl font-title font-[800] mb-2" style="font-family: 'Montserrat', sans-serif;">DASHBOARD MASYARAKAT</h1>
            <p class="text-muted-foreground">Pantau formulir pengajuan dan penilaian</p>
        </div>

        <div class="flex justify-between items-start">
            ${currentUser.role !== 'masyarakat' ? `
            <button onclick="goToReview()" class="btn-review" style="background-color: #065F46; color: white; padding: 0.75rem 1.5rem; border-radius: 0.375rem; font-family: 'Poppins', sans-serif; font-weight: 600; border: 2px solid #065F46; transition: all 0.2s;">
                Review Penilaian
            </button>
            ` : ''}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="stat-card">
                <div class="stat-content">
                    <div class="stat-label">Status Pendaftaran</div>
                    <div class="stat-value">19</div>
                </div>
                <div class="stat-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-content">
                    <div class="stat-label">Status Penilaian Mandiri</div>
                    <div class="stat-value">1</div>
                </div>
                <div class="stat-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-content">
                    <div class="stat-label">Status Kategori</div>
                    <div class="stat-value">2</div>
                </div>
                <div class="stat-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
            </div>
        </div>

        <div id="announcementCarousel"></div>

        <div>
            <h2 class="text-xl font-[800] mb-4" style="font-family: 'Montserrat', sans-serif;">PENDAFTARAN</h2>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="quick-action-card" onclick="handleAction('registration')">
                    <div class="quick-action-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="16"/><line x1="8" x2="16" y1="12" y2="12"/></svg>
                    </div>
                    <div class="quick-action-content">
                        <h3>Buat Usulan Baru</h3>
                        <p>Mulai isi form pendaftaran</p>
                    </div>
                </div>
                <div class="quick-action-card" onclick="handleAction('self-assessment')">
                    <div class="quick-action-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </div>
                    <div class="quick-action-content">
                        <h3>Penilaian Mandiri</h3>
                        <p>Mulai pengisian form Penilaian Mandiri</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="mt-12">
            <h2 class="text-xl font-[800] mb-4" style="font-family: 'Montserrat', sans-serif;">RIWAYAT PENGAJUAN</h2>
            <div class="filter-bar">
                <input type="text" class="search-input" placeholder="Cari submissions..." onchange="handleSearch(event)">
                <select class="filter-select" onchange="handleFilterChange(event)">
                    <option value="">Semua Status</option>
                    <option value="approved">Disetujui</option>
                    <option value="pending">Menunggu</option>
                    <option value="completed">Selesai</option>
                </select>
            </div>
            <div class="submissions-table" id="submissionsTable"></div>
        </div>
    `;
    
    renderAnnouncementCarousel(document.getElementById('announcementCarousel'), data.announcements);
    renderSubmissionsTable(document.getElementById('submissionsTable'), data.submissions, false);
}

function renderDistrictDashboard(container) {
    const data = mockData.district;
    
    container.innerHTML = `
        <div class="mb-4">
            <h1 class="text-3xl font-title font-[800] mb-2" style="font-family: 'Montserrat', sans-serif;">DASHBOARD KABUPATEN/KOTA</h1>
            <p class="text-muted-foreground">Review dan pelaksanaan penilaian Kabupaten/Kota</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="stat-card">
                <div class="stat-content">
                    <div class="stat-label">Sedang dalam penilaian</div>
                    <div class="stat-value">12</div>
                </div>
                <div class="stat-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-content">
                    <div class="stat-label">Penilaian yang selesai</div>
                    <div class="stat-value">156</div>
                </div>
                <div class="stat-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
            </div>
        </div>

        <div id="announcementCarousel" class="mb-8"></div>

        <div class="mb-8">
            <h2 class="text-xl font-[800] mb-4" style="font-family: 'Montserrat', sans-serif;">MENU</h2>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="quick-action-card" onclick="handleAction('assessment-review')">
                    <div class="quick-action-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                    </div>
                    <div class="quick-action-content">
                        <h3>Review Penilaian</h3>
                        <p>Evaluasi input penilaian</p>
                    </div>
                </div>
                <div class="quick-action-card" onclick="handleAction('district-assessment')">
                    <div class="quick-action-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </div>
                    <div class="quick-action-content">
                        <h3>Penilaian Kabupaten/kota</h3>
                        <p>Mulai Penilaian tingkat kabupaten/Kota</p>
                    </div>
                </div>
            </div>
        </div>

        <div>
            <h2 class="text-xl font-[800] mb-4" style="font-family: 'Montserrat', sans-serif;">DAFTAR PENGAJUAN</h2>
            <div class="filter-bar">
                <input type="text" class="search-input" placeholder="Cari submissions..." onchange="handleSearch(event)">
                <select class="filter-select" onchange="handleFilterChange(event)">
                    <option value="">Semua Status</option>
                    <option value="approved">Disetujui</option>
                    <option value="pending">Menunggu</option>
                    <option value="completed">Selesai</option>
                </select>
            </div>
            <div class="submissions-table" id="submissionsTable"></div>
        </div>
    `;
    
    renderAnnouncementCarousel(document.getElementById('announcementCarousel'), data.announcements);
    renderSubmissionsTable(document.getElementById('submissionsTable'), data.submissions, true);
}

function renderProvincialDashboard(container) {
    const data = mockData.provincial;
    
    container.innerHTML = `
        <div class="mb-4">
            <h1 class="text-3xl font-title font-[800] mb-2" style="font-family: 'Montserrat', sans-serif;">DASHBOARD PROVINSI</h1>
            <p class="text-muted-foreground">Review penilaian Kabupaten/Kota, pelaksanaan penilaian provinsi dan penilaian lapangan</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="stat-card">
                <div class="stat-content">
                    <div class="stat-label">Penilaian Provinsi berlangsung</div>
                    <div class="stat-value">18</div>
                </div>
                <div class="stat-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-content">
                    <div class="stat-label">Penilaian Lapangan berlangsung</div>
                    <div class="stat-value">7</div>
                </div>
                <div class="stat-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-content">
                    <div class="stat-label">Penilaian Provinsi yang selesai</div>
                    <div class="stat-value">342</div>
                </div>
                <div class="stat-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-content">
                    <div class="stat-label">Penilaian Lapangan yang selesai</div>
                    <div class="stat-value">342</div>
                </div>
                <div class="stat-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
            </div>
        </div>

        <div id="announcementCarousel" class="mb-8"></div>

        <div class="mb-8">
            <h2 class="text-xl font-[800] mb-4" style="font-family: 'Montserrat', sans-serif;">MENU</h2>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="quick-action-card" onclick="handleAction('assessment-review')">
                    <div class="quick-action-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                    </div>
                    <div class="quick-action-content">
                        <h3>Review Penilaian</h3>
                        <p>Evaluasi input penilaian</p>
                    </div>
                </div>

                <div class="quick-action-card" onclick="handleAction('provincial-assessment')">
                    <div class="quick-action-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </div>
                    <div class="quick-action-content">
                        <h3>Penilaian Provinsi</h3>
                        <p>Mulai Penilaian tingkat Provinsi</p>
                    </div>
                </div>

                <div class="quick-action-card" onclick="handleAction('field-assessment')">
                    <div class="quick-action-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </div>
                    <div class="quick-action-content">
                        <h3>Penilaian Lapangan</h3>
                        <p>Mulai Penilaian Lapangan</p>
                    </div>
                </div>
            </div>
        </div>

        <div>
            <h2 class="text-xl font-[800] mb-4" style="font-family: 'Montserrat', sans-serif;">DAFTAR PENGAJUAN</h2>
            <div class="filter-bar">
                <input type="text" class="search-input" placeholder="Cari submissions..." onchange="handleSearch(event)">
                <select class="filter-select" onchange="handleFilterChange(event)">
                    <option value="">Semua Status</option>
                    <option value="approved">Disetujui</option>
                    <option value="pending">Menunggu</option>
                    <option value="completed">Selesai</option>
                </select>
            </div>
            <div class="submissions-table" id="submissionsTable"></div>
        </div>
    `;
    
    renderAnnouncementCarousel(document.getElementById('announcementCarousel'), data.announcements);
    renderSubmissionsTable(document.getElementById('submissionsTable'), data.submissions, true);
}

function renderAnnouncementCarousel(container, announcements) {
    container.innerHTML = `
        <div class="announcements-container">
            <div class="announcements-header">
                <h2 style="font-family: 'Montserrat', sans-serif; font-weight: 800; color: inherit;">PENGUMUMAN TERBARU</h2>
            </div>
            <div class="announcements-list">
                ${announcements.map(announcement => `
                    <div class="announcement-card">
                        <div class="announcement-header">
                            <img src="${announcement.imageUrl}" alt="" class="announcement-image">
                            <div class="announcement-content">
                                <h3 class="announcement-title">${announcement.title}</h3>
                                <p class="announcement-date">${announcement.date}</p>
                                <p class="announcement-description">${announcement.description}</p>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderSubmissionsTable(container, submissions, showReviewButton) {
    container.innerHTML = `
        <div class="submissions-table">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Submitter</th>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${submissions.map(sub => `
                        <tr>
                            <td>${sub.id}</td>
                            <td>${sub.submitterName}</td>
                            <td>${sub.dateSubmitted}</td>
                            <td>${sub.assessmentType}</td>
                            <td><span class="status-badge status-${sub.status.toLowerCase()}">${formatStatus(sub.status)}</span></td>
                            <td>
                                <button class="action-button" onclick="viewSubmission('${sub.id}')">View</button>
                                ${showReviewButton && sub.status === 'pending' ? 
                                    `<button class="action-button" onclick="reviewSubmission('${sub.id}')">Review</button>` : 
                                    ''}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function formatStatus(status) {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

// Removed carousel controls as we now use a vertical scrollable list

function handleAction(action) {
    switch(action) {
        case 'registration':
            window.location.href = 'form.html';
            break;
        case 'self-assessment':
            window.location.href = 'penilaian-mandiri-awal.html';
            break;
        case 'district-assessment':
            window.location.href = 'penilaian-kabkota.html';
            break;
        case 'provincial-assessment':
            window.location.href = 'penilaian-provinsi.html';
            break;
        case 'field-assessment':
            window.location.href = 'penilaian-lapangan.html';
            break;
        case 'assessment-review':
            window.location.href = 'review-list.html';
            break;
        default:
            console.log('Action clicked:', action);
    }
}

function handleSearch(event) {
    console.log('Search:', event.target.value);
}

function handleFilterChange(event) {
    console.log('Filter:', event.target.value);
}

function viewSubmission(id) {
    console.log('View submission:', id);
}

function reviewSubmission(id) {
    console.log('Review submission:', id);
}

function goToReview() {
    window.location.href = 'review-list.html';
}

// Setup dark mode toggle buttons
function setupDarkModeButtons() {
    const themeToggleDesktop = document.getElementById('theme-toggle');
    const themeToggleMobile = document.getElementById('theme-toggle-mobile');

    if (themeToggleDesktop) {
        themeToggleDesktop.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (darkModeManager) {
                darkModeManager.toggle();
            }
        });
    }

    if (themeToggleMobile) {
        themeToggleMobile.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (darkModeManager) {
                darkModeManager.toggle();
            }
        });
    }
}

/**
 * Load announcements from admin panel for all three roles
 */
function loadAnnouncementsFromAdmin() {
    // Get announcements from 'dashboard' target
    let announcements = [];
    try {
        if (typeof announcementManager !== 'undefined') {
            announcements = announcementManager.getVisibleAnnouncements('dashboard');
        }
    } catch (e) {
        console.log('Error loading announcements:', e);
    }

    // Filter and update announcements for each role based on dashboardRoles
    if (announcements.length > 0) {
        // Filter for community (masyarakat)
        mockData.community.announcements = announcements.filter(ann => 
            ann.dashboardRoles && ann.dashboardRoles.includes('masyarakat')
        );

        // Filter for district (kabupaten/kota)
        mockData.district.announcements = announcements.filter(ann => 
            ann.dashboardRoles && ann.dashboardRoles.includes('kabkota')
        );

        // Filter for provincial (provinsi)
        mockData.provincial.announcements = announcements.filter(ann => 
            ann.dashboardRoles && ann.dashboardRoles.includes('provinsi')
        );
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Load announcements from admin panel
    loadAnnouncementsFromAdmin();
    
    // Initialize dark mode manager
    darkModeManager = new DarkModeManager();
    
    // Setup dark mode buttons
    setupDarkModeButtons();
    
    // Initialize dashboard
    init();
});

// Listen for announcement updates from admin panel
window.addEventListener('announcementsUpdated', function(event) {
    // Reload announcements from dashboard target
    loadAnnouncementsFromAdmin();
    
    // Re-render the current dashboard if it exists
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser.userRole && typeof init === 'function') {
        init();
    }
});