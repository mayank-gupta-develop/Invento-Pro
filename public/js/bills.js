// SEARCH
document.getElementById("search").addEventListener("input", e => {
  const q = e.target.value.toLowerCase();

  document.querySelectorAll("#bills-table tbody tr").forEach(row => {
    const invoice = row.dataset.invoice || "";
    const customer = row.dataset.customer || "";

    row.style.display =
      invoice.includes(q) || customer.includes(q) ? "" : "none";
  });
});

// PRINT
window.printBill = id => {
  window.open(`/billing/print/${id}`, "_blank");
};

// EDIT
window.editBill = id => {
  window.location.href = `/billing/edit/${id}`;
};

// DELETE
window.deleteBill = async id => {
  if (!confirm("Delete this bill?")) return;

  const res = await fetch(`/api/billing/${id}`, { method: "DELETE" });
  if (!res.ok) return alert("Delete failed");

  location.reload();
};