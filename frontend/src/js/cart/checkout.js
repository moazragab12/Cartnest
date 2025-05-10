/**
 * Checkout functionality for the MarketPlace
 * This module handles the checkout process including user authentication check
 */

import { cartManager } from "../shared/cart-manager.js";
import { authService } from "../core/api/index.js";
import API_ENDPOINTS from "../core/api/endpoints.js";
import { getWalletBalance, createTransaction } from "../core/api/services/transactionsService.js";

/**
 * Initialize checkout process when the checkout button is clicked
 */
function initCheckout() {
  const checkoutButton = document.querySelector(".checkout");
  if (!checkoutButton) return;

  checkoutButton.addEventListener("click", handleCheckout);
}

/**
 * Handle the checkout button click
 * Checks if user is logged in before proceeding with checkout
 */
function handleCheckout() {
  // Check if the user is authenticated by looking for access token
  const isAuthenticated = isUserLoggedIn();

  if (isAuthenticated) {
    // User is logged in, proceed with checkout
    proceedWithCheckout();
  } else {
    // User is not logged in, show error message
    showLoginRequiredError();
  }
}

/**
 * Check if user is logged in
 * @returns {boolean} True if user is logged in
 */
function isUserLoggedIn() {
  // Check for access token in localStorage (primary method)
  const accessToken = localStorage.getItem('accessToken');
  if (accessToken) {
    return true;
  }

  // Backward compatibility - check cookies too
  const cookies = document.cookie
    .split(';')
    .map(cookie => cookie.trim().split('='))
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});

  return !!cookies['accessToken'];
}

/**
 * Display error message if user is not logged in
 */
function showLoginRequiredError() {
  // Create overlay to display login required message
  const overlay = document.createElement("div");
  overlay.className = "login-error-overlay";

  // Create the error container
  const errorContainer = document.createElement("div");
  errorContainer.className = "login-error-container";
  // Add the error GIF  const gifImage = document.createElement("img");
  gifImage.src = "/frontend/public/resources/gifs/error (2).gif";
  gifImage.alt = "Login Required Error";
  gifImage.className = "login-error-gif";

  // Create the message
  const message = document.createElement("div");
  message.className = "login-error-message";
  message.innerHTML = `
    <h2>Login Required</h2>
    <p>Please log in to continue with your purchase.</p>
    <button class="login-redirect-button">Go to Login</button>
    <button class="error-close-button">Close</button>
  `;

  // Assemble the components
  errorContainer.appendChild(gifImage);
  errorContainer.appendChild(message);
  overlay.appendChild(errorContainer);
  document.body.appendChild(overlay);

  // Add event listeners to buttons
  const loginButton = overlay.querySelector(".login-redirect-button");
  loginButton.addEventListener("click", () => {
    window.location.href = "../Auth/auth.html";
  });

  const closeButton = overlay.querySelector(".error-close-button");
  closeButton.addEventListener("click", () => {
    document.body.removeChild(overlay);
  });

  // Also allow clicking outside the error container to close it
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }  });
}

/**
 * Proceed with checkout process for authenticated users
 * Checks if user has sufficient balance for the order
 */
async function proceedWithCheckout() {
  console.log("User is authenticated, checking balance");
  
  // Debug cart information
  try {
    console.log("LocalStorage cart:", localStorage.getItem('cart'));
    
    // Check cookie as well
    const allCookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});
    console.log("All cookies:", allCookies);
    
    if (allCookies['cart']) {
      try {
        console.log("Cookie cart:", decodeURIComponent(allCookies['cart']));
      } catch (e) {
        console.log("Cookie cart (raw):", allCookies['cart']);
      }
    }
  } catch (debugError) {
    console.error("Debug error:", debugError);
  }
  
  try {
    // Get the cart total amount
    const cartTotal = getCartTotal();
    
    // Get user's cash balance from the API using the transactions service
    const userBalance = await getUserBalance();
    
    console.log(`Cart total: $${cartTotal}, User balance: $${userBalance}`);
    
    // Check if the user has enough balance
    if (userBalance >= cartTotal) {
      // User has sufficient balance
      console.log(`Success: User has sufficient balance: $${userBalance.toFixed(2)} for cart total: $${cartTotal.toFixed(2)}`);
      
      // Get cart items for transaction
      const cartItems = getCartItems();      try {
        console.log("Cart items for transactions:", cartItems);
        
        if (!cartItems.length) {
          throw new Error("No valid items found in cart");
        }
        
        // Process each item in the cart as a separate transaction
        const transactionPromises = cartItems.map(item => {
          // Create transaction data structure expected by API
          const transactionData = {
            item_id: item.item_id,
            quantity: item.quantity
          };
          
          console.log(`Creating transaction for item_id: ${item.item_id}, quantity: ${item.quantity}`);
          return createTransaction(transactionData);
        });
        
        // Process all transactions in parallel
        const transactionResults = await Promise.all(transactionPromises);
        console.log("Transactions processed successfully:", transactionResults);
        
        // Get the latest transaction to determine the new balance
        const lastTransaction = transactionResults[transactionResults.length - 1];
          // Generate order ID from transaction IDs or fallback to timestamp if not available
        const orderID = transactionResults.some(tr => tr.transaction_id || tr.id) 
          ? `ORDER-${transactionResults.map(tr => tr.transaction_id || tr.id || 'UNKNOWN').join('-')}`
          : generateOrderNumber();
        
        // Get updated balance - we need to query it as the backend doesn't return it
        const updatedBalance = await getUserBalance();
        
        // Clear the cart after successful transaction
        cartManager.clearCart();
        
        // Show success popup with order details
        showSuccessfulPayment(cartTotal, updatedBalance, orderID);
      } catch (transactionError) {
        console.error("Transaction error:", transactionError);
        showErrorPopup("Failed to process your transaction. Please try again.", "Transaction Error");
        return;
      }
    } else {
      // User has insufficient balance
      console.log(`Error: Insufficient balance. User has $${userBalance.toFixed(2)} but needs $${cartTotal.toFixed(2)}`);
      
      // Show insufficient balance error popup
      showInsufficientBalanceError(userBalance, cartTotal);
    }
  } catch (error) {
    console.error("Error checking user balance:", error);
    // Show proper error message to user
    showErrorPopup("Unable to process checkout at this time. Please try again later.", "Checkout Error");
  }
}

/**
 * Display a generic error popup
 * @param {string} message - The error message to display
 * @param {string} title - The title of the error popup
 */
function showErrorPopup(message, title = "Error") {
  // Create overlay
  const overlay = document.createElement("div");
  overlay.className = "login-error-overlay";

  // Create the error container
  const errorContainer = document.createElement("div");
  errorContainer.className = "login-error-container";

  // Add the error GIF
  const gifImage = document.createElement("img");
  gifImage.src = "../../../public/resources/gifs/error (2).gif";
  gifImage.alt = "Error";
  gifImage.className = "login-error-gif";

  // Create the message
  const messageElement = document.createElement("div");
  messageElement.className = "login-error-message";
  messageElement.innerHTML = `
    <h2>${title}</h2>
    <p>${message}</p>
    <button class="error-close-button">Close</button>
  `;

  // Assemble the components
  errorContainer.appendChild(gifImage);
  errorContainer.appendChild(messageElement);
  overlay.appendChild(errorContainer);
  document.body.appendChild(overlay);

  // Add event listener to close button
  const closeButton = overlay.querySelector(".error-close-button");
  closeButton.addEventListener("click", () => {
    document.body.removeChild(overlay);
  });
  
  // Also allow clicking outside the error container to close it
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  });
}

/**
 * Get the total amount in the cart
 * @returns {number} The total amount
 */
function getCartTotal() {
  // Try to get the total from the summary section
  const totalElement = document.querySelector('.summary-info .total .amount');
  if (totalElement) {
    // Extract the number from formatting like "$123.45"
    const totalText = totalElement.textContent;
    const totalMatch = totalText.match(/\$?(\d+(\.\d+)?)/);
    if (totalMatch && totalMatch[1]) {
      return parseFloat(totalMatch[1]);
    }
  }
  
  // Fallback: calculate total from cart items
  const cart = cartManager.getCart();
  let total = 0;
  
  cart.forEach(item => {
    const price = item.price || 0;
    const quantity = item.quantity || 1;
    total += price * quantity;
  });
  
  return total;
}

/**
 * Get user's cash balance from the API
 * @returns {Promise<number>} The user's balance
 */
async function getUserBalance() {
  try {
    // Check if the user is logged in
    const accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
      throw new Error("No access token found");
    }
    
    // Use the imported getWalletBalance service function
    // This uses API_ENDPOINTS.profile.wallet.balance internally
    const balanceData = await getWalletBalance();
    console.log("User balance data:", balanceData);
    
    // Extract balance from response data based on API structure
    let balance;
    
    // Handle different possible response formats
    if (balanceData && typeof balanceData === 'object') {
      balance = balanceData.balance || 
               balanceData.cash_balance || 
               balanceData.amount || 
               balanceData.wallet_balance;
    } else if (typeof balanceData === 'number') {
      balance = balanceData;
    } else if (typeof balanceData === 'string') {
      balance = parseFloat(balanceData);
    }
    
    if (typeof balance !== 'number' || isNaN(balance)) {
      console.error("Invalid balance value:", balance);
      throw new Error("Invalid balance value received from API");
    }
    
    return balance;
      } catch (error) {
    console.error("Error fetching user balance:", error);
    
    // Fallback method 1: Try to get balance from user profile
    try {
      const userProfile = await authService.getUserProfile();
      console.log("User profile (fallback):", userProfile);
      
      if (userProfile && (userProfile.balance || userProfile.cash_balance)) {
        const profileBalance = userProfile.balance || userProfile.cash_balance;
        return parseFloat(profileBalance);
      }
    } catch (fallbackError) {
      console.error("Profile fallback failed:", fallbackError);
    }
    
    // Fallback method 2: Try direct API call if the service fails
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(API_ENDPOINTS.profile.wallet.balance, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && (data.balance || data.cash_balance || typeof data === 'number')) {
          const balance = data.balance || data.cash_balance || parseFloat(data);
          if (!isNaN(balance)) {
            return balance;
          }
        }
      }
    } catch (directApiError) {
      console.error("Direct API fallback failed:", directApiError);
    }
    
    // Show a proper error message popup instead of using a static fallback value
    const errorMessage = "Unable to fetch your current balance from the server. Please refresh the page or try again later.";
    showErrorPopup(errorMessage, "Balance Error");
    throw new Error("Failed to get user balance from API");
  }
}

/**
 * Display error message if user has insufficient balance
 * @param {number} userBalance - The user's current balance
 * @param {number} cartTotal - The cart total amount
 */
function showInsufficientBalanceError(userBalance, cartTotal) {
  // Create overlay to display insufficient balance message
  const overlay = document.createElement("div");
  overlay.className = "login-error-overlay";

  // Create the error container
  const errorContainer = document.createElement("div");
  errorContainer.className = "login-error-container";

  // Add the error GIF
  const gifImage = document.createElement("img");
  gifImage.src = "../../../public/resources/gifs/failed_payment.gif";
  gifImage.alt = "Insufficient Balance Error";
  gifImage.className = "login-error-gif";

  // Calculate the amount needed
  const amountNeeded = (cartTotal - userBalance).toFixed(2);

  // Create the message
  const message = document.createElement("div");
  message.className = "login-error-message";
  message.innerHTML = `
    <h2>Insufficient Balance</h2>
    <p>Your current balance is $${userBalance.toFixed(2)}, but the cart total is $${cartTotal.toFixed(2)}.</p>
    <p>You need an additional $${amountNeeded} to complete this purchase.</p>
    <button class="login-redirect-button">Add Funds</button>
    <button class="error-close-button">Close</button>
  `;

  // Assemble the components
  errorContainer.appendChild(gifImage);
  errorContainer.appendChild(message);
  overlay.appendChild(errorContainer);
  document.body.appendChild(overlay);

  // Add event listeners to buttons
  const addFundsButton = overlay.querySelector(".login-redirect-button");
  addFundsButton.addEventListener("click", () => {
    // Redirect to the dashboard or profile page where user can add funds
    window.location.href = "../Dashboard/index.html";
  });

  const closeButton = overlay.querySelector(".error-close-button");
  closeButton.addEventListener("click", () => {
    document.body.removeChild(overlay);
  });
  // Also allow clicking outside the error container to close it
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  });
}

/**
 * Display success message after successful payment
 * @param {number} amount - The amount paid
 * @param {number} newBalance - The new balance after payment
 * @param {string} [orderId] - The order ID or transaction ID
 */
function showSuccessfulPayment(amount, newBalance, orderId) {
  // Create overlay to display successful payment message
  const overlay = document.createElement("div");
  overlay.className = "login-error-overlay"; // Reusing the same overlay class

  // Create the success container
  const successContainer = document.createElement("div");
  successContainer.className = "login-error-container success-container"; // Reusing with additional class

  // Add the success GIF
  const gifImage = document.createElement("img");
  gifImage.src = "../../../public/resources/gifs/successed_payment.gif";
  gifImage.alt = "Successful Payment";
  gifImage.className = "login-error-gif";

  // Get cart items for the order summary
  const cartItems = getCartItems();
  const orderNumber = orderId || generateOrderNumber();
  const orderDate = new Date().toLocaleDateString();
  const estimatedDelivery = getEstimatedDeliveryDate();

  // Create the message with order details
  const message = document.createElement("div");
  message.className = "login-error-message payment-success-message";
  
  // Build the order summary HTML
  let orderSummaryHTML = '';
  
  if (cartItems.length > 0) {
    orderSummaryHTML = `
      <div class="order-items-summary">
        <h3>Order Items:</h3>
        <ul class="order-items-list">
    `;
    
    // Add each item to the summary
    cartItems.forEach(item => {
      const itemTotal = (item.price * item.quantity).toFixed(2);
      orderSummaryHTML += `
        <li class="order-item">
          <span>${item.name} x ${item.quantity}</span>
          <span>$${itemTotal}</span>
        </li>
      `;
    });
    
    orderSummaryHTML += `</ul></div>`;
  }
  message.innerHTML = `
    <h2 style="color: green;">Payment Successful</h2>
    <p class="success-message">Your order has been placed successfully!</p>
    
    <div class="order-details">
      <div class="payment-details">
        <p><strong>Order Number:</strong> <span class="order-number">${orderNumber}</span></p>
        <p><strong>Total Paid:</strong> <span class="amount-paid">$${amount.toFixed(2)}</span></p>
        <p><strong>Remaining Balance:</strong> $${newBalance.toFixed(2)}</p>
        <p><strong>Order Date:</strong> ${orderDate}</p>
        <p><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>
      </div>
    </div>
    
    ${orderSummaryHTML}
    
    <button class="payment-success-button">Continue Shopping</button>
    <button class="view-order-button">View Order</button>
  `;

  // Assemble the components
  successContainer.appendChild(gifImage);
  successContainer.appendChild(message);
  overlay.appendChild(successContainer);
  document.body.appendChild(overlay);

  // Add event listeners to buttons
  const continueButton = overlay.querySelector(".payment-success-button");
  continueButton.addEventListener("click", () => {
    // Redirect to product list page
    window.location.href = "../productsList/productList.html";
  });

  const viewOrderButton = overlay.querySelector(".view-order-button");
  viewOrderButton.addEventListener("click", () => {
    // In a real implementation, redirect to order details page
    // For now, redirect to dashboard
    window.location.href = "../Dashboard/index.html";
  });

  // Also allow clicking outside the success container to close it
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  });
}

// Initialize checkout functionality on page load
document.addEventListener("DOMContentLoaded", initCheckout);

/**
 * Get cart items from DOM or local storage
 * @returns {Array} Array of cart items with name, price, and quantity
 */
function getCartItems() {
  const cartItems = [];
  
  try {
    // Try to get items from the DOM first
    const itemRows = document.querySelectorAll('.cart-items-container .item-row');
    
    if (itemRows.length > 0) {
      itemRows.forEach(row => {
        const nameElement = row.querySelector('.item-name');
        const priceElement = row.querySelector('.item-price');
        const quantityElement = row.querySelector('.quantity-input');
        
        // Try to get the item ID from data attribute or other source
        const itemId = row.dataset.itemId || row.getAttribute('data-item-id');
        
        if (nameElement && priceElement && quantityElement) {
          const name = nameElement.textContent.trim();
          // Extract just the number from the price (remove $ and any other characters)
          const priceText = priceElement.textContent.trim();
          const price = parseFloat(priceText.replace(/[^\d.-]/g, ''));
          const quantity = parseInt(quantityElement.value);
          
          // Include the item_id explicitly
          cartItems.push({ 
            name, 
            price, 
            quantity, 
            item_id: itemId || null  // Use null if not found, will check localStorage as backup
          });
        }
      });
    } else {
      // If DOM elements not found, try to load from localStorage via cartManager
      try {
        const cart = cartManager.getCart();
        console.log("Cart from cartManager:", cart);
        
        if (Array.isArray(cart) && cart.length > 0) {
          return cart.map(item => {
            // Ensure item_id is properly set for transaction API
            return {
              name: item.name || item.title || 'Unknown Item',
              price: parseFloat(item.price) || 0,
              quantity: parseInt(item.quantity) || 1,
              item_id: item.id || item.item_id || item.itemId || null
            };
          }).filter(item => item.item_id !== null); // Filter out items without IDs
        }
      } catch (cartManagerError) {
        console.error('Error getting cart from cartManager:', cartManagerError);
      }
      
      // Direct localStorage fallback if cartManager fails
      const storedCart = localStorage.getItem('cart');
      if (storedCart) {
        const parsedCart = JSON.parse(storedCart);
        console.log("Cart from localStorage:", parsedCart);
        
        return parsedCart.map(item => {
          // Be very explicit about extracting the item_id
          let itemId = null;
          if (item.id) itemId = item.id;
          else if (item.item_id) itemId = item.item_id;
          else if (item.itemId) itemId = item.itemId;
          else if (typeof item === 'object' && Object.keys(item).length === 2 && 
                  'id' in item && 'quantity' in item) {
            itemId = item.id;
          }
          
          return {
            name: item.name || item.title || 'Unknown Item',
            price: parseFloat(item.price) || 0,
            quantity: parseInt(item.quantity) || 1,
            item_id: itemId
          };
        }).filter(item => item.item_id !== null);
      }
    }
  } catch (error) {
    console.error('Error getting cart items:', error);
    // Don't return sample items as fallback - better to show an error
    showErrorPopup("Could not retrieve your cart items. Please refresh the page and try again.", "Cart Error");
    return [];
  }
  
  return cartItems.length > 0 ? cartItems.filter(item => item.item_id !== null) : [];
}

/**
 * Generate a random order number
 * @returns {string} Random order number
 */
function generateOrderNumber() {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 10000);
  return `ORD-${timestamp}-${random}`;
}

/**
 * Calculate estimated delivery date (5-7 days from now)
 * @returns {string} Estimated delivery date
 */
function getEstimatedDeliveryDate() {
  const today = new Date();
  const deliveryDays = 5 + Math.floor(Math.random() * 3); // Random between 5-7 days
  const deliveryDate = new Date(today);
  deliveryDate.setDate(today.getDate() + deliveryDays);
  
  return deliveryDate.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  });
}

// Export functions for potential use in other modules
export { 
  initCheckout, 
  handleCheckout, 
  getCartTotal, 
  getUserBalance, 
  showLoginRequiredError, 
  showInsufficientBalanceError,
  proceedWithCheckout,
  getCartItems,
  generateOrderNumber,
  getEstimatedDeliveryDate,
  showSuccessfulPayment,
  showErrorPopup
};