/* ============================================================
 * track.js — order tracking page
 * ------------------------------------------------------------
 * Customer enters Order ID + mobile number.
 * Live mode: GET action=getOrder&orderId=…&phone=…
 * Demo mode: looks in localStorage demo orders, plus the
 * built-in seeded demo order DEMO_SEED_ORDER.
 * Renders the order and a status timeline.
 * Loaded on: track.html
 * ============================================================ */

const STATUS_STEPS = ["Pending", "Confirmed", "Shipped", "Delivered"];
const STATUS_HI = {
  Pending: "प्राप्त हुआ", Confirmed: "पक्का हुआ",
  Shipped: "भेज दिया गया", Delivered: "डिलीवर हो गया",
  Cancelled: "रद्द",
};

function getDemoOrders() {
  try { return JSON.parse(localStorage.getItem("ac_demo_orders")) || []; }
  catch { return []; }
}

async function findOrder(orderId, phone) {
  if (isDemo()) {
    const all = getDemoOrders().concat([DEMO_SEED_ORDER]);
    return all.find(o =>
      String(o.orderId).toUpperCase() === String(orderId).toUpperCase() &&
      String(o.phone) === String(phone)) || null;
  }
  const res = await apiGet("getOrder", { orderId, phone });
  return res.ok ? res.order : null;
}

function renderTimeline(order) {
  const ul = document.getElementById("tTimeline");
  ul.innerHTML = "";
  if (order.status === "Cancelled") {
    ul.innerHTML = '<li class="cancelled done">❌ ऑर्डर रद्द कर दिया गया है</li>';
    return;
  }
  const idx = STATUS_STEPS.indexOf(order.status);
  STATUS_STEPS.forEach((s, i) => {
    const li = document.createElement("li");
    li.className = i <= idx ? "done" : "";
    li.textContent = (i <= idx ? "✅ " : "") + STATUS_HI[s];
    ul.appendChild(li);
  });
}

function renderOrder(order) {
  document.getElementById("trackResult").classList.remove("hidden");
  document.getElementById("trackError").classList.add("hidden");
  document.getElementById("tOrderId").textContent = order.orderId;
  document.getElementById("tDate").textContent =
    new Date(order.createdAt).toLocaleString("hi-IN", { dateStyle: "medium", timeStyle: "short" });
  document.getElementById("tTotal").textContent = formatINR(order.total);
  document.getElementById("tPay").textContent =
    order.paymentMethod === "cod" ? "Cash on Delivery" : "UPI (PhonePe / GPay)";
  const ps = document.getElementById("tPayStatus");
  if (order.paymentMethod === "upi" && order.paymentStatus === "unverified") {
    ps.style.color = "#b45309";
    ps.innerHTML = "⏳ पेमेंट जांच बाकी है — जल्दी कन्फर्म करवाने के लिए कॉल करें: " +
      '<a href="tel:+91' + CONFIG.SHOP_PHONE + '" style="color:#1d4ed8;text-decoration:underline">' +
      "📞 " + CONFIG.SHOP_PHONE + "</a>";
  } else if (order.paymentMethod === "upi" && order.paymentStatus === "verified") {
    ps.style.color = "#15803d";
    ps.textContent = "✅ पेमेंट सत्यापित हो गया है";
  } else {
    ps.textContent = "";
  }
  const items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
  document.getElementById("tItems").innerHTML =
    "<b>आइटम:</b><br>" + items.map(i =>
      "• " + escapeHtml(i.name) + " × " + i.qty + " — " + formatINR(i.price * i.qty)
    ).join("<br>");
  renderTimeline(order);
  document.getElementById("tWhatsApp").href = whatsappLink(
    "नमस्ते! मेरे ऑर्डर " + order.orderId + " के बारे में जानकारी चाहिए 🙏");
  document.getElementById("trackResult").scrollIntoView({ behavior: "smooth" });
}

async function doTrack() {
  const orderId = document.getElementById("trackOrderId").value.trim();
  const phone = document.getElementById("trackPhone").value.trim();
  const err = document.getElementById("trackError");
  if (!orderId || !validPhone(phone)) {
    err.textContent = "⚠️ सही ऑर्डर ID और 10 अंकों का मोबाइल नंबर लिखें";
    err.classList.remove("hidden");
    return;
  }
  toast("🔍 खोज रहे हैं…");
  try {
    const order = await findOrder(orderId, phone);
    if (!order) {
      err.textContent = "😕 ऑर्डर नहीं मिला। ID और मोबाइल नंबर जांच लें।";
      err.classList.remove("hidden");
      document.getElementById("trackResult").classList.add("hidden");
      return;
    }
    renderOrder(order);
  } catch (e) {
    console.error(e);
    err.textContent = "⚠️ कुछ गड़बड़ हुई, बाद में पुनः प्रयास करें।";
    err.classList.remove("hidden");
  }
}

// track.js shares escapeHtml via cart.js on some pages; define a fallback
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("trackBtn").onclick = doTrack;
  // Pre-fill when coming from the checkout confirmation screen
  const q = new URLSearchParams(location.search);
  if (q.get("orderId")) document.getElementById("trackOrderId").value = q.get("orderId");
  if (q.get("phone")) document.getElementById("trackPhone").value = q.get("phone");
  if (q.get("orderId") && q.get("phone")) doTrack();
});
