/**
 * Amol Collection — Google Apps Script backend
 * ============================================
 * Deploy as a Web App and paste the /exec URL into
 * assets/js/config.js as CONFIG.APPS_SCRIPT_URL.
 *
 * Sheets used:
 *   Products: id | name | price | mrp | category | stock | imageUrl | description | updatedAt
 *   Orders:   orderId | createdAt | name | phone | address | pincode |
 *             itemsJson | total | paymentMethod | paymentId | paymentStatus | status
 *
 * paymentMethod is "cod" or "upi". For UPI orders paymentId holds the
 * 12-digit UTR entered by the customer and paymentStatus is
 * "unverified" until the admin checks the PhonePe app and calls
 * verifyPayment, which sets it to "verified".
 *
 * NOTE: a UTR cannot be auto-verified without a PhonePe merchant
 * (business) account with API access. The backend validates the UTR
 * format (exactly 12 digits); verification itself is one click in
 * the admin panel after checking the PhonePe app.
 *
 * Admin writes (upsertProduct, deleteProduct, updateOrderStatus,
 * getOrders) require `adminKey` in the JSON body (POST) or in the
 * query string (GET) matching the Script Property ADMIN_KEY.
 * Run setup() once from the Apps Script editor to create sheets.
 */

// ---------- one-time setup: run manually ----------
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let products = ss.getSheetByName("Products");
  if (!products) {
    products = ss.insertSheet("Products");
    products.appendRow(["id", "name", "price", "mrp", "category", "stock", "imageUrl", "description", "updatedAt"]);
  }
  let orders = ss.getSheetByName("Orders");
  if (!orders) {
    orders = ss.insertSheet("Orders");
    orders.appendRow(["orderId", "createdAt", "name", "phone", "address", "pincode",
                     "itemsJson", "total", "paymentMethod", "paymentId", "paymentStatus", "status"]);
  }
  Logger.log("Sheets ready. Now set Script Property ADMIN_KEY, then Deploy > New deployment > Web app.");
}

// ---------- helpers ----------
function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function ok(data) {
  return jsonOut(Object.assign({ ok: true }, data || {}));
}

function fail(msg, code) {
  const out = jsonOut({ ok: false, error: msg });
  if (code === 403) { /* Apps Script can't set HTTP status; client checks ok:false */ }
  return out;
}

// Admin key must match the Script Property ADMIN_KEY.
// Accepts the key from the JSON body (POST) or query string (GET).
function checkAdmin(key) {
  const expected = PropertiesService.getScriptProperties().getProperty("ADMIN_KEY");
  if (!expected) return false;
  return String(key) === String(expected);
}

function rowToProduct(row) {
  return {
    id: String(row[0]), name: row[1], price: Number(row[2]), mrp: Number(row[3]),
    category: row[4], stock: Number(row[5]), imageUrl: row[6] || "",
    description: row[7] || "", updatedAt: row[8] || "",
  };
}

function rowToOrder(row) {
  return {
    orderId: String(row[0]), createdAt: row[1], name: row[2], phone: String(row[3]),
    address: row[4], pincode: String(row[5]), items: String(row[6]),
    total: Number(row[7]), paymentMethod: row[8], paymentId: String(row[9] || ""),
    paymentStatus: String(row[10] || ""), status: row[11],
  };
}

function makeOrderId() {
  const d = new Date();
  const ymd = d.getFullYear().toString() +
    ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2);
  const rand = ("000" + Math.floor(Math.random() * 10000)).slice(-4);
  return "AC-" + ymd + "-" + rand;
}

function validPhone(p) { return /^[6-9]\d{9}$/.test(String(p)); }

// ---------- GET ----------
function doGet(e) {
  try {
    const action = (e.parameter.action || "").trim();
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === "getProducts") {
      const sheet = ss.getSheetByName("Products");
      const rows = sheet ? sheet.getDataRange().getValues().slice(1) : [];
      return ok({ products: rows.map(rowToProduct) });
    }

    if (action === "getOrder") {
      const orderId = String(e.parameter.orderId || "").toUpperCase();
      const phone = String(e.parameter.phone || "");
      const sheet = ss.getSheetByName("Orders");
      const rows = sheet ? sheet.getDataRange().getValues().slice(1) : [];
      const found = rows.map(rowToOrder).find(o =>
        o.orderId.toUpperCase() === orderId && o.phone === phone);
      if (!found) return fail("Order not found");
      return ok({ order: found });
    }

    if (action === "getOrders") {
      if (!checkAdmin(e.parameter.adminKey)) return fail("Forbidden: bad adminKey", 403);
      const sheet = ss.getSheetByName("Orders");
      const rows = sheet ? sheet.getDataRange().getValues().slice(1) : [];
      return ok({ orders: rows.map(rowToOrder).reverse() }); // newest first
    }

    return fail("Unknown action: " + action);
  } catch (err) {
    return fail(String(err && err.message || err));
  }
}

// ---------- POST ----------
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    const action = String(body.action || "").trim();
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // ----- createOrder (public) -----
    if (action === "createOrder") {
      const name = String(body.name || "").trim();
      const phone = String(body.phone || "").trim();
      const address = String(body.address || "").trim();
      const pincode = String(body.pincode || "").trim();
      const items = body.items;
      const total = Number(body.total);
      const paymentMethod = body.paymentMethod === "upi" ? "upi" : "cod";
      const paymentId = String(body.paymentId || "");
      const paymentStatus = paymentMethod === "upi" ? "unverified" : "";

      if (name.length < 2) return fail("Invalid name");
      if (!validPhone(phone)) return fail("Invalid phone");
      if (address.length < 8) return fail("Invalid address");
      if (!/^\d{6}$/.test(pincode)) return fail("Invalid pincode");
      if (!Array.isArray(items) || !items.length) return fail("Empty cart");
      if (!(total > 0)) return fail("Invalid total");
      // UPI orders must carry a 12-digit UTR / transaction ID
      if (paymentMethod === "upi" && !/^\d{12}$/.test(paymentId)) return fail("Invalid UTR");

      const orderId = makeOrderId();
      ss.getSheetByName("Orders").appendRow([
        orderId, new Date(), name, phone, address, pincode,
        JSON.stringify(items), total, paymentMethod, paymentId, paymentStatus, "Pending",
      ]);
      return ok({ orderId: orderId });
    }

    // ----- admin actions below: require adminKey -----
    if (!checkAdmin(body.adminKey)) return fail("Forbidden: bad adminKey", 403);

    if (action === "upsertProduct") {
      const p = body.product || {};
      if (!p.name || !(Number(p.price) > 0)) return fail("Invalid product");
      const sheet = ss.getSheetByName("Products");
      const rows = sheet.getDataRange().getValues();
      const id = String(p.id || "p" + Date.now().toString(36));
      const row = [id, p.name, Number(p.price), Number(p.mrp || p.price),
                   p.category || "", Number(p.stock || 0), p.imageUrl || "",
                   p.description || "", new Date()];
      let foundAt = -1;
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === id) { foundAt = i + 1; break; }
      }
      if (foundAt > 0) sheet.getRange(foundAt, 1, 1, row.length).setValues([row]);
      else sheet.appendRow(row);
      return ok({ id: id });
    }

    if (action === "deleteProduct") {
      const id = String(body.id || "");
      const sheet = ss.getSheetByName("Products");
      const rows = sheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === id) { sheet.deleteRow(i + 1); break; }
      }
      return ok({});
    }

    if (action === "updateOrderStatus") {
      const orderId = String(body.orderId || "");
      const status = String(body.status || "");
      const allowed = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];
      if (!allowed.includes(status)) return fail("Invalid status");
      const sheet = ss.getSheetByName("Orders");
      const rows = sheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === orderId) {
          sheet.getRange(i + 1, 12).setValue(status); // column L = status
          break;
        }
      }
      return ok({});
    }

    // verifyPayment: admin has checked the PhonePe app and confirms
    // the UPI payment. Sets paymentStatus (column K) to "verified".
    if (action === "verifyPayment") {
      const orderId = String(body.orderId || "");
      const sheet = ss.getSheetByName("Orders");
      const rows = sheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === orderId) {
          sheet.getRange(i + 1, 11).setValue("verified"); // column K = paymentStatus
          break;
        }
      }
      return ok({});
    }

    return fail("Unknown action: " + action);
  } catch (err) {
    return fail(String(err && err.message || err));
  }
}
