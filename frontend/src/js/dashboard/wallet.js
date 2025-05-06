/**
 * Wallet management for user dashboard
 * Handles deposit functionality
 */

import { makeDeposit, getWalletBalance } from '../core/api/services/transactionsService.js';

// Function to initialize deposit modal functionality
function initDepositModal() {
    // Get modal elements
    const depositModal = document.getElementById('deposit-modal');
    const depositAmount = document.getElementById('deposit-amount');
    const depositBtn = document.querySelector('.btn-outline[onclick="openDepositModal()"]');
    
    // Initialize deposit button
    if (depositBtn) {
        // The onclick attribute is already set in HTML
        console.log('Deposit button initialized');
    }
    
    // Add close modal functionality
    window.closeDepositModal = function() {
        depositModal.style.display = 'none';
    };
    
    // Add open modal functionality
    window.openDepositModal = function() {
        depositModal.style.display = 'block';
        depositAmount.value = '';
        depositAmount.focus();
    };
    
    // Process deposit functionality
    window.processDeposit = async function() {
        const amount = parseFloat(depositAmount.value);
        
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount greater than 0');
            return;
        }
        
        try {
            // Show processing indicator
            const depositButton = document.querySelector('#deposit-modal .btn-primary');
            const originalText = depositButton.innerHTML;
            depositButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            depositButton.disabled = true;
            
            // Make API call to deposit endpoint using our service
            const response = await makeDeposit(amount);
            
            console.log('Deposit successful:', response);
            
            // Update UI with success message
            alert(`Successfully deposited $${amount.toFixed(2)} to your wallet`);
            
            // Close modal
            closeDepositModal();
            
            // Update wallet balance if displayed on the page
            updateWalletBalance();
            
            // Refresh transaction history
            refreshTransactionHistory();
            
        } catch (error) {
            console.error('Deposit error:', error);
            alert(`Failed to process deposit: ${error.message}`);
        } finally {
            // Reset button state
            const depositButton = document.querySelector('#deposit-modal .btn-primary');
            depositButton.innerHTML = '<i class="fas fa-check"></i> Deposit Money';
            depositButton.disabled = false;
        }
    };
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === depositModal) {
            closeDepositModal();
        }
    });

    // Initialize transfer modal functionality
    initTransferModal();
}

// Function to initialize transfer modal functionality
function initTransferModal() {
    // Get modal elements
    const transferModal = document.getElementById('transfer-modal');
    const recipientInput = document.getElementById('recipient');
    const amountInput = document.getElementById('amount');
    const transferBtn = document.querySelector('.btn-primary[onclick="openTransferModal()"]');
    
    // Initialize transfer button
    if (transferBtn) {
        // The onclick attribute is already set in HTML
        console.log('Transfer button initialized');
    }
    
    // Add close modal functionality
    window.closeTransferModal = function() {
        transferModal.style.display = 'none';
    };
    
    // Add open modal functionality
    window.openTransferModal = function() {
        transferModal.style.display = 'block';
        recipientInput.value = '';
        amountInput.value = '';
        recipientInput.focus();
    };
    
    // Add functionality to open with a pre-filled recipient
    window.openTransferModalWithUser = function(userName) {
        transferModal.style.display = 'block';
        recipientInput.value = userName;
        amountInput.value = '';
        amountInput.focus();
    };
    
    // Process transfer functionality
    window.processTransfer = async function() {
        const recipient = recipientInput.value;
        const amount = parseFloat(amountInput.value);
        
        if (!recipient) {
            alert('Please enter a recipient');
            return;
        }
        
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount greater than 0');
            return;
        }
        
        try {
            // Show processing indicator
            const transferButton = document.querySelector('#transfer-modal .btn-primary');
            const originalText = transferButton.innerHTML;
            transferButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            transferButton.disabled = true;
            
            // In a real app, this would call an API
            console.log(`Transfer of $${amount.toFixed(2)} to ${recipient} initiated`);
            
            // Simulate API call
            setTimeout(() => {
                // Update UI with success message
                alert(`Successfully transferred $${amount.toFixed(2)} to ${recipient}`);
                
                // Close modal
                closeTransferModal();
                
                // Update wallet balance if displayed on the page
                updateWalletBalance();
                
                // Refresh transaction history
                refreshTransactionHistory();
                
                // Reset button state
                transferButton.innerHTML = 'Send Money';
                transferButton.disabled = false;
            }, 1000);
            
        } catch (error) {
            console.error('Transfer error:', error);
            alert(`Failed to process transfer: ${error.message}`);
            
            // Reset button state
            const transferButton = document.querySelector('#transfer-modal .btn-primary');
            transferButton.innerHTML = 'Send Money';
            transferButton.disabled = false;
        }
    };
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === transferModal) {
            closeTransferModal();
        }
    });
}

// Function to update wallet balance displayed on the page
async function updateWalletBalance() {
    try {
        // Fetch current wallet balance using our service
        const data = await getWalletBalance();
        
        // Update wallet balance display
        const balanceElements = document.querySelectorAll('.card-time, .profile-card .balance');
        balanceElements.forEach(element => {
            if (element) {
                element.textContent = `$${parseFloat(data.balance).toFixed(2)}`;
            }
        });
        
    } catch (error) {
        console.error('Error updating wallet balance:', error);
    }
}

// Function to refresh transaction history
function refreshTransactionHistory() {
    // Find and click the "Transactions" tab to refresh data
    const transactionsTab = document.querySelector('.nav-item[data-target="transactions-tab"]');
    if (transactionsTab) {
        transactionsTab.click();
    }
}

// Export functions for potential use in other modules
export {
    initDepositModal,
    initTransferModal,
    updateWalletBalance,
    refreshTransactionHistory
};