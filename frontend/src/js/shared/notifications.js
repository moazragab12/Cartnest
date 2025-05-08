/**
 * Enhanced Global Notification System for MarketPlace
 * 
 * This module provides a centralized way to display non-intrusive notifications
 * throughout the application. Now with animated GIFs and improved visual design.
 */

class NotificationSystem {
  constructor() {
    this.container = null;
    this.notificationsQueue = [];
    this.isProcessingQueue = false;
    this.maxVisibleNotifications = 3; // Maximum number of visible notifications
    this.init();
  }

  init() {
    // Create notification container if it doesn't exist
    if (!document.getElementById('global-notifications')) {
      this.container = document.createElement('div');
      this.container.id = 'global-notifications';
      document.body.appendChild(this.container);
    } else {
      this.container = document.getElementById('global-notifications');
    }
  }

  /**
   * Creates and displays a notification
   * 
   * @param {string} message - The notification message
   * @param {string} type - Notification type: 'success', 'error', 'info', 'warning'
   * @param {number} duration - Time in ms before auto-dismissal (0 for persistent)
   * @param {Object} options - Additional options like image URL
   * @returns {HTMLElement} - The notification element
   */
  show(message, type = 'info', duration = 3000, options = {}) {
    // Add to queue if too many notifications are visible
    const visibleNotifications = this.container.children.length;
    if (visibleNotifications >= this.maxVisibleNotifications) {
      this.notificationsQueue.push({ message, type, duration, options });
      return null;
    }

    // Ensure container exists
    if (!this.container) this.init();

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Generate a unique ID for the notification
    const notificationId = `notification-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    notification.id = notificationId;
    
    // Highlight product name if provided
    const formattedMessage = options.productName 
      ? message.replace(options.productName, `<span class="product-name">${options.productName}</span>`)
      : message;
    
    // Create notification content
    notification.innerHTML = `
      <div class="notification-icon">
        ${this.getIconForType(type)}
      </div>
      <div class="notification-content">
        <p>${formattedMessage}</p>
      </div>
      <button class="notification-close" aria-label="Close notification">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <div class="notification-progress"></div>
    `;
    
    // Add close button functionality
    notification.querySelector('.notification-close').addEventListener('click', () => {
      this.dismiss(notification);
    });
    
    // Add to container
    this.container.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Auto-dismiss after duration (if not 0)
    if (duration > 0) {
      // Add progress bar animation
      const progressBar = notification.querySelector('.notification-progress');
      progressBar.style.animationDuration = `${duration}ms`;
      progressBar.classList.add('animate');
      
      setTimeout(() => {
        this.dismiss(notification);
      }, duration);
    }
    
    // Add click handler for the entire notification (except close button)
    notification.addEventListener('click', (event) => {
      if (!event.target.closest('.notification-close')) {
        if (options.onClick) options.onClick();
      }
    });

    return notification;
  }
  
  /**
   * Dismisses a notification with animation
   * 
   * @param {HTMLElement} notification - The notification to dismiss
   */
  dismiss(notification) {
    if (!notification) return;
    
    // Start dismiss animation
    notification.classList.add('dismissing');
    
    // Remove after animation completes
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
        
        // Process next notification from queue if any
        this.processQueue();
      }
    }, 400); // Match this with the CSS transition duration
  }
  
  /**
   * Process the notifications queue
   */
  processQueue() {
    if (this.isProcessingQueue || this.notificationsQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    const visibleNotifications = this.container.children.length;
    
    if (visibleNotifications < this.maxVisibleNotifications) {
      const next = this.notificationsQueue.shift();
      this.show(next.message, next.type, next.duration, next.options);
    }
    
    this.isProcessingQueue = false;
  }
  
  /**
   * Get image or SVG icon based on notification type
   * Now using animated GIFs from resources folder
   * 
   * @param {string} type - Notification type
   * @returns {string} - HTML markup for the icon
   */
  getIconForType(type) {
    // Use absolute paths from root to ensure images work on all pages
    const gifPath = (gifName) => `/frontend/public/resources/gifs/${gifName}.gif`;
    
    switch (type) {
      case 'success':
        return `<img src="${gifPath('Success')}" alt="Success" />`;
      case 'error':
        return `<img src="${gifPath('Error')}" alt="Error" />`;
      case 'warning':
        return `<img src="${gifPath('Warning')}" alt="Warning" />`;
      case 'info':
      default:
        return `<img src="${gifPath('Info')}" alt="Info" />`;
    }
  }
  
  /**
   * Create a notification with product thumbnail
   * 
   * @param {string} message - The message to display
   * @param {string} imageUrl - URL of the product image
   * @param {string} type - Notification type
   * @param {number} duration - Auto-dismiss duration
   * @returns {HTMLElement} - The notification element
   */
  showWithThumbnail(message, imageUrl, type = 'success', duration = 3000) {
    // Create notification
    const notification = this.show(message, type, duration);
    if (!notification) return null; // Queued for later
    
    // Add thumbnail class
    notification.classList.add('notification-with-thumbnail');
    
    // Replace icon with product image if available
    if (imageUrl) {
      const iconContainer = notification.querySelector('.notification-icon');
      iconContainer.innerHTML = `<img src="${imageUrl}" alt="Product" />`;
    }
    
    return notification;
  }
  
  /**
   * Convenience methods for different notification types
   */
  success(message, duration = 3000, options = {}) {
    return this.show(message, 'success', duration, options);
  }
  
  error(message, duration = 3000, options = {}) {
    return this.show(message, 'error', duration, options);
  }
  
  info(message, duration = 3000, options = {}) {
    return this.show(message, 'info', duration, options);
  }
  
  warning(message, duration = 3000, options = {}) {
    return this.show(message, 'warning', duration, options);
  }
  
  /**
   * Show a cart notification with product details
   * 
   * @param {Object} product - The product being added
   * @param {string} message - Custom message (optional)
   * @returns {HTMLElement} - The notification element
   */
  cart(product, message = null) {
    if (!product) return null;
    
    const productName = product.name || 'Product';
    const notificationMessage = message || `${productName} added to your cart!`;
    
    // Create options with product name for highlighting
    const options = {
      productName: productName,
      onClick: () => {
        // Redirect to cart page when notification is clicked
        window.location.href = './src/pages/cart/cart.html';
      }
    };
    
    // Show with thumbnail if image is available, otherwise regular success
    if (product.image_url || product.image) {
      return this.showWithThumbnail(
        notificationMessage,
        product.image_url || product.image,
        'success',
        4000
      );
    } else {
      return this.success(notificationMessage, 4000, options);
    }
  }
  
  /**
   * Clear all notifications
   */
  clearAll() {
    if (!this.container) return;
    
    // Remove all notifications
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
    
    // Clear queue
    this.notificationsQueue = [];
  }
}

// Create a singleton instance
const notifications = new NotificationSystem();

/**
 * Add to cart with notification
 * @param {Object} product - The product being added to cart
 * @param {number} quantity - Quantity being added
 * @returns {boolean} - Success status
 */
function addToCartWithNotification(product, quantity = 1) {
  try {
    // Get current cart from cookies
    let cart = getCartItems();
    
    // Check if product already exists in cart
    const existingItem = cart.find(item => 
      item.id === product.id || 
      (item.name === product.name && item.image === product.image)
    );
    
    if (existingItem) {
      // Update quantity if product already in cart
      existingItem.quantity += quantity;
      
      // Show notification with updated quantity
      notifications.cart(product, `${product.name} quantity updated in your cart!`);
    } else {
      // Add new item to cart
      cart.push({
        ...product,
        quantity: quantity
      });
      
      // Show notification for new item
      notifications.cart(product);
    }
    
    // Save updated cart back to cookies
    saveCartItems(cart);
    
    // Update cart badge if it exists
    updateCartBadge(true);
    
    return true;
  } catch (error) {
    console.error('Error adding item to cart:', error);
    notifications.error('Failed to add item to cart');
    return false;
  }
}

/**
 * Get cart items from cookies
 */
function getCartItems() {
  // Reuse existing cart cookie function if available
  if (typeof getCart === 'function') {
    return getCart();
  }
  
  // Fallback implementation
  const cartCookie = getCookie('cart');
  return cartCookie ? JSON.parse(cartCookie) : [];
}

/**
 * Save cart items to cookies
 */
function saveCartItems(cart) {
  // Use 7 days as default expiration
  setCookie('cart', JSON.stringify(cart), 7);
}

/**
 * Get cookie helper (reused from existing code)
 */
function getCookie(name) {
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

/**
 * Set cookie helper (reused from existing code)
 */
function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = "expires=" + d.toUTCString();
  document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

/**
 * Update cart badge if it exists
 * @param {boolean} animate - Whether to animate the badge
 */
function updateCartBadge(animate = false) {
  const badge = document.getElementById('cart-badge');
  if (badge) {
    const totalItems = getCartItems().reduce((sum, item) => sum + (item.quantity || 1), 0);
    badge.innerText = totalItems;
    
    if (animate && totalItems > 0) {
      badge.classList.add('cart-badge-animate');
      setTimeout(() => {
        badge.classList.remove('cart-badge-animate');
      }, 600);
    }
  }
}

// Export the notification system and cart functions
window.notifications = notifications;
window.addToCartWithNotification = addToCartWithNotification;