/**
 * Product Loader Module for MarketPlace
 * Uses the enhanced products-service.js for all fetching and rendering.
 */

import { cartManager } from "../shared/cart-manager.js";
import {
  renderProductsFromArray,
  loadAndDisplayProducts,
} from "../shared/products-service.js";

class ProductLoader {
  constructor() {
    this.apiBaseUrl = "http://localhost:8000/api/v0";
    this.searchApiEndpoint = "/search/items/search";
    this.recentItemsEndpoint = "/items/recent";
    this.categoriesEndpoint = "/items/categories";

    this.allSearchedProducts = [];

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
    };
    this.pagination = {
      currentPage: 1,
      itemsPerPage: 6,
      totalPages: 1,
      totalItems: 0,
    };

    this.productGridSelector = ".product-grid";

    this.featureBox = document.querySelector(
      ".feature-box:not(.items-per-page)"
    );
    this.itemsPerPageSelect = document.querySelector(".items-per-page");
    this.paginationContainer = document.querySelector(".pagination");
    this.animationsEnabled = true;
    this.parseUrlParamsOnLoad = true;
  }

  async init() {
    try {
      this.closeAllFilterSections();
      this.parseQueryParams();
      await this.fetchCategories();

      if (this.currentFilters.featured) {
        await this.fetchAndDisplayRecentItems();
      } else {
        await this.fetchAndDisplaySearchedProducts();
      }

      this.setupFilterListeners();
      this.setupCartButtonListeners();
      this.setupFeatureBoxListener();
      this.setupItemsPerPageListener();
      if (this.itemsPerPageSelect) {
        this.itemsPerPageSelect.value = this.pagination.itemsPerPage.toString();
      }
      this.setupPaginationListeners();
      this.setupSearchInputListener();
      this.initHeaderAnimation();

      if (this.featureBox) {
        if (this.currentFilters.featured) {
          this.featureBox.value = "1";
        } else if (!this.hasActiveFiltersButNotFeatured()) {
          this.featureBox.value = "0";
        }
      }
    } catch (error) {
      console.error("PL: Error initializing product loader:", error);
      this.showErrorInGrid(
        "Initialization failed. Please try refreshing the page."
      );
    }
  }

  hasActiveFiltersButNotFeatured() {
    return (
      this.currentFilters.category !== null ||
      this.currentFilters.name !== null ||
      this.currentFilters.min_price !== null ||
      this.currentFilters.max_price !== null ||
      this.currentFilters.seller_id !== null ||
      this.currentFilters.min_quantity !== null
    );
  }
  closeAllFilterSections() {
    const filterSections = document.querySelectorAll(".sidebar details");
    filterSections.forEach((section) => section.removeAttribute("open"));
  }
  parseQueryParams() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("name")) this.currentFilters.name = urlParams.get("name");
    if (urlParams.has("category"))
      this.currentFilters.category = urlParams.get("category");
    if (urlParams.has("min_price"))
      this.currentFilters.min_price = parseFloat(urlParams.get("min_price"));
    if (urlParams.has("max_price"))
      this.currentFilters.max_price = parseFloat(urlParams.get("max_price"));
    if (urlParams.has("status"))
      this.currentFilters.status = urlParams.get("status");
    if (urlParams.has("seller_id"))
      this.currentFilters.seller_id = parseInt(urlParams.get("seller_id"));
    if (urlParams.has("min_quantity"))
      this.currentFilters.min_quantity = parseInt(
        urlParams.get("min_quantity")
      );
    if (urlParams.has("featured") && urlParams.get("featured") === "true")
      this.currentFilters.featured = true;

    this.updateFilterUIFromParams();
  }
  updateFilterUIFromParams() {
    if (this.currentFilters.name) {
      const searchInput = document.querySelector(".search-box input");
      if (searchInput) searchInput.value = this.currentFilters.name;
    }
    if (this.currentFilters.min_price !== null) {
      const minPriceInput = document.querySelector(
        ".price-range-filter .input-min"
      );
      if (minPriceInput) minPriceInput.value = this.currentFilters.min_price;
    }
    if (this.currentFilters.max_price !== null) {
      const maxPriceInput = document.querySelector(
        ".price-range-filter .input-max"
      );
      if (maxPriceInput) maxPriceInput.value = this.currentFilters.max_price;
    }
    if (this.hasActiveFiltersButNotFeatured() || this.currentFilters.category) {
      this.openRelevantFilterSections();
    }
  }
  openRelevantFilterSections() {
    if (
      this.currentFilters.min_price !== null ||
      this.currentFilters.max_price !== null
    ) {
      const priceDetails = document.querySelector(
        ".sidebar details:nth-of-type(2)"
      );
      if (priceDetails) priceDetails.setAttribute("open", "");
    }
    if (this.currentFilters.category) {
      const categoryDetails = document.getElementById("category-details");
      if (categoryDetails) categoryDetails.setAttribute("open", "");
    }
  }
  initHeaderAnimation() {
    /* ... same ... */
  }

  setupSearchInputListener() {
    const searchInput = document.querySelector(".search-box input");
    const searchIcon = document.querySelector(".search-box .search-icon");
    if (searchInput) {
      let searchTimeout;
      const performSearch = () => {
        const searchTerm = searchInput.value.trim();
        if (
          this.currentFilters.name === searchTerm &&
          !this.currentFilters.featured &&
          searchTerm.length > 0
        )
          return;

        if (searchTerm.length >= 0) {
          this.currentFilters.name = searchTerm.length > 0 ? searchTerm : null;
          this.currentFilters.featured = false;
          if (this.featureBox) this.featureBox.value = "0";
          this.pagination.currentPage = 1;
          this.fetchAndDisplaySearchedProducts();
        }
      };
      searchInput.addEventListener("input", () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(performSearch, 500);
      });
      if (searchIcon) searchIcon.addEventListener("click", performSearch);
      searchInput.addEventListener("keyup", (e) => {
        if (e.key === "Enter") {
          clearTimeout(searchTimeout);
          performSearch();
        }
      });
    }
  }

  updateURLWithFilters() {
    const params = new URLSearchParams();
    if (this.currentFilters.name) params.set("name", this.currentFilters.name);
    if (this.currentFilters.category)
      params.set("category", this.currentFilters.category);
    if (this.currentFilters.min_price !== null)
      params.set("min_price", this.currentFilters.min_price.toString());
    if (this.currentFilters.max_price !== null)
      params.set("max_price", this.currentFilters.max_price.toString());
    if (this.currentFilters.status && this.currentFilters.status !== "for_sale")
      params.set("status", this.currentFilters.status);
    if (this.currentFilters.seller_id)
      params.set("seller_id", this.currentFilters.seller_id.toString());
    if (this.currentFilters.min_quantity)
      params.set("min_quantity", this.currentFilters.min_quantity.toString());

    if (this.pagination.currentPage > 1) {
      // Always add page if > 1, regardless of featured status
      params.set("page", this.pagination.currentPage.toString());
    }
    if (this.currentFilters.featured) params.set("featured", "true");

    const newURL = `${window.location.pathname}${
      params.toString() ? "?" + params.toString() : ""
    }`;
    if (window.location.href !== newURL) {
      history.pushState(
        { filters: this.currentFilters, pagination: this.pagination },
        "",
        newURL
      );
    }
  }

  setupItemsPerPageListener() {
    if (this.itemsPerPageSelect) {
      this.itemsPerPageSelect.value = this.pagination.itemsPerPage.toString();
      this.itemsPerPageSelect.addEventListener("change", () => {
        this.pagination.itemsPerPage = parseInt(this.itemsPerPageSelect.value);
        this.pagination.currentPage = 1;
        if (this.currentFilters.featured) {
          this.fetchAndDisplayRecentItems();
        } else {
          this.displayCurrentPageOfSearchedProducts();
        }
      });
    }
  }

  setupPaginationListeners() {
    if (this.paginationContainer) {
      this.paginationContainer.addEventListener("click", (event) => {
        const button = event.target.closest(".pagination-btn");
        if (!button || button.disabled) return;
        const pageNumStr = button.dataset.page;
        if (pageNumStr) {
          const pageNum = parseInt(pageNumStr);
          if (!isNaN(pageNum) && pageNum !== this.pagination.currentPage) {
            this.pagination.currentPage = pageNum;
            if (this.currentFilters.featured) {
              this.fetchAndDisplayRecentItems();
            } else {
              this.displayCurrentPageOfSearchedProducts();
            }
          }
        }
      });
    }
  }
  async displayCurrentPageOfSearchedProducts() {
    this.pagination.totalPages =
      Math.ceil(
        this.allSearchedProducts.length / this.pagination.itemsPerPage
      ) || 1;
    this.pagination.currentPage = Math.min(
      this.pagination.currentPage,
      this.pagination.totalPages || 1
    );

    const limit = this.pagination.itemsPerPage;
    const skip = (this.pagination.currentPage - 1) * limit;
    const productsForCurrentPage = this.allSearchedProducts.slice(
      skip,
      skip + limit
    );

    await renderProductsFromArray(
      this.productGridSelector,
      productsForCurrentPage,
      this.allSearchedProducts.length,
      {
        loadingMessage: "Updating products...",
        noProductsMessage:
          this.allSearchedProducts.length === 0 &&
          this.pagination.currentPage === 1
            ? "No products found matching your criteria."
            : "No more products on this page.",
        onRenderComplete: (renderedCount, totalFromService, headers) => {
          this.updatePaginationUI();
          this.updateProductCountDisplay(this.currentFilters);
        },
      }
    );
    this.updateURLWithFilters();
  }

  updatePaginationUI() {
    if (!this.paginationContainer) return;
    const { totalPages, currentPage } = this.pagination;
    this.paginationContainer.innerHTML = "";

    if (totalPages <= 1) {
      this.paginationContainer.style.display = "none";
      return;
    }
    this.paginationContainer.style.display = "flex";

    const createBtn = (
      htmlContent,
      title,
      page,
      isDisabled = false,
      isActive = false
    ) => {
      const btn = document.createElement("button");
      btn.className = "pagination-btn" + (isActive ? " active" : "");
      btn.innerHTML = htmlContent;
      btn.title = title;
      btn.disabled = isDisabled;
      if (page !== undefined) btn.dataset.page = page.toString(); // Ensure page is string for dataset
      return btn;
    };

    this.paginationContainer.appendChild(
      createBtn(
        '<i class="fas fa-chevron-left"></i>',
        "Previous page",
        currentPage - 1,
        currentPage === 1
      )
    );

    const maxPageButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
    if (
      endPage - startPage + 1 < maxPageButtons &&
      totalPages >= maxPageButtons
    ) {
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    } else if (totalPages < maxPageButtons) {
      startPage = 1;
      endPage = totalPages;
    }

    for (let i = startPage; i <= endPage; i++) {
      this.paginationContainer.appendChild(
        createBtn(i.toString(), `Page ${i}`, i, false, i === currentPage)
      );
    }

    this.paginationContainer.appendChild(
      createBtn(
        '<i class="fas fa-chevron-right"></i>',
        "Next page",
        currentPage + 1,
        currentPage === totalPages
      )
    );
  }

  setupFeatureBoxListener() {
    if (this.featureBox) {
      this.featureBox.addEventListener("change", () => {
        const selectedValue = this.featureBox.value;
        this.pagination.currentPage = 1;
        if (selectedValue === "1") {
          this.currentFilters.featured = true;
          this.fetchAndDisplayRecentItems();
        } else {
          this.currentFilters.featured = false;
          this.fetchAndDisplaySearchedProducts();
        }
      });
    }
  }

  async fetchAndDisplayRecentItems(days = 7) {
    this.showLoadingInGrid();
    this.currentFilters.featured = true;
    try {
      const queryParams = {
        days: days.toString(),
        limit: this.pagination.itemsPerPage.toString(),
        skip: (
          (this.pagination.currentPage - 1) *
          this.pagination.itemsPerPage
        ).toString(),
      };
      await loadAndDisplayProducts(
        this.productGridSelector,
        this.recentItemsEndpoint,
        queryParams,
        {
          noProductsMessage: "No recent items found.",
          onRenderComplete: (
            renderedCount,
            totalItemsFromServer,
            responseHeaders
          ) => {
            let actualTotal = renderedCount;
            if (responseHeaders && responseHeaders.has("X-Total-Count")) {
              actualTotal = parseInt(responseHeaders.get("X-Total-Count"), 10);
            } else {
              // Fallback if no X-Total-Count: Use totalItemsFromServer if it's meaningful (e.g. service fetched all for count)
              // Or, if service only fetched a page, this isn't the true total.
              // This part remains a challenge without consistent X-Total-Count from /items/recent
              actualTotal = totalItemsFromServer; // This might be just the items on page if no X-Total-Count
            }
            this.pagination.totalItems = actualTotal;
            this.pagination.totalPages =
              Math.ceil(
                this.pagination.totalItems / this.pagination.itemsPerPage
              ) || 1;
            this.pagination.currentPage = Math.min(
              this.pagination.currentPage,
              this.pagination.totalPages || 1
            );
            this.updatePaginationUI();
            this.updateProductCountDisplay(this.currentFilters);
          },
        }
      );
      this.updateURLWithFilters();
    } catch (error) {
      console.error("PL: Error fetching/displaying recent items:", error);
      this.showErrorInGrid(`Failed to load recent items: ${error.message}`);
      this.pagination.totalItems = 0;
      this.pagination.totalPages = 1;
      this.pagination.currentPage = 1;
      this.updatePaginationUI();
      this.updateProductCountDisplay(this.currentFilters);
    }
  }

  async fetchCategories() {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}${this.categoriesEndpoint}`
      );
      if (!response.ok)
        throw new Error(`Failed to fetch categories: ${response.status}`);
      this.categories = (await response.json()) || [];
      this.updateCategoryFilters();
    } catch (error) {
      console.error("PL: Error fetching categories:", error);
      const categoryList = document.getElementById("category-list");
      if (categoryList)
        categoryList.innerHTML = "<li>Error loading categories.</li>";
    }
  }
  updateCategoryFilters() {
    const categoryDetails = document.getElementById("category-details");
    if (!categoryDetails) return;
    const categoryList = categoryDetails.querySelector("ul");
    if (!categoryList) return;

    categoryList.innerHTML = "";
    if (this.categories.length === 0) {
      categoryList.innerHTML = "<li>No categories available</li>";
      return;
    }
    const sortedCategories = [...this.categories].sort(
      (a, b) => b.item_count - a.item_count
    );
    sortedCategories.forEach((category) => {
      const li = document.createElement("li");
      const categoryId = `cat-${category.name
        .toLowerCase()
        .replace(/\s+/g, "-")}`;
      const isChecked = this.currentFilters.category === category.name;
      li.innerHTML = `
        <input type="checkbox" id="${categoryId}" data-category="${
        category.name
      }" ${isChecked ? "checked" : ""}>
        <label for="${categoryId}">${category.name} <span class="count">(${
        category.item_count
      })</span></label>
      `;
      categoryList.appendChild(li);
    });
    // Event listeners for these new checkboxes are handled by setupFilterListeners general selector
  }

  async fetchAndDisplaySearchedProducts() {
    this.showLoadingInGrid();
    this.currentFilters.featured = false;
    try {
      const apiParams = new URLSearchParams();
      if (this.currentFilters.name)
        apiParams.set("name", this.currentFilters.name);
      if (this.currentFilters.category)
        apiParams.set("category", this.currentFilters.category);
      if (this.currentFilters.min_price !== null)
        apiParams.set("min_price", this.currentFilters.min_price.toString());
      if (this.currentFilters.max_price !== null)
        apiParams.set("max_price", this.currentFilters.max_price.toString());
      if (this.currentFilters.status)
        apiParams.set("status", this.currentFilters.status);

      const fullUrl = `${this.apiBaseUrl}${
        this.searchApiEndpoint
      }?${apiParams.toString()}`;
      const response = await fetch(fullUrl);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Search API error! status: ${response.status}. ${errorText}`
        );
      }

      this.allSearchedProducts = (await response.json()) || [];
      this.pagination.totalItems = this.allSearchedProducts.length;

      await this.displayCurrentPageOfSearchedProducts();
    } catch (error) {
      console.error("PL: Error in fetchAndDisplaySearchedProducts:", error);
      this.showErrorInGrid(
        `Failed to load products: ${error.message || "Unknown error"}`
      );
      this.allSearchedProducts = [];
      this.pagination.totalItems = 0;
      await this.displayCurrentPageOfSearchedProducts();
    }
  }

  updateProductCountDisplay(filters) {
    const categoryTitle = document.querySelector(
      ".products h2 .filter-group p"
    );
    if (!categoryTitle) return;
    let displayText = "";
    const totalItems = this.pagination.totalItems;

    if (filters.featured) {
      displayText = `${totalItems} recently listed items`;
    } else if (filters.name && filters.category) {
      displayText = `${totalItems} results for "${filters.name}" in ${filters.category}`;
    } else if (filters.name) {
      displayText = `${totalItems} results for "${filters.name}"`;
    } else if (filters.category) {
      displayText = `${totalItems} items in ${filters.category}`;
    } else {
      displayText = `${totalItems} items in all categories`;
    }
    const start =
      totalItems > 0
        ? (this.pagination.currentPage - 1) * this.pagination.itemsPerPage + 1
        : 0;
    const end = Math.min(start + this.pagination.itemsPerPage - 1, totalItems);
    if (totalItems > 0 && this.pagination.totalPages > 1) {
      displayText += ` (showing ${start}-${end})`;
    }
    categoryTitle.textContent = displayText;
  }
  showLoadingInGrid() {
    const grid = document.querySelector(this.productGridSelector);
    if (grid)
      grid.innerHTML = `<div class="loading-container"><div class="loading-spinner"></div><p>Loading products...</p></div>`;
  }
  showErrorInGrid(message) {
    const grid = document.querySelector(this.productGridSelector);
    if (grid) {
      grid.innerHTML = `<div class="error-container"><p>${message}</p><button id="retry-load-btn">Try Again</button></div>`;
      const retryBtn = grid.querySelector("#retry-load-btn");
      if (retryBtn) retryBtn.addEventListener("click", () => this.init()); // Re-initialize
    }
  }

  setupFilterListeners() {
    const filterContainer = document.querySelector(".sidebar"); // More general container
    if (filterContainer) {
      filterContainer.addEventListener("change", (event) => {
        if (event.target.matches('#category-details input[type="checkbox"]')) {
          this.applyFilters();
        }
      });
      const applyPriceBtn = filterContainer.querySelector(
        ".price-range-filter .apply-btn"
      );
      if (applyPriceBtn)
        applyPriceBtn.addEventListener("click", () => this.applyFilters());

      const clearFiltersBtn = document.getElementById("clear-filters");
      if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener("click", () => {
          const searchInput = document.querySelector(".search-box input");
          if (searchInput) searchInput.value = "";
          const minPriceInput = document.querySelector(
            ".price-range-filter .input-min"
          );
          const maxPriceInput = document.querySelector(
            ".price-range-filter .input-max"
          );
          if (minPriceInput) minPriceInput.value = "";
          if (maxPriceInput) maxPriceInput.value = "";
          document
            .querySelectorAll('#category-details input[type="checkbox"]')
            .forEach((cb) => (cb.checked = false));

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
          if (this.featureBox) this.featureBox.value = "0";
          this.closeAllFilterSections();
          this.pagination.currentPage = 1;
          this.fetchAndDisplaySearchedProducts();
        });
      }
    }
  }
  applyFilters() {
    const categoryCheckboxes = document.querySelectorAll(
      '#category-details input[type="checkbox"]:checked'
    );
    if (categoryCheckboxes.length > 0) {
      this.currentFilters.category =
        categoryCheckboxes[categoryCheckboxes.length - 1].dataset.category;
    } else {
      this.currentFilters.category = null;
    }
    const minPriceInput = document.querySelector(
      ".price-range-filter .input-min"
    );
    const maxPriceInput = document.querySelector(
      ".price-range-filter .input-max"
    );
    this.currentFilters.min_price =
      minPriceInput && minPriceInput.value
        ? parseFloat(minPriceInput.value)
        : null;
    this.currentFilters.max_price =
      maxPriceInput && maxPriceInput.value
        ? parseFloat(maxPriceInput.value)
        : null;

    this.currentFilters.featured = false;
    if (this.featureBox) this.featureBox.value = "0";
    this.pagination.currentPage = 1;
    this.fetchAndDisplaySearchedProducts();
  }

  setupCartButtonListeners() {
    const grid = document.querySelector(this.productGridSelector);
    if (grid) {
      grid.addEventListener("click", (event) => {
        const cartButton = event.target.closest(".cart-button");
        if (cartButton && !cartButton.disabled) {
          const cardElement = cartButton.closest(".product-card");
          if (cardElement && cardElement.dataset.itemId) {
            const productForCart = {
              id: cardElement.dataset.itemId,
              name: cardElement.dataset.productName,
              price: parseFloat(cardElement.dataset.productPrice),
              image_url: cardElement.dataset.productImage,
            };
            this.addProductToCart(productForCart);
          } else {
            console.warn(
              "PL: Cart button clicked, but product data attributes not found.",
              cartButton
            );
          }
        }
      });
    }
  }
  addProductToCart(product) {
    try {
      cartManager.addToCart(product, 1);
      if (window.notifications) {
        window.notifications.success(
          `${product.name} added to your cart!`,
          5000,
          { productName: product.name }
        );
        cartManager.updateCartBadge(true);
      }
    } catch (error) {
      console.error("PL: Error adding product to cart:", error);
      if (window.notifications)
        window.notifications.error("Couldn't add item to cart.");
    }
  }
  getFallbackProductImage(product) {
    /* ... same ... */ return "";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const productLoaderInstance = new ProductLoader();
  productLoaderInstance.init();
  window.productLoader = productLoaderInstance;
});

export { ProductLoader };
