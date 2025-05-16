/**
 * Shared Imports
 *
 * This file imports all JavaScript files from the shared directory
 * to make it easier to include all shared functionality with a single import.
 */

// Import all shared JavaScript files
import "./auth-header.js";
import "./cart-manager.js";
import "./cart-utils.js";
import "./notifications.js";
import "./product-navigation.js";
import "./products-service.js";
import "./search-loader.js";
import "./search.js";
import "./svg-fixer.js";
import "./wave-animation.js";

/**
 * Export a function to initialize all shared components
 * This can be called to ensure all shared modules are properly initialized
 */
export function initializeSharedComponents() {
  console.log("Initializing all shared components...");

  // Initialize components that need explicit initialization
  if (window.notifications) {
    console.log("Notification system already initialized");
  }

  if (typeof updateCartBadge === "function") {
    updateCartBadge();
  }

  return {
    status: "All shared components initialized",
    timestamp: new Date().toISOString(),
  };
}

// Auto-initialize when this file is imported
document.addEventListener("DOMContentLoaded", () => {
  initializeSharedComponents();
});
