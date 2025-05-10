// filepath: d:\college\Senior 1\Spring 25\Parallel\Project\MarketPlace\frontend\src\js\dashboard\transactions.js
import transactionsController from './controllers/TransactionsController.js';

/**
 * Transactions module for dashboard
 * Handles UI interactions for the transactions tab
 */

// Initialize the transactions tab when it's clicked
document.addEventListener('DOMContentLoaded', function() {
  console.log('Transactions module loaded');
  
  const transactionsTab = document.querySelector('.nav-item[data-target="transactions-tab"]');
  
  if (transactionsTab) {
    transactionsTab.addEventListener('click', function() {
      console.log('Transactions tab clicked');
      // Reset the transactions controller to ensure fresh data
      transactionsController.currentUserId = null;
      initializeTransactionsTab();
    });
  }
    // Check if we're already on the transactions tab
  const isTransactionsTabActive = document.querySelector('#transactions-tab.active');
  if (isTransactionsTabActive) {
    console.log('Transactions tab is already active');
    // Also reset the controller when initializing from an already active tab
    transactionsController.currentUserId = null;
    initializeTransactionsTab();
  }
  
  // Setup event listeners for the deposit functionality
  setupDepositModal();
});

/**
 * Initialize the transactions tab
 */
function initializeTransactionsTab() {
  console.log('Initializing transactions tab');
  
  // First, ensure any previous data is cleared from DOM
  const transactionsTableBody = document.getElementById('transactions-table-body');
  if (transactionsTableBody) {
    transactionsTableBody.innerHTML = '<tr><td colspan="9" class="loading-message">Preparing transactions...</td></tr>';
  }
  
  // Delay the initialization to ensure the tab is visible and DOM is ready
  setTimeout(() => {
    // Force a fresh controller initialization
    console.log('Starting controller initialization');
    transactionsController.init();
  }, 300); // Increased delay to give more time for setup
}

/**
 * Set up event listeners for the deposit modal
 */
function setupDepositModal() {
  // Attach event listeners for deposit modal
  window.openDepositModal = openDepositModal;
  window.closeDepositModal = closeDepositModal;
  window.processDeposit = processDeposit;
}

/**
 * Open the deposit modal
 */
function openDepositModal() {
  const modal = document.getElementById('deposit-modal');
  if (modal) {
    // Move modal to body if it's not already there to ensure proper positioning
    if (modal.parentElement && modal.parentElement.id !== 'body') {
      document.body.appendChild(modal);
    }
    
    // Display the modal with flex layout
    modal.style.display = 'flex';
    
    // Add show class after a small delay to trigger animation
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);
    
    // Initialize card form if it exists
    initializeCardForm();
  }
}

/**
 * Close the deposit modal
 */
function closeDepositModal() {
  const modal = document.getElementById('deposit-modal');
  if (modal) {
    // Remove show class first to trigger animation
    modal.classList.remove('show');
    
    // Hide modal after animation completes
    setTimeout(() => {
      modal.style.display = 'none';
      
      // Reset form fields
      const amountInput = document.getElementById('deposit-amount');
      const paymentMethodSelect = document.getElementById('payment-method');
      const notesTextarea = document.getElementById('deposit-notes');
      
      // Reset credit card form if it exists
      const cardNumber = document.getElementById('card-number');
      const cardName = document.getElementById('card-name');
      const cardExpiry = document.getElementById('card-expiry');
      const cardCVC = document.getElementById('card-cvc');
      
      if (amountInput) amountInput.value = '';
      if (paymentMethodSelect) paymentMethodSelect.selectedIndex = 0;
      if (notesTextarea) notesTextarea.value = '';
      if (cardNumber) cardNumber.value = '';
      if (cardName) cardName.value = '';
      if (cardExpiry) cardExpiry.value = '';
      if (cardCVC) cardCVC.value = '';
      
      // Toggle back to credit card view if we were showing different payment method
      showCreditCardForm();
    }, 300); // Match the CSS transition time
  }
}

/**
 * Initialize credit card form with interactive elements
 */
function initializeCardForm() {
  // Add input masking and validation for credit card fields
  const cardNumber = document.getElementById('card-number');
  const cardExpiry = document.getElementById('card-expiry');
  const cardCVC = document.getElementById('card-cvc');
  const paymentMethodSelect = document.getElementById('payment-method');
  
  if (cardNumber) {
    cardNumber.addEventListener('input', function(e) {
      // Format card number with spaces every 4 digits
      let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      let formattedValue = '';
      
      for (let i = 0; i < value.length; i++) {
        if (i > 0 && i % 4 === 0) {
          formattedValue += ' ';
        }
        formattedValue += value[i];
      }
      
      // Limit to 19 characters (16 digits + 3 spaces)
      if (formattedValue.length <= 19) {
        e.target.value = formattedValue;
      } else {
        e.target.value = formattedValue.substring(0, 19);
      }
      
      // Update the card number display in the card preview
      const cardPreviewNumber = document.querySelector('.card-preview-number');
      if (cardPreviewNumber) {
        cardPreviewNumber.textContent = e.target.value || '•••• •••• •••• ••••';
      }
    });
  }
  
  if (cardExpiry) {
    cardExpiry.addEventListener('input', function(e) {
      // Format expiry as MM/YY
      let value = e.target.value.replace(/[^0-9]/gi, '');
      
      if (value.length > 0) {
        if (value.length <= 2) {
          e.target.value = value;
        } else {
          e.target.value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
      }
      
      // Update the expiry display in the card preview
      const cardPreviewExpiry = document.querySelector('.card-preview-expiry');
      if (cardPreviewExpiry) {
        cardPreviewExpiry.textContent = e.target.value || 'MM/YY';
      }
    });
  }
  
  if (cardCVC) {
    cardCVC.addEventListener('input', function(e) {
      // Limit CVC to 3-4 digits
      let value = e.target.value.replace(/[^0-9]/gi, '');
      e.target.value = value.substring(0, 4);
    });
  }
  
  // Payment method switching
  if (paymentMethodSelect) {
    paymentMethodSelect.addEventListener('change', function() {
      const selectedMethod = this.value;
      
      if (selectedMethod === 'credit-card') {
        showCreditCardForm();
      } else {
        showAlternativePaymentForm(selectedMethod);
      }
    });
  }
}

/**
 * Show credit card form and hide others
 */
function showCreditCardForm() {
  const creditCardForm = document.getElementById('credit-card-form');
  const alternativePaymentForm = document.getElementById('alternative-payment-form');
  
  if (creditCardForm) {
    creditCardForm.style.display = 'block';
  }
  
  if (alternativePaymentForm) {
    alternativePaymentForm.style.display = 'none';
  }
}

/**
 * Show alternative payment form based on selected method
 */
function showAlternativePaymentForm(method) {
  const creditCardForm = document.getElementById('credit-card-form');
  const alternativePaymentForm = document.getElementById('alternative-payment-form');
  const methodTitle = document.getElementById('alternative-payment-title');
  
  if (creditCardForm) {
    creditCardForm.style.display = 'none';
  }
  
  if (alternativePaymentForm) {
    alternativePaymentForm.style.display = 'block';
    
    if (methodTitle) {
      // Update the title based on the payment method
      switch (method) {
        case 'paypal':
          methodTitle.textContent = 'PayPal';
          break;
        case 'bank-transfer':
          methodTitle.textContent = 'Bank Transfer';
          break;
        case 'debit-card':
          methodTitle.textContent = 'Debit Card';
          break;
        default:
          methodTitle.textContent = 'Alternative Payment';
      }
    }
  }
}

/**
 * Process a deposit
 */
async function processDeposit() {
  const amountInput = document.getElementById('deposit-amount');
  const paymentMethodSelect = document.getElementById('payment-method');
  
  if (!amountInput || !paymentMethodSelect) {
    alert('Missing form fields');
    return;
  }
  
  const amount = parseFloat(amountInput.value);
  const paymentMethod = paymentMethodSelect.value;
  
  if (isNaN(amount) || amount <= 0) {
    alert('Please enter a valid amount');
    return;
  }
  
  try {
    // Show loading state
    const depositButton = document.querySelector('.modal-footer .btn-primary');
    if (depositButton) {
      depositButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
      depositButton.disabled = true;
    }
    
    // Get authentication token
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('Authentication required');
    }
    
    // Define API base URL - adjust this based on your backend configuration
    // This is crucial for development environments where frontend and backend run on different servers
    const API_BASE_URL = 'http://localhost:8000'; // Change to your backend URL
    
    // Call the backend API with full URL
    const response = await fetch(`${API_BASE_URL}/api/v0/profile/wallet/deposit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        amount: amount
      })
    });
    
    // Check response status
    if (!response.ok) {
      // Try to parse error response JSON if available
      let errorMessage = 'Failed to process deposit';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (jsonError) {
        // If JSON parsing fails, use status text
        errorMessage = `Server error (${response.status}): ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('Deposit successful:', data);
    
    // Close the modal
    closeDepositModal();
    
    // Show success toast
    showToast('success', `Successfully deposited $${amount.toFixed(2)} via ${paymentMethod}`);
    
    // Reset button state
    if (depositButton) {
      depositButton.innerHTML = 'Deposit Money';
      depositButton.disabled = false;
    }
    
    // Refresh transaction data after deposit
    setTimeout(() => {
      transactionsController.loadTransactions();
      
      // Also update the wallet balance in the UI if it exists
      updateWalletBalance();
    }, 1000);
  } catch (error) {
    console.error('Error processing deposit:', error);
    
    // Show error toast instead of alert for better UX
    showToast('error', error.message || 'Failed to process deposit. Please try again.');
    
    // Reset button state
    const depositButton = document.querySelector('.modal-footer .btn-primary');
    if (depositButton) {
      depositButton.innerHTML = 'Deposit Money';
      depositButton.disabled = false;
    }
  }
}

/**
 * Update wallet balance in the UI
 */
async function updateWalletBalance() {
  try {
    // Get authentication token
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return;
    }
    
    // Define API base URL - same as in processDeposit
    const API_BASE_URL = 'http://localhost:8000'; // Change to your backend URL
    
    // Fetch current wallet balance
    const response = await fetch(`${API_BASE_URL}/api/v0/profile/wallet/balance`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch wallet balance');
    }
    
    const balance = await response.json();
    
    // Update balance displayed in the UI
    const balanceElements = document.querySelectorAll('.card-time');
    balanceElements.forEach(element => {
      if (element.textContent.includes('$')) {
        element.textContent = `$${parseFloat(balance).toFixed(2)}`;
      }
    });
    
    console.log('Wallet balance updated:', balance);
  } catch (error) {
    console.error('Error updating wallet balance:', error);
  }
}

/**
 * Show a toast notification
 * @param {string} type - Type of toast: success, error, info, warning
 * @param {string} message - Message to display
 */
function showToast(type, message) {
  // Remove any existing toasts
  const existingToasts = document.querySelectorAll('.toast');
  existingToasts.forEach(toast => toast.remove());
  
  // Create new toast
  const toast = document.createElement('div');
  toast.classList.add('toast', `toast-${type}`);
  
  // Choose icon based on type
  let icon = '';
  switch (type) {
    case 'success':
      icon = '<i class="fas fa-check-circle"></i>';
      break;
    case 'error':
      icon = '<i class="fas fa-exclamation-circle"></i>';
      break;
    case 'info':
      icon = '<i class="fas fa-info-circle"></i>';
      break;
    case 'warning':
      icon = '<i class="fas fa-exclamation-triangle"></i>';
      break;
  }
  
  toast.innerHTML = `${icon} <span>${message}</span>`;
  document.body.appendChild(toast);
  
  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Make the controller accessible globally for debugging and retry functionality
window.transactionsController = transactionsController;