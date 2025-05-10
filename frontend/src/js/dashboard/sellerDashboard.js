// filepath: d:\college\Senior 1\Spring 25\Parallel\Project\MarketPlace\frontend\src\js\dashboard\sellerDashboard.js

/**
 * Seller Dashboard UI Module
 * Handles UI updates for the seller dashboard
 */

import { getSellerDashboardData } from './controllers/sellerController.js';
import { updateSalesChart } from './analytics.js';

// DOM elements
let activeProdCountElement;
let totalSalesElement;
let totalEarningsElement;
let loadingIndicators = [];

// Initialize the seller dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Find the seller dashboard tab element
    const sellerTab = document.querySelector('.nav-item[data-target="seller-dashboard-tab"]');
    
    if (sellerTab) {
        // Initialize elements
        initElements();
        
        // Add event listener for tab click
        sellerTab.addEventListener('click', () => {
            loadSellerDashboardData();
            fetchProductStatusCounts();
            
            // Trigger chart refresh when tab is clicked
            setTimeout(() => {
                // Force chart refresh with default 7 days timeframe
                if (typeof updateSalesChart === 'function') {
                    updateSalesChart('7_days');
                    console.log('Chart update triggered from seller tab click');
                }
            }, 500);
        });
        
        // If seller dashboard is the active tab on page load, load data
        if (sellerTab.classList.contains('active')) {
            loadSellerDashboardData();
            fetchProductStatusCounts();
        }
    }
    
    // Add change event listener to time range dropdown
    const timeRangeSelector = document.getElementById('salesPerformanceTimeRange');
    if (timeRangeSelector) {
        timeRangeSelector.addEventListener('change', (event) => {
            console.log('Time range changed to:', event.target.value);
            if (typeof updateSalesChart === 'function') {
                updateSalesChart(event.target.value);
            }
        });
    }
});

// Initialize DOM elements
function initElements() {
    // Get card elements - targeting the correct elements in the seller dashboard stats grid
    const productsCard = document.querySelector('#seller-dashboard-tab .stat-card.products-card');
    const salesCard = document.querySelector('#seller-dashboard-tab .stat-card.sales-card');
    const earningsCard = document.querySelector('#seller-dashboard-tab .stat-card.earnings-card');
    
    if (productsCard) activeProdCountElement = productsCard.querySelector('.stat-value');
    if (salesCard) totalSalesElement = salesCard.querySelector('.stat-value');
    if (earningsCard) totalEarningsElement = earningsCard.querySelector('.stat-value');
    
    // Get loading indicators (optional, if you have loading spinners)
    loadingIndicators = document.querySelectorAll('#seller-dashboard-tab .loading-spinner');
    
    console.log('Seller dashboard elements initialized:', {
        activeProdCountElement,
        totalSalesElement,
        totalEarningsElement
    });
}

// Show loading state
function showLoading() {
    if (activeProdCountElement) activeProdCountElement.innerHTML = '<span class="loading-placeholder">Loading...</span>';
    if (totalSalesElement) totalSalesElement.innerHTML = '<span class="loading-placeholder">Loading...</span>';
    if (totalEarningsElement) totalEarningsElement.innerHTML = '<span class="loading-placeholder">Loading...</span>';
    
    // Show loading spinners if they exist
    loadingIndicators.forEach(spinner => {
        if (spinner) spinner.style.display = 'inline-block';
    });
}

// Hide loading state
function hideLoading() {
    // Hide loading spinners if they exist
    loadingIndicators.forEach(spinner => {
        if (spinner) spinner.style.display = 'none';
    });
}

// Update dashboard card values
function updateDashboardCards(data) {
    // Update active products count
    if (activeProdCountElement) {
        activeProdCountElement.textContent = data.activeProductsCount;
        console.log('Updated active products count:', data.activeProductsCount);
    } else {
        console.error('Active products count element not found');
    }
    
    // Update total sales
    if (totalSalesElement) {
        totalSalesElement.textContent = data.totalSales;
        console.log('Updated total sales:', data.totalSales);
    } else {
        console.error('Total sales element not found');
    }
    
    // Update total earnings
    if (totalEarningsElement) {
        // Remove the $ symbol if it exists in the value element
        totalEarningsElement.textContent = `$${data.totalEarnings.toFixed(2)}`;
        console.log('Updated total earnings:', data.totalEarnings);
    } else {
        console.error('Total earnings element not found');
    }
}

// Load seller dashboard data from the API
async function loadSellerDashboardData() {
    try {
        // Show loading state
        showLoading();
        
        // Check if user is logged in
        const token = localStorage.getItem('accessToken');
        if (!token) {
            console.error('User not logged in');
            updateDashboardCards({
                activeProductsCount: '-',
                totalSales: '-',
                totalEarnings: '-'
            });
            return;
        }
        
        console.log('Fetching seller dashboard data...');
        
        // Fetch seller dashboard data
        const dashboardData = await getSellerDashboardData();
        
        console.log('Seller dashboard data received:', dashboardData);
        
        // Update the UI with the fetched data
        updateDashboardCards(dashboardData);
        
    } catch (error) {
        console.error('Error loading seller dashboard data:', error);
        
        // Show error state in cards
        if (activeProdCountElement) activeProdCountElement.textContent = 'Error';
        if (totalSalesElement) totalSalesElement.textContent = 'Error';
        if (totalEarningsElement) totalEarningsElement.textContent = 'Error';
        
    } finally {
        // Hide loading state
        hideLoading();
    }
}

// Function to fetch the user's product status counts
async function fetchProductStatusCounts() {
  try {
    // Define API base URL (same as in sellerController.js)
    const API_BASE_URL = 'http://localhost:8000/api/v0';
    
    // Find the Products Status section first
    const topSellingProductsTitle = Array.from(
      document.querySelectorAll('#seller-dashboard-tab .card-title')
    ).find(el => el.textContent.trim().includes('Products Status'));
    
    if (!topSellingProductsTitle) {
      console.error('Could not find Products Status section');
      return;
    }
    
    // Get the parent dashboard card element
    const topSellingSection = topSellingProductsTitle.closest('.dashboard-card');
    
    if (!topSellingSection) {
      console.error('Could not find parent container for Products Status');
      return;
    }
    
    // Find all status card value elements
    const cards = {
      forSale: topSellingSection.querySelector('.products-card .stat-value'),
      sold: topSellingSection.querySelector('.sales-card .stat-value'),
      removed: topSellingSection.querySelector('.removed-card .stat-value'),
      draft: topSellingSection.querySelector('.draft-card .stat-value')
    };
    
    // Show loading state on all cards
    Object.values(cards).forEach(card => {
      if (card) card.textContent = 'Loading...';
    });

    console.log('Fetching product status data from API...');
    
    // Use the correct full API URL with the base URL
    const response = await fetch(`${API_BASE_URL}/reporting/user/items/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });

    // Log the entire response for debugging
    console.log('API Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Parse the response data
    const data = await response.json();
    console.log('Product status data received:', data);
    
    // Update each card with its respective value - ensuring we use the correct property names
    if (cards.forSale) cards.forSale.textContent = data.for_sale || 0;
    if (cards.sold) cards.sold.textContent = data.sold || 0;
    if (cards.removed) cards.removed.textContent = data.removed || 0;
    if (cards.draft) cards.draft.textContent = data.draft || 0;
    
  } catch (error) {
    console.error('Error fetching product status counts:', error);
    
    // Find the cards again to ensure we have references
    const topSellingProductsTitle = Array.from(
      document.querySelectorAll('#seller-dashboard-tab .card-title')
    ).find(el => el.textContent.trim().includes('Products Status'));
    
    if (topSellingProductsTitle) {
      const topSellingSection = topSellingProductsTitle.closest('.dashboard-card');
      
      if (topSellingSection) {
        const cards = {
          forSale: topSellingSection.querySelector('.products-card .stat-value'),
          sold: topSellingSection.querySelector('.sales-card .stat-value'),
          removed: topSellingSection.querySelector('.removed-card .stat-value'),
          draft: topSellingSection.querySelector('.draft-card .stat-value')
        };
        
        // Set all cards to error state
        Object.values(cards).forEach(card => {
          if (card) card.textContent = '0';
        });
      }
    }
  }
}

// Function to update the product status cards with the fetched data
function updateProductStatusCards(statusData) {
  // Find the Products Status section
  const topSellingProductsTitle = Array.from(
    document.querySelectorAll('#seller-dashboard-tab .card-title')
  ).find(el => el.textContent.trim().includes('Products Status'));
  
  if (!topSellingProductsTitle) {
    console.error('Could not find Products Status section');
    return;
  }
  
  // Get the parent dashboard card element
  const topSellingSection = topSellingProductsTitle.closest('.dashboard-card');
  
  if (!topSellingSection) {
    console.error('Could not find parent container for Products Status');
    return;
  }
  
  // Now locate each card within this section and update its value
  
  // Update "For Sale" card
  const forSaleCard = topSellingSection.querySelector('.products-card .stat-value');
  if (forSaleCard) {
    forSaleCard.textContent = statusData.for_sale;
  }
  
  // Update "Sold" card
  const soldCard = topSellingSection.querySelector('.sales-card .stat-value');
  if (soldCard) {
    soldCard.textContent = statusData.sold;
  }
  
  // Update "Removed" card
  const removedCard = topSellingSection.querySelector('.removed-card .stat-value');
  if (removedCard) {
    removedCard.textContent = statusData.removed;
  }
  
  // Update "Draft" card
  const draftCard = topSellingSection.querySelector('.draft-card .stat-value');
  if (draftCard) {
    draftCard.textContent = statusData.draft;
  }
  
  console.log('Updated product status cards with the following data:', {
    forSale: statusData.for_sale,
    sold: statusData.sold,
    removed: statusData.removed,
    draft: statusData.draft
  });
}

// Helper function to get the auth token from local storage
function getToken() {
    return localStorage.getItem('auth_token') || '';
}

// Export functions for potential use in other modules
export {
    loadSellerDashboardData
};