// Import the seller service API
import { getSellerSalesChartData } from '../../core/api/services/sellerService.js';

// Global variables for charts
let salesChart = null;
let salesTrendChart = null;
let categoryChart = null;
let productChart = null;
let earningsChart = null;
let activityChart = null;
let spendingCategoryChart = null;

// Add a flag to track if initialization has happened
let chartsInitialized = false;

// Initialize all charts when the page is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM content loaded, setting up chart event listeners');
  
  // Add event listener to the sales performance time range dropdown
  const salesPerformanceTimeRange = document.getElementById('salesPerformanceTimeRange');
  if (salesPerformanceTimeRange) {
    salesPerformanceTimeRange.addEventListener('change', (event) => {
      console.log('Time range changed:', event.target.value);
      updateSalesChart(event.target.value);
    });
  }
  
  // Initialize charts only when their respective tabs are shown
  setupTabEventListeners();
});

// Set up event listeners for tab navigation to initialize charts when needed
function setupTabEventListeners() {
  // Get all navigation items
  const navItems = document.querySelectorAll('.nav-item');
  
  // Add click event listeners
  navItems.forEach(item => {
    item.addEventListener('click', function() {
      const targetTabId = this.getAttribute('data-target');
      console.log('Tab clicked:', targetTabId);
      
      // Initialize the appropriate chart based on which tab was clicked
      setTimeout(() => {
        switch(targetTabId) {
          case 'seller-dashboard-tab':
            if (!salesChart) {
              console.log('Initializing sales chart...');
              renderSalesChart();
            }
            break;
          case 'sales-tab':
            if (!salesTrendChart) {
              console.log('Initializing sales trend chart...');
              renderSalesTrendChart();
            }
            if (!categoryChart) {
              console.log('Initializing category chart...');
              renderCategoryChart();
            }
            if (!productChart) {
              console.log('Initializing product chart...');
              renderProductChart();
            }
            break;
          case 'earnings-tab':
            if (!earningsChart) {
              console.log('Initializing earnings chart...');
              renderEarningsChart();
            }
            break;
          case 'dashboard-tab':
            if (!activityChart) {
              console.log('Initializing activity chart...');
              renderActivityChart();
            }
            if (!spendingCategoryChart) {
              console.log('Initializing spending category chart...');
              renderSpendingChart();
            }
            break;
        }
      }, 300); // Small delay to ensure the DOM is ready
    });
  });
  
  // Check if seller dashboard tab is already active on page load
  const sellerDashboardTab = document.querySelector('.nav-item[data-target="seller-dashboard-tab"]');
  if (sellerDashboardTab && sellerDashboardTab.classList.contains('active')) {
    console.log('Seller dashboard tab is active on page load');
    // Delay initialization to ensure DOM is fully loaded
    setTimeout(() => {
      renderSalesChart();
    }, 500);
  }
}

// Safely get the chart context, with error handling
function getChartContext(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.error(`Canvas element with ID '${canvasId}' not found`);
    return null;
  }
  
  try {
    return canvas.getContext('2d');
  } catch (error) {
    console.error(`Error getting 2d context for canvas '${canvasId}':`, error);
    return null;
  }
}

// Render Sales Performance chart on seller dashboard
async function renderSalesChart() {
  console.log('renderSalesChart called');
  
  // Find the canvas element
  const canvas = document.getElementById('salesChart');
  console.log('Sales Chart canvas element:', canvas);
  
  if (!canvas) {
    console.error('Could not find sales chart canvas element with ID "salesChart"');
    return;
  }
  
  try {
    // IMPORTANT: Reset canvas to force Chart.js to properly release resources
    // This is a more aggressive approach to fix the "Canvas already in use" error
    const canvasContainer = canvas.parentNode;
    if (canvasContainer) {
      // Store current canvas dimensions
      const width = canvas.width;
      const height = canvas.height;
      
      // Destroy any existing chart instance
      if (salesChart) {
        console.log('Destroying existing sales chart instance');
        salesChart.destroy();
        salesChart = null;
      }
      
      // Remove the old canvas and replace it with a new one
      canvasContainer.removeChild(canvas);
      const newCanvas = document.createElement('canvas');
      newCanvas.id = 'salesChart';
      newCanvas.width = width;
      newCanvas.height = height;
      canvasContainer.appendChild(newCanvas);
      
      // Update canvas reference to the new canvas
      const freshCanvas = document.getElementById('salesChart');
      console.log('Created fresh canvas:', freshCanvas);
      
      // Show loading state on the new canvas
      showChartLoadingState(freshCanvas, 'Loading sales data...');
      
      // Default to current time range selection
      const timeRangeElement = document.getElementById('salesPerformanceTimeRange');
      const timeRange = timeRangeElement ? timeRangeElement.value : '7_days';
      console.log('Using time range:', timeRange);
      
      // Fetch real data from API
      console.log('Fetching sales chart data...');
      const chartData = await getSellerSalesChartData(timeRange);
      console.log('Chart data received:', chartData);
      
      // Check if we have valid data
      if (!chartData || !chartData.data || chartData.data.length === 0) {
        console.warn('No sales data available for the selected time period');
        showChartErrorState(freshCanvas, 'No sales data available for this period');
        return;
      }
      
      // Extract labels and data from the API response
      const labels = chartData.data.map(point => point.date);
      const salesData = chartData.data.map(point => point.amount);
      
      // Check if all values are zero
      const hasNonZeroData = salesData.some(amount => amount > 0);
      if (!hasNonZeroData) {
        console.warn('All sales data values are zero');
        showChartMessage(freshCanvas, 'No sales recorded in this period');
        return;
      }
      
      console.log('Creating chart with labels:', labels);
      console.log('Creating chart with data:', salesData);
      
      // Get a fresh context from the new canvas
      const ctx = freshCanvas.getContext('2d');
      if (!ctx) {
        console.error('Could not get 2D context for sales chart canvas');
        return;
      }
      
      // Create new chart on the fresh canvas
      salesChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Sales',
            data: salesData,
            borderColor: '#0d99ff',
            backgroundColor: 'rgba(13, 153, 255, 0.1)',
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: '#0d99ff',
            tension: 0.3,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return '$' + context.parsed.y;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                borderDash: [2, 2]
              },
              ticks: {
                callback: function(value) {
                  return '$' + value;
                }
              }
            }
          }
        }
      });
      
      console.log('Sales chart successfully rendered');
    } else {
      console.error('Canvas container not found');
    }
  } catch (error) {
    console.error('Error rendering sales chart:', error);
    const canvas = document.getElementById('salesChart');
    if (canvas) {
      showChartErrorState(canvas, 'Failed to load sales data');
    }
  }
}

// Update Sales chart with new time range
async function updateSalesChart(timeRange) {
  console.log('updateSalesChart called with time range:', timeRange);
  
  // Simply re-render the chart with the new time range
  // This avoids potential update issues
  renderSalesChart();
}

// Show loading state on a chart canvas
function showChartLoadingState(canvas, message = 'Loading...') {
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#64748b';
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

// Show error state on a chart canvas
function showChartErrorState(canvas, message = 'Error loading data') {
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ef4444';
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

// Show a neutral information message on a chart canvas
function showChartMessage(canvas, message) {
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#64748b';
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

// Render Sales Trend chart on sales analytics tab
function renderSalesTrendChart() {
  const ctx = document.getElementById('salesTrendChart');
  if (!ctx) return;
  
  // Generate dates for the last 30 days
  const dates = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }
  
  // Sample revenue data
  const revenueData = Array.from({ length: 30 }, () => Math.floor(Math.random() * 300) + 50);
  
  // Sample orders data
  const ordersData = Array.from({ length: 30 }, () => Math.floor(Math.random() * 5) + 1);

  salesTrendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [
        {
          label: 'Revenue',
          data: revenueData,
          borderColor: '#0d99ff',
          backgroundColor: 'transparent',
          borderWidth: 2,
          tension: 0.3,
          yAxisID: 'y'
        },
        {
          label: 'Orders',
          data: ordersData,
          borderColor: '#10B981',
          backgroundColor: 'transparent',
          borderWidth: 2,
          tension: 0.3,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            maxTicksLimit: 10
          }
        },
        y: {
          beginAtZero: true,
          position: 'left',
          grid: {
            borderDash: [2, 2]
          },
          ticks: {
            callback: function(value) {
              return '$' + value;
            }
          }
        },
        y1: {
          beginAtZero: true,
          position: 'right',
          grid: {
            display: false,
          },
          ticks: {
            color: '#10B981'
          }
        }
      }
    }
  });
}

// Render Category chart on sales analytics tab
function renderCategoryChart() {
  const ctx = document.getElementById('categoryChart');
  if (!ctx) return;
  
  categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Electronics', 'Fashion', 'Home', 'Beauty'],
      datasets: [{
        data: [42, 25, 18, 15],
        backgroundColor: [
          '#0d99ff',
          '#10B981',
          '#F59E0B',
          '#8B5CF6'
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            padding: 15
          }
        }
      }
    }
  });
}

// Render Product chart on sales analytics tab
function renderProductChart() {
  const ctx = document.getElementById('productChart');
  if (!ctx) return;
  
  productChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['iPhone', 'Watch', 'Hoodie', 'Bag', 'T-shirt'],
      datasets: [{
        data: [12, 8, 4, 2, 1],
        backgroundColor: 'rgba(13, 153, 255, 0.7)',
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.parsed.x + ' units sold';
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: {
            borderDash: [2, 2]
          },
          ticks: {
            precision: 0
          }
        },
        y: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

// Render Earnings chart on earnings tab
function renderEarningsChart() {
  const ctx = document.getElementById('earningsChart');
  if (!ctx) return;
  
  // Sample data for the last 6 months
  const labels = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];
  const earningsData = [350, 480, 520, 390, 560, 545];

  earningsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Earnings',
        data: earningsData,
        backgroundColor: 'rgba(13, 153, 255, 0.7)',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            borderDash: [2, 2]
          },
          ticks: {
            callback: function(value) {
              return '$' + value;
            }
          }
        }
      }
    }
  });
}

// Render Activity chart on dashboard
function renderActivityChart() {
  const ctx = document.getElementById('activityChart');
  if (!ctx) return;
  
  // Generate dates for the last 14 days
  const dates = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }
  
  // Sample data
  const purchaseData = [150, 120, 0, 80, 200, 90, 110, 140, 130, 70, 150, 200, 180, 160];
  const salesData = [0, 80, 120, 0, 100, 70, 0, 90, 100, 40, 70, 120, 50, 90];

  activityChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [
        {
          label: 'Purchases',
          data: purchaseData,
          borderColor: '#0d99ff',
          backgroundColor: 'rgba(13, 153, 255, 0.1)',
          borderWidth: 2,
          tension: 0.3,
          fill: true
        },
        {
          label: 'Sales',
          data: salesData,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          tension: 0.3,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            maxTicksLimit: 7
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            borderDash: [2, 2]
          },
          ticks: {
            callback: function(value) {
              return '$' + value;
            }
          }
        }
      }
    }
  });
}

// Render Spending Category chart on dashboard
function renderSpendingChart() {
  const ctx = document.getElementById('spendingCategoryChart');
  if (!ctx) return;

  spendingCategoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Electronics', 'Clothing', 'Food', 'Entertainment'],
      datasets: [{
        data: [450, 320, 280, 200],
        backgroundColor: [
          '#0d99ff',
          '#10B981',
          '#F59E0B',
          '#8B5CF6'
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            padding: 15
          }
        }
      }
    }
  });
  
  // Create category details beneath the chart
  const categoryDetails = document.querySelector('.category-details');
  if (categoryDetails) {
    const categories = [
      { name: 'Electronics', amount: 450, color: '#0d99ff', percentage: 36 },
      { name: 'Clothing', amount: 320, color: '#10B981', percentage: 26 },
      { name: 'Food', amount: 280, color: '#F59E0B', percentage: 22 },
      { name: 'Entertainment', amount: 200, color: '#8B5CF6', percentage: 16 }
    ];
    
    categories.forEach(category => {
      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.justifyContent = 'space-between';
      item.style.alignItems = 'center';
      
      item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${category.color};"></div>
          <span style="font-size: 14px;">${category.name}</span>
        </div>
        <div style="display: flex; gap: 16px;">
          <span style="font-size: 14px; font-weight: 500;">$${category.amount}</span>
          <span style="font-size: 14px; color: var(--secondary-color);">${category.percentage}%</span>
        </div>
      `;
      
      categoryDetails.appendChild(item);
    });
  }
}

// Export functions for use in other modules
export {
  renderSalesChart,
  updateSalesChart
};