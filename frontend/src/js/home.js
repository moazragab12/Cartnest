let cartQuantity = 0;
let cartItems = [];

// Add or update items in the cart
function addToCart(name, price) {
    const existingItem = cartItems.find(item => item.name === name);

    if (existingItem) {
        // Item exists, increase quantity
        existingItem.quantity += 1;
    } else {
        // New item, add it to the cart
        cartItems.push({ name, price, quantity: 1 });
    }

    cartQuantity += 1;
    document.getElementById("cart-count").innerText = cartQuantity;
    updateCartSection();
}

// Remove only one specific item from the cart
function removeFromCart(name) {
    const itemToRemove = cartItems.find(item => item.name === name);

    if (itemToRemove) {
        // Decrease quantity or remove the item if quantity reaches 0
        if (itemToRemove.quantity > 1) {
            itemToRemove.quantity -= 1;
        } else {
            cartItems = cartItems.filter(item => item.name !== name); // Remove the item from the cart
        }
        cartQuantity -= 1;
    }

    document.getElementById("cart-count").innerText = cartQuantity; // Update the cart count
    updateCartSection(); // Re-render the cart section
}

// Update the cart section to display the items and their quantities
function updateCartSection() {
    const cartItemsContainer = document.getElementById("cart-items");
    const cartSummary = document.getElementById("cart-summary");

    // Reset the cart display
    cartItemsContainer.innerHTML = "";
    cartSummary.innerHTML = "";

    let totalPrice = 0;

    // Create cart item cards
    cartItems.forEach((item) => {
        totalPrice += item.price * item.quantity; // Calculate the total price

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

    // Update the cart summary with the total items and total price
    cartSummary.innerHTML = `
        <p><strong>Total Items:</strong> ${cartQuantity}</p>
        <p><strong>Total Price:</strong> ${totalPrice.toFixed(2)} EGP</p>
    `;
}
