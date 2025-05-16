/**
 * viewedProducts.js
 * Displays featured or recommended products using products-service.js
 */

// Assuming products-service.js is in the same shared directory or path is adjusted
import { renderProductsFromArray } from '../shared/products-service.js'; 
// If cartManager is the standard, it should be used. For now, using its own badge update.
// import { cartManager } from '../shared/cart-manager.js'; 

const API_BASE_URL = 'http://localhost:8000'; // Used for its own API calls

// The _createProductCardHTML function is REMOVED as card creation is now handled by products-service.js

/**
 * Renders the viewed/recommended products in the designated section.
 * @param {Array} products - Array of product objects from the API.
 */
async function renderViewedProductsUI(products) {
  const viewedProductsSelector = '.viewed-products .products-grid'; // CSS selector for the grid
  const viewedProductsSection = document.querySelector('.viewed-products'); // The whole section
  
  if (!viewedProductsSection) {
    console.warn("Viewed products section/container not found.");
    return;
  }
  
  if (!products || products.length === 0) {
    viewedProductsSection.style.display = 'none'; // Hide section if no products
    return;
  }
  
  // Ensure the section is visible before rendering


  // Use the renderProductsFromArray function from products-service.js
  await renderProductsFromArray(
    viewedProductsSelector,
    products,
    products.length, // Total count for this specific rendering
    {
      loadingMessage: "Loading recommended products...",
      noProductsMessage: "No recommended products to display right now.", // More specific message
      onRenderComplete: (renderedCount, totalCount) => {
        // console.log(`Viewed Products: Rendered ${renderedCount} of ${totalCount} items.`);
        // Additional UI updates after rendering, if any.
      }
    }
  );
  // Note: Event listeners for cart buttons are assumed to be handled by the
  // createCartButton function called within products-service.js.
  // If not, they would need to be delegated here to `viewedProductsSelector`.
}

/**
 * Fetches recommended or popular products from the API.
 * @param {string} currentProductId - Current product ID to potentially exclude from recommendations.
 * @param {number} limit - Maximum number of products to fetch.
 * @returns {Promise<Array>} - Array of product objects.
 */
async function fetchRecommendedProductsFromAPI(currentProductId, limit = 4) { // Default to 4 for better layout
  try {
    // Example: Use a 'featured' or 'popular' endpoint.
    // Adjust endpoint and parameters as per your API.
    // Adding exclude_id if your API supports it.
    const params = new URLSearchParams({ limit: limit.toString() });
    if (currentProductId) {
      params.append('exclude_id', currentProductId);
    }
    // Using /items/featured as an example endpoint for recommendations
    const response = await fetch(`${API_BASE_URL}/api/v0/items/featured?${params.toString()}`);
    
    if (!response.ok) {
      console.warn(`ViewedProducts: API error fetching recommended: ${response.status}`);
      // Fallback to recent items if featured fails or doesn't exist
      return fetchRecentProductsAsFallback(currentProductId, limit);
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('ViewedProducts: Error fetching recommended products:', error);
    return fetchRecentProductsAsFallback(currentProductId, limit); // Fallback on network error
  }
}

async function fetchRecentProductsAsFallback(currentProductId, limit = 4) {
  console.log("ViewedProducts: Falling back to recent products for recommendations.");
  try {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (currentProductId) {
      params.append('exclude_id', currentProductId);
    }
    const response = await fetch(`${API_BASE_URL}/api/v0/items/recent?${params.toString()}`);
    if (!response.ok) {
      console.warn(`ViewedProducts: API error fetching recent (fallback): ${response.status}`);
      return []; // Give up if fallback also fails
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('ViewedProducts: Error fetching recent products as fallback:', error);
    return [];
  }
}


/**
 * Mocks viewed/featured products for development or if API fails.
 * @param {string} currentProductId - Current product ID to exclude.
 * @param {number} limit - Number of mock products to generate.
 * @returns {Array} Array of mock product objects.
 */
function getMockViewedProducts(currentProductId, limit = 4) {
  // console.log("ViewedProducts: Using mock data.");
  const mockProducts = [];
  const categories = ['Electronics', 'Fashion', 'Home', 'Beauty', 'Sports', 'Books'];
  
  for (let i = 0; i < limit; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    let mockId = Math.floor(Math.random() * 10000) + 1;
    // Ensure mock ID doesn't match the current product ID if provided
    while (currentProductId && mockId.toString() === currentProductId.toString()) {
      mockId = Math.floor(Math.random() * 10000) + 1;
    }
    
    mockProducts.push({
      item_id: mockId.toString(), // Ensure item_id is a string if service expects it
      name: `Popular ${category} Item ${i + 1}`,
      price: parseFloat((Math.random() * 450 + 50).toFixed(2)), // Price between 50 and 500
      original_price: Math.random() > 0.5 ? parseFloat((Math.random() * 200 + (parseFloat((Math.random() * 450 + 50).toFixed(2)))).toFixed(2)) : null,
      description: `This is a highly-rated ${category} product. It offers great value and quality. Many customers love it!`,
      quantity: Math.floor(Math.random() * 45) + 5, // Quantity between 5 and 50
      category: category,
      status: Math.random() > 0.3 ? 'for_sale' : 'new', // 'new' or 'for_sale'
      rating: (Math.random() * 3.5 + 1.5).toFixed(1), // Rating between 1.5 and 5.0
      rating_count: Math.floor(Math.random() * 500) + 20,
      image_url: null, // Let service handle fallback image or generate one
      listed_at: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString() // Listed in last 30 days
    });
  }
  return mockProducts;
}

/**
 * Updates the cart badge count in the UI.
 * This can be a shared utility if cart-manager.js isn't directly used here.
 */
function updateCartBadge() {
  const cartBadge = document.getElementById('cart-badge');
  if (!cartBadge) return;
  
  try {
    // Assuming cartManager is the source of truth for cart data
    // If cartManager is not used here, this needs to access cart data consistently (e.g. localStorage)
    const cart = JSON.parse(localStorage.getItem('cart') || '[]'); // Example: direct localStorage access
    const itemCount = cart.reduce((total, item) => total + (item.quantity || 0), 0);
    
    cartBadge.textContent = itemCount.toString();
    cartBadge.style.display = itemCount > 0 ? 'flex' : 'none';
  } catch (error) {
    console.error('ViewedProducts: Error updating cart badge:', error);
  }
}

/**
 * Initializes the viewed products module.
 * @param {string} currentProductId - Current product ID (from URL, etc.) to exclude from recommendations.
 * @param {number} limit - Maximum number of products to display.
 */
export async function initViewedProducts(currentProductId, limit = 4) {
  // console.log("ViewedProducts: Initializing with currentProductId:", currentProductId, "Limit:", limit);
  try {
    let viewedProducts = await fetchRecommendedProductsFromAPI(currentProductId, limit);
    
    if (!viewedProducts || viewedProducts.length === 0) {
      console.warn('ViewedProducts: No products fetched from API, attempting to use mock data.');
      viewedProducts = getMockViewedProducts(currentProductId, limit);
    }
    
    await renderViewedProductsUI(viewedProducts);
  } catch (error) {
    console.error('ViewedProducts: Error initializing viewed products module:', error);
    const viewedSection = document.querySelector('.viewed-products');
    if (viewedSection) {
      viewedSection.style.display = 'none'; // Hide section on critical error
    }
  }
  // Initial cart badge update
  updateCartBadge(); 
}

// If this script is meant to be imported as a module and initViewedProducts called elsewhere:
// export default { initViewedProducts };

// If it needs to self-initialize on pages where it's included:
// document.addEventListener('DOMContentLoaded', () => {
//   // Example: Get current product ID if on a product page
//   const urlParams = new URLSearchParams(window.location.search);
//   const currentProductId = urlParams.get('id'); 
//   initViewedProducts(currentProductId);
// });