/**
 * Centralized Cart Management System for MarketPlace
 * 
 * This module provides a unified way to manage cart operations across all pages of the application.
 * It handles cart storage, retrieval, updates, and UI synchronization.
 * 
 * SECURITY NOTE: For security reasons, we only store product IDs and quantities in client storage.
 * Price and other sensitive product details are always fetched from server when needed.
 */

/**
 * CartManager - Singleton class for cart operations
 */
class CartManager {
  constructor() {
    // Use only a single storage key for cart data
    this.CART_STORAGE_KEY = 'cart';
    this.CART_EXPIRY_DAYS = 14;
    
    // Cache for product details (not persisted)
    this.productCache = new Map();
    
    // Initialize event system for cart changes
    this.events = {
      cartUpdated: new CustomEvent('cart:updated', { 
        bubbles: true,
        detail: { source: 'cart-manager' } 
      }),
      itemAdded: new CustomEvent('cart:itemAdded', { 
        bubbles: true,
        detail: { source: 'cart-manager' } 
      }),
      itemRemoved: new CustomEvent('cart:itemRemoved', { 
        bubbles: true,
        detail: { source: 'cart-manager' } 
      })
    };
    
    // Initialize cart from storage
    this.initializeCart();
  }

  /**
   * Initialize cart from storage
   */
  initializeCart() {
    try {
      // First try to get cart from cookie
      let cart = this.getCartFromCookie();
      
      // If nothing in cookies, try localStorage
      if (!cart || cart.length === 0) {
        const localStorageCart = localStorage.getItem(this.CART_STORAGE_KEY);
        if (localStorageCart) {
          cart = JSON.parse(localStorageCart);
        }
      }
      
      // If we found a cart, store it in both places for consistency
      if (cart && cart.length > 0) {
        // Ensure cart only contains id and quantity
        const secureCart = cart.map(item => ({
          id: item.id || item.name, // Use name as ID if no ID exists
          quantity: item.quantity || 1
        }));
        this.saveCartToStorage(secureCart);
      } else {
        cart = [];
        this.saveCartToStorage(cart);
      }
      
      // Clean up any legacy storage keys
      this.cleanupLegacyStorage();
      
      return cart;
    } catch (error) {
      console.error('Error initializing cart:', error);
      return [];
    }
  }

  /**
   * Get cart from cookie
   * @returns {Array} Cart items array
   */
  getCartFromCookie() {
    try {
      // Only check the single cart key
      let cart = this.getCookie(this.CART_STORAGE_KEY);
      if (cart) {
        return JSON.parse(cart);
      }
      
      return [];
    } catch (error) {
      console.error('Error reading cart from cookie:', error);
      return [];
    }
  }

  /**
   * Save cart to both cookie and localStorage using a single key
   * Only store id and quantity for security
   * @param {Array} cart - Cart items array
   */
  saveCartToStorage(cart) {
    try {
      // Security: Only save ID and quantity
      const secureCart = cart.map(item => ({
        id: item.id || item.name,
        quantity: item.quantity || 1
      }));
      
      // Save to cookie
      this.setCookie(this.CART_STORAGE_KEY, JSON.stringify(secureCart), this.CART_EXPIRY_DAYS);
      
      // Save to localStorage for better persistence
      localStorage.setItem(this.CART_STORAGE_KEY, JSON.stringify(secureCart));
      
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  }

  /**
   * Cleanup legacy storage keys to avoid confusion
   */
  cleanupLegacyStorage() {
    try {
      // Remove old cartItems cookie if exists
      if (this.getCookie('cartItems')) {
        this.setCookie('cartItems', '', -1);
      }
      
      // Remove old cartItems localStorage if exists
      if (localStorage.getItem('cartItems')) {
        localStorage.removeItem('cartItems');
      }
    } catch (error) {
      console.error('Error cleaning up legacy storage:', error);
    }
  }

  /**
   * Get cart items (only IDs and quantities from storage)
   * @returns {Array} Cart items array with just ID and quantity
   */
  getCart() {
    try {
      const cartJson = localStorage.getItem(this.CART_STORAGE_KEY);
      return cartJson ? JSON.parse(cartJson) : [];
    } catch (error) {
      console.error('Error getting cart:', error);
      return [];
    }
  }

  /**
   * Fetch complete cart with product details from the server
   * @returns {Promise<Array>} Promise resolving to cart items with product details
   */
  async getCompleteCart() {
    try {
      const cart = this.getCart();
      const completeCart = [];
      
      // For each item in cart, fetch its details 
      for (const item of cart) {
        const productDetails = await this.getProductDetails(item.id);
        if (productDetails) {
          completeCart.push({
            id: item.id,
            name: productDetails.name || 'Unknown Product',
            price: productDetails.price || 0,
            image: productDetails.image_url || productDetails.image || '',
            quantity: item.quantity || 1
          });
        } else {
          // If we can't get details, include basic info
          completeCart.push({
            id: item.id,
            name: item.id,
            price: 0,
            quantity: item.quantity || 1
          });
        }
      }
      
      return completeCart;
    } catch (error) {
      console.error('Error getting complete cart:', error);
      return [];
    }
  }

  /**
   * Get product details from server or cache
   * @param {string|number} productId - Product ID
   * @returns {Promise<Object|null>} Promise resolving to product details
   */
  async getProductDetails(productId) {
    try {
      // Check cache first
      if (this.productCache.has(productId)) {
        return this.productCache.get(productId);
      }
      
      // Fetch from server
      const response = await fetch(`http://localhost:8000/api/v0/items/${productId}`);
      if (!response.ok) {
        // If specific product endpoint fails, try searching for it
        const searchResponse = await fetch(`http://localhost:8000/api/v0/products/?skip=0&limit=100`);
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          const product = searchData.items?.find(item => 
            item.id === productId || 
            item.name === productId ||
            item.name.toLowerCase() === productId.toString().toLowerCase()
          );
          
          if (product) {
            this.productCache.set(productId, product);
            return product;
          }
        }
        return null;
      }
      
      const product = await response.json();
      
      // Cache the result
      this.productCache.set(productId, product);
      
      return product;
    } catch (error) {
      console.error('Error fetching product details:', error);
      return null;
    }
  }

  /**
   * Get the total number of items in the cart
   * @returns {number} Total quantity
   */
  getTotalQuantity() {
    const cart = this.getCart();
    return cart.reduce((total, item) => total + (item.quantity || 1), 0);
  }

  /**
   * Get the total price of items in the cart
   * @returns {Promise<number>} Promise resolving to total price
   */
  async getTotalPrice() {
    const completeCart = await this.getCompleteCart();
    return completeCart.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 1)), 0);
  }

  /**
   * Add an item to the cart
   * @param {Object} product - Product to add (must have id or name property)
   * @param {number} quantity - Quantity to add
   * @returns {Object} Updated cart information
   */
  async addToCart(product, quantity = 1) {
    if (!product || (!product.id && !product.name)) {
      console.error('Invalid product for cart:', product);
      return { success: false, cart: this.getCart() };
    }
    
    try {
      let cart = this.getCart();
      let productId = product.id || product.name;
      let existingItem = cart.find(item => item.id === productId);
      
      // Cache product details for future use
      this.productCache.set(productId, {
        name: product.name || 'Unknown Product',
        price: product.price || 0,
        image_url: product.image_url || product.image || ''
      });
      
      // Update or add item (only ID and quantity)
      if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 0) + quantity;
      } else {
        cart.push({
          id: productId,
          quantity: quantity
        });
      }
      
      // Save updated cart
      this.saveCartToStorage(cart);
      
      // Dispatch cart updated event
      document.dispatchEvent(this.events.cartUpdated);
      document.dispatchEvent(this.events.itemAdded);
      
      return { 
        success: true, 
        cart: cart,
        isNewItem: !existingItem,
        item: existingItem || cart[cart.length - 1]
      };
    } catch (error) {
      console.error('Error adding to cart:', error);
      return { success: false, cart: this.getCart() };
    }
  }

  /**
   * Remove an item from the cart
   * @param {string|number} itemId - Item ID to remove
   * @returns {Object} Updated cart information
   */
  removeFromCart(itemId) {
    try {
      let cart = this.getCart();
      const initialLength = cart.length;
      
      // Filter out the item to remove
      cart = cart.filter(item => item.id !== itemId);
      
      // Save updated cart
      this.saveCartToStorage(cart);
      
      // Dispatch events
      document.dispatchEvent(this.events.cartUpdated);
      if (cart.length < initialLength) {
        document.dispatchEvent(this.events.itemRemoved);
      }
      
      return { success: true, cart: cart };
    } catch (error) {
      console.error('Error removing from cart:', error);
      return { success: false, cart: this.getCart() };
    }
  }

  /**
   * Update item quantity in the cart
   * @param {string|number} itemId - Item ID
   * @param {number} quantity - New quantity
   * @returns {Object} Updated cart information
   */
  updateItemQuantity(itemId, quantity) {
    try {
      let cart = this.getCart();
      let updatedItem = cart.find(item => item.id === itemId);
      
      // Update quantity or remove if quantity is 0
      if (updatedItem) {
        if (quantity > 0) {
          updatedItem.quantity = quantity;
        } else {
          // If quantity is 0 or negative, remove the item
          return this.removeFromCart(itemId);
        }
      }
      
      // Save updated cart
      this.saveCartToStorage(cart);
      
      // Dispatch events
      document.dispatchEvent(this.events.cartUpdated);
      
      return { 
        success: !!updatedItem, 
        cart: cart,
        item: updatedItem
      };
    } catch (error) {
      console.error('Error updating cart item:', error);
      return { success: false, cart: this.getCart() };
    }
  }

  /**
   * Clear the entire cart
   * @returns {Object} Operation result
   */
  clearCart() {
    try {
      this.saveCartToStorage([]);
      document.dispatchEvent(this.events.cartUpdated);
      return { success: true, cart: [] };
    } catch (error) {
      console.error('Error clearing cart:', error);
      return { success: false };
    }
  }

  /**
   * Update the cart badge UI element
   * @param {boolean} animate - Whether to animate the badge
   */
  updateCartBadge(animate = false) {
    try {
      const cartBadge = document.getElementById('cart-badge');
      if (cartBadge) {
        const totalItems = this.getTotalQuantity();
        
        // Update text content
        cartBadge.textContent = totalItems;
        
        // Show/hide badge based on items count
        if (totalItems > 0) {
          cartBadge.style.display = 'flex';
        } else {
          cartBadge.style.display = 'none';
        }
        
        // Add animation if requested
        if (animate) {
          // Remove existing animation first (in case it's already animating)
          cartBadge.classList.remove('cart-badge-animate');
          
          // Force a browser reflow to ensure animation restarts
          void cartBadge.offsetWidth;
          
          // Apply animation class
          cartBadge.classList.add('cart-badge-animate');
          
          // Remove the class after animation completes
          setTimeout(() => {
            cartBadge.classList.remove('cart-badge-animate');
          }, 800); // Match with the CSS animation duration
        }
      }
    } catch (error) {
      console.error('Error updating cart badge:', error);
    }
  }

  /**
   * Check if an item exists in the cart
   * @param {string|number} itemId - Item ID
   * @returns {boolean} True if item exists in cart
   */
  hasItem(itemId) {
    try {
      const cart = this.getCart();
      return cart.some(item => item.id === itemId);
    } catch (error) {
      console.error('Error checking if item exists in cart:', error);
      return false;
    }
  }

  /**
   * Get an item from the cart (ID and quantity only)
   * @param {string|number} itemId - Item ID
   * @returns {Object|null} Item or null if not found
   */
  getItem(itemId) {
    try {
      const cart = this.getCart();
      return cart.find(item => item.id === itemId) || null;
    } catch (error) {
      console.error('Error getting item from cart:', error);
      return null;
    }
  }

  /**
   * Get complete item details from cart (including price from server)
   * @param {string|number} itemId - Item ID
   * @returns {Promise<Object|null>} Promise resolving to complete item or null
   */
  async getCompleteItem(itemId) {
    try {
      const item = this.getItem(itemId);
      if (!item) return null;
      
      const productDetails = await this.getProductDetails(itemId);
      if (!productDetails) return item;
      
      return {
        ...item,
        name: productDetails.name || 'Unknown Product',
        price: productDetails.price || 0,
        image: productDetails.image_url || productDetails.image || ''
      };
    } catch (error) {
      console.error('Error getting complete item:', error);
      return null;
    }
  }

  /**
   * Cookie utility: Set cookie
   */
  setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
  }

  /**
   * Cookie utility: Get cookie value
   */
  getCookie(name) {
    const cname = name + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(cname) === 0) {
        return c.substring(cname.length, c.length);
      }
    }
    return "";
  }
}

// Create and export a singleton instance
const cartManager = new CartManager();

// Set up event listeners for automatically updating the cart badge
document.addEventListener('DOMContentLoaded', () => {
  // Initial cart badge update
  cartManager.updateCartBadge();
  
  // Update cart badge whenever the cart changes
  document.addEventListener('cart:updated', () => {
    cartManager.updateCartBadge(true);
  });
});

// For backwards compatibility with modules that expect these functions
function addToCart(product, quantity = 1) {
  return cartManager.addToCart(product, quantity);
}

function getCart() {
  return cartManager.getCart();
}

function updateCartBadge(animate = false) {
  return cartManager.updateCartBadge(animate);
}

// Export both the singleton and the backwards compatibility functions
export { cartManager, addToCart, getCart, updateCartBadge };

// Also add to window for non-module scripts
window.cartManager = cartManager;