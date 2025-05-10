/**
 * viewedProducts.js
 * Since we don't track user view history, this module displays featured or recommended products
 */

import { fetchFeaturedProducts } from '../core/productApiService.js';

const API_BASE_URL = 'http://localhost:8000';

/**
 * Generates HTML for a product card
 * @param {Object} product - The product data from the API
 * @returns {string} HTML string for the product card
 */
function createProductCardHTML(product) {  // Total number of available product thumbnail images (1 to 27)
  const totalImages = 27;
  
  // Use product ID to get a consistent "random" selection
  // Convert product.item_id to a number and get a value between 1 and totalImages (inclusive)
  const imageNumber = ((Number(product.item_id) || 0) % totalImages) + 1;
  const imageUrl = `/frontend/public/resources/images/products/${imageNumber}-thumbnail.jpg`;
  
  // Format the price with 2 decimal places
  const formattedPrice = product.price.toFixed(2);
  
  // Create badge HTML based on product properties
  let badgeHTML = '';
  if (product.status === 'new') {
    badgeHTML = '<span class="card-category-badge">New</span>';
  } else if (product.quantity <= 3 && product.quantity > 0) {
    badgeHTML = '<span class="card-category-badge">Selling Fast</span>';
  } else if (Math.random() > 0.7) {
    // Add some variety to badges
    badgeHTML = '<span class="card-category-badge">Popular</span>';
  } else if (Math.random() > 0.5) {
    badgeHTML = '<span class="card-category-badge">Bestseller</span>';
  }

  // Calculate discount if original price exists and is higher than current price
  let discountBadgeHTML = '';
  if (product.original_price && product.original_price > product.price) {
    const discountPercent = Math.round(((product.original_price - product.price) / product.original_price) * 100);
    discountBadgeHTML = `<span class="card-discount-badge">-${discountPercent}%</span>`;
  }

  // Generate correct URL path that works in all environments
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
              <div class="card-stars">★★★★★</div>
              <span class="card-rating-count">(${Math.floor(Math.random() * 300) + 50})</span>
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
 * Renders the viewed products in the "Viewed Products" section
 * 
 * @param {Array} products - Array of product objects from the API
 */
function renderViewedProducts(products) {
  // We're showing these in the viewed products section
  const viewedProductsContainer = document.querySelector('.viewed-products .card-products-grid');
  const viewedProductsSection = document.querySelector('.viewed-products');
  
  if (!viewedProductsContainer) {
    console.error('Viewed products container not found');
    return;
  }
  
  // Clear existing products
  viewedProductsContainer.innerHTML = '';
  
  // If no products, hide the section
  if (!products || products.length === 0) {
    if (viewedProductsSection) {
      viewedProductsSection.style.display = 'none';
    }
    return;
  }
  
  // Add each product
  products.forEach(product => {
    viewedProductsContainer.innerHTML += createProductCardHTML(product);
  });
  
  // Add event listeners for add to cart buttons
  document.querySelectorAll('.viewed-products .card-cart-button').forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const productId = this.dataset.productId;
      addToCart(productId);
    });
  });
}

/**
 * Fetches recommended or popular products from the API
 * 
 * @param {string} productId - Current product ID to exclude
 * @param {number} limit - Maximum number of products to fetch
 * @returns {Promise<Array>} - Array of product objects
 */
async function fetchRecommendedProductsFromAPI(productId, limit = 3) {
  try {
    // Use featured or popular products endpoint, excluding current product
    const response = await fetch(`${API_BASE_URL}/api/v0/items/featured?limit=${limit}&exclude_id=${productId}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Error fetching recommended products from API:', error);
    // If featured endpoint fails, try recent products
    try {
      const response = await fetch(`${API_BASE_URL}/api/v0/items/recent?limit=${limit}&exclude_id=${productId}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      return data || [];
    } catch (secondError) {
      console.error('Error fetching recent products as fallback:', secondError);
      return [];
    }
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
 * Mocks viewed/featured products when API is not available
 * 
 * @param {string} productId - Current product ID to exclude
 * @param {number} limit - Number of mock products to generate
 * @returns {Array} Array of mock product objects
 */
function getMockViewedProducts(productId, limit = 3) {
  const mockProducts = [];
  const categories = ['Electronics', 'Fashion', 'Home', 'Beauty', 'Sports'];
  
  for (let i = 0; i < limit; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    // Make sure mock product ID doesn't match the current product
    let mockId = Math.floor(Math.random() * 10000) + 1;
    while (mockId.toString() === productId.toString()) {
      mockId = Math.floor(Math.random() * 10000) + 1;
    }
    
    mockProducts.push({
      item_id: mockId,
      name: `Popular ${category} Item ${i + 1}`,
      price: Math.floor(Math.random() * 500) + 99.99,
      description: `This is a highly-rated ${category} product that many customers have viewed recently.`,
      quantity: Math.floor(Math.random() * 50) + 5,
      category: category,
      status: Math.random() > 0.7 ? 'new' : 'for_sale',
      image_url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-o9WGCQlihd4S4ImCBQU3KoujUhB82K.png'
    });
  }
  
  return mockProducts;
}

/**
 * Initializes the viewed products module
 * 
 * @param {string} productId - Current product ID from the URL to exclude
 * @param {number} limit - Maximum number of products to display
 */
export async function initViewedProducts(productId, limit = 3) {
  try {
    // Attempt to fetch recommended products from API
    let viewedProducts;
    try {
      viewedProducts = await fetchRecommendedProductsFromAPI(productId, limit);
    } catch (error) {
      console.warn('Error fetching viewed/recommended products from API, using mock data:', error);
      viewedProducts = getMockViewedProducts(productId, limit);
    }
    
    renderViewedProducts(viewedProducts);
  } catch (error) {
    console.error('Error initializing viewed products:', error);
    // Hide the section if there's an error
    const viewedSection = document.querySelector('.viewed-products');
    if (viewedSection) {
      viewedSection.style.display = 'none';
    }
  }
}

// Default export for the module
export default {
  initViewedProducts
};