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
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbwmOdtI37mB-wpCjZdgxP0HH0YhiXQeg98rC9Glwaywm0_L82FmDllsqQLLjrv5yjKd/exec",

  // ---- UPI payments (PhonePe / GPay / Paytm) ----
  // Customer pays DIRECTLY to this UPI ID from their own UPI app,
  // then enters the 12-digit UTR / transaction ID at checkout.
  // Put YOUR real UPI ID here — e.g. "7020319567@upi".
  //
  // NOTE (honest limitation): a UTR cannot be *automatically*
  // verified without a PhonePe merchant (business) account with API
  // access. The site validates the UTR format (exactly 12 digits)
  // and marks the order "payment unverified". The admin checks the
  // payment in the PhonePe app and taps "Verify" in the admin
  // panel — one click per order.
  SHOP_UPI_ID: "gpay-12190083031@okbizaxis",
  SHOP_UPI_NAME: "Amol Collection",

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
