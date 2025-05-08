/**
 * Quantity Manager for Shopping Cart
 * Handles the quantity control UI and updates the cart state
 */

import { cartManager } from "../shared/cart-manager.js"

/**
 * Initialize quantity controls for all cart items
 */
export function initQuantityControls() {
  // Find all quantity control containers
  const quantityControls = document.querySelectorAll(".quantity-control")

  if (quantityControls.length === 0) return

  // Setup each quantity control
  quantityControls.forEach((control) => {
    const decreaseBtn = control.querySelector(".quantity-decrease")
    const increaseBtn = control.querySelector(".quantity-increase")
    const quantityDisplay = control.querySelector(".quantity-value")
    const itemId = control.getAttribute("data-id")

    if (!decreaseBtn || !increaseBtn || !quantityDisplay || !itemId) return

    // Setup decrease button
    decreaseBtn.addEventListener("click", () => {
      updateQuantity(itemId, -1, quantityDisplay)
    })

    // Setup increase button
    increaseBtn.addEventListener("click", () => {
      updateQuantity(itemId, 1, quantityDisplay)
    })
  })
}

/**
 * Update item quantity in cart
 * @param {string|number} itemId - ID of the item
 * @param {number} change - Change amount (+1 or -1)
 * @param {HTMLElement} display - Element to update with new quantity
 */
function updateQuantity(itemId, change, display) {
  // Convert to number if needed
  const numericId = Number(itemId) || itemId

  // Get current quantity
  const currentQuantity = Number.parseInt(display.textContent)
  let newQuantity = currentQuantity + change

  // Enforce minimum quantity of 1
  if (newQuantity < 1) {
    newQuantity = 1
    return // Don't proceed if trying to go below 1
  }

  // Enforce maximum quantity of 10
  if (newQuantity > 10) {
    newQuantity = 10
    return // Don't proceed if trying to go above 10
  }

  // Update the display
  display.textContent = newQuantity

  // Update cart in cookies
  cartManager.updateItemQuantity(numericId, newQuantity)

  // Update item price display
  updateItemPrice(numericId, newQuantity)

  // Recalculate cart totals
  updateCartTotals()

  // Show visual feedback
  animateQuantityChange(display, change > 0 ? "increase" : "decrease")
}

/**
 * Update displayed price for an item based on quantity
 * @param {string|number} itemId - ID of the item
 * @param {number} quantity - New quantity
 */
function updateItemPrice(itemId, quantity) {
  const itemContainer = document.querySelector(`.item[data-id="${itemId}"]`)
  if (!itemContainer) return

  const priceElement = itemContainer.querySelector(".item-price p")
  if (!priceElement) return

  // Extract unit price from data attribute or calculate it
  let unitPrice = Number.parseFloat(itemContainer.getAttribute("data-unit-price"))
  if (!unitPrice) {
    // If unit price is not stored, try to calculate from current price
    const currentPrice = Number.parseFloat(priceElement.textContent.replace("$", ""))
    const currentQuantity = Number.parseInt(itemContainer.querySelector(".quantity-value").textContent)
    unitPrice = currentPrice / currentQuantity

    // Store for future calculations
    itemContainer.setAttribute("data-unit-price", unitPrice.toFixed(2))
  }

  // Calculate and update total price
  const totalPrice = unitPrice * quantity
  priceElement.textContent = `$${totalPrice.toFixed(2)}`

  // Add a quick highlight effect to the price
  priceElement.classList.add("price-updated")
  setTimeout(() => {
    priceElement.classList.remove("price-updated")
  }, 500)
}

/**
 * Update cart totals when quantities change
 */
function updateCartTotals() {
  let newTotalItems = 0
  let newTotalPrice = 0

  // Get the remaining visible items to calculate new totals
  document.querySelectorAll(".cart .item").forEach((item) => {
    const quantityElement = item.querySelector(".quantity-value")
    const priceText = item.querySelector(".item-price p").textContent

    if (quantityElement && priceText) {
      const quantity = Number.parseInt(quantityElement.textContent) || 1
      const price = Number.parseFloat(priceText.replace("$", "")) || 0

      newTotalItems += quantity
      newTotalPrice += price
    }
  })

  // Call the main script's update function
  if (window.cartScripts && window.cartScripts.updateOrderSummary) {
    window.cartScripts.updateOrderSummary(newTotalItems, newTotalPrice)
  }

  // Update the cart badge
  cartManager.updateCartBadge()

  // Update delivery date estimate
  if (window.cartScripts && window.cartScripts.updateDeliveryDate) {
    window.cartScripts.updateDeliveryDate()
  }
}

/**
 * Add animation effect when quantity changes
 * @param {HTMLElement} element - Element to animate
 * @param {string} action - 'increase' or 'decrease'
 */
function animateQuantityChange(element, action) {
  // Remove any existing animation classes
  element.classList.remove("quantity-increase-animation", "quantity-decrease-animation")

  // Add the appropriate animation class
  element.classList.add(`quantity-${action}-animation`)

  // Remove the animation class after it completes
  setTimeout(() => {
    element.classList.remove(`quantity-${action}-animation`)
  }, 300)

  // Also animate the price to show it's updating
  const itemContainer = element.closest(".item")
  if (itemContainer) {
    const priceElement = itemContainer.querySelector(".item-price p")
    if (priceElement) {
      priceElement.classList.add("price-updated")
      setTimeout(() => {
        priceElement.classList.remove("price-updated")
      }, 500)
    }
  }
}
