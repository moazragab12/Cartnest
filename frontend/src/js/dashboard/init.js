// Utility functions for API requests
async function fetchWithAuth(url, options = {}) {
    // Get the authentication token from localStorage
    const token = localStorage.getItem('accessToken');

    // Build the full URL if it's a relative path
    const baseUrl = 'http://localhost:8000'; // Backend API server
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

    // Set up headers with authentication
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    // Add the authentication token if available
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Make the authenticated request
    return fetch(fullUrl, {
        ...options,
        headers
    });
}

// Format functions
function formatNumber(number) {
    if (number === undefined || number === null) return '0';
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatCurrency(value) {
    if (value === undefined || value === null) return '$0.00';
    return `$${parseFloat(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

// Loading states
function showLoadingState(container) {
    if (!container) return;

    container.classList.add('loading');

    let loadingElement = container.querySelector('.loading-indicator');
    if (!loadingElement) {
        loadingElement = document.createElement('div');
        loadingElement.className = 'loading-indicator';
        loadingElement.innerHTML = '<div class="spinner"></div><p>Loading dashboard data...</p>';
        container.appendChild(loadingElement);
    } else {
        loadingElement.style.display = 'flex';
    }
}

function hideLoadingState(container) {
    if (!container) return;

    container.classList.remove('loading');

    const loadingElement = container.querySelector('.loading-indicator');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

function showErrorState(container, message = 'Failed to load dashboard data. Please try again later.') {
    if (!container) return;

    hideLoadingState(container);
    container.classList.add('error');

    let errorElement = container.querySelector('.error-indicator');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-indicator';
        errorElement.innerHTML = `
          <div class="error-icon">⚠️</div>
          <p>${message}</p>
          <button class="retry-button">Retry</button>
        `;
        container.appendChild(errorElement);
    } else {
        errorElement.querySelector('p').textContent = message;
        errorElement.style.display = 'flex';
    }

    const retryButton = errorElement.querySelector('.retry-button');
    if (retryButton) {
        // Remove any existing event listeners
        const newRetryButton = retryButton.cloneNode(true);
        retryButton.parentNode.replaceChild(newRetryButton, retryButton);

        newRetryButton.addEventListener('click', () => {
            container.classList.remove('error');
            errorElement.style.display = 'none';
            loadDashboardData();
        });
    }
}

// Update dashboard stats
function updateDashboardStats(data) {
    console.log('Updating dashboard stats with data:', data);
    if (!data) {
        console.error('No data provided to updateDashboardStats');
        return;
    }

    // Update total orders card
    const totalOrdersElement = document.querySelector('#totalOrdersValue');
    if (totalOrdersElement) {
        totalOrdersElement.textContent = formatNumber(data.total_orders);
        console.log('Updated total orders:', data.total_orders);
    }

    // Update delivered orders card (uses total_customers from API)
    const deliveredOrdersElement = document.querySelector('#deliveredValue');
    if (deliveredOrdersElement) {
        deliveredOrdersElement.textContent = formatNumber(data.total_customers);
        console.log('Updated delivered/customers:', data.total_customers);
    }

    // Update total spent card
    const totalSpentElement = document.querySelector('#totalSpentValue');
    if (totalSpentElement) {
        totalSpentElement.textContent = formatCurrency(data.total_spent);
        console.log('Updated total spent:', data.total_spent);
    }

    // Update products listed card
    const productsListedElement = document.querySelector('#productsListedValue');
    if (productsListedElement) {
        productsListedElement.textContent = formatNumber(data.products_listed);
        console.log('Updated products listed:', data.products_listed);
    }
}

// API interaction
async function fetchDashboardSummary(options = {}) {
    const { timeRange = '30_days', viewType = 'all' } = options;

    try {
        // Build URL with query parameters
        const baseUrl = 'http://localhost:8000'; // Backend API server
        const url = `${baseUrl}/api/v0/dashboard/summary?time_range=${timeRange}&view_type=${viewType}`;
        console.log('Fetching dashboard summary from:', url);

        // Get authentication token from localStorage
        const token = localStorage.getItem('accessToken');

        // Log authentication status
        if (token) {
            console.log('Auth token found, making authenticated request');
        } else {
            console.warn('No auth token found in localStorage');
        }

        // Make the authenticated request
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API response not OK:', response.status, errorText);
            throw new Error(`API request failed with status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('Dashboard summary response:', data);
        return data;
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        throw error;
    }
}

// New function to fetch activity data
async function fetchActivityData(options = {}) {
    const { period = 'daily', days = 30, viewType = 'both' } = options;

    try {
        // Build URL with query parameters
        const baseUrl = 'http://localhost:8000';
        const url = `${baseUrl}/api/v0/dashboard/sales?period=${period}&days=${days}&view_type=${viewType}`;
        console.log('Fetching activity data from:', url);

        // Get authentication token from localStorage
        const token = localStorage.getItem('accessToken');

        // Make the authenticated request
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API response not OK:', response.status, errorText);
            throw new Error(`API request failed with status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('Activity data response:', data);
        return data;
    } catch (error) {
        console.error('Error fetching activity data:', error);
        throw error;
    }
}

// Function to render the spending category chart
function renderSpendingCategoryChart(categoryData) {
    // Find the chart container by ID
    const categoryChartContainer = document.getElementById('spendingCategoryChart');

    if (!categoryChartContainer) {
        console.error('Spending category chart container not found - element with ID "spendingCategoryChart" is missing');
        return;
    }

    if (!categoryData || !Array.isArray(categoryData) || categoryData.length === 0) {
        console.error('Cannot render spending category chart: no data provided or empty array');
        return;
    }

    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded');
        return;
    }

    try {
        // Safely destroy existing chart if it exists
        const existingChartInstance = Chart.getChart(categoryChartContainer);
        if (existingChartInstance) {
            console.log('Destroying existing category chart instance');
            existingChartInstance.destroy();
        }

        // Extract data from the API response
        const labels = categoryData.map(item => item.category);
        const data = categoryData.map(item => item.percentage);
        const amounts = categoryData.map(item => item.amount);

        console.log('Rendering category spending chart with data:', {
            categories: labels,
            percentages: data,
            amounts: amounts
        });

        // Define colors for the chart
        const backgroundColors = [
            '#0d99ff',  // Primary blue
            '#10B981',  // Green
            '#F59E0B',  // Orange
            '#8B5CF6',  // Purple
            '#EC4899',  // Pink
            '#14B8A6',  // Teal
            '#F43F5E',  // Red
            '#6366F1'   // Indigo
        ];

        // Create the pie chart
        const spendingCategoryChart = new Chart(categoryChartContainer, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors.slice(0, labels.length),
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
                            label: function (context) {
                                const index = context.dataIndex;
                                const category = labels[index];
                                const percentage = data[index].toFixed(1);
                                const amount = formatCurrency(amounts[index]);
                                return `${category}: ${amount} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        console.log('Spending category chart rendered successfully');

        // Update the category spending details text elements
        updateCategorySpendingDetails(categoryData, backgroundColors);

    } catch (error) {
        console.error('Error rendering spending category chart:', error);
    }
}

// Function to update the category spending details text under the chart
function updateCategorySpendingDetails(categoryData, colors) {
    const categoryDetailsContainer = document.querySelector('.card-content .category-details');
    if (!categoryDetailsContainer) {
        console.warn('Category details container not found');
        return;
    }

    // Clear existing content
    categoryDetailsContainer.innerHTML = '';

    // Add each category detail row
    categoryData.forEach((category, index) => {
        const color = colors[index % colors.length];
        const html = `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; gap: 8px; align-items: center;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${color};"></div>
              <span>${category.category}</span>
            </div>
            <span>${formatCurrency(category.amount)} (${category.percentage.toFixed(1)}%)</span>
          </div>
        `;
        categoryDetailsContainer.innerHTML += html;
    });
}

// Dashboard controller
let currentTimeRange = '30_days';
let summaryData = null;
const dashboardCardsContainer = document.querySelector('#dashboardCards');
const timeRangeSelector = document.querySelector('#timeRangeSelector');
const downloadReportButton = document.querySelector('#downloadReportButton');

// Function to load and display the best selling products
async function loadBestSellingProducts() {
    const productsContainer = document.querySelector('#best-selling-products');

    if (!productsContainer) {
        console.error('Best selling products container not found');
        return;
    }

    try {
        console.log('Loading best selling products data...');

        // Show loading state
        productsContainer.innerHTML = '<div class="loading-spinner"></div>';

        // Get the token from localStorage
        const token = localStorage.getItem('accessToken');
        console.log('Auth token available:', !!token);

        if (!token) {
            console.error('No authentication token found');
            productsContainer.innerHTML = `
            <div class="empty-state">
              <p>Authentication required</p>
              <small>Please log in to view your best selling products</small>
            </div>
          `;
            return;
        }

        // Try to fetch the top products data from the API
        try {
            // Make API call to get top products
            const response = await fetchWithAuth('/api/v0/dashboard/top-products');
            console.log('Top products API response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Top products data received:', data);

                // Check if we have valid product data
                if (data && data.length > 0 && data[0].products && data[0].products.length > 0) {
                    const topProductsData = data[0].products;
                    console.log('Products to display:', topProductsData);

                    // Clear the container before adding new content
                    productsContainer.innerHTML = '';

                    // Create and append product rows
                    topProductsData.forEach(product => {
                        // Create product row
                        const growth = parseFloat(product.growth);
                        const growthClass = growth >= 0 ? 'text-success' : 'text-danger';
                        const growthSign = growth >= 0 ? '+' : '';

                        const productRow = document.createElement('div');
                        productRow.className = 'product-item';

                        // Determine which image to use based on product name
                        let imageSrc = '../../public/resources/images/iphone.png';

                        if (product.product_name.toLowerCase().includes('watch')) {
                            imageSrc = '../../public/resources/images/watch.png';
                        } else if (product.product_name.toLowerCase().includes('hoodie') ||
                            product.product_name.toLowerCase().includes('shirt') ||
                            product.product_name.toLowerCase().includes('cloth')) {
                            imageSrc = '../../public/resources/images/Hoodie.jpg';
                        }

                        productRow.innerHTML = `
                  <img src="${imageSrc}" alt="${product.product_name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
                  <div class="product-details">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                      <h4 style="font-weight: 500; margin: 0;">${product.product_name}</h4>
                      <span style="font-weight: 600; color: var(--primary-color);">${formatCurrency(product.sales)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <span style="color: var(--secondary-color); font-size: 14px;">${product.quantity} units sold</span>
                      <span style="color: ${growthClass}; font-size: 14px;">${growthSign}${growth.toFixed(1)}%</span>
                    </div>
                    <div style="width: 100%; height: 6px; background-color: #f3f4f6; border-radius: 3px; margin-top: 8px;">
                      <div class="product-progress-bar" data-units="${product.quantity}" style="height: 100%; width: 100%; background-color: var(--primary-color); border-radius: 3px;"></div>
                    </div>
                  </div>
                `;

                        productsContainer.appendChild(productRow);
                    });

                    console.log('Best selling products loaded successfully');
                    return;
                } else {
                    console.log('No products data in the response');
                }
            } else {
                console.error('Failed to fetch top products:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching top products:', error);
        }

        // If we get here, we either had no data or encountered an error
        productsContainer.innerHTML = `
          <div class="empty-state">
            <p>No products sold yet</p>
            <small>Your best selling products will appear here once you have sales</small>
          </div>
        `;
    } catch (error) {
        console.error('Error loading best selling products:', error);
        productsContainer.innerHTML = `
          <div class="error-state">
            <p>Failed to load best selling products</p>
            <button class="btn-retry" onclick="loadBestSellingProducts()">Retry</button>
          </div>
        `;
    }
}

async function loadDashboardData() {
    if (!dashboardCardsContainer) {
        console.error('Dashboard cards container not found');
        return;
    }

    try {
        console.log('Loading dashboard data...');
        showLoadingState(dashboardCardsContainer);

        try {
            // Fetch dashboard summary data
            summaryData = await fetchDashboardSummary({
                timeRange: currentTimeRange
            });
            
            // We'll use the actual data even if all values are zero (for new users)
            console.log('Dashboard data loaded:', summaryData);
        } catch (error) {
            console.warn('API call failed, using placeholder data', error);
            // Use placeholder data if API call fails
            summaryData = {
                total_orders: 16,
                total_customers: 12,
                total_spent: 1248.50,
                products_listed: 8,
                purchase_activity: generatePlaceholderActivityData(30, "purchase"),
                sales_activity: generatePlaceholderActivityData(30, "sales"),
                category_spending: [
                    { category: "Electronics", amount: 500, percentage: 40 },
                    { category: "Fashion", amount: 300, percentage: 25 },
                    { category: "Home & Kitchen", amount: 250, percentage: 20 },
                    { category: "Other", amount: 200, percentage: 15 }
                ]
            };
        }

        // Update UI with the fetched data - we'll display real data even if it's all zeros
        updateDashboardStats(summaryData);

        // Render activity chart directly with the data from summary response
        renderActivityChart({
            labels: summaryData.purchase_activity?.map(item => item.date) || [],
            datasets: [
                {
                    name: "Purchases",
                    data: summaryData.purchase_activity?.map(item => item.value) || []
                },
                {
                    name: "Sales",
                    data: summaryData.sales_activity?.map(item => item.value) || []
                }
            ]
        });

        // Render the spending category chart with the category_spending data
        if (summaryData.category_spending && summaryData.category_spending.length > 0) {
            renderSpendingCategoryChart(summaryData.category_spending);
        } else {
            console.warn('No category spending data available');
        }

        // Load best selling products
        loadBestSellingProducts();

        hideLoadingState(dashboardCardsContainer);
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        showErrorState(dashboardCardsContainer, 'Failed to load dashboard data. Please try again.');
    }
}

// Function to load and render the activity chart
async function loadActivityData() {
    if (!activityChartContainer) {
        console.error('Activity chart container not found');
        return;
    }

    try {
        console.log('Loading activity data...');

        // Map the time range to number of days for the API request
        let days = 30;
        switch (currentTimeRange) {
            case '30_days': days = 30; break;
            case '90_days': days = 90; break;
            case 'this_year': days = 365; break;
            case 'all_time': days = 1095; break; // ~3 years
        }

        try {
            // Fetch activity data
            activityData = await fetchActivityData({
                period: days > 60 ? 'weekly' : 'daily',
                days: days,
                viewType: 'both'
            });
        } catch (error) {
            console.warn('API call for activity data failed, using placeholder data', error);
            // Generate placeholder data if API call fails
            activityData = generatePlaceholderActivityData(days);
        }

        console.log('Activity data loaded:', activityData);

        // Render the chart with the fetched data
        renderActivityChart(activityData);
    } catch (error) {
        console.error('Failed to load activity data:', error);
    }
}

// Function to generate placeholder activity data
function generatePlaceholderActivityData(days) {
    const labels = [];
    const purchasesData = [];
    const salesData = [];

    const today = new Date();

    for (let i = days; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        labels.push(date.toISOString().split('T')[0]);

        // Generate some random data
        purchasesData.push(Math.floor(Math.random() * 400) + 100);
        salesData.push(Math.floor(Math.random() * 300) + 50);
    }

    return {
        labels,
        datasets: [
            {
                name: "Purchases",
                data: purchasesData
            },
            {
                name: "Sales",
                data: salesData
            }
        ]
    };
}

// Function to render the activity chart
function renderActivityChart(data) {
    // Find the activity chart container by ID
    const activityChartContainer = document.getElementById('activityChart');

    if (!activityChartContainer) {
        console.error('Activity chart container not found - element with ID "activityChart" is missing');
        return;
    }

    if (!data) {
        console.error('Cannot render activity chart: no data provided');
        return;
    }

    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded');
        return;
    }

    try {
        // Safely destroy existing chart if it exists
        const existingChartInstance = Chart.getChart(activityChartContainer);
        if (existingChartInstance) {
            console.log('Destroying existing activity chart instance');
            existingChartInstance.destroy();
        }

        // Map the API data to Chart.js format
        const labels = data.labels || [];
        const purchasesData = data.datasets?.find(ds => ds.name === "Purchases")?.data || [];
        const salesData = data.datasets?.find(ds => ds.name === "Sales")?.data || [];

        console.log('Rendering activity chart with data:', {
            labels: labels.length > 0 ? `${labels.length} dates` : 'no labels',
            purchases: purchasesData.length,
            sales: salesData.length
        });

        // Override analytics.js renderActivityChart function to prevent conflict
        window.dashboardChartInitialized = true;

        // Create the chart with a custom ID to avoid conflicts
        const activityChart = new Chart(activityChartContainer, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Purchases',
                        data: purchasesData,
                        fill: true,
                        backgroundColor: 'rgba(13, 153, 255, 0.2)',
                        borderColor: 'rgb(13, 153, 255)',
                        borderWidth: 2,
                        tension: 0.3,
                        pointRadius: 3
                    },
                    {
                        label: 'Sales',
                        data: salesData,
                        fill: true,
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        borderColor: 'rgb(16, 185, 129)',
                        borderWidth: 2,
                        tension: 0.3,
                        pointRadius: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
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
                            maxTicksLimit: 7 // Limit number of x-axis labels for better readability
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: function (value) {
                                return '$' + value;
                            }
                        }
                    }
                }
            }
        });

        console.log('Activity chart rendered successfully');

        // Add event listener to handle window resize
        window.addEventListener('resize', function () {
            activityChart.resize();
        });

    } catch (error) {
        console.error('Error rendering activity chart:', error);
    }
}

function downloadReport() {
    if (!summaryData) {
        console.error('No data available to download');
        return;
    }

    try {
        // Create report data as CSV
        const headers = ['Metric', 'Value'];
        const rows = [
            ['Total Orders', summaryData.total_orders],
            ['Delivered/Total Customers', summaryData.total_customers || 0],
            ['Total Spent', `$${summaryData.total_spent.toFixed(2)}`],
            ['Products Listed', summaryData.products_listed]
        ];

        // Format data as CSV
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.setAttribute('href', url);
        link.setAttribute('download', `dashboard-report-${currentTimeRange}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Failed to download report:', error);
    }
}

// Initialize dashboard
function initDashboard() {
    console.log('Initializing dashboard...');

    // Set up event listeners
    if (timeRangeSelector) {
        timeRangeSelector.addEventListener('change', (e) => {
            currentTimeRange = e.target.value;
            loadDashboardData();
            loadActivityData(); // Also reload activity data when time range changes
        });
    } else {
        console.warn('Time range selector element not found');
    }

    if (downloadReportButton) {
        downloadReportButton.addEventListener('click', downloadReport);
    } else {
        console.warn('Download report button element not found');
    }

    // Load initial data
    loadDashboardData();
    loadActivityData();
}

/**
 * Dashboard initialization script
 * Runs when the dashboard page loads
 */

document.addEventListener('DOMContentLoaded', function() {
    initTabs();
    initCharts();
    setUserInfo();
    
    // Load orders if that tab is active initially
    if (document.getElementById('orders-tab').classList.contains('active')) {
        loadUserPurchases();
    }
});

/**
 * Initialize tab switching functionality
 */
function initTabs() {
    // Get all tab navigation links
    const tabItems = document.querySelectorAll('.nav-item');
    
    // Add click event listeners to each tab
    tabItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all tabs
            tabItems.forEach(tab => tab.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Hide all content sections
            const contentSections = document.querySelectorAll('.content-section');
            contentSections.forEach(section => section.classList.remove('active'));
            
            // Show selected content section
            const targetId = this.dataset.target;
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });
}

/**
 * Helper function to show a specific tab
 * @param {string} tabId - The ID of the tab to show
 */
function showTab(tabId) {
    // Find the nav item for this tab
    const navItem = document.querySelector(`.nav-item[data-target="${tabId}"]`);
    if (navItem) {
        navItem.click();
    }
}

/**
 * Initialize charts for the dashboard
 */
function initCharts() {
    // Initialize charts here if needed
    // Currently handled by analytics.js
}

/**
 * Set user information from JWT token
 */
function setUserInfo() {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    
    try {
        // Get user info from token or API
        const tokenPayload = parseJwt(token);
        if (tokenPayload && tokenPayload.sub) {
            // Update username in the profile
            const profileName = document.querySelector('.profile-name');
            if (profileName) {
                profileName.textContent = tokenPayload.sub;
            }
            
            // Update email if available
            // const profileEmail = document.querySelector('.profile-email');
            // if (profileEmail && tokenPayload.email) {
            //     profileEmail.textContent = tokenPayload.email;
            // }
        }
    } catch (error) {
        console.error('Error setting user info:', error);
    }
}

/**
 * Parse JWT token to extract payload
 * @param {string} token - JWT token
 * @returns {object} Token payload as object
 */
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Error parsing JWT:', error);
        return null;
    }
}

// Initialize when the page is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (dashboardCardsContainer) {
        console.log('Dashboard page detected, initializing dashboard...');
        initDashboard();
    }
});