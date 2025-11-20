// Initialize map and interaction handler

// Map color configuration - GLOBAL SCOPE
const markerColors = {
    'Pratama': '#1D4ED8',    // Biru
    'Madya': '#F59E0B',      // Orange
    'Mandiri': '#10B981'     // Hijau
};

// Function to create custom colored markers - GLOBAL SCOPE
function createColoredMarker(color, label = '') {
    return L.divIcon({
        html: `
            <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <filter id="shadow-${Math.random().toString(36).substr(2, 9)}" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.4"/>
                    </filter>
                </defs>
                <!-- Pin shape with color gradient -->
                <path d="M 16 2 C 10 2 6 6 6 12 C 6 18 16 36 16 36 C 16 36 26 18 26 12 C 26 6 22 2 16 2 Z" 
                      fill="${color}" 
                      stroke="white" 
                      stroke-width="2"
                      filter="url(#shadow-${Math.random().toString(36).substr(2, 9)})"
                />
                <!-- Inner circle highlight -->
                <circle cx="16" cy="12" r="5" fill="white" opacity="0.3"/>
            </svg>
        `,
        iconSize: [32, 40],
        iconAnchor: [16, 40],
        popupAnchor: [0, -40],
        className: 'custom-marker'
    });
}

(function() {
    // Add necessary styles to head
    const style = document.createElement('style');
    style.textContent = `
        .map-controls {
            position: absolute;
            top: 10px;
            right: 10px;
            z-index: 1000;
        }

        .map-toggle-button {
            background-color: #000000;
            color: #ffffff;
            border: none;
            padding: 8px 16px;
            font-family: 'Poppins', sans-serif;
            font-size: 14px;
            cursor: pointer;
            transition: background-color 0.3s;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .map-toggle-button:hover {
            background-color: #333333;
        }

        .map-toggle-button.active {
            background-color: #ffffff;
            color: #000000;
            border: 1px solid #000000;
        }

        .map-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.1);
            z-index: 999;
            pointer-events: all;
        }
    `;
    document.head.appendChild(style);

    // Wait for DOM content to be loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize map if not already done
        initMap();

        // Setup interaction controls
        const mapEl = document.getElementById('map-jatim');
        if (!mapEl) return;

        // Create container for controls
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'map-controls';
        mapEl.parentElement.appendChild(controlsContainer);

        // Create toggle button
        const toggleButton = document.createElement('button');
        toggleButton.className = 'map-toggle-button';
        toggleButton.innerHTML = 'Aktifkan Peta';
        controlsContainer.appendChild(toggleButton);

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'map-overlay';
        mapEl.parentElement.appendChild(overlay);

        let isInteractive = false;

        function toggleMapInteraction() {
            isInteractive = !isInteractive;
            
            if (isInteractive) {
                // Enable map interactions
                if (window.map) {
                    window.map.scrollWheelZoom.enable();
                    window.map.dragging.enable();
                    window.map.touchZoom.enable();
                    window.map.keyboard.enable();
                }
                overlay.style.display = 'none';
                toggleButton.classList.add('active');
                toggleButton.innerHTML = 'Nonaktifkan Peta';
            } else {
                // Disable map interactions
                if (window.map) {
                    window.map.scrollWheelZoom.disable();
                    window.map.dragging.disable();
                    window.map.touchZoom.disable();
                    window.map.keyboard.disable();
                }
                overlay.style.display = 'block';
                toggleButton.classList.remove('active');
                toggleButton.innerHTML = 'Aktifkan Peta';
            }
        }

        toggleButton.addEventListener('click', toggleMapInteraction);
        
        // Start with map interactions disabled
        overlay.style.display = 'block';
    });
})();

// Add these variables at the top level
let markers = {};
let markerCluster;
let activeFilter = 'all';

function initMap() {
  if (window.map) {
    console.log('Map already initialized');
    return;
  }

  // Koordinat bounds Jawa Timur (disesuaikan untuk tampilan optimal)
  const jatimBounds = L.latLngBounds(
    [-8.8, 110.8], // South West
    [-6.5, 114.7]  // North East
  );

  // Koordinat center Jawa Timur
  const jatimCenter = [-7.5360639, 112.2384017];
  
  // Inisialisasi peta
  window.map = L.map('map-jatim', {
    center: jatimCenter,
    zoom: 8,
    zoomControl: true,
    maxZoom: 18,
    minZoom: 7,
    maxBounds: L.latLngBounds(
      [-9.5, 104.0],
      [-4.5, 116.0]
    ),
    maxBoundsViscosity: 0.8,
    bounceAtZoomLimits: true,
    scrollWheelZoom: false,
    dragging: false,
    touchZoom: false,
    keyboard: false
  });

  // Add tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    noWrap: true
  }).addTo(window.map);

  // Set initial view to show all of East Java
  window.map.fitBounds(jatimBounds, {
    padding: [50, 50],
    maxZoom: 7.5
  });

  // Initialize marker cluster group
  markerCluster = L.markerClusterGroup({
    maxClusterRadius: 50,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    chunkedLoading: true,
    disableClusteringAtZoom: 15
  });

  // Load and process data
  Promise.all([
    fetch('json/data-detail-berseri.json').then(res => res.json()),
    fetch('json/location-coordinates.json').then(res => res.json())
  ]).then(([data, coordsData]) => {
    // Group and process data
    const groupedData = {};
    
    data.items.forEach(item => {
      // Try different key formats to find matching coordinates
      let coords = null;
      let matchedKey = null;
      
      // Format options to try
      const keyFormats = [
        `${item.desa}, ${item.kecamatan}, ${item.kabupaten}`,
        `Desa ${item.desa}, ${item.kecamatan}, ${item.kabupaten}`,
        `Kelurahan ${item.desa}, ${item.kecamatan}, ${item.kabupaten}`,
        `Desa ${item.desa}, ${item.kecamatan}, kabupaten ${item.kabupaten}`,
        `Kelurahan ${item.desa}, ${item.kecamatan}, kabupaten ${item.kabupaten}`
      ];
      
      for (const keyFormat of keyFormats) {
        if (coordsData.locations[keyFormat]) {
          coords = coordsData.locations[keyFormat];
          matchedKey = keyFormat;
          break;
        }
      }
      
      if (coords) {
        const key = matchedKey;
        if (!groupedData[key]) {
          groupedData[key] = [];
        }
        groupedData[key].push({
          status: item.status,
          tahun: item.tahun
        });
      }
    });

    // Create markers with color based on status
    for (const location in groupedData) {
      const coords = coordsData.locations[location];
      if (coords && coords.length === 2) {
        const latestStatus = getLatestStatus(groupedData[location]);
        if (latestStatus) {
          const statusText = latestStatus.status;
          const markerColor = markerColors[statusText] || '#666666';
          
          // Create custom colored marker (warna saja tanpa inisial)
          const customMarker = createColoredMarker(markerColor);
          
          const marker = L.marker(
            [coords[0], coords[1]],
            {
              icon: customMarker,
              riseOnHover: true,
              title: location
            }
          ).bindPopup(createPopupContent(location, groupedData[location]));

          // Store marker by status category
          if (!markers[statusText]) {
            markers[statusText] = [];
          }
          markers[statusText].push(marker);
        }
      }
    }

    // Show all markers initially
    showMarkers('all');
    console.log(`✓ Map loaded with markers grouped by status`, Object.keys(markers));

  }).catch(error => console.error('Error loading data:', error));

  // Add click event listeners to filter buttons
  document.querySelectorAll('.jenis-peta').forEach(button => {
    button.addEventListener('click', function() {
      const status = this.getAttribute('data-jenis');
      
      // If button is already active, deactivate it and show all markers
      if (this.classList.contains('active')) {
        this.classList.remove('active');
        showMarkers('all');
      } else {
        // Remove active class from all buttons
        document.querySelectorAll('.jenis-peta').forEach(btn => {
          btn.classList.remove('active');
        });
        
        // Add active class to clicked button and show filtered markers
        this.classList.add('active');
        showMarkers(status);
      }
    });
  });
}

function getLatestStatus(statusList) {
  return statusList
    .filter(s => !s.status.includes("Tidak Lolos"))
    .sort((a, b) => b.tahun - a.tahun)[0];
}

function showMarkers(filter) {
  // Clear existing markers
  markerCluster.clearLayers();
  
  if (filter === 'all') {
    // Show all markers
    Object.values(markers).flat().forEach(marker => {
      markerCluster.addLayer(marker);
    });
  } else {
    // Show only markers for selected status
    const statusMap = {
      'pratama': 'Pratama',
      'madya': 'Madya',
      'mandiri': 'Mandiri'
    };
    
    const statusMarkers = markers[statusMap[filter]] || [];
    statusMarkers.forEach(marker => {
      markerCluster.addLayer(marker);
    });
  }

  // Add cluster group to map
  window.map.addLayer(markerCluster);
}

function createPopupContent(location, statusList) {
  const validStatus = statusList
    .filter(s => !s.status.includes("Tidak Lolos"))
    .sort((a, b) => b.tahun - a.tahun);
  
  let content = `<strong>${location}</strong><br>`;
  if (validStatus.length > 0) {
    content += validStatus
      .map(item => `- ${item.status} (${item.tahun})`)
      .join('<br>');
  }
  return content;
}

// Initialize map when DOM is loaded
document.addEventListener('DOMContentLoaded', initMap);