// filepath: d:\college\Senior 1\Spring 25\Parallel\Project\MarketPlace\frontend\src\js\dashboard\controllers\sellerController.js

/**
 * Seller Dashboard Controller
 * Handles fetching and processing seller dashboard data
 */

import { getSellerItems, getSellerSummary } from '../../../core/api/services/sellerService.js';

// Define API base URL
const API_BASE_URL = 'http://localhost:8000/api/v0';

/**
 * Get active product count for the current seller
 * @returns {Promise<number>} Count of active products
 */
export async function getActiveProductsCount() {
  try {
    const items = await getSellerItems();
    
    // Count only active products with status 'for_sale'
    // Note: The API already filters for the logged-in user's items
    const activeItems = Array.isArray(items) ? items.filter(item => item.status === 'for_sale') : [];
    
    console.log('Active items count calculation:', {
      totalItems: items?.length || 0,
      activeItems: activeItems.length,
      itemsWithStatus: items?.map(item => ({ id: item.item_id, status: item.status }))
    });
    
    return activeItems.length;
  } catch (error) {
    console.error('Error getting active products count:', error);
    return 0;
  }
}

/**
 * Get total sales count for the current seller
 * @returns {Promise<number>} Total sales count
 */
export async function getTotalSalesCount() {
  try {
    const summary = await getSellerSummary();
    
    return summary?.total_sales || 0;
  } catch (error) {
    console.error('Error getting total sales count:', error);
    return 0;
  }
}

/**
 * Get total earnings for the current seller
 * @returns {Promise<number>} Total earnings
 */
export async function getTotalEarnings() {
  try {
    const summary = await getSellerSummary();
    
    return summary?.total_earned || 0;
  } catch (error) {
    console.error('Error getting total earnings:', error);
    return 0;
  }
}

/**
 * Get complete seller dashboard data in one call
 * @returns {Promise<Object>} Dashboard data object
 */
export async function getSellerDashboardData() {
  try {
    // Get auth token from localStorage
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      console.error('Authentication token not found');
      throw new Error('Authentication token not found');
    }
    
    // Fetch all data in parallel for better performance
    const [items, summary, chartResponse] = await Promise.all([
      getSellerItems(),
      getSellerSummary(),
      fetch(`${API_BASE_URL}/reporting/user/seller/sales/chart?time_range=30_days`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
    ]);
    
    // Parse chart response
    if (!chartResponse.ok) {
      console.error(`Failed to fetch chart data: ${chartResponse.status} ${chartResponse.statusText}`);
      throw new Error(`Failed to fetch chart data: ${chartResponse.status}`);
    }
    
    // Get chart data 
    const chartData = await chartResponse.json();
    console.log('Chart data received:', chartData);
    console.log('User summary data:', summary);
    
    // Calculate active product count - specifically looking for products with 'for_sale' status
    const activeItems = Array.isArray(items) ? items.filter(item => item.status === 'for_sale') : [];
    
    console.log('Active items count:', activeItems.length);
    console.log('Total earnings:', summary?.total_earned || 0);
    console.log('Total items sold:', summary?.total_sales || 0);
    
    // Return dashboard data
    return {
      activeProductsCount: activeItems.length,
      totalSales: summary?.total_sales || 0, // Now represents quantity of items sold, not transaction count
      totalEarnings: summary?.total_earned || 0,
      items: items || [],
      summary: summary || {},
      chartData: chartData || {}
    };
  } catch (error) {
    console.error('Error fetching seller dashboard data:', error);
    return {
      activeProductsCount: 0,
      totalSales: 0,
      totalEarnings: 0,
      items: [],
      summary: {},
      chartData: {}
    };
  }
}