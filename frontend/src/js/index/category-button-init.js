// Initialize the View All button in the categories section
document.addEventListener("DOMContentLoaded", function () {
  const viewAllButton = document.querySelector(".view-all-categories-btn");

  if (viewAllButton) {
    viewAllButton.addEventListener("click", function () {
      window.location.href =
        "/frontend/src/pages/productsList/productList.html";
    });
  }
});
