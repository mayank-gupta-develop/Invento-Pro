/* ================= STATE ================= */
const items = [];
let currentBillId = null;

/* ================= LOAD FROM LOCALSTORAGE ================= */
const saved = JSON.parse(localStorage.getItem("billItems") || "[]");

saved.forEach(i => {
  const existing = items.find(x => x.id === i.id);
  if (existing) existing.qty += i.qty;
  else items.push(i);
});

const params = new URLSearchParams(window.location.search);
const editBillId = params.get("edit");
/* ================= DOM ================= */
const body = document.getElementById("bill-body");

const qInput = document.getElementById("bill-query");
const qtyInput = document.getElementById("bill-qty");

const subEl = document.getElementById("sub");
const gstEl = document.getElementById("gst");
const discEl = document.getElementById("disc");
const grandEl = document.getElementById("grand");

const custName = document.getElementById("cust-name");
const custPhone = document.getElementById("cust-phone");
const custGST = document.getElementById("cust-gst");
const custAddress = document.getElementById("cust-address");

/* ================= LOOKUP ================= */
async function lookup(q) {
  const res = await fetch(`/api/items/lookup?q=${encodeURIComponent(q)}`);
  return res.ok ? res.json() : null;
}

/* ================= LOAD BILL FOR EDIT ================= */
async function loadBillForEdit(billId) {
  const res = await fetch(`/api/billing/${billId}`);
  if (!res.ok) {
    alert("Failed to load bill");
    return;
  }

  const { bill, items: billItems } = await res.json();
  currentBillId = bill.id;

  custName.value = bill.customer_name || "";
  custPhone.value = bill.customer_phone || "";
  custGST.value = bill.customer_gst || "";
  custAddress.value = bill.customer_address || "";

  items.length = 0;
  billItems.forEach(i => {
    items.push({
      id: i.item_id,
      name: i.name,
      sku: i.sku,
      mrp: i.mrp,
      gst: i.gst,
      purchase_price: i.purchase_price,
      qty: i.qty,
      discount: i.discount || 0
    });
  });

  render();
}

/* ================= RENDER ================= */
function render() {
  body.innerHTML = "";

  let subtotal = 0;
  let discountTotal = 0;
  let gstTotal = 0;

  items.forEach((i, idx) => {
  const mrp = Number(i.mrp);
  const qty = Number(i.qty);
  const gst = Number(i.gst);
  const discount = Number(i.discount || 0);

  const base = mrp * qty;
  const disc = base * (discount / 100);
  const taxable = base - disc;
const gstAmount = taxable * (gst / 100);

  subtotal += base;
  discountTotal += disc;
  gstTotal += gstAmount;

  body.insertAdjacentHTML("beforeend", `
    <tr>
      <td>${idx + 1}</td>
      <td>${i.name}</td>
      <td>${i.sku}</td>
      <td>${qty}</td>
      <td>₹${mrp.toFixed(2)}</td>
      <td>${gst}%</td>
      <td>
        <input type="number" min="0" value="${discount}"
          onchange="items[${idx}].discount=+this.value; render()">
      </td>
      <td>₹${(base - disc).toFixed(2)}</td>
      <td>
        <button onclick="items.splice(${idx},1); render()">✕</button>
      </td>
    </tr>
  `);
});

  subEl.textContent = subtotal.toFixed(2);
  discEl.textContent = discountTotal.toFixed(2);
  gstEl.textContent = gstTotal.toFixed(2);
  grandEl.textContent = (subtotal - discountTotal).toFixed(2);
}

/* ================= ADD ITEM ================= */
document.getElementById("add-item").onclick = async () => {
  const item = await lookup(qInput.value.trim());
  if (!item) return alert("Item not found");

  const qty = +qtyInput.value || 1;
  const existing = items.find(i => i.id === item.id);

  if (existing) {
    existing.qty += qty;
  } else {
    items.push({
      ...item,
      qty,
      discount: 0
    });
  }

  qInput.value = "";
  qtyInput.value = 1;
  render();
};

/* ================= SAVE & PRINT ================= */
document.getElementById("save-print").onclick = async () => {
  if (!items.length) {
    alert("Bill is empty");
    return;
  }

  const customerName = custName.value.trim();
  if (!customerName) {
    alert("Customer name is required");
    return;
  }

  const res = await fetch("/api/billing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      billId: currentBillId,   // ✅ correct variable
      customer_name: customerName,
      customer_phone: custPhone.value.trim() || null,
      customer_gst: custGST.value.trim() || null,
      customer_address: custAddress.value.trim() || null,
      items
    })
  });

  if (!res.ok) {
    alert("Failed to save bill");
    return;
  }

  const data = await res.json();
  currentBillId = data.billId;

  localStorage.removeItem("billItems");

  window.open(`/billing/print/${data.billId}`, "_blank");
};
/* ================= CLEAR BUTTON ================= */
document.getElementById("clear").onclick = () => {
  items.length = 0;
  currentBillId = null;
  localStorage.removeItem("billItems");
  render();
};
/* ================= INIT ================= */
if (editBillId) {
  loadBillForEdit(editBillId);
} else {
  render();
}