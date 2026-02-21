// ====== Invento Pro Frontend (Inventory + Catalog + Billing + Nav/User/Theme) ======

// Inventory
let items = [];
const LOW_STOCK_THRESHOLD = 5;

// Catalog
let catalogItems = [];

// Billing
let currentBillItems = [];

// ====== DOM ELEMENTS LOOKUP ======

// Inventory DOM
const form = document.getElementById("item-form");
const hiddenIdInput = document.getElementById("item-id");
const nameInput = document.getElementById("item-name");
const skuInput = document.getElementById("item-sku");
const categoryInput = document.getElementById("item-category");
const qtyInput = document.getElementById("item-qty");
const priceInput = document.getElementById("item-price");
const gstInput = document.getElementById("item-gst");
const submitBtn = document.getElementById("submit-btn");
const resetBtn = document.getElementById("reset-btn");

const searchInput = document.getElementById("search-input");
const filterCategorySelect = document.getElementById("filter-category");
const exportBtn = document.getElementById("export-btn");

const tbody = document.getElementById("inventory-body");
const emptyState = document.getElementById("empty-state");

const statItems = document.getElementById("stat-items");
const statQty = document.getElementById("stat-qty");
const statValue = document.getElementById("stat-value");

// Catalog DOM
const catalogForm = document.getElementById("catalog-form");
const catalogIdInput = document.getElementById("catalog-id");
const catalogNameInput = document.getElementById("catalog-name");
const catalogSkuInput = document.getElementById("catalog-sku");
const catalogQtyInput = document.getElementById("catalog-qty");
const catalogImageInput = document.getElementById("catalog-image");
const catalogSubmitBtn = document.getElementById("catalog-submit-btn");
const catalogResetBtn = document.getElementById("catalog-reset-btn");
const catalogGrid = document.getElementById("catalog-grid");

// Billing DOM
const billingForm = document.getElementById("billing-form");
const billCustomerNameInput = document.getElementById("bill-customer-name");
const billCustomerPhoneInput = document.getElementById("bill-customer-phone");
const billCustomerLocationInput = document.getElementById(
  "bill-customer-location"
);
const billCustomerGSTInput = document.getElementById("bill-customer-gst");
const billSKUInput = document.getElementById("bill-sku");
const billQtyInput = document.getElementById("bill-qty");
const billAddItemBtn = document.getElementById("bill-add-item");
const billingBody = document.getElementById("billing-body");
const billingSubtotalEl = document.getElementById("billing-subtotal");
const billingGSTEl = document.getElementById("billing-gst");
const billingGrandEl = document.getElementById("billing-grand");
const billingSaveBtn = document.getElementById("billing-save-btn");
const billingClearBtn = document.getElementById("billing-clear-btn");

// ====== API Helpers ======
async function fetchItems() {
  const res = await fetch("/api/items");
  if (!res.ok) throw new Error("Failed to fetch items");
  items = await res.json();
}

async function createItem(payload) {
  const res = await fetch("/api/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create item");
  }
  return res.json();
}

async function updateItem(id, payload) {
  const res = await fetch(`/api/items/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update item");
  }
  return res.json();
}

async function deleteItem(id) {
  const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to delete item");
  }
  return res.json();
}

// Catalog API helpers
async function fetchCatalog() {
  const res = await fetch("/api/catalog");
  if (!res.ok) throw new Error("Failed to fetch catalog");
  catalogItems = await res.json();
}

async function createCatalogEntry(payload) {
  const res = await fetch("/api/catalog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create catalog entry");
  }
  return res.json();
}

async function updateCatalogEntry(id, payload) {
  const res = await fetch(`/api/catalog/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update catalog entry");
  }
  return res.json();
}

async function deleteCatalogEntry(id) {
  const res = await fetch(`/api/catalog/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to delete catalog entry");
  }
  return res.json();
}

// Billing API helper
async function createBill(payload) {
  const res = await fetch("/api/bills", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create bill");
  }
  return res.json();
}

// ====== Inventory Rendering ======
function renderItems() {
  if (!tbody || !searchInput || !filterCategorySelect || !emptyState) return;

  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedCategory = filterCategorySelect.value;

  tbody.innerHTML = "";

  const filtered = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm) ||
      item.sku.toLowerCase().includes(searchTerm);

    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  if (filtered.length === 0) {
    emptyState.style.display = "inline";
  } else {
    emptyState.style.display = "none";
  }

  filtered.forEach((item, index) => {
    const tr = document.createElement("tr");

    const gstRate = item.gstRate || 0;
    const priceWithGST = item.price * (1 + gstRate / 100);
    const totalValueWithGST = priceWithGST * item.qty;

    if (item.qty <= LOW_STOCK_THRESHOLD) {
      tr.classList.add("low-stock");
    }

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${item.name}</td>
      <td>${item.sku}</td>
      <td>${item.category || "-"}</td>
      <td>${item.qty}</td>
      <td>₹${item.price.toFixed(2)}</td>
      <td>${gstRate.toFixed(2)}%</td>
      <td>₹${priceWithGST.toFixed(2)}</td>
      <td>₹${totalValueWithGST.toFixed(2)}</td>
      <td>
        <button class="action-btn action-edit" data-id="${item.id}">Edit</button>
        <button class="action-btn action-delete" data-id="${item.id}">Delete</button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  updateStats();
}

function updateStats() {
  if (!statItems || !statQty || !statValue) return;

  const totalItems = items.length;
  let totalQty = 0;
  let totalValue = 0;

  items.forEach((item) => {
    const gstRate = item.gstRate || 0;
    const priceWithGST = item.price * (1 + gstRate / 100);
    totalQty += item.qty;
    totalValue += priceWithGST * item.qty;
  });

  statItems.textContent = totalItems.toString();
  statQty.textContent = totalQty.toString();
  statValue.textContent = totalValue.toFixed(2);
}

function populateCategoryFilter() {
  if (!filterCategorySelect) return;

  const categories = Array.from(
    new Set(items.map((i) => i.category).filter(Boolean))
  );

  const currentValue = filterCategorySelect.value;

  filterCategorySelect.innerHTML = `<option value="all">All Categories</option>`;

  categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    filterCategorySelect.appendChild(option);
  });

  if (
    currentValue &&
    (currentValue === "all" || categories.includes(currentValue))
  ) {
    filterCategorySelect.value = currentValue;
  } else {
    filterCategorySelect.value = "all";
  }
}

// ====== Catalog Rendering ======
function renderCatalog() {
  if (!catalogGrid) return;

  catalogGrid.innerHTML = "";

  const inventoryBySku = new Map(items.map((i) => [i.sku, i]));

  catalogItems.forEach((entry) => {
    const card = document.createElement("div");
    card.className = "catalog-card";

    const linkedItem = inventoryBySku.get(entry.sku);
    let infoHtml = "";
    let missingHtml = "";

    if (linkedItem) {
      const gstRate = linkedItem.gstRate || 0;
      const priceWithGST = linkedItem.price * (1 + gstRate / 100);
      const totalValue = priceWithGST * entry.qty;

      infoHtml = `
        <div class="catalog-price">
          <div>Unit price (incl. GST): <strong>₹${priceWithGST.toFixed(
            2
          )}</strong></div>
          <div>Quantity: <strong>${entry.qty}</strong></div>
          <div>Total price: <strong>₹${totalValue.toFixed(2)}</strong></div>
        </div>
      `;
    } else {
      missingHtml = `
        <div class="catalog-missing">
          Inventory item with SKU <strong>${entry.sku}</strong> not found.
        </div>
      `;
    }

    const imgHtml = entry.imageUrl
      ? `<img src="${entry.imageUrl}" alt="${entry.name}" onerror="this.style.display='none';" />`
      : "";

    card.innerHTML = `
      ${imgHtml}
      <div class="catalog-content">
        <div class="catalog-product-name">${entry.name}</div>
        <div class="catalog-sku">SKU: ${entry.sku}</div>
        ${infoHtml}
        ${missingHtml}
        <div class="catalog-card-actions">
          <button class="action-btn action-edit catalog-edit" data-id="${
            entry.id
          }">Edit</button>
          <button class="action-btn action-delete catalog-delete" data-id="${
            entry.id
          }">Delete</button>
        </div>
      </div>
    `;

    catalogGrid.appendChild(card);
  });
}

// ====== Inventory Form Helpers ======
function clearForm() {
  if (
    !hiddenIdInput ||
    !nameInput ||
    !skuInput ||
    !categoryInput ||
    !qtyInput ||
    !priceInput ||
    !gstInput ||
    !submitBtn
  )
    return;

  hiddenIdInput.value = "";
  nameInput.value = "";
  skuInput.value = "";
  categoryInput.value = "";
  qtyInput.value = "";
  priceInput.value = "";
  gstInput.value = "";
  submitBtn.textContent = "Add Item";
}

function fillFormForEdit(item) {
  if (
    !hiddenIdInput ||
    !nameInput ||
    !skuInput ||
    !categoryInput ||
    !qtyInput ||
    !priceInput ||
    !gstInput ||
    !submitBtn
  )
    return;

  hiddenIdInput.value = item.id;
  nameInput.value = item.name;
  skuInput.value = item.sku;
  categoryInput.value = item.category;
  qtyInput.value = item.qty;
  priceInput.value = item.price;
  gstInput.value = item.gstRate;
  submitBtn.textContent = "Update Item";
}

// ====== Catalog Form Helpers ======
function clearCatalogForm() {
  if (
    !catalogIdInput ||
    !catalogNameInput ||
    !catalogSkuInput ||
    !catalogQtyInput ||
    !catalogImageInput ||
    !catalogSubmitBtn
  )
    return;

  catalogIdInput.value = "";
  catalogNameInput.value = "";
  catalogSkuInput.value = "";
  catalogQtyInput.value = "1";
  catalogImageInput.value = "";
  catalogSubmitBtn.textContent = "Add to Catalog";
}

function fillCatalogFormForEdit(entry) {
  if (
    !catalogIdInput ||
    !catalogNameInput ||
    !catalogSkuInput ||
    !catalogQtyInput ||
    !catalogImageInput ||
    !catalogSubmitBtn
  )
    return;

  catalogIdInput.value = entry.id;
  catalogNameInput.value = entry.name;
  catalogSkuInput.value = entry.sku;
  catalogQtyInput.value = entry.qty;
  catalogImageInput.value = entry.imageUrl || "";
  catalogSubmitBtn.textContent = "Update Catalog Item";
}

// ====== Billing Helpers ======
function recalcBill() {
  const inventoryBySku = new Map(items.map((i) => [i.sku, i]));

  let subtotal = 0;
  let totalGST = 0;
  let grandTotal = 0;

  currentBillItems = currentBillItems.map((line) => {
    const item = inventoryBySku.get(line.sku);
    if (!item) {
      return {
        ...line,
        unitPrice: 0,
        gstRate: 0,
        priceWithGST: 0,
        lineTotal: 0,
      };
    }

    const unitPrice = item.price;
    const gstRate = item.gstRate || 0;
    const priceWithGST = unitPrice * (1 + gstRate / 100);
    const lineSubtotal = unitPrice * line.qty;
    const lineTotal = priceWithGST * line.qty;
    const lineGST = lineTotal - lineSubtotal;

    subtotal += lineSubtotal;
    totalGST += lineGST;
    grandTotal += lineTotal;

    return {
      ...line,
      unitPrice,
      gstRate,
      priceWithGST,
      lineTotal,
    };
  });

  if (billingSubtotalEl) {
    billingSubtotalEl.textContent = `₹${subtotal.toFixed(2)}`;
  }
  if (billingGSTEl) {
    billingGSTEl.textContent = `₹${totalGST.toFixed(2)}`;
  }
  if (billingGrandEl) {
    billingGrandEl.textContent = `₹${grandTotal.toFixed(2)}`;
  }
}

function renderBill() {
  if (!billingBody) return;

  billingBody.innerHTML = "";
  recalcBill();

  currentBillItems.forEach((line, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${line.sku}</td>
      <td>${line.name || ""}</td>
      <td>${line.qty}</td>
      <td>₹${(line.unitPrice || 0).toFixed(2)}</td>
      <td>${(line.gstRate || 0).toFixed(2)}%</td>
      <td>₹${(line.priceWithGST || 0).toFixed(2)}</td>
      <td>₹${(line.lineTotal || 0).toFixed(2)}</td>
      <td>
        <button class="action-btn action-delete bill-remove" data-index="${index}">
          Remove
        </button>
      </td>
    `;
    billingBody.appendChild(tr);
  });
}

function clearBill() {
  currentBillItems = [];
  renderBill();
}

// ====== Inventory Handlers ======
async function handleFormSubmit(event) {
  event.preventDefault();

  if (
    !nameInput ||
    !skuInput ||
    !categoryInput ||
    !qtyInput ||
    !priceInput ||
    !gstInput
  )
    return;

  const id = hiddenIdInput ? hiddenIdInput.value || null : null;
  const name = nameInput.value.trim();
  const sku = skuInput.value.trim();
  const category = categoryInput.value.trim();
  const qty = parseInt(qtyInput.value, 10) || 0;
  const price = parseFloat(priceInput.value) || 0;
  const gstRate = parseFloat(gstInput.value) || 0;

  if (!name || !sku) {
    alert("Name and SKU are required.");
    return;
  }

  if (qty < 0 || price < 0 || gstRate < 0) {
    alert("Quantity, Price and GST must be non-negative.");
    return;
  }

  const payload = { name, sku, category, qty, price, gstRate };

  try {
    if (id) {
      await updateItem(id, payload);
    } else {
      await createItem(payload);
    }

    await fetchItems();
    populateCategoryFilter();
    renderItems();
    renderCatalog(); // inventory changes may affect catalog
    renderBill(); // inventory changes may affect billing
    clearForm();
  } catch (err) {
    console.error(err);
    alert(err.message || "Something went wrong while saving the item.");
  }
}

async function handleTableClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const id = target.getAttribute("data-id");
  if (!id) return;

  if (target.classList.contains("action-edit")) {
    const item = items.find((i) => i.id === id);
    if (item) {
      fillFormForEdit(item);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  } else if (target.classList.contains("action-delete")) {
    const confirmDelete = confirm("Are you sure you want to delete this item?");
    if (!confirmDelete) return;

    try {
      await deleteItem(id);
      await fetchItems();
      populateCategoryFilter();
      renderItems();
      renderCatalog();
      renderBill();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to delete item.");
    }
  }
}

// ====== Catalog Handlers ======
async function handleCatalogSubmit(event) {
  event.preventDefault();

  if (
    !catalogNameInput ||
    !catalogSkuInput ||
    !catalogQtyInput ||
    !catalogImageInput
  )
    return;

  const id = catalogIdInput ? catalogIdInput.value || null : null;
  const name = catalogNameInput.value.trim();
  const sku = catalogSkuInput.value.trim();
  const qty = parseInt(catalogQtyInput.value, 10) || 1;
  const imageUrl = catalogImageInput.value.trim();

  if (!name || !sku) {
    alert("Catalog product name and SKU are required.");
    return;
  }

  if (qty <= 0) {
    alert("Quantity must be at least 1.");
    return;
  }

  const payload = { name, sku, qty, imageUrl };

  try {
    if (id) {
      await updateCatalogEntry(id, payload);
    } else {
      await createCatalogEntry(payload);
    }

    await fetchCatalog();
    renderCatalog();
    clearCatalogForm();
  } catch (err) {
    console.error(err);
    alert(err.message || "Failed to save catalog item.");
  }
}

async function handleCatalogClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const id = target.getAttribute("data-id");
  if (!id) return;

  if (target.classList.contains("catalog-edit")) {
    const entry = catalogItems.find((c) => c.id === id);
    if (entry) {
      fillCatalogFormForEdit(entry);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  } else if (target.classList.contains("catalog-delete")) {
    const confirmDelete = confirm(
      "Are you sure you want to delete this catalog item?"
    );
    if (!confirmDelete) return;

    try {
      await deleteCatalogEntry(id);
      await fetchCatalog();
      renderCatalog();
      clearCatalogForm();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to delete catalog item.");
    }
  }
}

// ====== Billing Handlers ======
function handleAddBillItem() {
  if (!billSKUInput || !billQtyInput) return;

  const sku = billSKUInput.value.trim();
  const qty = parseInt(billQtyInput.value, 10) || 0;

  if (!sku || qty <= 0) {
    alert("Please enter a valid SKU and quantity.");
    return;
  }

  const item = items.find((i) => i.sku === sku);
  if (!item) {
    alert("No inventory item found with this SKU.");
    return;
  }

  if (qty > item.qty) {
    alert(`Not enough stock. Available: ${item.qty}, requested: ${qty}.`);
    return;
  }

  const existingIndex = currentBillItems.findIndex((l) => l.sku === sku);
  if (existingIndex >= 0) {
    const newQty = currentBillItems[existingIndex].qty + qty;
    if (newQty > item.qty) {
      alert(
        `Total quantity in bill exceeds stock. Available: ${item.qty}, requested total: ${newQty}.`
      );
      return;
    }
    currentBillItems[existingIndex].qty = newQty;
  } else {
    currentBillItems.push({
      sku,
      name: item.name,
      qty,
    });
  }

  billSKUInput.value = "";
  billQtyInput.value = "1";

  renderBill();
}

function handleBillingTableClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  if (target.classList.contains("bill-remove")) {
    const index = parseInt(target.getAttribute("data-index") || "-1", 10);
    if (!Number.isNaN(index) && index >= 0 && index < currentBillItems.length) {
      currentBillItems.splice(index, 1);
      renderBill();
    }
  }
}

async function handleSaveBill() {
  if (currentBillItems.length === 0) {
    alert("Add at least one item to the bill.");
    return;
  }

  const customerName = billCustomerNameInput
    ? billCustomerNameInput.value.trim()
    : "";
  const customerPhone = billCustomerPhoneInput
    ? billCustomerPhoneInput.value.trim()
    : "";
  const customerLocation = billCustomerLocationInput
    ? billCustomerLocationInput.value.trim()
    : "";
  const customerGST = billCustomerGSTInput
    ? billCustomerGSTInput.value.trim()
    : "";

  const payload = {
    customerName,
    customerPhone,
    customerLocation,
    customerGST,
    items: currentBillItems.map((line) => ({
      sku: line.sku,
      qty: line.qty,
    })),
  };

  try {
    const bill = await createBill(payload);

    alert(
      `Bill created successfully.\nGrand total: ₹${bill.grandTotal.toFixed(2)}`
    );

    // Refresh inventory (stock reduced on server)
    await fetchItems();
    populateCategoryFilter();
    renderItems();
    renderCatalog();
    clearBill();
    if (billCustomerNameInput) billCustomerNameInput.value = "";
    if (billCustomerPhoneInput) billCustomerPhoneInput.value = "";
    if (billCustomerLocationInput) billCustomerLocationInput.value = "";
    if (billCustomerGSTInput) billCustomerGSTInput.value = "";
  } catch (err) {
    console.error(err);
    alert(err.message || "Failed to create bill.");
  }
}

// ====== Filters & Export ======
function handleFiltersChange() {
  renderItems();
}

function handleExportCSV() {
  window.location.href = "/export/csv";
}

// ====== INIT ======
document.addEventListener("DOMContentLoaded", async () => {
  // THEME INIT (shared for all dashboard pages)
  const root = document.documentElement;
  const storedTheme = window.localStorage.getItem("invento-theme");
  if (storedTheme === "dark" || storedTheme === "light") {
    root.setAttribute("data-theme", storedTheme);
  }

  const applyTheme = (next) => {
    root.setAttribute("data-theme", next);
    window.localStorage.setItem("invento-theme", next);
  };

  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = root.getAttribute("data-theme") || "light";
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next);
    });
  }

  // Fetch data where needed
  try {
    await fetchItems();
    await fetchCatalog();
  } catch (err) {
    console.error(err);
    // keep UI usable even if API fails on auth pages or early
  }

  // Inventory page
  if (
    tbody &&
    searchInput &&
    filterCategorySelect &&
    emptyState &&
    statItems &&
    statQty &&
    statValue
  ) {
    populateCategoryFilter();
    renderItems();

    if (form && resetBtn && exportBtn) {
      form.addEventListener("submit", handleFormSubmit);
      resetBtn.addEventListener("click", clearForm);
      tbody.addEventListener("click", handleTableClick);
      searchInput.addEventListener("input", handleFiltersChange);
      filterCategorySelect.addEventListener("change", handleFiltersChange);
      exportBtn.addEventListener("click", handleExportCSV);
    }
  }

  // Catalog page
  renderCatalog();
  if (catalogForm && catalogSubmitBtn && catalogResetBtn) {
    catalogForm.addEventListener("submit", handleCatalogSubmit);
    catalogResetBtn.addEventListener("click", clearCatalogForm);
  }
  if (catalogGrid) {
    catalogGrid.addEventListener("click", handleCatalogClick);
  }

  // Billing page
  renderBill();
  if (billAddItemBtn) {
    billAddItemBtn.addEventListener("click", handleAddBillItem);
  }
  if (billingBody) {
    billingBody.addEventListener("click", handleBillingTableClick);
  }
  if (billingSaveBtn) {
    billingSaveBtn.addEventListener("click", handleSaveBill);
  }
  if (billingClearBtn) {
    billingClearBtn.addEventListener("click", clearBill);
  }

  // ===== Header interactions (nav toggle + user menu) =====
  const navToggle = document.getElementById("nav-toggle");
  const mainNav = document.getElementById("main-nav");
  const userMenuBtn = document.getElementById("user-menu-btn");
  const userMenuDropdown = document.getElementById("user-menu-dropdown");

  if (navToggle && mainNav) {
    navToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      mainNav.classList.toggle("open");
      navToggle.classList.toggle("open");
    });

    // Close nav when clicking outside on mobile
    document.addEventListener("click", () => {
      mainNav.classList.remove("open");
      navToggle.classList.remove("open");
    });

    mainNav.addEventListener("click", (e) => e.stopPropagation());
  }

  if (userMenuBtn && userMenuDropdown) {
    userMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = userMenuDropdown.classList.contains("open");
      document
        .querySelectorAll(".user-menu-dropdown.open")
        .forEach((el) => el.classList.remove("open"));
      if (!isOpen) userMenuDropdown.classList.add("open");
    });

    document.addEventListener("click", () => {
      userMenuDropdown.classList.remove("open");
    });
  }
});