/* ================= STATE ================= */

let selectedItem = null;
let searchTimer = null;
let searchResults = [];
window.items = [];

const LOW_STOCK_LIMIT = 5;

/* ================= HELPERS ================= */

function calc(i) {
  const purchase = Number(i.purchase_price || 0);
  const mrp = Number(i.mrp || 0);
  const gst = Number(i.gst || 0);
  const qty = Number(i.qty || 0);

  const taxableSelling = mrp / (1 + gst / 100); // reverse GST
  const profit = (taxableSelling - purchase) * qty;

  return {
    selling: mrp,
    profit
  };
}

function highlight(text, q) {
  if (!q) return text;
  return text.replace(new RegExp(`(${q})`, "ig"), "<mark>$1</mark>");
}

async function fetchItems() {
  const res = await fetch("/api/items", { credentials: "same-origin" });
  window.items = res.ok ? await res.json() : [];
}

/* ================= DOM ================= */

const form = document.getElementById("item-form");
const itemName = document.getElementById("item-name");
const skuInput = document.getElementById("item-sku");
const categoryInput = document.getElementById("item-category");
const qtyInput = document.getElementById("item-qty");
const purchasePrice = document.getElementById("item-purchase-price");
const mrp = document.getElementById("item-mrp");
const gst = document.getElementById("item-gst");
const showCatalog = document.getElementById("item-show-catalog");

const updateBtn = document.getElementById("update-info-btn");
const addBatchBtn = document.getElementById("add-batch-btn");
const resetBtn = document.getElementById("reset-btn");

const searchInput = document.getElementById("search-input");
const printBtn = document.getElementById("print-btn");

/* ================= AUTO-FILL ================= */

function autoFill() {
  const sku = skuInput.value.trim().toLowerCase();
  const cat = categoryInput.value.trim().toLowerCase();

  selectedItem = window.items.find(
    i =>
      i.sku.toLowerCase() === sku &&
      (i.category || "").toLowerCase() === cat
  );

  if (!selectedItem) return;

  itemName.value = selectedItem.name;
  purchasePrice.value = selectedItem.purchase_price;
  mrp.value = selectedItem.mrp;
  gst.value = selectedItem.gst;
}

skuInput.addEventListener("blur", autoFill);
categoryInput.addEventListener("blur", autoFill);

/* ================= INVENTORY RENDER ================= */

/* ================= INVENTORY RENDER ================= */

function renderInventory() {
  const body = document.getElementById("inventory-body");
  const empty = document.getElementById("empty-state");

  body.innerHTML = "";

  if (!window.items.length) {
    empty.style.display = "inline";
    return;
  }

  empty.style.display = "none";

  window.items.forEach((i, idx) => {
    const purchase = Number(i.purchase_price || 0);
    const mrpVal = Number(i.mrp || 0);
    const gstVal = Number(i.gst || 0);
    const qtyVal = Number(i.qty || 0);

    const selling = purchase + purchase * (gstVal / 100);
    const profit = (mrpVal - selling) * qtyVal;

    body.insertAdjacentHTML(
      "beforeend",
      `
      <tr>
        <td>${idx + 1}</td>
        <td>${i.name}</td>
        <td>${i.sku}</td>
        <td>${i.category || "-"}</td>
        <td>${qtyVal}</td>
        <td>₹${purchase.toFixed(2)}</td>
        <td>₹${mrpVal.toFixed(2)}</td>
        <td>₹${selling.toFixed(2)}</td>
        <td>${gstVal}%</td>
        <td>₹${profit.toFixed(2)}</td>
        <td>
          <input type="checkbox"
            class="catalog-toggle"
            data-id="${i.id}"
            ${i.show_in_catalog ? "checked" : ""}/>
        </td>
        <td>
          <button class="delete-btn" data-id="${i.id}">Delete</button>
        </td>
      </tr>
      `
    );
  });
}

/* ================= ADD / UPDATE ITEM ================= */

updateBtn.addEventListener("click", async () => {
  // ✅ Validation
  if (
    !itemName.value.trim() ||
    !skuInput.value.trim() ||
    !categoryInput.value.trim() ||
    !qtyInput.value ||
    !purchasePrice.value ||
    !mrp.value ||
    gst.value === ""
  ) {
    alert("❌ All fields are required");
    return;
  }

  const payload = {
    name: itemName.value.trim(),
    sku: skuInput.value.trim(),
    category: categoryInput.value.trim(),
    qty: Number(qtyInput.value),
    purchase_price: Number(purchasePrice.value),
    mrp: Number(mrp.value),
    gst: Number(gst.value),
    show_in_catalog: showCatalog.checked ? 1 : 0,
  };

  // 🔥 THIS WAS MISSING
  const res = await fetch("/api/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json();
    alert(err.error || "Failed to add item");
    return;
  }

  form.reset();
  selectedItem = null;

  await fetchItems();
  renderInventory();
});

/* ================= RESET ================= */

resetBtn.addEventListener("click", () => {
  form.reset();
  selectedItem = null;
});

/* ================= CATALOG TOGGLE ================= */

document
  .getElementById("inventory-body")
  .addEventListener("change", async (e) => {

    const checkbox = e.target.closest(".catalog-toggle");
    if (!checkbox) return;

    const id = checkbox.dataset.id;
    const show = checkbox.checked ? 1 : 0;

    try {
      const res = await fetch(`/api/items/${id}/catalog`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ show_in_catalog: show }),
      });

      if (!res.ok) {
        alert("Failed to update catalog visibility");
        checkbox.checked = !checkbox.checked; // rollback UI
        return;
      }

      await fetchItems(); // keep window.items in sync

    } catch (err) {
      console.error(err);
      alert("Error updating catalog visibility");
      checkbox.checked = !checkbox.checked;
    }
  });
  
addBatchBtn.addEventListener("click", async () => {
  if (!selectedItem) {
    alert("Select item using SKU + Category");
    return;
  }

  await fetch(`/api/items/${selectedItem.id}/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      qty: Number(qtyInput.value),
      purchase_price: Number(purchasePrice.value),
    }),
  });

  form.reset();
  selectedItem = null;
  await fetchItems();
  renderInventory();
});
/* ================= DELETE ITEM ================= */

document
  .getElementById("inventory-body")
  .addEventListener("click", async (e) => {

    const btn = e.target.closest(".delete-btn");
    if (!btn) return;

    const id = btn.dataset.id;
    if (!id) return;

    const confirmed = confirm("Are you sure you want to delete this item?");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/items/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      if (!res.ok) {
        alert("Failed to delete item");
        return;
      }

      await fetchItems();
      renderInventory();

    } catch (err) {
      console.error(err);
      alert("Error deleting item");
    }
  });
/* ================= SEARCH ================= */

function renderSearch(data, q) {
  const body = document.getElementById("search-body");
  const empty = document.getElementById("search-empty");
  const actions = document.getElementById("search-actions");

  body.innerHTML = "";

  if (!data.length) {
    empty.textContent = "No items found";
    empty.style.display = "block";
    actions.style.display = "none";
    return;
  }

  empty.style.display = "none";
  actions.style.display = "flex";

  data.forEach((i, idx) => {
    const { selling, profit } = calc(i);
    body.insertAdjacentHTML(
      "beforeend",
      `
      <tr>
        <td>${idx + 1}</td>
        <td>${highlight(i.name, q)}</td>
        <td>${highlight(i.sku, q)}</td>
        <td>${highlight(i.category || "-", q)}</td>
        <td>${i.qty}</td>
        <td>₹${Number(i.purchase_price || 0).toFixed(2)}</td>
        <td>₹${Number(i.mrp || 0).toFixed(2)}</td>
        <td>₹${selling.toFixed(2)}</td>
        <td>${i.gst}%</td>
        <td>₹${profit.toFixed(2)}</td>
      </tr>
      `
    );
  });
}

searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);

  searchTimer = setTimeout(() => {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) return;

    searchResults = window.items.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.sku.toLowerCase().includes(q) ||
      (i.category || "").toLowerCase().includes(q)
    );

    renderSearch(searchResults, q);
  }, 250);
});

/* ================= CSV EXPORT ================= */

document.getElementById("csv-btn").addEventListener("click", () => {
  if (!searchResults.length) {
    alert("No search results to export");
    return;
  }

  let csv = "Name,SKU,Category,Qty,Purchase,MRP,GST\n";
  searchResults.forEach(i => {
    csv += `"${i.name}","${i.sku}","${i.category || ""}",${i.qty},${i.purchase_price},${i.mrp},${i.gst}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "inventory-search.csv";
  a.click();
});

/* ================= PRINT (SEARCH RESULTS ONLY — FINAL CLEAN) ================= */

printBtn.addEventListener("click", () => {
  if (!searchResults.length) {
    alert("No search results to print");
    return;
  }

  const now = new Date().toLocaleString();
  const username =
    document.getElementById("user-btn-text")?.textContent || "User";

  const rows = searchResults.map((i, idx) => {
    const { selling, profit } = calc(i);
    return `
      <tr>
        <td>${idx + 1}</td>
        <td>${i.name}</td>
        <td>${i.sku}</td>
        <td>${i.category || "-"}</td>
        <td>${i.qty}</td>
        <td>₹${Number(i.purchase_price || 0).toFixed(2)}</td>
        <td>₹${Number(i.mrp || 0).toFixed(2)}</td>
        <td>₹${selling.toFixed(2)}</td>
        <td>${i.gst}%</td>
        <td>₹${profit.toFixed(2)}</td>
      </tr>
    `;
  }).join("");

  const win = window.open("", "_blank", "width=1200,height=800");

  win.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>Inventory Search Print</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont;
      padding: 24px;
      color: #000;
    }

    /* ===== HEADER ===== */
    .print-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .brand img {
      width: 100px;
      height: 100px;
    }

    .brand-title {
      font-size: 50px;
      font-weight: 700;
    }

    .meta {
      font-size: 11px;
      text-align: right;
    }

    /* ===== TABLE ===== */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    th, td {
      border: 1px solid #000;
      padding: 6px;
      text-align: left;
    }

    th {
      background: #f3f4f6;
    }

    tr {
      page-break-inside: avoid;
    }

    /* ===== PRINT SETTINGS ===== */
    @page {
      margin: 20mm;
    }

    /* Hide browser-added about:blank text */
    @media print {
      body::before,
      body::after {
        content: none !important;
      }
    }
  </style>
</head>
<body>

  <div class="print-header">
    <div class="brand">
      <img src="/images/logo.png" alt="InventoPro Logo" />
      <div class="brand-title">Invento Pro</div>
    </div>

    <div class="meta">
      <div><strong>User:</strong> ${username}</div>
      <div><strong>Date:</strong> ${now}</div>
    </div>
  </div>

  <h3>Inventory Search Results</h3>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Name</th>
        <th>SKU</th>
        <th>Category</th>
        <th>Qty</th>
        <th>Purchase</th>
        <th>MRP</th>
        <th>Selling</th>
        <th>GST</th>
        <th>Profit</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <script>
    window.onload = () => {
      window.print();
      window.onafterprint = () => window.close();
    };
  </script>

</body>
</html>
  `);

  win.document.close();
});

/* ================= INIT ================= */

(async () => {
  await fetchItems();
  renderInventory();
})();