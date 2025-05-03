/**
 * API Client for MarketPlace
 * Generalized API client that can be used across all pages
 */

// Base API URL - adjust this based on your backend configuration
const API_BASE_URL = 'http://localhost:8000';

/**
 * Helper function to handle API responses
 * @param {Response} response - Fetch API response object
 * @returns {Promise<any>} Parsed response data
 * @throws {Error} If the response is not OK
 */
const handleResponse = async (response) => {
    try {
        const data = await response.json();
        
        if (!response.ok) {
            const error = data.detail || data.message || 'An error occurred';
            throw new Error(error);
        }
        
        return data;
    } catch (jsonError) {
        // If JSON parsing fails, try to get text
        if (!response.ok) {
            const textResponse = await response.text();
            throw new Error(textResponse || 'An error occurred');
        }
        throw jsonError;
    }
};

/**
 * Generic request function that handles different HTTP methods
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param {object|null} data - Request body data 
 * @param {object} options - Additional request options
 * @returns {Promise<any>} Response data
 */
const request = async (endpoint, method = 'GET', data = null, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
        method,
        headers: {
            ...options.headers || {}
        },
        ...options
    };
    
    // Add auth token if available and not explicitly skipped
    if (!options.skipAuth) {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    
    // Handle different data formats based on content type
    if (data) {
        if (data instanceof FormData) {
            config.body = data;
            // Don't set Content-Type for FormData, browser will set it with boundary
        } else {
            config.headers['Content-Type'] = options.contentType || 'application/json';
            config.body = config.headers['Content-Type'] === 'application/json' 
                ? JSON.stringify(data) 
                : data;
        }
    }
    
    try {
        const response = await fetch(url, config);
        return await handleResponse(response);
    } catch (error) {
        console.error(`API request error (${method} ${endpoint}):`, error);
        throw error;
    }
};

/**
 * API client with methods for different HTTP verbs
 */
const apiClient = {
    get: (endpoint, options = {}) => request(endpoint, 'GET', null, options),
    post: (endpoint, data, options = {}) => request(endpoint, 'POST', data, options),
    put: (endpoint, data, options = {}) => request(endpoint, 'PUT', data, options),
    patch: (endpoint, data, options = {}) => request(endpoint, 'PATCH', data, options),
    delete: (endpoint, options = {}) => request(endpoint, 'DELETE', null, options),
};

export default apiClient;