/**
 * Format a number with commas as thousands separators
 * @param {number} number - Number to format
 * @returns {string} Formatted number
 */
const formatNumber = (number) => {
  if (number === undefined || number === null) return '0';
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
 * Format currency value
 * @param {number} value - Value to format
 * @returns {string} Formatted currency
 */
const formatCurrency = (value) => {
  if (value === undefined || value === null) return '$0.00';
  return `$${parseFloat(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
};

/**
 * Update the dashboard statistics cards with data from the API
 * @param {Object} data - Dashboard summary data from the API
 */
export function updateDashboardStats(data) {
  console.log('Updating dashboard stats with data:', data);
  if (!data) {
    console.error('No data provided to updateDashboardStats');
    return;
  }
  
  // Update total orders card
  const totalOrdersElement = document.querySelector('#totalOrdersValue');
  if (totalOrdersElement) {
    totalOrdersElement.textContent = formatNumber(data.total_orders);
    console.log('Updated total orders:', data.total_orders);
  } else {
    console.warn('Total orders element not found');
  }
  
  // Update delivered orders card (uses total_customers from API)
  const deliveredOrdersElement = document.querySelector('#deliveredValue');
  if (deliveredOrdersElement) {
    deliveredOrdersElement.textContent = formatNumber(data.total_customers);
    console.log('Updated delivered/customers:', data.total_customers);
  } else {
    console.warn('Delivered orders element not found');
  }
  
  // Update total spent card
  const totalSpentElement = document.querySelector('#totalSpentValue');
  if (totalSpentElement) {
    totalSpentElement.textContent = formatCurrency(data.total_spent);
    console.log('Updated total spent:', data.total_spent);
  } else {
    console.warn('Total spent element not found');
  }
  
  // Update products listed card
  const productsListedElement = document.querySelector('#productsListedValue');
  if (productsListedElement) {
    productsListedElement.textContent = formatNumber(data.products_listed);
    console.log('Updated products listed:', data.products_listed);
  } else {
    console.warn('Products listed element not found');
  }
}

/**
 * Update dashboard charts with data from the API
 * This is a placeholder for future chart implementations
 * @param {Object} data - Dashboard summary data from the API
 */
function updateCharts(data) {
  // Example: Update purchase activity chart
  if (data.purchase_activity && data.purchase_activity.length > 0) {
    // Implementation would depend on the charting library used
    console.log('Purchase activity data available for chart:', data.purchase_activity);
  }
  
  // Example: Update sales activity chart
  if (data.sales_activity && data.sales_activity.length > 0) {
    // Implementation would depend on the charting library used
    console.log('Sales activity data available for chart:', data.sales_activity);
  }
  
  // Example: Update category spending chart
  if (data.category_spending && data.category_spending.length > 0) {
    // Implementation would depend on the charting library used
    console.log('Category spending data available for chart:', data.category_spending);
  }
  
  // Example: Update best selling products chart
  if (data.best_selling_products && data.best_selling_products.length > 0) {
    // Implementation would depend on the charting library used
    console.log('Best selling products data available for chart:', data.best_selling_products);
  }
}