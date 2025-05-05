/**
 * Product fetching functionality for the homepage
 */

import { apiClient } from '../core/api/index.js';
import { makeProductCardClickable } from './product-navigation.js';
import { createCartButton, initCartBadge } from './cart-utils.js';

const API_BASE_URL = 'http://localhost:8000';

/**
 * Calculate discount percentage
 * @param {number} currentPrice - Current price
 * @param {number} originalPrice - Original price
 * @returns {number} - Discount percentage
 */
function calculateDiscount(currentPrice, originalPrice) {
    if (!originalPrice || originalPrice <= currentPrice) return 0;
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

/**
 * Create a product card element
 * @param {Object} product - Product data
 * @returns {HTMLElement} - Product card element
 */
function createProductCard(product) {
    const discount = calculateDiscount(product.price, product.original_price);
    
    // Create product card container
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    
    // Only show discount badge if there's a discount
    if (discount > 0) {
        const discountBadge = document.createElement('span');
        discountBadge.className = 'discount-badge';
        discountBadge.textContent = `-${discount}%`;
        productCard.appendChild(discountBadge);
    }
    
    // Create product image container
    const productImage = document.createElement('div');
    productImage.className = 'product-image';
    
    // Create image element with placeholder or actual image
    const img = document.createElement('img');
    img.src = product.image_url || './public/resources/images/bedroom.jpg';
    img.alt = product.name;
    img.addEventListener('error', () => {
        // Fallback if image fails to load
        img.src = './public/resources/images/bedroom.jpg';
    });
    
    productImage.appendChild(img);
    productCard.appendChild(productImage);
    
    // Create product details container
    const productDetails = document.createElement('div');
    productDetails.className = 'product-details';
    
    // Create product info container
    const productInfo = document.createElement('div');
    productInfo.className = 'product-info';
    
    // Create product title
    const productTitle = document.createElement('h3');
    productTitle.className = 'product-title';
    productTitle.textContent = product.name;
    productInfo.appendChild(productTitle);
    
    // Create product price container
    const productPrice = document.createElement('div');
    productPrice.className = 'product-price';
    
    // Create current price
    const currentPrice = document.createElement('span');
    currentPrice.className = 'current-price';
    currentPrice.textContent = `$${product.price.toFixed(2)}`;
    productPrice.appendChild(currentPrice);
    
    // Add original price if there's a discount
    if (discount > 0) {
        const originalPrice = document.createElement('span');
        originalPrice.className = 'original-price';
        originalPrice.textContent = `$${product.original_price.toFixed(2)}`;
        productPrice.appendChild(originalPrice);
    }
    
    productInfo.appendChild(productPrice);
    productDetails.appendChild(productInfo);
    
    // Create and add cart button using the utility function
    const cartButton = createCartButton(product.item_id);
    productDetails.appendChild(cartButton);
    
    productCard.appendChild(productDetails);
    
    // Make the product card clickable using the navigation utility
    makeProductCardClickable(productCard, product.item_id);
    
    return productCard;
}

/**
 * Fetch featured products from the API
 * @returns {Promise<Array>} - Array of product objects
 */
async function fetchFeaturedProducts() {
    try {
        // Explicitly limit to 4 items as required
        const limit = 4;
        const response = await fetch(`${API_BASE_URL}/api/v0/items/featured?limit=${limit}`);
        const data = await response.json();
        return data || [];
    } catch (error) {
        console.error('Error fetching featured products:', error);
        return [];
    }
}

/**
 * Fetch popular products from the API
 * @returns {Promise<Array>} - Array of product objects
 */
async function fetchPopularProducts() {
    try {
        // Explicitly limit to 8 items as required
        const limit = 8;
        // Using the recent endpoint as a substitute for popular products
        const response = await fetch(`${API_BASE_URL}/api/v0/items/recent?limit=${limit}`);
        const data = await response.json();
        return data || [];
    } catch (error) {
        console.error('Error fetching popular products:', error);
        return [];
    }
}

/**
 * Render featured products in the featured products section
 */
async function renderFeaturedProducts() {
    const featuredProductsContainer = document.querySelector('.featured-products-section .products-grid');
    if (!featuredProductsContainer) return;
    
    // Show loading state
    featuredProductsContainer.innerHTML = '<p>Loading featured products...</p>';
    
    // Fetch products - limited to 4 as specified
    const products = await fetchFeaturedProducts();
    
    // Clear container
    featuredProductsContainer.innerHTML = '';
    
    if (products.length === 0) {
        featuredProductsContainer.innerHTML = '<p>No featured products available at the moment.</p>';
        return;
    }
    
    // Render products
    products.forEach(product => {
        featuredProductsContainer.appendChild(createProductCard(product));
    });
}

/**
 * Render popular products in the popular products section
 */
async function renderPopularProducts() {
    const popularProductsContainer = document.querySelector('.popular-products-section .products-grid');
    if (!popularProductsContainer) return;
    
    // Show loading state
    popularProductsContainer.innerHTML = '<p>Loading popular products...</p>';
    
    // Fetch products - limited to 8 as specified
    const products = await fetchPopularProducts();
    
    // Debug - log the number of products received
    console.log(`Popular products received: ${products.length}`);
    
    // Clear container
    popularProductsContainer.innerHTML = '';
    
    if (products.length === 0) {
        popularProductsContainer.innerHTML = '<p>No popular products available at the moment.</p>';
        return;
    }
    
    // Render products
    products.forEach(product => {
        popularProductsContainer.appendChild(createProductCard(product));
    });
}

/**
 * Initialize the product sections with API data
 */
function initProductSections() {
    // Init cart badge from the cart-utils module
    initCartBadge();
    
    // Render products
    renderFeaturedProducts();
    renderPopularProducts();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initProductSections);

export { fetchFeaturedProducts, fetchPopularProducts };