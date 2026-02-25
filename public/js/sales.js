// ================= SALES FILTER UX =================
document.addEventListener("DOMContentLoaded", function () {
  const sortSelect = document.querySelector("select[name='sort']");
  const searchInput = document.querySelector(".sales-search");

  if (!sortSelect || !searchInput) return;

  function toggleSearch() {
    if (sortSelect.value === "customer") {
      searchInput.style.display = "inline-block";
    } else {
      searchInput.style.display = "none";
      searchInput.value = "";
    }
  }

  // Run on page load (important for refresh with ?sort=customer)
  toggleSearch();

  // Run when dropdown changes
  sortSelect.addEventListener("change", toggleSearch);
});