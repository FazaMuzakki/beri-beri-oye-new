/**
 * Data Manager - localStorage Integration
 * File: js/data-manager.js
 * Purpose: Handle save/load/export functionality for all data manager tabs
 */

// ===== STORAGE KEYS =====
const STORAGE_KEYS = {
  CHART_DATA: 'berseri_admin_chart_data',
  MAP_DATA: 'berseri_admin_map_data',
  DETAIL_BERSERI: 'berseri_admin_detail_berseri',
  KABUPATEN_DATA: 'berseri_admin_kabupaten_data'
};

// ===== INITIALIZATION =====
/**
 * Initialize data manager on page load
 */
function initializeDataManager() {
  // Load saved data into textareas
  loadAllSavedData();
  
  // Setup file input handlers
  setupFileInputHandlers();
  
  // Setup auto-save functionality (optional)
  setupAutoSave();
}

/**
 * Load all saved data from localStorage
 */
function loadAllSavedData() {
  loadChartDataFromStorage();
  loadMapDataFromStorage();
  loadDetailBerseriFromStorage();
  loadKabupatenDataFromStorage();
}

/**
 * Setup file input handlers for all tabs
 */
function setupFileInputHandlers() {
  const fileInputs = document.querySelectorAll('input[type="file"]');
  fileInputs.forEach(input => {
    input.addEventListener('change', function(e) {
      handleFileUpload(e, this.id);
    });
  });
}

/**
 * Setup auto-save functionality (save every 30 seconds if data changed)
 */
function setupAutoSave() {
  // Track if data has changed
  let dataChanged = false;
  
  // Add change listeners to all textareas
  const textareas = document.querySelectorAll('.code-textarea');
  textareas.forEach(textarea => {
    textarea.addEventListener('change', () => {
      dataChanged = true;
    });
  });
  
  // Auto-save every 30 seconds if data changed
  setInterval(() => {
    if (dataChanged) {
      console.log('Auto-saving data...');
      saveAllData();
      dataChanged = false;
    }
  }, 30000);
}

// ===== CHART DATA =====
/**
 * Save Chart Data from tabel inputs (NEW VERSION)
 */
function saveChartDataSimple() {
  try {
    // Use the function dari dashboard-admin.html untuk ambil data dari tabel
    if (typeof getChartDataFromTable === 'function') {
      const chartData = getChartDataFromTable();
      
      // Update hidden textarea juga
      const textarea = document.getElementById('chart-json');
      if (textarea) {
        textarea.value = JSON.stringify(chartData, null, 2);
      }
      
      // Save to localStorage dengan key yang benar
      localStorage.setItem('berseri_admin_chart_data', JSON.stringify(chartData, null, 2));
      
      // Trigger storage event untuk semua tab
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'berseri_admin_chart_data',
        newValue: JSON.stringify(chartData, null, 2),
        oldValue: null,
        storageArea: localStorage
      }));
      
      // Simpan timestamp
      localStorage.setItem('berseri_chart_data_timestamp', new Date().getTime().toString());
      
      showNotification('✅ Data chart berhasil disimpan! Beranda akan update otomatis.', 'success');
      console.log('Chart data saved:', chartData);
      
      return true;
    } else {
      showNotification('❌ Error: Tabel belum siap', 'error');
      return false;
    }
  } catch (e) {
    showNotification('❌ Error: ' + e.message, 'error');
    console.error('Error saving chart data:', e);
    return false;
  }
}

/**
 * Load Chart Data from localStorage and populate tabel
 */
function loadChartDataFromStorage() {
  try {
    const saved = localStorage.getItem('berseri_admin_chart_data');
    
    if (saved) {
      const chartData = JSON.parse(saved);
      
      // Use function dari dashboard-admin.html untuk load ke tabel
      if (typeof loadChartTableData === 'function') {
        loadChartTableData(chartData);
      }
      
      // Update hidden textarea
      const textarea = document.getElementById('chart-json');
      if (textarea) {
        textarea.value = JSON.stringify(chartData, null, 2);
      }
      
      showNotification('✅ Data chart berhasil dimuat dari penyimpanan', 'success');
      console.log('Chart data loaded from storage:', chartData);
      showNotification('✅ Data chart berhasil dimuat dari penyimpanan', 'success');
      console.log('Chart data loaded from storage:', chartData);
    } else {
      // Load dari default file
      loadChartDataFromDefaultFile();
    }
  } catch (e) {
    showNotification('❌ Error loading data: ' + e.message, 'error');
    console.error('Error loading chart data:', e);
  }
}

/**
 * Load Chart Data from default JSON file (bar-chart-berseri.json)
 */
async function loadChartDataFromDefaultFile() {
  try {
    const response = await fetch('json/bar-chart-berseri.json');
    if (!response.ok) {
      console.error('Failed to load bar-chart-berseri.json');
      return;
    }
    
    const chartData = await response.json();
    
    // Use function dari dashboard-admin.html untuk load ke tabel
    if (typeof loadChartTableData === 'function') {
      loadChartTableData(chartData);
    }
    
    // Update hidden textarea
    const textarea = document.getElementById('chart-json');
    if (textarea) {
      textarea.value = JSON.stringify(chartData, null, 2);
    }
    
    showNotification('✅ Data default berhasil dimuat', 'success');
    console.log('Chart data loaded from default file (bar-chart-berseri.json)');
  } catch (e) {
    showNotification('❌ Error loading file: ' + e.message, 'error');
    console.error('Error loading chart data from file:', e);
  }
}

/**
 * Save Chart Data to localStorage (legacy - tetap untuk kompatibilitas)
 */
function saveChartData() {
  // Call the simple version
  return saveChartDataSimple();
}

/**
 * Load Chart Data from file
 */
async function loadChartFromFile() {
  try {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const text = await file.text();
      
      // Validate JSON
      try {
        const chartData = JSON.parse(text);
        
        // Load ke tabel menggunakan function dari dashboard-admin.html
        if (typeof loadChartTableData === 'function') {
          loadChartTableData(chartData);
        }
        
        // Update textarea
        const textarea = document.getElementById('chart-json');
        if (textarea) {
          textarea.value = text;
        }
        
        showNotification('✅ File berhasil dimuat', 'success');
      } catch (err) {
        showNotification('❌ Format JSON tidak valid: ' + err.message, 'error');
      }
    };
    
    input.click();
  } catch (e) {
    showNotification('❌ Error: ' + e.message, 'error');
    console.error('Error:', e);
  }
}

/**
 * Export Chart Data as JSON file
 */
function exportChartData() {
  const textarea = document.getElementById('chart-json');
  if (!textarea) return;
  
  try {
    const jsonText = textarea.value.trim();
    if (!jsonText) {
      showNotification('No data to export', 'error');
      return;
    }
    
    // Validate JSON
    JSON.parse(jsonText);
    
    downloadJSON('bar-chart-data.json', jsonText);
    showNotification('Chart data exported successfully', 'success');
  } catch (e) {
    showNotification('Invalid JSON: ' + e.message, 'error');
    console.error('Error:', e);
  }
}

// ===== MAP DATA =====
/**
 * Save Map Data to localStorage
 */
function saveMapData() {
  const textarea = document.getElementById('location-coordinates-json');
  if (!textarea) {
    console.error('Map JSON textarea not found');
    return false;
  }
  
  try {
    const jsonText = textarea.value.trim();
    
    if (!jsonText) {
      showNotification('Please enter JSON data', 'error');
      return false;
    }
    
    const jsonData = JSON.parse(jsonText);
    
    localStorage.setItem(STORAGE_KEYS.MAP_DATA, JSON.stringify(jsonData, null, 2));
    
    showNotification('Map data saved successfully!', 'success');
    console.log('Map data saved:', jsonData);
    return true;
  } catch (e) {
    showNotification('Invalid JSON format: ' + e.message, 'error');
    console.error('Error saving map data:', e);
    return false;
  }
}

/**
 * Load Map Data from localStorage
 */
function loadMapDataFromStorage() {
  const textarea = document.getElementById('location-coordinates-json');
  if (!textarea) return;
  
  const saved = localStorage.getItem(STORAGE_KEYS.MAP_DATA);
  if (saved) {
    try {
      textarea.value = saved;
      console.log('Map data loaded from storage');
    } catch (e) {
      console.error('Error loading map data:', e);
    }
  }
}

/**
 * Load Map Data from file
 */
async function loadMapFromFile() {
  const textarea = document.getElementById('location-coordinates-json');
  if (!textarea) return;
  
  try {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const text = await file.text();
      
      try {
        JSON.parse(text);
        textarea.value = text;
        showNotification('Map data loaded from file', 'success');
      } catch (err) {
        showNotification('Invalid JSON file: ' + err.message, 'error');
      }
    };
    
    input.click();
  } catch (e) {
    showNotification('Error loading file: ' + e.message, 'error');
    console.error('Error:', e);
  }
}

/**
 * Load Map Data from saved localStorage
 */
function loadMapSaved() {
  const textarea = document.getElementById('location-coordinates-json');
  if (!textarea) return;
  
  const saved = localStorage.getItem(STORAGE_KEYS.MAP_DATA);
  if (saved) {
    textarea.value = saved;
    showNotification('Map data reloaded from storage', 'success');
  } else {
    showNotification('No saved map data found', 'warning');
  }
}

/**
 * Export Map Data as JSON file
 */
function exportMapData() {
  const textarea = document.getElementById('location-coordinates-json');
  if (!textarea) return;
  
  try {
    const jsonText = textarea.value.trim();
    if (!jsonText) {
      showNotification('No data to export', 'error');
      return;
    }
    
    JSON.parse(jsonText);
    downloadJSON('map-coordinates.json', jsonText);
    showNotification('Map data exported successfully', 'success');
  } catch (e) {
    showNotification('Invalid JSON: ' + e.message, 'error');
    console.error('Error:', e);
  }
}

// ===== DETAIL BERSERI DATA =====
/**
 * Save Detail BERSERI Data to localStorage
 */
function saveDetailData() {
  const textarea = document.getElementById('data-detail-berseri-json');
  if (!textarea) {
    console.error('Detail BERSERI JSON textarea not found');
    return false;
  }
  
  try {
    const jsonText = textarea.value.trim();
    
    if (!jsonText) {
      showNotification('Please enter JSON data', 'error');
      return false;
    }
    
    const jsonData = JSON.parse(jsonText);
    
    localStorage.setItem(STORAGE_KEYS.DETAIL_BERSERI, JSON.stringify(jsonData, null, 2));
    
    showNotification('Detail BERSERI data saved successfully!', 'success');
    console.log('Detail BERSERI data saved:', jsonData);
    return true;
  } catch (e) {
    showNotification('Invalid JSON format: ' + e.message, 'error');
    console.error('Error saving detail BERSERI data:', e);
    return false;
  }
}

/**
 * Load Detail BERSERI Data from localStorage
 */
function loadDetailBerseriFromStorage() {
  const textarea = document.getElementById('data-detail-berseri-json');
  if (!textarea) return;
  
  const saved = localStorage.getItem(STORAGE_KEYS.DETAIL_BERSERI);
  if (saved) {
    try {
      textarea.value = saved;
      console.log('Detail BERSERI data loaded from storage');
    } catch (e) {
      console.error('Error loading detail BERSERI data:', e);
    }
  }
}

/**
 * Load Detail BERSERI Data from file
 */
async function loadDetailFromFile() {
  const textarea = document.getElementById('data-detail-berseri-json');
  if (!textarea) return;
  
  try {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const text = await file.text();
      
      try {
        JSON.parse(text);
        textarea.value = text;
        showNotification('Detail BERSERI data loaded from file', 'success');
      } catch (err) {
        showNotification('Invalid JSON file: ' + err.message, 'error');
      }
    };
    
    input.click();
  } catch (e) {
    showNotification('Error loading file: ' + e.message, 'error');
    console.error('Error:', e);
  }
}

/**
 * Load Detail BERSERI Data from saved localStorage
 */
function loadDetailSaved() {
  const textarea = document.getElementById('data-detail-berseri-json');
  if (!textarea) return;
  
  const saved = localStorage.getItem(STORAGE_KEYS.DETAIL_BERSERI);
  if (saved) {
    textarea.value = saved;
    showNotification('Detail BERSERI data reloaded from storage', 'success');
  } else {
    showNotification('No saved Detail BERSERI data found', 'warning');
  }
}

/**
 * Export Detail BERSERI Data as JSON file
 */
function exportDetailData() {
  const textarea = document.getElementById('data-detail-berseri-json');
  if (!textarea) return;
  
  try {
    const jsonText = textarea.value.trim();
    if (!jsonText) {
      showNotification('No data to export', 'error');
      return;
    }
    
    JSON.parse(jsonText);
    downloadJSON('detail-berseri.json', jsonText);
    showNotification('Detail BERSERI data exported successfully', 'success');
  } catch (e) {
    showNotification('Invalid JSON: ' + e.message, 'error');
    console.error('Error:', e);
  }
}

// ===== KABUPATEN/KOTA DATA =====
/**
 * Save Kabupaten/Kota Data to localStorage
 */
function saveKabupatenData() {
  const textarea = document.getElementById('data-kabupaten-json');
  if (!textarea) {
    console.error('Kabupaten/Kota JSON textarea not found');
    return false;
  }
  
  try {
    const jsonText = textarea.value.trim();
    
    if (!jsonText) {
      showNotification('Please enter JSON data', 'error');
      return false;
    }
    
    const jsonData = JSON.parse(jsonText);
    
    localStorage.setItem(STORAGE_KEYS.KABUPATEN_DATA, JSON.stringify(jsonData, null, 2));
    
    showNotification('Kabupaten/Kota data saved successfully!', 'success');
    console.log('Kabupaten/Kota data saved:', jsonData);
    return true;
  } catch (e) {
    showNotification('Invalid JSON format: ' + e.message, 'error');
    console.error('Error saving Kabupaten/Kota data:', e);
    return false;
  }
}

/**
 * Load Kabupaten/Kota Data from localStorage
 */
function loadKabupatenDataFromStorage() {
  const textarea = document.getElementById('data-kabupaten-json');
  if (!textarea) return;
  
  const saved = localStorage.getItem(STORAGE_KEYS.KABUPATEN_DATA);
  if (saved) {
    try {
      textarea.value = saved;
      console.log('Kabupaten/Kota data loaded from storage');
    } catch (e) {
      console.error('Error loading Kabupaten/Kota data:', e);
    }
  }
}

/**
 * Load Kabupaten/Kota Data from file
 */
async function loadKabupatenFromFile() {
  const textarea = document.getElementById('data-kabupaten-json');
  if (!textarea) return;
  
  try {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const text = await file.text();
      
      try {
        JSON.parse(text);
        textarea.value = text;
        showNotification('Kabupaten/Kota data loaded from file', 'success');
      } catch (err) {
        showNotification('Invalid JSON file: ' + err.message, 'error');
      }
    };
    
    input.click();
  } catch (e) {
    showNotification('Error loading file: ' + e.message, 'error');
    console.error('Error:', e);
  }
}

/**
 * Load Kabupaten/Kota Data from saved localStorage
 */
function loadKabupatenSaved() {
  const textarea = document.getElementById('data-kabupaten-json');
  if (!textarea) return;
  
  const saved = localStorage.getItem(STORAGE_KEYS.KABUPATEN_DATA);
  if (saved) {
    textarea.value = saved;
    showNotification('Kabupaten/Kota data reloaded from storage', 'success');
  } else {
    showNotification('No saved Kabupaten/Kota data found', 'warning');
  }
}

/**
 * Export Kabupaten/Kota Data as JSON file
 */
function exportKabupatenData() {
  const textarea = document.getElementById('data-kabupaten-json');
  if (!textarea) return;
  
  try {
    const jsonText = textarea.value.trim();
    if (!jsonText) {
      showNotification('No data to export', 'error');
      return;
    }
    
    JSON.parse(jsonText);
    downloadJSON('kabupaten-kota.json', jsonText);
    showNotification('Kabupaten/Kota data exported successfully', 'success');
  } catch (e) {
    showNotification('Invalid JSON: ' + e.message, 'error');
    console.error('Error:', e);
  }
}

// ===== SAVE ALL DATA =====
/**
 * Save all data from all tabs
 */
function saveAllData() {
  const results = {
    chart: saveChartData(),
    map: saveMapData(),
    detail: saveDetailData(),
    kabupaten: saveKabupatenData()
  };
  
  const successful = Object.values(results).filter(r => r).length;
  console.log(`Saved ${successful} out of 4 data tabs`);
  
  return results;
}

// ===== UTILITY FUNCTIONS =====
/**
 * Download JSON file
 */
function downloadJSON(filename, content) {
  try {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Error downloading file:', e);
    showNotification('Error downloading file', 'error');
  }
}

/**
 * Handle file upload
 */
function handleFileUpload(event, textareaId) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const content = e.target.result;
      JSON.parse(content); // Validate JSON
      
      const textarea = document.getElementById(textareaId);
      if (textarea) {
        textarea.value = content;
        showNotification('File loaded successfully', 'success');
      }
    } catch (err) {
      showNotification('Invalid JSON file: ' + err.message, 'error');
    }
  };
  
  reader.readAsText(file);
}

/**
 * Show notification to user
 */
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 16px;
    border-radius: 4px;
    font-size: 14px;
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  `;
  
  // Set colors based on type
  const colors = {
    success: { bg: '#10B981', text: '#fff' },
    error: { bg: '#EF4444', text: '#fff' },
    warning: { bg: '#F59E0B', text: '#fff' },
    info: { bg: '#3B82F6', text: '#fff' }
  };
  
  const color = colors[type] || colors.info;
  notification.style.backgroundColor = color.bg;
  notification.style.color = color.text;
  notification.textContent = message;
  
  // Add keyframes for animation
  if (!document.querySelector('style[data-notification]')) {
    const style = document.createElement('style');
    style.setAttribute('data-notification', 'true');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(notification);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * Clear localStorage data for debugging
 */
function clearAllStorageData() {
  if (confirm('Are you sure you want to clear all saved data? This action cannot be undone.')) {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    showNotification('All storage data cleared', 'warning');
    location.reload();
  }
}

/**
 * Export all data as a backup
 */
function exportAllDataBackup() {
  try {
    const backup = {
      timestamp: new Date().toISOString(),
      data: {
        chart: localStorage.getItem(STORAGE_KEYS.CHART_DATA),
        map: localStorage.getItem(STORAGE_KEYS.MAP_DATA),
        detail: localStorage.getItem(STORAGE_KEYS.DETAIL_BERSERI),
        kabupaten: localStorage.getItem(STORAGE_KEYS.KABUPATEN_DATA)
      }
    };
    
    downloadJSON(`berseri-backup-${Date.now()}.json`, JSON.stringify(backup, null, 2));
    showNotification('Backup exported successfully', 'success');
  } catch (e) {
    showNotification('Error creating backup: ' + e.message, 'error');
  }
}

/**
 * Import backup data
 */
async function importBackupData() {
  try {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const text = await file.text();
      const backup = JSON.parse(text);
      
      if (!backup.data || !backup.timestamp) {
        showNotification('Invalid backup file format', 'error');
        return;
      }
      
      // Restore data
      if (backup.data.chart) localStorage.setItem(STORAGE_KEYS.CHART_DATA, backup.data.chart);
      if (backup.data.map) localStorage.setItem(STORAGE_KEYS.MAP_DATA, backup.data.map);
      if (backup.data.detail) localStorage.setItem(STORAGE_KEYS.DETAIL_BERSERI, backup.data.detail);
      if (backup.data.kabupaten) localStorage.setItem(STORAGE_KEYS.KABUPATEN_DATA, backup.data.kabupaten);
      
      showNotification('Backup imported successfully. Reloading...', 'success');
      setTimeout(() => location.reload(), 1500);
    };
    
    input.click();
  } catch (e) {
    showNotification('Error importing backup: ' + e.message, 'error');
  }
}

// ===== Initialize on page load =====
document.addEventListener('DOMContentLoaded', function() {
  initializeDataManager();
});
