/**
 * Category service to handle category-related functionality
 * Separated from navbar-categories.js for easier debugging
 */

import { apiClient } from '../core/api/index.js';

const API_BASE_URL = 'http://localhost:8000';
const PRODUCTS_LIST_URL = '/frontend/src/pages/productsList/productList.html';

/**
 * Fetch categories from the API
 * @returns {Promise<Array>} - Array of category objects
 */
async function fetchCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v0/items/categories`);
        const data = await response.json();
        return data || [];
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

/**
 * Navigate to products list with category filter
 * @param {string} categoryName - Name of the category to filter by
 */
function navigateToCategory(categoryName) {
    if (!categoryName) return;
    
    // Build the URL with the category filter query parameter
    const url = `${PRODUCTS_LIST_URL}?category=${encodeURIComponent(categoryName)}`;
    
    // Navigate to the products list page
    window.location.href = url;
}

export { fetchCategories, navigateToCategory };