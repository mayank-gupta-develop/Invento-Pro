window.billItems = [];

window.addToBill = function (item, qty = 1) {
  const existing = billItems.find(b => b.id === item.id);

  if (existing) {
    existing.qty += qty;
  } else {
    billItems.push({
      ...item,
      qty,
      discount: 0
    });
  }
};