// Main authentication module - imports and initializes all auth functionality

import { authService, tokenManager } from "../core/api/index.js";
import { clearAuthData } from "./login.js";

// Helper function to parse cookies
function getCookieValue(name) {
  const cookies = document.cookie
    .split(";")
    .map((cookie) => cookie.trim().split("="))
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});

  return cookies[name];
}

// Main authentication utility functions
const Auth = {
  // Check if user is authenticated
  isAuthenticated: () => {
    // First check our token manager
    const token = tokenManager.getAccessToken();
    if (token && !tokenManager.isTokenExpired()) {
      return true;
    }

    // Backward compatibility - check cookies
    const TOKEN_KEY = tokenManager.TOKEN_STORAGE.ACCESS_TOKEN;
    const TOKEN_EXPIRY_KEY = tokenManager.TOKEN_STORAGE.TOKEN_EXPIRY;
    const USER_DATA_KEY = "userData"; // Legacy key

    const cookieToken = getCookieValue(TOKEN_KEY);
    const cookieExpiry = getCookieValue(TOKEN_EXPIRY_KEY);

    if (!cookieToken || !cookieExpiry) {
      return false;
    }

    // Check if token is expired
    const now = new Date().getTime();
    const isValid = now < parseInt(cookieExpiry);

    // If token is valid in cookies but not in our token manager,
    // let's migrate it to our new system
    if (isValid && !token) {
      localStorage.setItem(TOKEN_KEY, cookieToken);
      localStorage.setItem(TOKEN_EXPIRY_KEY, cookieExpiry);
    }

    return isValid;
  },

  // Get the stored auth token
  getToken: () => {
    // Primarily use tokenManager, but fall back to cookies for backward compatibility
    const token = tokenManager.getAccessToken();

    if (token) {
      return token;
    }

    const TOKEN_KEY = tokenManager.TOKEN_STORAGE.ACCESS_TOKEN;
    return getCookieValue(TOKEN_KEY);
  },

  // Get user data
  getUserData: async () => {
    // Try to get from storage first
    const USER_DATA_KEY = "userData"; // Legacy key
    const userData =
      localStorage.getItem(USER_DATA_KEY) ||
      sessionStorage.getItem(USER_DATA_KEY);

    if (userData) {
      return JSON.parse(userData);
    }

    // If not in storage, fetch from API
    try {
      if (!Auth.isAuthenticated()) return null;

      // Use the authService to get user profile
      const user = await authService.getUserProfile();

      // Update storage with user data
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));

      return user;
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  },

  // Check if token needs refresh and refresh if needed
  checkAndRefreshToken: async () => {
    try {
      // Use tokenManager to check if token is expiring
      if (!tokenManager.getAccessToken()) {
        return false;
      }

      // If token is expired or about to expire, refresh it
      if (tokenManager.isTokenExpired(300)) {
        // 5 minutes buffer
        const refreshed = await tokenManager.refreshAccessToken();

        // Also update cookies for backward compatibility
        if (refreshed) {
          const token = tokenManager.getAccessToken();
          const expiryTime = localStorage.getItem(
            tokenManager.TOKEN_STORAGE.TOKEN_EXPIRY
          );
          const expiryDate = new Date(parseInt(expiryTime));

          // Set cookies
          const TOKEN_KEY = tokenManager.TOKEN_STORAGE.ACCESS_TOKEN;
          const TOKEN_EXPIRY_KEY = tokenManager.TOKEN_STORAGE.TOKEN_EXPIRY;

          document.cookie = `${TOKEN_KEY}=${token}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
          document.cookie = `${TOKEN_EXPIRY_KEY}=${expiryTime}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
        }

        return refreshed;
      }

      // Validate token with backend
      return await tokenManager.validateToken();
    } catch (error) {
      console.error("Error checking/refreshing token:", error);
      return false;
    }
  },

  // Logout the current user
  logout: () => {
    // Use the authService to logout
    authService.logout();

    // Also use the legacy function to clear cookies
    clearAuthData();

    // Redirect to login page with absolute path
    window.location.href = "/frontend/src/pages/auth/auth.html";
  },
};

// Check if we need to automatically redirect unauthorized users
document.addEventListener("DOMContentLoaded", () => {
  // Get the current path
  const currentPath = window.location.pathname;

  // This will only run on non-auth pages
  if (!currentPath.includes("/pages/auth/") && !currentPath.includes("/pages/Auth/")) {
    if (!Auth.isAuthenticated()) {
      // Redirect to login page if not authenticated using absolute path
      window.location.href = "/frontend/src/pages/auth/auth.html";
    } else {
      // If authenticated, periodically check if token needs refresh
      setInterval(Auth.checkAndRefreshToken, 300000); // Check every 5 minutes
    }
  }
});

// Export the Auth object for use in other files
export default Auth;
