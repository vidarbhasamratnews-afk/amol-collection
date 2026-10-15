/* ============================================================
 * checkout.js — checkout page logic
 * ------------------------------------------------------------
 * - Renders the order summary from the cart
 * - Validates name / 10-digit mobile / address / pincode
 * - Payment: "cod" always; "online" only when a Razorpay
 *   Key ID is configured (then opens the Razorpay popup)
 * - Live mode: POSTs the order to Apps Script (createOrder)
 * - Demo mode: saves the order to localStorage ("ac_orders")
 * - Shows a confirmation screen with the Order ID
 * Loaded on: checkout.html
 * ============================================================ */

const DEMO_ORDERS_KEY = "ac_demo_orders";
let PAY_METHOD = "cod"; // "cod" | "online"

function getDemoOrders() {
  try { return JSON.parse(localStorage.getItem(DEMO_ORDERS_KEY)) || []; }
  catch { return []; }
}
function saveDemoOrder(order) {
  const orders = getDemoOrders();
  orders.unshift(order);
  localStorage.setItem(DEMO_ORDERS_KEY, JSON.stringify(orders));
}

// ---------- summary ----------
function renderSummary() {
  const box = document.getElementById("orderSummary");
  const lines = cartDetailed();
  if (!lines.length) {
    box.innerHTML = '<p style="color:#6b7280">🛒 कार्ट खाली है। <a href="index.html">पहले कुछ चुनें</a></p>';
    document.getElementById("placeOrderBtn").disabled = true;
    return;
  }
  box.innerHTML = lines.map(it =>
    '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed #eee">' +
    "<span>" + escapeHtml(it.product.name) + " × " + it.qty + "</span>" +
    "<b>" + formatINR(it.product.price * it.qty) + "</b></div>"
  ).join("") +
  '<div class="total-row" style="margin-top:10px"><span>कुल देय:</span><span>' +
  formatINR(cartTotal()) + "</span></div>";
}

// ---------- payment method selector ----------
function renderPayMethods() {
  const wrap = document.getElementById("payMethods");
  const onlineEnabled = !!CONFIG.RAZORPAY_KEY_ID;
  wrap.innerHTML =
    '<label class="pay-option selected" data-pay="cod">' +
      '<input type="radio" name="pay" value="cod" checked> ' +
      "<span>💵 <b>Cash on Delivery</b><br><small>सामान मिलने पर नकद भुगतान करें</small></span></label>" +
    '<label class="pay-option" data-pay="online" style="' + (onlineEnabled ? "" : "opacity:.5") + '">' +
      '<input type="radio" name="pay" value="online"' + (onlineEnabled ? "" : " disabled") + "> " +
      "<span>💳 <b>Online (UPI / Card)</b><br><small>" +
      (onlineEnabled ? "Razorpay द्वारा सुरक्षित पेमेंट" : "फिलहाल उपलब्ध नहीं") +
      "</small></span></label>";
  wrap.querySelectorAll(".pay-option").forEach(label => {
    label.addEventListener("click", () => {
      if (label.dataset.pay === "online" && !onlineEnabled) return;
      wrap.querySelectorAll(".pay-option").forEach(l => l.classList.remove("selected"));
      label.classList.add("selected");
      PAY_METHOD = label.dataset.pay;
    });
  });
}

// ---------- validation ----------
function showErr(id, bad) {
  document.getElementById(id).style.display = bad ? "block" : "none";
  return !bad;
}
function validateForm() {
  const name = document.getElementById("custName").value.trim();
  const phone = document.getElementById("custPhone").value.trim();
  const addr = document.getElementById("custAddress").value.trim();
  const pin = document.getElementById("custPincode").value.trim();
  let ok = true;
  ok = showErr("errName", name.length < 2) && ok;
  ok = showErr("errPhone", !validPhone(phone)) && ok;
  ok = showErr("errAddress", addr.length < 8) && ok;
  ok = showErr("errPincode", !validPincode(pin)) && ok;
  return ok ? { name, phone, address: addr, pincode: pin } : null;
}

// ---------- Razorpay ----------
function payWithRazorpay(amountPaise, customer, onSuccess) {
  const rzp = new Razorpay({
    key: CONFIG.RAZORPAY_KEY_ID,
    amount: amountPaise,          // in paise
    currency: "INR",
    name: CONFIG.SHOP_NAME,
    description: "Amol Collection ऑर्डर",
    prefill: { name: customer.name, contact: customer.phone },
    theme: { color: "#e11d48" },
    handler: function (resp) { onSuccess(resp.razorpay_payment_id); },
  });
  rzp.on("payment.failed", () => toast("❌ पेमेंट असफल रहा, पुनः प्रयास करें"));
  rzp.open();
}

// ---------- place order ----------
async function placeOrder() {
  const customer = validateForm();
  if (!customer) { toast("⚠️ कृपया फॉर्म सही से भरें"); return; }
  const lines = cartDetailed();
  if (!lines.length) { toast("🛒 कार्ट खाली है"); return; }

  const orderPayload = {
    name: customer.name,
    phone: customer.phone,
    address: customer.address,
    pincode: customer.pincode,
    items: lines.map(it => ({ id: it.product.id, name: it.product.name, price: it.product.price, qty: it.qty })),
    total: cartTotal(),
    paymentMethod: PAY_METHOD,
  };

  const btn = document.getElementById("placeOrderBtn");
  btn.disabled = true;
  btn.textContent = "⏳ कृपया प्रतीक्षा करें…";

  const finalize = async (paymentId) => {
    try {
      let orderId, payNote;
      if (isDemo()) {
        // Demo mode: id generated locally, order stored in browser
        orderId = makeOrderId();
        saveDemoOrder(Object.assign({
          orderId, createdAt: new Date().toISOString(),
          paymentId: paymentId || "", status: "Pending",
        }, orderPayload));
        payNote = PAY_METHOD === "cod"
          ? "सामान डिलीवर होने पर नकद भुगतान करें।"
          : "ऑनलाइन पेमेंट सफल (डेमो मोड)।";
      } else {
        // Live mode: backend creates the order and the ID
        const res = await apiPost("createOrder",
          Object.assign({ paymentId: paymentId || "" }, orderPayload));
        if (!res.ok) throw new Error(res.error || "order failed");
        orderId = res.orderId;
        payNote = PAY_METHOD === "cod"
          ? "सामान डिलीवर होने पर नकद भुगतान करें।"
          : "ऑनलाइन पेमेंट सफल। पेमेंट ID: " + (paymentId || "");
      }
      clearCart();
      showConfirmation(orderId, customer.phone, payNote);
    } catch (e) {
      console.error(e);
      toast("❌ ऑर्डर नहीं हो पाया: " + e.message);
      btn.disabled = false;
      btn.textContent = "✅ ऑर्डर पक्का करें";
    }
  };

  if (PAY_METHOD === "online" && CONFIG.RAZORPAY_KEY_ID) {
    btn.disabled = false;
    btn.textContent = "✅ ऑर्डर पक्का करें";
    payWithRazorpay(cartTotal() * 100, customer, (pid) => finalize(pid));
  } else {
    await finalize(""); // COD — no payment id
  }
}

function showConfirmation(orderId, phone, payNote) {
  document.getElementById("checkoutMain").classList.add("hidden");
  document.getElementById("confirmMain").classList.remove("hidden");
  document.getElementById("confirmOrderId").textContent = orderId;
  document.getElementById("confirmPayNote").textContent = payNote;
  document.getElementById("trackLink").href =
    "track.html?orderId=" + encodeURIComponent(orderId) + "&phone=" + encodeURIComponent(phone);
  window.scrollTo(0, 0);
}

// ---------- init ----------
document.addEventListener("DOMContentLoaded", () => {
  // cart.js populates ALL_PRODUCTS via getProducts(); wait a tick then render
  const boot = () => {
    if (!ALL_PRODUCTS.length) { setTimeout(boot, 200); return; }
    renderSummary();
    renderPayMethods();
    document.getElementById("placeOrderBtn").onclick = placeOrder;
  };
  getProducts().then(p => { ALL_PRODUCTS = p; updateCartBadge(); boot(); })
               .catch(() => toast("⚠️ प्रोडक्ट लोड नहीं हुए"));
});
