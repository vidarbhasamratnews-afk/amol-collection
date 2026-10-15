/* ============================================================
 * admin.js — admin panel (products + orders)
 * ------------------------------------------------------------
 * Login: password is SHA-256 hashed (Web Crypto) and compared
 * to CONFIG.ADMIN_PASSWORD_SHA256. Success sets a
 * sessionStorage flag (expires when the tab closes).
 *
 * Live mode: admin writes POST to Apps Script and include
 * `adminKey` (asked once per session via a prompt).
 * Demo mode: everything is stored in localStorage.
 * Loaded on: admin.html
 * ============================================================ */

const DEMO_PRODUCTS_KEY = "ac_demo_products";
const DEMO_ORDERS_KEY = "ac_demo_orders";

// Small HTML escaper (admin.html doesn't load cart.js)
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ---------- demo-mode storage ----------
function demoProducts() {
  try {
    const saved = JSON.parse(localStorage.getItem(DEMO_PRODUCTS_KEY));
    if (Array.isArray(saved) && saved.length) return saved;
  } catch {}
  const seed = JSON.parse(JSON.stringify(DEMO_PRODUCTS)); // deep copy
  localStorage.setItem(DEMO_PRODUCTS_KEY, JSON.stringify(seed));
  return seed;
}
function saveDemoProducts(list) {
  localStorage.setItem(DEMO_PRODUCTS_KEY, JSON.stringify(list));
}
function demoOrders() {
  const mine = (() => { try { return JSON.parse(localStorage.getItem(DEMO_ORDERS_KEY)) || []; } catch { return []; } })();
  // show the seeded demo order too, unless an order with the same id exists
  if (!mine.some(o => o.orderId === DEMO_SEED_ORDER.orderId)) return [DEMO_SEED_ORDER, ...mine];
  return mine;
}
function saveDemoOrders(list) {
  // never persist the seed order
  localStorage.setItem(DEMO_ORDERS_KEY,
    JSON.stringify(list.filter(o => o.orderId !== DEMO_SEED_ORDER.orderId)));
}

// ---------- admin key (live mode) ----------
function getAdminKey() {
  let k = sessionStorage.getItem("ac_admin_key");
  if (!k) {
    k = prompt("Apps Script वाला ADMIN_KEY लिखें (एक बार):");
    if (k) sessionStorage.setItem("ac_admin_key", k);
  }
  return k || "";
}

// ---------- crypto ----------
async function sha256hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

// ---------- login ----------
async function tryLogin() {
  const input = document.getElementById("adminPass").value;
  const hash = await sha256hex(input);
  if (hash === CONFIG.ADMIN_PASSWORD_SHA256.toLowerCase()) {
    sessionStorage.setItem("ac_admin", "1");
    showDashboard();
  } else {
    document.getElementById("errPass").style.display = "block";
  }
}
function logout() {
  sessionStorage.removeItem("ac_admin");
  sessionStorage.removeItem("ac_admin_key");
  location.reload();
}
function showDashboard() {
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("dashboard").classList.remove("hidden");
  document.getElementById("logoutBtn").classList.remove("hidden");
  loadProducts();
  loadOrders();
}

// ---------- products ----------
let PRODUCT_LIST = [];

async function loadProducts() {
  if (isDemo()) {
    PRODUCT_LIST = demoProducts();
  } else {
    const res = await apiGet("getProducts", {});
    PRODUCT_LIST = res.products || [];
  }
  renderProducts();
}

function renderProducts() {
  const tb = document.getElementById("productsTable");
  tb.innerHTML = "";
  PRODUCT_LIST.forEach(p => {
    const tr = document.createElement("tr");
    if (Number(p.stock) < 5) tr.className = "low-stock";
    tr.innerHTML =
      '<td><img src="' + productImage(p) + '" style="width:48px;height:48px;border-radius:8px"></td>' +
      "<td>" + escapeHtml(p.name) + "<br><small style='color:#6b7280'>" + escapeHtml(p.category || "") + "</small></td>" +
      "<td>" + formatINR(p.price) + "</td>" +
      "<td>" + (Number(p.stock) < 5 ? "⚠️ " : "") + p.stock + "</td>" +
      '<td><button class="btn btn-outline btn-sm" data-edit="' + p.id + '">✏️</button> ' +
      '<button class="btn btn-outline btn-sm" data-del="' + p.id + '">🗑️</button></td>';
    tb.appendChild(tr);
  });
  tb.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => openProductModal(b.dataset.edit));
  tb.querySelectorAll("[data-del]").forEach(b => b.onclick = () => deleteProduct(b.dataset.del));
}

function openProductModal(id) {
  const p = id ? PRODUCT_LIST.find(x => String(x.id) === String(id)) : null;
  document.getElementById("pmTitle").textContent = p ? "प्रोडक्ट एडिट करें" : "नया प्रोडक्ट";
  document.getElementById("pmId").value = p ? p.id : "";
  document.getElementById("pmName").value = p ? p.name : "";
  document.getElementById("pmPrice").value = p ? p.price : "";
  document.getElementById("pmMrp").value = p ? (p.mrp || "") : "";
  document.getElementById("pmCategory").value = p ? (p.category || "Soft Toys") : "Soft Toys";
  document.getElementById("pmStock").value = p ? p.stock : "";
  document.getElementById("pmImage").value = p ? (p.imageUrl || "") : "";
  document.getElementById("pmDesc").value = p ? (p.description || "") : "";
  updatePreview();
  document.getElementById("productModal").classList.add("show");
}

function updatePreview() {
  const url = document.getElementById("pmImage").value.trim();
  const img = document.getElementById("pmPreview");
  if (url) { img.src = url; img.style.display = "block"; }
  else img.style.display = "none";
}

async function saveProduct() {
  const id = document.getElementById("pmId").value;
  const name = document.getElementById("pmName").value.trim();
  const price = Number(document.getElementById("pmPrice").value);
  const mrp = Number(document.getElementById("pmMrp").value) || price;
  const category = document.getElementById("pmCategory").value;
  const stock = Number(document.getElementById("pmStock").value);
  const imageUrl = document.getElementById("pmImage").value.trim();
  const description = document.getElementById("pmDesc").value.trim();
  if (!name || !(price > 0) || isNaN(stock)) { toast("⚠️ नाम, कीमत और स्टॉक ज़रूर भरें"); return; }

  const product = {
    id: id || "p" + Date.now().toString(36),
    name, price, mrp, category, stock, imageUrl, description,
  };
  if (isDemo()) {
    const list = demoProducts();
    const i = list.findIndex(x => String(x.id) === String(product.id));
    if (i >= 0) list[i] = Object.assign(list[i], product); else list.push(product);
    saveDemoProducts(list);
  } else {
    const res = await apiPost("upsertProduct", { adminKey: getAdminKey(), product });
    if (!res.ok) { toast("❌ सेव नहीं हुआ: " + (res.error || "")); return; }
  }
  document.getElementById("productModal").classList.remove("show");
  toast("✅ प्रोडक्ट सेव हो गया");
  loadProducts();
}

async function deleteProduct(id) {
  if (!confirm("क्या यह प्रोडक्ट हटाना है?")) return;
  if (isDemo()) {
    saveDemoProducts(demoProducts().filter(x => String(x.id) !== String(id)));
  } else {
    const res = await apiPost("deleteProduct", { adminKey: getAdminKey(), id });
    if (!res.ok) { toast("❌ हटाया नहीं गया"); return; }
  }
  toast("🗑️ प्रोडक्ट हटा दिया");
  loadProducts();
}

// ---------- orders ----------
let ORDER_LIST = [];

async function loadOrders() {
  if (isDemo()) {
    ORDER_LIST = demoOrders();
  } else {
    const res = await apiGet("getOrders", { adminKey: getAdminKey() });
    ORDER_LIST = res.ok ? res.orders : [];
  }
  renderOrders();
}

function renderOrders() {
  const tb = document.getElementById("ordersTable");
  tb.innerHTML = "";
  if (!ORDER_LIST.length)
    tb.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#6b7280">कोई ऑर्डर नहीं</td></tr>';
  ORDER_LIST.forEach(o => {
    const items = typeof o.items === "string" ? JSON.parse(o.items) : o.items;
    const count = Array.isArray(items) ? items.reduce((s, i) => s + Number(i.qty || 0), 0) : 0;
    const tr = document.createElement("tr");
    let payCell;
    if (o.paymentMethod === "cod") {
      payCell = "COD";
    } else {
      // UPI: show UTR + verification state + one-click verify button
      const verified = o.paymentStatus === "verified";
      payCell = "UPI<br><small>UTR: " + escapeHtml(o.paymentId || "—") + "</small><br>" +
        (verified
          ? '<span style="color:#15803d;font-weight:700">✅ सत्यापित</span>'
          : '<span style="color:#b45309;font-weight:700">⏳ जांच बाकी</span> ' +
            '<button class="btn btn-outline btn-sm" data-verify="' + escapeHtml(o.orderId) + '">✅ Verify</button>');
    }
    tr.innerHTML =
      "<td><b>" + escapeHtml(o.orderId) + "</b></td>" +
      "<td>" + new Date(o.createdAt).toLocaleString("hi-IN", { dateStyle: "short", timeStyle: "short" }) + "</td>" +
      "<td>" + escapeHtml(o.name) + "</td>" +
      "<td>" + escapeHtml(o.phone) + "</td>" +
      "<td>" + count + "</td>" +
      "<td>" + formatINR(o.total) + "</td>" +
      "<td>" + payCell + "</td>" +
      '<td><select data-status="' + escapeHtml(o.orderId) + '">' +
        ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"].map(s =>
          '<option value="' + s + '"' + (s === o.status ? " selected" : "") + ">" + s + "</option>"
        ).join("") + "</select></td>";
    tb.appendChild(tr);
  });
  tb.querySelectorAll("[data-status]").forEach(sel =>
    sel.onchange = () => updateOrderStatus(sel.dataset.status, sel.value));
  tb.querySelectorAll("[data-verify]").forEach(btn =>
    btn.onclick = () => verifyPayment(btn.dataset.verify));
}

// Admin verifies the UPI payment in the PhonePe app first,
// then marks it verified here with one click.
async function verifyPayment(orderId) {
  if (!confirm("क्या PhonePe ऐप में पेमेंट देखकर सत्यापित कर दिया है?\nऑर्डर: " + orderId)) return;
  if (isDemo()) {
    const list = getDemoOrdersRaw();
    const o = list.find(x => x.orderId === orderId);
    if (o) { o.paymentStatus = "verified"; saveDemoOrders(list); }
    else if (orderId === DEMO_SEED_ORDER.orderId) { DEMO_SEED_ORDER.paymentStatus = "verified"; }
  } else {
    const res = await apiPost("verifyPayment", { adminKey: getAdminKey(), orderId });
    if (!res.ok) { toast("❌ सत्यापित नहीं हुआ"); return; }
  }
  toast("✅ पेमेंट सत्यापित");
  loadOrders();
}

async function updateOrderStatus(orderId, status) {
  if (isDemo()) {
    const list = getDemoOrdersRaw();
    const o = list.find(x => x.orderId === orderId);
    if (o) { o.status = status; saveDemoOrders(list); }
    else if (orderId === DEMO_SEED_ORDER.orderId) { DEMO_SEED_ORDER.status = status; }
  } else {
    const res = await apiPost("updateOrderStatus", { adminKey: getAdminKey(), orderId, status });
    if (!res.ok) { toast("❌ स्टेटस अपडेट नहीं हुआ"); loadOrders(); return; }
  }
  toast("✅ स्टेटस: " + status);
  loadOrders();
}

function getDemoOrdersRaw() {
  try { return JSON.parse(localStorage.getItem(DEMO_ORDERS_KEY)) || []; }
  catch { return []; }
}

// ---------- CSV export ----------
function exportCSV() {
  const rows = [["Order ID", "Date", "Name", "Phone", "Address", "Pincode", "Items", "Total", "Payment", "UTR / Payment ID", "Payment Status", "Status"]];
  ORDER_LIST.forEach(o => {
    const items = typeof o.items === "string" ? o.items : JSON.stringify(o.items);
    rows.push([o.orderId, o.createdAt, o.name, o.phone, o.address, o.pincode,
               items, o.total, o.paymentMethod, o.paymentId || "", o.paymentStatus || "", o.status]);
  });
  const csv = rows.map(r => r.map(c => '"' + String(c == null ? "" : c).replace(/"/g, '""') + '"').join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "amol-collection-orders.csv";
  a.click();
  URL.revokeObjectURL(a.href);
  toast("⬇️ CSV डाउनलोड हो गया");
}

// ---------- init ----------
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("loginBtn").onclick = tryLogin;
  document.getElementById("adminPass").addEventListener("keydown", e => { if (e.key === "Enter") tryLogin(); });
  document.getElementById("logoutBtn").onclick = logout;

  document.querySelectorAll(".tab").forEach(t => t.onclick = () => {
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    document.getElementById("tab-products").classList.toggle("hidden", t.dataset.tab !== "products");
    document.getElementById("tab-orders").classList.toggle("hidden", t.dataset.tab !== "orders");
  });

  document.getElementById("addProductBtn").onclick = () => openProductModal(null);
  document.getElementById("pmClose").onclick = () =>
    document.getElementById("productModal").classList.remove("show");
  document.getElementById("pmImage").addEventListener("input", updatePreview);
  document.getElementById("pmSave").onclick = saveProduct;
  document.getElementById("exportCsvBtn").onclick = exportCSV;

  if (sessionStorage.getItem("ac_admin") === "1") showDashboard();
});
