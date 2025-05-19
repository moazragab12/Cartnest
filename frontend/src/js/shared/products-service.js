// product.service.js

// Dependencies - using shared utilities for consistent behavior
import { makeProductCardClickable } from "./product-navigation.js";
import { createCartButton } from "./cart-utils.js";

// --- Configuration ---
const API_BASE_URL = "http://localhost:8000"; // Consider making this configurable

// =================================================================================
// === MAIN PUBLIC INTERFACE / EXPORTABLE FUNCTIONS                            ===
// =================================================================================

export async function loadAndDisplayProducts(
  containerSelector,
  apiEndpointPath,
  limit,
  options = {}
) {
  const {
    loadingMessage = "Loading products...",
    noProductsMessage = "No products available.",
    errorMessage = "Oops! Something went wrong while loading products.", // Added for consistency
  } = options;

  // console.log(`Loading products from: ${apiEndpointPath} with limit: ${limit}`);

  const container = document.querySelector(containerSelector);
  if (!container) {
    console.error(`Product display container not found: ${containerSelector}`);
    return;
  }

  const showMessage = (message, className) => {
    container.innerHTML = `<p class="${className}">${message}</p>`;
  };

  showMessage(loadingMessage, "product-loading-message");

  try {
    const products = await _fetchProductsFromAPI(apiEndpointPath, limit);
    // console.log(
    //   `Received ${products?.length || 0} products from ${apiEndpointPath}`
    // );

    // Clear previous content (loading message or old products) using a loop for robustness
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    if (!products || products.length === 0) {
      showMessage(noProductsMessage, "product-no-results-message");
      return;
    }

    // Use a DocumentFragment for performance when appending multiple elements
    const fragment = document.createDocumentFragment();
    products.forEach((product) => {
      const productCardElement = _createProductCardElement(product);
      if (productCardElement instanceof HTMLElement) {
        fragment.appendChild(productCardElement);
      }
    });
    container.appendChild(fragment);

  } catch (error) {
    console.error(
      "An unexpected error occurred in loadAndDisplayProducts:",
      error
    );
    showMessage(errorMessage, "product-error-message");
  }
}

export async function renderProductsFromArray(
  containerSelector,
  productsArray,
  totalCount,
  options = {}
) {
  const {
    loadingMessage = "Rendering products...",
    noProductsMessage = "No products available.",
    errorMessage = "Oops! Something went wrong while rendering products.", // Added for consistency
    onRenderComplete = () => {},
  } = options;

  const container = document.querySelector(containerSelector);
  if (!container) {
    console.error(`Product display container not found: ${containerSelector}`);
    if (onRenderComplete) onRenderComplete(0, totalCount, true); // Indicate error
    return;
  }

  const showMessage = (message, className) => {
    container.innerHTML = `<p class="${className}">${message}</p>`;
  };

  showMessage(loadingMessage, "product-loading-message");

  // Removed artificial delay: await new Promise((resolve) => setTimeout(resolve, 100));
  // The rendering itself should be fast enough.

  try {
    // Clear previous content (loading message or old products)
     while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    if (!productsArray || productsArray.length === 0) {
      showMessage(noProductsMessage, "product-no-results-message");
      if (onRenderComplete) onRenderComplete(0, totalCount);
      return;
    }

    const fragment = document.createDocumentFragment();
    productsArray.forEach((product) => {
      const productCardElement = _createProductCardElement(product);
      if (productCardElement instanceof HTMLElement) {
        fragment.appendChild(productCardElement);
      }
    });
    container.appendChild(fragment);

    if (onRenderComplete) {
      onRenderComplete(productsArray.length, totalCount);
    }
  } catch (error) {
    console.error("Error in renderProductsFromArray:", error);
    showMessage(errorMessage, "product-error-message");
    if (onRenderComplete) onRenderComplete(0, totalCount, true); // Indicate error
  }
}

// =================================================================================
// === INTERNAL DATA FETCHING HELPERS                                          ===
// =================================================================================

async function _fetchProductsFromAPI(endpointPath, limit) {
  const pathParts = endpointPath.split("/");
  const descriptivePart = pathParts[pathParts.length - 1] || "unknown_endpoint";
  const errorContext = `${descriptivePart} products`;

  try {
    const urlObj = new URL(`${API_BASE_URL}${endpointPath}`);
    urlObj.searchParams.set('limit', String(limit)); // Ensure limit is a string

    if (endpointPath.includes("/items/recent")) {
      const days = 30; // Default to 30 days
      urlObj.searchParams.set('days', String(days)); // Ensure days is a string
    //   console.log(`Fetching recent items with URL: ${urlObj.toString()}`);
    // } else {
    //   console.log(`Fetching items with URL: ${urlObj.toString()}`);
    }

    const response = await fetch(urlObj.toString());
    if (!response.ok) {
      // Try to get more error details from response if possible
      let errorDetails = response.statusText;
      try {
        const errorData = await response.json();
        errorDetails = errorData.detail || errorData.message || errorDetails;
      } catch (e) { /* Ignore if response is not JSON */ }
      throw new Error(
        `HTTP error! status: ${response.status} (${errorDetails}) while fetching ${errorContext}`
      );
    }
    const data = await response.json();
    return data || []; // Ensure it returns an array
  } catch (error) {
    console.error(`Error fetching ${errorContext}:`, error);
    // Propagate the error so the caller can handle it (e.g., show specific error message)
    throw error;
  }
}

// =================================================================================
// === GENERAL INTERNAL UTILITY FUNCTIONS                                      ===
// =================================================================================

function _calculateDiscount(currentPrice, originalPrice) {
  if (!originalPrice || !currentPrice || Number(originalPrice) <= Number(currentPrice))
    return 0;
  return Math.round(((Number(originalPrice) - Number(currentPrice)) / Number(originalPrice)) * 100);
}

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

  _createProductBadges(productCard, product, discount);
  _createProductImageWithFallback(productCard, product); // Uses the refined image loading

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

  _createAndAppendElement(productInfo, {
    tag: "h3",
    className: "product-title",
    textContent: product.name || "Unnamed Product",
  });

  _createProductRatingDisplay(productInfo, product);

  if (product.description) {
    _createAndAppendElement(productInfo, {
      className: "product-description",
      textContent:
        product.description.substring(0, 60) +
        (product.description.length > 60 ? "..." : ""),
    });
  }

  _createProductPurchaseArea(productDetails, product, discount);

  if (product.item_id && typeof makeProductCardClickable === "function") {
    makeProductCardClickable(productCard, product.item_id);
  }

  return productCard;
}

// --- Helper Functions for _createProductCardElement ---

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
 * REFINED: Creates and appends the product image with a placeholder, spinner,
 * native lazy loading, and robust error handling.
 * @param {HTMLElement} parentElement - The parent element to append the image to.
 * @param {object} product - The product data object.
 */
function _createProductImageWithFallback(parentElement, product) {
  const productImageWrapper = _createAndAppendElement(parentElement, {
    className: "product-image", // This wrapper helps contain the absolute positioned image and placeholder
  });
  if (!productImageWrapper) return;

  const totalImages = 27;
  const imageNumber = ((Number(product.item_id) || Date.now()) % totalImages) + 1; // Fallback for item_id for unique image

  // Standardize image path determination
  let imagePathPrefix = "./public/resources/images/products/"; // Default for root
  if (window.location.pathname.includes("/pages/")) { // More general check for pages subdirectory
    imagePathPrefix = "../../../public/resources/images/products/";
  }
  
  const imgSrc = `${imagePathPrefix}${imageNumber}-thumbnail.jpg`;
  const imageId = `product-img-${product.item_id || Math.random().toString(36).substring(2, 9)}`;

  // 1. Create Placeholder (serves as a background and sizing element)
  const placeholder = document.createElement('div');
  placeholder.className = 'product-image-placeholder';
  // Basic styling for placeholder, can be enhanced via CSS for better visual integration
  placeholder.style.backgroundColor = '#f0f0f0'; // Light grey placeholder
  placeholder.style.width = '100%';
  placeholder.style.paddingBottom = '100%'; // Creates a square aspect ratio; adjust if images are not square
  placeholder.style.position = 'relative';  // For positioning spinner and image absolutely within it
  placeholder.style.overflow = 'hidden';    // Ensures spinner animation doesn't overflow
  productImageWrapper.appendChild(placeholder);

  // 2. Create Image Element
  const img = document.createElement('img');
  img.alt = product.name || "Product image";
  img.id = imageId;
  // Styling for the image to fit within the placeholder
  img.style.position = 'absolute';
  img.style.top = '0';
  img.style.left = '0';
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.objectFit = 'cover';   // Ensures the image covers the area, might crop
  img.style.opacity = '0';         // Start invisible, fade in on load
  img.style.transition = 'opacity 0.4s ease-in-out'; // Smooth fade-in
  
  img.setAttribute('loading', 'lazy');   // Native browser lazy loading
  img.setAttribute('decoding', 'async'); // Hint for browser to decode off main thread

  // 3. Create Loading Indicator (Spinner)
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'image-loading-indicator';
  // Styling for the spinner
  loadingIndicator.style.position = 'absolute';
  loadingIndicator.style.top = '50%';
  loadingIndicator.style.left = '50%';
  loadingIndicator.style.width = '30px'; // Adjust size as needed
  loadingIndicator.style.height = '30px';
  loadingIndicator.style.border = '3px solid rgba(0,0,0,0.1)'; // Light track
  loadingIndicator.style.borderTopColor = '#0b8ce0'; // Spinner color (theme color)
  loadingIndicator.style.borderRadius = '50%';
  loadingIndicator.style.animation = 'spin 1s linear infinite';
  loadingIndicator.style.transform = 'translate(-50%, -50%)'; // Center the spinner
  placeholder.appendChild(loadingIndicator); // Add spinner to placeholder

  // Ensure spinner CSS animation is defined (once per page load)
  if (!document.getElementById('image-loading-animation-style')) {
    const style = document.createElement('style');
    style.id = 'image-loading-animation-style';
    style.textContent = `
      @keyframes spin {
        0% { transform: translate(-50%, -50%) rotate(0deg); }
        100% { transform: translate(-50%, -50%) rotate(360deg); }
      }
      .image-loading-indicator { /* Ensures transform-origin for rotation if not in keyframes */
         transform-origin: center center;
      }
    `;
    document.head.appendChild(style);
  }

  // 4. Define onload and onerror handlers for the image
  img.onload = function() {
    this.style.opacity = '1'; // Fade in the loaded image
    if (loadingIndicator.parentNode) { // Remove spinner if it's still there
      loadingIndicator.parentNode.removeChild(loadingIndicator);
    }
    // Clear fallback attribute if it was set (e.g. original now loaded after a fallback attempt)
    this.removeAttribute('data-fallback-loaded');
  };

  img.onerror = function() {
    // Prevent an infinite loop if the fallback image also fails
    if (this.getAttribute('data-fallback-loaded')) {
      if (loadingIndicator.parentNode) {
        loadingIndicator.parentNode.removeChild(loadingIndicator);
      }
      placeholder.innerHTML = '<p style="text-align:center;padding-top:40%;font-size:11px;color:#777;">Image unavailable</p>';
      console.error(`Fallback image also failed to load for: ${this.alt}`);
      return;
    }

    // Determine fallback image path (ensure this logic is robust for your actual file structure)
    const fallbackSrc = `${imagePathPrefix}smartwatch.jpg`; // Ensure 'smartwatch.jpg' exists at this path

    this.src = fallbackSrc; // Attempt to load the fallback image
    this.alt = "Fallback product image"; // Update alt text
    this.setAttribute('data-fallback-loaded', 'true'); // Mark that fallback is being attempted
    // The `onload` (if fallback loads) or this `onerror` (if fallback also fails) will handle UI.
  };
  
  // 5. Set the image source. Native lazy loading will handle when to load.
  img.src = imgSrc;
  
  // 6. Append the image to the placeholder. It will sit on top due to absolute positioning.
  placeholder.appendChild(img);
}


function _createProductRatingDisplay(parentElement, product) {
  let ratingValue;
  let ratingCountValue;

  if (product.rating !== undefined && product.rating !== null) {
    ratingValue = parseFloat(product.rating);
    ratingCountValue = Number.isInteger(product.rating_count)
      ? product.rating_count
      : parseInt(product.rating_count, 10) || 0;
  } else {
    // More controlled random fallback
    ratingValue = Math.max(3.0, Math.min(5.0, (Math.floor(Math.random() * 5) / 2.0) + 3.0)); // 3.0 to 5.0 in 0.5 increments
    ratingCountValue = Math.floor(Math.random() * 200) + 10; // Random count 10-209
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
    const hasHalfStar = (ratingValue % 1) >= 0.45 && (ratingValue % 1) < 0.95; // Check for half star

    for (let i = 0; i < 5; i++) {
      const starSpan = _createAndAppendElement(starsContainer, {
        tag: "span",
        className: "star-icon", // General class for all stars
      });
      if (starSpan) {
        if (i < fullStars) {
          starSpan.textContent = "★"; // Filled star character
          starSpan.classList.add("star-icon--filled");
        } else if (i === fullStars && hasHalfStar) {
          starSpan.textContent = "★"; // Use filled star, CSS will handle half appearance
          starSpan.classList.add("star-icon--half-filled");
        } else {
          starSpan.textContent = "☆"; // Empty star character
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
      textContent: `$${(Number(product.price) || 0).toFixed(2)}`,
    });
    if (discount > 0 && product.original_price) {
      _createAndAppendElement(productPrice, {
        tag: "span",
        className: "original-price",
        textContent: `$${(Number(product.original_price) || 0).toFixed(2)}`,
      });
    }
  }

  if (product.item_id && typeof createCartButton === "function") {
    try {
      const cartButton = createCartButton(product.item_id);
      if (cartButton instanceof HTMLElement) {
        purchaseArea.appendChild(cartButton);
      } else {
        console.warn(
          "createCartButton did not return an HTMLElement for product:",
          product.item_id
        );
      }
    } catch (e) {
       console.error("Error calling createCartButton for product:", product.item_id, e);
    }
  }
}