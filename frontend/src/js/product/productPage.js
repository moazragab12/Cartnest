/**
 * productPage.js
 * Main controller for the product page that coordinates loading all product components
 */

import { initRelatedProducts } from './relatedProducts.js';
import { initViewedProducts } from './viewedProducts.js';
import { fetchProductById } from '../core/productApiService.js';

/**
 * Updates the product page with details from the fetched product
 * @param {Object} product - The product data from the API
 */
function updateProductDetails(product) {
  // Update product title
  document.querySelector('.product-title').textContent = product.name;
  
  // Update product description
  document.querySelector('.product-description').textContent = product.description;
  
  // Update product price
  document.querySelector('.product-current-price').textContent = `$${product.price.toFixed(2)}`;
  
  // Update product images if available
  const mainImageElement = document.querySelector('.product-main-image img');
  if (mainImageElement) {
    const imageUrl = product.image_url || 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-o9WGCQlihd4S4ImCBQU3KoujUhB82K.png';
    mainImageElement.src = imageUrl;
    mainImageElement.alt = product.name;
  }
  
  // Update seller information if it exists
  const sellerElement = document.querySelector('.product-seller');
  if (sellerElement && product.seller) {
    sellerElement.textContent = `Seller: ${product.seller.username}`;
    sellerElement.style.display = 'block';
  }
  
  // Update stock information if it exists
  const stockElement = document.querySelector('.product-stock');
  if (stockElement) {
    if (product.quantity > 10) {
      stockElement.textContent = 'In Stock';
      stockElement.classList.add('in-stock');
      stockElement.classList.remove('low-stock', 'out-of-stock');
    } else if (product.quantity > 0) {
      stockElement.textContent = `Only ${product.quantity} left in stock!`;
      stockElement.classList.add('low-stock');
      stockElement.classList.remove('in-stock', 'out-of-stock');
    } else {
      stockElement.textContent = 'Out of Stock';
      stockElement.classList.add('out-of-stock');
      stockElement.classList.remove('in-stock', 'low-stock');
    }
  }
  
  // Update category if it exists
  const categoryElement = document.querySelector('.product-category');
  if (categoryElement && product.category) {
    categoryElement.textContent = product.category;
    categoryElement.style.display = 'inline-block';
  }
  
  // Update listed date if it exists
  const listedDateElement = document.querySelector('.product-listed-date');
  if (listedDateElement && product.listed_at) {
    const listedDate = new Date(product.listed_at);
    listedDateElement.textContent = listedDate.toLocaleDateString();
  }
}

/**
 * Extracts the product ID from the URL
 * @returns {string} The product ID from the URL
 */
function getProductIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  
  if (!productId) {
    throw new Error('No product ID provided in the URL');
  }
  
  return productId;
}

/**
 * Sets up event listeners for the product page
 * @param {Object} product - The product data from the API
 */
function setupEventListeners(product) {
  // Add to cart button
  const addToCartButton = document.querySelector('.add-to-cart-button');
  if (addToCartButton) {
    addToCartButton.addEventListener('click', function(e) {
      e.preventDefault();
      const productId = this.dataset.productId;
      const quantityInput = document.querySelector('#product-quantity');
      const quantity = quantityInput ? parseInt(quantityInput.value, 10) : 1;
      
      // Check if quantity is valid
      if (quantity > product.quantity) {
        // Show error notification
        const notification = document.getElementById('notification');
        if (notification) {
          notification.textContent = `Sorry, only ${product.quantity} items available.`;
          notification.classList.add('show', 'error');
          
          setTimeout(() => {
            notification.classList.remove('show', 'error');
          }, 3000);
        }
        return;
      }
      
      addToCart(productId, quantity);
    });
  }
  
  // Quantity input
  const quantityInput = document.querySelector('#product-quantity');
  const decreaseQuantityBtn = document.querySelector('.decrease-quantity');
  const increaseQuantityBtn = document.querySelector('.increase-quantity');
  
  if (quantityInput && decreaseQuantityBtn && increaseQuantityBtn) {
    // Set max attribute based on available quantity
    if (product.quantity) {
      quantityInput.setAttribute('max', product.quantity);
    }
    
    decreaseQuantityBtn.addEventListener('click', function() {
      const currentValue = parseInt(quantityInput.value, 10);
      if (currentValue > 1) {
        quantityInput.value = currentValue - 1;
      }
    });
    
    increaseQuantityBtn.addEventListener('click', function() {
      const currentValue = parseInt(quantityInput.value, 10);
      const maxQuantity = product.quantity || Infinity;
      
      if (currentValue < maxQuantity) {
        quantityInput.value = currentValue + 1;
      } else {
        // Show warning about max quantity
        const notification = document.getElementById('notification');
        if (notification) {
          notification.textContent = `Maximum available quantity is ${maxQuantity}.`;
          notification.classList.add('show', 'warning');
          
          setTimeout(() => {
            notification.classList.remove('show', 'warning');
          }, 3000);
        }
      }
    });
    
    quantityInput.addEventListener('change', function() {
      const maxQuantity = product.quantity || Infinity;
      
      if (this.value < 1) {
        this.value = 1;
      } else if (this.value > maxQuantity) {
        this.value = maxQuantity;
        
        // Show warning about max quantity
        const notification = document.getElementById('notification');
        if (notification) {
          notification.textContent = `Maximum available quantity is ${maxQuantity}.`;
          notification.classList.add('show', 'warning');
          
          setTimeout(() => {
            notification.classList.remove('show', 'warning');
          }, 3000);
        }
      }
    });
  }
}

/**
 * Adds a product to the cart
 * @param {string} productId - The product ID to add to cart
 * @param {number} quantity - The quantity to add
 */
function addToCart(productId, quantity = 1) {
  // This would integrate with your cart functionality
  console.log(`Adding product ${productId} to cart, quantity: ${quantity}`);
  
  // Show notification
  const notification = document.getElementById('notification');
  if (notification) {
    notification.textContent = `${quantity} item${quantity > 1 ? 's' : ''} added to cart!`;
    notification.classList.add('show');
    
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }
}

/**
 * Initializes the product page
 */
async function initProductPage() {
  try {
    // Get the product ID from the URL
    const productId = getProductIdFromUrl();
    
    // Fetch product details from API
    const product = await fetchProductById(productId);
    
    // Update the page with product details
    updateProductDetails(product);
    
    // Set product ID on add to cart button
    const addToCartButton = document.querySelector('.add-to-cart-button');
    if (addToCartButton) {
      addToCartButton.dataset.productId = product.item_id;
    }
    
    // Setup event listeners
    setupEventListeners(product);
    
    // Initialize related products section using the product's category
    await initRelatedProducts(product.item_id, product.category);
    
    // Initialize featured products section (shown in place of viewed products)
    await initViewedProducts(product.item_id);
    
  } catch (error) {
    console.error('Error initializing product page:', error);
    
    // Handle error (could redirect to a 404 page or show an error message)
    document.querySelector('main').innerHTML = `
      <div class="error-container">
        <h2>Product Not Found</h2>
        <p>Sorry, we couldn't find the product you're looking for.</p>
        <a href="/index.html" class="btn btn-primary">Back to Home</a>
      </div>
    `;
  }
}

// Initialize the product page when the DOM content is loaded
document.addEventListener('DOMContentLoaded', initProductPage);

// Export for testing or external use
export default {
  initProductPage,
  getProductIdFromUrl,
  updateProductDetails
};