/* ============================================================
 * store.js — shared helpers for the Amol Collection storefront
 * ------------------------------------------------------------
 * Handles: product fetching (Apps Script or demo), price
 * formatting, product images, toast notifications.
 * ============================================================ */

const isDemo = () => !CONFIG.APPS_SCRIPT_URL; // demo mode when URL empty

// Format a number as Indian rupees: 1299 -> "₹1,299"
function formatINR(n) {
  return CONFIG.CURRENCY + Number(n).toLocaleString("en-IN");
}

// Resolve the image for a product: real URL if set, else demo SVG art,
// else a tiny neutral placeholder.
function productImage(p) {
  if (p.imageUrl) return p.imageUrl;
  if (p.art) return svgURI(p.art);
  return svgURI(toySVG("#f3f4f6", '<text x="100" y="110" text-anchor="middle" font-size="20" fill="#9ca3af">🎁</text>'));
}

// Fetch the product list.
// Live mode: GET <APPS_SCRIPT_URL>?action=getProducts
// Demo mode: returns the built-in DEMO_PRODUCTS array.
async function getProducts() {
  if (isDemo()) return DEMO_PRODUCTS;
  const res = await fetch(CONFIG.APPS_SCRIPT_URL + "?action=getProducts");
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "getProducts failed");
  return data.products;
}

// Generic POST helper for Apps Script actions.
async function apiPost(action, payload) {
  // NOTE: Apps Script web apps reject CORS preflights, so we must NOT
  // send Content-Type: application/json (that triggers a preflight).
  // text/plain is a "simple request" — no preflight — and doPost still
  // receives the JSON string in e.postData.contents.
  const res = await fetch(CONFIG.APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(Object.assign({ action }, payload)),
  });
  return res.json();
}

// Generic GET helper for Apps Script actions.
async function apiGet(action, params) {
  const q = new URLSearchParams(Object.assign({ action }, params)).toString();
  const res = await fetch(CONFIG.APPS_SCRIPT_URL + "?" + q);
  return res.json();
}

// Small toast notification at the bottom of the screen.
function toast(msg) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2200);
}

// Generate an order id: AC-YYYYMMDD-XXXX (used in demo mode;
// the Apps Script backend generates its own in live mode).
function makeOrderId() {
  const d = new Date();
  const ymd =
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0");
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return "AC-" + ymd + "-" + rand;
}

// Indian mobile validation: exactly 10 digits, starts with 6-9
function validPhone(p) { return /^[6-9]\d{9}$/.test(p); }
// Indian pincode: exactly 6 digits
function validPincode(p) { return /^\d{6}$/.test(p); }
