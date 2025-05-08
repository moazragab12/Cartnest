// Cart page functionality
// Now using the shared cart manager for consistent cart operations
import { cartManager } from "../shared/cart-manager.js";

document.addEventListener("DOMContentLoaded", function () {
  loadCart();

  // Using event delegation instead of direct binding
  document.addEventListener("click", function (e) {
    // Handle Remove All button click with event delegation
    if (
      e.target &&
      (e.target.classList.contains("remove-all") ||
        (e.target.parentElement &&
          e.target.parentElement.classList.contains("remove-all")))
    ) {
      console.log("Remove All button clicked via delegation");
      removeAllHandler();
    }

    // Handle Back button click with event delegation
    if (
      e.target &&
      (e.target.classList.contains("back") ||
        (e.target.parentElement &&
          e.target.parentElement.classList.contains("back")))
    ) {
      navigateToShop();
    }
  });

  setupCouponButton();

  // Log cart data for debugging
  console.log("Cart data on load:", cartManager.getCart());

  // Listen for cart update events to refresh the UI automatically
  document.addEventListener("cart:updated", () => {
    loadCart();
  });
});

async function loadCart() {
  const cart = cartManager.getCart();
  const cartContainer = document.querySelector(".cart");

  if (!cartContainer) {
    console.error("Cart container not found");
    return;
  }

  // Get existing item container and back-remove div
  const existingItemContainer = cartContainer.querySelector(".item");
  const backRemoveDiv = cartContainer.querySelector(".back-remove");

  // Clear everything except the back-remove div
  cartContainer.innerHTML = "";

  if (cart.length === 0) {
    const emptyMessage = document.createElement("div");
    emptyMessage.className = "empty-cart";
    emptyMessage.innerHTML = "<p>Your cart is empty.</p>";
    cartContainer.appendChild(emptyMessage);
    if (backRemoveDiv) {
      cartContainer.appendChild(backRemoveDiv);
    }
    updateOrderSummary(0, 0);
    return;
  }

  console.log("Cart items to load:", cart);
  let totalPrice = 0;
  let totalItems = 0;

  // Process each cart item
  for (const cartItem of cart) {
    try {
      console.log("Fetching details for item ID:", cartItem.id);
      const itemData = await fetchItemDetails(cartItem.id);

      if (!itemData) {
        console.warn(`No data returned for item ID: ${cartItem.id}`);
        continue;
      }

      console.log("Item data received:", itemData);

      const itemQuantity = cartItem.quantity || 1;
      const itemTotal = itemData.price * itemQuantity;
      totalPrice += itemTotal;
      totalItems += itemQuantity;

      // Create item element
      const itemElement = document.createElement("div");
      itemElement.className = "item";

      // Create the select options for quantity
      let quantityOptions = "";
      for (let i = 1; i <= 10; i++) {
        quantityOptions += `<option value="${i}" ${
          itemQuantity === i ? "selected" : ""
        }>${i}</option>`;
      }

      // Fill in the item HTML
      itemElement.innerHTML = `
                <img src="/public/resources/images/${
                  itemData.category
                    ? itemData.category.toLowerCase()
                    : "default"
                }.png" alt="${itemData.name}" />
                <div class="item-details">
                    <p><span><strong>${
                      itemData.name || "Unnamed Product"
                    }</strong></span></p>
                    <p>${
                      itemData.description !== null &&
                      itemData.description !== undefined
                        ? itemData.description
                        : "No description available"
                    }</p>
                    <p>Category: ${itemData.category || "Uncategorized"}</p>
                    <p>Seller ID: ${itemData.seller_user_id || "Unknown"}</p>
                    <div class="actions">
                        <button class="remove" data-id="${
                          itemData.item_id
                        }">Remove</button>
                        <button class="save">Save for later</button>
                    </div>
                </div>
                <div class="item-price">
                    <p>$${(itemData.price || 0).toFixed(2)}</p>
                    <div class="item-quantity">
                        <select class="quantity-select" data-id="${
                          itemData.item_id
                        }">
                            ${quantityOptions}
                        </select>
                    </div>
                </div>
            `;

      // Add event listeners
      const removeButton = itemElement.querySelector(".remove");
      removeButton.addEventListener("click", function () {
        const itemId = this.getAttribute("data-id");

        // Add visual feedback - fade out the item
        itemElement.style.transition = "opacity 0.3s ease-out";
        itemElement.style.opacity = "0";

        // Only remove from DOM after animation completes
        setTimeout(() => {
          // Remove from cart (cookies)
          // Use Number() to convert string IDs to numbers if needed
          cartManager.removeFromCart(Number(itemId) || itemId);

          // Remove the element from the DOM directly
          itemElement.remove();

          // Recalculate totals without a full page reload
          let newTotalItems = 0;
          let newTotalPrice = 0;

          // Get the remaining visible items to calculate new totals
          document.querySelectorAll(".cart .item").forEach((item) => {
            const quantitySelect = item.querySelector(".quantity-select");
            const priceText = item.querySelector(".item-price p").textContent;

            if (quantitySelect && priceText) {
              const quantity = parseInt(quantitySelect.value) || 1;
              const price = parseFloat(priceText.replace("$", "")) || 0;

              newTotalItems += quantity;
              newTotalPrice += price * quantity;
            }
          });

          // If there are no items left, show empty cart message
          if (newTotalItems === 0) {
            const cartContainer = document.querySelector(".cart");
            if (cartContainer) {
              const backRemoveDiv = cartContainer.querySelector(".back-remove");
              cartContainer.innerHTML = "";

              const emptyMessage = document.createElement("div");
              emptyMessage.className = "empty-cart";
              emptyMessage.innerHTML = "<p>Your cart is empty.</p>";
              cartContainer.appendChild(emptyMessage);

              if (backRemoveDiv) {
                cartContainer.appendChild(backRemoveDiv);
              }
            }
          }

          // Update summary with new totals
          updateOrderSummary(newTotalItems, newTotalPrice);

          // Update the cart badge
          cartManager.updateCartBadge();
        }, 300);
      });

      const quantitySelect = itemElement.querySelector(".quantity-select");
      quantitySelect.addEventListener("change", function () {
        const itemId = this.getAttribute("data-id");
        const newQuantity = parseInt(this.value);
        cartManager.updateItemQuantity(itemId, newQuantity);
      });

      cartContainer.appendChild(itemElement);
    } catch (error) {
      console.error(`Error processing cart item ${cartItem.id}:`, error);
    }
  }

  // Add back the back-remove div if it exists
  if (backRemoveDiv) {
    cartContainer.appendChild(backRemoveDiv);
  } else {
    // Create a new back-remove div if it doesn't exist
    const newBackRemoveDiv = document.createElement("div");
    newBackRemoveDiv.className = "back-remove";
    newBackRemoveDiv.innerHTML = `
            <button class="back">
                <i class="fas fa-arrow-left"></i> Back to shop
            </button>
            <button class="remove-all">
                <i class="fas fa-trash-alt"></i> Remove all
            </button>
        `;
    cartContainer.appendChild(newBackRemoveDiv);

    // Set up event listeners for the new buttons
    setupBackButton();
    setupRemoveAllButton();
  }

  updateOrderSummary(totalItems, totalPrice);
  cartManager.updateCartBadge();
}

/**
 * Fetch item details from the API using the specified endpoint
 * @param {number|string} itemId - The ID of the item to fetch
 * @returns {Promise<Object|null>} - The item data or null if not found
 */
async function fetchItemDetails(itemId) {
  try {
    // Use the correct API endpoint for item details with proper base URL
    const apiUrl = `http://localhost:8000/api/v0/search/items/${itemId}`;
    console.log(`Fetching item from API: ${apiUrl}`);

    // Use fetch with mode: 'cors' and proper error handling
    const response = await fetch(apiUrl, {
      method: "GET",
      mode: "cors", // Explicitly request CORS mode
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      // Ensure we're not caching results
      cache: "no-store",
    }).catch((error) => {
      console.error(`Network error for item ${itemId}: ${error.message}`);
      return { ok: false, status: 0, statusText: error.message };
    });

    if (!response.ok) {
      console.error(
        `API error for item ${itemId} (${response.status}): ${response.statusText}`
      );

      // Handle specific error cases
      if (response.status === 500) {
        console.warn(`Server error for item ${itemId} - serving fallback data`);
        return {
          item_id: parseInt(itemId),
          name: `Item ${itemId}`,
          description: "Item details temporarily unavailable",
          category: "default",
          price: 0,
          seller_user_id: 0,
        };
      }

      if (response.status === 0 || response.status === 404) {
        console.warn(
          `Item ${itemId} not found or API unavailable - serving fallback data`
        );
        return getMockItemData(itemId);
      }

      return null;
    }

    try {
      const data = await response.json();
      console.log(`API returned real data for item ${itemId}:`, data);
      return data;
    } catch (parseError) {
      console.error(`Error parsing JSON for item ${itemId}:`, parseError);
      return getMockItemData(itemId);
    }
  } catch (error) {
    console.error(`Error fetching item ${itemId}:`, error);
    return getMockItemData(itemId);
  }
}

/**
 * Generate mock data for testing when API is not available
 */
function getMockItemData(itemId) {
  // Mock data for testing without API
  return {
    item_id: parseInt(itemId),
    name: `Product ${itemId}`,
    description: "This is a sample product description",
    category: "Electronics",
    price: 99.99,
    seller_user_id: 1,
  };
}

function updateOrderSummary(totalItems, totalPrice) {
  const summaryInfo = document.querySelector(".summary-info");

  if (!summaryInfo) return;

  // Calculate values
  const discount = totalPrice > 100 ? 20 : 0; // Example: 20% discount for orders over $100
  const discountAmount = totalPrice * (discount / 100);
  const subtotal = totalPrice;
  const tax = (totalPrice - discountAmount) * 0.1; // 10% tax after discount
  const grandTotal = subtotal - discountAmount + tax;

  summaryInfo.innerHTML = `
        <p>Subtotal: <span>$${subtotal.toFixed(2)}</span></p>
        <p class="discount">Discount: <span>${
          discount > 0 ? "–$" + discountAmount.toFixed(2) : "$0.00"
        }</span></p>
        <p class="tax">Tax: <span>+$${tax.toFixed(2)}</span></p>
        <hr />
        <p class="total">Total: <strong>$${grandTotal.toFixed(2)}</strong></p>
    `;
}

function setupRemoveAllButton() {
  const removeAllButton = document.querySelector(".remove-all");
  console.log("Setting up Remove All button:", removeAllButton); // Debug log

  if (removeAllButton) {
    // Remove any existing listeners to avoid duplicates
    removeAllButton.removeEventListener("click", removeAllHandler);

    // Add the click event listener
    removeAllButton.addEventListener("click", removeAllHandler);
    console.log("Remove All button listener attached successfully");
  } else {
    console.warn("Remove All button not found in the DOM");
  }
}

function removeAllHandler() {
  console.log("Remove All button clicked"); // Debug log

  // Get current cart to check if it's empty
  const cart = cartManager.getCart();
  console.log("Current cart before removal:", cart);

  // Exit if cart is already empty
  if (!cart || cart.length === 0) {
    console.log("Cart is already empty, nothing to remove");
    return;
  }

  // Apply fade out visual effect to all items
  const itemElements = document.querySelectorAll(".cart .item");
  console.log("Items to fade out:", itemElements.length);

  itemElements.forEach((item) => {
    item.style.transition = "opacity 0.3s ease-out";
    item.style.opacity = "0";
  });

  // Clear cart after short animation delay
  setTimeout(() => {
    // Clear the cart cookies directly
    console.log("Clearing cart...");
    cartManager.clearCart();
    console.log("Cart after clearing:", cartManager.getCart());

    // Update UI without page reload
    const cartContainer = document.querySelector(".cart");
    if (cartContainer) {
      // Preserve the back-remove buttons
      const backRemoveDiv = cartContainer.querySelector(".back-remove");

      // Clear the container
      cartContainer.innerHTML = "";

      // Show empty cart message
      const emptyMessage = document.createElement("div");
      emptyMessage.className = "empty-cart";
      emptyMessage.innerHTML = "<p>Your cart is empty.</p>";
      cartContainer.appendChild(emptyMessage);

      // Add back the buttons
      if (backRemoveDiv) {
        cartContainer.appendChild(backRemoveDiv);
      }

      // Update summary with zeros
      updateOrderSummary(0, 0);

      // Update cart badge
      cartManager.updateCartBadge();

      console.log("UI updated after cart cleared");
    }
  }, 300);
}

function setupBackButton() {
  const backButton = document.querySelector(".back");

  if (backButton) {
    backButton.addEventListener("click", function () {
      window.location.href = "../../../index.html"; // Adjust this path as needed
    });
  }
}

function setupCouponButton() {
  const couponButton = document.querySelector(".coupon button");

  if (couponButton) {
    couponButton.addEventListener("click", function () {
      const couponInput = document.querySelector(".coupon input");
      const couponCode = couponInput.value.trim();

      if (couponCode) {
        // Here you would typically validate the coupon with your backend
        if (window.notifications) {
          window.notifications.success(`Coupon "${couponCode}" applied!`);
        }

        // Reload cart to update totals
        loadCart();
      } else {
        if (window.notifications) {
          window.notifications.warning("Please enter a coupon code.");
        }
      }
    });
  }
}

// Navigation function for the back button
function navigateToShop() {
  console.log("Back button clicked - navigating to shop");
  window.location.href = "../productsList/productList.html";
}
