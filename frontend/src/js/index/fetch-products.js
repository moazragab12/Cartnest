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
    
    // Add category badge if category exists
    if (product.category) {
        const categoryBadge = document.createElement('span');
        categoryBadge.className = 'category-badge';
        categoryBadge.textContent = product.category;
        productCard.appendChild(categoryBadge);
    }    // Create product image container
    const productImage = document.createElement('div');
    productImage.className = 'product-image';
    
    // Create image element with a consistently randomized product thumbnail
    // Total number of available product thumbnail images (1 to 27)
    const totalImages = 27;
    
    // Use product ID to get a consistent "random" selection
    // Convert product.item_id to a number and get a value between 1 and totalImages (inclusive)
    const imageNumber = ((Number(product.item_id) || 0) % totalImages) + 1;
    
    const img = document.createElement('img');
    img.src = `./public/resources/images/products/${imageNumber}-thumbnail.jpg`;
    img.alt = product.name;
    img.addEventListener('error', () => {
        // Fallback if image fails to load
        img.src = './public/resources/images/products/smartwatch.jpg';
    });
    
    productImage.appendChild(img);
    productCard.appendChild(productImage);
    
    // Create product content container (new wrapper for better styling)
    const productContent = document.createElement('div');
    productContent.className = 'product-content';
    
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
    
    // Add rating stars if rating exists
    if (product.rating) {
        const productRating = document.createElement('div');
        productRating.className = 'product-rating';
        
        const stars = document.createElement('span');
        stars.className = 'stars';
        stars.textContent = '★'.repeat(Math.floor(product.rating)) + (product.rating % 1 >= 0.5 ? '½' : '');
        productRating.appendChild(stars);
        
        const ratingCount = document.createElement('span');
        ratingCount.className = 'rating-count';
        ratingCount.textContent = `(${product.rating_count || '0'})`;
        productRating.appendChild(ratingCount);
        
        productInfo.appendChild(productRating);
    }
    
    // Add short description if available
    if (product.description) {
        const productDesc = document.createElement('div');
        productDesc.className = 'product-description';
        productDesc.textContent = product.description.substring(0, 60) + (product.description.length > 60 ? '...' : '');
        productInfo.appendChild(productDesc);
    }
    
    productDetails.appendChild(productInfo);
    
    // Create purchase area for price and cart button
    const purchaseArea = document.createElement('div');
    purchaseArea.className = 'purchase-area';
    
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
    
    purchaseArea.appendChild(productPrice);
    
    // Create and add cart button using the utility function
    const cartButton = createCartButton(product.item_id);
    purchaseArea.appendChild(cartButton);
    
    // Add purchase area to product details
    productDetails.appendChild(purchaseArea);
    
    // Add product details to content wrapper
    productContent.appendChild(productDetails);
    
    // Add content wrapper to card
    productCard.appendChild(productContent);
    
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
        // Limit to exactly 3 items for featured products
        const limit = 3;
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
        // Limit to exactly 6 items for popular products
        const limit = 6;
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