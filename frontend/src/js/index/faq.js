/* filepath: c:\Personal data\ASU\4. Senior 1\Spring 2025\Parrallel\MarketPlace\frontend\src\js\index\faq.js */

document.addEventListener("DOMContentLoaded", function () {
  // Get all FAQ question elements
  const faqQuestions = document.querySelectorAll(".faq-question");

  // Add click event listener to each FAQ question
  faqQuestions.forEach((question) => {
    question.addEventListener("click", function () {
      // Toggle the active class on the parent FAQ item
      const faqItem = this.parentElement;
      
      // Check if this item is already active
      const isActive = faqItem.classList.contains("active");
      
      // Optional: Close all other FAQs when one is opened
      document.querySelectorAll(".faq-item").forEach((item) => {
        if (item !== faqItem) {
          item.classList.remove("active");
        }
      });
      
      // Toggle this FAQ item
      if (isActive) {
        faqItem.classList.remove("active");
      } else {
        faqItem.classList.add("active");
      }
    });
  });
});
