document.addEventListener("DOMContentLoaded", function () {
    const apiUrl = "http://localhost:8000/api/v0/products/?skip=0&category=mobile&sort_by=listed_at&sort_order=desc"; 

    // Grab elements
    const titleEl = document.querySelector(".info h1");
   // const imgEl = document.querySelector(".info img");
    const categoryNameEl = document.querySelector(".category-name");
    const productNameEl = document.querySelector(".product-name");
    const sellerInitialEl = document.querySelector(".seller-initial");
    const sellerNameEl = document.querySelector(".seller-details strong");
    const priceSectionEl = document.querySelector(".price-section");
    const availabilityEl = document.querySelector(".availability");

    // Fetch product data from API
    fetch(apiUrl)
        .then((response) => response.json())
        .then((data) => {
            if (!data.items || data.items.length === 0) {
                // No data: set placeholders 
                titleEl.textContent = "Product Not Found";
              // imgEl.src = "/../../public/resources/images/iphone.png";
                categoryNameEl.textContent = "Unknown Category";
                productNameEl.textContent = "Unknown Product";
                sellerInitialEl.textContent = "?";
                sellerNameEl.textContent = "Unknown Seller";
                priceSectionEl.textContent = "$0.00";
                availabilityEl.textContent = "❌ Not available";
                return;
            }

            const product = data.items[0]; // Get the first product

            titleEl.textContent = product.name || "Unnamed Product";
           //    imgEl.src = "/../../public/resources/images/iphone.png"; // Optional: Use actual image URL if available
            categoryNameEl.textContent = product.category || "Unknown Category";
            productNameEl.textContent = product.name || "Unnamed Product";
            sellerInitialEl.textContent = (product.seller_user_id || "?").toString().charAt(0);
            sellerNameEl.textContent = `Seller ID: ${product.seller_user_id || "Unknown"}`;

            // ✅ Corrected this line
            priceSectionEl.textContent = 
                typeof product.price === 'number' && !isNaN(product.price)
                ? `$${product.price.toFixed(2)}`
                : "$0.00";

            availabilityEl.textContent = 
                product.status === "for_sale"
                ? "✔ Available to order"
                : "❌ Not available";
        })
        .catch((error) => {
            console.error("Error fetching product:", error);
            // Set placeholder in case of error
            titleEl.textContent = "Error loading product";
            imgEl.src = "../../public/resources/images/placeholder.png";
            categoryNameEl.textContent = "Unknown Category";
            productNameEl.textContent = "Unknown Product";
            sellerInitialEl.textContent = "?";
            sellerNameEl.textContent = "Unknown Seller";
            priceSectionEl.textContent = "$0.00";
            availabilityEl.textContent = "❌ Not available";
        });

    // ✅ You can now safely implement Quantity Increment/Decrement below...
});
