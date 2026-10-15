# Amol Collection — Online Store 🧸

A complete, zero-cost ecommerce website for **Amol Collection**,
a toy & gift shop in Gondia, Maharashtra.

📍 Near Hanuman Mandir, Civil Lines, Gondia, Maharashtra
📞 7020319567 (call / WhatsApp)

## Features

**Customer storefront** (`index.html`)
- Sticky header with logo, Hindi search, cart button + count badge
- Festive hero banner, category filter chips, product grid
- Product cards: photo, name, price in ₹, MRP strikethrough,
  "कार्ट में डालें" (add to cart) and "खरीदें" (buy now)
- Quick-view modal, slide-in cart drawer (quantity +/−, remove, total)
- Footer with address, phone and WhatsApp order button

**Checkout** (`checkout.html`)
- Name, 10-digit mobile (regex validated), address, pincode
- Payment: **Cash on Delivery** or **UPI** — customer pays directly
  to the shop's UPI ID from PhonePe / GPay (QR code shown), then
  enters the 12-digit UTR / transaction ID (format-validated)
- UTR can't be auto-verified without a PhonePe merchant account —
  the admin checks the PhonePe app and marks payment "verified"
  with one click in the admin panel
- Order ID format `AC-YYYYMMDD-XXXX`, confirmation screen with tracking link

**Order tracking** (`track.html`)
- Order ID + mobile → status timeline
  (Pending → Confirmed → Shipped → Delivered / Cancelled)
- Shows payment status for UPI orders (⏳ जांच बाकी / ✅ सत्यापित)

**Admin panel** (`admin.html`)
- Password login (SHA-256 hashed, session-only)
- Products tab: add / edit / delete products (price, MRP, category,
  stock, photo URL with preview, description)
- Orders tab: status dropdown, UPI orders show the customer's UTR
  with a one-click **✅ Verify** button (after checking the PhonePe
  app), low-stock (< 5) highlight, **CSV export**

## How it works (zero server cost)

- **Frontend:** pure static HTML/CSS/JS — no build step, no npm.
  GitHub Pages serves it directly.
- **Backend:** a Google Apps Script web app (`backend/Code.gs`)
  with a Google Sheet as the database (free).
- **Demo mode:** when `CONFIG.APPS_SCRIPT_URL` is empty, the site runs
  on built-in demo products (`assets/js/demo-products.js`, inline SVG
  art — no external images) and stores orders in `localStorage`.
  It works immediately with **zero setup**.

## Quick start

```bash
# demo mode — just open the page
open index.html
# or serve locally
python3 -m http.server 8000   # then visit http://localhost:8000
```

For production setup (Sheet, UPI ID, admin password, GitHub Pages)
follow **`backend/SETUP.md`** step by step.

## Configuration

All settings live in `assets/js/config.js`:

| Setting | Meaning |
|---|---|
| `APPS_SCRIPT_URL` | Apps Script web-app `/exec` URL. Empty = demo mode |
| `SHOP_UPI_ID` | Your shop's UPI ID for direct PhonePe/GPay payments (default `7020319567@upi` — change to your real one) |
| `ADMIN_PASSWORD_SHA256` | SHA-256 hex of the admin password (default `amol123`) |
| `SHOP_PHONE` | `7020319567` — used for the WhatsApp button |

## Required credentials (owner must complete)

| # | Credential / step | Where |
|---|---|---|
| 1 | Google account (for the Sheet + Apps Script) | Sheet → Extensions → Apps Script |
| 2 | `ADMIN_KEY` script property (strong random secret) | Apps Script → Project Settings |
| 3 | Apps Script web-app deployment (Execute as Me, access Anyone) | Apps Script → Deploy |
| 4 | Your shop's **UPI ID** (for PhonePe/GPay payments) | `SHOP_UPI_ID` in `config.js` |
| 5 | New admin password (SHA-256 hash) | `printf 'newpass' \| sha256sum` → `config.js` |
| 6 | GitHub repo `amol-collection` → Settings → Pages (main, /root) | github.com |

No real API keys or secrets are committed to this repo — only empty
placeholders. The Apps Script **ADMIN_KEY** never leaves its dashboard.
UPI payments need no gateway account: money goes straight to your
PhonePe/GPay-linked bank account.

## Project structure

```
├── index.html            # storefront
├── checkout.html         # checkout + UPI payment box
├── track.html            # order tracking
├── admin.html            # admin login + dashboard
├── assets/
│   ├── css/style.css
│   ├── js/
│   │   ├── config.js         # ← fill in URLs/keys here
│   │   ├── demo-products.js  # 10 demo products (inline SVG art)
│   │   ├── store.js          # shared helpers
│   │   ├── cart.js           # cart + storefront UI
│   │   ├── checkout.js       # checkout flow
│   │   ├── track.js          # tracking page
│   │   └── admin.js          # admin panel (incl. UPI verify)
│   └── img/logo.png          # shop logo
└── backend/
    ├── Code.gs               # Apps Script API
    └── SETUP.md              # full setup guide
```
