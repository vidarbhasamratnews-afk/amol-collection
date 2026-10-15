/* ============================================================
 * cart.js — shopping cart (localStorage) + storefront UI
 * ------------------------------------------------------------
 * - Cart is kept in localStorage key "ac_cart": [{id, qty}]
 * - Renders the product grid, category chips, search filter,
 *   quick-view modal and the slide-in cart drawer.
 * Loaded on: index.html
 * ============================================================ */

const CART_KEY = "ac_cart";
let ALL_PRODUCTS = [];       // full catalog
let ACTIVE_CATEGORY = "सभी"; // current category filter

// ---------- cart storage ----------
function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}
function cartQty() {
  return getCart().reduce((s, it) => s + it.qty, 0);
}
function findProduct(id) {
  return ALL_PRODUCTS.find(p => String(p.id) === String(id));
}
function cartDetailed() {
  // Join cart lines with live product info (name, price, image)
  return getCart().map(it => Object.assign({}, it, { product: findProduct(it.id) }))
                  .filter(it => it.product);
}
function cartTotal() {
  return cartDetailed().reduce((s, it) => s + it.product.price * it.qty, 0);
}

// ---------- cart mutations ----------
function addToCart(id, qty) {
  qty = qty || 1;
  const cart = getCart();
  const line = cart.find(it => String(it.id) === String(id));
  if (line) line.qty += qty; else cart.push({ id: String(id), qty });
  saveCart(cart);
  toast("✅ कार्ट में डाला गया");
}
function setQty(id, qty) {
  let cart = getCart();
  if (qty <= 0) cart = cart.filter(it => String(it.id) !== String(id));
  else {
    const line = cart.find(it => String(it.id) === String(id));
    if (line) line.qty = qty;
  }
  saveCart(cart);
  renderCartDrawer();
}
function removeFromCart(id) { setQty(id, 0); }
function clearCart() { saveCart([]); renderCartDrawer(); }

// ---------- storefront rendering ----------
function renderChips() {
  const wrap = document.getElementById("categoryChips");
  const cats = ["सभी", ...new Set(ALL_PRODUCTS.map(p => p.category))];
  wrap.innerHTML = "";
  cats.forEach(c => {
    const b = document.createElement("button");
    b.className = "chip" + (c === ACTIVE_CATEGORY ? " active" : "");
    b.textContent = c;
    b.onclick = () => { ACTIVE_CATEGORY = c; renderChips(); renderGrid(); };
    wrap.appendChild(b);
  });
}

function renderGrid() {
  const grid = document.getElementById("products");
  const q = (document.getElementById("searchInput").value || "").trim().toLowerCase();
  grid.innerHTML = "";
  ALL_PRODUCTS
    .filter(p => ACTIVE_CATEGORY === "सभी" || p.category === ACTIVE_CATEGORY)
    .filter(p => !q || p.name.toLowerCase().includes(q))
    .forEach(p => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML =
        '<img src="' + productImage(p) + '" alt="' + escapeHtml(p.name) + '" loading="lazy">' +
        '<div class="card-body">' +
          '<div class="card-name">' + escapeHtml(p.name) + "</div>" +
          '<div class="price-row"><span class="price">' + formatINR(p.price) + "</span>" +
          (p.mrp > p.price ? '<span class="mrp">' + formatINR(p.mrp) + "</span>" : "") + "</div>" +
          '<div class="card-actions">' +
            '<button class="btn btn-primary btn-sm" data-add="' + p.id + '">कार्ट में डालें</button>' +
            '<button class="btn btn-green btn-sm" data-buy="' + p.id + '">खरीदें</button>' +
          "</div>" +
        "</div>";
      card.querySelector("img").onclick = () => openQuickView(p.id);
      card.querySelector("[data-add]").onclick = e => { e.stopPropagation(); addToCart(p.id); };
      card.querySelector("[data-buy]").onclick = e => {
        e.stopPropagation(); addToCart(p.id); window.location.href = "checkout.html";
      };
      grid.appendChild(card);
    });
  if (!grid.children.length)
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#6b7280">😕 कोई प्रोडक्ट नहीं मिला</p>';
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ---------- quick view ----------
let QV_ID = null;
function openQuickView(id) {
  const p = findProduct(id); if (!p) return;
  QV_ID = id;
  document.getElementById("qvImg").src = productImage(p);
  document.getElementById("qvName").textContent = p.name;
  document.getElementById("qvPrice").textContent = formatINR(p.price);
  document.getElementById("qvMrp").textContent = p.mrp > p.price ? formatINR(p.mrp) : "";
  document.getElementById("qvDesc").textContent = p.description || "";
  document.getElementById("qvStock").textContent =
    p.stock > 0 ? "✅ स्टॉक में उपलब्ध (" + p.stock + ")" : "❌ फिलहाल स्टॉक खत्म";
  document.getElementById("quickView").classList.add("show");
}

// ---------- cart drawer ----------
function renderCartDrawer() {
  const box = document.getElementById("cartItems");
  const lines = cartDetailed();
  box.innerHTML = "";
  if (!lines.length) {
    box.innerHTML = '<div class="empty-cart">🛒<br>कार्ट खाली है<br>कुछ खिलौने चुनें!</div>';
  }
  lines.forEach(it => {
    const p = it.product;
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML =
      '<img src="' + productImage(p) + '" alt="">' +
      '<div class="cart-item-info"><b>' + escapeHtml(p.name) + "</b><br>" +
      '<span class="price">' + formatINR(p.price) + "</span>" +
      '<div class="qty-row">' +
        '<button class="qty-btn" data-dec="' + p.id + '">−</button>' +
        "<span>" + it.qty + "</span>" +
        '<button class="qty-btn" data-inc="' + p.id + '">+</button>' +
        '<button class="remove-link" data-rem="' + p.id + '">हटाएं</button>' +
      "</div></div>";
    box.appendChild(row);
  });
  box.querySelectorAll("[data-dec]").forEach(b => b.onclick = () => setQty(b.dataset.dec, getQtyOf(b.dataset.dec) - 1));
  box.querySelectorAll("[data-inc]").forEach(b => b.onclick = () => setQty(b.dataset.inc, getQtyOf(b.dataset.inc) + 1));
  box.querySelectorAll("[data-rem]").forEach(b => b.onclick = () => removeFromCart(b.dataset.rem));
  document.getElementById("cartTotal").textContent = formatINR(cartTotal());
}
function getQtyOf(id) {
  const line = getCart().find(it => String(it.id) === String(id));
  return line ? line.qty : 0;
}
function updateCartBadge() {
  const el = document.getElementById("cartCount");
  if (el) el.textContent = cartQty();
}
function openDrawer() {
  renderCartDrawer();
  document.getElementById("cartDrawer").classList.add("open");
  document.getElementById("overlay").classList.add("show");
}
function closeDrawer() {
  document.getElementById("cartDrawer").classList.remove("open");
  document.getElementById("overlay").classList.remove("show");
}

// ---------- init (storefront only; cart helpers are shared) ----------
document.addEventListener("DOMContentLoaded", async () => {
  if (!document.getElementById("products")) return; // not the storefront page
  try {
    ALL_PRODUCTS = await getProducts();
  } catch (e) {
    console.error(e);
    document.getElementById("products").innerHTML =
      '<p style="grid-column:1/-1;text-align:center">⚠️ प्रोडक्ट लोड नहीं हुए। बाद में पुनः प्रयास करें।</p>';
    return;
  }
  renderChips();
  renderGrid();
  updateCartBadge();
  document.getElementById("waOrderBtn").href =
    whatsappLink("नमस्ते! मुझे Amol Collection से खिलौने ऑर्डर करने हैं 🙏");

  document.getElementById("searchInput").addEventListener("input", renderGrid);
  document.getElementById("cartOpenBtn").onclick = openDrawer;
  document.getElementById("cartCloseBtn").onclick = closeDrawer;
  document.getElementById("continueBtn").onclick = closeDrawer;
  document.getElementById("overlay").onclick = closeDrawer;

  document.getElementById("qvClose").onclick = () =>
    document.getElementById("quickView").classList.remove("show");
  document.getElementById("qvAdd").onclick = () => { addToCart(QV_ID); };
  document.getElementById("qvBuy").onclick = () => {
    addToCart(QV_ID); window.location.href = "checkout.html";
  };
});
