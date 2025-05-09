/**
 * Search Component Loader
 *
 * This file provides a simple way to include the search component on any page
 * Just add this script to your page and it will automatically load the search component
 */

document.addEventListener("DOMContentLoaded", () => {
  // Find all search box placeholders
  const searchBoxes = document.querySelectorAll(".search-box");

  if (searchBoxes.length === 0) return;

  // Load the search component HTML
  loadSearchBoxHTML()
    .then(() => {
      // Load the search component JavaScript
      loadScript("/src/js/shared/search.js")
        .then(() => {
          console.log("Search component initialized");
        })
        .catch((error) => {
          console.error("Failed to load search component script:", error);
        });
    })
    .catch((error) => {
      console.error("Failed to load search component HTML:", error);
    });
});

/**
 * Load the search component HTML
 * @returns {Promise} - Resolves when HTML is loaded
 */
async function loadSearchBoxHTML() {
  try {
    const response = await fetch("/src/components/search-box.html");
    if (!response.ok) throw new Error("Failed to load search component");

    const html = await response.text();

    // Replace all search boxes with the component HTML
    document.querySelectorAll(".search-box").forEach((searchBox) => {
      searchBox.outerHTML = html;
    });

    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
}

/**
 * Dynamically load a script
 * @param {string} src - The script URL
 * @returns {Promise} - Resolves when script is loaded
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.type = "module";
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
