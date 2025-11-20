/**
 * Visitor Statistics Chart Initialization
 * File: visitor-chart.js
 * Purpose: Handle visitor statistics chart rendering and filtering
 * Status: UI Display Ready - Functionality to be implemented
 */

// Chart instance variable
let visitorChart = null;

// Default configuration
const visitorChartConfig = {
  defaultTimeFilter: 'month',
  defaultSourceFilter: 'all',
  colors: {
    primary: '#E8651F', // From CSS --primary color
    secondary: '#6B46C1',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6'
  }
};

/**
 * Initialize Visitor Chart
 * Creates Chart.js instance and sets up event listeners
 */
function initVisitorChart() {
  const canvasElement = document.getElementById('visitorChart');
  
  if (!canvasElement) {
    console.warn('Visitor chart canvas not found');
    return;
  }

  const ctx = canvasElement.getContext('2d');

  // Sample data - Replace with actual data from API
  const sampleData = {
    '24h': {
      labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'],
      all: [120, 190, 150, 220, 250, 200, 180],
      direct: [40, 60, 50, 70, 80, 65, 60],
      organic: [50, 80, 60, 90, 100, 85, 75],
      social: [20, 35, 30, 40, 50, 35, 30],
      referral: [10, 15, 10, 20, 20, 15, 15]
    },
    'week': {
      labels: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'],
      all: [850, 920, 880, 950, 1100, 1050, 920],
      direct: [280, 310, 290, 320, 370, 350, 310],
      organic: [350, 380, 360, 400, 450, 420, 380],
      social: [150, 160, 150, 170, 190, 180, 160],
      referral: [70, 70, 80, 60, 90, 100, 70]
    },
    'month': {
      labels: ['Mgg 1', 'Mgg 2', 'Mgg 3', 'Mgg 4'],
      all: [3200, 3500, 3800, 4100],
      direct: [1100, 1200, 1300, 1400],
      organic: [1400, 1550, 1700, 1900],
      social: [520, 570, 630, 680],
      referral: [180, 180, 170, 120]
    },
    'year': {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
      all: [8200, 8900, 9500, 9200, 10100, 11500, 12400, 11800, 10900, 12200, 13500, 14200],
      direct: [2800, 3000, 3200, 3100, 3400, 3800, 4100, 3950, 3700, 4100, 4500, 4700],
      organic: [3600, 3900, 4200, 4100, 4500, 5200, 5600, 5400, 5000, 5600, 6200, 6500],
      social: [1300, 1400, 1500, 1500, 1700, 1900, 2000, 1950, 1800, 1900, 2100, 2300],
      referral: [500, 600, 600, 500, 700, 600, 700, 500, 400, 600, 700, 700]
    }
  };

  // Initialize chart with default data
  const timeFilter = visitorChartConfig.defaultTimeFilter;
  const sourceFilter = visitorChartConfig.defaultSourceFilter;
  const chartData = getVisitorChartData(sampleData, timeFilter, sourceFilter);

  visitorChart = new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: 'hsl(45, 25%, 85%)',
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12,
              weight: 500
            }
          }
        },
        filler: {
          propagate: true
        }
      },
      scales: {
        x: {
          grid: {
            display: false,
            color: 'hsl(20, 14%, 15%)'
          },
          ticks: {
            color: 'hsl(45, 15%, 46%)',
            font: {
              size: 12
            }
          }
        },
        y: {
          grid: {
            color: 'hsl(20, 14%, 15%)',
            drawBorder: false
          },
          ticks: {
            color: 'hsl(45, 15%, 46%)',
            font: {
              size: 12
            },
            callback: function(value) {
              return value.toLocaleString();
            }
          }
        }
      }
    }
  });

  // Set up event listeners
  setupVisitorChartListeners(sampleData);
}

/**
 * Get chart data based on time filter and source filter
 * @param {Object} data - Sample data object
 * @param {string} timeFilter - Time period ('24h', 'week', 'month', 'year')
 * @param {string} sourceFilter - Visitor source ('all', 'direct', 'organic', 'social', 'referral')
 * @returns {Object} Chart.js data object
 */
function getVisitorChartData(data, timeFilter, sourceFilter) {
  const timeData = data[timeFilter] || data['month'];
  const visitors = timeData[sourceFilter] || timeData['all'];

  let datasetLabel = 'Pengunjung';
  let datasetColor = visitorChartConfig.colors.primary;
  
  if (sourceFilter !== 'all') {
    const sourceLabels = {
      direct: 'Direct Traffic',
      organic: 'Organic Search',
      social: 'Social Media',
      referral: 'Referral'
    };
    datasetLabel = sourceLabels[sourceFilter] || 'Pengunjung';
    
    const colorMap = {
      direct: visitorChartConfig.colors.secondary,
      organic: visitorChartConfig.colors.success,
      social: visitorChartConfig.colors.info,
      referral: visitorChartConfig.colors.warning
    };
    datasetColor = colorMap[sourceFilter] || visitorChartConfig.colors.primary;
  }

  return {
    labels: timeData.labels,
    datasets: [
      {
        label: datasetLabel,
        data: visitors,
        borderColor: datasetColor,
        backgroundColor: sourceFilter === 'all' 
          ? `${datasetColor}20` 
          : `${datasetColor}15`,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: datasetColor,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
        borderWidth: 2
      }
    ]
  };
}

/**
 * Setup event listeners for chart filters
 * @param {Object} data - Sample data object
 */
function setupVisitorChartListeners(data) {
  const timeFilterElement = document.getElementById('visitorTimeFilter');
  
  if (timeFilterElement) {
    timeFilterElement.addEventListener('change', function() {
      const timeFilter = this.value;
      const sourceFilter = visitorChartConfig.defaultSourceFilter;
      const chartData = getVisitorChartData(data, timeFilter, sourceFilter);
      
      // Update chart data
      visitorChart.data = chartData;
      visitorChart.update();
      
      console.log(`Updated visitor chart: Time filter = ${timeFilter}`);
    });
  }

  // Note: Source filter dropdown removed from current implementation
  // but this code is ready for when it's added back
  const sourceFilterElement = document.getElementById('visitorSourceFilter');
  if (sourceFilterElement) {
    sourceFilterElement.addEventListener('change', function() {
      const sourceFilter = this.value;
      const timeFilter = timeFilterElement?.value || visitorChartConfig.defaultTimeFilter;
      const chartData = getVisitorChartData(data, timeFilter, sourceFilter);
      
      // Update chart data
      visitorChart.data = chartData;
      visitorChart.update();
      
      console.log(`Updated visitor chart: Source filter = ${sourceFilter}`);
    });
  }
}

/**
 * Update chart with new data
 * @param {Object} newData - New visitor data
 */
function updateVisitorChartData(newData) {
  if (!visitorChart) {
    console.warn('Visitor chart not initialized');
    return;
  }

  const timeFilter = document.getElementById('visitorTimeFilter')?.value || visitorChartConfig.defaultTimeFilter;
  const sourceFilter = document.getElementById('visitorSourceFilter')?.value || visitorChartConfig.defaultSourceFilter;
  
  const chartData = getVisitorChartData(newData, timeFilter, sourceFilter);
  visitorChart.data = chartData;
  visitorChart.update();
}

/**
 * Destroy chart instance
 */
function destroyVisitorChart() {
  if (visitorChart) {
    visitorChart.destroy();
    visitorChart = null;
  }
}

// Initialize chart when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  initVisitorChart();
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
  destroyVisitorChart();
});
