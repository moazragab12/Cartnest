/**
 * Product Loader
 * Handles fetching and displaying product data from the API
 */

import apiClient from '../core/api/apiClient.js';
import API_ENDPOINTS from '../core/api/endpoints.js';
// Import the cart manager to properly handle cart operations
import { cartManager } from '../shared/cart-manager.js';

class ProductLoader {
  constructor() {
    this.productId = null;
    this.productData = null;
    this.isLoading = false;
  }

  /**
   * Initialize the product loader
   * Extracts the product ID from the URL and loads the product
   * @returns {Object|null} The loaded product data or null if not found
   */
  async init() {
    try {
      // Extract product ID from URL query parameter
      const urlParams = new URLSearchParams(window.location.search);
      this.productId = urlParams.get('id');
      
      if (!this.productId) {
        this.redirectTo404();
        return null;
      }
      
      // Show loading state
      this.showLoading();
      
      // Load product data
      await this.loadProductData();
      
      // Hide loading state
      this.hideLoading();
      
      // If product data is loaded successfully, update the UI
      if (this.productData) {
        this.updateUI();
        return this.productData;
      } else {
        this.redirectTo404();
        return null;
      }
    } catch (error) {
      console.error('Error initializing product page:', error);
      this.hideLoading();
      this.redirectTo404();
      return null;
    }
  }

  /**
   * Show loading state
   */
  showLoading() {
    this.isLoading = true;
    document.body.classList.add('loading');
    // Could add a loading spinner here
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    this.isLoading = false;
    document.body.classList.remove('loading');
  }

  /**
   * Redirect to 404 page
   */
  redirectTo404() {
    window.location.href = '/frontend/src/pages/errors/404.html';
  }

  /**
   * Load product data from API
   */
  async loadProductData() {
    try {
      // Use the search/items/{id} endpoint
      const endpoint = API_ENDPOINTS.search.items.getItem(this.productId);
      
      // Make the API request
      this.productData = await apiClient.get(endpoint);
      console.log('Product data loaded:', this.productData);
      return this.productData;
    } catch (error) {
      console.error(`Error loading product ${this.productId}:`, error);
      return null;
    }
  }

  /**
   * Update the UI with product data
   */
  updateUI() {
    if (!this.productData) return;

    // Update page title
    document.title = `${this.productData.name} - Shopify`;

    // Update product title
    const productTitle = document.querySelector('.product-title');
    if (productTitle) {
      productTitle.textContent = this.productData.name;
    }

    // Update breadcrumb navigation
    const breadcrumb = document.querySelector('.breadcrumb');
    if (breadcrumb && this.productData.category) {
      // Clear existing breadcrumb
      breadcrumb.innerHTML = '';
      
      // Add Home link
      const homeLink = document.createElement('a');
      homeLink.href = '/frontend/index.html';
      homeLink.textContent = 'Home';
      breadcrumb.appendChild(homeLink);
      
      // Add separator
      const separator1 = document.createElement('span');
      separator1.className = 'breadcrumb-separator';
      separator1.innerHTML = ' &rsaquo; ';
      breadcrumb.appendChild(separator1);
      
      // Add category link
      const categoryLink = document.createElement('a');
      categoryLink.href = `/frontend/src/pages/productsList/productList.html?category=${encodeURIComponent(this.productData.category)}`;
      categoryLink.textContent = this.productData.category;
      breadcrumb.appendChild(categoryLink);
      
      // Add separator
      const separator2 = document.createElement('span');
      separator2.className = 'breadcrumb-separator';
      separator2.innerHTML = ' &rsaquo; ';
      breadcrumb.appendChild(separator2);
      
      // Add product name (not a link)
      const productName = document.createElement('span');
      productName.textContent = this.productData.name;
      productName.className = 'breadcrumb-current';
      breadcrumb.appendChild(productName);
    }

    // Update price
    const priceElement = document.querySelector('.price');
    if (priceElement) {
      priceElement.textContent = `$${this.productData.price.toFixed(2)}`;
    }

    // Update availability info
    const remainingQuantity = document.querySelector('.remaining-quantity');
    if (remainingQuantity) {
      remainingQuantity.innerHTML = `<i class="fas fa-box"></i> Only ${this.productData.quantity} left in stock`;
    }

    // Update seller info if available
    if (this.productData.seller) {
      this.updateSellerInfo(this.productData.seller);
    }

    // Update product description
    const descriptionElements = document.querySelectorAll('.highlights ul li');
    if (descriptionElements && descriptionElements.length > 0) {
      // Create description points from the full description
      const descriptionLines = this.getDescriptionPoints(this.productData.description);
      
      // Update each description point
      for (let i = 0; i < Math.min(descriptionElements.length, descriptionLines.length); i++) {
        descriptionElements[i].textContent = descriptionLines[i];
      }
    }
  }

  /**
   * Update the seller information in the UI
   * @param {Object} seller - Seller data
   */
  updateSellerInfo(seller) {
    const sellerNameElement = document.querySelector('.seller-name p');
    const sellerAvatarElement = document.querySelector('.seller-avatar');
    const sellerProfileBtn = document.querySelector('.seller-profile-btn');
    
    if (sellerNameElement) {
      sellerNameElement.textContent = seller.username;
    }
    
    if (sellerAvatarElement) {
      // Get first letter of username for avatar
      sellerAvatarElement.textContent = seller.username.charAt(0).toUpperCase();
    }
    
    if (sellerProfileBtn) {
      sellerProfileBtn.href = `/frontend/src/pages/productsList/productList.html?seller=${seller.user_id}`;
    }
  }

  /**
   * Create description points from the full description
   * @param {string} description - Full product description
   * @returns {Array} - Array of description points
   */
  getDescriptionPoints(description) {
    // Split the description by periods or sentences
    const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Use the sentences as bullet points, or generate some if too few
    const points = [];
    
    for (const sentence of sentences) {
      if (points.length < 6 && sentence.trim().length > 5) {
        points.push(sentence.trim());
      }
    }
    
    // If we don't have enough points, add some generic ones
    const genericPoints = [
      'High-quality materials for long-lasting use.',
      'Modern design that fits any style.',
      'Easy to use and maintain.',
      'Excellent performance and reliability.',
      'Comes with a satisfaction guarantee.',
      'Compatible with all standard accessories.'
    ];
    
    while (points.length < 6) {
      points.push(genericPoints[points.length]);
    }
    
    return points;
  }
  
  /**
   * Handle the add to cart functionality
   * @param {number} quantity - Quantity to add to cart
   */
  addToCart(quantity) {
    if (!this.productData) return;
    
    try {
      // Only record the product ID and quantity as required
      const cartItem = {
        id: this.productData.item_id,
        name: this.productData.name // Used for display in notification, cartManager only saves ID and quantity
      };
      
      // Use the cartManager to add the product to cart
      const result = cartManager.addToCart(cartItem, quantity);
      
      // Update cart badge with animation
      cartManager.updateCartBadge(true);
      
      // Show notification using global notifications
      if (window.notifications) {
        // Highlight product name in notification
        window.notifications.success(`${this.productData.name} added to your cart!`, 5000, {
          productName: this.productData.name
        });
      }
      
      // Dispatch event for other components to react
      document.dispatchEvent(new CustomEvent('cart:updated'));
      return result;
    } catch (error) {
      console.error('Error adding item to cart:', error);
      if (window.notifications) {
        window.notifications.error('Couldn\'t add item to cart. Please try again.');
      }
      return { success: false };
    }
  }
  
  /**
   * Update the cart badge count
   */
  updateCartBadge() {
    // Use cartManager to update the cart badge
    cartManager.updateCartBadge();
  }
}

export default new ProductLoader();