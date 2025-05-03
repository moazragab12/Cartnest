// Base API URL - adjust this based on your backend configuration
const API_BASE_URL = 'http://localhost:8000';

// Authentication API endpoints
const AUTH_API = {
    register: `${API_BASE_URL}/api/v0/auth/register`,
    login: `${API_BASE_URL}/api/v0/auth/login`,
    refreshToken: `${API_BASE_URL}/api/v0/auth/refresh-token`,
    profile: `${API_BASE_URL}/api/v0/auth/profile`,
    tokenStatus: `${API_BASE_URL}/api/v0/auth/token-status`
};

// Helper function to handle API responses
const handleResponse = async (response) => {
    const data = await response.json();
    
    if (!response.ok) {
        const error = data.detail || 'An error occurred';
        throw new Error(error);
    }
    
    return data;
};

// User registration function
async function registerUser(username, email, password) {
    try {
        const response = await fetch(AUTH_API.register, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                email,
                password
            })
        });

        return await handleResponse(response);
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

// User login function - uses the OAuth2 form format as required by the backend
async function loginUser(username, password) {
    try {
        // Create form data for OAuth2 password flow
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        const response = await fetch(AUTH_API.login, {
            method: 'POST',
            body: formData
        });

        return await handleResponse(response);
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

// Get user profile information
async function getUserProfile(token) {
    try {
        const response = await fetch(AUTH_API.profile, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return await handleResponse(response);
    } catch (error) {
        console.error('Get profile error:', error);
        throw error;
    }
}

// Refresh token function
async function refreshToken(token) {
    try {
        const response = await fetch(AUTH_API.refreshToken, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return await handleResponse(response);
    } catch (error) {
        console.error('Token refresh error:', error);
        throw error;
    }
}

// Check token status
async function checkTokenStatus(token) {
    try {
        // Create form data for OAuth2 form
        const formData = new FormData();
        formData.append('username', ''); // These fields might be required by the OAuth2PasswordRequestForm
        formData.append('password', '');
        
        const response = await fetch(AUTH_API.tokenStatus, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        return await handleResponse(response);
    } catch (error) {
        console.error('Token status check error:', error);
        throw error;
    }
}

// Export API functions
export {
    registerUser,
    loginUser,
    getUserProfile,
    refreshToken,
    checkTokenStatus
};