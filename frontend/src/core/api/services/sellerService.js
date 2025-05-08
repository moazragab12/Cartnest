// filepath: d:\college\Senior 1\Spring 25\Parallel\Project\MarketPlace\frontend\src\core\api\services\sellerService.js

/**
 * Seller Service Module
 * Handles API calls related to seller dashboard data
 */

const API_BASE_URL = 'http://localhost:8000/api/v0';

/**
 * Get the seller's active products
 * @returns {Promise<Array>} Products data
 */
export async function getSellerItems() {
  try {
    // Get auth token from localStorage
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      console.error('Authentication token not found');
      throw new Error('Authentication token not found');
    }
    
    // Fetch seller's items from API
    const response = await fetch(`${API_BASE_URL}/profile/items`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Check if request was successful
    if (!response.ok) {
      throw new Error(`Failed to fetch seller items: ${response.status} ${response.statusText}`);
    }
    
    // Parse response data
    const data = await response.json();
    console.log('Seller items fetched successfully:', data);
    
    return data;
  } catch (error) {
    console.error('Error fetching seller items:', error);
    throw error;
  }
}

/**
 * Get the seller's financial summary
 * @returns {Promise<Object>} Seller financial summary data
 */
export async function getSellerSummary() {
  try {
    // Get auth token from localStorage
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      console.error('Authentication token not found');
      throw new Error('Authentication token not found');
    }
    
    // Fetch seller's financial summary from API
    const response = await fetch(`${API_BASE_URL}/reporting/user/summary`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Check if request was successful
    if (!response.ok) {
      throw new Error(`Failed to fetch seller summary: ${response.status} ${response.statusText}`);
    }
    
    // Parse response data
    const data = await response.json();
    console.log('Seller summary fetched successfully:', data);
    
    return data;
  } catch (error) {
    console.error('Error fetching seller summary:', error);
    throw error;
  }
}

/**
 * Get the seller's sales chart data for visualization
 * @param {string} timeRange - The time range to fetch data for (7_days, 30_days, 90_days, this_year)
 * @returns {Promise<Object>} Formatted sales chart data
 */
export async function getSellerSalesChartData(timeRange = '7_days') {
  try {
    // Get auth token from localStorage
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      console.error('Authentication token not found');
      throw new Error('Authentication token not found');
    }
    
    // Fetch sales chart data from API
    console.log(`Fetching sales chart data from: /reporting/user/seller/sales/chart?time_range=${timeRange}`);
    const response = await fetch(`${API_BASE_URL}/reporting/user/seller/sales/chart?time_range=${timeRange}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Check if request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch sales chart data: ${response.status} ${response.statusText}. Response: ${errorText}`);
      throw new Error(`Failed to fetch sales chart data: ${response.status} ${response.statusText}`);
    }
    
    // Parse response data
    const data = await response.json();
    console.log('Sales chart data fetched successfully:', data);
    
    return data;
  } catch (error) {
    console.error('Error fetching sales chart data:', error);
    // Return default empty data structure to prevent chart errors
    return {
      data: [],
      total_sales: 0,
      average_daily_sales: 0,
      highest_daily_sales: 0,
      time_range: timeRange,
      user_id: 0,
      username: 'User'
    };
  }
}