const Orders = [
    {
        productName: 'HTML crash course',
        productNumber: '85743',
        paymentStatus: 'Due',
        status: 'Pending'
    },
    {
        productName: 'CSS Full Course',
        productNumber: '97245',
        paymentStatus: 'Refunded',
        status: 'Declined'
    },
    {
        productName: 'JavaScript Tutorial',
        productNumber: '36452',
        paymentStatus: 'Paid',
        status: 'Active'
    },
];

/**
 * Orders management for user dashboard
 * Fetches and displays user's purchase history
 */

// Function to load user's purchase history from the API
async function loadUserPurchases() {
    // Get the orders table body element
    const ordersTableBody = document.querySelector('#orders-tab .orders-table tbody');
    
    if (!ordersTableBody) {
        console.error('Orders table body not found');
        return;
    }
    
    try {
        // Show loading state
        ordersTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Loading orders...</td></tr>';
        
        // Get the authentication token
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
            ordersTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Please log in to view your orders</td></tr>';
            return;
        }
        
        // Make API call to get user's purchase history
        const response = await fetch('http://localhost:8000/api/v0/transactions/purchases', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        console.log('User purchases:', data);
        
        // Check if we have transaction data
        if (!data || !data.transactions || data.transactions.length === 0) {
            ordersTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No orders found</td></tr>';
            return;
        }
        
        // Update the orders count in the sidebar
        updateOrdersCount(data.total);
        
        // Clear the table body
        ordersTableBody.innerHTML = '';
        
        // Loop through transactions and add them to the table
        data.transactions.forEach(transaction => {
            const row = document.createElement('tr');
            
            // Format the date nicely
            const date = new Date(transaction.transaction_time);
            const formattedDate = date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            
            // Format as requested: #ORD-{transaction_id}
            const orderId = `#ORD-${transaction.transaction_id}`;
            
            row.innerHTML = `
                <td class="order-id">${orderId}</td>
                <td>${formattedDate}</td>
                <td>${transaction.item_name}</td>
                <td>$${transaction.total_amount.toFixed(2)}</td>
                <td><a href="#" class="order-action">View</a></td>
            `;
            
            ordersTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading user purchases:', error);
        ordersTableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 20px;">
                    Failed to load orders. 
                    <button onclick="loadUserPurchases()" style="color: #0d99ff; text-decoration: underline; background: none; border: none; cursor: pointer; padding: 0;">Retry</button>
                </td>
            </tr>
        `;
    }
}

// Function to update the orders count in the sidebar badge
function updateOrdersCount(count) {
    const ordersBadge = document.querySelector('.nav-item[data-target="orders-tab"] .badge');
    if (ordersBadge) {
        ordersBadge.textContent = count || '0';
    }
}

// Add event listener for the orders tab
document.addEventListener('DOMContentLoaded', function() {
    const ordersTab = document.querySelector('.nav-item[data-target="orders-tab"]');
    
    if (ordersTab) {
        ordersTab.addEventListener('click', function() {
            loadUserPurchases();
        });
    }
});