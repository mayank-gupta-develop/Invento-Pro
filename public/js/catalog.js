/* ================= STATE ================= */
let activeItemId = null;
async function fetchItems() {
  const res = await fetch("/api/catalog");
  window.items = res.ok ? await res.json() : [];
}
/* ================= ADD TO BILL ================= */
function addItemToBill(item, qty) {
  const bill = JSON.parse(localStorage.getItem("billItems") || "[]");

  const existing = bill.find(b => b.id === item.id);

  if (existing) {
    existing.qty += qty;
  } else {
    bill.push({
      id: item.id,
      name: item.name,
      sku: item.sku,
      mrp: Number(item.mrp),
      gst: Number(item.gst),
      purchase_price: Number(item.purchase_price),
      qty,
      discount: 0
    });
  }

  localStorage.setItem("billItems", JSON.stringify(bill));
}

/* ================= RENDER ================= */
function renderCatalog() {
  const container = document.getElementById("catalog-container");
  const empty = document.getElementById("catalog-empty");
  container.innerHTML = "";

  const visible = window.items.filter(i => Number(i.show_in_catalog) === 1);
  if (!visible.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  const grouped = {};
  visible.forEach(i => {
    (grouped[i.category || "Uncategorized"] ||= []).push(i);
  });

  Object.entries(grouped).forEach(([cat, list]) => {
    const section = document.createElement("section");
    section.className = "catalog-section";
    section.innerHTML = `<h3>${cat}</h3><div class="catalog-grid"></div>`;
    const grid = section.querySelector(".catalog-grid");

    list.forEach(i => {
      grid.insertAdjacentHTML("beforeend", `
        <div class="catalog-card">
          ${
            i.image_url
              ? `
                <div class="image-wrapper">
                  <img src="${i.image_url}" data-id="${i.id}" class="replace-image" />
                  <button class="remove-image" data-id="${i.id}" >🗑</button>
                </div>
              `
              : `
                <div class="image-placeholder">
                  <button class="add-image" data-id="${i.id}">Add Image</button>
                </div>
              `
          }

          <div class="catalog-content">
            <strong>${i.name}</strong>
            <div class="meta">SKU: ${i.sku}</div>
            <div class="meta">₹${i.mrp}</div>

            <input type="number" min="1" value="1"
              class="bill-qty" data-id="${i.id}">
            <button
  type="button"
  class="add-to-bill"
  data-id="${i.id}">
  Add to Bill
</button>
          </div>
        </div>
      `);
    });

    container.appendChild(section);
  });
}

/* ================= IMAGE PICKER ================= */
function pickImage(itemId) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";

  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;

    const fd = new FormData();
    fd.append("image", file);

    const res = await fetch(`/api/items/${itemId}/image-upload`, {
      method: "PUT",
      body: fd
    });

    if (!res.ok) {
      alert("Image upload failed");
      return;
    }

    const data = await res.json();
    const item = window.items.find(i => i.id === itemId);
    if (item) item.image_url = data.image_url;

    renderCatalog();
  };

  input.click();
}

/* ================= CLICK HANDLER ================= */
document.addEventListener("click", async (e) => {
  
  /* ===== ADD TO BILL ===== */
const billBtn = e.target.closest(".add-to-bill");
if (billBtn) {
  const card = billBtn.closest(".catalog-card");
  const qtyInput = card.querySelector(".bill-qty");

  const itemId = billBtn.dataset.id;
  const item = window.items.find(i => i.id === itemId);
  if (!item) return;

  const qty = Number(qtyInput.value || 1);
  addItemToBill(item, qty);
  
  window.location.href = "/billing";
  
  return;
}

  /* ===== ADD IMAGE ===== */
  if (e.target.classList.contains("add-image")) {
    pickImage(e.target.dataset.id);
    return;
  }

  /* ===== REPLACE IMAGE ===== */
  const img = e.target.closest("img.replace-image");
  if (img) {
    e.stopPropagation();
    pickImage(img.dataset.id);
    return;
  }

  /* ===== REMOVE IMAGE ===== */
  if (e.target.classList.contains("remove-image")) {
    const id = e.target.dataset.id;

    await fetch(`/api/items/${id}/image-remove`, { method: "DELETE" });

    const item = window.items.find(i => i.id === id);
    if (item) item.image_url = null;

    renderCatalog();
  }
});

/* ================= INIT ================= */
(async () => {
  await fetchItems();
  renderCatalog();
})();