/**
 * relatedProducts.js
 * Handles fetching and displaying related products (products from the same category)
 */

import API_ENDPOINTS from '../core/api/endpoints.js';

const API_BASE_URL = 'http://localhost:8000';

/**
 * Generates HTML for a product card
 * @param {Object} product - The product data from the API
 * @returns {string} HTML string for the product card
 */
function createProductCardHTML(product) {
  // Product images - use item_id to get the first thumbnail
  const imageUrl = `/frontend/public/resources/images/products/${product.item_id}-thumbnail.jpg`;
  
  // Format the price with 2 decimal places
  const formattedPrice = product.price.toFixed(2);
  
  // Create the badge HTML if applicable
  let badgeHTML = '';
  if (product.quantity < 5 && product.quantity > 0) {
    badgeHTML = '<span class="card-category-badge">Limited Stock</span>';
  } else if (product.status === 'new' || product.listed_at > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
    // If item was listed less than a week ago
    badgeHTML = '<span class="card-category-badge">New</span>';
  }

  // Calculate discount if original price exists and is higher than current price
  let discountBadgeHTML = '';
  if (product.original_price && product.original_price > product.price) {
    const discountPercent = Math.round(((product.original_price - product.price) / product.original_price) * 100);
    discountBadgeHTML = `<span class="card-discount-badge">-${discountPercent}%</span>`;
  }

  // Generate correct absolute URL path that works in all environments
  const productUrl = `../product/product.html?id=${product.item_id}`;

  // Build the product card HTML with properly linked elements
  return `
    <div class="card-product-card">
      ${discountBadgeHTML}
      ${badgeHTML}      <div class="card-product-image">
        <a href="${productUrl}" aria-label="View ${product.name} details">
          <img src="${imageUrl}" alt="${product.name}" onerror="this.src='/frontend/public/resources/images/products/smartwatch.jpg'">
        </a>
      </div>
      <div class="card-product-content">
        <div class="card-product-details">
          <div class="card-product-info">
            <h3 class="card-product-title">
              <a href="${productUrl}">${product.name}</a>
            </h3>
            <div class="card-product-rating">
              <div class="card-stars">★★★★☆</div>
              <span class="card-rating-count">(${Math.floor(Math.random() * 100) + 10})</span>
            </div>
            <div class="card-product-description">
              ${product.description ? (product.description.length > 100 ? product.description.slice(0, 97) + '...' : product.description) : 'No description available'}
            </div>
          </div>
          <div class="card-purchase-area">
            <div class="card-product-price">
              <span class="card-current-price">$${formattedPrice}</span>
              ${product.original_price ? `<span class="card-original-price">$${product.original_price.toFixed(2)}</span>` : ''}
            </div>
            <button class="card-cart-button" data-product-id="${product.item_id}">
              <div class="card-default-btn">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="#414141" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="card-cart-icon">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
              </div>
              <div class="card-hover-btn">
                <svg viewBox="0 0 320 512" width="12.5" height="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M160 0c17.7 0 32 14.3 32 32V67.7c1.6 .2 3.1 .4 4.7 .7c.4 .1 .7 .1 1.1 .2l48 8.8c17.4 3.2 28.9 19.9 25.7 37.2s-19.9 28.9-37.2 25.7l-47.5-8.7c-31.3-4.6-58.9-1.5-78.3 6.2s-27.2 18.3-29 28.1c-2 10.7-.5 16.7 1.2 20.4c1.8 3.9 5.5 8.3 12.8 13.2c16.3 10.7 41.3 17.7 73.7 26.3l2.9 .8c28.6 7.6 63.6 16.8 89.6 33.8c14.2 9.3 27.6 21.9 35.9 39.5c8.5 17.9 10.3 37.9 6.4 59.2c-6.9 38-33.1 63.4-65.6 76.7c-13.7 5.6-28.6 9.2-44.4 11V480c0 17.7-14.3 32-32 32s-32-14.3-32-32V445.1c-.4-.1-.9-.1-1.3-.2l-.2 0c-24.4-3.8-64.5-14.3-91.5-26.3c-16.1-7.2-23.4-26.1-16.2-42.2s26.1-23.4 42.2-16.2c20.9 9.3 55.3 18.5 75.2 21.6c31.9 4.7 58.2 2 76-5.3c16.9-6.9 24.6-16.9 26.8-28.9c1.9-10.6 .4-16.7-1.3-20.4c-1.9-4-5.6-8.4-13-13.3c-16.4-10.7-41.5-17.7-74-26.3l-2.8-.7 0 0C119.4 279.3 84.4 270 58.4 253c-14.2-9.3-27.5-22-35.8-39.6c-8.4-17.9-10.1-37.9-6.1-59.2C23.7 116 52.3 91.2 84.8 78.3c13.3-5.3 27.9-8.9 43.2-11V32c0-17.7 14.3-32 32-32z" fill="#ffffff"/>
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renders related products in the related products section
 * 
 * @param {Array} products - Array of product objects from API
 */
function renderRelatedProducts(products) {
  const relatedProductsContainer = document.querySelector('.related-products .card-products-grid');
  
  if (!relatedProductsContainer) {
    console.error('Related products container not found');
    return;
  }
  
  // Clear existing products
  relatedProductsContainer.innerHTML = '';
  
  // If no related products, hide the section
  if (!products || products.length === 0) {
    const relatedSection = document.querySelector('.related-products');
    if (relatedSection) {
      relatedSection.style.display = 'none';
    }
    return;
  }
  
  // Add each product
  products.forEach(product => {
    relatedProductsContainer.innerHTML += createProductCardHTML(product);
  });
  
  // Add event listeners for add to cart buttons
  document.querySelectorAll('.related-products .card-cart-button').forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const productId = this.dataset.productId;
      addToCart(productId);
    });
  });
}

/**
 * Fetches related products from the API based on category
 * 
 * @param {string} productId - Current product ID to exclude
 * @param {string} category - Current product category for filtering
 * @param {number} limit - Maximum number of related products to fetch
 * @returns {Promise<Array>} - Array of related product objects
 */
async function fetchRelatedProductsFromAPI(productId, category, limit = 3) {
  try {
    // Use the search endpoint with category filter
    const searchEndpoint = `${API_BASE_URL}${API_ENDPOINTS.search.items.search}?category=${encodeURIComponent(category)}&status=for_sale`;
    
    console.log(`Fetching related products using endpoint: ${searchEndpoint}`);
    
    const response = await fetch(searchEndpoint);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const allData = await response.json();
    
    // Filter out the current product and limit the results
    const filteredData = allData
      .filter(item => item.item_id.toString() !== productId.toString())
      .slice(0, limit);
    
    console.log(`Found ${filteredData.length} related products in category '${category}'`);
    return filteredData || [];
  } catch (error) {
    console.error('Error fetching related products from API:', error);
    return [];
  }
}

/**
 * Adds a product to the cart
 * 
 * @param {string} productId - ID of the product to add
 */
function addToCart(productId) {
  // Get current cart from localStorage
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');
  
  // Simple cart implementation - just add the product with quantity 1
  const existingItemIndex = cart.findIndex(item => item.id === parseInt(productId));
  
  if (existingItemIndex >= 0) {
    // Update quantity if item exists
    cart[existingItemIndex].quantity += 1;
  } else {
    // For simplicity, we'll add minimal information and let the cart page fetch more details
    cart.push({
      id: parseInt(productId),
      quantity: 1
    });
  }
  
  // Save back to localStorage
  localStorage.setItem('cart', JSON.stringify(cart));
  
  // Update cart badge
  updateCartBadge();
  
  // Use the global notification system if available
  if (window.notifications) {
    window.notifications.success('Product added to cart!');
  } else {
    // Fallback to a simple notification if the global system is not available
    const notification = document.getElementById('notification');
    if (notification) {
      notification.textContent = 'Product added to cart!';
      notification.classList.add('show');
      
      setTimeout(() => {
        notification.classList.remove('show');
      }, 3000);
    }
  }
}

/**
 * Updates the cart badge count
 */
function updateCartBadge() {
  const cartBadge = document.getElementById('cart-badge');
  if (!cartBadge) return;
  
  try {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
    
    cartBadge.textContent = itemCount.toString();
    cartBadge.style.display = itemCount > 0 ? 'flex' : 'none';
  } catch (error) {
    console.error('Error updating cart badge:', error);
  }
}

/**
 * Mocks related products when API is not available
 * 
 * @param {string} category - Product category
 * @param {number} limit - Number of mock products to generate
 * @returns {Array} Array of mock product objects
 */
function getMockRelatedProducts(category, limit = 3) {
  const mockProducts = [];
  
  for (let i = 0; i < limit; i++) {
    mockProducts.push({
      item_id: Math.floor(Math.random() * 10000) + 1,
      name: `${category} Product ${i + 1}`,
      price: Math.floor(Math.random() * 1000) + 100,
      description: `This is a high-quality ${category} product with many amazing features and benefits.`,
      quantity: Math.floor(Math.random() * 50) + 5,
      category: category,
      status: Math.random() > 0.7 ? 'new' : 'for_sale',
      image_url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-o9WGCQlihd4S4ImCBQU3KoujUhB82K.png'
    });
  }
  
  return mockProducts;
}

/**
 * Initializes the related products module
 * 
 * @param {string} productId - Current product ID from the URL
 * @param {string} category - Current product category (needed for filtering)
 * @param {number} limit - Maximum number of related products to display
 */
export async function initRelatedProducts(productId, category, limit = 3) {
  try {
    if (!category) {
      console.error('Category is required to fetch related products');
      return;
    }
    
    // Show loading state first
    const relatedProductsContainer = document.querySelector('.related-products .card-products-grid');
    if (relatedProductsContainer) {
      relatedProductsContainer.innerHTML = '<div class="loading-spinner">Loading related products from the same category...</div>';
    }

    console.log(`Fetching related products for product ${productId} in category '${category}'`);
    
    // Attempt to fetch related products from API
    let relatedProducts;
    try {
      relatedProducts = await fetchRelatedProductsFromAPI(productId, category, limit);
      
      // If no related products found in the category, try to get some featured products as backup
      if (!relatedProducts || relatedProducts.length === 0) {
        console.log('No related products found in the same category, trying to fetch featured products');
        try {
          const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.items.featured}?limit=${limit}`);
          if (response.ok) {
            const featuredProducts = await response.json();
            // Filter out the current product if it exists in featured
            relatedProducts = featuredProducts
              .filter(item => item.item_id.toString() !== productId.toString())
              .slice(0, limit);
            
            console.log(`Found ${relatedProducts.length} featured products as backup`);
          }
        } catch (error) {
          console.error('Error fetching backup featured products:', error);
        }
      }
    } catch (error) {
      console.warn('Error fetching related products from API, using mock data:', error);
      relatedProducts = getMockRelatedProducts(category, limit);
    }
    
    renderRelatedProducts(relatedProducts);
  } catch (error) {
    console.error('Error initializing related products:', error);
    // Hide the section if there's an error
    const relatedSection = document.querySelector('.related-products');
    if (relatedSection) {
      relatedSection.style.display = 'none';
    }
  }
}

// Default export for the module
export default {
  initRelatedProducts
};