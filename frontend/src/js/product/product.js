/**
 * Product page functionality
 * Now using the shared cart manager for consistent cart operations
 */
import { cartManager } from '../shared/cart-manager.js';

document.addEventListener("DOMContentLoaded", function () {
    const apiUrl = "http://localhost:8000/api/v0/products/?skip=0&category=mobile&sort_by=listed_at&sort_order=desc"; 

    // Grab elements
    const titleEl = document.querySelector(".info h1");
   // const imgEl = document.querySelector(".info img");
    const categoryNameEl = document.querySelector(".category-name");
    const productNameEl = document.querySelector(".product-name");
    const sellerInitialEl = document.querySelector(".seller-initial");
    const sellerNameEl = document.querySelector(".seller-details strong");
    const priceSectionEl = document.querySelector(".price-section");
    const availabilityEl = document.querySelector(".availability");

    // Fetch product data from API
    fetch(apiUrl)
        .then((response) => response.json())
        .then((data) => {
            if (!data.items || data.items.length === 0) {
                // No data: set placeholders 
                titleEl.textContent = "Product Not Found";
              // imgEl.src = "/../../public/resources/images/iphone.png";
                categoryNameEl.textContent = "Unknown Category";
                productNameEl.textContent = "Unknown Product";
                sellerInitialEl.textContent = "?";
                sellerNameEl.textContent = "Unknown Seller";
                priceSectionEl.textContent = "$0.00";
                availabilityEl.textContent = "❌ Not available";
                return;
            }

            const product = data.items[0]; // Get the first product

            titleEl.textContent = product.name || "Unnamed Product";
           //    imgEl.src = "/../../public/resources/images/iphone.png"; // Optional: Use actual image URL if available
            categoryNameEl.textContent = product.category || "Unknown Category";
            productNameEl.textContent = product.name || "Unnamed Product";
            sellerInitialEl.textContent = (product.seller_user_id || "?").toString().charAt(0);
            sellerNameEl.textContent = `Seller ID: ${product.seller_user_id || "Unknown"}`;

            // ✅ Corrected this line
            priceSectionEl.textContent = 
                typeof product.price === 'number' && !isNaN(product.price)
                ? `$${product.price.toFixed(2)}`
                : "$0.00";

            availabilityEl.textContent = 
                product.status === "for_sale"
                ? "✔ Available to order"
                : "❌ Not available";
        })
        .catch((error) => {
            console.error("Error fetching product:", error);
            // Set placeholder in case of error
            titleEl.textContent = "Error loading product";
            imgEl.src = "../../public/resources/images/placeholder.png";
            categoryNameEl.textContent = "Unknown Category";
            productNameEl.textContent = "Unknown Product";
            sellerInitialEl.textContent = "?";
            sellerNameEl.textContent = "Unknown Seller";
            priceSectionEl.textContent = "$0.00";
            availabilityEl.textContent = "❌ Not available";
        });

    // ✅ You can now safely implement Quantity Increment/Decrement below...
  
  // === UI Button Effects ===
  initColorButtons();
  initOptionButtons();
  initQuantityButtons();
  setupCartButtons();
  initProductDetails();
  
  // Listen for cart update events to refresh UI elements
  document.addEventListener('cart:updated', () => {
    cartManager.updateCartBadge();
  });
});

// Color buttons selection
function initColorButtons() {
  document.querySelectorAll(".color-buttons span").forEach((el) => {
    el.addEventListener("click", function() {
      document.querySelectorAll(".color-buttons span").forEach((btn) =>
        btn.classList.remove("selected")
      );
      this.classList.add("selected");
    });
  });
}

// Option buttons selection
function initOptionButtons() {
  document.querySelectorAll(".option-buttons button").forEach((el) => {
    el.addEventListener("click", function() {
      document.querySelectorAll(".option-buttons button").forEach((btn) =>
        btn.classList.remove("active")
      );
      this.classList.add("active");
    });
  });
}

// Quantity buttons
function initQuantityButtons() {
  const decreaseBtn = document.getElementById("decrease-btn");
  const increaseBtn = document.getElementById("increase-btn");
  const quantityInput = document.getElementById("quantity-input");

  if (decreaseBtn && increaseBtn && quantityInput) {
    decreaseBtn.addEventListener("click", function() {
      let current = parseInt(quantityInput.value);
      if (current > 1) quantityInput.value = current - 1;
    });

    increaseBtn.addEventListener("click", function() {
      let current = parseInt(quantityInput.value);
      quantityInput.value = current + 1;
    });
  }
}

// Get the current quantity from the input
function getQuantity() {
  const quantityInput = document.getElementById("quantity-input");
  return parseInt(quantityInput?.value) || 1;
}

// Extract product details from the page
function getProductDetails() {
  // Get product name and current selection
  const productNameEl = document.querySelector(".product-name");
  const productName = productNameEl?.textContent?.trim() || "Unknown Product";
  
  // Get selected option (storage capacity)
  const selectedOption = document.querySelector(".option-buttons button.active");
  const option = selectedOption?.textContent?.trim() || "";
  
  // Get selected color
  const selectedColor = document.querySelector(".color-buttons span.selected");
  let color = "Default";
  if (selectedColor) {
    if (selectedColor.classList.contains("color-pink")) color = "Pink";
    else if (selectedColor.classList.contains("color-red")) color = "Red";
    else if (selectedColor.classList.contains("color-blue")) color = "Blue";
    else if (selectedColor.classList.contains("color-black")) color = "Black";
  }
  
  // Get product image
  const productImage = document.querySelector(".container > div > img");
  const imageSrc = productImage?.src || "";
  
  // Get product price
  const priceSection = document.querySelector(".price-section");
  let price = 0;
  if (priceSection) {
    const priceText = priceSection.textContent;
    price = parseFloat(priceText.replace(/[^0-9.]/g, "")) || 0;
  }
  
  // Create a unique product ID based on selections
  const productId = `${productName}-${option}-${color}`.replace(/\s+/g, '-').toLowerCase();
  
  return {
    id: productId,
    name: `${productName} ${option} ${color}`.trim(),
    image: imageSrc,
    price: price,
    option: option,
    color: color
  };
}

// Initialize product details if needed
function initProductDetails() {
  // You could fetch product details from an API based on URL parameters
  // and populate the page elements
}

// Add the current product to cart
async function addCurrentProductToCart() {
  const product = getProductDetails();
  const quantity = getQuantity();
  
  // Use cart manager to add the product
  const result = await cartManager.addToCart(product, quantity);
  
  // Show notification
  if (result.success) {
    if (window.notifications) {
      if (result.isNewItem) {
        window.notifications.success(`${product.name} added to your cart!`);
      } else {
        window.notifications.success(`${product.name} quantity updated in your cart!`);
      }
    }
  } else {
    if (window.notifications) {
      window.notifications.error('Could not add item to cart. Please try again.');
    } else {
      alert("Could not add item to cart. Please try again.");
    }
  }
  
  return result.success;
}

// Setup cart buttons
function setupCartButtons() {
  // Main "Add to Cart" button
  document.querySelectorAll(".quantity-btn2").forEach((button) => {
    button.addEventListener("click", function() {
      addCurrentProductToCart();
    });
  });
  
  // Cart buttons on product cards
  document.querySelectorAll(".cart-button").forEach((button) => {
    button.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const card = this.closest(".product-card");
      const title = card.querySelector(".product-title").innerText;
      const image = card.querySelector(".product-image img").src;
      const priceText = card.querySelector(".current-price").innerText;
      const price = parseFloat(priceText.replace(/[^0-9.]/g, ""));
      
      const product = {
        name: title,
        image: image,
        price: price,
        quantity: 1,
      };
      
      cartManager.addToCart(product)
        .then(result => {
          if (result.success && window.notifications) {
            window.notifications.success(`${title} added to your cart!`);
          }
        });
    });
  });
}
