/**
 * Product navigation functionality
 * Handles navigation to product detail pages and manages URLs
 */

/**
 * Navigate to product detail page
 * @param {number|string} productId - The ID of the product to view
 */
export function navigateToProductDetail(productId) {
    if (!productId) {
        console.error('Invalid product ID for navigation');
        return;
    }
    
    // Create the correct URL for the product detail page
    // Using absolute path from frontend root to ensure it works from any page
    const productDetailUrl = `/frontend/src/pages/product/product.html?id=${productId}`;
    
    // Navigate to the product detail page
    window.location.href = productDetailUrl;
}

/**
 * Add event listeners to make product cards clickable
 * @param {HTMLElement} productCard - The product card element
 * @param {number|string} productId - The ID of the product
 */
export function makeProductCardClickable(productCard, productId) {
    if (!productCard || !productId) {
        return;
    }
    
    productCard.addEventListener('click', (event) => {
        // Don't navigate if clicking the cart button
        if (event.target.closest('.cart-button')) {
            return;
        }
        
        // Navigate to product detail page
        navigateToProductDetail(productId);
    });
}