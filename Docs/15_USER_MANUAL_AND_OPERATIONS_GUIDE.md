# 📖 User Manual & Operational Playbooks — LinkPulse

```
========================================================================================
PROJECT          : LinkPulse (Next-Gen URL Infrastructure & Telemetry Route Engine)
DOCUMENT TYPE    : End-User Manual & Administrator Operations Guide
TARGET AUDIENCE  : Marketers, Creators, System Administrators & Support Engineers
VERSION          : 2.0.0
========================================================================================
```

---

## PART 1: Marketer & Creator Guide

### 1. Getting Started & Dashboard Overview
1. Open the application URL: **`https://kcstudio-linkpluse.vercel.app`** (or `http://localhost:5173` locally).
2. Sign in with your email and password, or click **Sign in with Google**.
3. **The Dashboard:**
   * **Total Clicks & Unique Visitors:** Real-time metrics reflecting non-bot visitor traffic.
   * **Live Spline Wave Timeline:** Interactive Chart.js graph (`#FFE3B3`) showing click velocity over time.
   * **Period Filter:** Switch between **Today**, **Last 7 Days**, **Last 30 Days**, or **Custom Range**.
   * **Top Performing Links:** Quick-access table showing top destinations by conversion volume.

---

### 2. Creating a Smart Short Link
Click the **Create Link** button in the top navigation bar to open the 2-step creation wizard:

```
[ Step 1: Destination & Alias ] ──► [ Step 2: Advanced Routing & Protection ] ──► [ Publish ]
```

#### Step 1: Destination & Alias
1. **Destination URL:** Paste your long URL (e.g., `https://mycompany.com/product/summer-special`).
2. **Custom Alias (Optional):** Enter a custom vanity slug (e.g., `summer-sale`). The system performs a real-time availability check:
   * 🟢 *"Available ✓"* — The slug is valid and ready to register.
   * 🔴 *"Taken"* or *"Reserved"* — The slug is already in use or reserved for system paths.
3. Click **Continue to Options**.

#### Step 2: Advanced Routing & Security
1. **Title & Tags:** Assign a memorable title and categorize the link with tags (e.g., `influencer`, `twitter`, `q2`).
2. **Campaign / Folder:** Organize the link into a specific Campaign or Workspace Folder.
3. **📱 Device Targeting (Dynamic Routing):**
   * *iOS Destination:* Paste Apple App Store URL for iPhone and iPad visitors.
   * *Android Destination:* Paste Google Play Store URL for Android visitors.
   * *Desktop Destination:* Paste web app or dashboard URL for desktop visitors.
   *(Any field left empty automatically falls back to the default Destination URL).*
4. **🔐 Password Protection:** Enter a password. Visitors must enter this password before being redirected.
5. **⏱️ Expiry Date:** Choose a UTC expiration cutoff. After this date, the link auto-expires (analytics are preserved).
6. **🎯 Click Limit:** Set a maximum click quota. Once reached, the link automatically locks.
7. Click **Publish Link**. Your short link is generated instantly and ready to share!

---

### 3. Generating High-Resolution QR Codes
1. Navigate to **Links** and select any active link to open the **Link Detail Overview**.
2. Locate the **QR Code Card** on the overview panel.
3. Choose your desired resolution from the dropdown (from **64px** up to **2048px Ultra-HD**).
4. Click **⬇ Download PNG** (for print flyers, posters, and merchandise) or **⬇ Download SVG** (for vector graphic designers).
* **Automatic Attribution:** Every QR code automatically embeds `?src=qr`. Scans are tracked in the analytics breakdown.

---

### 4. Building a Link-in-Bio Profile Hub (`/bio/:slug`)
Creators can assemble an all-in-one link hub for their social media profiles:
1. In the sidebar navigation, click **Bio Pages** 🔖.
2. Click **Create Bio Page** and enter your unique handle (e.g., `alex`).
3. **Configure Page Content:**
   * **Title & Bio:** Enter your display name and a brief biography.
   * **Theme Selection:** Choose from 5 curated CSS themes:
     * *Dark Cyber* — High-contrast dark SaaS aesthetic.
     * *Clean Light* — Minimalist crisp white layout.
     * *Brand Orange* — Warm LinkPulse signature theme.
     * *Sunset Horizon* — Coral to purple twilight gradient.
     * *Ocean Deep* — Cyan to midnight blue aquatic gradient.
4. **Attach & Reorder Links:**
   * Click **Add Link** to attach your existing short links.
   * Customize the button label and choose an emoji icon (e.g., `🛍️ Shop My Merch`).
   * Use the **▲ and ▼ buttons** to reorder buttons.
5. **Save & Publish:** Click **Save Page**. Your public bio hub is instantly live at `https://kcstudio-linkpluse.vercel.app/bio/alex`.

---

## PART 2: Administrator & Operations Playbook

### 1. Accessing Platform Administration
Users with the `admin` role have access to the **Admin** shield icon in the main navigation (`/admin`).

### 2. Platform Overview & Abuse Alerts
* **Platform Totals:** Monitor global registered users, active links, total redirects, and bot traffic percentages.
* **Autonomous Abuse Alerts:** Review high-priority alert cards:
  * ⚠️ *Bot-Heavy Links:* Investigate links with >50% automated traffic.
  * 📈 *Click Spikes:* Detect abnormal 3x traffic surges within 24 hours.
  * 🚨 *New User Bulk Spikes:* Identify accounts creating large link batches unexpectedly.

### 3. Moderating & Disabling Links
1. Under the **Links Tab**, search by short code, destination URL, or creator email.
2. To suspend a suspicious link, click **Disable** and input a clear administrative reason (e.g., *"Suspicious phishing report"*).
3. **Instant Global Effect:**
   * The database record updates to `status = 'disabled'`.
   * The in-memory LRU cache is immediately purged.
   * Any visitor attempting to access the short link receives an immediate HTTP 410 Gone page displaying the exact reason.
4. To restore the link, click **Enable**. The redirect reactivates instantly.

### 4. Domain Blocklisting
1. Navigate to the **Blocklist Tab** in the Admin panel.
2. Enter the root domain of the offending website (e.g., `badsite.com`) and provide a reason.
3. **Recursive Subdomain Inheritance:**
   * Blocking `badsite.com` automatically blocks all subdomains (`login.badsite.com`, `verify.badsite.com`).
   * Existing links pointing to this domain immediately fail with an HTTP 403 Shield page.
   * Future attempts to create links to this domain are rejected at Step 1 of the creation wizard.
