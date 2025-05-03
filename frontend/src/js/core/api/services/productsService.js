/**
 * Products Service for MarketPlace
 * Implements product-related API functions
 */

import apiClient from '../apiClient.js';
import API_ENDPOINTS from '../endpoints.js';

/**
 * Get a list of products with optional filtering
 * @param {object} filters - Optional filters for the product list
 * @returns {Promise<object>} List of products
 */
const getProducts = async (filters = {}) => {
    try {
        const queryParams = new URLSearchParams();
        
        // Add filters to query parameters
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                queryParams.append(key, value);
            }
        });
        
        const queryString = queryParams.toString();
        const endpoint = queryString 
            ? `${API_ENDPOINTS.products.list}?${queryString}` 
            : API_ENDPOINTS.products.list;
            
        return await apiClient.get(endpoint);
    } catch (error) {
        console.error('Get products error:', error);
        throw error;
    }
};

/**
 * Get details of a specific product by ID
 * @param {string|number} productId - ID of the product
 * @returns {Promise<object>} Product details
 */
const getProductById = async (productId) => {
    if (!productId) {
        throw new Error('Product ID is required');
    }
    
    try {
        return await apiClient.get(API_ENDPOINTS.products.details(productId));
    } catch (error) {
        console.error(`Get product ${productId} error:`, error);
        throw error;
    }
};

/**
 * Search for products by query
 * @param {string} searchQuery - Search query
 * @returns {Promise<object>} Search results
 */
const searchProducts = async (searchQuery) => {
    try {
        const endpoint = `${API_ENDPOINTS.products.search}?q=${encodeURIComponent(searchQuery)}`;
        return await apiClient.get(endpoint);
    } catch (error) {
        console.error('Product search error:', error);
        throw error;
    }
};

export {
    getProducts,
    getProductById,
    searchProducts
};