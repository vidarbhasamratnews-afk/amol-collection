/* ============================================================
 * Amol Collection — site configuration
 * ------------------------------------------------------------
 * Fill the placeholder values below when you go live.
 * Nothing secret is stored here in the demo build.
 * ============================================================ */
const CONFIG = {
  // Shop details (shown in header/footer)
  SHOP_NAME: "Amol Collection",
  SHOP_ADDRESS: "Near Hanuman Mandir, Civil Lines, Gondia, Maharashtra",
  SHOP_PHONE: "7020319567",          // also used for WhatsApp order button
  CURRENCY: "₹",

  // ---- Backend (Google Apps Script web app) ----
  // Empty string = DEMO MODE: products come from demo-products.js
  // and orders are kept in the browser's localStorage.
  // When you deploy Code.gs, paste the Web app /exec URL here, e.g.
  //   "https://script.google.com/macros/s/AKfycb.../exec"
  APPS_SCRIPT_URL: "",

  // ---- Online payments (Razorpay) ----
  // Empty string = online payment hidden; only "Cash on Delivery"
  // is offered. To enable, paste your Razorpay Key ID (test or live),
  // e.g. "rzp_test_xxxxxxxxxxxxxx". The Key SECRET always stays in
  // Razorpay's dashboard — never commit it anywhere.
  RAZORPAY_KEY_ID: "",

  // ---- Admin panel password ----
  // SHA-256 hex of the admin password. Default below is the hash of
  // "amol123". CHANGE the password before going live:
  //   printf 'your-new-password' | sha256sum
  // then paste the resulting hex string here.
  ADMIN_PASSWORD_SHA256: "579cad5950a67815feea454631544ac698060d051fca6265790fbc3052090893",
};

// Convenience: WhatsApp chat link used for "WhatsApp पर ऑर्डर करें"
function whatsappLink(text) {
  return "https://wa.me/91" + CONFIG.SHOP_PHONE + "?text=" + encodeURIComponent(text);
}
