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
      initializeTransactionsTab();
    });
  }
  
  // Check if we're already on the transactions tab
  const isTransactionsTabActive = document.querySelector('#transactions-tab.active');
  if (isTransactionsTabActive) {
    console.log('Transactions tab is already active');
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
  
  // Delay the initialization slightly to ensure the tab is visible
  setTimeout(() => {
    transactionsController.init();
  }, 100);
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
    modal.style.display = 'block';
  }
}

/**
 * Close the deposit modal
 */
function closeDepositModal() {
  const modal = document.getElementById('deposit-modal');
  if (modal) {
    modal.style.display = 'none';
    
    // Reset form fields
    const amountInput = document.getElementById('deposit-amount');
    const paymentMethodSelect = document.getElementById('payment-method');
    const notesTextarea = document.getElementById('deposit-notes');
    
    if (amountInput) amountInput.value = '';
    if (paymentMethodSelect) paymentMethodSelect.selectedIndex = 0;
    if (notesTextarea) notesTextarea.value = '';
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
    // For demonstration, we'll just show a success message
    // In a real application, this would call the API
    alert(`Successfully deposited $${amount.toFixed(2)} via ${paymentMethod}`);
    
    // Close the modal
    closeDepositModal();
    
    // Refresh transaction data after deposit
    setTimeout(() => {
      transactionsController.loadTransactions();
    }, 1000);
  } catch (error) {
    console.error('Error processing deposit:', error);
    alert('Failed to process deposit. Please try again.');
  }
}

// Make the controller accessible globally for debugging and retry functionality
window.transactionsController = transactionsController;