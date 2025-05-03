/**
 * API Endpoints for MarketPlace
 * Central definition of all API endpoints used in the application
 */

// API endpoints organized by domain/functionality
const API_ENDPOINTS = {
    auth: {
        register: '/api/v0/auth/register',
        login: '/api/v0/auth/login',
        refreshToken: '/api/v0/auth/refresh-token',
        profile: '/api/v0/auth/profile',
        tokenStatus: '/api/v0/auth/token-status'
    },
    
    products: {
        list: '/api/v0/items',
        details: (id) => `/api/v0/items/${id}`,
        search: '/api/v0/search/items'
    },
    
    profile: {
        details: '/api/v0/profile',
        update: '/api/v0/profile'
    },
    
    transactions: {
        list: '/api/v0/transactions',
        create: '/api/v0/transactions',
        details: (id) => `/api/v0/transactions/${id}`
    }
};

export default API_ENDPOINTS;