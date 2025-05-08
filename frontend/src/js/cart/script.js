// Cart page functionality
// Now using the shared cart manager for consistent cart operations
import { cartManager } from "../shared/cart-manager.js"
import { initQuantityControls } from "./quantity-manager.js"
import { initPaymentMethods } from "./payment-methods.js"

// Expose key functions for other modules
window.cartScripts = {
  updateOrderSummary,
  updateDeliveryDate,
}

document.addEventListener("DOMContentLoaded", () => {
  loadCart()
  updateDeliveryDate() // Calculate and display estimated delivery date
  initPaymentMethods() // Initialize payment method popups

  // Using event delegation for buttons
  document.addEventListener("click", (e) => {
    // Handle Remove All button click with event delegation
    if (
      e.target &&
      (e.target.classList.contains("remove-all") ||
        (e.target.parentElement && e.target.parentElement.classList.contains("remove-all")))
    ) {
      console.log("Remove All button clicked via delegation")
      removeAllHandler()
    }

    // Handle Back button click with event delegation
    if (
      e.target &&
      (e.target.classList.contains("back") ||
        (e.target.parentElement && e.target.parentElement.classList.contains("back")))
    ) {
      navigateToShop()
    }
  })

  // Add event delegation for quantity changes
  document.addEventListener("change", (e) => {
    if (e.target && e.target.classList.contains("quantity-select")) {
      const itemId = e.target.getAttribute("data-id")
      const newQuantity = Number.parseInt(e.target.value)

      console.log(`Quantity changed for item ${itemId} to ${newQuantity}`)

      // Convert to number if needed
      const numericId = Number(itemId) || itemId

      // Update quantity in cart cookies
      cartManager.updateItemQuantity(numericId, newQuantity)

      // Update the price display for this item
      const itemElement = e.target.closest(".item")
      if (itemElement) {
        // Get price from item's price text
        const itemPriceElem = itemElement.querySelector(".item-price p")
        const unitPriceMatch = itemPriceElem.textContent.match(/\$(\d+(\.\d+)?)/)

        if (unitPriceMatch) {
          const unitPrice = Number.parseFloat(unitPriceMatch[1])
          const totalPrice = unitPrice * newQuantity
          itemPriceElem.textContent = `$${totalPrice.toFixed(2)}`
        }
      }

      // Recalculate totals without page reload
      updateCartTotals()
    }
  })

  setupCouponButton()

  // Log cart data for debugging
  console.log("Cart data on load:", cartManager.getCart())

  // Listen for cart update events to refresh the UI automatically
  document.addEventListener("cart:updated", () => {
    loadCart()
  })
})

async function loadCart() {
  const cart = cartManager.getCart()
  const cartContainer = document.querySelector(".cart")

  // Update delivery date whenever cart loads
  updateDeliveryDate()

  if (!cartContainer) {
    console.error("Cart container not found")
    return
  }

  // Completely clear the cart container first
  cartContainer.innerHTML = ""

  if (cart.length === 0) {
    const emptyMessage = document.createElement("div")
    emptyMessage.className = "empty-cart"
    emptyMessage.innerHTML = `
  <p>Your cart is empty</p>
  <p>Looks like you haven't added anything to your cart yet.</p>
`
    cartContainer.appendChild(emptyMessage)

    // Add the back-remove buttons for empty cart
    const backRemoveDiv = document.createElement("div")
    backRemoveDiv.className = "back-remove"
    backRemoveDiv.innerHTML = `
      <a href="../productsList/productList.html">
        <button class="back">
          <i class="fas fa-arrow-left"></i> Back to shop
        </button>
      </a>
      <button class="remove-all">
        <i class="fas fa-trash-alt"></i> Remove all
      </button>
    `
    cartContainer.appendChild(backRemoveDiv)

    updateOrderSummary(0, 0)
    return
  }

  console.log("Cart items to load:", cart)
  let totalPrice = 0
  let totalItems = 0

  // Process each cart item
  for (const cartItem of cart) {
    try {
      console.log("Fetching details for item ID:", cartItem.id)
      const itemData = await fetchItemDetails(cartItem.id)

      if (!itemData) {
        console.warn(`No data returned for item ID: ${cartItem.id}`)
        continue
      }

      console.log("Item data received:", itemData)

      const itemQuantity = cartItem.quantity || 1
      const itemTotal = itemData.price * itemQuantity
      totalPrice += itemTotal
      totalItems += itemQuantity

      // Create item element
      const itemElement = document.createElement("div")
      itemElement.className = "item"

      // Create the select options for quantity
      let quantityOptions = ""
      for (let i = 1; i <= 10; i++) {
        quantityOptions += `<option value="${i}" ${itemQuantity === i ? "selected" : ""}>${i}</option>`
      }

      // Fill in the item HTML
      itemElement.innerHTML = `
  <img src="/public/resources/images/${
    itemData.category ? itemData.category.toLowerCase() : "default"
  }.png" alt="${itemData.name}" />
  <div class="item-details">
      <p><span><strong>${itemData.name || "Unnamed Product"}</strong></span></p>
      <p>${
        itemData.description !== null && itemData.description !== undefined
          ? itemData.description
          : "No description available"
      }</p>
      <p>Category: <span>${itemData.category || "Uncategorized"}</span></p>
      <p>Seller ID: <span>${itemData.seller_user_id || "Unknown"}</span></p>
      <div class="actions">
          <button class="remove" data-id="${itemData.item_id}">Remove</button>
          <button class="save">Save for later</button>
      </div>
  </div>
  <div class="item-price">
      <p>$${(itemData.price || 0).toFixed(2)}</p>
      <div class="quantity-control" data-id="${itemData.item_id}">
          <button class="quantity-decrease"><i class="fas fa-minus"></i></button>
          <span class="quantity-value">${itemQuantity}</span>
          <button class="quantity-increase"><i class="fas fa-plus"></i></button>
      </div>
  </div>
`

      // Add event listeners
      const removeButton = itemElement.querySelector(".remove")
      removeButton.addEventListener("click", function () {
        const itemId = this.getAttribute("data-id")

        // Add visual feedback - fade out the item
        itemElement.style.transition = "opacity 0.3s ease-out"
        itemElement.style.opacity = "0"

        // Only remove from DOM after animation completes
        setTimeout(() => {
          // Remove from cart (cookies)
          // Use Number() to convert string IDs to numbers if needed
          cartManager.removeFromCart(Number(itemId) || itemId)

          // Remove the element from the DOM directly
          itemElement.remove()

          // Get current cart after removal
          const updatedCart = cartManager.getCart()

          // If cart is empty after this removal, show empty state
          if (updatedCart.length === 0) {
            // Instead of reloading the cart, manually update the UI for empty cart
            const cartContainer = document.querySelector(".cart")
            if (cartContainer) {
              // Clear container
              cartContainer.innerHTML = ""

              // Add empty message
              const emptyMessage = document.createElement("div")
              emptyMessage.className = "empty-cart"
              emptyMessage.innerHTML = `
  <p>Your cart is empty</p>
  <p>Looks like you haven't added anything to your cart yet.</p>
`
              cartContainer.appendChild(emptyMessage)

              // Add back-remove buttons
              const backRemoveDiv = document.createElement("div")
              backRemoveDiv.className = "back-remove"
              backRemoveDiv.innerHTML = `
                <a href="../productsList/productList.html">
                  <button class="back">
                    <i class="fas fa-arrow-left"></i> Back to shop
                  </button>
                </a>
                <button class="remove-all">
                  <i class="fas fa-trash-alt"></i> Remove all
                </button>
              `
              cartContainer.appendChild(backRemoveDiv)

              // Update summary with zeros
              updateOrderSummary(0, 0)
            }
          } else {
            // Just update totals if items remain
            updateCartTotals()
          }

          // Update the cart badge
          cartManager.updateCartBadge()
        }, 300)
      })

      cartContainer.appendChild(itemElement)
    } catch (error) {
      console.error(`Error processing cart item ${cartItem.id}:`, error)
    }
  }

  // Add back-remove buttons after all items
  const backRemoveDiv = document.createElement("div")
  backRemoveDiv.className = "back-remove"
  backRemoveDiv.innerHTML = `
    <a href="../productsList/productList.html">
      <button class="back">
        <i class="fas fa-arrow-left"></i> Back to shop
      </button>
    </a>
    <button class="remove-all">
      <i class="fas fa-trash-alt"></i> Remove all
      </button>
  `
  cartContainer.appendChild(backRemoveDiv)
  updateOrderSummary(totalItems, totalPrice)
  cartManager.updateCartBadge()

  // Initialize quantity controls after all items are loaded
  initQuantityControls()
}

/**
 * Fetch item details from the API using the specified endpoint
 * @param {number|string} itemId - The ID of the item to fetch
 * @returns {Promise<Object|null>} - The item data or null if not found
 */
async function fetchItemDetails(itemId) {
  try {
    // Use the correct API endpoint for item details with proper base URL
    const apiUrl = `http://localhost:8000/api/v0/search/items/${itemId}`
    console.log(`Fetching item from API: ${apiUrl}`)

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
      console.error(`Network error for item ${itemId}: ${error.message}`)
      return { ok: false, status: 0, statusText: error.message }
    })

    if (!response.ok) {
      console.error(`API error for item ${itemId} (${response.status}): ${response.statusText}`)

      // Handle specific error cases
      if (response.status === 500) {
        console.warn(`Server error for item ${itemId} - serving fallback data`)
        return {
          item_id: Number.parseInt(itemId),
          name: `Item ${itemId}`,
          description: "Item details temporarily unavailable",
          category: "default",
          price: 0,
          seller_user_id: 0,
        }
      }

      if (response.status === 0 || response.status === 404) {
        console.warn(`Item ${itemId} not found or API unavailable - serving fallback data`)
        return getMockItemData(itemId)
      }

      return null
    }

    try {
      const data = await response.json()
      console.log(`API returned real data for item ${itemId}:`, data)
      return data
    } catch (parseError) {
      console.error(`Error parsing JSON for item ${itemId}:`, parseError)
      return getMockItemData(itemId)
    }
  } catch (error) {
    console.error(`Error fetching item ${itemId}:`, error)
    return getMockItemData(itemId)
  }
}

/**
 * Generate mock data for testing when API is not available
 */
function getMockItemData(itemId) {
  // Mock data for testing without API
  return {
    item_id: Number.parseInt(itemId),
    name: `Product ${itemId}`,
    description: "This is a sample product description",
    category: "Electronics",
    price: 99.99,
    seller_user_id: 1,
  }
}

function updateOrderSummary(totalItems, totalPrice) {
  const summaryInfo = document.querySelector(".summary-info")
  const itemsCountElement = document.querySelector(".items-count")

  if (!summaryInfo) return

  // Always set discount and tax to 0 regardless of inputs
  const discount = 0
  const discountAmount = 0
  const subtotal = totalPrice
  const tax = 0
  const grandTotal = subtotal // Total = subtotal (no discount or tax applied)

  // Update the items count display
  if (itemsCountElement) {
    const itemText = totalItems === 1 ? "item" : "items"
    itemsCountElement.innerHTML = `
      <i class="fas fa-shopping-basket"></i> 
      <span>${totalItems} ${itemText} in your cart</span>
    `
  }

  // Update the summary information with enhanced formatting
  summaryInfo.innerHTML = `
        <p><span class="row-label">Subtotal:</span> <span class="amount">$${subtotal.toFixed(2)}</span></p>
        <p class="discount"><span class="row-label">Discount:</span> <span class="amount">$0.00</span></p>
        <p class="tax"><span class="row-label">Tax:</span> <span class="amount">$0.00</span></p>
        <hr />
        <p class="total"><span class="row-label">Total:</span> <span class="amount">$${grandTotal.toFixed(2)}</span></p>
    `
}

function setupRemoveAllButton() {
  const removeAllButton = document.querySelector(".remove-all")
  console.log("Setting up Remove All button:", removeAllButton) // Debug log

  if (removeAllButton) {
    // Remove any existing listeners to avoid duplicates
    removeAllButton.removeEventListener("click", removeAllHandler)

    // Add the click event listener
    removeAllButton.addEventListener("click", removeAllHandler)
    console.log("Remove All button listener attached successfully")
  } else {
    console.warn("Remove All button not found in the DOM")
  }
}

function removeAllHandler() {
  console.log("Remove All button clicked") // Debug log

  // Get current cart to check if it's empty
  const cart = cartManager.getCart()
  console.log("Current cart before removal:", cart)

  // Exit if cart is already empty
  if (!cart || cart.length === 0) {
    console.log("Cart is already empty, nothing to remove")
    return
  }

  // Apply fade out visual effect to all items
  const itemElements = document.querySelectorAll(".cart .item")
  console.log("Items to fade out:", itemElements.length)

  itemElements.forEach((item) => {
    item.style.transition = "opacity 0.3s ease-out"
    item.style.opacity = "0"
  })

  // Clear cart after short animation delay
  setTimeout(() => {
    // Clear the cart cookies directly
    console.log("Clearing cart...")
    cartManager.clearCart()
    console.log("Cart after clearing:", cartManager.getCart())

    // Update UI without page reload
    const cartContainer = document.querySelector(".cart")
    if (cartContainer) {
      // Preserve the back-remove buttons
      const backRemoveDiv = cartContainer.querySelector(".back-remove")

      // Clear the container
      cartContainer.innerHTML = ""

      // Show empty cart message
      const emptyMessage = document.createElement("div")
      emptyMessage.className = "empty-cart"
      emptyMessage.innerHTML = `
  <p>Your cart is empty</p>
  <p>Looks like you haven't added anything to your cart yet.</p>
`
      cartContainer.appendChild(emptyMessage)

      // Add back the buttons
      if (backRemoveDiv) {
        cartContainer.appendChild(backRemoveDiv)
      }

      // Update summary with zeros
      updateOrderSummary(0, 0) // Update cart badge
      cartManager.updateCartBadge()

      // Update delivery date estimate
      updateDeliveryDate()

      console.log("UI updated after cart cleared")
    }
  }, 300)
}

function setupBackButton() {
  const backButton = document.querySelector(".back")

  if (backButton) {
    backButton.addEventListener("click", () => {
      window.location.href = "../../../index.html" // Adjust this path as needed
    })
  }
}

function setupCouponButton() {
  const couponButton = document.querySelector(".coupon button")

  if (couponButton) {
    couponButton.addEventListener("click", () => {
      const couponInput = document.querySelector(".coupon input")
      const couponCode = couponInput.value.trim()

      if (couponCode) {
        // Here you would typically validate the coupon with your backend
        if (window.notifications) {
          window.notifications.success(`Coupon "${couponCode}" applied!`)
        }

        // Reload cart to update totals
        loadCart()
      } else {
        if (window.notifications) {
          window.notifications.warning("Please enter a coupon code.")
        }
      }
    })
  }
}

// Navigation function for the back button
function navigateToShop() {
  console.log("Back button clicked - navigating to shop")
  window.location.href = "../productsList/productList.html"
}

function updateCartTotals() {
  let newTotalItems = 0
  let newTotalPrice = 0

  // Get the remaining visible items to calculate new totals
  document.querySelectorAll(".cart .item").forEach((item) => {
    const quantitySelect = item.querySelector(".quantity-select")
    const priceText = item.querySelector(".item-price p").textContent

    if (quantitySelect && priceText) {
      const quantity = Number.parseInt(quantitySelect.value) || 1
      const price = Number.parseFloat(priceText.replace("$", "")) || 0

      newTotalItems += quantity
      newTotalPrice += price
    }
  })

  // Update summary with new totals
  updateOrderSummary(newTotalItems, newTotalPrice)
  // Update the cart badge
  cartManager.updateCartBadge()

  // Update delivery date estimate
  updateDeliveryDate()
}

/**
 * Calculate and update the estimated delivery date (2-3 days from today)
 */
function updateDeliveryDate() {
  const deliveryDateElement = document.getElementById("delivery-date")
  if (!deliveryDateElement) return

  // Get current date
  const today = new Date()

  // Calculate delivery date range (2-3 days from today)
  const minDeliveryDate = new Date(today)
  minDeliveryDate.setDate(today.getDate() + 2) // 2 days from today

  const maxDeliveryDate = new Date(today)
  maxDeliveryDate.setDate(today.getDate() + 3) // 3 days from today

  // Format dates with month name and day
  const options = { month: "short", day: "numeric" }
  const minDateString = minDeliveryDate.toLocaleDateString("en-US", options)
  const maxDateString = maxDeliveryDate.toLocaleDateString("en-US", options)

  // If both dates are in the same month, simplify the display
  if (minDeliveryDate.getMonth() === maxDeliveryDate.getMonth()) {
    const minDay = minDeliveryDate.getDate()
    const maxDay = maxDeliveryDate.getDate()
    const month = minDateString.split(" ")[0] // Get just the month name

    deliveryDateElement.textContent = `${month} ${minDay}-${maxDay}`
  } else {
    // Different months, show complete dates
    deliveryDateElement.textContent = `${minDateString} - ${maxDateString}`
  }

  // Add current year if dates cross into next year
  if (minDeliveryDate.getFullYear() !== today.getFullYear() || maxDeliveryDate.getFullYear() !== today.getFullYear()) {
    deliveryDateElement.textContent += `, ${maxDeliveryDate.getFullYear()}`
  }
}
