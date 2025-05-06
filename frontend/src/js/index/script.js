// Index page functionality
// Now using the shared cart manager for consistent cart operations
import { cartManager } from '../shared/cart-manager.js';

// Initialize global variables for backwards compatibility
let cartQuantity = 0;
let cartItems = [];

// Update globals from cart manager for backward compatibility
function syncCartGlobals() {
  cartItems = cartManager.getCart();
  cartQuantity = cartManager.getTotalQuantity();
}

// Execute this once at startup to initialize globals
syncCartGlobals();

function setCookie(name, value, days) {
  // Delegate to cart manager - for backward compatibility only
  cartManager.setCookie(name, value, days);
}

function getCookie(name) {
  // Delegate to cart manager - for backward compatibility only
  return cartManager.getCookie(name);
}

function checkCookie() {
  // Simply sync with cart manager
  syncCartGlobals();
  updateCartBadge();
}

function getCart() {
  // Get directly from cart manager
  return cartManager.getCart();
}

// Add or update items in the cart
function addToCart(product) {
  if (!product) return false;
  
  // Use cart manager to add the item
  cartManager.addToCart(product, product.quantity || 1)
    .then(result => {
      // Sync globals after cart update
      syncCartGlobals();
      
      // Show notification if available
      if (window.notifications && result.success) {
        window.notifications.success(`${product.name} added to your cart!`);
      }
    });
  
  return true;
}

function updateCartBadge() {
  // Delegate to cart manager
  cartManager.updateCartBadge();
}

// Remove only one specific item from the cart
function removeFromCart(name) {
  cartManager.removeFromCart(name)
    .then(result => {
      // Sync globals after cart update
      syncCartGlobals();
    });
}

// Update the cart section to display the items and their quantities
function updateCartSection() {
  const cartItemsContainer = document.getElementById("cart-items");
  const cartSummary = document.getElementById("cart-summary");

  if (!cartItemsContainer || !cartSummary) return; // Only run on cart page

  // Sync with cart manager first
  syncCartGlobals();

  // Reset the cart display
  cartItemsContainer.innerHTML = "";
  cartSummary.innerHTML = "";

  let totalPrice = cartManager.getTotalPrice();
  let totalItems = cartManager.getTotalQuantity();

  // Create cart item cards
  cartItems.forEach((item) => {
      const card = document.createElement("div");
      card.className = "container-card";
      card.innerHTML = `
          <div class="cardinfo">
              <p class="name-card">${item.name}</p>
              <p class="price">${item.price} EGP</p>
              <p class="quantity">Quantity: ${item.quantity}</p>
              <button onclick="removeFromCart('${item.name}')" class="delete-btn">-</button>
          </div>
      `;
      cartItemsContainer.appendChild(card);
  });

  // Always show the summary, even if empty cart
  cartSummary.innerHTML = `
      <p><strong>Total Items:</strong> ${totalItems}</p>
      <p><strong>Total Price:</strong> ${totalPrice.toFixed(2)} EGP</p>
  `;
}

// Set up cart button event listeners
function setupCartButtons() {
  document.querySelectorAll(".cart-button").forEach((button) => {
    button.addEventListener("click", function() {
      const card = this.closest(".product-card");
      const title = card.querySelector(".product-title").innerText;
      const image = card.querySelector(".product-image img").src;
      const priceText = card.querySelector(".current-price").innerText; // Updated selector
      const price = parseFloat(priceText.replace(/[^0-9.]/g, "")); // remove $ and parse

      const product = {
        name: title,
        image: image,
        price: price,
        quantity: 1,
      };

      addToCart(product);
    });
  });
}

// FAQ Accordion Functionality
function setupFAQ() {
  const faqItems = document.querySelectorAll(".faq-item");
  
  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question");
    
    question.addEventListener("click", () => {
      // Close all other FAQ items
      faqItems.forEach((otherItem) => {
        if (otherItem !== item && otherItem.classList.contains("active")) {
          otherItem.classList.remove("active");
        }
      });
      
      // Toggle current FAQ item
      item.classList.toggle("active");
    });
  });
}

// Newsletter form submission
function setupNewsletter() {
  const newsletterForm = document.querySelector(".newsletter-form");
  
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", function(e) {
      e.preventDefault();
      const emailInput = this.querySelector("input[type='email']");
      
      if (emailInput && emailInput.value) {
        // Here you would typically submit to an API
        alert(`Thank you for subscribing with ${emailInput.value}!`);
        emailInput.value = "";
      }
    });
  }
}

// Enhanced Partners section functionality
function setupPartners() {
  const partnersContainer = document.querySelector(".partners-container");
  
  if (partnersContainer) {
    // Create duplicate items for infinite scroll effect
    const originalWidth = partnersContainer.scrollWidth;
    const logoItems = partnersContainer.querySelectorAll(".partner-logo");
    
    // Clone items for continuous loop effect
    logoItems.forEach((item) => {
      const clone = item.cloneNode(true);
      partnersContainer.appendChild(clone);
    });
  }
}

// Setup cart event listeners for automatic UI updates
function setupCartEventListeners() {
  document.addEventListener('cart:updated', () => {
    syncCartGlobals();
    updateCartSection();
  });
  
  document.addEventListener('cart:itemAdded', () => {
    syncCartGlobals();
  });
  
  document.addEventListener('cart:itemRemoved', () => {
    syncCartGlobals();
  });
}

// Initialize everything when DOM is fully loaded
document.addEventListener("DOMContentLoaded", function() {
  // Check for existing cart data
  checkCookie();
  
  // Set up event listeners
  setupCartButtons();
  setupFAQ();
  setupNewsletter();
  setupPartners();
  setupCartEventListeners();
  
  // Initialize cart sections if on cart page
  updateCartSection();
});