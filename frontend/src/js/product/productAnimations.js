/**
 * Product Animations
 * Handles UI interactions and animations for the product page
 */

class ProductAnimations {
  constructor() {
    this.currentImageIndex = 0;
    this.totalImages = 0;
    this.quantity = 1;
    this.selectedColor = "blue";
    this.selectedStorage = "128 GB";
    this.isWishlisted = false;
    this.selectedShippingOption = null; // Added shipping option tracking
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
    
    // Initialize shipping option selection
    this.initShippingOptions();

    // Add fade-in effect when page loads
    document.body.classList.add("fade-in");
  }
  /**
   * Initialize product image gallery with navigation and thumbnails
   */ initImageGallery() {
    // Get gallery elements
    const mainImages = document.querySelectorAll(
      ".main-image .image-container img"
    );
    const thumbnails = document.querySelectorAll(".thumbnail");
    const prevBtn = document.querySelector(".nav-btn.prev");
    const nextBtn = document.querySelector(".nav-btn.next");
    
    // Set total images count
    this.totalImages = mainImages.length;

    // Ensure we have images to work with
    if (this.totalImages === 0) {
      console.warn("No images found in the gallery");
      return;
    }

    console.log(`Gallery initialized with ${this.totalImages} images`);

    // Add click event listeners to thumbnails
    thumbnails.forEach((thumbnail, index) => {
      thumbnail.addEventListener("click", () => {
        console.log(`Thumbnail clicked: ${index}`);
        this.changeImage(index);
      });
    });

    // Add click event listeners to navigation buttons with proper event handling
    if (prevBtn) {
      // Remove existing event listeners by cloning and replacing
      const newPrevBtn = prevBtn.cloneNode(true);
      prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
      
      newPrevBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("Previous button clicked");
        this.changeImage(this.currentImageIndex - 1);
      });
    }

    if (nextBtn) {
      // Remove existing event listeners by cloning and replacing
      const newNextBtn = nextBtn.cloneNode(true);
      nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
      
      newNextBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("Next button clicked");
        this.changeImage(this.currentImageIndex + 1);
      });
    }

    // Enable keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        this.changeImage(this.currentImageIndex - 1);
      } else if (e.key === 'ArrowRight') {
        this.changeImage(this.currentImageIndex + 1);
      }
    });

    // Initialize with first image
    this.changeImage(0);
  }

  /**
   * Change active image in gallery
   * @param {number} index - Index of the new image to display
   */ changeImage(index) {
    // Normalize index with wrap-around
    let newIndex = index;
    if (newIndex < 0) newIndex = this.totalImages - 1;
    if (newIndex >= this.totalImages) newIndex = 0;

    console.log(`Changing to image ${newIndex} of ${this.totalImages}`);

    // Get gallery elements
    const mainImages = document.querySelectorAll(
      ".main-image .image-container img"
    );
    const thumbnails = document.querySelectorAll(".thumbnail");

    // Remove active class from all images and thumbnails
    mainImages.forEach((img) => img.classList.remove("active"));
    thumbnails.forEach((thumb) => thumb.classList.remove("active"));

    // Add active class to selected image and thumbnail
    if (mainImages[newIndex]) {
      mainImages[newIndex].classList.add("active");
      console.log("Main image updated");
    } else {
      console.warn("Main image not found at index", newIndex);
    }

    if (thumbnails[newIndex]) {
      thumbnails[newIndex].classList.add("active");
      console.log("Thumbnail updated");

      // Scroll selected thumbnail into view if needed
      const thumbnailGallery = document.querySelector(".thumbnail-gallery");
      if (thumbnailGallery) {
        thumbnails[newIndex].scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    } else {
      console.warn("Thumbnail not found at index", newIndex);
    }

    // Update current index
    this.currentImageIndex = newIndex;

    // Scroll selected thumbnail into view if needed
    if (thumbnails[newIndex]) {
      const thumbnailGallery = document.querySelector(".thumbnail-gallery");
      if (thumbnailGallery) {
        thumbnails[newIndex].scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }

  /**
   * Initialize product tab navigation
   */
  initTabs() {
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    tabButtons.forEach((button, index) => {
      button.addEventListener("click", () => {
        // Remove active class from all buttons
        tabButtons.forEach((btn) => btn.classList.remove("active"));

        // Hide all tab contents
        if (tabContents && tabContents.length > 0) {
          tabContents.forEach((content) => content.classList.remove("active"));

          // Show corresponding tab content
          if (tabContents[index]) {
            tabContents[index].classList.add("active");
          }
        }

        // Add active class to clicked button
        button.classList.add("active");
      });
    });
  }

  /**
   * Initialize quantity selector with plus/minus buttons
   */ initQuantitySelector() {
    const minusBtn = document.querySelector(".qty-btn.minus");
    const plusBtn = document.querySelector(".qty-btn.plus");
    const qtyInput = document.querySelector(".qty-input");

    // Remove existing event listeners by cloning and replacing the buttons
    if (minusBtn) {
      const newMinusBtn = minusBtn.cloneNode(true);
      minusBtn.parentNode.replaceChild(newMinusBtn, minusBtn);

      if (qtyInput) {
        newMinusBtn.addEventListener("click", () => {
          this.updateQuantity(-1, qtyInput);
        });
      }
    }

    if (plusBtn) {
      const newPlusBtn = plusBtn.cloneNode(true);
      plusBtn.parentNode.replaceChild(newPlusBtn, plusBtn);

      if (qtyInput) {
        newPlusBtn.addEventListener("click", () => {
          this.updateQuantity(1, qtyInput);
        });
      }
    }

    if (qtyInput) {
      qtyInput.addEventListener("change", () => {
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
  }  /**
   * Update quantity value with max limit based on product stock
   * @param {number} change - Amount to change quantity by
   * @param {HTMLElement} input - Input element to update
   */
  updateQuantity(change, input) {
    // Get current value directly from the input to avoid state desynchronization
    let currentValue = parseInt(input.value, 10);
    if (isNaN(currentValue)) {
      currentValue = 1;
    }
    
    // Get available stock from the DOM
    const stockText = document.querySelector('.remaining-quantity')?.innerText;
    let availableStock = 100; // Default high number if we can't find the stock
    
    if (stockText) {
      // Parse the stock from text like "Only 12 left in stock"
      const matches = stockText.match(/(\d+)/);
      if (matches && matches[1]) {
        availableStock = parseInt(matches[1], 10);
      }
    }
    
    // Check cart for existing quantity of this product
    const productId = new URLSearchParams(window.location.search).get('id');
    let cartQuantity = 0;
    
    try {
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      const cartItem = cart.find(item => item.id === productId);
      if (cartItem) {
        cartQuantity = cartItem.quantity;
      }
    } catch (e) {
      console.warn('Could not parse cart data', e);
    }
    
    // Calculate max allowed quantity (stock minus what's already in cart)
    const maxAllowed = Math.max(0, availableStock - cartQuantity);
    
    // Apply the change and ensure it's within bounds (min 1, max available)
    const newValue = Math.min(maxAllowed, Math.max(1, currentValue + change));
    
    // Update both the instance value and the input
    this.quantity = newValue;
    input.value = newValue;
    
    // If we hit the max, add a visual indicator
    const plusBtn = document.querySelector('.qty-btn.plus');
    if (plusBtn) {
      if (newValue >= maxAllowed) {
        plusBtn.classList.add('disabled');
        plusBtn.title = 'Maximum available quantity reached';
      } else {
        plusBtn.classList.remove('disabled');
        plusBtn.title = '';
      }
    }
  }

  /**
   * Initialize color selector with color buttons
   */
  initColorSelector() {
    const colorButtons = document.querySelectorAll(".color-btn");
    const colorLabel = document.querySelector(".color-options h3");

    colorButtons.forEach((button) => {
      button.addEventListener("click", () => {
        // Remove selected class from all buttons
        colorButtons.forEach((btn) => btn.classList.remove("selected"));

        // Add selected class to clicked button
        button.classList.add("selected");

        // Get color from button class
        const colorClasses = Array.from(button.classList).filter(
          (cls) => !["color-btn", "selected"].includes(cls)
        );

        if (colorClasses.length > 0) {
          this.selectedColor = colorClasses[0]; // First class other than 'color-btn' and 'selected'

          // Update color label if it exists
          if (colorLabel) {
            colorLabel.textContent = `Color: ${
              this.selectedColor.charAt(0).toUpperCase() +
              this.selectedColor.slice(1)
            }`;
          }
        }
      });
    });
  }

  /**
   * Initialize storage selector with storage buttons
   */
  initStorageSelector() {
    const storageButtons = document.querySelectorAll(".storage-options button");

    storageButtons.forEach((button) => {
      button.addEventListener("click", () => {
        // Remove selected class from all buttons
        storageButtons.forEach((btn) => btn.classList.remove("selected"));

        // Add selected class to clicked button
        button.classList.add("selected");

        // Update selected storage
        this.selectedStorage = button.textContent.trim();
      });
    });
  }
  /**
   * Initialize wishlist button with animation
   */
  initWishlistButton() {
    const wishlistBtn = document.querySelector(".wishlist-btn");
    if (!wishlistBtn) return;

    // Check if product is already in wishlist
    try {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '{}');
      const productId = new URLSearchParams(window.location.search).get('id') || 'default-product';
      this.isWishlisted = !!wishlist[productId];
    } catch (e) {
      console.warn('Could not retrieve wishlist state', e);
      this.isWishlisted = false;
    }

    // Set initial state based on wishlist
    const heartIcon = wishlistBtn.querySelector("i");
    
    if (heartIcon) {
      // Set proper icon based on wishlist state
      if (this.isWishlisted) {
        heartIcon.className = "fas fa-heart";
        wishlistBtn.classList.add("active");
      } else {
        heartIcon.className = "far fa-heart";
        wishlistBtn.classList.remove("active");
      }
    }

    // Add click event listener
    wishlistBtn.addEventListener("click", () => {
      this.toggleWishlistAnimation(wishlistBtn);
    });
  }  /**
   * Toggle wishlist animation for visual feedback only
   * @param {HTMLElement} button - Wishlist button element
   */
  toggleWishlistAnimation(button) {
    const heartIcon = button.querySelector("i");
    if (!heartIcon) return;

    // Toggle visual state only
    this.isWishlisted = !this.isWishlisted;

    // Animate the heart icon - with more stable behavior
    if (this.isWishlisted) {
      // Fill heart with solid color - using direct class replacement for stability
      heartIcon.className = "fas fa-heart"; // Complete class replacement
      button.classList.add("active"); // Add active class to button for CSS targeting
      
      // Add small pulse animation
      button.classList.add("pulse");
      setTimeout(() => {
        button.classList.remove("pulse");
      }, 700);
      
      // Show notification
      this.showNotification("Added to your wishlist!");
    } else {
      // Unfill heart animation
      heartIcon.className = "far fa-heart"; // Complete class replacement
      button.classList.remove("active"); // Remove active class
      
      // Show notification
      this.showNotification("Removed from your wishlist");
    }

    // Store state in localStorage for persistence
    try {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '{}');
      const productId = new URLSearchParams(window.location.search).get('id') || 'default-product';
      
      if (this.isWishlisted) {
        wishlist[productId] = true;
      } else {
        delete wishlist[productId];
      }
      
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.warn('Could not save wishlist state', e);
    }
  }

  /**
   * Show notification message
   * @param {string} message - The message to display
   */
  showNotification(message) {
    const notification = document.getElementById("notification");
    if (!notification) return;

    notification.textContent = message;
    notification.className = "notification success";
    notification.style.display = "block";

    // Hide after 3 seconds
    setTimeout(() => {
      notification.style.display = "none";
    }, 3000);
  }
  /**
   * Initialize shipping option selection with animation
   */
  initShippingOptions() {
    const shippingOptions = document.querySelectorAll('.shipping-option');
    const radioInputs = document.querySelectorAll('.shipping-radio');
    const shippingContainer = document.querySelector('.shipping-options');
    
    // Create the selection indicator once
    if (shippingContainer && !shippingContainer.querySelector('.shipping-selection-indicator')) {
      const indicator = document.createElement('div');
      indicator.className = 'shipping-selection-indicator';
      shippingContainer.appendChild(indicator);
    }
    
    // Add event listeners to each shipping option
    shippingOptions.forEach((option, index) => {
      option.addEventListener('click', (e) => {
        // Prevent firing this event multiple times
        if (option.classList.contains('selected')) return;
        
        // Find the radio input and check it
        const radioInput = option.querySelector('input[type="radio"]');
        if (radioInput) {
          radioInput.checked = true;
          
          // Trigger a change event to ensure any listeners are notified
          const changeEvent = new Event('change', { bubbles: true });
          radioInput.dispatchEvent(changeEvent);
        }
        
        // Remove selected class from all options
        shippingOptions.forEach(opt => opt.classList.remove('selected'));
        
        // Add selected class to clicked option
        option.classList.add('selected');
        
        // Store selected option index
        this.selectedShippingOption = index;
        
        // Show temporary notification with a more descriptive message
        const shippingMethod = option.querySelector('.option-details p').textContent.trim();
        const shippingPrice = option.querySelector('.option-price p').textContent.trim();
        this.showNotification(`Shipping updated: ${shippingMethod} (${shippingPrice})`);
        
        // Animate the selection with enhanced smooth slide
        this.animateShippingSelection(option);
      });
    });
    
    // Handle radio button changes directly with improved synchronization
    radioInputs.forEach((radio, index) => {
      radio.addEventListener('change', () => {
        if (radio.checked) {
          // Remove selected class from all options
          shippingOptions.forEach(opt => opt.classList.remove('selected'));
          
          // Add selected class to parent option
          const option = radio.closest('.shipping-option');
          if (option) {
            option.classList.add('selected');
            
            // Store selected option index
            this.selectedShippingOption = index;
            
            // Animate the selection with a smooth slide
            this.animateShippingSelection(option);
          }
        }
      });
    });
      
    // Select first option by default if available
    if (shippingOptions.length > 0) {
      // Set the first radio as checked
      const firstRadio = shippingOptions[0].querySelector('input[type="radio"]');
      if (firstRadio) {
        firstRadio.checked = true;
      }
      
      // Add selected class
      shippingOptions[0].classList.add('selected');
      this.selectedShippingOption = 0;
      
      // Initialize the indicator on the first option with a slight delay for visual appeal
      setTimeout(() => {
        this.animateShippingSelection(shippingOptions[0]);
      }, 650); // Slightly longer delay for a better visual effect when page loads
    }
  }
  /**
   * Animate shipping selection with a smooth slide effect
   * @param {HTMLElement} selectedOption - The selected shipping option element
   */
  animateShippingSelection(selectedOption) {
    // Get the shipping options container
    const container = selectedOption.parentElement;
    
    // Get or create the indicator
    let indicator = container.querySelector('.shipping-selection-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'shipping-selection-indicator';
      container.appendChild(indicator);
    }
    
    // Add animation class to the selected option for a subtle pulse effect
    selectedOption.classList.add('selected-animate');
    setTimeout(() => {
      selectedOption.classList.remove('selected-animate');
    }, 500);
    
    // Calculate position relative to container - more precise calculation
    const top = selectedOption.offsetTop;
    const height = selectedOption.offsetHeight;
    
    // Make sure any radio button inside is checked (for better sync)
    const radioInput = selectedOption.querySelector('input[type="radio"]');
    if (radioInput && !radioInput.checked) {
      radioInput.checked = true;
    }
    
    // Ensure the radio visual indicator shows correctly
    const radioLabel = selectedOption.querySelector('.shipping-option-radio');
    if (radioLabel) {
      // Force a DOM reflow to ensure CSS transitions work properly
      radioLabel.offsetHeight;
    }
    
    // More sophisticated animation sequence
    // 1. First make the indicator invisible by setting opacity to 0 (while keeping its position)
    indicator.style.opacity = '0';
    
    // 2. After a short delay, move to the new position
    setTimeout(() => {
      indicator.style.top = `${top}px`;
      indicator.style.height = '0';
      
      // 3. Force browser reflow to ensure the new position is applied
      indicator.offsetHeight;
      
      // 4. Make the indicator visible again and animate height
      indicator.style.opacity = '1';
      indicator.style.height = `${height}px`;
      
      // 5. Add a subtle shadow to make the indicator stand out
      indicator.style.boxShadow = '0 0 8px rgba(13, 153, 255, 0.4)';
    }, 50);
  }
}

const productAnimations = new ProductAnimations();

// Initialize when DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("Product Animations initializing...");
  productAnimations.init();
});

export default productAnimations;
