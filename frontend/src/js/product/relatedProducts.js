/**
 * relatedProducts.js
 * Handles fetching and displaying related products (products from the same category)
 * using products-service.js for rendering.
 */

// Assuming products-service.js is in the same shared directory or path is adjusted
import { renderProductsFromArray } from '../shared/products-service.js';
// API_ENDPOINTS might be useful if your API structure is complex,
// but for now, using direct paths.
// import API_ENDPOINTS from '../core/api/endpoints.js'; 

const API_BASE_URL = 'http://localhost:8000'; // Base URL for API calls

// The createProductCardHTML function is REMOVED. Card creation is handled by products-service.js.

/**
 * Renders related products in the designated section using the products-service.
 * @param {Array} products - Array of product objects to render.
 */
async function renderRelatedProductsUI(products) {
  const relatedProductsSelector = '.related-products .products-grid'; // CSS selector for the grid
  const relatedProductsSection = document.querySelector('.related-products'); // The whole section

  if (!relatedProductsSection) {
    console.warn("Related products section/container not found.");
    return;
  }

  if (!products || products.length === 0) {
    relatedProductsSection.style.display = 'none'; // Hide section if no products
    return;
  }

  // Ensure the section is visible before rendering
 

  await renderProductsFromArray(
    relatedProductsSelector,
    products,
    products.length, // Total count for this specific rendering operation
    {
      loadingMessage: "Loading related products...",
      noProductsMessage: "No related products found for this item.",
      onRenderComplete: (renderedCount, totalCount) => {
        // console.log(`Related Products: Rendered ${renderedCount} of ${totalCount} items.`);
        // Cart button event listeners are assumed to be handled by the createCartButton
        // function called within products-service.js.
      }
    }
  );
}

/**
 * Fetches related products from the API based on category.
 * @param {string} currentProductId - Current product ID to exclude from related items.
 * @param {string} category - Current product category for filtering.
 * @param {number} limit - Maximum number of related products to fetch.
 * @returns {Promise<Array>} - Array of related product objects.
 */
async function fetchRelatedProductsFromAPI(currentProductId, category, limit = 4) { // Default to 4 for layout
  try {
    // Use the search endpoint with category filter.
    // Your API_ENDPOINTS.search.items.search would resolve to something like '/api/v0/search/items/search'
    const searchEndpointPath = `/api/v0/search/items/search`; // Assuming this is the correct path
    const params = new URLSearchParams({
      category: category,
      status: 'for_sale',
      // The search endpoint itself might not support 'limit' directly in the same way
      // as a dedicated 'items' endpoint. It often returns all matches for the query.
      // We will fetch all by category and then filter/slice.
    });

    const fetchUrl = `${API_BASE_URL}${searchEndpointPath}?${params.toString()}`;
    // console.log(`RelatedProducts: Fetching from ${fetchUrl}`);
    
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      console.warn(`RelatedProducts: API error fetching related (category search): ${response.status}`);
      return []; // Return empty on error to allow fallback
    }
    
    const allDataInCategory = await response.json();
    
    if (!Array.isArray(allDataInCategory)) {
        console.warn("RelatedProducts: API response for category search was not an array.", allDataInCategory);
        return [];
    }

    // Filter out the current product and then slice to the limit.
    const filteredData = allDataInCategory
      .filter(item => item.item_id && item.item_id.toString() !== currentProductId.toString())
      .slice(0, limit);
    
    // console.log(`RelatedProducts: Found ${filteredData.length} related products in category '${category}'.`);
    return filteredData;

  } catch (error) {
    console.error('RelatedProducts: Error fetching related products from API:', error);
    return []; // Return empty array on critical error
  }
}

/**
 * Fallback to fetch featured products if no category-related products are found.
 * @param {string} currentProductId - Current product ID to exclude.
 * @param {number} limit - Maximum number of products to fetch.
 * @returns {Promise<Array>} - Array of product objects.
 */
async function fetchFeaturedProductsAsFallback(currentProductId, limit = 4) {
  // console.log("RelatedProducts: No category matches, falling back to featured products.");
  try {
    const featuredEndpointPath = `/api/v0/items/featured`; // Assuming this endpoint
    const params = new URLSearchParams({ limit: limit.toString() });
    // Your API_ENDPOINTS.items.featured would resolve here.

    const fetchUrl = `${API_BASE_URL}${featuredEndpointPath}?${params.toString()}`;
    const response = await fetch(fetchUrl);

    if (!response.ok) {
      console.warn(`RelatedProducts: API error fetching featured (fallback): ${response.status}`);
      return [];
    }
    const featuredProducts = await response.json();
    if (!Array.isArray(featuredProducts)) {
        console.warn("RelatedProducts: API response for featured fallback was not an array.", featuredProducts);
        return [];
    }
    // Filter out the current product if it happens to be in featured.
    return featuredProducts
      .filter(item => item.item_id && item.item_id.toString() !== currentProductId.toString())
      .slice(0, limit); // Ensure limit is still respected
  } catch (error) {
    console.error('RelatedProducts: Error fetching backup featured products:', error);
    return [];
  }
}


/**
 * Adds a product to the cart (delegating to cartManager if possible, or using localStorage).
 * This function is likely redundant if createCartButton (used by service) handles its own logic.
 * Kept for now if direct calls are needed, but ideally, cart interactions are centralized.
 * @param {string} productId - ID of the product to add.
 */


/**
 * Updates the cart badge count in the UI.
 */
function updateCartBadge() {
  const cartBadge = document.getElementById('cart-badge');
  if (!cartBadge) return;
  
  try {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const itemCount = cart.reduce((total, item) => total + (item.quantity || 0), 0);
    
    cartBadge.textContent = itemCount.toString();
    cartBadge.style.display = itemCount > 0 ? 'flex' : 'none';
  } catch (error) {
    console.error('RelatedProducts: Error updating cart badge:', error);
  }
}

/**
 * Mocks related products for development or if API fails.
 * @param {string} category - Product category.
 * @param {string} currentProductId - Current product ID to exclude.
 * @param {number} limit - Number of mock products to generate.
 * @returns {Array} Array of mock product objects.
 */
function getMockRelatedProducts(category, currentProductId, limit = 4) {
  // console.log("RelatedProducts: Using mock data for category:", category);
  const mockProducts = [];
  const baseCategories = ['Gadgets', 'Apparel', 'Home Goods', 'Books', 'Outdoor Gear'];
  const currentCategory = category || baseCategories[Math.floor(Math.random() * baseCategories.length)];

  for (let i = 0; i < limit; i++) {
    let mockId = Math.floor(Math.random() * 10000) + 1;
    while (currentProductId && mockId.toString() === currentProductId.toString()) {
      mockId = Math.floor(Math.random() * 10000) + 1;
    }
    mockProducts.push({
      item_id: mockId.toString(),
      name: `Mock ${currentCategory} Item ${i + 1}`,
      price: parseFloat((Math.random() * 200 + 20).toFixed(2)),
      original_price: Math.random() > 0.6 ? parseFloat((Math.random() * 100 + (parseFloat((Math.random() * 200 + 20).toFixed(2)))).toFixed(2)) : null,
      description: `A mock description for this related ${currentCategory.toLowerCase()} product. Explore more like this!`,
      quantity: Math.floor(Math.random() * 30) + 1,
      category: currentCategory,
      status: Math.random() > 0.5 ? 'for_sale' : 'new',
      rating: (Math.random() * 3.0 + 2.0).toFixed(1), // Rating 2.0 to 5.0
      rating_count: Math.floor(Math.random() * 300) + 10,
      image_url: null, // Service will use its fallback or generated image
      listed_at: new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  return mockProducts;
}

/**
 * Initializes the related products module.
 * @param {string} currentProductId - Current product ID (from URL, etc.) to exclude.
 * @param {string} productCategory - Category of the current product to find related items.
 * @param {number} limit - Maximum number of related products to display.
 */
export async function initRelatedProducts(currentProductId, productCategory, limit = 4) {
  // console.log("RelatedProducts: Initializing. Current Product ID:", currentProductId, "Category:", productCategory, "Limit:", limit);
  const relatedProductsContainer = document.querySelector('.related-products .products-grid');
  const relatedSection = document.querySelector('.related-products');

  if (!productCategory) {
    console.warn('RelatedProducts: Category is required to fetch related products. Hiding section.');
    if (relatedSection) relatedSection.style.display = 'none';
    return;
  }
  if (relatedProductsContainer) { // Show loading state early
    relatedProductsContainer.innerHTML = '<div class="loading-spinner" style="text-align:center; padding:20px;">Loading related items...</div>';
  }

  try {
    let relatedProducts = await fetchRelatedProductsFromAPI(currentProductId, productCategory, limit);
    
    if (!relatedProducts || relatedProducts.length === 0) {
      // console.log('RelatedProducts: No direct category matches, trying featured fallback.');
      relatedProducts = await fetchFeaturedProductsAsFallback(currentProductId, limit);
    }

    if (!relatedProducts || relatedProducts.length === 0) {
      // console.warn('RelatedProducts: No products found from API or fallback, using mock data.');
      relatedProducts = getMockRelatedProducts(productCategory, currentProductId, limit);
    }
    
    await renderRelatedProductsUI(relatedProducts);

  } catch (error) {
    console.error('RelatedProducts: Error initializing related products module:', error);
    if (relatedSection) relatedSection.style.display = 'none';
  }
  // Initial cart badge update, if this module is responsible for it.
  updateCartBadge();
}
