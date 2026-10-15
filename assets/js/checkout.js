/* ============================================================
 * checkout.js — checkout page logic
 * ------------------------------------------------------------
 * - Renders the order summary from the cart
 * - Validates name / 10-digit mobile / address / pincode
 * - Payment: "cod" (Cash on Delivery) always; "upi" shows a
 *   QR code + shop UPI ID — customer pays from their own
 *   PhonePe/GPay app, then enters the 12-digit UTR.
 *   UTR format is validated (exactly 12 digits); true
 *   auto-verification is impossible without a PhonePe
 *   merchant account, so the admin verifies each payment
 *   in the PhonePe app and marks it "verified".
 * - Live mode: POSTs the order to Apps Script (createOrder)
 * - Demo mode: saves the order to localStorage ("ac_orders")
 * - Shows a confirmation screen with the Order ID
 * Loaded on: checkout.html
 * ============================================================ */

const DEMO_ORDERS_KEY = "ac_demo_orders";
let PAY_METHOD = "cod"; // "cod" | "upi"

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
  wrap.innerHTML =
    '<label class="pay-option selected" data-pay="cod">' +
      '<input type="radio" name="pay" value="cod" checked> ' +
      "<span>💵 <b>Cash on Delivery</b><br><small>सामान मिलने पर नकद भुगतान करें</small></span></label>" +
    '<label class="pay-option" data-pay="upi">' +
      '<input type="radio" name="pay" value="upi"> ' +
      "<span>📱 <b>UPI से पेमेंट</b><br><small>PhonePe / GPay से सीधे दुकान पर पेमेंट करें</small></span></label>";
  wrap.querySelectorAll(".pay-option").forEach(label => {
    label.addEventListener("click", () => {
      wrap.querySelectorAll(".pay-option").forEach(l => l.classList.remove("selected"));
      label.classList.add("selected");
      PAY_METHOD = label.dataset.pay;
      document.getElementById("upiBox").classList.toggle("hidden", PAY_METHOD !== "upi");
      if (PAY_METHOD === "upi") renderUpiBox();
    });
  });
  document.getElementById("copyUpiBtn").onclick = () => {
    navigator.clipboard.writeText(CONFIG.SHOP_UPI_ID).then(
      () => toast("📋 UPI ID कॉपी हो गई"),
      () => toast("⚠️ कॉपी नहीं हुई, हाथ से लिख लें"));
  };
}

// ---------- UPI QR box ----------
function upiPayUrl() {
  const amt = cartTotal().toFixed(2);
  return "upi://pay?pa=" + encodeURIComponent(CONFIG.SHOP_UPI_ID) +
    "&pn=" + encodeURIComponent(CONFIG.SHOP_UPI_NAME) +
    "&am=" + amt + "&cu=INR&tn=" + encodeURIComponent("AmolCollection");
}

function renderUpiBox() {
  document.getElementById("upiIdText").textContent = CONFIG.SHOP_UPI_ID;
  document.getElementById("upiAmount").textContent = formatINR(cartTotal());
  // QR image via free QR API; UPI ID + amount are also shown as text
  // so payment works even if the QR image fails to load.
  document.getElementById("upiQr").src =
    "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" +
    encodeURIComponent(upiPayUrl());
}

function validUtr(t) { return /^\d{12}$/.test(String(t).trim()); }

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

// ---------- place order ----------
async function placeOrder() {
  const customer = validateForm();
  if (!customer) { toast("⚠️ कृपया फॉर्म सही से भरें"); return; }
  const lines = cartDetailed();
  if (!lines.length) { toast("🛒 कार्ट खाली है"); return; }

  // UPI: require the 12-digit UTR before the order can be placed
  let utr = "";
  if (PAY_METHOD === "upi") {
    utr = document.getElementById("upiTxn").value.trim();
    if (!validUtr(utr)) {
      showErr("errUpiTxn", true);
      toast("⚠️ सही 12 अंकों का UTR लिखें");
      document.getElementById("upiTxn").focus();
      return;
    }
    showErr("errUpiTxn", false);
  }

  const orderPayload = {
    name: customer.name,
    phone: customer.phone,
    address: customer.address,
    pincode: customer.pincode,
    items: lines.map(it => ({ id: it.product.id, name: it.product.name, price: it.product.price, qty: it.qty })),
    total: cartTotal(),
    paymentMethod: PAY_METHOD,           // "cod" | "upi"
    paymentId: utr,                      // UTR for UPI, "" for COD
    paymentStatus: PAY_METHOD === "upi" ? "unverified" : "",
  };

  const btn = document.getElementById("placeOrderBtn");
  btn.disabled = true;
  btn.textContent = "⏳ कृपया प्रतीक्षा करें…";

  try {
    let orderId, payNote;
    if (isDemo()) {
      // Demo mode: id generated locally, order stored in browser
      orderId = makeOrderId();
      saveDemoOrder(Object.assign({
        orderId, createdAt: new Date().toISOString(), status: "Pending",
      }, orderPayload));
    } else {
      // Live mode: backend creates the order and the ID
      const res = await apiPost("createOrder", orderPayload);
      if (!res.ok) throw new Error(res.error || "order failed");
      orderId = res.orderId;
    }
    payNote = PAY_METHOD === "cod"
      ? "सामान डिलीवर होने पर नकद भुगतान करें।"
      : "✅ आपका UTR नोट कर लिया गया है (UTR: " + utr + ")। PhonePe में पेमेंट जांचकर दुकानदार आपका ऑर्डर कन्फर्म करेगा।";
    clearCart();
    showConfirmation(orderId, customer.phone, payNote);
  } catch (e) {
    console.error(e);
    toast("❌ ऑर्डर नहीं हो पाया: " + e.message);
    btn.disabled = false;
    btn.textContent = "✅ ऑर्डर पक्का करें";
  }
}

function showConfirmation(orderId, phone, payNote) {
  document.getElementById("checkoutMain").classList.add("hidden");
  document.getElementById("confirmMain").classList.remove("hidden");
  document.getElementById("confirmOrderId").textContent = orderId;
  document.getElementById("confirmPayNote").textContent = payNote;
  document.getElementById("trackLink").href =
    "track.html?orderId=" + encodeURIComponent(orderId) + "&phone=" + encodeURIComponent(phone);
  // Copy Order ID button
  document.getElementById("copyOrderIdBtn").onclick = () => {
    const id = document.getElementById("confirmOrderId").textContent.trim();
    const done = () => toast("📋 Order ID कॉपी हो गया: " + id);
    const fail = () => toast("⚠️ कॉपी नहीं हुआ — Order ID हाथ से लिख लें");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(id).then(done, fail);
    } else {
      const ta = document.createElement("textarea");
      ta.value = id;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); done(); } catch { fail(); }
      document.body.removeChild(ta);
    }
  };
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
