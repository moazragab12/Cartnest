let cartQuantity = 0;
let cartItems = [];

// Add or update items in the cart
function addToCart(name, price) {
  const existingItem = cartItems.find((item) => item.name === name);

  if (existingItem) {
    // Item exists, increase quantity
    existingItem.quantity += 1;
  } else {
    // New item, add it to the cart
    cartItems.push({ name, price, quantity: 1 });
  }

  cartQuantity += 1;
  document.getElementById("cart-count").innerText = cartQuantity;
  updateCartSection();
}

// Remove only one specific item from the cart
function removeFromCart(name) {
  const itemToRemove = cartItems.find((item) => item.name === name);

  if (itemToRemove) {
    // Decrease quantity or remove the item if quantity reaches 0
    if (itemToRemove.quantity > 1) {
      itemToRemove.quantity -= 1;
    } else {
      cartItems = cartItems.filter((item) => item.name !== name); // Remove the item from the cart
    }
    cartQuantity -= 1;
  }

  document.getElementById("cart-count").innerText = cartQuantity; // Update the cart count
  updateCartSection(); // Re-render the cart section
}

// Update the cart section to display the items and their quantities
function updateCartSection() {
  const cartItemsContainer = document.getElementById("cart-items");
  const cartSummary = document.getElementById("cart-summary");

  // Reset the cart display
  cartItemsContainer.innerHTML = "";
  cartSummary.innerHTML = "";

  let totalPrice = 0;

  // Create cart item cards
  cartItems.forEach((item) => {
    totalPrice += item.price * item.quantity; // Calculate the total price

    const card = document.createElement("div");
    card.className = "container-card";
    card.innerHTML = `
            <div class="cardinfo">
                <p class="name-card">${item.name}</p>
                <p class="price">${item.price} EGP</p>
                <p class="quantity">Quantity: ${item.quantity}</p>
                <button onclick="removeFromCart('${item.name}')" class="delete-btn">-</button>
            </div>
        `;
    cartItemsContainer.appendChild(card);
  });

  // Update the cart summary with the total items and total price
  cartSummary.innerHTML = `
        <p><strong>Total Items:</strong> ${cartQuantity}</p>
        <p><strong>Total Price:</strong> ${totalPrice.toFixed(2)} EGP</p>
    `;
}

// FAQ Accordion Functionality
document.addEventListener("DOMContentLoaded", function () {
  // Get all FAQ question elements
  const faqQuestions = document.querySelectorAll(".faq-question");

  // Add click event listener to each question
  faqQuestions.forEach((question) => {
    question.addEventListener("click", function () {
      // Get the parent FAQ item
      const faqItem = this.parentElement;

      // Toggle the active class on the FAQ item
      faqItem.classList.toggle("active");

      // Close other FAQ items (optional - for accordion style)
      const otherFaqItems = document.querySelectorAll(".faq-item");
      otherFaqItems.forEach((item) => {
        if (item !== faqItem) {
          item.classList.remove("active");
        }
      });
    });
  });

  // Newsletter form submission
  const newsletterForm = document.querySelector(".newsletter-form");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const emailInput = this.querySelector('input[type="email"]');
      if (emailInput.value.trim() !== "") {
        alert("Thank you for subscribing to our newsletter!");
        emailInput.value = "";
      }
    });
  }

  // Enhanced Partners section functionality
  const partnersContainer = document.querySelector(".partners-container");
  if (partnersContainer) {
    // Get original partners
    const originalPartners = Array.from(partnersContainer.children);

    // Clone partners multiple times to ensure smooth infinite scrolling
    // regardless of screen width
    for (let i = 0; i < 3; i++) {
      originalPartners.forEach((partner) => {
        const clone = partner.cloneNode(true);
        partnersContainer.appendChild(clone);
      });
    }

    // Ensure equal width for all partner logos
    const allPartnerLogos = partnersContainer.querySelectorAll(".partner-logo");
    const fixedWidth = 140; // Fixed width for each partner logo

    allPartnerLogos.forEach((logo) => {
      logo.style.width = `${fixedWidth}px`;
    });
  }
});

// Header scroll behavior
document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".header");
  let lastScroll = window.pageYOffset;
  let isHeaderVisible = true;

  const handleScroll = () => {
    const currentScroll = window.pageYOffset;
    const scrollDelta = currentScroll - lastScroll;

    // Add subtle shadow on scroll
    if (currentScroll > 10) {
      header.style.boxShadow = "var(--shadow-md)";
    } else {
      header.style.boxShadow = "none";
    }

    // Only hide/show header if scroll amount is significant
    if (Math.abs(scrollDelta) < 10) {
      lastScroll = currentScroll;
      return;
    }

    // Hide header when scrolling down, show when scrolling up
    if (scrollDelta > 0 && isHeaderVisible && currentScroll > 100) {
      header.style.transform = "translateY(-100%)";
      isHeaderVisible = false;
    } else if (scrollDelta < 0 && !isHeaderVisible) {
      header.style.transform = "translateY(0)";
      isHeaderVisible = true;
    }

    lastScroll = currentScroll;
  };

  // Throttle scroll events for better performance
  let isScrolling = false;
  window.addEventListener("scroll", () => {
    if (!isScrolling) {
      window.requestAnimationFrame(() => {
        handleScroll();
        isScrolling = false;
      });
      isScrolling = true;
    }
  });
});
