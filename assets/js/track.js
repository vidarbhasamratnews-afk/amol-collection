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

function copyText(text, msg) {
  const done = () => toast(msg || "📋 कॉपी हो गया");
  const fail = () => toast("⚠️ कॉपी नहीं हुआ");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done, fail);
  } else {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); done(); } catch { fail(); }
    document.body.removeChild(ta);
  }
}

function renderOrder(order) {
  document.getElementById("trackResult").classList.remove("hidden");
  document.getElementById("trackError").classList.add("hidden");
  document.getElementById("tOrderId").textContent = order.orderId;
  document.getElementById("copyTrackIdBtn").onclick = () =>
    copyText(order.orderId, "📋 Order ID कॉपी हो गया");
  // Success banner when arriving fresh from checkout (?new=1)
  const banner = document.getElementById("trackSuccess");
  if (new URLSearchParams(location.search).get("new") === "1") {
    let html = "🎉 <b>ऑर्डर सफल हो गया!</b> आप यहाँ अपना ऑर्डर ट्रैक कर सकते हैं।";
    if (order.paymentMethod === "upi" && order.paymentStatus === "unverified")
      html += "<br><small>✅ आपका UTR मिल गया है — दुकानदार PhonePe में पेमेंट जांचकर कन्फर्म करेगा।</small>";
    else if (order.paymentMethod === "cod")
      html += "<br><small>💵 सामान मिलने पर नकद भुगतान करें।</small>";
    banner.innerHTML = html;
    banner.classList.remove("hidden");
  } else {
    banner.classList.add("hidden");
  }
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

// ---------- "My orders" lookup by phone (no Order ID needed) ----------
async function showMyOrders() {
  const phone = document.getElementById("myPhone").value.trim();
  const err = document.getElementById("myOrdersError");
  const list = document.getElementById("myOrdersList");
  if (!validPhone(phone)) {
    err.textContent = "⚠️ सही 10 अंकों का मोबाइल नंबर लिखें";
    err.classList.remove("hidden");
    return;
  }
  err.classList.add("hidden");
  list.innerHTML = "<p>🔍 खोज रहे हैं…</p>";
  try {
    let orders;
    if (isDemo()) {
      orders = getDemoOrders()
        .filter(o => String(o.phone) === phone)
        .map(o => ({ orderId: o.orderId, createdAt: o.createdAt, total: o.total,
                     paymentMethod: o.paymentMethod, paymentStatus: o.paymentStatus,
                     status: o.status }));
    } else {
      const res = await apiGet("getOrdersByPhone", { phone });
      if (!res.ok) throw new Error(res.error || "lookup failed");
      orders = res.orders;
    }
    if (!orders.length) {
      list.innerHTML = "<p>😕 इस नंबर पर कोई ऑर्डर नहीं मिला।</p>";
      return;
    }
    list.innerHTML = orders.map(o => {
      const payTag = o.paymentMethod === "upi"
        ? (o.paymentStatus === "verified" ? " • ✅ पेमेंट सत्यापित" : " • ⏳ पेमेंट जांच बाकी")
        : " • 💵 COD";
      return '<a href="track.html?orderId=' + encodeURIComponent(o.orderId) +
        "&phone=" + encodeURIComponent(phone) +
        '" style="display:block;padding:10px 12px;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:8px;text-decoration:none;color:inherit;background:#fff">' +
        "<b>" + escapeHtml(o.orderId) + "</b> — <b>" + formatINR(o.total) + "</b><br>" +
        '<small style="color:#6b7280">' +
        new Date(o.createdAt).toLocaleString("hi-IN", { dateStyle: "medium", timeStyle: "short" }) +
        " • " + (STATUS_HI[o.status] || o.status) + payTag + "</small></a>";
    }).join("");
  } catch (e) {
    console.error(e);
    err.textContent = "⚠️ कुछ गड़बड़ हुई, बाद में पुनः प्रयास करें।";
    err.classList.remove("hidden");
    list.innerHTML = "";
  }
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
  document.getElementById("myOrdersBtn").onclick = showMyOrders;
  // Pre-fill when coming from the checkout confirmation screen
  const q = new URLSearchParams(location.search);
  if (q.get("orderId")) document.getElementById("trackOrderId").value = q.get("orderId");
  if (q.get("phone")) document.getElementById("trackPhone").value = q.get("phone");
  if (q.get("orderId") && q.get("phone")) doTrack();
});
