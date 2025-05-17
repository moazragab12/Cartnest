/**
 * productApiService.js
 * Handles all product-related API calls
 */

const API_BASE_URL = 'http://localhost:8000/api/v0'; // Changed to absolute URL

/**
 * Fetches a specific product by ID
 * @param {number} productId - The ID of the product to fetch
 * @returns {Promise<Object>} - The product data
 */
export async function fetchProductById(productId) {
  try {
    const response = await fetch(`${API_BASE_URL}/search/items/search?item_id=${productId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Product with ID ${productId} not found`);
      }
      throw new Error(`Error fetching product: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data[0]; // The API returns an array with one item when using item_id
  } catch (error) {
    console.error('Error in fetchProductById:', error);
    throw error;
  }
}

/**
 * Fetches products from the same category as the specified product
 * @param {number} currentProductId - The ID of the current product to exclude
 * @param {string} category - The category to filter by
 * @param {number} limit - Maximum number of products to return
 * @returns {Promise<Array>} - Array of related products
 */
export async function fetchRelatedProducts(currentProductId, category, limit = 4) {
  try {
    // Construct URL with category filter
    const url = `${API_BASE_URL}/search/items/search?category=${encodeURIComponent(category)}&status=for_sale`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error fetching related products: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Filter out current product and limit results
    return data
      .filter(product => product.item_id !== parseInt(currentProductId))
      .slice(0, limit);
  } catch (error) {
    console.error('Error in fetchRelatedProducts:', error);
    throw error;
  }
}

/**
 * Fetches featured/popular products (could be based on any criteria)
 * @param {number} currentProductId - The ID of the current product to exclude
 * @param {number} limit - Maximum number of products to return
 * @returns {Promise<Array>} - Array of featured products
 */
export async function fetchFeaturedProducts(currentProductId, limit = 4) {
  try {
    // For featured products, we might want to use different criteria
    // For now, let's just get products with status=for_sale
    // The API_BASE_URL now includes /api/v0, so the path here is just the specific part
    const url = `${API_BASE_URL}/search/items/search?status=for_sale`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error fetching featured products: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Filter out current product, shuffle the array for variety, and limit results
    // Ensure currentProductId is treated as a number if it exists
    const numCurrentProductId = currentProductId !== undefined ? parseInt(currentProductId) : undefined;

    return data
      .filter(product => numCurrentProductId === undefined || product.item_id !== numCurrentProductId)
      .sort(() => 0.5 - Math.random()) // Simple shuffle
      .slice(0, limit);
  } catch (error) {
    console.error('Error in fetchFeaturedProducts:', error);
    throw error;
  }
}

/**
 * Search products by criteria
 * @param {Object} searchParams - Search parameters
 * @param {string} [searchParams.name] - Search by product name
 * @param {string} [searchParams.category] - Filter by category
 * @param {number} [searchParams.min_price] - Minimum price
 * @param {number} [search_params.max_price] - Maximum price
 * @param {string} [searchParams.status='for_sale'] - Product status
 * @param {number} [searchParams.seller_id] - Filter by seller
 * @param {number} [searchParams.days] - For recent items, number of days
 * @param {number} [searchParams.limit] - Limit number of results for search
 * @returns {Promise<Array>} - Search results
 */
export async function searchProducts(searchParams) {
  try {
    // Build query params
    const params = new URLSearchParams();
    
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    }
    
    // If no status specified, default to for_sale
    if (!searchParams.status && !params.has('status')) {
      params.append('status', 'for_sale');
    }
    
    const url = `${API_BASE_URL}/search/items/search?${params.toString()}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error searching products: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in searchProducts:', error);
    throw error;
  }
}

export default {
  fetchProductById,
  fetchRelatedProducts,
  fetchFeaturedProducts,
  searchProducts
};