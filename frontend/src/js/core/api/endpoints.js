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
    items: {
        list: '/api/v0/items/',
        featured: '/api/v0/items/featured',
        recent: '/api/v0/items/recent',
        categories: '/api/v0/items/categories',
        byCategory: (category) => `/api/v0/items/categories/${category}`,
        details: (id) => `/api/v0/items/${id}`
    },
    search: {
        searchItem: '/api/v0/search/items/search_item',
        getItem: (id) => `/api/v0/search/items/${id}`
    },
    profile: {
        items: {
            create: '/api/v0/profile/items',
            list: '/api/v0/profile/items',
            details: (id) => `/api/v0/profile/items/${id}`,
            update: (id) => `/api/v0/profile/items/${id}`,
            delete: (id) => `/api/v0/profile/items/${id}`
        },
        wallet: {
            deposit: '/api/v0/profile/wallet/deposit',
            balance: '/api/v0/profile/wallet/balance',
            transactions: '/api/v0/profile/wallet/transactions'
        },
        overview: '/api/v0/profile/overview'
    },
    transactions: {
        purchase: '/api/v0/transactions/purchase',
        list: '/api/v0/transactions/',
        details: (id) => `/api/v0/transactions/${id}`,
        transfer: '/api/v0/transactions/transfer'
    }
};

export default API_ENDPOINTS;