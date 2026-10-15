# Backend setup — Google Apps Script + Google Sheet

The website is pure static HTML and costs nothing to host (GitHub Pages).
The "server" is a free Google Apps Script web app that reads/writes a
Google Sheet as the database. Follow these steps once.

## (a) Google Sheet + Apps Script

1. Log in to the shop's **Google account** and go to
   <https://sheets.google.com> → **Blank spreadsheet**. Name it
   `Amol Collection DB`.
2. In the sheet menu: **Extensions → Apps Script**. An editor opens.
3. Delete any code in `Code.gs` and paste the entire contents of
   `backend/Code.gs` from this repo. **Save** (💾).
4. In the toolbar dropdown (says "Select function") choose **`setup`**
   and press **Run** ▶. Accept the permission prompt (choose the shop's
   Google account → Advanced → Go to project → Allow). This creates the
   `Products` and `Orders` sheets with header rows.
5. In the Apps Script editor go to **Project Settings → Script Properties
   → Add script property**:
   - Property: `ADMIN_KEY`
   - Value: a long random secret, e.g. run this in a terminal:
     `openssl rand -hex 24`
   Keep this secret safe — it protects the admin API. You will also
   need it once when you first use the admin panel on the site.
6. **Deploy → New deployment** → gear icon → **Web app**:
   - *Description:* `Amol Collection API`
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**
   - Click **Deploy**, authorize again, and **copy the Web app URL**
     (ends with `/exec`).
7. In the website code open `assets/js/config.js` and paste that URL:
   ```js
   APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycb.../exec",
   ```
   (Keep the quotes.)

> ⚠️ If you later edit `Code.gs`, you must **Deploy → Manage
> deployments → Edit → New version** so the live URL picks up changes.

## (b) UPI payments (PhonePe / GPay — no gateway needed)

Online UPI payment works **without any payment-gateway account**.
Money goes straight to the shop's bank account via UPI.

1. Open `assets/js/config.js` and set your real UPI ID:
   ```js
   SHOP_UPI_ID: "gpay-12190083031@okbizaxis",   // ← your PhonePe/GPay UPI ID
   ```
   (PhonePe app → profile → "My UPI ID" me dikhega.)
2. That's it. At checkout the customer sees a QR code + your UPI ID,
   pays from their own UPI app, and enters the 12-digit UTR.

**How verification works:** a UTR cannot be auto-verified without a
PhonePe *merchant* (business) account with API access — so the site
validates the UTR format (exactly 12 digits) and marks the order
"⏳ जांच बाकी". You check the payment in your PhonePe app, then tap
**✅ Verify** on that order in the admin panel — one click.

## (c) Admin panel password

Default password is **`amol123`**. Change it before going live:

```bash
printf 'your-new-password' | sha256sum
```

Copy the hex string and put it in `assets/js/config.js`:

```js
ADMIN_PASSWORD_SHA256: "<paste the hex here>",
```

## (d) GitHub Pages (free hosting)

1. Push this folder to the `amol-collection` GitHub repo
   (branch `main`, repo root = website root).
2. Repo → **Settings → Pages**:
   - *Source:* **Deploy from a branch**
   - *Branch:* **main**, folder **/(root)** → Save.
3. The shop goes live at
   `https://<github-username>.github.io/amol-collection/`

## Quick checklist

- [ ] Sheet created, `Code.gs` pasted, `setup()` run
- [ ] Script Property `ADMIN_KEY` set
- [ ] Web app deployed as **Me / Anyone**, URL in `config.js`
- [ ] Shop UPI ID set in `config.js` (`SHOP_UPI_ID`)
- [ ] Admin password hash changed
- [ ] Pushed to GitHub, Pages enabled
