// Authentication check (MUST be first)
(function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // If no user or invalid role, clear storage and go to login
    if (!currentUser || currentUser.role !== 'provinsi') {
        // Clear all admin-related storage
        localStorage.removeItem('currentUser');
        localStorage.removeItem('admin.chartData');
        localStorage.removeItem('admin.locationCoordinates');
        localStorage.removeItem('admin.detailBerseri');
        localStorage.removeItem('admin.kabupatenKota');
        
        // Prevent infinite redirect by checking if already on login page
        if (window.location.pathname.includes('dashboard-admin.html') || !window.location.pathname.includes('login.html')) {
            window.location.replace('login.html');
        }
        return;
    }
})();

// State management
let currentTab = 'dashboard';
let mediaFiles = [];
let documents = [];
let notifications = [];
let currentDashboardAnnouncementFilter = 'all'; // Track announcement filter state

// Sidebar toggle functionality
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('open');
}

// Tab switching
function switchTab(tabName) {
  // Update current tab
  currentTab = tabName;
  
  // Hide all tab contents
  const allTabs = document.querySelectorAll('.tab-content');
  allTabs.forEach(tab => tab.classList.remove('active'));
  
  // Show selected tab
  const selectedTab = document.getElementById(tabName + '-tab');
  if (selectedTab) {
    selectedTab.classList.add('active');
  }
  
  // Update nav items
  const allNavItems = document.querySelectorAll('.nav-item');
  allNavItems.forEach(item => item.classList.remove('active'));
  
  const activeNavItem = document.querySelector(`[data-tab="${tabName}"]`);
  if (activeNavItem) {
    activeNavItem.classList.add('active');
  }
  
  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.remove('open');
  }
}

// Initialize nav items
document.addEventListener('DOMContentLoaded', function() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      const tabName = this.getAttribute('data-tab');
      switchTab(tabName);
    });
  });
  
  // Set initial active tab
  switchTab('dashboard');
});

// Page Content Management
function loadPageContent(pageId) {
  const pages = {
    homepage: { title: 'Homepage', slug: '/', description: 'Welcome to our website. Discover our services and products.' },
    about: { title: 'Tentang', slug: '/tentang', description: 'Learn more about our company, mission, and team.' },
    guide: { title: 'Guide', slug: '/guide', description: 'Get in touch with our team for inquiries.' }
  };
  
  const page = pages[pageId];
  if (page) {
    document.getElementById('page-title').value = page.title;
    document.getElementById('page-slug').value = page.slug;
    document.getElementById('page-description').value = page.description;
  }
}

function savePage() {
  const title = document.getElementById('page-title').value;
  const slug = document.getElementById('page-slug').value;
  const description = document.getElementById('page-description').value;
  
  console.log('Saving page:', { title, slug, description });
  alert('Page saved successfully!');
}

// Program Data Management
function switchDataTab(tabName) {
  const allDataTabs = document.querySelectorAll('.data-tab-content');
  allDataTabs.forEach(tab => tab.classList.remove('active'));
  
  const selectedTab = document.getElementById(tabName + '-data');
  if (selectedTab) {
    selectedTab.classList.add('active');
  }
  
  const allButtons = document.querySelectorAll('.tab-button');
  allButtons.forEach(btn => btn.classList.remove('active'));
  
  const activeButton = event.target;
  activeButton.classList.add('active');
}

function saveChartData() {
  const textarea = document.getElementById('chart-json');
  if (!textarea) { alert('Editor tidak ditemukan'); return; }
  const chartJson = textarea.value;
  try {
    const parsed = JSON.parse(chartJson);
    localStorage.setItem('admin.chartData', JSON.stringify(parsed));
    alert('Chart data disimpan (localStorage). Gunakan Export untuk mengunduh file JSON.');
  } catch (e) {
    alert('Format JSON tidak valid: ' + e.message);
  }
}

function saveMapData() {
  const textarea = document.getElementById('location-coordinates-json');
  if (!textarea) { alert('Editor tidak ditemukan'); return; }
  const mapJson = textarea.value;
  try {
    const parsed = JSON.parse(mapJson);
    localStorage.setItem('admin.locationCoordinates', JSON.stringify(parsed));
    alert('Map data disimpan (localStorage). Gunakan Load/Export untuk kelola file JSON.');
  } catch (e) {
    alert('Format JSON tidak valid: ' + e.message);
  }
}

// ===== Data Manager Helpers =====
function prettyJson(obj) { return JSON.stringify(obj, null, 2); }

function downloadJson(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Chart Data controls
function loadChartData() {
  const textarea = document.getElementById('chart-json');
  if (!textarea) return;
  const saved = localStorage.getItem('admin.chartData');
  if (saved) {
    try {
      textarea.value = prettyJson(JSON.parse(saved));
      alert('Chart data dimuat dari localStorage.');
    } catch {}
  } else {
    alert('Belum ada Chart data tersimpan. Menggunakan default.');
  }
}

async function loadChartFromFile() {
  const textarea = document.getElementById('chart-json');
  if (!textarea) return;
  try {
    const res = await fetch('json/chart-data.json', { cache: 'no-cache' });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    textarea.value = prettyJson(data);
    alert('Chart data dimuat dari file json/chart-data.json');
  } catch (e) {
    alert('Gagal memuat file: ' + e.message);
  }
}

function exportChartData() {
  const textarea = document.getElementById('chart-json');
  if (!textarea) return;
  try {
    const parsed = JSON.parse(textarea.value);
    downloadJson('chart-data.json', prettyJson(parsed));
  } catch (e) {
    alert('Format JSON tidak valid: ' + e.message);
  }
}

// Map Data controls
async function loadMapFromFile() {
  const textarea = document.getElementById('location-coordinates-json');
  if (!textarea) return;
  try {
    const res = await fetch('json/location-coordinates.json', { cache: 'no-cache' });
    const data = await res.json();
    textarea.value = prettyJson(data);
    alert('Map data dimuat dari file json/location-coordinates.json');
  } catch (e) {
    alert('Gagal memuat file: ' + e.message);
  }
}
function loadMapSaved() {
  const textarea = document.getElementById('location-coordinates-json');
  if (!textarea) return;
  const saved = localStorage.getItem('admin.locationCoordinates');
  if (saved) {
    textarea.value = prettyJson(JSON.parse(saved));
    alert('Map data dimuat dari localStorage.');
  } else {
    alert('Belum ada Map data tersimpan.');
  }
}
function exportMapData() {
  const textarea = document.getElementById('location-coordinates-json');
  if (!textarea) return;
  try {
    const parsed = JSON.parse(textarea.value);
    downloadJson('location-coordinates.json', prettyJson(parsed));
  } catch (e) {
    alert('Format JSON tidak valid: ' + e.message);
  }
}

// Detail BERSERI controls
async function loadDetailFromFile() {
  const textarea = document.getElementById('data-detail-berseri-json');
  if (!textarea) return;
  try {
    const res = await fetch('json/data-detail-berseri.json', { cache: 'no-cache' });
    const data = await res.json();
    textarea.value = prettyJson(data);
    alert('Data detail BERSERI dimuat dari file json/data-detail-berseri.json');
  } catch (e) {
    alert('Gagal memuat file: ' + e.message);
  }
}
function loadDetailSaved() {
  const textarea = document.getElementById('data-detail-berseri-json');
  if (!textarea) return;
  const saved = localStorage.getItem('admin.detailBerseri');
  if (saved) {
    textarea.value = prettyJson(JSON.parse(saved));
    alert('Data detail BERSERI dimuat dari localStorage.');
  } else {
    alert('Belum ada data tersimpan.');
  }
}
function saveDetailData() {
  const textarea = document.getElementById('data-detail-berseri-json');
  if (!textarea) { alert('Editor tidak ditemukan'); return; }
  try {
    const parsed = JSON.parse(textarea.value);
    localStorage.setItem('admin.detailBerseri', JSON.stringify(parsed));
    alert('Data detail BERSERI disimpan (localStorage).');
  } catch (e) {
    alert('Format JSON tidak valid: ' + e.message);
  }
}
function exportDetailData() {
  const textarea = document.getElementById('data-detail-berseri-json');
  if (!textarea) return;
  try {
    const parsed = JSON.parse(textarea.value);
    downloadJson('data-detail-berseri.json', prettyJson(parsed));
  } catch (e) {
    alert('Format JSON tidak valid: ' + e.message);
  }
}

// Kabupaten/Kota controls
async function loadKabupatenFromFile() {
  const textarea = document.getElementById('data-kabupaten-json');
  if (!textarea) return;
  try {
    const res = await fetch('json/data-kabupaten-kota.json', { cache: 'no-cache' });
    const data = await res.json();
    textarea.value = prettyJson(data);
    alert('Data Kabupaten/Kota dimuat dari file json/data-kabupaten-kota.json');
  } catch (e) {
    alert('Gagal memuat file: ' + e.message);
  }
}
function loadKabupatenSaved() {
  const textarea = document.getElementById('data-kabupaten-json');
  if (!textarea) return;
  const saved = localStorage.getItem('admin.kabupatenKota');
  if (saved) {
    textarea.value = prettyJson(JSON.parse(saved));
    alert('Data Kabupaten/Kota dimuat dari localStorage.');
  } else {
    alert('Belum ada data tersimpan.');
  }
}
function saveKabupatenData() {
  const textarea = document.getElementById('data-kabupaten-json');
  if (!textarea) { alert('Editor tidak ditemukan'); return; }
  try {
    const parsed = JSON.parse(textarea.value);
    localStorage.setItem('admin.kabupatenKota', JSON.stringify(parsed));
    alert('Data Kabupaten/Kota disimpan (localStorage).');
  } catch (e) {
    alert('Format JSON tidak valid: ' + e.message);
  }
}
function exportKabupatenData() {
  const textarea = document.getElementById('data-kabupaten-json');
  if (!textarea) return;
  try {
    const parsed = JSON.parse(textarea.value);
    downloadJson('data-kabupaten-kota.json', prettyJson(parsed));
  } catch (e) {
    alert('Format JSON tidak valid: ' + e.message);
  }
}

// Prefill editors on load
function preloadAdminEditors() {
  const chartSaved = localStorage.getItem('admin.chartData');
  if (chartSaved && document.getElementById('chart-json')) {
    try { document.getElementById('chart-json').value = prettyJson(JSON.parse(chartSaved)); } catch {}
  }
  const mapSaved = localStorage.getItem('admin.locationCoordinates');
  if (mapSaved && document.getElementById('location-coordinates-json')) {
    try { document.getElementById('location-coordinates-json').value = prettyJson(JSON.parse(mapSaved)); } catch {}
  }
  const detailSaved = localStorage.getItem('admin.detailBerseri');
  if (detailSaved && document.getElementById('data-detail-berseri-json')) {
    try { document.getElementById('data-detail-berseri-json').value = prettyJson(JSON.parse(detailSaved)); } catch {}
  }
  const kabSaved = localStorage.getItem('admin.kabupatenKota');
  if (kabSaved && document.getElementById('data-kabupaten-json')) {
    try { document.getElementById('data-kabupaten-json').value = prettyJson(JSON.parse(kabSaved)); } catch {}
  }
}

document.addEventListener('DOMContentLoaded', preloadAdminEditors);

// Documents Management
function openDocumentModal() {
  const modal = document.getElementById('document-modal');
  modal.classList.add('active');
}

function closeDocumentModal() {
  const modal = document.getElementById('document-modal');
  modal.classList.remove('active');
  document.getElementById('doc-title').value = '';
  document.getElementById('doc-file').value = '';
}

function saveDocument() {
  const title = document.getElementById('doc-title').value;
  const category = document.getElementById('doc-category').value;
  const file = document.getElementById('doc-file').files[0];
  
  if (!title || !file) {
    alert('Please fill in all fields');
    return;
  }
  
  console.log('Document saved:', { title, category, file: file.name });
  alert('Document uploaded successfully!');
  closeDocumentModal();
}

function filterDocuments(category) {
  console.log('Filtering documents by:', category);
  // In a real app, this would filter the document list
}

function downloadDocument(docId) {
  console.log('Downloading document:', docId);
  alert('Download started');
}

function deleteDocument(docId) {
  if (confirm('Are you sure you want to delete this document?')) {
    console.log('Deleting document:', docId);
    alert('Document deleted');
  }
}

// Media Library Management
function handleFileUpload(event) {
  const files = event.target.files;
  for (let file of files) {
    if (file.type.startsWith('image/')) {
      addMediaFile(file);
    }
  }
}

function handleDrop(event) {
  event.preventDefault();
  const files = event.dataTransfer.files;
  for (let file of files) {
    if (file.type.startsWith('image/')) {
      addMediaFile(file);
    }
  }
}

function handleDragOver(event) {
  event.preventDefault();
}

function addMediaFile(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const mediaId = 'media_' + Date.now();
    const mediaItem = {
      id: mediaId,
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      url: e.target.result
    };
    
    mediaFiles.push(mediaItem);
    renderMediaGrid();
  };
  reader.readAsDataURL(file);
}

function renderMediaGrid() {
  const grid = document.getElementById('media-grid');
  grid.innerHTML = mediaFiles.map(media => `
    <div class="media-item">
      <div class="media-preview" onclick="viewMedia('${media.id}')">
        <img src="${media.url}" alt="${media.name}">
      </div>
      <div class="media-info">
        <p class="media-name">${media.name}</p>
        <p class="media-size">${media.size}</p>
      </div>
      <div class="media-actions">
        <button class="btn-icon" onclick="copyMediaUrl('${media.id}')" style="flex: 1;">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon-sm">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z" />
          </svg>
        </button>
        <button class="btn-icon" onclick="deleteMedia('${media.id}')">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon-sm">
            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      </div>
    </div>
  `).join('');
}

function viewMedia(mediaId) {
  const media = mediaFiles.find(m => m.id === mediaId);
  if (media) {
    alert(`Viewing: ${media.name}\nSize: ${media.size}`);
  }
}

function copyMediaUrl(mediaId) {
  const media = mediaFiles.find(m => m.id === mediaId);
  if (media) {
    navigator.clipboard.writeText(media.url);
    alert('Media URL copied to clipboard!');
  }
}

function deleteMedia(mediaId) {
  if (confirm('Are you sure you want to delete this image?')) {
    mediaFiles = mediaFiles.filter(m => m.id !== mediaId);
    renderMediaGrid();
  }
}

// Notifications Management
function openNotificationModal() {
  const modal = document.getElementById('notification-modal');
  modal.classList.add('active');
}

function closeNotificationModal() {
  const modal = document.getElementById('notification-modal');
  modal.classList.remove('active');
  document.getElementById('notif-title').value = '';
  document.getElementById('notif-message').value = '';
}

function saveNotification() {
  const title = document.getElementById('notif-title').value;
  const message = document.getElementById('notif-message').value;
  const type = document.getElementById('notif-type').value;
  
  if (!title || !message) {
    alert('Please fill in all fields');
    return;
  }
  
  console.log('Notification saved:', { title, message, type });
  alert('Notification created successfully!');
  closeNotificationModal();
}

function editNotification(notifId) {
  console.log('Editing notification:', notifId);
  openNotificationModal();
}

function deleteNotification(notifId) {
  if (confirm('Are you sure you want to delete this notification?')) {
    console.log('Deleting notification:', notifId);
    alert('Notification deleted');
  }
}

// Registration Chart
let registrationChart;

function initRegistrationChart() {
  const ctx = document.getElementById('registrationChart').getContext('2d');
  
  registrationChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Pendaftar',
        data: [],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });

  // Add event listeners for filters
  document.getElementById('timeFilter').addEventListener('change', updateChart);
  document.getElementById('categoryFilter').addEventListener('change', updateChart);
}

function updateChart() {
  const timeFilter = document.getElementById('timeFilter').value;
  const categoryFilter = document.getElementById('categoryFilter').value;

  // Get data based on filters
  const { labels, data } = getFilteredData(timeFilter, categoryFilter);

  // Update chart
  registrationChart.data.labels = labels;
  registrationChart.data.datasets[0].data = data;
  registrationChart.update();
}

function getFilteredData(timeFilter, categoryFilter) {
  // Sample data - replace with actual data from your backend
  const now = new Date();
  const data = [];
  const labels = [];

  switch(timeFilter) {
    case '24h':
      // Generate hourly data for last 24 hours
      for(let i = 23; i >= 0; i--) {
        const hour = new Date(now - i * 3600000);
        labels.push(hour.getHours() + ':00');
        data.push(getDummyData(categoryFilter));
      }
      break;
    
    case 'week':
      // Generate daily data for last 7 days
      for(let i = 6; i >= 0; i--) {
        const day = new Date(now - i * 86400000);
        labels.push(day.toLocaleDateString('id-ID', { weekday: 'short' }));
        data.push(getDummyData(categoryFilter));
      }
      break;
    
    case 'month':
      // Generate data for last 30 days
      for(let i = 29; i >= 0; i--) {
        const day = new Date(now - i * 86400000);
        labels.push(day.getDate());
        data.push(getDummyData(categoryFilter));
      }
      break;
    
    case 'year':
      // Generate monthly data
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for(let i = 0; i < 12; i++) {
        labels.push(months[i]);
        data.push(getDummyData(categoryFilter));
      }
      break;
  }

  return { labels, data };
}

function getDummyData(category) {
  // Replace this with actual data from your backend
  if (category === 'all') {
    return Math.floor(Math.random() * 20);
  }
  return Math.floor(Math.random() * 10);
}

// Initialize chart when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initRegistrationChart();
  updateChart(); // Initial update
});

// Close sidebar when clicking outside on mobile
document.addEventListener('click', function(event) {
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  
  if (window.innerWidth <= 768) {
    if (!sidebar.contains(event.target) && !sidebarToggle.contains(event.target)) {
      sidebar.classList.remove('open');
    }
  }
});

// Handle window resize
window.addEventListener('resize', function() {
  const sidebar = document.getElementById('sidebar');
  if (window.innerWidth > 768) {
    sidebar.classList.remove('open');
  }
});

// Close modals when clicking outside
window.addEventListener('click', function(event) {
  const documentModal = document.getElementById('document-modal');
  const notificationModal = document.getElementById('notification-modal');
  const announcementModal = document.getElementById('announcement-modal');
  
  if (event.target === documentModal) {
    closeDocumentModal();
  }
  if (event.target === notificationModal) {
    closeNotificationModal();
  }
  if (event.target === announcementModal) {
    closeAnnouncementModal();
  }
});

// ===== ANNOUNCEMENT MANAGEMENT =====

let currentImageData = null;

/**
 * Initialize announcement manager and render lists
 */
function initializeAnnouncementManager() {
  setTodayDate();
  setupTargetToggle();
  renderBothAnnouncementLists();
}

/**
 * Setup target toggle to show/hide role selection
 */
function setupTargetToggle() {
  // Main form
  const dashboardCheckbox = document.getElementById('target-dashboard');
  const rolesSection = document.getElementById('dashboard-roles-section');
  
  if (dashboardCheckbox) {
    dashboardCheckbox.addEventListener('change', function() {
      if (rolesSection) {
        rolesSection.style.display = this.checked ? 'block' : 'none';
      }
    });
  }

  // Modal form
  const modalDashboardCheckbox = document.getElementById('modal-target-dashboard');
  const modalRolesSection = document.getElementById('modal-dashboard-roles');
  
  if (modalDashboardCheckbox) {
    modalDashboardCheckbox.addEventListener('change', function() {
      if (modalRolesSection) {
        modalRolesSection.style.display = this.checked ? 'block' : 'none';
      }
    });
  }
}

/**
 * Set today's date in the date input
 */
function setTodayDate() {
  const dateInput = document.getElementById('ann-date');
  if (dateInput) {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    dateInput.value = formattedDate;
  }
}

/**
 * Handle image upload with preview
 */
function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Validate file size (max 1MB)
  if (file.size > 1048576) {
    alert('Ukuran gambar maksimal 1MB');
    event.target.value = '';
    return;
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert('File harus berupa gambar (PNG, JPG, GIF)');
    event.target.value = '';
    return;
  }

  // Convert to base64
  const reader = new FileReader();
  reader.onload = function(e) {
    currentImageData = e.target.result;
    
    // Show preview
    const preview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    previewImg.src = currentImageData;
    preview.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

/**
 * Clear image upload
 */
function clearImageUpload() {
  currentImageData = null;
  document.getElementById('ann-image-input').value = '';
  document.getElementById('image-preview').style.display = 'none';
}

/**
 * Clear announcement form
 */
function clearAnnouncementForm() {
  document.getElementById('ann-title').value = '';
  document.getElementById('ann-description').value = '';
  document.getElementById('target-beranda').checked = true;
  document.getElementById('target-dashboard').checked = true;
  document.getElementById('role-masyarakat').checked = true;
  document.getElementById('role-kabkota').checked = true;
  document.getElementById('role-provinsi').checked = true;
  currentImageData = null;
  document.getElementById('ann-image-input').value = '';
  document.getElementById('image-preview').style.display = 'none';
  setTodayDate();
}

/**
 * Get selected targets from form
 */
function getSelectedTargets() {
  const targets = [];
  if (document.getElementById('target-beranda').checked) {
    targets.push('beranda');
  }
  if (document.getElementById('target-dashboard').checked) {
    targets.push('dashboard');
  }
  return targets;
}

/**
 * Get selected dashboard roles from form
 */
function getSelectedDashboardRoles() {
  const roles = [];
  if (document.getElementById('role-masyarakat').checked) {
    roles.push('masyarakat');
  }
  if (document.getElementById('role-kabkota').checked) {
    roles.push('kabkota');
  }
  if (document.getElementById('role-provinsi').checked) {
    roles.push('provinsi');
  }
  return roles;
}

/**
 * Save new announcement from main form
 */
function saveNewAnnouncement() {
  const title = document.getElementById('ann-title').value.trim();
  const description = document.getElementById('ann-description').value.trim();
  const targets = getSelectedTargets();
  const dashboardRoles = getSelectedDashboardRoles();

  // Validate
  if (!title) {
    alert('Judul pengumuman harus diisi');
    return;
  }
  
  if (!description) {
    alert('Deskripsi pengumuman harus diisi');
    return;
  }

  if (targets.length === 0) {
    alert('Pilih minimal satu target pengiriman');
    return;
  }

  // If dashboard is target, validate role selection
  if (targets.includes('dashboard') && dashboardRoles.length === 0) {
    alert('Pilih minimal satu role untuk dashboard');
    return;
  }

  try {
    const announcement = {
      title: title,
      description: description,
      imageUrl: currentImageData,
      targets: targets,
      dashboardRoles: dashboardRoles
    };

    announcementManager.addAnnouncement(announcement);
    
    // Log activity if available
    if (typeof logActivity === 'function') {
      logActivity('announcement_added', title, {
        target: targets.join(' + '),
        dari: 'Form Utama'
      });
    }
    
    // Clear form
    clearAnnouncementForm();
    
    // Re-render lists
    renderBothAnnouncementLists();
    
    alert('Pengumuman berhasil ditambahkan!');
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

/**
 * Get selected dashboard roles from modal
 */
function getSelectedModalDashboardRoles() {
  const roles = [];
  if (document.getElementById('modal-role-masyarakat').checked) {
    roles.push('masyarakat');
  }
  if (document.getElementById('modal-role-kabkota').checked) {
    roles.push('kabkota');
  }
  if (document.getElementById('modal-role-provinsi').checked) {
    roles.push('provinsi');
  }
  return roles;
}

/**
 * Save announcement from modal
 */
function saveAnnouncementFromModal() {
  const title = document.getElementById('modal-ann-title').value.trim();
  const description = document.getElementById('modal-ann-description').value.trim();
  const fileInput = document.getElementById('modal-ann-image');
  let imageData = null;

  // Get selected targets from modal
  const targets = [];
  if (document.getElementById('modal-target-beranda').checked) {
    targets.push('beranda');
  }
  if (document.getElementById('modal-target-dashboard').checked) {
    targets.push('dashboard');
  }

  const dashboardRoles = getSelectedModalDashboardRoles();

  if (!title) {
    alert('Judul harus diisi');
    return;
  }

  if (!description) {
    alert('Deskripsi harus diisi');
    return;
  }

  if (targets.length === 0) {
    alert('Pilih minimal satu target');
    return;
  }

  // If dashboard is target, validate role selection
  if (targets.includes('dashboard') && dashboardRoles.length === 0) {
    alert('Pilih minimal satu role untuk dashboard');
    return;
  }

  // Handle image if provided
  if (fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0];
    
    if (file.size > 1048576) {
      alert('Ukuran gambar maksimal 1MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const announcement = {
          title: title,
          description: description,
          imageUrl: e.target.result,
          targets: targets,
          dashboardRoles: dashboardRoles
        };

        announcementManager.addAnnouncement(announcement);
        
        // Log activity
        if (typeof logActivity === 'function') {
          logActivity('announcement_added', title, {
            target: targets.join(' + '),
            dari: 'Modal'
          });
        }
        
        closeAnnouncementModal();
        renderBothAnnouncementLists();
        alert('Pengumuman berhasil ditambahkan!');
      } catch (error) {
        alert('Error: ' + error.message);
      }
    };
    reader.readAsDataURL(file);
  } else {
    try {
      const announcement = {
        title: title,
        description: description,
        imageUrl: null,
        targets: targets,
        dashboardRoles: dashboardRoles
      };

      announcementManager.addAnnouncement(announcement);
      
      // Log activity
      if (typeof logActivity === 'function') {
        logActivity('announcement_added', title, {
          target: targets.join(' + '),
          dari: 'Modal'
        });
      }
      
      closeAnnouncementModal();
      renderBothAnnouncementLists();
      alert('Pengumuman berhasil ditambahkan!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }
}

/**
 * Render both beranda and dashboard announcement lists
 */
function renderBothAnnouncementLists() {
  renderAnnouncementsListByTarget('beranda');
  // For dashboard, use current filter state
  renderAnnouncementsListByTarget('dashboard', currentDashboardAnnouncementFilter);
  updateAnnouncementCounters();
}

/**
 * Filter dashboard announcements berdasarkan role yang dipilih
 */
function filterDashboardAnnouncements() {
  const filterElement = document.getElementById('dashboard-announcement-filter');
  if (!filterElement) return;
  
  const selectedRole = filterElement.value;
  currentDashboardAnnouncementFilter = selectedRole;
  
  // Re-render dengan filter baru
  renderAnnouncementsListByTarget('dashboard', selectedRole);
}

/**
 * Render announcements list by target
 */
function renderAnnouncementsListByTarget(target, filterRole = 'all') {
  const containerId = target === 'beranda' ? 'announcements-list-beranda' : 'announcements-list-dashboard';
  const container = document.getElementById(containerId);
  
  if (!container) return;

  let announcements = announcementManager.getAnnouncements(target);
  
  // Filter berdasarkan role jika target adalah dashboard
  if (target === 'dashboard' && filterRole !== 'all') {
    announcements = announcements.filter(ann => {
      const roles = ann.dashboardRoles || [];
      return roles.includes(filterRole);
    });
  }
  
  if (announcements.length === 0) {
    container.innerHTML = '<p style="color:#9CA3AF; text-align:center; padding:20px;">Belum ada pengumuman</p>';
    return;
  }

  container.innerHTML = announcements.map(ann => {
    // Buat badges untuk roles (hanya untuk dashboard target)
    let rolesBadges = '';
    if (target === 'dashboard' && ann.dashboardRoles && ann.dashboardRoles.length > 0) {
      rolesBadges = ann.dashboardRoles.map(role => {
        const roleLabel = role === 'masyarakat' ? 'Masyarakat' : 
                         role === 'kabkota' ? 'Kabkota' : 
                         role === 'provinsi' ? 'Provinsi' : role;
        const roleColor = role === 'masyarakat' ? '#3B82F6' : 
                         role === 'kabkota' ? '#F59E0B' : 
                         role === 'provinsi' ? '#10B981' : '#6B7280';
        return `<span style="display:inline-block; padding:4px 8px; background:${roleColor}; color:white; border-radius:4px; font-size:11px; font-weight:600; margin-right:4px;">${roleLabel}</span>`;
      }).join('');
    }
    
    return `
    <div style="border:1px solid #E5E7EB; border-radius:8px; padding:12px; background:#F9FAFB;">
      <div style="display:flex; gap:12px;">
        ${ann.imageUrl ? `<img src="${ann.imageUrl}" style="width:80px; height:80px; border-radius:6px; object-fit:cover;">` : `<div style="width:80px; height:80px; background:#E5E7EB; border-radius:6px;"></div>`}
        <div style="flex:1;">
          <h4 style="margin:0 0 4px 0; color:#1F2937; font-weight:600;">${ann.title}</h4>
          ${rolesBadges ? `<div style="margin:0 0 8px 0;">${rolesBadges}</div>` : ''}
          <p style="margin:0 0 8px 0; color:#6B7280; font-size:13px;">${ann.description.substring(0, 60)}...</p>
          <p style="margin:0; color:#9CA3AF; font-size:12px;">${new Date(ann.uploadDate).toLocaleDateString('id-ID')}</p>
        </div>
        <div style="display:flex; flex-direction:column; gap:6px;">
          <button style="padding:6px 12px; font-size:12px; background:#10B981; color:white; border:none; border-radius:4px; cursor:pointer; transition:0.2s;" onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10B981'" onclick="editAnnouncementByTarget('${ann.id}', '${target}')">Edit</button>
          <button style="padding:6px 12px; font-size:12px; background:#EF4444; color:white; border:none; border-radius:4px; cursor:pointer; transition:0.2s;" onmouseover="this.style.background='#DC2626'" onmouseout="this.style.background='#EF4444'" onclick="deleteAnnouncementByTarget('${ann.id}', '${target}')">Delete</button>
        </div>
      </div>
    </div>
  `;
  }).join('');
}

/**
 * Update announcement counters for both targets
 */
function updateAnnouncementCounters() {
  const berandaAnn = announcementManager.getAnnouncements('beranda');
  const dashboardAnn = announcementManager.getAnnouncements('dashboard');
  
  const berandaCounter = document.getElementById('ann-counter-beranda');
  const dashboardCounter = document.getElementById('ann-counter-dashboard');
  
  if (berandaCounter) {
    berandaCounter.textContent = `${berandaAnn.length} / 20`;
  }
  
  if (dashboardCounter) {
    dashboardCounter.textContent = `${dashboardAnn.length} / 30`;
  }
}

/**
 * Delete announcement from specific target
 */
function deleteAnnouncementByTarget(id, target) {
  if (confirm('Yakin ingin menghapus pengumuman ini?')) {
    announcementManager.deleteAnnouncement(id, target);
    
    // Log activity
    if (typeof logActivity === 'function') {
      logActivity('announcement_deleted', `Pengumuman dari ${target}`, {
        id: id,
        target: target
      });
    }
    
    renderBothAnnouncementLists();
    alert('Pengumuman berhasil dihapus!');
  }
}

/**
 * Edit announcement by target
 */
function editAnnouncementByTarget(id, target) {
  // Get announcement from the target
  const announcements = announcementManager.getAnnouncements(target);
  const announcement = announcements.find(a => a.id === id);
  
  if (!announcement) {
    alert('Pengumuman tidak ditemukan');
    return;
  }
  
  // Pre-fill form with existing data
  document.getElementById('ann-title').value = announcement.title;
  document.getElementById('ann-description').value = announcement.description;
  document.getElementById('ann-date').value = announcement.date;
  
  // Set current image
  if (announcement.imageUrl) {
    currentImageData = announcement.imageUrl;
    document.getElementById('preview-img').src = currentImageData;
    document.getElementById('image-preview').style.display = 'block';
  }
  
  // Set targets based on announcement.targets
  const hasTargetBeranda = announcement.targets && announcement.targets.includes('beranda');
  const hasTargetDashboard = announcement.targets && announcement.targets.includes('dashboard');
  
  document.getElementById('target-beranda').checked = hasTargetBeranda;
  document.getElementById('target-dashboard').checked = hasTargetDashboard;
  
  // Show/hide role section based on dashboard target
  const rolesSection = document.getElementById('dashboard-roles-section');
  if (rolesSection) {
    rolesSection.style.display = hasTargetDashboard ? 'block' : 'none';
  }
  
  // Set dashboard roles
  const roles = announcement.dashboardRoles || ['masyarakat', 'kabkota', 'provinsi'];
  document.getElementById('role-masyarakat').checked = roles.includes('masyarakat');
  document.getElementById('role-kabkota').checked = roles.includes('kabkota');
  document.getElementById('role-provinsi').checked = roles.includes('provinsi');
  
  // Change button text and behavior for edit mode
  const saveButton = document.querySelector('button[onclick="saveNewAnnouncement()"]');
  const clearButton = document.querySelector('button[onclick="clearAnnouncementForm()"]');
  
  if (saveButton && clearButton) {
    saveButton.textContent = 'Update Announcement';
    clearButton.textContent = 'Cancel Edit';
    
    // Store edit mode state
    window.editMode = {
      id: id,
      target: target,
      originalSaveButton: saveButton.onclick
    };
    
    // Override save button
    saveButton.onclick = function() {
      updateAnnouncementByTarget(id, target);
    };
    
    // Override clear button to cancel edit
    clearButton.onclick = function() {
      window.editMode = null;
      saveButton.textContent = 'Save Announcement';
      clearButton.textContent = 'Clear';
      saveButton.onclick = function() { saveNewAnnouncement(); };
      clearButton.onclick = function() { clearAnnouncementForm(); };
      clearAnnouncementForm();
    };
  }
  
  // Scroll to form
  document.querySelector('.card').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Update announcement after edit
 */
function updateAnnouncementByTarget(id, target) {
  const title = document.getElementById('ann-title').value.trim();
  const description = document.getElementById('ann-description').value.trim();
  const targets = getSelectedTargets();
  const dashboardRoles = getSelectedDashboardRoles();

  // Validate
  if (!title) {
    alert('Judul pengumuman harus diisi');
    return;
  }
  
  if (!description) {
    alert('Deskripsi pengumuman harus diisi');
    return;
  }

  if (targets.length === 0) {
    alert('Pilih minimal satu target pengiriman');
    return;
  }

  if (targets.includes('dashboard') && dashboardRoles.length === 0) {
    alert('Pilih minimal satu role untuk dashboard');
    return;
  }

  try {
    const updates = {
      title: title,
      description: description,
      imageUrl: currentImageData,
      targets: targets,
      dashboardRoles: dashboardRoles
    };

    // Update the announcement in its original target
    announcementManager.updateAnnouncement(id, updates, target);
    
    // Log activity
    if (typeof logActivity === 'function') {
      logActivity('announcement_edited', title, {
        id: id,
        target: target
      });
    }
    
    // If targets changed, handle moving between lists
    if (!targets.includes(target) && target === 'beranda') {
      // Was in beranda, now only in dashboard (or vice versa)
      announcementManager.deleteAnnouncement(id, 'beranda');
    } else if (!targets.includes(target) && target === 'dashboard') {
      announcementManager.deleteAnnouncement(id, 'dashboard');
    }
    
    // Add to new targets if they weren't there before
    const oldAnnouncements = announcementManager.getAnnouncements(target);
    const oldAnn = oldAnnouncements.find(a => a.id === id);
    
    if (oldAnn) {
      const oldTargets = oldAnn.targets || [];
      targets.forEach(t => {
        if (!oldTargets.includes(t)) {
          const berandaAnn = announcementManager.getAnnouncements('beranda');
          const dashboardAnn = announcementManager.getAnnouncements('dashboard');
          
          if (t === 'beranda' && !berandaAnn.find(a => a.id === id)) {
            announcementManager.addAnnouncement({
              title: title,
              description: description,
              imageUrl: currentImageData,
              targets: [t],
              dashboardRoles: dashboardRoles
            });
          } else if (t === 'dashboard' && !dashboardAnn.find(a => a.id === id)) {
            announcementManager.addAnnouncement({
              title: title,
              description: description,
              imageUrl: currentImageData,
              targets: [t],
              dashboardRoles: dashboardRoles
            });
          }
        }
      });
    }
    
    // Clear form and reset button
    const saveButton = document.querySelector('button[onclick="saveNewAnnouncement()"]');
    const clearButton = document.querySelector('button[onclick="clearAnnouncementForm()"]');
    
    if (saveButton && clearButton) {
      saveButton.textContent = 'Save Announcement';
      clearButton.textContent = 'Clear';
      saveButton.onclick = function() { saveNewAnnouncement(); };
      clearButton.onclick = function() { clearAnnouncementForm(); };
    }
    
    clearAnnouncementForm();
    renderBothAnnouncementLists();
    
    alert('Pengumuman berhasil diperbarui!');
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

/**
 * Open announcement modal
 */
function openAnnouncementModal() {
  const modal = document.getElementById('announcement-modal');
  modal.classList.add('active');
  document.getElementById('modal-ann-title').value = '';
  document.getElementById('modal-ann-description').value = '';
  document.getElementById('modal-ann-image').value = '';
  document.getElementById('modal-target-beranda').checked = true;
  document.getElementById('modal-target-dashboard').checked = true;
  document.getElementById('modal-role-masyarakat').checked = true;
  document.getElementById('modal-role-kabkota').checked = true;
  document.getElementById('modal-role-provinsi').checked = true;
  // Show role section since dashboard is checked by default
  document.getElementById('modal-dashboard-roles').style.display = 'block';
}

/**
 * Close announcement modal
 */
function closeAnnouncementModal() {
  const modal = document.getElementById('announcement-modal');
  modal.classList.remove('active');
}

/**
 * Sync announcements to other pages (beranda, dashboard-penilaian)
 */
function syncAnnouncementsToPages() {
  // Emit event untuk notify halaman lain tentang update
  announcementManager.emitUpdateEvent();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeAnnouncementManager();
});
