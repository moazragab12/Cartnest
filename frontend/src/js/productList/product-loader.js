/**
 * Product Loader Module for MarketPlace
 *
 * This module handles fetching products from the backend API and
 * dynamically rendering them in the product grid.
 */

import { cartManager } from "../shared/cart-manager.js";

class ProductLoader {
  constructor() {
    this.apiBaseUrl = "http://localhost:8000/api/v0/";
    this.searchEndpoint = "search/items/search";
    this.itemsEndpoint = "items/";
    this.products = [];
    this.allProducts = []; // Store all fetched products for pagination
    this.categories = [];
    this.currentFilters = {
      category: null,
      name: null,
      min_price: null,
      max_price: null,
      status: "for_sale",
      seller_id: null,
      min_quantity: null,
      featured: false,
    };    this.pagination = {
      currentPage: 1,
      itemsPerPage: 6, // Default items per page
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
    
    // Animation variables
    this.animationsEnabled = true;
    
    // Flag to control whether URL parameters are parsed on initial load
    // Changed to true to enable URL parameter filtering
    this.parseUrlParamsOnLoad = true;
  }

  /**
   * Initialize the product loader
   */
  async init() {
    try {
      // Ensure all filter details elements are closed initially
      this.closeAllFilterSections();
      
      // Parse URL query parameters
      this.parseQueryParams();
      
      // Fetch categories first
      await this.fetchCategories();

      // Get products based on URL params or default filters
      await this.fetchProducts();

      // Setup filter event listeners
      this.setupFilterListeners();

      // Setup cart button event listeners
      this.setupCartButtonListeners();

      // Setup feature box (Featured) listener
      this.setupFeatureBoxListener();      // Setup items per page selector listener
      this.setupItemsPerPageListener();
      
      // Set default value for items per page dropdown to match the default pagination setting
      if (this.itemsPerPageSelect) {
        this.itemsPerPageSelect.value = this.pagination.itemsPerPage.toString();
      }

      // Setup pagination listeners
      this.setupPaginationListeners();
      
      // Setup search input listener
      this.setupSearchInputListener();
      
      // Add animation to header on page load
      this.initHeaderAnimation();
      
      // Reset feature box to default option if no specific filters are set
      if (this.featureBox && !this.hasActiveFilters()) {
        this.featureBox.value = "0"; // Default to regular products, not featured
      }
    } catch (error) {
      console.error("Error initializing product loader:", error);
    }
  }
  
  /**
   * Check if there are any active filters
   */
  hasActiveFilters() {
    return (
      this.currentFilters.category !== null ||
      this.currentFilters.name !== null ||
      this.currentFilters.min_price !== null ||
      this.currentFilters.max_price !== null ||
      this.currentFilters.seller_id !== null ||
      this.currentFilters.min_quantity !== null ||
      this.currentFilters.featured === true
    );
  }
  
  /**
   * Close all filter details sections
   */
  closeAllFilterSections() {
    const filterSections = document.querySelectorAll('.sidebar details');
    filterSections.forEach(section => {
      // Remove the 'open' attribute to close the details element
      section.removeAttribute('open');
    });
    
    console.log("All filter sections closed");
  }

  /**
   * Parse query parameters from URL
   */
  parseQueryParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Map URL parameters to filter properties
    if (urlParams.has('name')) this.currentFilters.name = urlParams.get('name');
    if (urlParams.has('category')) this.currentFilters.category = urlParams.get('category');
    if (urlParams.has('min_price')) this.currentFilters.min_price = parseFloat(urlParams.get('min_price'));
    if (urlParams.has('max_price')) this.currentFilters.max_price = parseFloat(urlParams.get('max_price'));
    if (urlParams.has('status')) this.currentFilters.status = urlParams.get('status');
    if (urlParams.has('seller_id')) this.currentFilters.seller_id = parseInt(urlParams.get('seller_id'));
    if (urlParams.has('min_quantity')) this.currentFilters.min_quantity = parseInt(urlParams.get('min_quantity'));
    
    // Update UI based on URL parameters
    this.updateFilterUIFromParams();
    
    console.log("Parsed URL parameters:", this.currentFilters);
  }
  
  /**
   * Update filter UI elements based on parsed URL parameters
   */
  updateFilterUIFromParams() {
    // Update search input if name parameter exists
    if (this.currentFilters.name) {
      const searchInput = document.querySelector('.search-box input');
      if (searchInput) searchInput.value = this.currentFilters.name;
    }
    
    // Update price range inputs if price parameters exist
    if (this.currentFilters.min_price !== null) {
      const minPriceInput = document.querySelector('.price-range-filter .input-min');
      if (minPriceInput) minPriceInput.value = this.currentFilters.min_price;
    }
    
    if (this.currentFilters.max_price !== null) {
      const maxPriceInput = document.querySelector('.price-range-filter .input-max');
      if (maxPriceInput) maxPriceInput.value = this.currentFilters.max_price;
    }
    
    // If we have URL parameters, open the relevant filter sections
    if (this.hasActiveFilters()) {
      this.openRelevantFilterSections();
    }
    
    // Note: Category checkboxes will be updated after categories are fetched
  }
  
  /**
   * Open filter sections that are relevant to current URL parameters
   */
  openRelevantFilterSections() {
    // Open price filter section if price parameters exist
    if (this.currentFilters.min_price !== null || this.currentFilters.max_price !== null) {
      const priceDetails = document.querySelector('.sidebar details:nth-of-type(2)'); // Price is the second filter
      if (priceDetails) priceDetails.setAttribute('open', '');
    }
    
    // Open category filter section if category parameter exists
    if (this.currentFilters.category) {
      const categoryDetails = document.getElementById('category-details');
      if (categoryDetails) categoryDetails.setAttribute('open', '');
    }
  }

  /**
   * Initialize header animations
   */
  initHeaderAnimation() {
    if (!this.animationsEnabled) return;
    
    // Add animation classes to header elements
    const header = document.querySelector('.header');
    if (header) {
      header.classList.add('animate-header');
      
      // Logo animation
      const logo = header.querySelector('.logo-container');
      if (logo) {
        logo.classList.add('logo-animation');
      }
      
      // Search box animation
      const searchBox = header.querySelector('.search-box');
      if (searchBox) {
        searchBox.classList.add('search-box-animation');
      }
    }
    
    // Add animation to navbar categories
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      navbar.classList.add('navbar-animation');
      
      // Staggered animation for navbar items
      const navItems = navbar.querySelectorAll('a');
      navItems.forEach((item, index) => {
        item.style.animationDelay = `${0.1 * index}s`;
        item.classList.add('nav-item-animation');
      });
    }
  }

  /**
   * Set up listener for the search input
   */
  setupSearchInputListener() {
    const searchInput = document.querySelector('.search-box input');
    const searchIcon = document.querySelector('.search-box .search-icon');
    
    if (searchInput) {
      // Debounce function to prevent too many requests
      let searchTimeout;
      
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        
        searchTimeout = setTimeout(() => {
          const searchTerm = e.target.value.trim();
          if (searchTerm.length > 2) {
            // Update filter and URL
            this.currentFilters.name = searchTerm;
            this.updateURLWithFilters();
            
            // Reset to first page when searching
            this.pagination.currentPage = 1;
            
            // Fetch products with the search term
            this.fetchProducts();
          } else if (searchTerm.length === 0 && this.currentFilters.name) {
            // Clear search filter if input is empty
            this.currentFilters.name = null;
            this.updateURLWithFilters();
            this.fetchProducts();
          }
        }, 500); // 500ms debounce
      });
      
      // Handle search icon click
      if (searchIcon) {
        searchIcon.addEventListener('click', () => {
          const searchTerm = searchInput.value.trim();
          if (searchTerm.length > 0) {
            this.currentFilters.name = searchTerm;
            this.updateURLWithFilters();
            this.pagination.currentPage = 1;
            this.fetchProducts();
          }
        });
      }
      
      // Handle Enter key in search box
      searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
          const searchTerm = e.target.value.trim();
          if (searchTerm.length > 0) {
            this.currentFilters.name = searchTerm;
            this.updateURLWithFilters();
            this.pagination.currentPage = 1;
            this.fetchProducts();
          }
        }
      });
    }
  }

  /**
   * Update URL with current filters without reloading the page
   */
  updateURLWithFilters() {
    const params = new URLSearchParams();
    
    // Add non-null filters to URL parameters
    if (this.currentFilters.name) params.set('name', this.currentFilters.name);
    if (this.currentFilters.category) params.set('category', this.currentFilters.category);
    if (this.currentFilters.min_price !== null) params.set('min_price', this.currentFilters.min_price);
    if (this.currentFilters.max_price !== null) params.set('max_price', this.currentFilters.max_price);
    if (this.currentFilters.status && this.currentFilters.status !== 'for_sale') {
      params.set('status', this.currentFilters.status);
    }
    if (this.currentFilters.seller_id) params.set('seller_id', this.currentFilters.seller_id);
    if (this.currentFilters.min_quantity) params.set('min_quantity', this.currentFilters.min_quantity);
    
    // Update URL without reloading the page
    const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    history.pushState({}, '', newURL);
    
    console.log("Updated URL with filters:", newURL);
  }
    /**
   * Set up listener for items per page selector
   */
  setupItemsPerPageListener() {
    if (this.itemsPerPageSelect) {
      // Set default value for items per page dropdown to match the default pagination setting
      this.itemsPerPageSelect.value = this.pagination.itemsPerPage.toString();
      
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
          this.fetchProducts();
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

      const url = `${this.apiBaseUrl}${this.itemsEndpoint}recent?${params.toString()}`;
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
      const url = `${this.apiBaseUrl}${this.itemsEndpoint}categories`;
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
    const categoryDetails = document.getElementById('category-details');

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
      
      // Check the box if this category matches the one in URL parameters
      const isChecked = this.currentFilters.category === category.name ? 'checked' : '';

      li.innerHTML = `
        <input type="checkbox" id="${categoryId}" data-category="${category.name}" ${isChecked}>
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
    
    // Add animation to categories if enabled
    if (this.animationsEnabled) {
      const categoryItems = categoryList.querySelectorAll('li');
      categoryItems.forEach((item, index) => {
        item.style.animationDelay = `${0.05 * index}s`;
        item.classList.add('category-item-animation');
      });
    }
  }

  /**
   * Fetch products from the API
   */
  async fetchProducts() {
    try {
      // Show loading state
      this.showLoading();

      // Set up query parameters based on currentFilters
      const params = new URLSearchParams();
      
      // Add filters to query params
      if (this.currentFilters.name) params.set('name', this.currentFilters.name);
      if (this.currentFilters.category) params.set('category', this.currentFilters.category);
      if (this.currentFilters.min_price !== null) params.set('min_price', this.currentFilters.min_price);
      if (this.currentFilters.max_price !== null) params.set('max_price', this.currentFilters.max_price);
      if (this.currentFilters.status) params.set('status', this.currentFilters.status);
      if (this.currentFilters.seller_id) params.set('seller_id', this.currentFilters.seller_id);
      if (this.currentFilters.min_quantity) params.set('min_quantity', this.currentFilters.min_quantity);

      // Use the search endpoint for all product fetching
      const url = `${this.apiBaseUrl}${this.searchEndpoint}?${params.toString()}`;
      console.log("Fetching products with filters:", url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const data = await response.json();
      console.log("API response:", data);

      // Store all products for pagination
      this.allProducts = Array.isArray(data) ? data : [];

      // Apply pagination
      this.applyPagination();
      
      // Always update the URL with current filters
      this.updateURLWithFilters();
      
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

    if (filters.category) {
      displayText = `${this.allProducts.length} items in ${filters.category}`;
    } else if (filters.name) {
      displayText = `${this.allProducts.length} results for "${filters.name}"`;
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
    
    // Add an animation to the product count on update
    if (this.animationsEnabled) {
      categoryTitle.classList.remove('count-update-animation');
      // Trigger reflow to restart animation
      void categoryTitle.offsetWidth;
      categoryTitle.classList.add('count-update-animation');
    }
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
          this.fetchProducts()
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
    this.products.forEach((product, index) => {
      const productCard = this.createProductCard(product);
      
      // Add staggered animation to cards if enabled
      if (this.animationsEnabled) {
        productCard.style.animationDelay = `${0.05 * (index % 4)}s`;
        productCard.classList.add('product-card-animation');
      }
      
      this.productGrid.appendChild(productCard);
    });
  }

  /**
   * Create a product card element
   * @param {Object} product - Product data from API
   * @returns {HTMLElement} Product card element
   */
  createProductCard(product) {
    // Create wrapper div that will contain the card
    const wrapper = document.createElement("div");
    wrapper.className = "product-card-wrapper";
    
    // Create the actual product card
    const card = document.createElement("div");
    card.className = "product-card";
    card.dataset.productId = product.item_id;

    // Make the entire card clickable by wrapping it in a link
    const cardLink = document.createElement("a");
    cardLink.href = `http://127.0.0.1:5500/frontend/src/pages/product/product.html?id=${product.item_id}`;
    cardLink.className = "product-card-link";
    
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
      : "";    // Get static image based on product category or name
    // This will completely replace the dynamic image_url from API
    const imagePath = this.getStaticProductImage(product);    // Create the product card HTML
    card.innerHTML = `
      ${categoryBadge}
      ${!inStock ? '<span class="out-of-stock-badge">Out of Stock</span>' : ""}      <div class="product-image">
        <img src="${imagePath}" alt="${product.name}" loading="lazy" onerror="this.src='/frontend/public/resources/images/products/smartwatch.jpg'">
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
    
    // Append the card to the link
    cardLink.appendChild(card);
    
    // Append the link to the wrapper
    wrapper.appendChild(cardLink);
    
    // Add click event handler to prevent navigation when clicking on the cart button
    wrapper.addEventListener('click', (event) => {
      // If the click was on the cart button or its children, prevent navigation
      if (event.target.closest('.cart-button')) {
        event.preventDefault();
      }
    });

    return wrapper;
  }  /**
   * Get appropriate static image path for a product based on category or name
   * @param {Object} product - Product data from API
   * @returns {string} - Path to static image
   */  getStaticProductImage(product) {
    // Base path for images - use absolute path with /frontend prefix for consistency across the app
    const basePath = "/frontend/public/resources/images/";
    
    // Total number of available product thumbnail images (1 to 27)
    const totalImages = 27;
    
    // Use product ID to get a consistent "random" selection
    // Convert product.item_id to a number and get a value between 1 and totalImages (inclusive)
    const imageNumber = ((Number(product.item_id) || 0) % totalImages) + 1;
    const imagePath = `${basePath}products/${imageNumber}-thumbnail.jpg`;
    
    // Add fallback logic for products without thumbnail images
    // We'll add an onerror handler to the img tag in the HTML
    return imagePath;
    
    // Note: In the actual HTML, we use onerror to handle missing images
    // <img src="${imagePath}" alt="${product.name}" loading="lazy" onerror="this.src='/frontend/public/resources/images/products/smartwatch.jpg'">
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
        
        // Reset search input
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
          searchInput.value = '';
        }

        // Reset all filters
        this.currentFilters = {
          category: null,
          name: null,
          min_price: null,
          max_price: null,
          status: "for_sale",
          seller_id: null,
          min_quantity: null,
          featured: false,
        };
        
        // Update URL to remove parameters
        this.updateURLWithFilters();
        
        // Close all filter sections
        this.closeAllFilterSections();

        // Apply the reset filters
        this.fetchProducts();
        
        // Show animation on clear button
        if (this.animationsEnabled && clearFiltersBtn) {
          clearFiltersBtn.classList.add('clear-filters-animation');
          setTimeout(() => {
            clearFiltersBtn.classList.remove('clear-filters-animation');
          }, 500);
        }
      });
    }
    
    // Add detail open/close listeners for tracking
    const detailElements = document.querySelectorAll('.sidebar details');
    detailElements.forEach(detail => {
      detail.addEventListener('toggle', () => {
        console.log(`Filter section "${detail.querySelector('summary')?.textContent.trim()}" is now ${detail.open ? 'open' : 'closed'}`);
      });
    });
  }

  /**
   * Apply all current filters and fetch products
   */
  applyFilters() {
    // Collect category filters - using data-category attribute to get the actual category names
    const categoryCheckboxes = document.querySelectorAll(
      '.sidebar details:nth-of-type(1) input[type="checkbox"]:checked'
    );
    
    // Single category selection logic - last checked category applies
    if (categoryCheckboxes.length > 0) {
      const lastCheckedCategory = categoryCheckboxes[categoryCheckboxes.length - 1];
      this.currentFilters.category = lastCheckedCategory.dataset.category || lastCheckedCategory.id;
    } else {
      this.currentFilters.category = null;
    }

    // Get price range
    const minPrice = parseFloat(
      document.querySelector(".price-range-filter .input-min")?.value || 0
    );
    const maxPrice = parseFloat(
      document.querySelector(".price-range-filter .input-max")?.value || 999
    );

    // Update current filters
    this.currentFilters.min_price = minPrice;
    this.currentFilters.max_price = maxPrice;
    
    // Update URL with current filters
    this.updateURLWithFilters();

    // Reset to first page when applying new filters
    this.pagination.currentPage = 1;

    // Fetch products with filters
    this.fetchProducts();
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
          "/frontend/public/resources/images/placeholder.jpg",
      };

      // Use cartManager from shared scripts
      const result = cartManager.addToCart(cartProduct, 1);
      
      // Show a consistent notification matching the index page style
      if (window.notifications) {
        // Highlight product name in notification, matching index page format
        window.notifications.success(`${product.name} added to your cart!`, 5000, {
          productName: product.name
        });
        
        // Add cart badge animation
        cartManager.updateCartBadge(true);
      }
    } catch (error) {
      console.error("Error adding product to cart:", error);
      if (window.notifications) {
        window.notifications.error("Couldn't add item to cart. Please try again.");
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
