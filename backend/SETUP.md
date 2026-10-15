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

## (b) Razorpay (online payments — optional)

Online payment is **optional**. Without it the site offers Cash on
Delivery only, which needs zero setup.

1. Sign up at <https://razorpay.com> (free; test mode works without
   full KYC).
2. Dashboard → **Home → Test Mode** → copy the **Key ID**
   (looks like `rzp_test_xxxxxxxxxxxxxx`).
3. Paste it in `assets/js/config.js`:
   ```js
   RAZORPAY_KEY_ID: "rzp_test_xxxxxxxxxxxxxx",
   ```
4. The **Key Secret stays in Razorpay's dashboard** — it is never
   needed by, or committed to, this website.

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
- [ ] Razorpay Key ID in `config.js` (or leave empty for COD only)
- [ ] Admin password hash changed
- [ ] Pushed to GitHub, Pages enabled
