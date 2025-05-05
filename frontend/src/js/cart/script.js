// Cart page functionality
// Now using the shared cart manager for consistent cart operations
import { cartManager } from '../shared/cart-manager.js';

document.addEventListener("DOMContentLoaded", function() {
    loadCart();
    setupRemoveAllButton();
    setupBackButton();
    setupCouponButton();
    
    // Listen for cart update events to refresh the UI automatically
    document.addEventListener('cart:updated', () => {
        loadCart();
    });
});

function loadCart() {
    const cart = cartManager.getCart();
    const cartContainer = document.querySelector(".cart");
    
    if (!cartContainer) {
        console.error("Cart container not found");
        return;
    }
    
    // Clear existing items but keep the back-remove div
    const backRemoveDiv = cartContainer.querySelector(".back-remove");
    cartContainer.innerHTML = "";
    
    if (cart.length === 0) {
        const emptyMessage = document.createElement("div");
        emptyMessage.className = "empty-cart";
        emptyMessage.innerHTML = "<p>Your cart is empty.</p>";
        cartContainer.appendChild(emptyMessage);
        cartContainer.appendChild(backRemoveDiv);
        updateOrderSummary(0, 0);
        return;
    }

    let totalPrice = 0;
    let totalItems = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalPrice += itemTotal;
        totalItems += item.quantity;

        const cartItem = document.createElement("div");
        cartItem.classList.add("item");

        // Create the select options for quantity
        let quantityOptions = '';
        for (let i = 1; i <= 10; i++) {
            quantityOptions += `<option value="${i}" ${item.quantity === i ? 'selected' : ''}>${i}</option>`;
        }

        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}" />
            <div class="item-details">
                <p><span><strong>${item.name}</strong></span></p>
                <p>Size: Medium, Color: Blue, Material: Plastic</p>
                <p>Seller: Artel Market</p>
                <div class="actions">
                    <button class="remove" data-name="${item.name}" data-image="${item.image}"${item.id ? ` data-id="${item.id}"` : ''}>Remove</button>
                    <button class="save">Save for later</button>
                </div>
            </div>
            <div class="item-price">
                <p>$${item.price.toFixed(2)}</p>
                <div class="item-quantity">
                    <select class="quantity-select" data-name="${item.name}" data-image="${item.image}"${item.id ? ` data-id="${item.id}"` : ''}>
                        ${quantityOptions}
                    </select>
                </div>
            </div>
        `;

        cartContainer.appendChild(cartItem);
        
        // Add event listener for the remove button
        const removeButton = cartItem.querySelector(".remove");
        removeButton.addEventListener("click", function() {
            const itemId = this.getAttribute("data-id");
            const itemName = this.getAttribute("data-name");
            const itemImage = this.getAttribute("data-image");
            
            // Use cart manager for removal
            if (itemId) {
                cartManager.removeFromCart(itemId);
            } else {
                cartManager.removeFromCart(itemName, itemImage);
            }
            
            // UI is updated via event listener now
        });
        
        // Add event listener for quantity change
        const quantitySelect = cartItem.querySelector(".quantity-select");
        quantitySelect.addEventListener("change", function() {
            const itemId = this.getAttribute("data-id");
            const itemName = this.getAttribute("data-name");
            const itemImage = this.getAttribute("data-image");
            const newQuantity = parseInt(this.value);
            
            // Use cart manager for quantity update
            if (itemId) {
                cartManager.updateItemQuantity(itemId, newQuantity);
            } else {
                cartManager.updateItemQuantity(itemName, newQuantity, itemImage);
            }
            
            // UI is updated via event listener now
        });
    });

    // Add back the back-remove div
    cartContainer.appendChild(backRemoveDiv);
    
    updateOrderSummary(totalItems, totalPrice);
    cartManager.updateCartBadge();
}

function updateOrderSummary(totalItems, totalPrice) {
    const summaryInfo = document.querySelector(".summary-info");
    
    if (!summaryInfo) return;
    
    // Calculate values
    const discount = totalPrice > 100 ? 20 : 0; // Example: 20% discount for orders over $100
    const discountAmount = totalPrice * (discount / 100);
    const subtotal = totalPrice;
    const tax = (totalPrice - discountAmount) * 0.10; // 10% tax after discount
    const grandTotal = subtotal - discountAmount + tax;
    
    summaryInfo.innerHTML = `
        <p>Subtotal: <span>$${subtotal.toFixed(2)}</span></p>
        <p class="discount">Discount: <span>${discount > 0 ? '–$' + discountAmount.toFixed(2) : '$0.00'}</span></p>
        <p class="tax">Tax: <span>+$${tax.toFixed(2)}</span></p>
        <hr />
        <p class="total">Total: <strong>$${grandTotal.toFixed(2)}</strong></p>
    `;
}

function setupRemoveAllButton() {
    const removeAllButton = document.querySelector(".remove-all");
    
    if (removeAllButton) {
        removeAllButton.addEventListener("click", function() {
            if (confirm("Are you sure you want to remove all items from your cart?")) {
                // Use cart manager to clear cart
                cartManager.clearCart();
                // UI will update via event listener
            }
        });
    }
}

function setupBackButton() {
    const backButton = document.querySelector(".back");
    
    if (backButton) {
        backButton.addEventListener("click", function() {
            window.location.href = "../../../index.html"; // Adjust this path as needed
        });
    }
}

function setupCouponButton() {
    const couponButton = document.querySelector(".coupon button");
    
    if (couponButton) {
        couponButton.addEventListener("click", function() {
            const couponInput = document.querySelector(".coupon input");
            const couponCode = couponInput.value.trim();
            
            if (couponCode) {
                // Here you would typically validate the coupon with your backend
                if (window.notifications) {
                    window.notifications.success(`Coupon "${couponCode}" applied!`);
                } else {
                    alert(`Coupon "${couponCode}" applied!`);
                }
                
                // Reload cart to update totals
                loadCart();
            } else {
                if (window.notifications) {
                    window.notifications.warning('Please enter a coupon code.');
                } else {
                    alert("Please enter a coupon code.");
                }
            }
        });
    }
}