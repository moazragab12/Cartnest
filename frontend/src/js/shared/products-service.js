// products.service.js

// Dependencies - adjust paths as per your project structure
import { makeProductCardClickable } from "./product-navigation.js";
import { createCartButton } from "./cart-utils.js";

// --- Configuration ---
const API_BASE_URL = "http://localhost:8000"; // Consider making this configurable

// --- Internal Helper Functions ---

/**
 * Calculate discount percentage.
 */
function _calculateDiscount(currentPrice, originalPrice) {
  if (!originalPrice || originalPrice <= currentPrice) return 0;
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

/**
 * Creates an HTML element with specified properties and appends it to a parent element.
 */
function _createAndAppendElement(parentElement, {
  tag = "div",
  className = "",
  textContent = "",
  attributes = {},
  eventListeners = {},
} = {}) {
  if (!(parentElement instanceof HTMLElement)) {
    console.error('Invalid parentElement provided to _createAndAppendElement. Must be an HTMLElement.', parentElement);
    return null;
  }
  const el = document.createElement(tag);
  if (className) {
    el.className = className;
  }
  if (textContent) {
    el.textContent = textContent;
  }
  for (const attr in attributes) {
    el.setAttribute(attr, attributes[attr]);
  }
  for (const eventType in eventListeners) {
    el.addEventListener(eventType, eventListeners[eventType]);
  }
  parentElement.appendChild(el);
  return el;
}

/**
 * Creates an HTML element for a single product. (Internal helper)
 */
function _createProductCardElement(product) {
  if (!product || typeof product !== 'object') {
    console.error("Invalid product data provided to _createProductCardElement", product);
    return null;
  }

  const discount = _calculateDiscount(product.price, product.original_price);

  const productCard = document.createElement('div');
  productCard.className = "product-card";
  if (product.item_id) {
    productCard.dataset.itemId = product.item_id;
  }

  if (discount > 0) {
    _createAndAppendElement(productCard, {
      tag: "span", className: "discount-badge", textContent: `-${discount}%`,
    });
  }

  if (product.category) {
    _createAndAppendElement(productCard, {
      tag: "span", className: "category-badge", textContent: product.category,
    });
  }

  const productImage = _createAndAppendElement(productCard, { className: "product-image" });
  if (!productImage) return productCard;

  const totalImages = 27;
  const imageNumber = ((Number(product.item_id) || 0) % totalImages) + 1;

  _createAndAppendElement(productImage, {
    tag: "img",
    attributes: {
      src: `./public/resources/images/products/${imageNumber}-thumbnail.jpg`,
      alt: product.name || "Product image",
    },
    eventListeners: {
      error: function() { this.src = "./public/resources/images/products/smartwatch.jpg"; },
    },
  });

  const productContent = _createAndAppendElement(productCard, { className: "product-content" });
  if (!productContent) return productCard;
  const productDetails = _createAndAppendElement(productContent, { className: "product-details" });
  if (!productDetails) return productCard;
  const productInfo = _createAndAppendElement(productDetails, { className: "product-info" });
  if (!productInfo) return productCard;

  _createAndAppendElement(productInfo, {
    tag: "h3", className: "product-title", textContent: product.name || "Unnamed Product",
  });

  let ratingValue;
  let ratingCountValue;
  if (product.rating !== undefined && product.rating !== null) {
    ratingValue = parseFloat(product.rating);
    ratingCountValue = parseInt(product.rating_count, 10) || 0;
  } else {
    ratingValue = Math.floor(Math.random() * 11) / 2.0;
    ratingCountValue = Math.floor(Math.random() * 1001);
  }

  const productRating = _createAndAppendElement(productInfo, { className: "product-rating" });
  if (productRating) {
    const starsText = "★".repeat(Math.floor(ratingValue)) + (ratingValue % 1 >= 0.5 ? "½" : "");
    _createAndAppendElement(productRating, { tag: "span", className: "stars", textContent: starsText });
    _createAndAppendElement(productRating, { tag: "span", className: "rating-count", textContent: `(${ratingCountValue})` });
  }

  if (product.description) {
    _createAndAppendElement(productInfo, {
      className: "product-description",
      textContent: product.description.substring(0, 60) + (product.description.length > 60 ? "..." : ""),
    });
  }

  const purchaseArea = _createAndAppendElement(productDetails, { className: "purchase-area" });
  if (purchaseArea) {
    const productPrice = _createAndAppendElement(purchaseArea, { className: "product-price" });
    if (productPrice) {
      _createAndAppendElement(productPrice, {
        tag: "span", className: "current-price", textContent: `$${(product.price || 0).toFixed(2)}`,
      });
      if (discount > 0 && product.original_price) {
        _createAndAppendElement(productPrice, {
          tag: "span", className: "original-price", textContent: `$${product.original_price.toFixed(2)}`,
        });
      }
    }
    if (product.item_id) {
        const cartButton = createCartButton(product.item_id); // createCartButton is imported
        if (cartButton instanceof HTMLElement) {
            purchaseArea.appendChild(cartButton);
        } else {
            console.warn("createCartButton did not return an HTMLElement for product:", product.item_id);
        }
    }
  }
  
  if (product.item_id) {
    makeProductCardClickable(productCard, product.item_id); // makeProductCardClickable is imported
  }
  return productCard;
}

/**
 * Fetches product data. (Internal helper)
 */
async function _fetchProductsFromAPI(endpointPath, limit) {
  const pathParts = endpointPath.split('/');
  const descriptivePart = pathParts[pathParts.length - 1] || "unknown_endpoint";
  const errorContext = `${descriptivePart} products`;

  try {
    const url = `${API_BASE_URL}${endpointPath}?limit=${limit}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} while fetching ${errorContext}`);
    }
    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error(`Error fetching ${errorContext}:`, error);
    return []; // Return empty array to allow UI to show "no products" message
  }
}

// --- Main Exportable Interface Function ---

/**
 * Fetches products from a given API endpoint and renders them into the specified container.
 * @param {string} containerSelector - CSS selector for the DOM element where products will be rendered.
 * @param {string} apiEndpointPath - The API path to fetch products from (e.g., "/api/v0/items/featured").
 * @param {number} limit - The maximum number of products to fetch and display.
 * @param {object} [options={}] - Optional parameters.
 * @param {string} [options.loadingMessage="Loading products..."] - Message shown while fetching.
 * @param {string} [options.noProductsMessage="No products available."] - Message shown if no products are found.
 * @returns {Promise<void>}
 */
export async function loadAndDisplayProducts(
  containerSelector,
  apiEndpointPath,
  limit,
  options = {}
) {
  const {
    loadingMessage = "Loading products...",
    noProductsMessage = "No products available."
  } = options;

  const container = document.querySelector(containerSelector);
  if (!container) {
    console.error(`Product display container not found: ${containerSelector}`);
    return;
  }

  container.innerHTML = `<p>${loadingMessage}</p>`; // Display loading message

  try {
    const products = await _fetchProductsFromAPI(apiEndpointPath, limit);

    container.innerHTML = ""; // Clear loading message

    if (!products || products.length === 0) {
      container.innerHTML = `<p>${noProductsMessage}</p>`;
      return;
    }

    products.forEach((product) => {
      const productCardElement = _createProductCardElement(product);
      if (productCardElement instanceof HTMLElement) {
        container.appendChild(productCardElement);
      }
    });
  } catch (error) {
    // This catch is more for unexpected errors during the orchestration,
    // as _fetchProductsFromAPI has its own error handling.
    console.error("An unexpected error occurred in loadAndDisplayProducts:", error);
    container.innerHTML = `<p>Oops! Something went wrong while loading products.</p>`;
  }
}