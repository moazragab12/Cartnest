/**
 * Main Product Page Script
 * Integrates product data loading and UI animations
 */

import productLoader from './productLoader.js';
import productAnimations from './productAnimations.js';
import { initRelatedProducts } from './relatedProducts.js';
import { initViewedProducts } from './viewedProducts.js';

// Wait for DOM to be loaded
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialize product animations
    productAnimations.init();
    
    // Initialize product loader and fetch data
    const productData = await productLoader.init();
    
    // Update cart badge on page load
    productLoader.updateCartBadge();
    
    // Set up add to cart button
    setupAddToCartButton();
    
    // Set up cart link
    setupCartLink();
    
    // Set up auth link
    setupAuthLink();
    
    // Initialize related products if we have product data
    if (productData) {
      // Initialize related products with current product ID and category
      initRelatedProducts(productData.item_id, productData.category, 3);
      
      // Initialize viewed products
      initViewedProducts(productData.item_id, 3);
    }
  } catch (error) {
    console.error('Error initializing product page:', error);
  }
});

/**
 * Set up Add to Cart button functionality
 */
function setupAddToCartButton() {
  const addToCartBtn = document.querySelector('.add-to-cart-btn');
  if (!addToCartBtn) return;
  
  addToCartBtn.addEventListener('click', () => {
    const qtyInput = document.querySelector('.qty-input');
    const quantity = parseInt(qtyInput?.value || '1', 10);
    
    // Add item to cart using productLoader
    productLoader.addToCart(quantity);
    
    // Add animation effect to button
    addToCartBtn.classList.add('added');
    setTimeout(() => {
      addToCartBtn.classList.remove('added');
    }, 1000);
    
    // Add a fallback notification if window.notifications is not available
    // This ensures consistent behavior with related/viewed products sections
    if (!window.notifications) {
      console.warn('Global notification system not found, using fallback animation only');
    }
  });
}

/**
 * Set up cart link navigation
 */
function setupCartLink() {
  const cartLink = document.querySelector('.cart-link');
  if (cartLink) {
    cartLink.href = '/frontend/src/pages/cart/cart.html';
  }
}

/**
 * Set up authentication link based on login status
 */
function setupAuthLink() {
  const authLink = document.getElementById('auth-link');
  const authText = document.getElementById('auth-text');
  
  if (!authLink || !authText) return;
  
  // Check if user is logged in (token exists)
  const accessToken = localStorage.getItem('accessToken');
  
  if (accessToken) {
    // User is logged in
    authText.textContent = 'My Account';
    authLink.href = '/frontend/src/pages/Dashboard/index.html';
  } else {
    // User is not logged in
    authText.textContent = 'Sign Up/Sign In';
    authLink.href = '/frontend/src/pages/Auth/auth.html';
  }
}
