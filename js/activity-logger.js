/**
 * Activity Logger System
 * Mencatat semua aktivitas di dashboard admin dan menampilkannya di Recent Activity
 * 
 * Fitur:
 * - Log aktivitas pengumuman (tambah, edit, hapus)
 * - Log aktivitas data manager (simpan data)
 * - Menyimpan ke localStorage
 * - Menampilkan di Recent Activity dengan timestamp
 * - Auto-refresh setiap perubahan
 */

// Configuration
const ACTIVITY_CONFIG = {
  STORAGE_KEY: 'berseri_admin_activities',
  MAX_ACTIVITIES: 50,
  AUTO_REFRESH_INTERVAL: 1000, // 1 second
  DISPLAY_LIMIT: 10 // Show last 10 activities in Recent Activity
};

// Activity Types
const ACTIVITY_TYPES = {
  ANNOUNCEMENT_ADDED: 'announcement_added',
  ANNOUNCEMENT_EDITED: 'announcement_edited',
  ANNOUNCEMENT_DELETED: 'announcement_deleted',
  CHART_DATA_SAVED: 'chart_data_saved',
  MAP_DATA_SAVED: 'map_data_saved',
  DETAIL_BERSERI_SAVED: 'detail_berseri_saved',
  KABUPATEN_DATA_SAVED: 'kabupaten_data_saved'
};

// Activity Type Labels (in Indonesian)
const ACTIVITY_LABELS = {
  announcement_added: 'Menambah Pengumuman',
  announcement_edited: 'Mengedit Pengumuman',
  announcement_deleted: 'Menghapus Pengumuman',
  chart_data_saved: 'Menyimpan Chart Data',
  map_data_saved: 'Menyimpan Map Data',
  detail_berseri_saved: 'Menyimpan Detail BERSERI',
  kabupaten_data_saved: 'Menyimpan Data Kabupaten/Kota'
};

/**
 * Add activity to log with deduplication
 * @param {string} type - Activity type (from ACTIVITY_TYPES)
 * @param {string} description - Activity description
 * @param {object} details - Additional details (optional)
 */
function logActivity(type, description, details = {}) {
  try {
    // Get existing activities
    const activities = getActivities();
    
    // Deduplication: check if similar activity was just logged (within 2 seconds)
    const now = new Date();
    const lastActivity = activities[0];
    if (lastActivity) {
      const lastTime = new Date(lastActivity.timestamp);
      const timeDiff = now - lastTime;
      
      // Skip if same type and description within 2 seconds
      if (lastActivity.type === type && lastActivity.description === description && timeDiff < 2000) {
        console.log('Duplicate activity skipped:', type);
        return false;
      }
    }
    
    // Create new activity
    const newActivity = {
      id: Date.now().toString(),
      type: type,
      description: description,
      timestamp: new Date().toISOString(),
      details: details
    };
    
    // Add to beginning (most recent first)
    activities.unshift(newActivity);
    
    // Keep only MAX_ACTIVITIES
    if (activities.length > ACTIVITY_CONFIG.MAX_ACTIVITIES) {
      activities.splice(ACTIVITY_CONFIG.MAX_ACTIVITIES);
    }
    
    // Save to localStorage
    localStorage.setItem(ACTIVITY_CONFIG.STORAGE_KEY, JSON.stringify(activities));
    
    // Update UI
    updateRecentActivityDisplay();
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('activityLogged', { detail: newActivity }));
    
    console.log('Activity logged:', newActivity);
    return true;
  } catch (error) {
    console.error('Error logging activity:', error);
    return false;
  }
}

/**
 * Get all activities from localStorage
 * @returns {array} Activities array
 */
function getActivities() {
  try {
    const stored = localStorage.getItem(ACTIVITY_CONFIG.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting activities:', error);
    return [];
  }
}

/**
 * Get label for activity type
 * @param {string} type - Activity type
 * @returns {string} Activity label
 */
function getActivityLabel(type) {
  return ACTIVITY_LABELS[type] || type;
}

/**
 * Format timestamp to readable format
 * @param {string} isoString - ISO timestamp
 * @returns {string} Formatted time
 */
function formatActivityTime(isoString) {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    
    // Full date format
    const options = {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('id-ID', options);
  } catch (error) {
    return 'Waktu tidak tersedia';
  }
}

/**
 * Update Recent Activity display
 */
function updateRecentActivityDisplay() {
  try {
    const activities = getActivities();
    const activityList = document.querySelector('.activity-list');
    
    if (!activityList) {
      console.warn('Activity list element not found');
      return;
    }
    
    // Get only recent activities
    const recentActivities = activities.slice(0, ACTIVITY_CONFIG.DISPLAY_LIMIT);
    
    if (recentActivities.length === 0) {
      activityList.innerHTML = `
        <div class="activity-item">
          <p class="activity-text" style="color: var(--muted-foreground);">
            Tidak ada aktivitas terbaru
          </p>
        </div>
      `;
      return;
    }
    
    // Render activities
    activityList.innerHTML = recentActivities.map(activity => `
      <div class="activity-item">
        <div style="flex: 1;">
          <p class="activity-text">
            <strong>${getActivityLabel(activity.type)}</strong>
            ${activity.description ? `: ${activity.description}` : ''}
          </p>
          ${activity.details && Object.keys(activity.details).length > 0 ? `
            <small style="color: var(--muted-foreground); display: block; margin-top: 4px;">
              ${Object.entries(activity.details)
                .map(([key, value]) => `${key}: ${value}`)
                .join(' • ')}
            </small>
          ` : ''}
        </div>
        <span class="activity-time">${formatActivityTime(activity.timestamp)}</span>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error updating activity display:', error);
  }
}

/**
 * Clear all activities
 */
function clearAllActivities() {
  if (confirm('Apakah Anda yakin ingin menghapus semua aktivitas terbaru?')) {
    try {
      localStorage.removeItem(ACTIVITY_CONFIG.STORAGE_KEY);
      updateRecentActivityDisplay();
      console.log('All activities cleared');
      return true;
    } catch (error) {
      console.error('Error clearing activities:', error);
      return false;
    }
  }
  return false;
}

/**
 * Export activities as JSON
 */
function exportActivities() {
  try {
    const activities = getActivities();
    const dataStr = JSON.stringify(activities, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aktivitas-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    console.log('Activities exported');
    return true;
  } catch (error) {
    console.error('Error exporting activities:', error);
    return false;
  }
}

/**
 * Initialize activity logger
 */
function initializeActivityLogger() {
  try {
    // Initial display
    updateRecentActivityDisplay();
    
    // Auto-refresh display
    setInterval(updateRecentActivityDisplay, ACTIVITY_CONFIG.AUTO_REFRESH_INTERVAL);
    
    console.log('Activity logger initialized');
  } catch (error) {
    console.error('Error initializing activity logger:', error);
  }
}

/**
 * Add function override wrapper
 * @param {string} functionName - Global function name
 * @param {function} callback - Callback when function is called
 */
function overrideGlobalFunction(functionName, callback) {
  if (typeof window[functionName] === 'function') {
    const original = window[functionName];
    window[functionName] = function(...args) {
      const result = original.apply(this, args);
      callback(result, args);
      return result;
    };
    return true;
  }
  return false;
}

/**
 * Hook into Announcement Manager
 * Intercept announcement operations
 */
function setupAnnouncementActivityHooks() {
  try {
    // Hook saveNewAnnouncement - from main form
    overrideGlobalFunction('saveNewAnnouncement', (result, args) => {
      if (result) {
        const title = document.getElementById('ann-title')?.value || 'Pengumuman baru';
        const targets = [];
        if (document.getElementById('target-beranda')?.checked) targets.push('Beranda');
        if (document.getElementById('target-dashboard')?.checked) targets.push('Dashboard');
        
        logActivity(
          ACTIVITY_TYPES.ANNOUNCEMENT_ADDED,
          title,
          { 
            target: targets.join(' + ') || 'Unknown',
            dari: 'Form Utama'
          }
        );
      }
    });
    
    // Hook saveAnnouncementFromModal - from modal
    overrideGlobalFunction('saveAnnouncementFromModal', (result, args) => {
      if (result) {
        const title = document.getElementById('modal-ann-title')?.value || 'Pengumuman baru';
        const targets = [];
        if (document.getElementById('modal-target-beranda')?.checked) targets.push('Beranda');
        if (document.getElementById('modal-target-dashboard')?.checked) targets.push('Dashboard');
        
        logActivity(
          ACTIVITY_TYPES.ANNOUNCEMENT_ADDED,
          title,
          { 
            target: targets.join(' + ') || 'Unknown',
            dari: 'Modal'
          }
        );
      }
    });
    
    // Hook deleteAnnouncementByTarget
    overrideGlobalFunction('deleteAnnouncementByTarget', (result, args) => {
      if (result !== false) {
        const id = args[0];
        const target = args[1];
        logActivity(
          ACTIVITY_TYPES.ANNOUNCEMENT_DELETED,
          `Pengumuman dari ${target}`,
          { id: id, target: target }
        );
      }
    });
    
    // Hook updateAnnouncementByTarget
    overrideGlobalFunction('updateAnnouncementByTarget', (result, args) => {
      if (result !== false) {
        const id = args[0];
        const target = args[1];
        const title = document.getElementById('edit-ann-title')?.value || 'Pengumuman';
        
        logActivity(
          ACTIVITY_TYPES.ANNOUNCEMENT_EDITED,
          title,
          { id: id, target: target }
        );
      }
    });
    
    console.log('Announcement activity hooks setup');
  } catch (error) {
    console.error('Error setting up announcement hooks:', error);
  }
}

/**
 * Hook into Data Manager
 * Intercept data save operations
 */
function setupDataManagerActivityHooks() {
  try {
    // Hook Chart Data Save
    overrideGlobalFunction('saveChartData', (result, args) => {
      if (result) {
        logActivity(
          ACTIVITY_TYPES.CHART_DATA_SAVED,
          'Chart data berhasil disimpan',
          { dataType: 'Chart Data', size: document.getElementById('chart-json')?.value?.length || 0 }
        );
      }
    });
    
    // Hook Map Data Save
    overrideGlobalFunction('saveMapData', (result, args) => {
      if (result) {
        logActivity(
          ACTIVITY_TYPES.MAP_DATA_SAVED,
          'Map data berhasil disimpan',
          { dataType: 'Location Coordinates', size: document.getElementById('location-coordinates-json')?.value?.length || 0 }
        );
      }
    });
    
    // Hook Detail Data Save
    overrideGlobalFunction('saveDetailData', (result, args) => {
      if (result) {
        logActivity(
          ACTIVITY_TYPES.DETAIL_BERSERI_SAVED,
          'Detail BERSERI berhasil disimpan',
          { dataType: 'Data Detail BERSERI', size: document.getElementById('data-detail-berseri-json')?.value?.length || 0 }
        );
      }
    });
    
    // Hook Kabupaten Data Save
    overrideGlobalFunction('saveKabupatenData', (result, args) => {
      if (result) {
        logActivity(
          ACTIVITY_TYPES.KABUPATEN_DATA_SAVED,
          'Data Kabupaten/Kota berhasil disimpan',
          { dataType: 'Data Kabupaten/Kota', size: document.getElementById('data-kabupaten-json')?.value?.length || 0 }
        );
      }
    });
    
    console.log('Data manager activity hooks setup');
  } catch (error) {
    console.error('Error setting up data manager hooks:', error);
  }
}

/**
 * Setup all hooks and initialize
 */
function setupActivitySystem() {
  try {
    // Initialize logger
    initializeActivityLogger();
    
    // Setup hooks - delay to ensure functions are loaded
    setTimeout(() => {
      setupAnnouncementActivityHooks();
      setupDataManagerActivityHooks();
      console.log('Activity system fully initialized');
    }, 1000);
  } catch (error) {
    console.error('Error setting up activity system:', error);
  }
}

// Direct integration - intercept announcement manager functions when they're called
// We'll listen for changes in localStorage instead of trying to hook functions

function setupDirectActivityTracking() {
  try {
    // Monitor localStorage changes for announcements
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
      // Call original setItem
      originalSetItem.apply(this, arguments);
      
      // Track announcement additions/changes
      if (key === 'berseri_announcements_beranda' || key === 'berseri_announcements_dashboard') {
        try {
          // Skip if value is too large or doesn't look like JSON
          if (typeof value !== 'string' || value.length > 1000000) {
            return;
          }
          
          // Check if it's valid JSON
          if (!value.startsWith('[') && !value.startsWith('{')) {
            return;
          }
          
          const announcements = JSON.parse(value);
          if (Array.isArray(announcements) && announcements.length > 0) {
            // Get the last (most recent) announcement
            const lastAnn = announcements[0];
            const target = key === 'berseri_announcements_beranda' ? 'Beranda' : 'Dashboard';
            
            // Log this as activity
            logActivity(
              ACTIVITY_TYPES.ANNOUNCEMENT_ADDED,
              lastAnn.title || 'Pengumuman baru',
              { 
                target: target,
                dari: 'Direct Save'
              }
            );
          }
        } catch (e) {
          // Not JSON, skip silently
          console.debug('Skipped non-JSON data in activity tracking');
        }
      }
      
      // Track data manager saves
      if (key === 'berseri_admin_chart_data') {
        try {
          if (typeof value === 'string' && value.startsWith('{')) {
            JSON.parse(value);
            logActivity(
              ACTIVITY_TYPES.CHART_DATA_SAVED,
              'Chart data berhasil disimpan',
              { dataType: 'Chart Data' }
            );
          }
        } catch (e) {}
      }
      if (key === 'berseri_admin_map_data') {
        try {
          if (typeof value === 'string' && value.startsWith('{')) {
            JSON.parse(value);
            logActivity(
              ACTIVITY_TYPES.MAP_DATA_SAVED,
              'Map data berhasil disimpan',
              { dataType: 'Location Coordinates' }
            );
          }
        } catch (e) {}
      }
      if (key === 'berseri_admin_detail_berseri') {
        try {
          if (typeof value === 'string' && value.startsWith('{')) {
            JSON.parse(value);
            logActivity(
              ACTIVITY_TYPES.DETAIL_BERSERI_SAVED,
              'Detail BERSERI berhasil disimpan',
              { dataType: 'Data Detail BERSERI' }
            );
          }
        } catch (e) {}
      }
      if (key === 'berseri_admin_kabupaten_data') {
        try {
          if (typeof value === 'string' && value.startsWith('{')) {
            JSON.parse(value);
            logActivity(
              ACTIVITY_TYPES.KABUPATEN_DATA_SAVED,
              'Data Kabupaten/Kota berhasil disimpan',
              { dataType: 'Data Kabupaten/Kota' }
            );
          }
        } catch (e) {}
      }
    };
    
    console.log('Direct activity tracking setup');
  } catch (error) {
    console.error('Error setting up direct activity tracking:', error);
  }
}

/**
 * Setup all hooks and initialize
 */
function setupActivitySystem() {
  try {
    // Initialize logger
    initializeActivityLogger();
    
    // Setup direct tracking
    setupDirectActivityTracking();
    
    // Setup function hooks as fallback
    setTimeout(() => {
      setupAnnouncementActivityHooks();
      setupDataManagerActivityHooks();
      console.log('Activity system fully initialized');
    }, 1000);
  } catch (error) {
    console.error('Error setting up activity system:', error);
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
  setupActivitySystem();
});
