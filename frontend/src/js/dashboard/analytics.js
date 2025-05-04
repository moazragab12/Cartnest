// Initialize charts when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  initDashboardCharts();
});

// Main function to initialize all dashboard charts
function initDashboardCharts() {
  // Only initialize charts if Chart.js is available
  if (typeof Chart === 'undefined') {
    // Load Chart.js if not already loaded
    loadChartJs().then(() => {
      renderActivityChart();
      renderSpendingCategoryChart();
      renderSalesChart();
      renderSalesTrendChart();
      renderCategoryChart();
      renderProductChart();
      renderEarningsChart();
    }).catch(err => {
      console.error('Failed to load Chart.js:', err);
    });
  } else {
    // Chart.js already loaded, render charts directly
    renderActivityChart();
    renderSpendingCategoryChart();
    renderSalesChart();
    renderSalesTrendChart();
    renderCategoryChart();
    renderProductChart();
    renderEarningsChart();
  }
}

// Dynamically load Chart.js if not already available
function loadChartJs() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Chart.js'));
    document.head.appendChild(script);
  });
}

// Render Activity Summary chart on main dashboard
function renderActivityChart() {
  const ctx = document.getElementById('activityChart');
  if (!ctx) return;
  
  // Generate dates for the last 30 days
  const dates = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }
  
  // Sample purchase data (random values between 0 and 2000)
  const purchaseData = Array.from({ length: 30 }, () => Math.floor(Math.random() * 500) + 100);
  
  // Sample sales data (random values between 0 and 1500)
  const salesData = Array.from({ length: 30 }, () => Math.floor(Math.random() * 400) + 50);

  new Chart(ctx, {
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
          backgroundColor: 'rgba(16, 185, 129, 0.05)',
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
        },
        tooltip: {
          mode: 'index',
          intersect: false
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

// Render Spending by Category pie chart
function renderSpendingCategoryChart() {
  const ctx = document.getElementById('spendingCategoryChart');
  if (!ctx) return;
  
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Electronics', 'Fashion', 'Home & Kitchen', 'Other'],
      datasets: [{
        data: [45, 32, 15, 8],
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
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              return label + ': ' + value + '%';
            }
          }
        }
      }
    }
  });
}

// Render Sales Performance chart on seller dashboard
function renderSalesChart() {
  const ctx = document.getElementById('salesChart');
  if (!ctx) return;
  
  // Generate dates for the last 7 days
  const dates = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    dates.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
  }
  
  // Sample data
  const salesData = [420, 380, 520, 490, 550, 600, 580];
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: dates,
      datasets: [{
        label: 'Sales',
        data: salesData,
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

  new Chart(ctx, {
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
  
  new Chart(ctx, {
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
  
  new Chart(ctx, {
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

  new Chart(ctx, {
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