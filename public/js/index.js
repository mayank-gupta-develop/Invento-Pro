// ================= GLOBAL INVENTORY STATE =================
window.items = [];

/* ================= FETCH ITEMS ================= */
async function fetchItems() {
  const res = await fetch("/api/items", {
    credentials: "same-origin",
  });

  if (!res.ok) {
    console.error("Failed to fetch items");
    return;
  }

  window.items = await res.json();
}

/* ================= CALCULATIONS ================= */
function calc(i) {
  const gstAmt = i.mrp * (i.gst / 100);
  const selling = i.purchase_price + gstAmt;
  const profit = (i.mrp - selling ) * i.qty;
  return { selling, profit };
}

/* ================= INIT ================= */
window.fetchItems = fetchItems;
window.calc = calc;

/* ================= LOGOUT TOGGLE ================= */
const userBtn = document.getElementById("user-btn");
const userBtnText = document.getElementById("user-btn-text");
const logoutForm = document.getElementById("logout-form");

if (userBtn && logoutForm) {
  let armed = false;

  userBtn.addEventListener("click", () => {
    if (!armed) {
      userBtnText.textContent = "Logout";
      userBtn.classList.add("logout-mode");
      armed = true;

      setTimeout(() => {
        userBtnText.textContent = userBtn.dataset.username;
        userBtn.classList.remove("logout-mode");
        armed = false;
      }, 3000);
    } else {
      logoutForm.submit();
    }
  });
}