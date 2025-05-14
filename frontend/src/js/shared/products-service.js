// product.service.js

// Dependencies - using shared utilities for consistent behavior
import { makeProductCardClickable } from "./product-navigation.js";
import { createCartButton } from "./cart-utils.js";

// --- Configuration ---
const API_BASE_URL = "http://localhost:8000"; // Consider making this configurable

// =================================================================================
// === MAIN PUBLIC INTERFACE / EXPORTABLE FUNCTIONS                            ===
// =================================================================================

/**
 * Fetches products from a given API endpoint and renders them into the specified container.
 * This is the primary function to be used by other parts of the application.
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
    noProductsMessage = "No products available.",
  } = options;

  const container = document.querySelector(containerSelector);
  if (!container) {
    console.error(`Product display container not found: ${containerSelector}`);
    return;
  }

  container.innerHTML = `<p class="product-loading-message">${loadingMessage}</p>`; // Display loading message

  try {
    // _fetchProductsFromAPI is defined later in this file
    const products = await _fetchProductsFromAPI(apiEndpointPath, limit);

    container.innerHTML = ""; // Clear loading message

    if (!products || products.length === 0) {
      container.innerHTML = `<p class="product-no-results-message">${noProductsMessage}</p>`;
      return;
    }

    products.forEach((product) => {
      // _createProductCardElement is defined later in this file
      const productCardElement = _createProductCardElement(product);
      if (productCardElement instanceof HTMLElement) {
        container.appendChild(productCardElement);
      }
    });
  } catch (error) {
    console.error(
      "An unexpected error occurred in loadAndDisplayProducts:",
      error
    );
    container.innerHTML = `<p class="product-error-message">Oops! Something went wrong while loading products.</p>`;
  }
}

/**
 * Renders an array of products into the specified container.
 * This is used primarily for rendering pre-fetched product data.
 * @param {string} containerSelector - CSS selector for the DOM element where products will be rendered.
 * @param {Array<object>} productsArray - Array of product objects to render.
 * @param {number} totalCount - Total count of products (might be more than array length if paginated)
 * @param {object} [options={}] - Optional parameters.
 * @param {string} [options.loadingMessage="Loading products..."] - Message shown while rendering.
 * @param {string} [options.noProductsMessage="No products available."] - Message shown if no products are found.
 * @param {function} [options.onRenderComplete] - Callback after rendering is complete.
 * @returns {Promise<void>}
 */
export async function renderProductsFromArray(
  containerSelector,
  productsArray,
  totalCount,
  options = {}
) {
  const {
    loadingMessage = "Loading products...",
    noProductsMessage = "No products available.",
    onRenderComplete = () => {},
  } = options;

  const container = document.querySelector(containerSelector);
  if (!container) {
    console.error(`Product display container not found: ${containerSelector}`);
    return;
  }

  // Show loading message
  container.innerHTML = `<p class="product-loading-message">${loadingMessage}</p>`;

  // Small delay to ensure loading message is rendered before proceeding
  await new Promise((resolve) => setTimeout(resolve, 100));

  try {
    // Clear loading message
    container.innerHTML = "";

    if (!productsArray || productsArray.length === 0) {
      container.innerHTML = `<p class="product-no-results-message">${noProductsMessage}</p>`;
      if (onRenderComplete) onRenderComplete(0, totalCount);
      return;
    }

    // Render each product
    productsArray.forEach((product) => {
      const productCardElement = _createProductCardElement(product);
      if (productCardElement instanceof HTMLElement) {
        container.appendChild(productCardElement);
      }
    });

    // Call the callback with the count of rendered products
    if (onRenderComplete) {
      onRenderComplete(productsArray.length, totalCount);
    }
  } catch (error) {
    console.error("Error in renderProductsFromArray:", error);
    container.innerHTML = `<p class="product-error-message">Oops! Something went wrong while rendering products.</p>`;
    if (onRenderComplete) onRenderComplete(0, totalCount);
  }
}

// =================================================================================
// === INTERNAL DATA FETCHING HELPERS                                          ===
// =================================================================================

/**
 * Fetches product data from the API. (Internal helper for loadAndDisplayProducts)
 * @param {string} endpointPath - The specific API endpoint path.
 * @param {number} limit - The number of products to limit.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of product objects.
 */
async function _fetchProductsFromAPI(endpointPath, limit) {
  const pathParts = endpointPath.split("/");
  const descriptivePart = pathParts[pathParts.length - 1] || "unknown_endpoint";
  const errorContext = `${descriptivePart} products`;

  try {
    const url = `${API_BASE_URL}${endpointPath}?limit=${limit}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `HTTP error! status: ${response.status} while fetching ${errorContext}`
      );
    }
    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error(`Error fetching ${errorContext}:`, error);
    return []; // Return empty array to allow UI to show "no products" message
  }
}

// =================================================================================
// === GENERAL INTERNAL UTILITY FUNCTIONS                                      ===
// =================================================================================

/**
 * Calculates the discount percentage between an original price and a current price.
 * @param {number} currentPrice - The current (potentially discounted) price.
 * @param {number} originalPrice - The original price.
 * @returns {number} The discount percentage, or 0 if no discount.
 */
function _calculateDiscount(currentPrice, originalPrice) {
  if (!originalPrice || !currentPrice || originalPrice <= currentPrice)
    return 0;
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

/**
 * Creates an HTML element with specified properties and appends it to a parent element.
 * This is a general utility for DOM manipulation within this service.
 * @param {HTMLElement} parentElement - The DOM element to append the new element to.
 * @param {object} [options={}] - Configuration options for the new element.
 * @param {string} [options.tag="div"] - The HTML tag for the new element.
 * @param {string} [options.className=""] - CSS class(es) for the new element.
 * @param {string} [options.textContent=""] - Text content for the new element.
 * @param {object} [options.attributes={}] - HTML attributes to set on the new element.
 * @param {object} [options.eventListeners={}] - Event listeners to add to the new element.
 * @returns {HTMLElement|null} The created element, or null if parentElement is invalid.
 */
function _createAndAppendElement(
  parentElement,
  {
    tag = "div",
    className = "",
    textContent = "",
    attributes = {},
    eventListeners = {},
  } = {}
) {
  if (!(parentElement instanceof HTMLElement)) {
    console.error(
      "Invalid parentElement provided to _createAndAppendElement. Must be an HTMLElement.",
      parentElement
    );
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
    if (Object.prototype.hasOwnProperty.call(attributes, attr)) {
      el.setAttribute(attr, attributes[attr]);
    }
  }
  for (const eventType in eventListeners) {
    if (Object.prototype.hasOwnProperty.call(eventListeners, eventType)) {
      el.addEventListener(eventType, eventListeners[eventType]);
    }
  }
  parentElement.appendChild(el);
  return el;
}

// =================================================================================
// === PRODUCT CARD CREATION LOGIC (IMPLEMENTATION DETAILS)                     ===
// =================================================================================

/**
 * Creates a product card DOM element.
 * This orchestrates the various parts of the product card.
 * @param {object} product - The product data object.
 * @returns {HTMLElement|null} The created product card element or null if product data is invalid.
 */
export function _createProductCardElement(product) {
  if (!product || typeof product !== "object") {
    console.error(
      "Invalid product data provided to _createProductCardElement:",
      product
    );
    return null;
  }

  const discount = _calculateDiscount(product.price, product.original_price);

  const productCard = document.createElement("div");
  productCard.className = "product-card";
  if (product.item_id) {
    productCard.dataset.itemId = product.item_id;
  }

  // 1. Add Badges
  _createProductBadges(productCard, product, discount);

  // 2. Add Product Image
  _createProductImageWithFallback(productCard, product);

  // 3. Create Content Structure
  const productContent = _createAndAppendElement(productCard, {
    className: "product-content",
  });
  if (!productContent) return productCard;

  const productDetails = _createAndAppendElement(productContent, {
    className: "product-details",
  });
  if (!productDetails) return productCard;

  const productInfo = _createAndAppendElement(productDetails, {
    className: "product-info",
  });
  if (!productInfo) return productCard;

  // 3a. Add Title
  _createAndAppendElement(productInfo, {
    tag: "h3",
    className: "product-title",
    textContent: product.name || "Unnamed Product",
  });

  // 3b. Add Rating Display
  _createProductRatingDisplay(productInfo, product);

  // 3c. Add Description
  if (product.description) {
    _createAndAppendElement(productInfo, {
      className: "product-description",
      textContent:
        product.description.substring(0, 60) +
        (product.description.length > 60 ? "..." : ""),
    });
  }

  // 4. Add Purchase Area
  _createProductPurchaseArea(productDetails, product, discount);

  // 5. Make card clickable (if applicable and function is available)
  if (product.item_id && typeof makeProductCardClickable === "function") {
    makeProductCardClickable(productCard, product.item_id);
  }

  return productCard;
}

// --- Helper Functions for _createProductCardElement ---

/**
 * Creates and appends product badges (discount and category) to the parent element.
 * @param {HTMLElement} parentElement - The parent element to append badges to.
 * @param {object} product - The product data object.
 * @param {number} discount - The calculated discount percentage.
 */
function _createProductBadges(parentElement, product, discount) {
  if (discount > 0) {
    _createAndAppendElement(parentElement, {
      tag: "span",
      className: "discount-badge",
      textContent: `-${discount}%`,
    });
  }

  if (product.category) {
    _createAndAppendElement(parentElement, {
      tag: "span",
      className: "category-badge",
      textContent: product.category,
    });
  }
}

/**
 * Creates and appends the product image with a fallback mechanism.
 * @param {HTMLElement} parentElement - The parent element to append the image to.
 * @param {object} product - The product data object.
 */
function _createProductImageWithFallback(parentElement, product) {
  const productImageWrapper = _createAndAppendElement(parentElement, {
    className: "product-image",
  });
  if (!productImageWrapper) return;

  const totalImages = 27; // Define or fetch this configuration appropriately
  const imageNumber = ((Number(product.item_id) || 0) % totalImages) + 1;

  // Use absolute path from the root of the project
  // This will work both in index page and productList page
  const imagePath = window.location.pathname.includes("/pages")
    ? "../../../public/resources/images/products/"
    : "./public/resources/images/products/";

  _createAndAppendElement(productImageWrapper, {
    tag: "img",
    attributes: {
      src: `${imagePath}${imageNumber}-thumbnail.jpg`,
      alt: product.name || "Product image",
      loading: "lazy", // Added for performance
    },
    eventListeners: {
      error: function () {
        const fallbackPath = window.location.pathname.includes(
          "/pages/productsList"
        )
          ? "../../../public/resources/images/products/smartwatch.jpg"
          : "./public/resources/images/products/smartwatch.jpg";
        this.src = fallbackPath; // Fallback image with correct path
        this.alt = "Fallback product image";
      },
    },
  });
}

/**
 * Creates and appends the product rating display (stars and review count).
 * @param {HTMLElement} parentElement - The parent element to append the rating display to.
 * @param {object} product - The product data object.
 */
function _createProductRatingDisplay(parentElement, product) {
  let ratingValue;
  let ratingCountValue;

  if (product.rating !== undefined && product.rating !== null) {
    ratingValue = parseFloat(product.rating);
    ratingCountValue = Number.isInteger(product.rating_count)
      ? product.rating_count
      : parseInt(product.rating_count, 10) || 0;
  } else {
    ratingValue = Math.floor(Math.random() * 9) / 2.0 + 1.0; // Generates 1.0 to 5.0
    ratingCountValue = Math.floor(Math.random() * 1001); // Random count 0-1000
  }

  const ratingDisplayWrapper = _createAndAppendElement(parentElement, {
    className: "rating-display",
  });
  if (!ratingDisplayWrapper) return;

  const starsContainer = _createAndAppendElement(ratingDisplayWrapper, {
    className: "stars-container",
  });
  if (starsContainer) {
    const fullStars = Math.floor(ratingValue);
    const hasHalfStar = ratingValue % 1 >= 0.45 && ratingValue % 1 < 0.95;

    for (let i = 0; i < 5; i++) {
      const starSpan = _createAndAppendElement(starsContainer, {
        tag: "span",
        className: "star-icon",
      });
      if (starSpan) {
        if (i < fullStars) {
          starSpan.textContent = "★";
          starSpan.classList.add("star-icon--filled");
        } else if (i === fullStars && hasHalfStar) {
          starSpan.textContent = "★"; // Character for half, styled by class
          starSpan.classList.add("star-icon--half-filled");
        } else {
          starSpan.textContent = "☆";
          starSpan.classList.add("star-icon--empty");
        }
      }
    }
  }

  if (typeof ratingCountValue === "number" && ratingCountValue >= 0) {
    _createAndAppendElement(ratingDisplayWrapper, {
      tag: "span",
      className: "review-count",
      textContent: `(${ratingCountValue})`,
    });
  }
}

/**
 * Creates and appends the purchase area (price and cart button).
 * @param {HTMLElement} parentElement - The parent element to append the purchase area to.
 * @param {object} product - The product data object.
 * @param {number} discount - The calculated discount percentage.
 */
function _createProductPurchaseArea(parentElement, product, discount) {
  const purchaseArea = _createAndAppendElement(parentElement, {
    className: "purchase-area",
  });
  if (!purchaseArea) return;

  const productPrice = _createAndAppendElement(purchaseArea, {
    className: "product-price",
  });
  if (productPrice) {
    _createAndAppendElement(productPrice, {
      tag: "span",
      className: "current-price",
      textContent: `$${(product.price || 0).toFixed(2)}`,
    });
    if (discount > 0 && product.original_price) {
      _createAndAppendElement(productPrice, {
        tag: "span",
        className: "original-price",
        textContent: `$${product.original_price.toFixed(2)}`,
      });
    }
  }

  if (product.item_id && typeof createCartButton === "function") {
    const cartButton = createCartButton(product.item_id);
    if (cartButton instanceof HTMLElement) {
      purchaseArea.appendChild(cartButton);
    } else {
      console.warn(
        "createCartButton did not return an HTMLElement for product:",
        product.item_id
      );
    }
  }
}
