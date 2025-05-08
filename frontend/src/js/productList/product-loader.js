/**
 * Product Loader Module for MarketPlace
 *
 * This module handles fetching products from the backend API and
 * dynamically rendering them in the product grid.
 */

import { cartManager } from "../shared/cart-manager.js";

class ProductLoader {
  constructor() {
    this.apiBaseUrl = "http://localhost:8000/api/v0/items/";
    this.products = [];
    this.allProducts = []; // Store all fetched products for pagination
    this.categories = [];
    this.currentFilters = {
      category: [],
      brands: [],
      features: [],
      priceRange: { min: 0, max: 999 },
      condition: [],
      rating: null,
      featured: false, // Add featured flag to track if featured/recent items are being shown
    };
    this.pagination = {
      currentPage: 1,
      itemsPerPage: 12, // Default items per page
      totalPages: 1,
    };
    this.productGrid = document.querySelector(".product-grid");
    this.categoryFilters = document.querySelectorAll(
      'details ul input[type="checkbox"]'
    );
    this.featureBox = document.querySelector(
      ".feature-box:not(.items-per-page)"
    );
    this.itemsPerPageSelect = document.querySelector(".items-per-page");
    this.paginationContainer = document.querySelector(".pagination");
  }

  /**
   * Initialize the product loader
   */
  async init() {
    try {
      // Fetch categories first
      await this.fetchCategories();

      // Get initial products
      await this.fetchProducts();

      // Setup filter event listeners
      this.setupFilterListeners();

      // Setup cart button event listeners
      this.setupCartButtonListeners();

      // Setup feature box (Featured) listener
      this.setupFeatureBoxListener();

      // Setup items per page selector listener
      this.setupItemsPerPageListener();

      // Setup pagination listeners
      this.setupPaginationListeners();
    } catch (error) {
      console.error("Error initializing product loader:", error);
    }
  }

  /**
   * Set up listener for items per page selector
   */
  setupItemsPerPageListener() {
    if (this.itemsPerPageSelect) {
      this.itemsPerPageSelect.addEventListener("change", () => {
        // Update items per page
        this.pagination.itemsPerPage = parseInt(this.itemsPerPageSelect.value);
        console.log(
          `Items per page changed to: ${this.pagination.itemsPerPage}`
        );

        // Reset to first page when changing items per page
        this.pagination.currentPage = 1;

        // Apply pagination
        this.applyPagination();
      });
    }
  }

  /**
   * Set up listeners for pagination buttons
   */
  setupPaginationListeners() {
    if (this.paginationContainer) {
      this.paginationContainer.addEventListener("click", (event) => {
        const button = event.target.closest(".pagination-btn");
        if (!button) return;

        // Previous page button
        if (button.title === "Previous page") {
          if (this.pagination.currentPage > 1) {
            this.pagination.currentPage--;
            this.applyPagination();
          }
          return;
        }

        // Next page button
        if (button.title === "Next page") {
          if (this.pagination.currentPage < this.pagination.totalPages) {
            this.pagination.currentPage++;
            this.applyPagination();
          }
          return;
        }

        // Numeric page buttons
        const pageNum = parseInt(button.textContent);
        if (!isNaN(pageNum)) {
          this.pagination.currentPage = pageNum;
          this.applyPagination();
        }
      });
    }
  }

  /**
   * Apply pagination to products
   */
  applyPagination() {
    // Calculate total pages
    this.pagination.totalPages = Math.ceil(
      this.allProducts.length / this.pagination.itemsPerPage
    );

    // Ensure current page is valid
    if (this.pagination.currentPage > this.pagination.totalPages) {
      this.pagination.currentPage = Math.max(1, this.pagination.totalPages);
    }

    // Get products for current page
    const startIndex =
      (this.pagination.currentPage - 1) * this.pagination.itemsPerPage;
    const endIndex = startIndex + this.pagination.itemsPerPage;

    // Set the products to display
    this.products = this.allProducts.slice(startIndex, endIndex);

    console.log(
      `Showing products ${startIndex + 1}-${Math.min(
        endIndex,
        this.allProducts.length
      )} of ${this.allProducts.length}`
    );

    // Render the products for current page
    this.renderProducts();

    // Update pagination UI
    this.updatePaginationUI();

    // Update product count display
    this.updateProductCountDisplay(this.currentFilters);
  }

  /**
   * Update the pagination UI
   */
  updatePaginationUI() {
    if (!this.paginationContainer) return;

    const totalPages = this.pagination.totalPages;
    const currentPage = this.pagination.currentPage;

    // Clear current pagination buttons
    this.paginationContainer.innerHTML = "";

    // Add previous button
    const prevBtn = document.createElement("button");
    prevBtn.className = "pagination-btn";
    prevBtn.title = "Previous page";
    prevBtn.disabled = currentPage === 1;
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    this.paginationContainer.appendChild(prevBtn);

    // Add page number buttons
    // Show a limited number of pages with the current page centered
    const maxPageButtons = 5;
    const halfMaxButtons = Math.floor(maxPageButtons / 2);

    let startPage = Math.max(1, currentPage - halfMaxButtons);
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

    // Adjust start if we're showing fewer pages than the max
    if (endPage - startPage < maxPageButtons - 1) {
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = document.createElement("button");
      pageBtn.className =
        "pagination-btn" + (i === currentPage ? " active" : "");
      pageBtn.textContent = i.toString();
      this.paginationContainer.appendChild(pageBtn);
    }

    // Add next button
    const nextBtn = document.createElement("button");
    nextBtn.className = "pagination-btn";
    nextBtn.title = "Next page";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    this.paginationContainer.appendChild(nextBtn);

    // Show/hide pagination based on number of pages
    if (totalPages <= 1) {
      this.paginationContainer.style.display = "none";
    } else {
      this.paginationContainer.style.display = "flex";
    }
  }

  /**
   * Set up listener for the feature box dropdown
   */
  setupFeatureBoxListener() {
    if (this.featureBox) {
      this.featureBox.addEventListener("change", () => {
        const selectedValue = this.featureBox.value;

        if (selectedValue === "1") {
          // Featured option
          this.fetchRecentItems();
        } else {
          // Reset featured flag and fetch regular products
          this.currentFilters.featured = false;
          this.fetchProducts(this.currentFilters);
        }
      });
    }
  }

  /**
   * Fetch recent items from the API
   * @param {number} days - Number of days to look back
   * @param {number} limit - Maximum number of items to fetch
   */
  async fetchRecentItems(days = 7, limit = 100) {
    try {
      // Show loading state
      this.showLoading();

      // Set up query parameters
      const params = new URLSearchParams();
      params.append("days", days);
      params.append("limit", limit);

      const url = `${this.apiBaseUrl}recent?${params.toString()}`;
      console.log(`Fetching recent items from the last ${days} days:`, url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch recent items: ${response.status}`);
      }

      const data = await response.json();
      console.log("Recent items API response:", data);

      // Store all products for pagination
      this.allProducts = Array.isArray(data) ? data : [];
      this.currentFilters.featured = true;

      // Apply pagination
      this.applyPagination();

      return this.products;
    } catch (error) {
      console.error("Error fetching recent items:", error);
      this.showError(`Failed to load recent items: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch categories from the API
   */
  async fetchCategories() {
    try {
      const url = `${this.apiBaseUrl}categories`;
      console.log("Fetching categories from:", url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }

      const data = await response.json();
      console.log("API categories response:", data);

      this.categories = Array.isArray(data) ? data : [];

      // Update category filters UI
      this.updateCategoryFilters();

      return this.categories;
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  }

  /**
   * Update category filters in the sidebar
   */
  updateCategoryFilters() {
    // Find the category details element - first details element in the sidebar
    const categoryDetails = document.querySelector(".sidebar details");

    if (!categoryDetails) {
      console.error("Category details element not found");
      return;
    }

    const categoryList = categoryDetails.querySelector("ul");
    if (!categoryList) {
      console.error("Category list element not found");
      return;
    }

    // Clear existing categories
    categoryList.innerHTML = "";

    // Add categories from API
    if (this.categories.length === 0) {
      // If no categories, show a message
      categoryList.innerHTML = "<li>No categories available</li>";
      return;
    }

    // Sort categories by item count (descending)
    const sortedCategories = [...this.categories].sort(
      (a, b) => b.item_count - a.item_count
    );

    // Add each category to the list
    sortedCategories.forEach((category) => {
      const li = document.createElement("li");
      const categoryId = category.name.toLowerCase().replace(/\s+/g, "-");

      li.innerHTML = `
        <input type="checkbox" id="${categoryId}" data-category="${category.name}">
        <label for="${categoryId}">${category.name} <span class="count">(${category.item_count})</span></label>
      `;

      categoryList.appendChild(li);
    });

    // Reattach event listeners to the new checkboxes
    const newCheckboxes = categoryList.querySelectorAll(
      'input[type="checkbox"]'
    );
    newCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", () => this.applyFilters());
    });
  }

  /**
   * Fetch products from the API
   * @param {Object} filters - Filter parameters
   */
  async fetchProducts(filters = {}) {
    try {
      // Set up query parameters
      const params = new URLSearchParams();
      params.append("skip", "0");
      params.append("limit", "100");

      // Show loading state
      this.showLoading();

      let url;
      // If a single category is selected, use the category-specific endpoint
      if (filters.category && filters.category.length === 1) {
        const category = filters.category[0];
        url = `${this.apiBaseUrl}categories/${encodeURIComponent(
          category
        )}?${params.toString()}`;
        console.log(`Fetching products from category '${category}':`, url);
      } else {
        // For multiple categories or no category filter, use the main endpoint
        url = `${this.apiBaseUrl}?${params.toString()}`;
        console.log("Fetching all products:", url);
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const data = await response.json();
      console.log("API response:", data);

      let products = Array.isArray(data) ? data : [];

      // Apply price filter client-side
      if (filters.priceRange) {
        const { min, max } = filters.priceRange;
        console.log(`Filtering products by price: $${min} - $${max}`);

        products = products.filter((product) => {
          const price = parseFloat(product.price) || 0;
          return price >= min && price <= max;
        });

        console.log(`${products.length} products after price filter`);
      }

      // Store all products for pagination
      this.allProducts = products;

      // Apply pagination
      this.applyPagination();

      return this.products;
    } catch (error) {
      console.error("Error fetching products:", error);
      this.showError(`Failed to load products: ${error.message}`);
      return [];
    }
  }

  /**
   * Update the product count display in the page header
   * @param {Object} filters - Current filters
   */
  updateProductCountDisplay(filters) {
    const categoryTitle = document.querySelector(
      ".products h2 .filter-group p"
    );
    if (!categoryTitle) return;

    let displayText = "";

    if (filters.category && filters.category.length > 0) {
      const categoryNames = filters.category.join(", ");
      displayText = `${this.allProducts.length} items in ${categoryNames}`;
    } else if (this.currentFilters.featured) {
      displayText = `${this.allProducts.length} recently listed items`;
    } else {
      displayText = `${this.allProducts.length} items in all categories`;
    }

    // Add pagination info
    const start =
      (this.pagination.currentPage - 1) * this.pagination.itemsPerPage + 1;
    const end = Math.min(
      start + this.pagination.itemsPerPage - 1,
      this.allProducts.length
    );

    if (this.allProducts.length > 0) {
      displayText += ` (showing ${start}-${end})`;
    }

    categoryTitle.textContent = displayText;
  }

  /**
   * Show loading state in the product grid
   */
  showLoading() {
    if (this.productGrid) {
      this.productGrid.innerHTML = `
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading products...</p>
        </div>
      `;
    }
  }

  /**
   * Show error message in the product grid
   * @param {string} message - Error message to display
   */
  showError(message) {
    if (this.productGrid) {
      this.productGrid.innerHTML = `
        <div class="error-container">
          <div class="error-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <p>${message}</p>
          <button class="retry-btn">Try Again</button>
        </div>
      `;

      // Add event listener to retry button
      const retryBtn = this.productGrid.querySelector(".retry-btn");
      if (retryBtn) {
        retryBtn.addEventListener("click", () =>
          this.fetchProducts(this.currentFilters)
        );
      }
    }
  }

  /**
   * Render products in the product grid
   */
  renderProducts() {
    if (!this.productGrid) return;

    // Clear the product grid
    this.productGrid.innerHTML = "";

    if (this.products.length === 0) {
      this.productGrid.innerHTML = `
        <div class="no-products">
          <p>No products found. Try adjusting your filters.</p>
        </div>
      `;
      return;
    }

    // Create and append product cards
    this.products.forEach((product) => {
      const productCard = this.createProductCard(product);
      this.productGrid.appendChild(productCard);
    });
  }

  /**
   * Create a product card element
   * @param {Object} product - Product data from API
   * @returns {HTMLElement} Product card element
   */
  createProductCard(product) {
    const card = document.createElement("div");
    card.className = "product-card";
    card.dataset.productId = product.item_id;

    // Determine if product is in stock
    const inStock = product.quantity > 0;

    // Prepare the rating display (if available)
    const rating = product.rating || 0;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;

    let starsHTML = "";
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        starsHTML += "★";
      } else if (i === fullStars && hasHalfStar) {
        starsHTML += "★";
      } else {
        starsHTML += "☆";
      }
    }

    // Format date if available
    const listedDate = product.listed_at ? new Date(product.listed_at) : null;
    const isNewProduct =
      listedDate && new Date() - listedDate < 7 * 24 * 60 * 60 * 1000; // 7 days

    // Add category badge if product is new
    let categoryBadge = isNewProduct
      ? `<span class="category-badge">New</span>`
      : "";

    // Set a default image path if one isn't provided
    const imagePath =
      product.image_url || `../../../public/resources/images/placeholder.jpg`;

    // Create the product card HTML
    card.innerHTML = `
      ${categoryBadge}
      ${!inStock ? '<span class="out-of-stock-badge">Out of Stock</span>' : ""}
      <div class="product-image">
        <img src="${imagePath}" alt="${product.name}">
      </div>
      <div class="product-details">
        <div class="product-info">
          <h3 class="product-title">${product.name}</h3>
          <div class="product-category">${
            product.category || "Uncategorized"
          }</div>
          ${
            product.description
              ? `<div class="product-description">${product.description.substring(
                  0,
                  100
                )}${product.description.length > 100 ? "..." : ""}</div>`
              : ""
          }
          ${
            rating
              ? `<div class="product-rating">
              <span class="stars">${starsHTML}</span>
              <span class="rating-count">(${product.rating_count || 0})</span>
            </div>`
              : ""
          }
        </div>
        <div class="purchase-area">
          <div class="product-price">
            <span class="current-price">$${product.price.toFixed(2)}</span>
            ${
              product.original_price && product.original_price > product.price
                ? `<span class="original-price">$${product.original_price.toFixed(
                    2
                  )}</span>`
                : ""
            }
          </div>
          <button class="cart-button" data-product-id="${product.item_id}" ${
      !inStock ? "disabled" : ""
    }>
            <div class="default-btn">
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="#414141" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="cart-icon">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </div>
            <div class="hover-btn">
              <svg viewBox="0 0 320 512" width="12.5" height="20" xmlns="http://www.w3.org/2000/svg">
                <path d="M160 0c17.7 0 32 14.3 32 32V67.7c1.6 .2 3.1 .4 4.7 .7c.4 .1 .7 .1 1.1 .2l48 8.8c17.4 3.2 28.9 19.9 25.7 37.2s-19.9 28.9-37.2 25.7l-47.5-8.7c-31.3-4.6-58.9-1.5-78.3 6.2s-27.2 18.3-29 28.1c-2 10.7-.5 16.7 1.2 20.4c1.8 3.9 5.5 8.3 12.8 13.2c16.3 10.7 41.3 17.7 73.7 26.3l2.9 .8c28.6 7.6 63.6 16.8 89.6 33.8c14.2 9.3 27.6 21.9 35.9 39.5c8.5 17.9 10.3 37.9 6.4 59.2c-6.9 38-33.1 63.4-65.6 76.7c-13.7 5.6-28.6 9.2-44.4 11V480c0 17.7-14.3 32-32 32s-32-14.3-32-32V445.1c-.4-.1-.9-.1-1.3-.2l-.2 0 0 0c-24.4-3.8-64.5-14.3-91.5-26.3c-16.1-7.2-23.4-26.1-16.2-42.2s26.1-23.4 42.2-16.2c20.9 9.3 55.3 18.5 75.2 21.6c31.9 4.7 58.2 2 76-5.3c16.9-6.9 24.6-16.9 26.8-28.9c1.9-10.6 .4-16.7-1.3-20.4c-1.9-4-5.6-8.4-13-13.3c-16.4-10.7-41.5-17.7-74-26.3l-2.8-.7 0 0C119.4 279.3 84.4 270 58.4 253c-14.2-9.3-27.5-22-35.8-39.6c-8.4-17.9-10.1-37.9-6.1-59.2C23.7 116 52.3 91.2 84.8 78.3c13.3-5.3 27.9-8.9 43.2-11V32c0-17.7 14.3-32 32-32z" fill="#ffffff"></path>
              </svg>
            </div>
          </button>
        </div>
      </div>
    `;

    return card;
  }

  /**
   * Setup event listeners for filter controls
   */
  setupFilterListeners() {
    // Implementation for filters - checkboxes, price range, etc.
    const filterCheckboxes = document.querySelectorAll(
      '.sidebar input[type="checkbox"]'
    );
    filterCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", () => this.applyFilters());
    });

    // Price range filter
    const applyPriceBtn = document.querySelector(
      ".price-range-filter .apply-btn"
    );
    if (applyPriceBtn) {
      applyPriceBtn.addEventListener("click", () => this.applyFilters());
    }

    // Clear all filters button
    const clearFiltersBtn = document.getElementById("clear-filters");
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener("click", () => {
        // Reset all checkboxes
        filterCheckboxes.forEach((checkbox) => {
          checkbox.checked = false;
        });

        // Reset price inputs
        const minPriceInput = document.querySelector(
          ".price-range-filter .input-min"
        );
        const maxPriceInput = document.querySelector(
          ".price-range-filter .input-max"
        );
        if (minPriceInput && maxPriceInput) {
          minPriceInput.value = "0";
          maxPriceInput.value = "999";
        }

        // Apply the reset filters
        this.applyFilters();
      });
    }
  }

  /**
   * Apply all current filters and fetch products
   */
  applyFilters() {
    // Collect category filters - using data-category attribute to get the actual category names
    const categoryFilters = Array.from(
      document.querySelectorAll(
        '.sidebar details:nth-of-type(1) input[type="checkbox"]:checked'
      )
    ).map((input) => input.dataset.category || input.id);

    // Get price range
    const minPrice = parseFloat(
      document.querySelector(".price-range-filter .input-min")?.value || 0
    );
    const maxPrice = parseFloat(
      document.querySelector(".price-range-filter .input-max")?.value || 999
    );

    // Update current filters
    this.currentFilters = {
      category: categoryFilters,
      priceRange: { min: minPrice, max: maxPrice },
    };

    // Reset to first page when applying new filters
    this.pagination.currentPage = 1;

    // Fetch products with filters
    this.fetchProducts(this.currentFilters);
  }

  /**
   * Set up event listeners for cart buttons
   */
  setupCartButtonListeners() {
    // Use event delegation for cart buttons
    if (this.productGrid) {
      this.productGrid.addEventListener("click", (event) => {
        const cartButton = event.target.closest(".cart-button");
        if (cartButton && !cartButton.disabled) {
          const productId = cartButton.dataset.productId;
          const product = this.products.find((p) => p.item_id == productId);

          if (product) {
            this.addProductToCart(product);
          }
        }
      });
    }
  }

  /**
   * Add a product to cart
   * @param {Object} product - The product to add to cart
   */
  addProductToCart(product) {
    try {
      // Format product for the cart manager
      const cartProduct = {
        id: product.item_id,
        name: product.name,
        price: product.price,
        image_url:
          product.image_url ||
          "../../../public/resources/images/placeholder.jpg",
      };

      // Use the cartManager from shared scripts
      cartManager.addToCart(cartProduct, 1);

      // Show notification if notifications system is available
      if (window.notifications) {
        window.notifications.cart(cartProduct);
      }
    } catch (error) {
      console.error("Error adding product to cart:", error);
      if (window.notifications) {
        window.notifications.error("Failed to add product to cart");
      }
    }
  }
}

// Create and initialize the product loader when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const productLoader = new ProductLoader();
  productLoader.init();

  // Make it available globally for debugging
  window.productLoader = productLoader;
});

export { ProductLoader };
