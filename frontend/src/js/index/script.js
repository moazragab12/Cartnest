let cartQuantity = 0;
let cartItems = [];

function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = "expires=" + d.toUTCString();
  document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name) {
  const cname = name + "=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(cname) === 0) {
      return c.substring(cname.length, c.length);
    }
  }
  return "";
}

function checkCookie() {
  let cart = getCookie("cart");
  if (cart) {
    cartItems = JSON.parse(cart);
    cartQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  } else {
    cartItems = [];
    cartQuantity = 0;
  }
  updateCartBadge();
}

function getCart() {
  let cart = getCookie("cart");
  if (cart) {
    return JSON.parse(cart);
  } else {
    return [];
  }
}

// Add or update items in the cart
function addToCart(product) {
  let cart = getCart();
  const existing = cart.find(
    (p) => p.name === product.name && p.image === product.image
  );

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push(product);
  }

  setCookie("cart", JSON.stringify(cart), 7);

  // Sync global variables after updating
  cartItems = cart;
  cartQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  // Update the cart badge immediately after adding
  updateCartBadge();
}

function updateCartBadge() {
  const badge = document.getElementById("cart-badge");
  if (badge) {
    badge.innerText = cartQuantity;
  }
}

// Remove only one specific item from the cart
function removeFromCart(name) {
  const itemToRemove = cartItems.find((item) => item.name === name);

  if (itemToRemove) {
    if (itemToRemove.quantity > 1) {
      itemToRemove.quantity -= 1;
    } else {
      cartItems = cartItems.filter((item) => item.name !== name);
    }
  }

  // Update cookie and globals
  setCookie("cart", JSON.stringify(cartItems), 7);
  cartQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  updateCartBadge(); // Recalculate badge
  updateCartSection();
}

// Update the cart section to display the items and their quantities
function updateCartSection() {
  const cartItemsContainer = document.getElementById("cart-items");
  const cartSummary = document.getElementById("cart-summary");

  if (!cartItemsContainer || !cartSummary) return; // Only run on cart page

  // Reset the cart display
  cartItemsContainer.innerHTML = "";
  cartSummary.innerHTML = "";

  let totalPrice = 0;
  let totalItems = 0; // Count total quantities

  // Create cart item cards
  cartItems.forEach((item) => {
      totalPrice += item.price * item.quantity; 
      totalItems += item.quantity; // Sum quantities

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
  // Get all FAQ question elements
  const faqQuestions = document.querySelectorAll(".faq-question");

  // Add click event listener to each question
  faqQuestions.forEach((question) => {
    question.addEventListener("click", function() {
      // Get the parent FAQ item
      const faqItem = this.parentElement;

      // Toggle the active class on the FAQ item
      faqItem.classList.toggle("active");

      // Close other FAQ items (optional - for accordion style)
      const otherFaqItems = document.querySelectorAll(".faq-item");
      otherFaqItems.forEach((item) => {
        if (item !== faqItem) {
          item.classList.remove("active");
        }
      });
    });
  });
}

// Newsletter form submission
function setupNewsletter() {
  const newsletterForm = document.querySelector(".newsletter-form");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", function(e) {
      e.preventDefault();
      const emailInput = this.querySelector('input[type="email"]');
      if (emailInput.value.trim() !== "") {
        alert("Thank you for subscribing to our newsletter!");
        emailInput.value = "";
      }
    });
  }
}

// Enhanced Partners section functionality
function setupPartners() {
  const partnersContainer = document.querySelector(".partners-container");
  if (partnersContainer) {
    // Get original partners
    const originalPartners = Array.from(partnersContainer.children);

    // Clone partners multiple times to ensure smooth infinite scrolling
    // regardless of screen width
    for (let i = 0; i < 3; i++) {
      originalPartners.forEach((partner) => {
        const clone = partner.cloneNode(true);
        partnersContainer.appendChild(clone);
      });
    }

    // Ensure equal width for all partner logos
    const allPartnerLogos = partnersContainer.querySelectorAll(".partner-logo");
    const fixedWidth = 140; // Fixed width for each partner logo

    allPartnerLogos.forEach((logo) => {
      logo.style.width = `${fixedWidth}px`;
    });
  }
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
  
  // Initialize cart sections if on cart page
  updateCartSection();
});