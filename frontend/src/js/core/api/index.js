/**
 * API Module Index for MarketPlace
 * Exports all API services and utilities for easy importing
 */

import apiClient from './apiClient.js';
import API_ENDPOINTS from './endpoints.js';
import * as tokenManager from './tokenManager.js';

// Import all services
import * as authService from './services/authService.js';
import * as productsService from './services/productsService.js';
import * as profileService from './services/profileService.js';
import * as transactionsService from './services/transactionsService.js';

// Export everything
export {
    apiClient,
    API_ENDPOINTS,
    tokenManager,
    authService,
    productsService,
    profileService,
    transactionsService
};

// Default export for convenience
export default {
    apiClient,
    endpoints: API_ENDPOINTS,
    tokenManager,
    auth: authService,
    products: productsService,
    profile: profileService,
    transactions: transactionsService
};