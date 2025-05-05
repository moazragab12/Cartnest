/**
 * Category filter functionality for the products list page
 * Handles URL parameters to filter products by category
 */

const API_BASE_URL = 'http://localhost:8000';

/**
 * Parse URL parameters
 * @returns {Object} - Object containing all URL parameters
 */
function getUrlParameters() {
    const params = {};
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    
    // Get all parameter key-value pairs
    for (const [key, value] of urlParams.entries()) {
        params[key] = value;
    }
    
    return params;
}

/**
 * Fetch products by category from the API
 * @param {string} category - Category name to filter by
 * @returns {Promise<Array>} - Array of filtered product objects
 */
async function fetchProductsByCategory(category) {
    try {
        // You can adjust limit as needed
        const limit = 20;
        // Using the search endpoint with category filter
        const response = await fetch(`${API_BASE_URL}/api/v0/items/search?q=&category=${encodeURIComponent(category)}&limit=${limit}`);
        const data = await response.json();
        return data || [];
    } catch (error) {
        console.error(`Error fetching products by category "${category}":`, error);
        return [];
    }
}

/**
 * Create a product card element
 * @param {Object} product - Product data
 * @returns {HTMLElement} - Product card element
 */
function createProductCard(product) {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    
    // Create image
    const img = document.createElement('img');
    img.src = product.image_url || '../../public/resources/images/bedroom.jpg';
    img.alt = product.name;
    img.addEventListener('error', () => {
        // Fallback if image fails to load
        img.src = '../../public/resources/images/bedroom.jpg';
    });
    productCard.appendChild(img);
    
    // Create product info container
    const productInfo = document.createElement('div');
    productInfo.className = 'product-info';
    
    // Create product title
    const productTitle = document.createElement('h4');
    productTitle.textContent = product.name;
    productInfo.appendChild(productTitle);
    
    // Create rating
    const rating = document.createElement('span');
    rating.className = 'rating';
    // If product has a rating property, use it, otherwise use a default
    rating.textContent = `⭐ ${product.rating || '4.0'} (${product.rating_count || '0'})`;
    productInfo.appendChild(rating);
    
    // Create price section
    const priceRating = document.createElement('div');
    priceRating.className = 'price-rating';
    
    const price = document.createElement('span');
    price.className = 'price';
    price.textContent = `$${product.price.toFixed(2)}`;
    priceRating.appendChild(price);
    
    // Create cart button
    const cartButton = document.createElement('button');
    cartButton.className = 'cart-button';
    cartButton.innerHTML = `
        <div class="default-btn">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="#414141" stroke-width="2" fill="none"
                stroke-linecap="round" stroke-linejoin="round" class="cart-icon">
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
    `;
    
    // Add event listener for the cart button
    cartButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        // Add to cart functionality can be implemented here
        console.log(`Added product "${product.name}" to cart`);
    });
    
    priceRating.appendChild(cartButton);
    productInfo.appendChild(priceRating);
    productCard.appendChild(productInfo);
    
    // Make the product card clickable to go to product details
    productCard.addEventListener('click', () => {
        window.location.href = `../product/product.html?id=${product.item_id}`;
    });
    
    return productCard;
}

/**
 * Fetch categories from the API
 * @returns {Promise<Array>} - Array of category objects
 */
async function fetchCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v0/items/categories`);
        const data = await response.json();
        return data || [];
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

/**
 * Update the category checkboxes in the sidebar
 * @param {Array} categories - Array of category objects 
 * @param {string} selectedCategory - Currently selected category
 */
function updateCategorySidebar(categories, selectedCategory) {
    const categoryList = document.querySelector('details[open] summary:contains("Category") + ul');
    
    if (!categoryList) {
        console.error('Category list not found in sidebar');
        return;
    }
    
    // Clear existing categories
    categoryList.innerHTML = '';
    
    // Sort categories by item count (highest to lowest)
    categories.sort((a, b) => b.item_count - a.item_count);
    
    // Add categories to the sidebar
    categories.forEach(category => {
        const isSelected = category.name === selectedCategory;
        const li = document.createElement('li');
        li.innerHTML = `<input type="checkbox" ${isSelected ? 'checked' : ''}> ${category.name}`;
        
        // Add click handler for the checkbox
        const checkbox = li.querySelector('input');
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                window.location.href = `?category=${encodeURIComponent(category.name)}`;
            } else if (isSelected) {
                // If unchecking the currently selected category, remove the filter
                window.location.href = 'productList.html';
            }
        });
        
        categoryList.appendChild(li);
    });
}

/**
 * Update the page title with the selected category
 * @param {string} category - The selected category
 */
function updatePageTitle(category) {
    const titleElement = document.querySelector('.products h2 p');
    if (titleElement) {
        // Update the title with the category
        titleElement.textContent = `Products in ${category}`;
    }
}

/**
 * Initialize the product list page with category filtering
 */
async function initCategoryFilter() {
    const params = getUrlParameters();
    const selectedCategory = params.category;
    
    if (selectedCategory) {
        console.log(`Filtering products by category: ${selectedCategory}`);
        
        // Update page title
        updatePageTitle(selectedCategory);
        
        // Get product container
        const productsContainer = document.querySelector('.product-grid');
        if (!productsContainer) {
            console.error('Products container not found');
            return;
        }
        
        // Show loading state
        productsContainer.innerHTML = '<p>Loading products...</p>';
        
        // Fetch products by category
        const products = await fetchProductsByCategory(selectedCategory);
        
        // Clear container
        productsContainer.innerHTML = '';
        
        if (products.length === 0) {
            productsContainer.innerHTML = '<p>No products found in this category.</p>';
            return;
        }
        
        // Render products
        products.forEach(product => {
            productsContainer.appendChild(createProductCard(product));
        });
        
        // Also update the categories in the sidebar
        const categories = await fetchCategories();
        updateCategorySidebar(categories, selectedCategory);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initCategoryFilter);

export { initCategoryFilter };