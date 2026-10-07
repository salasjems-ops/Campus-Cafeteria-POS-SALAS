/**
 * ==============================================================================
 * IT 415 Practical Examination - Scenario 1: Campus Cafeteria POS
 * File: script.js
 * Description: Client-side logic for product rendering, cart management,
 *              subtotal & total calculations, payment validation, change
 *              computation, and digital receipt generation.
 * ==============================================================================
 */

// ------------------------------------------------------------------------------
// 1. PRODUCT DATA (As specified in the examination scenario)
// ------------------------------------------------------------------------------
const PRODUCTS = [
  {
    id: 1,
    name: "Rice (Plain)",
    price: 15.00,
    category: "Staple",
    icon: "🍚"
  },
  {
    id: 2,
    name: "Fried Chicken (1 pc)",
    price: 65.00,
    category: "Main Dish",
    icon: "🍗"
  },
  {
    id: 3,
    name: "Pork Adobo",
    price: 60.00,
    category: "Main Dish",
    icon: "🍲"
  },
  {
    id: 4,
    name: "Vegetable Side Dish",
    price: 35.00,
    category: "Side Dish",
    icon: "🥗"
  },
  {
    id: 5,
    name: "Iced Tea (cup)",
    price: 20.00,
    category: "Beverage",
    icon: "🧋"
  },
  {
    id: 6,
    name: "Bottled Water",
    price: 20.00,
    category: "Beverage",
    icon: "💧"
  }
];

// ------------------------------------------------------------------------------
// 2. APPLICATION STATE
// ------------------------------------------------------------------------------
/**
 * cart is an array of objects:
 * [ { id, name, price, quantity, subtotal } ]
 */
let cart = [];

// Transaction counter starting at 1001 for professional POS receipts
let transactionCounter = 1001;

// ------------------------------------------------------------------------------
// 3. DOM ELEMENT REFERENCES
// ------------------------------------------------------------------------------
const productsGrid = document.getElementById("products-grid");
const cartBody = document.getElementById("cart-body");
const emptyCartState = document.getElementById("empty-cart-state");
const cartItemCount = document.getElementById("cart-item-count");
const totalQtyDisplay = document.getElementById("total-qty-display");
const totalAmountDisplay = document.getElementById("total-amount-display");

const cashInput = document.getElementById("cash-input");
const paymentError = document.getElementById("payment-error");
const btnPay = document.getElementById("btn-pay");
const btnClearCart = document.getElementById("btn-clear-cart");
const quickCashButtons = document.querySelectorAll(".btn-quick-cash");

// Receipt Modal Elements
const receiptModal = document.getElementById("receipt-modal");
const receiptTxnNo = document.getElementById("receipt-txn-no");
const receiptDateTime = document.getElementById("receipt-datetime");
const receiptItemsBody = document.getElementById("receipt-items-body");
const receiptTotalAmount = document.getElementById("receipt-total-amount");
const receiptCashPaid = document.getElementById("receipt-cash-paid");
const receiptChange = document.getElementById("receipt-change");
const btnNewTransaction = document.getElementById("btn-new-transaction");
const btnPrintReceipt = document.getElementById("btn-print-receipt");
const btnCloseModal = document.getElementById("btn-close-modal");

const liveDatetime = document.getElementById("live-datetime");

// ------------------------------------------------------------------------------
// 4. HELPER UTILITY FUNCTIONS
// ------------------------------------------------------------------------------
/**
 * Formats a numeric value into Philippine Peso string: "₱xx.xx"
 * @param {number} amount
 * @returns {string}
 */
function formatCurrency(amount) {
  return "₱" + Number(amount).toFixed(2);
}

/**
 * Returns a formatted date-time string (e.g., "Oct 07, 2026 12:45:00 PM")
 */
function getFormattedDateTime() {
  const now = new Date();
  return now.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
}

/**
 * Updates the live clock shown in the header every second
 */
function startLiveClock() {
  function tick() {
    if (liveDatetime) {
      liveDatetime.textContent = getFormattedDateTime();
    }
  }
  tick();
  setInterval(tick, 1000);
}

// ------------------------------------------------------------------------------
// 5. RENDERING FUNCTIONS
// ------------------------------------------------------------------------------

/**
 * Dynamically renders product catalog cards onto the left section
 */
function renderProducts() {
  productsGrid.innerHTML = "";

  PRODUCTS.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");

    card.innerHTML = `
      <div class="product-card-top">
        <span class="product-icon">${product.icon}</span>
        <div class="product-info">
          <div class="product-name">${product.name}</div>
          <span class="product-category">${product.category}</span>
        </div>
      </div>
      <div class="product-card-bottom">
        <span class="product-price">${formatCurrency(product.price)}</span>
        <button type="button" class="btn-add-item" data-id="${product.id}">+ Add</button>
      </div>
    `;

    // Clicking anywhere on the card or the "+ Add" button adds the product
    card.addEventListener("click", () => {
      addToCart(product.id);
    });

    productsGrid.appendChild(card);
  });
}

/**
 * Calculates current total quantity and total amount across all cart items
 * @returns {{ totalQty: number, totalAmount: number }}
 */
function calculateCartTotals() {
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  return { totalQty, totalAmount };
}

/**
 * Renders the cart table, subtotals, and total amounts
 */
function renderCart() {
  cartBody.innerHTML = "";

  if (cart.length === 0) {
    emptyCartState.classList.remove("hidden");
    cartItemCount.textContent = "0 items";
    totalQtyDisplay.textContent = "0";
    totalAmountDisplay.textContent = formatCurrency(0);
    return;
  }

  emptyCartState.classList.add("hidden");

  // Populate table rows
  cart.forEach((item) => {
    const itemSubtotal = item.price * item.quantity;
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>
        <strong>${item.name}</strong>
      </td>
      <td class="text-right">${formatCurrency(item.price)}</td>
      <td class="text-center">
        <div class="qty-controls">
          <button type="button" class="btn-qty btn-decrease" data-id="${item.id}" title="Decrease quantity">−</button>
          <span class="qty-val">${item.quantity}</span>
          <button type="button" class="btn-qty btn-increase" data-id="${item.id}" title="Increase quantity">+</button>
        </div>
      </td>
      <td class="text-right"><strong>${formatCurrency(itemSubtotal)}</strong></td>
      <td class="text-center">
        <button type="button" class="btn-remove-item" data-id="${item.id}" title="Remove item">✕</button>
      </td>
    `;

    cartBody.appendChild(row);
  });

  // Calculate and display overall totals
  const { totalQty, totalAmount } = calculateCartTotals();
  cartItemCount.textContent = `${totalQty} ${totalQty === 1 ? "item" : "items"}`;
  totalQtyDisplay.textContent = totalQty;
  totalAmountDisplay.textContent = formatCurrency(totalAmount);

  // Attach event listeners for dynamic cart actions
  attachCartEventListeners();
}

/**
 * Event delegation / listener attachment for quantity +/- and remove buttons
 */
function attachCartEventListeners() {
  // Decrease quantity buttons
  document.querySelectorAll(".btn-decrease").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = parseInt(btn.getAttribute("data-id"), 10);
      updateQuantity(id, -1);
    });
  });

  // Increase quantity buttons
  document.querySelectorAll(".btn-increase").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = parseInt(btn.getAttribute("data-id"), 10);
      updateQuantity(id, 1);
    });
  });

  // Remove item buttons
  document.querySelectorAll(".btn-remove-item").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = parseInt(btn.getAttribute("data-id"), 10);
      removeFromCart(id);
    });
  });
}

// ------------------------------------------------------------------------------
// 6. CART MANIPULATION FUNCTIONS
// ------------------------------------------------------------------------------

/**
 * Adds an item to the cart or increments its quantity if already present
 * @param {number} productId
 */
function addToCart(productId) {
  clearErrorMessage();
  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) return;

  const existingItem = cart.find((item) => item.id === productId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1
    });
  }

  renderCart();
}

/**
 * Modifies an item's quantity by a delta (+1 or -1)
 * If quantity drops below 1, the item is removed from the cart.
 * @param {number} productId
 * @param {number} delta
 */
function updateQuantity(productId, delta) {
  clearErrorMessage();
  const itemIndex = cart.findIndex((item) => item.id === productId);
  if (itemIndex === -1) return;

  cart[itemIndex].quantity += delta;

  if (cart[itemIndex].quantity <= 0) {
    cart.splice(itemIndex, 1);
  }

  renderCart();
}

/**
 * Removes a product completely from the cart
 * @param {number} productId
 */
function removeFromCart(productId) {
  clearErrorMessage();
  cart = cart.filter((item) => item.id !== productId);
  renderCart();
}

/**
 * Clears the active cart completely
 */
function clearCart() {
  if (cart.length === 0) return;
  
  if (confirm("Are you sure you want to clear the current order?")) {
    cart = [];
    cashInput.value = "";
    clearErrorMessage();
    renderCart();
  }
}

// ------------------------------------------------------------------------------
// 7. PAYMENT VALIDATION & TRANSACTION LOGIC
// ------------------------------------------------------------------------------

/**
 * Displays an error message banner and highlights the input
 * @param {string} message
 */
function showErrorMessage(message) {
  paymentError.textContent = message;
  paymentError.classList.remove("hidden");
  cashInput.classList.add("input-error");
  cashInput.focus();
}

/**
 * Clears any active error message
 */
function clearErrorMessage() {
  paymentError.textContent = "";
  paymentError.classList.add("hidden");
  cashInput.classList.remove("input-error");
}

/**
 * Validates the cash payment input according to examination requirements:
 * 1. Checks if cart has items
 * 2. Validates blank input
 * 3. Validates non-numeric input
 * 4. Validates negative or zero input
 * 5. Validates insufficient payment
 *
 * @param {number} totalAmount
 * @returns {{ isValid: boolean, cash: number, change: number }}
 */
function validatePayment(totalAmount) {
  // 1. Cart check
  if (cart.length === 0) {
    showErrorMessage("⚠️ Your cart is empty. Please select menu items first.");
    return { isValid: false, cash: 0, change: 0 };
  }

  const rawValue = cashInput.value.trim();

  // 2. Blank input validation
  if (rawValue === "") {
    showErrorMessage("⚠️ Payment field is blank. Please enter the cash received.");
    return { isValid: false, cash: 0, change: 0 };
  }

  const cash = Number(rawValue);

  // 3. Non-numeric validation
  if (isNaN(cash)) {
    showErrorMessage("⚠️ Invalid input. Cash payment must be a valid number.");
    return { isValid: false, cash: 0, change: 0 };
  }

  // 4. Negative or zero validation
  if (cash <= 0) {
    showErrorMessage("⚠️ Cash payment cannot be zero or negative.");
    return { isValid: false, cash: 0, change: 0 };
  }

  // 5. Insufficient payment validation
  if (cash < totalAmount) {
    const shortage = totalAmount - cash;
    showErrorMessage(
      `⚠️ Insufficient cash! Total is ${formatCurrency(totalAmount)}, received ${formatCurrency(cash)}. Short by ${formatCurrency(shortage)}.`
    );
    return { isValid: false, cash: 0, change: 0 };
  }

  // All validation checks passed!
  clearErrorMessage();
  const change = cash - totalAmount;
  return { isValid: true, cash, change };
}

/**
 * Processes the customer checkout, generates the receipt, and displays the modal
 */
function processPayment() {
  const { totalAmount } = calculateCartTotals();

  // Validate the entered cash
  const validation = validatePayment(totalAmount);
  if (!validation.isValid) {
    return;
  }

  // Generate and display digital receipt
  generateDigitalReceipt(validation.cash, validation.change, totalAmount);
}

/**
 * Populates the digital receipt modal with transaction details and displays it
 * @param {number} cashPaid
 * @param {number} change
 * @param {number} totalAmount
 */
function generateDigitalReceipt(cashPaid, change, totalAmount) {
  // Set transaction number and current timestamp
  receiptTxnNo.textContent = `TXN-${transactionCounter}`;
  receiptDateTime.textContent = getFormattedDateTime();

  // Populate purchased items table
  receiptItemsBody.innerHTML = "";
  cart.forEach((item) => {
    const subtotal = item.price * item.quantity;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="text-left">${item.name}</td>
      <td class="text-center">${item.quantity}</td>
      <td class="text-right">${formatCurrency(item.price)}</td>
      <td class="text-right">${formatCurrency(subtotal)}</td>
    `;
    receiptItemsBody.appendChild(row);
  });

  // Populate financial breakdown
  receiptTotalAmount.textContent = formatCurrency(totalAmount);
  receiptCashPaid.textContent = formatCurrency(cashPaid);
  receiptChange.textContent = formatCurrency(change);

  // Show the modal dialog
  receiptModal.classList.remove("hidden");
}

/**
 * Starts a brand new transaction:
 * - Increments transaction counter
 * - Clears cart array
 * - Resets cash input and error alerts
 * - Closes modal
 * - Re-renders empty cart
 */
function startNewTransaction() {
  transactionCounter += 1;
  cart = [];
  cashInput.value = "";
  clearErrorMessage();
  receiptModal.classList.add("hidden");
  renderCart();
}

/**
 * Closes the receipt preview modal without clearing if the user wants to review
 */
function closeModal() {
  receiptModal.classList.add("hidden");
}

/**
 * Triggers standard browser printing for the receipt
 */
function printReceipt() {
  window.print();
}

// ------------------------------------------------------------------------------
// 8. QUICK CASH PRESET BUTTONS HANDLER
// ------------------------------------------------------------------------------
function handleQuickCash(button) {
  clearErrorMessage();
  const amountType = button.getAttribute("data-amount");

  if (amountType === "exact") {
    const { totalAmount } = calculateCartTotals();
    cashInput.value = totalAmount > 0 ? totalAmount.toFixed(2) : "";
  } else {
    cashInput.value = Number(amountType).toFixed(2);
  }
}

// ------------------------------------------------------------------------------
// 9. EVENT LISTENERS INITIALIZATION
// ------------------------------------------------------------------------------
function initEventListeners() {
  // Pay button click
  btnPay.addEventListener("click", processPayment);

  // Enter key in cash input triggers payment
  cashInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      processPayment();
    }
  });

  // Clear cart button
  btnClearCart.addEventListener("click", clearCart);

  // Quick cash buttons
  quickCashButtons.forEach((btn) => {
    btn.addEventListener("click", () => handleQuickCash(btn));
  });

  // Receipt Modal actions
  btnNewTransaction.addEventListener("click", startNewTransaction);
  btnPrintReceipt.addEventListener("click", printReceipt);
  btnCloseModal.addEventListener("click", closeModal);

  // Close modal when clicking outside paper
  receiptModal.addEventListener("click", (e) => {
    if (e.target === receiptModal) {
      closeModal();
    }
  });
}

// ------------------------------------------------------------------------------
// 10. SYSTEM BOOTSTRAP / INITIALIZATION
// ------------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  renderCart();
  initEventListeners();
  startLiveClock();
});

