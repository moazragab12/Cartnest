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
        return await apiClient.post(API_ENDPOINTS.transactions.create, transactionData);
    } catch (error) {
        console.error('Create transaction error:', error);
        throw error;
    }
};

export {
    getTransactions,
    getTransactionById,
    createTransaction
};