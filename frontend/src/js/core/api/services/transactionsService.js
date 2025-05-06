/**
 * Transactions Service for MarketPlace
 * Implements transaction-related API functions
 */

import apiClient from '../apiClient.js';
import API_ENDPOINTS from '../endpoints.js';

/**
 * Get all transactions for the current user
 * @returns {Promise<object>} List of transactions
 */
const getTransactions = async () => {
    try {
        return await apiClient.get(API_ENDPOINTS.transactions.list);
    } catch (error) {
        console.error('Get transactions error:', error);
        throw error;
    }
};

/**
 * Get details of a specific transaction
 * @param {string|number} transactionId - ID of the transaction
 * @returns {Promise<object>} Transaction details
 */
const getTransactionById = async (transactionId) => {
    if (!transactionId) {
        throw new Error('Transaction ID is required');
    }
    
    try {
        return await apiClient.get(API_ENDPOINTS.transactions.details(transactionId));
    } catch (error) {
        console.error(`Get transaction ${transactionId} error:`, error);
        throw error;
    }
};

/**
 * Create a new transaction
 * @param {object} transactionData - Transaction data
 * @returns {Promise<object>} Created transaction
 */
const createTransaction = async (transactionData) => {
    try {
        return await apiClient.post(API_ENDPOINTS.transactions.purchase, transactionData);
    } catch (error) {
        console.error('Create transaction error:', error);
        throw error;
    }
};

/**
 * Make a deposit to user's wallet
 * @param {number} amount - Amount to deposit
 * @returns {Promise<object>} Deposit transaction details
 */
const makeDeposit = async (amount) => {
    if (!amount || isNaN(amount) || amount <= 0) {
        throw new Error('Valid deposit amount is required');
    }
    
    try {
        return await apiClient.post(API_ENDPOINTS.profile.wallet.deposit, { amount });
    } catch (error) {
        console.error('Deposit error:', error);
        throw error;
    }
};

/**
 * Get user's wallet balance
 * @returns {Promise<object>} Wallet balance information
 */
const getWalletBalance = async () => {
    try {
        return await apiClient.get(API_ENDPOINTS.profile.wallet.balance);
    } catch (error) {
        console.error('Get wallet balance error:', error);
        throw error;
    }
};

/**
 * Transfer funds to another user
 * @param {number} receiver_id - ID of the user receiving the funds
 * @param {number} amount - Amount to transfer
 * @returns {Promise<object>} Transfer result with updated balance
 */
const transferFunds = async (receiver_id, amount) => {
    if (!receiver_id || isNaN(receiver_id) || receiver_id <= 0) {
        throw new Error('Valid receiver ID is required');
    }
    
    if (!amount || isNaN(amount) || amount <= 0) {
        throw new Error('Valid transfer amount is required');
    }
    
    try {
        return await apiClient.post(API_ENDPOINTS.transactions.transfer, { 
            receiver_id: parseInt(receiver_id),
            amount: parseFloat(amount)
        });
    } catch (error) {
        console.error('Transfer funds error:', error);
        throw error;
    }
};

export {
    getTransactions,
    getTransactionById,
    createTransaction,
    makeDeposit,
    getWalletBalance,
    transferFunds
};