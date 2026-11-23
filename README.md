**English** | [فارسی](README.fa.md)

# EdgeRelay

A single-file **Cloudflare Workers & Pages** WebSocket reverse proxy and multi-profile subscription generator with a self-contained web admin panel, supporting **Sing-box**, **Xray**, **Patterniha F&F (`cs` / `fm`)**, and **ECH + Custom DNS**.

> **Note:** This project was designed and built with the assistance of AI tools for architecture refinement, edge-case handling, and UI/UX implementation.

---

## Key Features

- **Dual Platform Support:** Runs seamlessly on both **Cloudflare Workers** and **Cloudflare Pages**.
- **WebSocket Reverse Proxy:** Relays WebSocket traffic through Cloudflare's edge network (`/<token>/<base64_target>`) to hide origin server IPs.
- **Unlimited Output Subscription Profiles:** Create as many independent subscription endpoints as needed—no `/64` or `/raw` URL suffixes required. Each profile has its own:
  - Target Core (`Sing-box` JSON or `Xray` standard URIs)
  - Output Format (`Plain` or `Base64`)
  - Input Sources (`Custom Servers`, `External Sub Links`, and per-profile `Extra Servers`)
  - Generation Modes (`IPv4 TLS / No-TLS`, `IPv6 TLS / No-TLS`, `Domain TLS / No-TLS`)
  - Transport & Bypass settings (`Fingerprint`, `ALPN`, `Allow Insecure`, `Randomize SNI`, `Randomize DPI Headers`, `Packet Encoding`, `Early Data`)
- **Patterniha F&F Support (`cs` & `fm`):**
  - Built-in manager for reusable **Cipher Suites (`cs`)** and **Final Masks (`fm`)** presets (with live JSON validation, format/minify tools, and `Fragment v1` & `Fragment v2` defaults).
  - Supports `fp=unsafe` and `fp=none`, URL-encoded `cs` / `fm`, and `headerType=none` compatible with Xray F&F clients (**PattNG**, **PattN**, **Throne**).
- **ECH + DNS Configuration:**
  - Supports `domain+dns`, `dns`-only, `domain`-only, and static Base64/PEM ECHConfigList across `udp://`, `tcp://`, `tls://`, `https://`, `h3://`, `quic://`, and `local`.
  - Compatible with **Sing-box 1.12–1.14+** (typed `dns.servers` + `domain_resolver`), **Sing-box 1.10–1.11** (legacy `address` schema), `Outbound Only`, and **Xray** (`ech=...`).
- **Smart Network Pools:**
  - Supports single IPv4/IPv6, CIDR ranges (including IPv6 CIDR via `BigInt`), and clean domains.
  - Automatically distinguishes Worker domains from Pages domains (Pages domains are excluded from `No-TLS` variants).
- **Self-Contained Admin Panel (Zero-CDN):**
  - No external CSS, JS, or font CDNs—loads reliably even on restricted networks.
  - Responsive mobile-friendly UI with Dark/Light theme, Live Output Preview modal, Bulk editors, and HMAC-SHA256 cookie authentication.
- **Upstream Caching & Masquerade:**
  - Caches fetched external subscriptions in KV for 15 minutes (with a manual cache-clear button in Settings).
  - Proxies unmatched HTTP requests to a configurable fallback website.

---

## Supported Protocols & Clients

- **Input Configs:** `VMess`, `VLESS`, and `Trojan` over **WebSocket (`ws`)** (parsed from raw URI lists, Base64 subscriptions, or Sing-box JSON `outbounds`).
- **Output Clients:**
  - **Sing-box** (`1.10` – `1.14+`), **v2rayN**, **NekoBox**, **Karing**, **Hiddify**
  - **Xray**, **v2rayNG**, **PattNG**, **Throne** (Android / Windows)

---

## Deployment Guide

> **Requirement:** A free [Cloudflare](https://dash.cloudflare.com/) account and a **KV Namespace** bound with the exact variable name **`KV`**.

### Step 1: Create a Cloudflare KV Namespace
1. Go to **Cloudflare Dashboard** → **Storage & Databases** → **KV**.
2. Click **Create a namespace**, name it (e.g. `edgerelay-kv`), and save it.

---

### Option A: Deploy on Cloudflare Workers
1. Go to **Workers & Pages** → **Create** → **Create Worker**.
2. Give your Worker a name (e.g. `edgerelay`) and click **Deploy**.
3. Click **Edit code**, replace the default code with the entire content of [`worker.js`](./worker.js), and click **Deploy**.
4. Go to your Worker's **Settings** → **Bindings** → **Add** → **KV Namespace**:
   - **Variable name:** `KV` *(must be exact)*
   - **KV namespace:** Select the namespace you created in Step 1.
5. Save the binding.

---

### Option B: Deploy on Cloudflare Pages

#### Method 1: Connect via GitHub (Recommended)
1. Fork this repository to your GitHub account.
2. In Cloudflare Dashboard, go to **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Select your forked `EdgeRelay` repository and configure the build settings:
   - **Framework preset:** `None`
   - **Build command:**
     ```bash
     mkdir -p dist && cp worker.js dist/_worker.js
     ```
   - **Build output directory:** `dist`
4. Click **Save and Deploy**.
5. Once deployed, go to your Pages project **Settings** → **Bindings** (or **Functions** → **KV namespace bindings**):
   - **Variable name:** `KV` *(must be exact)*
   - **KV namespace:** Select your KV namespace for **Production** (and Preview if needed).
6. Go to **Deployments** and **Retry deployment** so the KV binding takes effect.

#### Method 2: Direct Upload (No GitHub Connection Needed)
1. Download [`worker.js`](./worker.js) and rename it to **`_worker.js`**.
2. Put `_worker.js` inside a new folder (or compress it into a `.zip` file).
3. In Cloudflare Dashboard, go to **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
4. Upload the folder/zip and deploy.
5. Go to **Settings** → **Bindings**, add the KV namespace with variable name **`KV`**, and redeploy.

---

## Initial Setup & Usage

1. Open your Worker or Pages URL at the default admin path:
   ```text
   https://your-domain.workers.dev/panel
   ```
   *(Default password: `0000`)*
2. **Immediately secure your panel** in the **General & Security** tab:
   - Change the **Admin Password**.
   - Change the **Admin Panel Path** (e.g., `/my-secret-panel`).
   - Optionally customize the **Fallback Website URL** (masquerade site).
3. **Add Sources:** In the **Sources** tab, add your WebSocket `VMess`/`VLESS`/`Trojan` server links or external subscription URLs.
4. **Configure Network Pools:** In **Network & Pools**, add clean Cloudflare IPs/CIDRs and your Worker/Pages domains.
5. **Manage Subscriptions:** In the **Subscriptions** tab, edit the default profiles (`/sub` for Sing-box, `/fnf` for Xray F&F) or create new custom endpoints, test them with **Live Preview**, and click **Save Changes**.

---

## Disclaimer

This project is intended for educational, research, and personal privacy/network-testing purposes. Users are responsible for complying with local laws and Cloudflare's Terms of Service.

## License

Released under the [MIT License](./LICENSE).
