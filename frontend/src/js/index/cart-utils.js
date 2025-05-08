/**
 * Cart utilities for the marketplace
 * Uses the shared cart-manager for consistent cart management across all pages
 */

import { cartManager } from '../shared/cart-manager.js';

/**
 * Add item to cart
 * @param {number|string} itemId - Item ID to add to cart
 * @param {number} quantity - Quantity to add (default: 1)
 * @returns {Promise<boolean>} - Success status
 */
export async function addToCart(itemId, quantity = 1) {
    if (!itemId) {
        console.error('Invalid item ID for cart');
        return false;
    }
    
    try {
        // Fetch product details to display in notification
        let productName = 'Product';
        let productImage = null;
        let productPrice = 0;
        
        try {
            const response = await fetch(`http://localhost:8000/api/v0/items/${itemId}`);
            if (response.ok) {
                const productDetails = await response.json();
                productName = productDetails.name || 'Product';
                productImage = productDetails.image_url;
                productPrice = productDetails.price || 0;
            }
        } catch (error) {
            console.error('Error fetching product details for notification', error);
        }
        
        // Create product object for cart manager
        const product = {
            id: itemId,
            name: productName,
            image: productImage,
            price: productPrice,
        };
        
        // Use the shared cart manager to add the item
        const result = await cartManager.addToCart(product, quantity);
        
        // Show appropriate notification
        if (result.success) {
            if (result.isNewItem) {
                if (window.notifications) {
                    // Highlight product name in the notification
                    window.notifications.success(`${productName} added to your cart!`, 5000, {
                        productName: productName
                    });
                }
            } else {
                if (window.notifications) {
                    // Highlight product name in the updated quantity notification
                    window.notifications.success(`${productName} quantity updated in your cart!`, 5000, {
                        productName: productName
                    });
                }
            }
        } else {
            if (window.notifications) {
                window.notifications.error('Could not add item to cart. Please try again.');
            }
        }
        
        return result.success;
    } catch (error) {
        console.error('Error adding item to cart:', error);
        
        // Show error notification if available
        if (window.notifications) {
            window.notifications.error('Could not add item to cart. Please try again.');
        }
        
        return false;
    }
}

/**
 * Update cart badge with current item count
 * @param {boolean} animate - Whether to animate the badge
 */
export function updateCartBadge(animate = false) {
    // Delegate to cart manager
    cartManager.updateCartBadge(animate);
}

/**
 * Initialize cart badge with the count from localStorage
 */
export function initCartBadge() {
    updateCartBadge();
}

/**
 * Create a cart button element
 * @param {number|string} itemId - The ID of the product
 * @returns {HTMLElement} - Cart button element
 */
export function createCartButton(itemId) {
    // Create cart button
    const cartButton = document.createElement('button');
    cartButton.className = 'cart-button';
    cartButton.setAttribute('data-item-id', itemId);
    
    // Create default button state
    const defaultBtn = document.createElement('div');
    defaultBtn.className = 'default-btn';
    defaultBtn.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="#414141" stroke-width="2" fill="none"
                          stroke-linecap="round" stroke-linejoin="round" class="cart-icon">
                          <circle cx="9" cy="21" r="1"></circle>
                          <circle cx="20" cy="21" r="1"></circle>
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                      </svg>`;
    
    // Create hover button state
    const hoverBtn = document.createElement('div');
    hoverBtn.className = 'hover-btn';
    hoverBtn.innerHTML = `<svg viewBox="0 0 320 512" width="12.5" height="20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M160 0c17.7 0 32 14.3 32 32V67.7c1.6 .2 3.1 .4 4.7 .7c.4 .1 .7 .1 1.1 .2l48 8.8c17.4 3.2 28.9 19.9 25.7 37.2s-19.9 28.9-37.2 25.7l-47.5-8.7c-31.3-4.6-58.9-1.5-78.3 6.2s-27.2 18.3-29 28.1c-2 10.7-.5 16.7 1.2 20.4c1.8 3.9 5.5 8.3 12.8 13.2c16.3 10.7 41.3 17.7 73.7 26.3l2.9 .8c28.6 7.6 63.6 16.8 89.6 33.8c14.2 9.3 27.6 21.9 35.9 39.5c8.5 17.9 10.3 37.9 6.4 59.2c-6.9 38-33.1 63.4-65.6 76.7c-13.7 5.6-28.6 9.2-44.4 11V480c0 17.7-14.3 32-32 32s-32-14.3-32-32V445.1c-.4-.1-.9-.1-1.3-.2l-.2 0 0 0c-24.4-3.8-64.5-14.3-91.5-26.3c-16.1-7.2-23.4-26.1-16.2-42.2s26.1-23.4 42.2-16.2c20.9 9.3 55.3 18.5 75.2 21.6c31.9 4.7 58.2 2 76-5.3c16.9-6.9 24.6-16.9 26.8-28.9c1.9-10.6 .4-16.7-1.3-20.4c-1.9-4-5.6-8.4-13-13.3c-16.4-10.7-41.5-17.7-74-26.3l-2.8-.7 0 0C119.4 279.3 84.4 270 58.4 253c-14.2-9.3-27.5-22-35.8-39.6c-8.4-17.9-10.1-37.9-6.1-59.2C23.7 116 52.3 91.2 84.8 78.3c13.3-5.3 27.9-8.9 43.2-11V32c0-17.7 14.3-32 32-32z"
                      fill="#ffffff"></path>
                  </svg>`;
    
    cartButton.appendChild(defaultBtn);
    cartButton.appendChild(hoverBtn);
    
    // Add click event listener to add item to cart
    cartButton.addEventListener('click', async (e) => {
        e.stopPropagation(); // Prevent triggering parent click events
        const success = await addToCart(itemId);
        // Notification is now handled inside addToCart function
    });
    
    return cartButton;
}