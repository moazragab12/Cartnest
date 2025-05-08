// Products management for the dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on the products tab
    if (document.getElementById('products-tab')) {
        initProductsTab();
    }
    
    // Initialize the update product form handlers
    initUpdateProductForm();
    
    // Initialize the add product form handlers
    initAddProductForm();
});

// API Base URL - same as used in other API calls
const API_BASE_URL = 'http://localhost:8000/api/v0';

// Initialize products tab functionality
function initProductsTab() {
    loadUserProducts();
    setupSortingDropdown();
    setupTabFiltering();
}

// Function to fetch user products from API
async function loadUserProducts() {
    try {
        // Show loading state
        const productsTableBody = document.querySelector('#products-tab .orders-table tbody');
        if (productsTableBody) {
            productsTableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 30px;">
                        <div class="loading-spinner"></div>
                        <p>Loading your products...</p>
                    </td>
                </tr>
            `;
        }

        // Fetch products from API
        const response = await fetch(`${API_BASE_URL}/profile/items`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const products = await response.json();
        console.log('Fetched products:', products);
        
        // Render products in table
        renderProductsTable(products);
        
        // Update product counts
        updateProductCounts(products);
        
    } catch (error) {
        console.error('Error fetching products:', error);
        
        const productsTableBody = document.querySelector('#products-tab .orders-table tbody');
        if (productsTableBody) {
            productsTableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 30px;">
                        <div style="color: #EF4444; margin-bottom: 10px;">
                            <i class="fas fa-exclamation-circle" style="font-size: 24px;"></i>
                        </div>
                        <p>Failed to load your products. Please try again later.</p>
                    </td>
                </tr>
            `;
        }
    }
}

// Function to render products in the table
function renderProductsTable(products) {
    const productsTableBody = document.querySelector('#products-tab .orders-table tbody');
    if (!productsTableBody) return;
    
    // Clear loading indicator
    productsTableBody.innerHTML = '';
    
    if (products.length === 0) {
        productsTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 30px;">
                    <p>You don't have any products yet.</p>
                    <button class="btn btn-primary" onclick="showTab('add-product-tab')" style="margin-top: 10px;">
                        <i class="fas fa-plus"></i> Add Your First Product
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    // Render each product as a row
    products.forEach(product => {
        // Get appropriate status class
        let statusClass = 'status-delivered'; // Active by default
        let statusText = 'Active';
        
        if (product.status === 'sold') {
            statusClass = 'status-cancelled';
            statusText = 'Out of Stock';
        } else if (product.status === 'removed') {
            statusClass = 'status-cancelled';
            statusText = 'Removed';
        } else if (product.status === 'draft') {
            statusClass = 'status-pending';
            statusText = 'Draft';
        } else if (product.quantity === 0 && product.status === 'for_sale') {
            statusClass = 'status-cancelled';
            statusText = 'Out of Stock';
        } else if (product.quantity <= 3 && product.status === 'for_sale') {
            statusClass = 'status-processing';
            statusText = 'Low Stock';
        }
        
        // Get image for product (using a placeholder for now)
        const productImage = getProductImageByCategory(product.category);
        
        // Create row HTML
        const row = document.createElement('tr');
        row.dataset.productId = product.item_id; // Store product ID in the row for later reference
        row.innerHTML = `
            <td style="display: flex; align-items: center; gap: 12px;">
                <img src="${productImage}" alt="${product.name}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
                <span>${product.name}</span>
            </td>
            <td>${product.item_id}</td>
            <td>${product.category}</td>
            <td>$${parseFloat(product.price).toFixed(2)}</td>
            <td>${product.quantity}</td>
            <td><span class="order-status ${statusClass}">${statusText}</span></td>
            <td>
                <div style="display: flex; gap: 8px;">
                    <button class="btn" style="padding: 6px; background-color: #F3F4F6; color: var(--black-color);" onclick="editProduct(${product.item_id})">
                        <i class="fas fa-pencil"></i>
                    </button>
                    <button class="btn" style="padding: 6px; background-color: #F3F4F6; color: var(--black-color);" onclick="viewProduct(${product.item_id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn" style="padding: 6px; background-color: #F3F4F6; color: #EF4444;" onclick="confirmDeleteProduct(${product.item_id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        productsTableBody.appendChild(row);
    });
    
    // Update pagination text
    const paginationText = document.querySelector('#products-tab .card-content > div > div:first-child');
    if (paginationText) {
        paginationText.textContent = `Showing ${products.length} of ${products.length} products`;
    }
}

// Helper function to get a product image based on category
function getProductImageByCategory(category) {
    const categoryMap = {
        'electronics': '../../public/resources/images/iphone.png',
        'fashion': '../../public/resources/images/Hoodie.jpg',
        'home & kitchen': '../../public/resources/images/kitchen.jpg',
        'beauty': '../../public/resources/images/beauty.jpg',
        'groceries': '../../public/resources/images/groceries.jpg',
        'fruits': '../../public/resources/images/fruit.jpg'
    };
    
    return categoryMap[category.toLowerCase()] || '../../public/resources/images/product-placeholder.png';
}

// Function to update product counts in tabs and stats
function updateProductCounts(products) {
    // Count products by status
    const counts = {
        all: products.length,
        active: 0,
        draft: 0,
        outofstock: 0,
        sold: 0,
        removed: 0
    };
    
    products.forEach(product => {
        if (product.status === 'for_sale' && product.quantity > 0) {
            counts.active++;
        } else if (product.status === 'draft') {
            counts.draft++;
        } else if (product.status === 'for_sale' && product.quantity === 0) {
            counts.outofstock++;
        } else if (product.status === 'sold') {
            counts.sold++;
            // Also count sold items as out of stock for the tab counter
            counts.outofstock++;
        } else if (product.status === 'removed') {
            counts.removed++;
        }
    });
    
    // Update tab counts
    document.querySelector('[data-producttab="all"]').textContent = `All Products (${counts.all})`;
    document.querySelector('[data-producttab="active"]').textContent = `Active (${counts.active})`;
    document.querySelector('[data-producttab="draft"]').textContent = `Drafts (${counts.draft})`;
    document.querySelector('[data-producttab="outofstock"]').textContent = `Out of Stock (${counts.outofstock})`;
    
    // Update stats cards on seller dashboard
    const forSaleCard = document.querySelector('.products-card .stat-value');
    const soldCard = document.querySelector('.sales-card .stat-value');
    const removedCard = document.querySelector('.removed-card .stat-value');
    const draftCard = document.querySelector('.draft-card .stat-value');
    
    if (forSaleCard) forSaleCard.textContent = counts.active;
    if (soldCard) soldCard.textContent = counts.sold;
    if (removedCard) removedCard.textContent = counts.removed;
    if (draftCard) draftCard.textContent = counts.draft;
}

// Setup product tab filtering
function setupTabFiltering() {
    const tabItems = document.querySelectorAll('.tab-item[data-producttab]');
    tabItems.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            tabItems.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Get the filter value
            const filter = this.dataset.producttab;
            
            // Filter products
            filterProducts(filter);
        });
    });
}

// Function to filter products by status
function filterProducts(filter) {
    console.log(`Filtering products by: ${filter}`);
    
    // This would ideally make a new API call with a filter parameter
    // For now, we'll simulate filtering by re-fetching all products and filtering client-side
    loadUserProducts().then(() => {
        if (filter === 'all') return;
        
        const rows = document.querySelectorAll('#products-tab .orders-table tbody tr');
        
        rows.forEach(row => {
            const statusCell = row.querySelector('td:nth-child(6) span');
            if (!statusCell) return;
            
            const status = statusCell.textContent.toLowerCase();
            
            // Match filter with status
            let show = false;
            if (filter === 'active' && status === 'active') show = true;
            if (filter === 'draft' && status === 'draft') show = true;
            if (filter === 'outofstock' && (status === 'out of stock' || status === 'sold')) show = true;
            
            // Hide or show row based on filter
            row.style.display = show ? '' : 'none';
        });
    });
}

// Setup sorting dropdown
function setupSortingDropdown() {
    const sortDropdown = document.querySelector('#products-tab .form-control');
    if (!sortDropdown) return;
    
    sortDropdown.addEventListener('change', function() {
        const sortValue = this.value;
        console.log(`Sorting products by: ${sortValue}`);
        
        // This would ideally make a new API call with a sort parameter
        // For now, we'll just reload the products
        loadUserProducts();
    });
}

// Initialize update product form
function initUpdateProductForm() {
    // Get update form elements
    const updateForm = document.getElementById('update-product-form');
    const updateSaveDraftBtn = document.getElementById('update-save-draft');
    const updatePublishBtn = document.getElementById('update-publish-product');
    const browseBttn = document.getElementById('update-browse-files');
    const fileInput = document.getElementById('update_product_image');
    
    // Add event listener for the browse button
    if (browseBttn && fileInput) {
        browseBttn.addEventListener('click', function() {
            fileInput.click();
        });
        
        // Preview image when selected
        fileInput.addEventListener('change', function() {
            const preview = document.getElementById('update-image-preview');
            if (preview && this.files && this.files[0]) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 150px; border-radius: 8px;">`;
                    preview.style.display = 'block';
                }
                
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
    
    // Handle save as draft button click
    if (updateSaveDraftBtn) {
        updateSaveDraftBtn.addEventListener('click', function() {
            document.getElementById('update_product_status').value = 'draft';
            submitUpdateProductForm();
        });
    }
    
    // Handle publish product button click
    if (updatePublishBtn) {
        updatePublishBtn.addEventListener('click', function() {
            document.getElementById('update_product_status').value = 'for_sale';
            submitUpdateProductForm();
        });
    }
}

// Initialize add product form 
function initAddProductForm() {
    // Get the form elements
    const addProductForm = document.getElementById('add-product-tab');
    if (!addProductForm) return;
    
    const productNameInput = addProductForm.querySelector('input[placeholder="Enter product name"]');
    const productDescriptionInput = addProductForm.querySelector('textarea[placeholder="Enter detailed product description"]');
    const productPriceInput = addProductForm.querySelector('input[placeholder="0.00"]');
    const productQuantityInput = addProductForm.querySelector('input[placeholder="0"]');
    const productCategorySelect = addProductForm.querySelector('select');
    const browseFilesBtn = document.getElementById('browse-files');
    const productImageInput = document.getElementById('product_image');
    
    // Add event listener for the browse button if it exists
    if (browseFilesBtn && productImageInput) {
        browseFilesBtn.addEventListener('click', function() {
            productImageInput.click();
        });
        
        // Preview image when selected
        productImageInput.addEventListener('change', function() {
            const preview = document.getElementById('image-preview');
            if (preview && this.files && this.files[0]) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 150px; border-radius: 8px;">`;
                    preview.style.display = 'block';
                }
                
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
    
    // Get the submit buttons
    const saveDraftBtn = document.getElementById('save-draft');
    const publishProductBtn = document.getElementById('publish-product');
    
    // Add hidden input for status if not present
    let productStatusInput = document.getElementById('product_status');
    if (!productStatusInput) {
        productStatusInput = document.createElement('input');
        productStatusInput.type = 'hidden';
        productStatusInput.id = 'product_status';
        productStatusInput.name = 'status';
        addProductForm.appendChild(productStatusInput);
    }
    
    // Handle save as draft button click
    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', function(event) {
            event.preventDefault();
            productStatusInput.value = 'draft';
            console.log('Save as Draft clicked, status set to:', productStatusInput.value);
            submitAddProductForm();
        });
    }
    
    // Handle publish product button click
    if (publishProductBtn) {
        publishProductBtn.addEventListener('click', function(event) {
            event.preventDefault();
            productStatusInput.value = 'for_sale';
            console.log('Publish Product clicked, status set to:', productStatusInput.value);
            submitAddProductForm();
        });
    }
    
    // Function to submit the add product form
    async function submitAddProductForm() {
        try {
            // Get all form inputs
            const formInputs = {
                name: productNameInput ? productNameInput.value : '',
                description: productDescriptionInput ? productDescriptionInput.value : '',
                price: productPriceInput ? parseFloat(productPriceInput.value) : 0,
                quantity: productQuantityInput ? parseInt(productQuantityInput.value) : 0,
                category: productCategorySelect ? productCategorySelect.value : '',
                status: productStatusInput.value
            };
            
            console.log('Form being submitted with status:', formInputs.status);
            
            // Validate all fields are filled
            const emptyFields = [];
            if (!formInputs.name) emptyFields.push('Product Name');
            if (!formInputs.description) emptyFields.push('Product Description');
            if (!formInputs.price || isNaN(formInputs.price) || formInputs.price <= 0) emptyFields.push('Price');
            if (!formInputs.quantity || isNaN(formInputs.quantity) || formInputs.quantity < 0) emptyFields.push('Quantity');
            if (!formInputs.category || formInputs.category === "Select a category") emptyFields.push('Category');
            
            // If any field is empty, show error and return
            if (emptyFields.length > 0) {
                const errorToast = document.createElement('div');
                errorToast.className = 'toast toast-error';
                errorToast.innerHTML = `
                    <i class="fas fa-exclamation-circle"></i>
                    <span>Please fill out the following fields: ${emptyFields.join(', ')}</span>
                `;
                document.body.appendChild(errorToast);
                
                // Remove toast after 3 seconds
                setTimeout(() => {
                    errorToast.remove();
                }, 3000);
                
                return;
            }
            
            // Show loading state
            const loadingToast = document.createElement('div');
            loadingToast.className = 'toast toast-info';
            loadingToast.innerHTML = `
                <div class="loading-spinner-small"></div>
                <span>Adding product...</span>
            `;
            document.body.appendChild(loadingToast);
            
            console.log('Adding new product:', formInputs);
            
            // Send request to API
            const response = await fetch(`${API_BASE_URL}/profile/items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: JSON.stringify(formInputs)
            });

            // Remove loading toast
            if (loadingToast.parentNode) {
                loadingToast.parentNode.removeChild(loadingToast);
            }
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `Error adding product: ${response.statusText}`);
            }

            const result = await response.json();
            
            // Show success message
            const successToast = document.createElement('div');
            successToast.className = 'toast toast-success';
            successToast.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <span>Product ${formInputs.status === 'draft' ? 'saved as draft' : 'published'} successfully</span>
            `;
            document.body.appendChild(successToast);
            
            // Remove toast after 3 seconds
            setTimeout(() => {
                successToast.remove();
            }, 3000);
            
            // Reset form
            if (productNameInput) productNameInput.value = '';
            if (productDescriptionInput) productDescriptionInput.value = '';
            if (productPriceInput) productPriceInput.value = '';
            if (productQuantityInput) productQuantityInput.value = '';
            if (productCategorySelect) productCategorySelect.selectedIndex = 0;
            if (productImageInput) productImageInput.value = '';
            
            // Clear preview
            const preview = document.getElementById('image-preview');
            if (preview) {
                preview.innerHTML = '';
                preview.style.display = 'none';
            }
            
            // If we're on the products tab, refresh the product list
            if (document.querySelector('#products-tab.active')) {
                loadUserProducts();
            } else {
                // Otherwise, switch to the products tab to show the new product
                showTab('products-tab');
                setTimeout(() => {
                    loadUserProducts();
                }, 500);
            }
            
        } catch (error) {
            console.error('Error adding product:', error);
            
            // Show error toast
            const errorToast = document.createElement('div');
            errorToast.className = 'toast toast-error';
            errorToast.innerHTML = `
                <i class="fas fa-exclamation-circle"></i>
                <span>${error.message}</span>
            `;
            document.body.appendChild(errorToast);
            
            // Remove toast after 3 seconds
            setTimeout(() => {
                errorToast.remove();
            }, 3000);
        }
    }
}

// Function to switch between tabs
function showTab(tabId) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.content-section');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Show the selected tab
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Update sidebar active state
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        if (item.dataset.target === tabId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Make showTab function global for HTML onclick access
window.showTab = showTab;

// Open the update product modal
function openUpdateProductModal() {
    const modal = document.getElementById('update-product-modal');
    if (modal) {
        modal.style.display = 'flex';
        // Add fade-in animation
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        // Prevent body scrolling
        document.body.style.overflow = 'hidden';
    }
}

// Close the update product modal
function closeUpdateProductModal() {
    const modal = document.getElementById('update-product-modal');
    if (modal) {
        modal.classList.remove('show');
        // Wait for animation to complete before hiding
        setTimeout(() => {
            modal.style.display = 'none';
            // Restore body scrolling
            document.body.style.overflow = '';
        }, 300);
    }
}

// Reset product changes in the update form
function resetProductChanges() {
    if (window.originalProductData) {
        populateUpdateProductForm(window.originalProductData);
    }
}

// Function to populate update product form with product data
function populateUpdateProductForm(product) {
    document.getElementById('update_product_id').value = product.item_id;
    document.getElementById('update_product_name').value = product.name;
    document.getElementById('update_product_description').value = product.description;
    document.getElementById('update_product_price').value = product.price;
    document.getElementById('update_product_quantity').value = product.quantity;
    
    // Set category
    const categoryField = document.getElementById('update_product_category');
    if (categoryField) {
        // Find and select the correct option
        const options = categoryField.options;
        for (let i = 0; i < options.length; i++) {
            if (options[i].value.toLowerCase() === product.category.toLowerCase()) {
                categoryField.selectedIndex = i;
                break;
            }
        }
    }
    
    // Set status
    const statusField = document.getElementById('update_product_status');
    if (statusField) {
        // Find and select the correct option
        const options = statusField.options;
        for (let i = 0; i < options.length; i++) {
            if (options[i].value === product.status) {
                statusField.selectedIndex = i;
                break;
            }
        }
    }
    
    // Set product image if available
    const productImg = document.getElementById('update-product-img');
    if (productImg) {
        productImg.src = getProductImageByCategory(product.category);
        productImg.alt = product.name;
    }
    
    // Store original values to track changes
    window.originalProductData = { ...product };
    
    // Add change detection to form inputs
    const formInputs = document.querySelectorAll('#update-product-form input, #update-product-form textarea, #update-product-form select');
    formInputs.forEach(input => {
        // Skip the hidden input for ID
        if (input.id === 'update_product_id') return;
        
        // Remove any existing change indicators
        const existingIndicator = input.parentElement.querySelector('.change-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // Reset modified class
        input.classList.remove('input-modified');
        
        // Add change event listener
        input.addEventListener('input', function() {
            const originalKey = input.name;
            const originalValue = window.originalProductData[originalKey];
            const currentValue = this.value;
            
            // Compare with original value
            if (String(currentValue) !== String(originalValue)) {
                // Add modified class
                this.classList.add('input-modified');
                
                // Add change indicator if not exists
                if (!this.parentElement.querySelector('.change-indicator')) {
                    const indicator = document.createElement('div');
                    indicator.className = 'change-indicator';
                    indicator.innerHTML = '<i class="fas fa-pencil-alt"></i>';
                    indicator.title = `Original value: ${originalValue}`;
                    this.parentElement.appendChild(indicator);
                }
            } else {
                // Remove modified class
                this.classList.remove('input-modified');
                
                // Remove change indicator if exists
                const indicator = this.parentElement.querySelector('.change-indicator');
                if (indicator) {
                    indicator.remove();
                }
            }
        });
    });
}

// Function to submit the update product form
async function submitUpdateProductForm() {
    try {
        // Get form data
        const formData = new FormData(document.getElementById('update-product-form'));
        
        // Get modified fields only
        const modifiedData = {};
        
        // Always include product ID
        modifiedData.item_id = formData.get('item_id');
        
        // Only include fields that have been modified
        const formInputs = document.querySelectorAll('#update-product-form .input-modified');
        
        if (formInputs.length === 0) {
            // If no fields were changed, show a message and return
            const infoToast = document.createElement('div');
            infoToast.className = 'toast toast-info';
            infoToast.innerHTML = `
                <i class="fas fa-info-circle"></i>
                <span>No changes detected. Please modify at least one field to update.</span>
            `;
            document.body.appendChild(infoToast);
            
            // Remove toast after 3 seconds
            setTimeout(() => {
                infoToast.remove();
            }, 3000);
            
            return;
        }
        
        // Add each modified field to the data
        formInputs.forEach(input => {
            const key = input.name;
            let value = formData.get(key);
            
            // Convert numeric values
            if (key === 'price') {
                value = parseFloat(value);
            } else if (key === 'quantity') {
                value = parseInt(value);
            }
            
            // Add to modified data
            modifiedData[key] = value;
        });
        
        // Always include status
        modifiedData.status = formData.get('status');
        
        // Include category if it's not already in modifiedData
        if (!modifiedData.hasOwnProperty('category')) {
            modifiedData.category = formData.get('category');
        }
        
        console.log('Updating product with modified data:', modifiedData);
        
        // Get product ID
        const productId = modifiedData.item_id;
        
        // Send update request to API
        const response = await fetch(`${API_BASE_URL}/profile/items/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            },
            body: JSON.stringify(modifiedData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `Error updating product: ${response.statusText}`);
        }

        // Show success message
        const successToast = document.createElement('div');
        successToast.className = 'toast toast-success';
        successToast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>Product updated successfully</span>
        `;
        document.body.appendChild(successToast);
        
        // Remove toast after 3 seconds
        setTimeout(() => {
            successToast.remove();
        }, 3000);
        
        // Close the update modal
        closeUpdateProductModal();
        
        // Reload products list to reflect changes
        loadUserProducts();
        
    } catch (error) {
        console.error('Error updating product:', error);
        
        // Show error toast
        const errorToast = document.createElement('div');
        errorToast.className = 'toast toast-error';
        errorToast.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${error.message}</span>
        `;
        document.body.appendChild(errorToast);
        
        // Remove toast after 3 seconds
        setTimeout(() => {
            errorToast.remove();
        }, 3000);
    }
}

// Edit product function - now opens the modal
function editProduct(productId) {
    console.log(`Edit product: ${productId}`);
    // Fetch product details and populate the form in the modal
    fetchProductDetails(productId)
        .then(() => {
            // Open the modal after data is loaded
            openUpdateProductModal();
        });
}

// Function to view product details
function viewProduct(productId) {
    console.log(`View product details: ${productId}`);
    // Navigate to the product detail page with the product ID
    window.location.href = `//127.0.0.1:5500/frontend/src/pages/product/product.html?id=${productId}`;
}

// Function to confirm product deletion
function confirmDeleteProduct(productId) {
    console.log(`Confirm delete product: ${productId}`);
    // This would show a confirmation modal before deleting
    if (confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
        deleteProduct(productId);
    }
}

// Function to delete a product
async function deleteProduct(productId) {
    try {
        // Send delete request to API
        const response = await fetch(`${API_BASE_URL}/profile/items/${productId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Show success message
        const successToast = document.createElement('div');
        successToast.className = 'toast toast-success';
        successToast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>Product deleted successfully</span>
        `;
        document.body.appendChild(successToast);
        
        // Remove toast after 3 seconds
        setTimeout(() => {
            successToast.remove();
        }, 3000);
        
        // Reload products list to reflect the deletion
        loadUserProducts();
        
    } catch (error) {
        console.error('Error deleting product:', error);
        
        // Show error toast
        const errorToast = document.createElement('div');
        errorToast.className = 'toast toast-error';
        errorToast.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>Failed to delete product. Please try again later.</span>
        `;
        document.body.appendChild(errorToast);
        
        // Remove toast after 3 seconds
        setTimeout(() => {
            errorToast.remove();
        }, 3000);
    }
}

// Function to fetch product details when editing
async function fetchProductDetails(productId) {
    try {
        // Show loading state
        const updateForm = document.getElementById('update-product-form');
        if (updateForm) {
            updateForm.style.opacity = '0.5';
            updateForm.style.pointerEvents = 'none';
        }
        
        // Add loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-spinner';
        loadingIndicator.style.position = 'absolute';
        loadingIndicator.style.top = '50%';
        loadingIndicator.style.left = '50%';
        loadingIndicator.style.transform = 'translate(-50%, -50%)';
        
        const modalBody = document.querySelector('#update-product-modal .modal-body');
        if (modalBody) {
            modalBody.style.position = 'relative';
            modalBody.appendChild(loadingIndicator);
        }
        
        // Fetch product details from API
        const response = await fetch(`${API_BASE_URL}/profile/items/${productId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const product = await response.json();
        console.log('Fetched product details:', product);
        
        // Remove loading indicator
        if (loadingIndicator && loadingIndicator.parentNode) {
            loadingIndicator.parentNode.removeChild(loadingIndicator);
        }
        
        // Restore form interaction
        if (updateForm) {
            updateForm.style.opacity = '1';
            updateForm.style.pointerEvents = 'auto';
        }
        
        // Populate form with product data
        populateUpdateProductForm(product);
        
    } catch (error) {
        console.error('Error fetching product details:', error);
        
        // Show error toast
        const errorToast = document.createElement('div');
        errorToast.className = 'toast toast-error';
        errorToast.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>Failed to load product details. Please try again.</span>
        `;
        document.body.appendChild(errorToast);
        
        // Remove toast after 3 seconds
        setTimeout(() => {
            errorToast.remove();
        }, 3000);
    }
}

// Make these functions global for HTML onclick access
window.editProduct = editProduct;
window.viewProduct = viewProduct;
window.confirmDeleteProduct = confirmDeleteProduct;
window.closeUpdateProductModal = closeUpdateProductModal;
window.resetProductChanges = resetProductChanges;