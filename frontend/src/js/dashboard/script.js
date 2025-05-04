// Tab navigation
document.addEventListener('DOMContentLoaded', function() {
  // Sidebar navigation
  const navItems = document.querySelectorAll('.nav-item');
  const contentSections = document.querySelectorAll('.content-section');
  
  navItems.forEach(item => {
    item.addEventListener('click', function() {
      const target = this.getAttribute('data-target');
      
      // Update active state on nav items
      navItems.forEach(nav => nav.classList.remove('active'));
      this.classList.add('active');
      
      // Show target content section
      contentSections.forEach(section => {
        section.classList.remove('active');
      });
      document.getElementById(target).classList.add('active');
    });
  });
  
  // Function to show a specific tab
  window.showTab = function(tabId) {
    const targetTab = document.getElementById(tabId);
    const targetNavItem = document.querySelector(`[data-target="${tabId}"]`);
    
    if (targetTab && targetNavItem) {
      contentSections.forEach(section => section.classList.remove('active'));
      navItems.forEach(nav => nav.classList.remove('active'));
      
      targetTab.classList.add('active');
      targetNavItem.classList.add('active');
    }
  };
  
  // Order tab navigation
  const orderTabs = document.querySelectorAll('[data-ordertab]');
  orderTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      orderTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      // Handle order filtering here (not implemented in this demo)
      const tabType = this.getAttribute('data-ordertab');
      console.log('Order tab clicked:', tabType);
      // In a real implementation, you would filter orders based on tabType
    });
  });
  
  // Product tab navigation
  const productTabs = document.querySelectorAll('[data-producttab]');
  productTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      productTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      // Handle product filtering here (not implemented in this demo)
      const tabType = this.getAttribute('data-producttab');
      console.log('Product tab clicked:', tabType);
    });
  });
  
  // Profile save button
  const saveProfileBtn = document.getElementById('save-profile');
  if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', function() {
      // Show a success message
      const successMessage = document.createElement('div');
      successMessage.innerHTML = `
        <div style="position: fixed; bottom: 20px; right: 20px; background-color: #10B981; color: white; padding: 16px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); display: flex; align-items: center; gap: 12px; z-index: 1000; animation: slideInRight 0.3s ease-out forwards;">
          <i class="fas fa-check-circle" style="font-size: 20px;"></i>
          <div>
            <div style="font-weight: 500; margin-bottom: 2px;">Success!</div>
            <div style="font-size: 14px;">Your profile has been updated.</div>
          </div>
        </div>
      `;
      document.body.appendChild(successMessage);
      
      // Remove the message after 3 seconds
      setTimeout(() => {
        successMessage.remove();
      }, 3000);
    });
  }
  
  // Initialize charts
  initializeCharts();
  
  // Add animations for elements as they appear
  const animatedElements = document.querySelectorAll('.stat-card, .dashboard-card');
  function checkScroll() {
    animatedElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const isVisible = (rect.top <= window.innerHeight && rect.bottom >= 0);
      
      if (isVisible) {
        el.style.opacity = '1';
      }
    });
  }
  
  // Initial check on load
  checkScroll();
  
  // Check on scroll
  window.addEventListener('scroll', checkScroll);
});

// Initialize all charts
function initializeCharts() {
  // Only proceed if Chart.js is available
  if (typeof Chart === 'undefined') {
    // Load Chart.js dynamically
    const chartScript = document.createElement('script');
    chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    chartScript.onload = createCharts;
    document.head.appendChild(chartScript);
  } else {
    createCharts();
  }
}

function createCharts() {
  // Sales Chart
  const salesCtx = document.getElementById('salesChart');
  if (salesCtx) {
    new Chart(salesCtx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Sales',
          data: [450, 380, 520, 490, 780, 850, 650],
          borderColor: '#0d99ff',
          backgroundColor: 'rgba(13, 153, 255, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
  
  // Sales Trend Chart
  const salesTrendCtx = document.getElementById('salesTrendChart');
  if (salesTrendCtx) {
    new Chart(salesTrendCtx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
          {
            label: 'Revenue',
            data: [1500, 1800, 1650, 2100, 2400, 2300, 2600, 2850, 3000, 3200, 3400, 3600],
            borderColor: '#0d99ff',
            backgroundColor: 'rgba(13, 153, 255, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: false,
            yAxisID: 'y'
          },
          {
            label: 'Orders',
            data: [12, 14, 13, 16, 19, 18, 21, 24, 25, 26, 28, 30],
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: false,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            position: 'left',
            title: {
              display: true,
              text: 'Revenue ($)'
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          y1: {
            beginAtZero: true,
            position: 'right',
            title: {
              display: true,
              text: 'Orders'
            },
            grid: {
              display: false
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
  
  // Category Chart
  const categoryCtx = document.getElementById('categoryChart');
  if (categoryCtx) {
    new Chart(categoryCtx, {
      type: 'doughnut',
      data: {
        labels: ['Electronics', 'Fashion', 'Home & Kitchen', 'Beauty', 'Sports'],
        datasets: [{
          data: [45, 25, 15, 10, 5],
          backgroundColor: [
            '#0d99ff',
            '#10B981',
            '#8B5CF6',
            '#F59E0B',
            '#EF4444'
          ],
          borderWidth: 0
        }]
      },
      options: {
        plugins: {
          legend: {
            position: 'right'
          }
        },
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%'
      }
    });
  }
  
  // Product Chart
  const productCtx = document.getElementById('productChart');
  if (productCtx) {
    new Chart(productCtx, {
      type: 'bar',
      data: {
        labels: ['iPhone 15', 'Smart Watch', 'Hoodie', 'Leather Bag', 'T-Shirt'],
        datasets: [{
          label: 'Sales',
          data: [12, 8, 4, 2, 3],
          backgroundColor: [
            'rgba(13, 153, 255, 0.7)',
            'rgba(13, 153, 255, 0.65)',
            'rgba(13, 153, 255, 0.6)',
            'rgba(13, 153, 255, 0.55)',
            'rgba(13, 153, 255, 0.5)'
          ],
          borderWidth: 0,
          borderRadius: 4
        }]
      },
      options: {
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
  
  // Earnings Chart
  const earningsCtx = document.getElementById('earningsChart');
  if (earningsCtx) {
    new Chart(earningsCtx, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Earnings',
          data: [350, 450, 320, 580, 620, 750],
          backgroundColor: 'rgba(13, 153, 255, 0.7)',
          borderWidth: 0,
          borderRadius: 4
        }]
      },
      options: {
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
}

// Add slideInRight animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);