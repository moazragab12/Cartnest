// homepage-controller.js

// Import the main function from the shared products service
import { loadAndDisplayProducts } from "../shared/products-service.js";
// Import cart utilities from the shared directory
import { initCartBadge } from "../shared/cart-utils.js";

/**
 * Sets up the display of featured products on the homepage.
 */
async function displayFeaturedProducts() {
  const containerSelector = ".featured-products-section .products-grid";
  const apiEndpointPath = "/api/v0/items/featured";
  const limit = 4;
  const options = {
    loadingMessage: "Loading our top picks for you...",
    noProductsMessage: "No featured items to show right now. Check back soon!",
  };

  await loadAndDisplayProducts(
    containerSelector,
    apiEndpointPath,
    limit,
    options
  );
}

/**
 * Sets up the display of popular products on the homepage.
 * (Using "recent" items as a proxy for "popular")
 */
async function displayPopularProducts() {
  const containerSelector = ".popular-products-section .products-grid";
  const apiEndpointPath = "/api/v0/items/recent"; // Using recent as popular
  const limit = 8;
  const options = {
    loadingMessage: "Fetching what's popular...",
    noProductsMessage: "Looks like nothing's trending at the moment.",
  };

  await loadAndDisplayProducts(
    containerSelector,
    apiEndpointPath,
    limit,
    options
  );
}

/**
 * Initializes all UI components and product displays for the homepage.
 */
function initializeHomepage() {
  // Initialize other UI elements like the cart badge if needed
  initCartBadge();

  // Load and display the different product sections
  displayFeaturedProducts();
  displayPopularProducts();

  // You could add more calls to loadAndDisplayProducts here for other sections
  // e.g., displayNewArrivals(), displayOnSaleItems(), etc.
}

// Wait for the DOM to be fully loaded before initializing the homepage
document.addEventListener("DOMContentLoaded", initializeHomepage);
