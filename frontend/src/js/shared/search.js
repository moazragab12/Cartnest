// Search functionality using /v0/search/items/search API
document.addEventListener("DOMContentLoaded", function () {
  const searchForm = document.querySelector("#search-form");
  const searchInput = document.querySelector("#search-form input");
  const searchBox = document.querySelector(".search-box");
  const searchIcon = document.querySelector(".search-icon");

  // Create search results container if it doesn't exist
  let searchResultsContainer = document.querySelector(
    ".search-results-container"
  );
  if (!searchResultsContainer) {
    searchResultsContainer = document.createElement("div");
    searchResultsContainer.className = "search-results-container";
    searchBox.appendChild(searchResultsContainer);
  }

  let debounceTimer;

  // Function to handle search input
  searchInput.addEventListener("input", function () {
    clearTimeout(debounceTimer);
    const query = this.value.trim();

    // Hide results if query is empty
    if (query === "") {
      searchResultsContainer.innerHTML = "";
      searchResultsContainer.classList.remove("active");
      return;
    }

    // Debounce search to avoid too many requests
    debounceTimer = setTimeout(() => {
      fetchSearchResults(query);
    }, 300);
  });

  // Hide results when clicking outside
  document.addEventListener("click", function (event) {
    if (!searchBox.contains(event.target)) {
      searchResultsContainer.innerHTML = "";
      searchResultsContainer.classList.remove("active");
    }
  });
  // API call to fetch search results
  function fetchSearchResults(query) {
    // Show loading state
    searchResultsContainer.innerHTML = `
      <div class="search-loading">
        <div class="search-loading-spinner"></div>
        <div>Searching for products...</div>
      </div>
    `;
    searchResultsContainer.classList.add("active");

    // Construct the API URL with query parameters
    // Using the specified API endpoint
    const apiUrl = `http://localhost:8000/api/v0/search/items/search?name=${encodeURIComponent(
      query
    )}&status=for_sale`;

    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Search results:", data); // Debug log
        displaySearchResults(data);
      })
      .catch((error) => {
        console.error("Error fetching search results:", error);
        searchResultsContainer.innerHTML =
          '<div class="search-error">Error fetching results</div>';
        searchResultsContainer.classList.add("active");
      });
  }
  // Function to get base path for correct relative URLs
  function getBasePath() {
    // Check if we are in a subpage by looking at the URL path
    const path = window.location.pathname;
    if (path.includes("/src/pages/")) {
      return "../../../"; // Go up three levels from src/pages/category/page.html
    }
    return "./"; // We're at the root level (index.html)
  }

  // Function to display search results
  function displaySearchResults(results) {
    // Clear previous results
    searchResultsContainer.innerHTML = "";
    const basePath = getBasePath();

    if (results.length === 0) {
      searchResultsContainer.innerHTML =
        '<div class="no-results">No products found</div>';
      searchResultsContainer.classList.add("active");
      return;
    }

    // Create results list
    const resultsList = document.createElement("ul");
    resultsList.className = "search-results-list";

    // Limit to 5 results for better UX
    const limitedResults = results.slice(0, 5);

    limitedResults.forEach((item) => {
      const listItem = document.createElement("li");
      listItem.className = "search-result-item";

      // Format price with 2 decimal places
      const formattedPrice = parseFloat(item.price).toFixed(2);
      // Get an appropriate product image based on category or use a fallback
      let productImage;

      // Try to determine a relevant product image based on category or name
      if (
        (item.category && item.category.toLowerCase().includes("phone")) ||
        (item.name && item.name.toLowerCase().includes("phone")) ||
        (item.name && item.name.toLowerCase().includes("iphone"))
      ) {
        productImage =
          basePath + "public/resources/images/products/iphone-blue.jpg";
      } else if (
        (item.category && item.category.toLowerCase().includes("watch")) ||
        (item.name && item.name.toLowerCase().includes("watch"))
      ) {
        productImage =
          basePath + "public/resources/images/products/smartwatch.jpg";
      } else if (
        (item.category && item.category.toLowerCase().includes("headphone")) ||
        (item.name && item.name.toLowerCase().includes("headphone")) ||
        (item.name && item.name.toLowerCase().includes("earphone"))
      ) {
        productImage =
          basePath + "public/resources/images/products/headphones.jpg";
      } else if (
        (item.category && item.category.toLowerCase().includes("sunglass")) ||
        (item.name && item.name.toLowerCase().includes("sunglass")) ||
        (item.name && item.name.toLowerCase().includes("glass"))
      ) {
        productImage =
          basePath + "public/resources/images/products/sunglasses.jpg";
      } else {
        // Default fallback image
        productImage =
          basePath + "public/resources/images/products/smartwatch.jpg";
      }

      // Truncate description to keep it short in the dropdown
      const shortDescription = item.description
        ? item.description.length > 80
          ? item.description.substring(0, 80) + "..."
          : item.description
        : "No description available";
      listItem.innerHTML = `
        <a href="${basePath}src/pages/product/product.html?id=${item.item_id}">
          <div class="search-result-content">
            <div class="search-result-image">
              <img src="${productImage}" alt="${item.name}" onerror="this.src='${basePath}public/resources/images/products/smartwatch.jpg'">
            </div>
            <div class="search-result-info">
              <div class="search-result-name">${item.name}</div>
              <div class="search-result-category">${item.category}</div>
              <div class="search-result-description">${shortDescription}</div>
              <div class="search-result-price">$${formattedPrice}</div>
            </div>
          </div>
        </a>
      `;

      resultsList.appendChild(listItem);
    }); // Add "View all results" link if there are more results
    if (results.length > 5) {
      const viewAllItem = document.createElement("li");
      viewAllItem.className = "view-all-results";
      viewAllItem.innerHTML = `
        <a href="${basePath}src/pages/productsList/productList.html?name=${encodeURIComponent(
        searchInput.value
      )}">
          View all ${results.length} results
        </a>
      `;
      resultsList.appendChild(viewAllItem);
    }

    searchResultsContainer.appendChild(resultsList);
    searchResultsContainer.classList.add("active");
  }

  // Handle search form submission
  searchForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const searchQuery = searchInput.value.trim();
    if (searchQuery) {
      // Redirect to product list page with search parameter
      const basePath = getBasePath();
      window.location.href = `${basePath}src/pages/productsList/productList.html?name=${encodeURIComponent(
        searchQuery
      )}`;

      // Clear search results container
      searchResultsContainer.innerHTML = "";
      searchResultsContainer.classList.remove("active");
    }
  });

  // Add search icon as submit button
  searchIcon.style.cursor = "pointer";
  searchIcon.addEventListener("click", function () {
    searchForm.dispatchEvent(new Event("submit"));
  });
});
