**English** | [فارسی](README.fa.md)

# EdgeRelay

**EdgeRelay** is a single-file **Cloudflare Workers & Pages** reverse proxy and subscription manager for **VLESS**, **VMess**, and **Trojan** WebSocket (`ws`) servers.

> **Note:** Built and refined with the assistance of AI tools.

---

## How It Works

Instead of connecting directly to your origin server's IP address, **EdgeRelay** acts as a WebSocket relay on Cloudflare's edge network:

1. You add your existing **VLESS**, **VMess**, or **Trojan** WebSocket servers (either individually or via external subscription URLs).
2. EdgeRelay rewrites those configs into new subscription links pointing to **clean Cloudflare IPs, CIDR ranges, or domains**, embedding the encoded origin target into the WebSocket path.
3. When a client connects, traffic goes to Cloudflare first and EdgeRelay transparently forwards the WebSocket stream to your origin server.
4. Any ordinary HTTP request that does not match your admin panel or subscription endpoints is proxied to a configurable **Fallback Website (Masquerade)** so the worker behaves like a normal site.

---

## Features

### 1. Core Proxy & Masquerade
- **Cloudflare Workers & Pages Compatible:** Runs seamlessly on both platforms with a single script.
- **WebSocket Relay:** Proxies `VLESS`, `VMess`, and `Trojan` WebSocket connections behind Cloudflare's edge.
- **Fallback Website (Masquerade):** Proxies unmatched web traffic to any target URL (e.g., `https://www.w3schools.com`) to blend in.

### 2. Subscriptions (Multi-Profile Output Engine)
Create as many independent subscription endpoints as needed, each with its own URL path and settings:
- **Core & Format:** Choose **Sing-box** (JSON) or **Xray** (standard URIs), in either **Plain** or **Base64** format.
- **Per-Profile Sources:** Mix and match **Custom Servers**, **External Sub Links**, and profile-specific **Extra Servers** (`IP:Port` or `[IPv6]:Port`).
- **Generation Modes:** Independently toggle `IPv4 TLS`, `IPv4 No-TLS`, `IPv6 TLS`, `IPv6 No-TLS`, `Domain TLS`, and `Domain No-TLS`.
- **Fragmentation & Bypass Methods:**
  - `None`
  - `TLS Fragment` (with configurable fallback delay)
  - `TLS Record Fragment`
  - `F&F (Patterniha)` for Xray-based clients (`cs` & `fm` parameters)
- **ECH & Custom DNS:** Supports `domain+dns`, `dns`-only, `domain`-only, and static Base64/PEM ECHConfigList across `udp://`, `tcp://`, `tls://`, `https://`, `h3://`, `quic://`, and `local` — compatible with **Xray** (`ech=`) and **Sing-box** (`1.12–1.14+` typed DNS + `domain_resolver`, `1.10–1.11` legacy, or `Outbound Only`).
- **TLS & Transport Controls:** Per-profile `Fingerprint` (`random`, browser list, `unsafe`, `none`, omit, or custom), `ALPN`, `Allow Insecure`, `Randomize SNI Subdomain`, `Randomize DPI Headers` (or custom header key/value), `Packet Encoding`, and `Early Data`.
- **Live Preview & Duplicate:** Preview generated output before saving and clone existing profiles in one click.

### 3. Sources (Server & Subscription Inputs)
- **Custom Servers:** Add WebSocket `VMess`, `VLESS`, or `Trojan` links individually, edit fields through a visual modal editor, or import in bulk (non-WS configs are automatically filtered).
- **External Subscription Links:** Fetch and merge servers from upstream URLs (supports raw URI lists, Base64 subscriptions, and Sing-box JSON `outbounds`), with automatic deduplication, 15-minute KV caching, and optional `?sublink=` query overrides.

### 4. Network & Pools
- **IP / CIDR / Domain Pool:** Supports single IPv4/IPv6 addresses, IPv4 CIDR, IPv6 CIDR (using `BigInt`), and clean domains with live pool statistics and popup bulk-add tools.
- **Cloudflare Domains:** Separate pools for **Worker Domains** (TLS & No-TLS) and **Pages Domains** (TLS only — automatically excluded from No-TLS variants).
- **Global Pools:** Configurable Cloudflare TLS ports (`443, 8443, 2053, 2083, 2087, 2096`), No-TLS ports (`80, 8080, 8880, 2052, 2082, 2086, 2095`), `ALPN` pool, and `Fingerprint` pool.

### 5. F&F Presets
- Store and manage reusable **Cipher Suites (`cs`)** and **Final Masks (`fm`)** presets (preloaded with `Fragment v1` and `Fragment v2` defaults, live JSON validator, and Format/Minify tools) for Xray F&F clients such as **PattNG**, **PattN**, and **Throne**.

### 6. General & Security
- **Zero-CDN Admin Panel:** Completely self-contained responsive web UI (mobile & desktop) with Dark/Light themes and no external CSS, JS, or font dependencies.
- **Security & Maintenance:** HMAC-SHA256 signed `HttpOnly` session cookies, customizable admin panel path, password update support, and one-click upstream subscription cache clearing.

---

## Supported Clients

- **Sing-box** (`1.10` – `1.14+`), **v2rayN**, **NekoBox**, **Karing**, **Hiddify**
- **Xray**, **v2rayNG**, **PattNG**, **Throne** (Android / Windows)

---

## Deployment Guide

> **Requirement:** A free [Cloudflare](https://dash.cloudflare.com/) account and a **KV Namespace** bound with the exact variable name **`KV`**.

### Step 1: Create a Cloudflare KV Namespace
1. Go to **Cloudflare Dashboard** → **Storage & Databases** → **KV**.
2. Click **Create a namespace**, enter a name (e.g. `edgerelay-kv`), and create it.

---

### Option A: Deploy on Cloudflare Workers
1. Go to **Workers & Pages** → **Create** → **Create Worker**.
2. Name your Worker (e.g. `edgerelay`) and click **Deploy**.
3. Click **Edit code**, replace the default code with the entire content of [`worker.js`](./worker.js), and click **Deploy**.
4. Go to **Settings** → **Bindings** → **Add** → **KV Namespace**:
   - **Variable name:** `KV` *(must be exact)*
   - **KV namespace:** Select the namespace created in Step 1.
5. Save the binding.

---

### Option B: Deploy on Cloudflare Pages

#### Method 1: Connect via GitHub (Recommended)
1. Fork this repository to your GitHub account.
2. In Cloudflare Dashboard, go to **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Select your forked `EdgeRelay` repository and set:
   - **Framework preset:** `None`
   - **Build command:**
     ```bash
     mkdir -p dist && cp worker.js dist/_worker.js
     ```
   - **Build output directory:** `dist`
4. Click **Save and Deploy**.
5. Go to your Pages project **Settings** → **Bindings** (or **Functions** → **KV namespace bindings**):
   - **Variable name:** `KV` *(must be exact)*
   - **KV namespace:** Select your KV namespace for **Production**.
6. Go to **Deployments** and **Retry deployment** so the KV binding takes effect.

#### Method 2: Direct Upload
1. Download [`worker.js`](./worker.js) and rename it to **`_worker.js`**.
2. Place `_worker.js` inside a new folder (or zip it).
3. In Cloudflare Dashboard, go to **Workers & Pages** → **Create** → **Pages** → **Upload assets**, upload the folder/zip, and deploy.
4. Go to **Settings** → **Bindings**, add the KV namespace with variable name **`KV`**, and redeploy.

---

## Initial Setup

1. Open your Worker or Pages URL at the default admin path:
   ```text
   https://your-domain.workers.dev/panel
   ```
   *(Default password: `0000`)*
2. In **General & Security**, immediately change the **Admin Password**, customize your **Admin Panel Path**, and set your preferred **Fallback Website URL**.
3. Add your WebSocket servers or external subscription URLs in **Sources**.
4. Configure your Cloudflare IPs/CIDRs and domains in **Network & Pools**.
5. Customize or create output links in **Subscriptions**, verify them with **Live Preview**, and click **Save Changes**.

---

## Disclaimer

This project is intended for educational, research, and personal privacy/network-testing purposes. Users are responsible for complying with local laws and Cloudflare's Terms of Service.

## License

Released under the [MIT License](./LICENSE).
