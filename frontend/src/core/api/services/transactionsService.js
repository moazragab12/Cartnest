// filepath: d:\college\Senior 1\Spring 25\Parallel\Project\MarketPlace\frontend\src\core\api\services\transactionsService.js

/**
 * Transactions Service Module
 * Handles API calls related to transactions
 */

const API_BASE_URL = 'http://localhost:8000/api/v0';

/**
 * Get all transactions for the current user
 * @returns {Promise<Object>} Transaction data
 */
export async function getTransactions() {
  try {
    // Get auth token from localStorage
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      console.error('Authentication token not found');
      throw new Error('Authentication token not found');
    }
    
    // Fetch transactions from API
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Check if request was successful
    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.status} ${response.statusText}`);
    }
    
    // Parse response data
    const data = await response.json();
    console.log('Transactions fetched successfully:', data);
    
    return data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    
    // For development/debugging - return hardcoded data if API call fails
    return {
      "transactions": [
        {
          "transaction_id": 3,
          "item_id": 3,
          "buyer_user_id": 2,
          "seller_user_id": 3,
          "quantity_purchased": 1,
          "purchase_price": 1000,
          "total_amount": 1000,
          "transaction_time": "2025-05-05T21:00:14.844974Z",
          "item_name": "Premium Headphones",
          "seller_name": "Tech Store"
        },
        {
          "transaction_id": 2,
          "item_id": 2,
          "buyer_user_id": 3,
          "seller_user_id": 2,
          "quantity_purchased": 2,
          "purchase_price": 1000,
          "total_amount": 2000,
          "transaction_time": "2025-05-05T19:25:45.702881Z",
          "item_name": "Smart Watch",
          "seller_name": "Electronics Hub"
        },
        {
          "transaction_id": 1,
          "item_id": 1,
          "buyer_user_id": 2,
          "seller_user_id": 1,
          "quantity_purchased": 1,
          "purchase_price": 10,
          "total_amount": 10,
          "transaction_time": "2025-05-05T04:42:48.687999Z",
          "item_name": "Coffee Mug",
          "seller_name": "Home Goods"
        }
      ],
      "total": 3
    };
  }
}

/**
 * Get details for a specific transaction
 * @param {number} transactionId - The ID of the transaction to fetch
 * @returns {Promise<Object>} Transaction details
 */
export async function getTransactionDetails(transactionId) {
  try {
    // Get auth token from localStorage
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      console.error('Authentication token not found');
      throw new Error('Authentication token not found');
    }
    
    // Fetch transaction details from API
    const response = await fetch(`${API_BASE_URL}/transactions/${transactionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Check if request was successful
    if (!response.ok) {
      throw new Error(`Failed to fetch transaction details: ${response.status} ${response.statusText}`);
    }
    
    // Parse response data
    const data = await response.json();
    console.log(`Transaction ${transactionId} fetched successfully:`, data);
    
    return data;
  } catch (error) {
    console.error(`Error fetching transaction ${transactionId}:`, error);
    throw error;
  }
}

/**
 * Get all items to use for mapping item IDs to names
 * @returns {Promise<Array>} Array of items
 */
export async function getAllItems() {
  try {
    // Get auth token from localStorage
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      console.error('Authentication token not found');
      throw new Error('Authentication token not found');
    }
    
    // Fetch all items from API
    const response = await fetch(`${API_BASE_URL}/items`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Check if request was successful
    if (!response.ok) {
      throw new Error(`Failed to fetch items: ${response.status} ${response.statusText}`);
    }
    
    // Parse response data
    const data = await response.json();
    console.log('Items fetched successfully:', data);
    
    // Handle case where data is directly an array or has an 'items' property
    const items = Array.isArray(data) ? data : data.items || [];
    
    // If no items from API, use hardcoded data for testing
    if (items.length === 0) {
      console.warn('No items returned from API, using hardcoded data');
      return [
        { item_id: 1, name: "banana" },
        { item_id: 2, name: "j2" },
        { item_id: 3, name: "mobile" }
      ];
    }
    
    console.log('Returning items array with length:', items.length);
    return items;
  } catch (error) {
    console.error('Error fetching items:', error);
    
    // Return hardcoded data for testing if API call fails
    console.warn('Using hardcoded items data due to API error');
    return [
      { item_id: 1, name: "banana" },
      { item_id: 2, name: "j2" },
      { item_id: 3, name: "mobile" }
    ];
  }
}

/**
 * Create a new transaction
 * @param {Object} transactionData - Data for the new transaction
 * @returns {Promise<Object>} Created transaction
 */
export async function createTransaction(transactionData) {
  try {
    // Get auth token from localStorage
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      console.error('Authentication token not found');
      throw new Error('Authentication token not found');
    }
    
    // Create transaction via API
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(transactionData)
    });
    
    // Check if request was successful
    if (!response.ok) {
      throw new Error(`Failed to create transaction: ${response.status} ${response.statusText}`);
    }
    
    // Parse response data
    const data = await response.json();
    console.log('Transaction created successfully:', data);
    
    return data;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
}

/**
 * Get all users to map IDs to usernames
 * @returns {Promise<Array>} Array of users
 */
export async function getAllUsers() {
  try {
    // Get auth token from localStorage
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      console.error('Authentication token not found');
      throw new Error('Authentication token not found');
    }
      // Use the correct search endpoint from API_ENDPOINTS
    const response = await fetch(`${API_BASE_URL}/search/users/search`, {
      method: 'GET',  // Changed to GET as the API doesn't support POST for this endpoint
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
      // No body for GET request
    });
    
    // Check if request was successful
    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
    }
    
    // Parse response data
    const data = await response.json();
    console.log('Users fetched successfully:', data);
    
    // Handle case where data directly has 'results' property for search endpoints
    const users = Array.isArray(data) ? data : data.results || data.users || [];
    
    // Process the user data to ensure it has the expected format
    const processedUsers = users.map(user => ({
      user_id: user.user_id || user.id,
      username: user.username || user.name || 'Unknown User',
      // Add any other needed user properties
      avatar: user.avatar || null,
      email: user.email || null
    }));
    
    // If no users from API, use hardcoded data for testing
    if (processedUsers.length === 0) {
      console.warn('No users returned from API, using hardcoded data');
      return [
        { user_id: 1, username: "Omaar" },
        { user_id: 2, username: "user_test" },
        { user_id: 3, username: "test2" }
      ];
    }
    
    console.log('Returning users array with length:', processedUsers.length);
    return processedUsers;
  } catch (error) {
    console.error('Error fetching users:', error);
    
    // Return hardcoded data for testing if API call fails
    console.warn('Using hardcoded users data due to API error');
    return [
      { user_id: 1, username: "Omaar" },
      { user_id: 2, username: "user_test" },
      { user_id: 3, username: "test2" },
      // Add additional hardcoded users to match the ones in the transactions
      { user_id: 5, username: "SpécialUser" }
    ];
  }
}