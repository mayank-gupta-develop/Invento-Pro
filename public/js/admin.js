// TERMINATE USER
document.querySelectorAll(".terminate-user").forEach(btn => {
  btn.addEventListener("click", async () => {
    if (!confirm("This will permanently delete the user and ALL their data. Continue?")) return;

    const row = btn.closest("tr");
    const userId = row.dataset.userId;

    const res = await fetch(`/admin/users/${userId}`, {
      method: "DELETE"
    });

    const data = await res.json();
    if (data.success) row.remove();
    else alert(data.error || "Failed to terminate user");
  });
});

// SEARCH USERS
const searchInput = document.getElementById("user-search");

searchInput.addEventListener("input", () => {
  const q = searchInput.value.toLowerCase();
  document.querySelectorAll("#user-table-body tr").forEach(row => {
    row.style.display = row.innerText.toLowerCase().includes(q)
      ? ""
      : "none";
  });
});

// PRINT USERS
document.getElementById("print-users").addEventListener("click", () => {
  const q = encodeURIComponent(searchInput.value || "");
  window.open(`/admin/users/print?q=${q}`, "_blank");
});

// EXPORT CSV
document.getElementById("export-users").addEventListener("click", () => {
  const q = encodeURIComponent(searchInput.value || "");
  window.location.href = `/admin/users/export?q=${q}`;
});

setInterval(loadStats, 5000);