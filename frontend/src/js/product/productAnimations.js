/**
 * Product Animations
 * Handles UI interactions and animations for the product page
 */

class ProductAnimations {
  constructor() {
    this.currentImageIndex = 0;
    this.totalImages = 0;
    this.quantity = 1;
    this.selectedColor = 'blue';
    this.selectedStorage = '128 GB';
    this.isWishlisted = false;
  }

  /**
   * Initialize product animations and event listeners
   */
  init() {
    // Initialize image gallery
    this.initImageGallery();
    
    // Initialize tab navigation
    this.initTabs();
    
    // Initialize quantity selector
    this.initQuantitySelector();
    
    // Initialize color selector
    this.initColorSelector();
    
    // Initialize storage selector
    this.initStorageSelector();
    
    // Initialize wishlist heart button
    this.initWishlistButton();
    
    // Add fade-in effect when page loads
    document.body.classList.add('fade-in');
  }

  /**
   * Initialize product image gallery with navigation and thumbnails
   */
  initImageGallery() {
    // Get gallery elements
    const mainImages = document.querySelectorAll('.main-image .image-container img');
    const thumbnails = document.querySelectorAll('.thumbnail');
    const prevBtn = document.querySelector('.nav-btn.prev');
    const nextBtn = document.querySelector('.nav-btn.next');
    
    // Set total images count
    this.totalImages = mainImages.length;
    
    // Add click event listeners to thumbnails
    thumbnails.forEach((thumbnail, index) => {
      thumbnail.addEventListener('click', () => {
        this.changeImage(index);
      });
    });
    
    // Add click event listeners to navigation buttons
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.changeImage(this.currentImageIndex - 1);
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.changeImage(this.currentImageIndex + 1);
      });
    }
    
    // Initialize with first image
    this.changeImage(0);
  }

  /**
   * Change active image in gallery
   * @param {number} index - Index of the new image to display
   */
  changeImage(index) {
    // Normalize index with wrap-around
    let newIndex = index;
    if (newIndex < 0) newIndex = this.totalImages - 1;
    if (newIndex >= this.totalImages) newIndex = 0;
    
    // Get gallery elements
    const mainImages = document.querySelectorAll('.main-image .image-container img');
    const thumbnails = document.querySelectorAll('.thumbnail');
    
    // Remove active class from all images and thumbnails
    mainImages.forEach(img => img.classList.remove('active'));
    thumbnails.forEach(thumb => thumb.classList.remove('active'));
    
    // Add active class to selected image and thumbnail
    if (mainImages[newIndex]) mainImages[newIndex].classList.add('active');
    if (thumbnails[newIndex]) thumbnails[newIndex].classList.add('active');
    
    // Update current index
    this.currentImageIndex = newIndex;
  }

  /**
   * Initialize product tab navigation
   */
  initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach((button, index) => {
      button.addEventListener('click', () => {
        // Remove active class from all buttons
        tabButtons.forEach(btn => btn.classList.remove('active'));
        
        // Hide all tab contents
        if (tabContents && tabContents.length > 0) {
          tabContents.forEach(content => content.classList.remove('active'));
          
          // Show corresponding tab content
          if (tabContents[index]) {
            tabContents[index].classList.add('active');
          }
        }
        
        // Add active class to clicked button
        button.classList.add('active');
      });
    });
  }

  /**
   * Initialize quantity selector with plus/minus buttons
   */
  initQuantitySelector() {
    const minusBtn = document.querySelector('.qty-btn.minus');
    const plusBtn = document.querySelector('.qty-btn.plus');
    const qtyInput = document.querySelector('.qty-input');
    
    if (minusBtn && qtyInput) {
      minusBtn.addEventListener('click', () => {
        this.updateQuantity(-1, qtyInput);
      });
    }
    
    if (plusBtn && qtyInput) {
      plusBtn.addEventListener('click', () => {
        this.updateQuantity(1, qtyInput);
      });
    }
    
    if (qtyInput) {
      qtyInput.addEventListener('change', () => {
        // Parse input value and set quantity
        const val = parseInt(qtyInput.value, 10);
        if (!isNaN(val)) {
          this.quantity = Math.max(1, val); // Ensure quantity is at least 1
          qtyInput.value = this.quantity;
        } else {
          qtyInput.value = this.quantity; // Reset to previous value if invalid
        }
      });
    }
  }

  /**
   * Update quantity value
   * @param {number} change - Amount to change quantity by
   * @param {HTMLElement} input - Input element to update
   */
  updateQuantity(change, input) {
    this.quantity = Math.max(1, this.quantity + change); // Ensure quantity is at least 1
    input.value = this.quantity;
  }

  /**
   * Initialize color selector with color buttons
   */
  initColorSelector() {
    const colorButtons = document.querySelectorAll('.color-btn');
    const colorLabel = document.querySelector('.color-options h3');
    
    colorButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Remove selected class from all buttons
        colorButtons.forEach(btn => btn.classList.remove('selected'));
        
        // Add selected class to clicked button
        button.classList.add('selected');
        
        // Get color from button class
        const colorClasses = Array.from(button.classList)
          .filter(cls => !['color-btn', 'selected'].includes(cls));
          
        if (colorClasses.length > 0) {
          this.selectedColor = colorClasses[0]; // First class other than 'color-btn' and 'selected'
          
          // Update color label if it exists
          if (colorLabel) {
            colorLabel.textContent = `Color: ${this.selectedColor.charAt(0).toUpperCase() + this.selectedColor.slice(1)}`;
          }
        }
      });
    });
  }

  /**
   * Initialize storage selector with storage buttons
   */
  initStorageSelector() {
    const storageButtons = document.querySelectorAll('.storage-options button');
    
    storageButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Remove selected class from all buttons
        storageButtons.forEach(btn => btn.classList.remove('selected'));
        
        // Add selected class to clicked button
        button.classList.add('selected');
        
        // Update selected storage
        this.selectedStorage = button.textContent.trim();
      });
    });
  }

  /**
   * Initialize wishlist button with animation
   */
  initWishlistButton() {
    const wishlistBtn = document.querySelector('.wishlist-btn');
    if (!wishlistBtn) return;
    
    // Check localStorage for wishlist status of this product
    const productId = new URLSearchParams(window.location.search).get('id');
    const wishlisted = localStorage.getItem(`wishlist_${productId}`) === 'true';
    
    // Set initial state
    this.isWishlisted = wishlisted;
    if (this.isWishlisted) {
      wishlistBtn.querySelector('i').classList.remove('far');
      wishlistBtn.querySelector('i').classList.add('fas', 'wishlisted');
    }
    
    // Add click event listener
    wishlistBtn.addEventListener('click', () => {
      this.toggleWishlistStatus(wishlistBtn, productId);
    });
  }
  
  /**
   * Toggle wishlist status and animate the button
   * @param {HTMLElement} button - Wishlist button element 
   * @param {string} productId - Product ID
   */
  toggleWishlistStatus(button, productId) {
    const heartIcon = button.querySelector('i');
    
    // Toggle wishlist state
    this.isWishlisted = !this.isWishlisted;
    
    // Save to localStorage
    localStorage.setItem(`wishlist_${productId}`, this.isWishlisted);
    
    // Animate the heart icon
    if (this.isWishlisted) {
      // Add to wishlist animation
      heartIcon.classList.remove('far');
      heartIcon.classList.add('fas', 'wishlisted');
      
      // Add pulse animation
      button.classList.add('pulse');
      setTimeout(() => {
        button.classList.remove('pulse');
      }, 700);
    } else {
      // Remove from wishlist animation
      heartIcon.classList.remove('fas', 'wishlisted');
      heartIcon.classList.add('far');
    }
    
    // Show notification
    this.showNotification(
      this.isWishlisted ? 
        'Added to your wishlist!' : 
        'Removed from your wishlist'
    );
  }
  
  /**
   * Show notification message
   * @param {string} message - The message to display
   */
  showNotification(message) {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = 'notification success';
    notification.style.display = 'block';
    
    // Hide after 3 seconds
    setTimeout(() => {
      notification.style.display = 'none';
    }, 3000);
  }
}

export default new ProductAnimations();