const APP_VERSION = 'v1.1.2';
const GITHUB_REPO_URL = 'https://github.com/NetForgeDev/EdgeRelay';
const GITHUB_LATEST_RELEASE_API = 'https://api.github.com/repos/NetForgeDev/EdgeRelay/releases/latest';
const UPDATE_CACHE_KEY = 'gh_update_cache';
const UPDATE_CACHE_TTL = 14400;

const DEFAULT_CS_VALUE = 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384:TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384:TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256:TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256:TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256:TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256:TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA:TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA:TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256:TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256';
const DEFAULT_FM_V1 = '{"tcp": [{"type": "fragment", "settings": {"packets": "tlshello", "lengths": ["5", "94", "1"], "delays": ["0"], "maxSplit": "0"}},{"type": "fragment", "settings": {"packets": "1-1", "lengths": ["109", "1"], "delays": ["1"], "maxSplit": "355"}}]}';
const DEFAULT_FM_V2 = '{"tcp": [{"type": "fragment", "settings": {"packets": "tlshello", "lengths": ["0", "104", "1"], "delays": ["0"], "maxSplit": "0"}},{"type": "fragment", "settings": {"packets": "1-1", "lengths": ["114", "1"], "delays": ["1"], "maxSplit": "11"}}]}';

const DEFAULT_CONFIG = {
    adminPassword: '0000',
    ipList: ['104.21.32.1', '172.66.210.0/24', 'www.speedtest.net'],
    domainsWorker: [],
    domainsPages: [],
    defaultSublink: [],
    customServers: [],
    alpnList: ['http/1.1', 'h2', 'h3'],
    fpList: ['chrome', 'firefox', 'safari', 'edge', 'ios', 'android', 'random'],
    portListTLS: [443, 8443, 2053, 2083, 2087, 2096],
    portListNoTLS: [80, 8080, 8880, 2052, 2082, 2086, 2095],
    defaultWebsite: 'https://www.w3schools.com',
    adminPath: '/panel',
    csPresets: [
        { id: 'cs_default_1', name: 'Patterniha Default (TLS 1.3 + 1.2)', value: DEFAULT_CS_VALUE }
    ],
    fmPresets: [
        { id: 'fm_default_v1', name: 'Fragment v1', value: DEFAULT_FM_V1 },
        { id: 'fm_default_v2', name: 'Fragment v2', value: DEFAULT_FM_V2 }
    ],
    subscriptions: [
        {
            id: 'sub_default_singbox',
            name: 'Sing-box Clean',
            enabled: true,
            path: '/sub',
            coreType: 'singbox',
            outputFormat: 'plain',
            includeCustomServers: true,
            includeSubLinks: true,
            genModes: ['ip_tls'],
            extraServers: '',
            fragmentMode: 'none',
            fragmentFallbackDelay: '450ms',
            fnfCsId: '',
            fnfFmId: '',
            fpMode: 'random_list',
            fpCustom: '',
            alpnMode: 'random_list',
            alpnCustom: '',
            allowInsecure: true,
            randomizeSniPrefix: true,
            randomizeHeaders: true,
            headerKey: '',
            headerValue: '',
            packetEncoding: 'xudp',
            earlyDataLength: '',
            earlyDataName: '',
            echConfig: '',
            echDns: '',
            echSingboxMode: 'modern',
            ipPoolMode: 'global',
            customIpList: [],
            domainsMode: 'global',
            customDomainsWorker: [],
            customDomainsPages: [],
            portsMode: 'global',
            customPortsTLS: [],
            customPortsNoTLS: []
        },
        {
            id: 'sub_default_fnf',
            name: 'Xray F&F (PattNG / Throne)',
            enabled: true,
            path: '/fnf',
            coreType: 'xray',
            outputFormat: 'plain',
            includeCustomServers: true,
            includeSubLinks: true,
            genModes: ['ip_tls'],
            extraServers: '',
            fragmentMode: 'fnf',
            fragmentFallbackDelay: '450ms',
            fnfCsId: 'cs_default_1',
            fnfFmId: 'fm_default_v2',
            fpMode: 'unsafe',
            fpCustom: '',
            alpnMode: 'h3',
            alpnCustom: '',
            allowInsecure: false,
            randomizeSniPrefix: true,
            randomizeHeaders: false,
            headerKey: '',
            headerValue: '',
            packetEncoding: 'xudp',
            earlyDataLength: '',
            earlyDataName: '',
            echConfig: '',
            echDns: '',
            echSingboxMode: 'modern',
            ipPoolMode: 'global',
            customIpList: [],
            domainsMode: 'global',
            customDomainsWorker: [],
            customDomainsPages: [],
            portsMode: 'global',
            customPortsTLS: [],
            customPortsNoTLS: []
        }
    ]
};

const Base64 = {
    encode: (str) => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p) => String.fromCharCode('0x' + p))),
    decode: (str) => {
        let normalized = String(str).trim().replace(/-/g, '+').replace(/_/g, '/');
        while (normalized.length % 4) normalized += '=';
        return decodeURIComponent(atob(normalized).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    }
};

let cachedConfig = null, lastCacheFetch = 0;
const CACHE_TTL = 30000;
const PLATFORMS = ['Windows', 'macOS', 'Android', 'iOS', 'Linux'];
const ALL_TLS_PORTS = [443, 8443, 2053, 2083, 2087, 2096];
const ALL_NOTLS_PORTS = [80, 8080, 8880, 2052, 2082, 2086, 2095];

const isIpv4 = (str) => str ? /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}(?:\/[0-9]{1,2})?$/.test(str.trim()) : false;
const isIpv6 = (str) => {
    if (!str) return false;
    const clean = str.trim().replace(/[\[\]]/g, '').split('/')[0];
    return clean.includes(':') && /^[0-9a-fA-F:]+$/.test(clean);
};
const isIpOrCidr = (str) => isIpv4(str) || isIpv6(str);
const formatHostForUri = (addr) => !addr ? '' : (addr.includes(':') ? `[${addr.replace(/[\[\]]/g, '')}]` : addr);

function formatShortAddress(addr) {
    if (!addr) return '';
    const clean = addr.trim().replace(/[\[\]]/g, '');
    const parts = isIpv6(clean) ? clean.split(':').filter(Boolean) : (isIpv4(clean) ? clean.split('.') : null);
    if (parts?.length >= 2) return `${parts[0]}...${parts[parts.length - 1]}`;
    return clean.length > 12 ? `${clean.slice(0, 4)}...${clean.slice(-4)}` : clean;
}

function normalizePath(path, fallback = '/sub') {
    let p = (path || fallback).trim();
    if (!p.startsWith('/')) p = '/' + p;
    if (p.length > 1) p = p.replace(/\/+$/, '');
    return p;
}

function normalizeDnsUrl(dnsStr) {
    let s = cleanStr(dnsStr);
    if (!s) return '';
    if (s.toLowerCase() === 'local') return 'local';
    s = s.replace(/^(udp|tcp|tls|https|http|h3|h2c|quic|dhcp|rcode)\/\//i, '$1://');
    if (!s.includes('://') && (isIpv4(s.split(':')[0]) || isIpv6(s.replace(/[\[\]]/g, '').split(':')[0]))) {
        s = 'udp://' + s;
    }
    return s;
}

function splitEchInput(echConfigRaw, echDnsRaw) {
    let domain = cleanStr(echConfigRaw);
    let dns = normalizeDnsUrl(echDnsRaw);

    if (domain && domain.includes('+') && !domain.includes('BEGIN ECH CONFIGS')) {
        const plusIdx = domain.indexOf('+');
        const left = domain.slice(0, plusIdx).trim();
        const right = normalizeDnsUrl(domain.slice(plusIdx + 1));
        domain = left;
        if (!dns && right) dns = right;
    } else if (domain && /^(udp|tcp|tls|https|h3|h2c|quic)(:\/\/|\/\/)/i.test(domain)) {
        if (!dns) dns = normalizeDnsUrl(domain);
        domain = '';
    }
    return { domain, dns };
}

function isStaticEchPayload(val) {
    if (!val) return false;
    if (val.includes('BEGIN ECH CONFIGS')) return true;
    return /^[A-Za-z0-9+/=]{28,}$/.test(val) && !val.includes('.');
}

function buildSingboxDnsBlock(dnsUrl, mode) {
    const clean = normalizeDnsUrl(dnsUrl);
    if (!clean || mode === 'outbound_only') return null;

    if (mode === 'legacy') {
        const isPlainIp = isIpv4(clean.replace(/^udp:\/\//i, '').split(':')[0]);
        const servers = [{ tag: 'ech-dns', address: clean, detour: 'direct' }];
        if (clean !== 'local' && !isPlainIp && !clean.includes('1.1.1.1') && !clean.includes('8.8.8.8')) {
            servers[0].address_resolver = 'bootstrap-dns';
            servers.push({ tag: 'bootstrap-dns', address: 'udp://1.1.1.1', detour: 'direct' });
        }
        return { servers };
    }

    if (clean === 'local') {
        return { servers: [{ type: 'local', tag: 'ech-dns' }] };
    }

    let scheme = 'udp', host = clean, port = null, path = '';
    try {
        const u = new URL(clean);
        scheme = u.protocol.replace(':', '').toLowerCase();
        host = u.hostname.replace(/[\[\]]/g, '');
        port = u.port ? parseInt(u.port, 10) : null;
        path = u.pathname && u.pathname !== '/' ? u.pathname : '';
    } catch {
        const m = clean.match(/^([a-z0-9]+):\/\/(.+)$/i);
        if (m) {
            scheme = m[1].toLowerCase();
            host = m[2].split('/')[0];
        }
    }

    const supportedTypes = ['udp', 'tcp', 'tls', 'https', 'h3', 'quic'];
    const type = supportedTypes.includes(scheme) ? scheme : 'udp';
    const srv = { type, tag: 'ech-dns', server: host };
    if (port) srv.server_port = port;
    if (type === 'https' || type === 'h3') {
        srv.path = path || '/dns-query';
    }

    const servers = [srv];
    if (host && !isIpv4(host) && !isIpv6(host)) {
        srv.domain_resolver = 'bootstrap-dns';
        servers.push({ type: 'udp', tag: 'bootstrap-dns', server: '1.1.1.1', server_port: 53 });
    }
    return { servers };
}

function parseServerAddressAndPort(line) {
    if (!line?.trim()) return null;
    line = line.trim();
    if (line.startsWith('[')) {
        const closeB = line.indexOf(']');
        if (closeB !== -1) {
            const addr = line.substring(1, closeB).trim();
            const port = parseInt(line.substring(closeB + 1).replace(/^:/, '').trim(), 10);
            if (port > 0 && port <= 65535) return { addr, port };
        }
    }
    const lastColon = line.lastIndexOf(':');
    if (lastColon !== -1) {
        const addr = line.substring(0, lastColon).trim().replace(/[\[\]]/g, '');
        const port = parseInt(line.substring(lastColon + 1).trim(), 10);
        if (port > 0 && port <= 65535) return { addr, port };
    }
    return null;
}

function generateRandomToken(len = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

const randomizeCase = (str) => (str || '').split('').map(c => Math.random() < 0.5 ? c.toUpperCase() : c.toLowerCase()).join('');

function randomizeSubdomain(domain) {
    if (!domain || isIpOrCidr(domain)) return domain;
    const parts = domain.split('.');
    parts[0] = generateRandomToken(Math.floor(Math.random() * 11) + 8).toLowerCase();
    return parts.join('.');
}

function migrateOldMode(mode) {
    const map = {
        ip_tls_only: ['ip_tls'], ip_tls_notls: ['ip_tls', 'ip_notls'],
        domain_tls_only: ['domain_tls'], domain_tls_notls: ['domain_tls', 'domain_notls'],
        both_tls_only: ['ip_tls', 'domain_tls'], both_tls_notls: ['ip_tls', 'ip_notls', 'domain_tls', 'domain_notls']
    };
    return map[mode] || ['ip_tls'];
}

const isPagesDomain = (domain, cfg) => {
    if (!domain) return false;
    const d = domain.toLowerCase();
    return d.endsWith('.pages.dev') || !!cfg.domainsPages?.some(p => p.toLowerCase() === d);
};

const cleanStr = (val) => {
    if (val === null || val === undefined) return '';
    const s = String(val).trim();
    return (s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') ? '' : s;
};

function cleanParsedServer(obj) {
    if (!obj) return obj;
    ['host', 'add', 'sni', 'path', 'ps', 'address', 'password', 'name'].forEach(k => {
        if (obj[k] !== undefined) obj[k] = cleanStr(obj[k]);
    });
    return obj;
}

function decodeUriConfig(conf) {
    const proto = conf.startsWith('trojan://') ? 'trojan' : 'vless';
    const raw = conf.replace(`${proto}://`, '');
    const [mainPart, afterQ] = raw.split('?');
    const [queryPart, hashPart] = (afterQ || '').split('#');
    const atIdx = mainPart.indexOf('@');
    const cred = atIdx !== -1 ? mainPart.substring(0, atIdx) : '';
    const hostPort = atIdx !== -1 ? mainPart.substring(atIdx + 1) : mainPart;
    const parsedAddr = parseServerAddressAndPort(hostPort);

    const result = {
        protocol: proto,
        name: hashPart ? decodeURIComponent(hashPart) : '',
        id: proto === 'trojan' ? decodeURIComponent(cred) : cred,
        password: proto === 'trojan' ? decodeURIComponent(cred) : '',
        add: parsedAddr ? parsedAddr.addr : hostPort.replace(/[\[\]]/g, ''),
        port: parsedAddr ? String(parsedAddr.port) : ''
    };

    if (queryPart) {
        new URLSearchParams(queryPart).forEach((val, key) => {
            result[key] = key === 'path' ? decodeURIComponent(val) : val;
            if (key === 'security' || key === 'tls') result.tls = (val === 'tls' || val === '1');
        });
    }
    result.address = result.add;
    return cleanParsedServer(result);
}

const addressSelector = {
    select(ipOrRangeOrDomain) {
        if (!ipOrRangeOrDomain) return null;
        const trimmed = ipOrRangeOrDomain.trim();

        if (isIpv4(trimmed)) {
            if (trimmed.includes('/')) {
                const [subnet, maskStr] = trimmed.split('/');
                const mask = parseInt(maskStr, 10);
                if (isNaN(mask) || mask < 0 || mask > 32) return subnet;
                const subnetLon = this.ip2lon(subnet);
                const numHosts = Math.pow(2, 32 - mask);
                let offset = Math.floor(Math.random() * numHosts);
                if (mask < 32 && numHosts > 2) offset = Math.max(1, Math.min(numHosts - 2, offset));
                return this.lon2ip(subnetLon | offset);
            }
            return trimmed;
        }

        if (isIpv6(trimmed)) {
            const cleanV6 = trimmed.replace(/[\[\]]/g, '');
            if (cleanV6.includes('/')) {
                const [subnetStr, maskStr] = cleanV6.split('/');
                const mask = parseInt(maskStr, 10);
                if (isNaN(mask) || mask < 0 || mask > 128) return subnetStr;
                const subnetBigInt = this.ipv6ToBigInt(subnetStr);
                if (subnetBigInt === null) return subnetStr;

                const hostBits = 128 - mask;
                if (hostBits === 0) return this.bigIntToIpv6(subnetBigInt);

                const networkMask = ((1n << BigInt(mask)) - 1n) << BigInt(hostBits);
                const offset = this.randomBigInt(hostBits);
                return this.bigIntToIpv6((subnetBigInt & networkMask) | offset);
            }
            return cleanV6;
        }
        return trimmed;
    },

    ip2lon: (addr) => addr.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0,
    lon2ip: (lon) => [lon >>> 24, (lon >> 16) & 255, (lon >> 8) & 255, lon & 255].join('.'),

    ipv6ToBigInt(ipStr) {
        const clean = ipStr.trim().replace(/[\[\]]/g, '');
        if (clean.split('::').length > 2) return null;
        let hextets = [];
        if (clean.includes('::')) {
            const [left, right] = clean.split('::');
            const leftParts = left ? left.split(':') : [];
            const rightParts = right ? right.split(':') : [];
            const missing = 8 - (leftParts.length + rightParts.length);
            if (missing < 1) return null;
            hextets = [...leftParts, ...Array(missing).fill('0'), ...rightParts];
        } else {
            hextets = clean.split(':');
        }
        if (hextets.length !== 8) return null;
        let val = 0n;
        for (const h of hextets) {
            if (!/^[0-9a-fA-F]{1,4}$/.test(h)) return null;
            val = (val << 16n) + BigInt(parseInt(h, 16));
        }
        return val;
    },

    bigIntToIpv6(val) {
        const hextets = [];
        for (let i = 0; i < 8; i++) {
            hextets.push(Number((val >> BigInt((7 - i) * 16)) & 0xffffn).toString(16));
        }
        return hextets.join(':');
    },

    randomBigInt(hostBits) {
        if (hostBits <= 0) return 0n;
        let randomVal = 0n, remaining = hostBits;
        while (remaining > 0) {
            const chunk = Math.min(remaining, 30);
            randomVal = (randomVal << BigInt(chunk)) | BigInt(Math.floor(Math.random() * (1 << chunk)));
            remaining -= chunk;
        }
        let offset = randomVal & ((1n << BigInt(hostBits)) - 1n);
        if (hostBits > 2 && offset === 0n) offset = 1n;
        return offset;
    }
};

function normalizeSubscription(sub) {
    const fragmentMode = sub.fragmentMode || 'none';
    const coreType = fragmentMode === 'fnf' ? 'xray' : (sub.coreType === 'xray' ? 'xray' : 'singbox');
    const ech = splitEchInput(sub.echConfig, sub.echDns);
    return {
        id: sub.id || 'sub_' + generateRandomToken(6),
        name: cleanStr(sub.name) || 'Untitled Subscription',
        enabled: sub.enabled !== false,
        path: normalizePath(sub.path, '/sub'),
        coreType,
        outputFormat: sub.outputFormat === 'base64' ? 'base64' : 'plain',
        includeCustomServers: sub.includeCustomServers !== false,
        includeSubLinks: sub.includeSubLinks !== false,
        genModes: Array.isArray(sub.genModes) && sub.genModes.length ? sub.genModes : ['ip_tls'],
        extraServers: sub.extraServers || '',
        fragmentMode,
        fragmentFallbackDelay: cleanStr(sub.fragmentFallbackDelay) || '450ms',
        fnfCsId: cleanStr(sub.fnfCsId),
        fnfFmId: cleanStr(sub.fnfFmId),
        fpMode: cleanStr(sub.fpMode) || 'random_list',
        fpCustom: cleanStr(sub.fpCustom),
        alpnMode: cleanStr(sub.alpnMode) || 'random_list',
        alpnCustom: cleanStr(sub.alpnCustom),
        allowInsecure: sub.allowInsecure !== undefined ? !!sub.allowInsecure : true,
        randomizeSniPrefix: sub.randomizeSniPrefix !== undefined ? !!sub.randomizeSniPrefix : true,
        randomizeHeaders: sub.randomizeHeaders !== undefined ? !!sub.randomizeHeaders : true,
        headerKey: cleanStr(sub.headerKey),
        headerValue: cleanStr(sub.headerValue),
        packetEncoding: cleanStr(sub.packetEncoding) || 'xudp',
        earlyDataLength: cleanStr(sub.earlyDataLength),
        earlyDataName: cleanStr(sub.earlyDataName),
        echConfig: ech.domain,
        echDns: ech.dns,
        echSingboxMode: ['modern', 'legacy', 'outbound_only'].includes(sub.echSingboxMode) ? sub.echSingboxMode : 'modern',
        ipPoolMode: sub.ipPoolMode === 'custom' ? 'custom' : 'global',
        customIpList: Array.isArray(sub.customIpList) ? sub.customIpList.map(cleanStr).filter(Boolean) : cleanStr(sub.customIpList).split(/[,\r\n]+/).map(x => x.trim()).filter(Boolean),
        domainsMode: sub.domainsMode === 'custom' ? 'custom' : 'global',
        customDomainsWorker: Array.isArray(sub.customDomainsWorker) ? sub.customDomainsWorker.map(cleanStr).filter(Boolean) : cleanStr(sub.customDomainsWorker).split(/[,\r\n]+/).map(x => x.trim()).filter(Boolean),
        customDomainsPages: Array.isArray(sub.customDomainsPages) ? sub.customDomainsPages.map(cleanStr).filter(Boolean) : cleanStr(sub.customDomainsPages).split(/[,\r\n]+/).map(x => x.trim()).filter(Boolean),
        portsMode: sub.portsMode === 'custom' ? 'custom' : 'global',
        customPortsTLS: (Array.isArray(sub.customPortsTLS) ? sub.customPortsTLS : cleanStr(sub.customPortsTLS).split(/[,\r\n]+/)).map(x => parseInt(x, 10)).filter(n => n > 0 && n <= 65535),
        customPortsNoTLS: (Array.isArray(sub.customPortsNoTLS) ? sub.customPortsNoTLS : cleanStr(sub.customPortsNoTLS).split(/[,\r\n]+/)).map(x => parseInt(x, 10)).filter(n => n > 0 && n <= 65535)
    };
}

function migrateLegacyConfig(config) {
    let changed = false;

    if (!Array.isArray(config.csPresets)) {
        config.csPresets = structuredClone(DEFAULT_CONFIG.csPresets);
        changed = true;
    }
    if (!Array.isArray(config.fmPresets)) {
        config.fmPresets = structuredClone(DEFAULT_CONFIG.fmPresets);
        changed = true;
    } else if (config.fmPresets.length === 1 && config.fmPresets[0].id === 'fm_default_1') {
        config.fmPresets = structuredClone(DEFAULT_CONFIG.fmPresets);
        changed = true;
    }

    if (!Array.isArray(config.subscriptions)) {
        const subs = [];
        const customModes = config.customServerGenModes || (config.customServerGenerationMode ? migrateOldMode(config.customServerGenerationMode) : ['ip_tls']);
        const subModes = config.subscriptionLinkGenModes || (config.subscriptionLinkGenerationMode ? migrateOldMode(config.subscriptionLinkGenerationMode) : ['ip_tls']);
        const baseLegacy = {
            coreType: 'singbox',
            outputFormat: 'plain',
            fragmentMode: config.fragmentMode || 'none',
            fragmentFallbackDelay: config.fragmentFallbackDelay || '450ms',
            fnfCsId: '',
            fnfFmId: '',
            fpMode: 'random_list',
            fpCustom: '',
            alpnMode: 'random_list',
            alpnCustom: '',
            allowInsecure: config.allowInsecure !== undefined ? config.allowInsecure : true,
            randomizeSniPrefix: config.randomizeSniPrefix !== undefined ? config.randomizeSniPrefix : true,
            randomizeHeaders: config.randomizeHeaders !== undefined ? config.randomizeHeaders : true,
            headerKey: config.headerKey || '',
            headerValue: config.headerValue || '',
            packetEncoding: config.packetEncoding || 'xudp',
            earlyDataLength: config.earlyDataLength || '',
            earlyDataName: config.earlyDataName || '',
            echConfig: config.echConfig || '',
            echDns: '',
            echSingboxMode: 'modern'
        };

        if (config.subscriptionPath) {
            subs.push({
                ...baseLegacy,
                id: 'sub_migrated_all',
                name: 'Combined Subscription',
                enabled: true,
                path: normalizePath(config.subscriptionPath, '/sub'),
                includeCustomServers: config.enableCustomServerGeneration !== false,
                includeSubLinks: config.enableSubscriptionLinkGeneration !== false,
                genModes: customModes,
                extraServers: [config.customExtraServer, config.subscriptionExtraServer].filter(Boolean).join('\n')
            });
        }
        if (config.customServersPath) {
            subs.push({
                ...baseLegacy,
                id: 'sub_migrated_custom',
                name: 'Custom Servers Only',
                enabled: config.enableCustomServerGeneration !== false,
                path: normalizePath(config.customServersPath, '/custom'),
                includeCustomServers: true,
                includeSubLinks: false,
                genModes: customModes,
                extraServers: config.customExtraServer || ''
            });
        }
        if (config.subLinksPath) {
            subs.push({
                ...baseLegacy,
                id: 'sub_migrated_links',
                name: 'External Links Only',
                enabled: config.enableSubscriptionLinkGeneration !== false,
                path: normalizePath(config.subLinksPath, '/links'),
                includeCustomServers: false,
                includeSubLinks: true,
                genModes: subModes,
                extraServers: config.subscriptionExtraServer || ''
            });
        }

        config.subscriptions = subs.length ? subs : structuredClone(DEFAULT_CONFIG.subscriptions);
        changed = true;
    }

    config.subscriptions = config.subscriptions.map(s => {
        if (s.fnfFmId === 'fm_default_1') {
            s.fnfFmId = 'fm_default_v2';
            changed = true;
        }
        return normalizeSubscription(s);
    });

    config.adminPath = normalizePath(config.adminPath, '/panel');
    return { config, changed };
}

async function getConfig(env) {
    const now = Date.now();
    if (cachedConfig && (now - lastCacheFetch < CACHE_TTL)) return cachedConfig;

    let config, needsSave = false;
    const raw = (await env.KV.get('worker_config'))?.trim();

    if (raw) {
        try {
            config = JSON.parse(raw.startsWith('{') ? raw : Base64.decode(raw));
            if (raw.startsWith('{')) needsSave = true;
        } catch {
            config = structuredClone(DEFAULT_CONFIG);
            needsSave = true;
        }
    } else {
        config = structuredClone(DEFAULT_CONFIG);
        needsSave = true;
    }

    const migrated = migrateLegacyConfig(config);
    config = migrated.config;
    if (migrated.changed) needsSave = true;

    if (needsSave) await env.KV.put('worker_config', Base64.encode(JSON.stringify(config)));

    cachedConfig = config;
    lastCacheFetch = now;
    return config;
}

function compareVersions(latest, current) {
    const parse = (v) => String(v || '').trim().replace(/^v/i, '').split('-')[0].split('.').map(n => parseInt(n, 10) || 0);
    const a = parse(latest), b = parse(current);
    for (let i = 0; i < Math.max(a.length, b.length, 3); i++) {
        const x = a[i] || 0, y = b[i] || 0;
        if (x > y) return 1;
        if (x < y) return -1;
    }
    return 0;
}

async function fetchWithTimeout(url, timeout = 2500, options = {}) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return res;
    } catch (e) {
        clearTimeout(id);
        throw e;
    }
}

async function signHmac(message, secret) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        enc.encode('edgerelay-auth:' + secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
    return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function createSessionCookie(password, isHttps) {
    const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const sig = await signHmac(String(exp), password);
    const val = `${exp}.${sig}`;
    return `cf_sub_auth=${val}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${isHttps ? '; Secure' : ''}`;
}

async function isAuthenticated(request, config) {
    const cookieHeader = request.headers.get('Cookie') || '';
    const match = cookieHeader.match(/(?:^|;\s*)cf_sub_auth=([^;]+)/);
    if (!match) return false;
    const [expStr, sig] = match[1].split('.');
    const exp = parseInt(expStr, 10);
    if (!exp || !sig || Date.now() > exp) return false;
    const expected = await signHmac(expStr, config.adminPassword);
    return sig === expected;
}

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        if (request.headers.get('Upgrade') === 'websocket') return handleWebSocketProxy(request);
        if (!env.KV) return new Response("Server configuration error: KV Namespace 'KV' is not set up.", { status: 500 });

        let config;
        try { config = await getConfig(env); }
        catch (e) { return new Response(`Server error: ${e.message}`, { status: 500 }); }

        const reqPath = normalizePath(url.pathname, '/');
        const adminPath = normalizePath(config.adminPath, '/panel');

        if (reqPath === adminPath || reqPath.startsWith(adminPath + '/')) {
            return handleAdminPanel(request, env, ctx, config, adminPath);
        }

        const matchedSub = (config.subscriptions || []).find(s => s.enabled !== false && normalizePath(s.path, '/sub') === reqPath);
        if (matchedSub) {
            return handleSubscriptionRequest(request, env, ctx, config, matchedSub);
        }

        const targetHost = (config.defaultWebsite || 'https://www.w3schools.com').replace(/^https?:\/\//, '').replace(/\/+$/, '');
        url.hostname = targetHost;
        url.protocol = 'https:';
        return fetch(new Request(url, request));
    }
};

async function handleAdminPanel(request, env, ctx, config, adminPath) {
    const url = new URL(request.url);
    const reqPath = normalizePath(url.pathname, '/');
    const relativePath = reqPath.substring(adminPath.length) || '/';
    const isHttps = url.protocol === 'https:';

    if (relativePath === '/login' && request.method === 'POST') {
        try {
            const { password } = await request.json();
            if (password !== config.adminPassword) {
                return new Response('Invalid password', { status: 401 });
            }
            const cookie = await createSessionCookie(config.adminPassword, isHttps);
            return new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'Set-Cookie': cookie }
            });
        } catch (e) {
            return new Response(`Error: ${e.message}`, { status: 500 });
        }
    }

    if (relativePath === '/logout' && request.method === 'POST') {
        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': `cf_sub_auth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isHttps ? '; Secure' : ''}`
            }
        });
    }

    if (relativePath === '/session' && request.method === 'GET') {
        const authed = await isAuthenticated(request, config);
        return new Response(JSON.stringify({ authenticated: authed }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (relativePath === '/config') {
        if (!(await isAuthenticated(request, config))) {
            return new Response('Unauthorized', { status: 401 });
        }
        if (request.method === 'GET') {
            const { adminPassword, ...safeConfig } = config;
            return new Response(JSON.stringify(safeConfig), { headers: { 'Content-Type': 'application/json' } });
        }
        if (request.method === 'POST') {
            try {
                const body = await request.json();
                const { password, newAdminPassword, ...newConfig } = body;

                const updatedConfig = {
                    ...config,
                    ...newConfig,
                    adminPath: normalizePath(newConfig.adminPath || config.adminPath, '/panel')
                };

                ['ipList', 'domainsWorker', 'domainsPages', 'defaultSublink', 'customServers', 'alpnList', 'fpList', 'portListTLS', 'portListNoTLS', 'csPresets', 'fmPresets', 'subscriptions'].forEach(key => {
                    if (newConfig[key] === undefined) updatedConfig[key] = config[key];
                });

                updatedConfig.subscriptions = (updatedConfig.subscriptions || []).map(normalizeSubscription);

                let nextCookie = null;
                if (cleanStr(newAdminPassword)) {
                    updatedConfig.adminPassword = cleanStr(newAdminPassword);
                    nextCookie = await createSessionCookie(updatedConfig.adminPassword, isHttps);
                }

                await env.KV.put('worker_config', Base64.encode(JSON.stringify(updatedConfig)));
                cachedConfig = updatedConfig;
                lastCacheFetch = Date.now();

                const headers = { 'Content-Type': 'application/json' };
                if (nextCookie) headers['Set-Cookie'] = nextCookie;
                return new Response(JSON.stringify({ ok: true, adminPath: updatedConfig.adminPath }), { status: 200, headers });
            } catch (e) {
                return new Response(`Error updating config: ${e.message}`, { status: 500 });
            }
        }
    }

    if (relativePath === '/preview' && request.method === 'POST') {
        if (!(await isAuthenticated(request, config))) {
            return new Response('Unauthorized', { status: 401 });
        }
        try {
            const { subscription, draftConfig } = await request.json();
            const mergedConfig = draftConfig ? { ...config, ...draftConfig, adminPassword: config.adminPassword } : config;
            const normSub = normalizeSubscription(subscription);
            const generated = await buildSubscriptionContent(request, env, ctx, mergedConfig, normSub);
            return new Response(JSON.stringify(generated), { headers: { 'Content-Type': 'application/json' } });
        } catch (e) {
            return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
    }

    if (relativePath === '/clear-cache' && request.method === 'POST') {
        if (!(await isAuthenticated(request, config))) {
            return new Response('Unauthorized', { status: 401 });
        }
        try {
            let cleared = 0;
            const list = await env.KV.list({ prefix: 'sub_cache:' });
            await Promise.all(list.keys.map(k => { cleared++; return env.KV.delete(k.name); }));
            return new Response(JSON.stringify({ ok: true, cleared }), { headers: { 'Content-Type': 'application/json' } });
        } catch (e) {
            return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
    }

    if (relativePath === '/check-update' && request.method === 'GET') {
        if (!(await isAuthenticated(request, config))) {
            return new Response('Unauthorized', { status: 401 });
        }
        const force = url.searchParams.get('force') === '1';
        let cached = null;
        try {
            const raw = await env.KV.get(UPDATE_CACHE_KEY);
            if (raw) cached = JSON.parse(raw);
        } catch {}

        if (cached && (!force || (Date.now() - (cached.fetchedAt || 0) < 60000))) {
            if (cached.rateLimited && !cached.data) {
                return new Response(JSON.stringify({ currentVersion: APP_VERSION, updateAvailable: false, rateLimited: true, cached: true }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            if (cached.data) {
                return new Response(JSON.stringify({
                    ...cached.data,
                    currentVersion: APP_VERSION,
                    updateAvailable: compareVersions(cached.data.tagName, APP_VERSION) > 0,
                    cached: true
                }), { headers: { 'Content-Type': 'application/json' } });
            }
        }

        try {
            const resp = await fetchWithTimeout(GITHUB_LATEST_RELEASE_API, 4000, {
                headers: { 'Accept': 'application/vnd.github+json', 'User-Agent': 'EdgeRelay/' + APP_VERSION }
            });

            if (!resp.ok) {
                if (resp.status === 403 || resp.status === 429) {
                    ctx.waitUntil(env.KV.put(UPDATE_CACHE_KEY, JSON.stringify({
                        fetchedAt: Date.now(),
                        rateLimited: true,
                        data: cached?.data || null
                    }), { expirationTtl: 900 }));
                }
                if (cached?.data) {
                    return new Response(JSON.stringify({
                        ...cached.data,
                        currentVersion: APP_VERSION,
                        updateAvailable: compareVersions(cached.data.tagName, APP_VERSION) > 0,
                        cached: true
                    }), { headers: { 'Content-Type': 'application/json' } });
                }
                return new Response(JSON.stringify({
                    currentVersion: APP_VERSION,
                    updateAvailable: false,
                    rateLimited: resp.status === 403 || resp.status === 429,
                    error: 'GitHub API returned HTTP ' + resp.status
                }), { headers: { 'Content-Type': 'application/json' } });
            }

            const rel = await resp.json();
            const data = {
                tagName: cleanStr(rel.tag_name),
                name: cleanStr(rel.name) || cleanStr(rel.tag_name),
                body: rel.body || '',
                htmlUrl: cleanStr(rel.html_url) || `${GITHUB_REPO_URL}/releases/latest`,
                publishedAt: cleanStr(rel.published_at),
                assets: Array.isArray(rel.assets)
                    ? rel.assets.slice(0, 6).map(a => ({ name: cleanStr(a.name), url: cleanStr(a.browser_download_url) }))
                    : []
            };

            ctx.waitUntil(env.KV.put(UPDATE_CACHE_KEY, JSON.stringify({ fetchedAt: Date.now(), data }), { expirationTtl: UPDATE_CACHE_TTL }));
            return new Response(JSON.stringify({
                ...data,
                currentVersion: APP_VERSION,
                updateAvailable: compareVersions(data.tagName, APP_VERSION) > 0,
                cached: false
            }), { headers: { 'Content-Type': 'application/json' } });
        } catch (e) {
            return new Response(JSON.stringify({
                currentVersion: APP_VERSION,
                updateAvailable: false,
                error: e.message
            }), { headers: { 'Content-Type': 'application/json' } });
        }
    }

    return new Response(getAdminPanelHtml(adminPath), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

function generateDpiBypassHeaders() {
    const randPlatform = PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)];
    const chromeVer = Math.floor(Math.random() * 10) + 120;
    const rIp = Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join('.');
    const pool = [
        { "Sec-CH-UA": `Not_A Brand;v=8, Chromium;v=${chromeVer}, Google Chrome;v=${chromeVer}` },
        { "Sec-CH-UA-Mobile": ['Android', 'iOS'].includes(randPlatform) ? '?1' : '?0' },
        { "Sec-CH-UA-Platform": randPlatform },
        { "X-Real-IP": rIp },
        { "X-Forwarded-Proto": "https" },
        { "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0" },
        { "Pragma": "no-cache" },
        { "Sec-Fetch-Dest": "empty" },
        { "Sec-Fetch-Mode": "websocket" },
        { "Sec-Fetch-Site": "same-origin" },
        { "DNT": "1" }
    ];
    const headers = {};
    const count = Math.floor(Math.random() * 3) + 2;
    const indices = new Set();
    while (indices.size < count) indices.add(Math.floor(Math.random() * pool.length));
    indices.forEach(idx => Object.assign(headers, pool[idx]));
    return headers;
}

function resolveFingerprint(sub, config) {
    if (sub.fpMode === 'unsafe') return 'unsafe';
    if (sub.fpMode === 'none') return 'none';
    if (sub.fpMode === 'omit') return '';
    if (sub.fpMode === 'custom') return cleanStr(sub.fpCustom);
    if (sub.fpMode && sub.fpMode !== 'random_list') return sub.fpMode;
    const pool = config.fpList?.length ? config.fpList : DEFAULT_CONFIG.fpList;
    return pool[Math.floor(Math.random() * pool.length)];
}

function resolveAlpn(sub, config) {
    if (sub.alpnMode === 'none') return '';
    if (sub.alpnMode === 'custom') return cleanStr(sub.alpnCustom);
    if (sub.alpnMode && sub.alpnMode !== 'random_list') return sub.alpnMode;
    const pool = config.alpnList?.length ? config.alpnList : DEFAULT_CONFIG.alpnList;
    return pool[Math.floor(Math.random() * pool.length)];
}

function buildServerDescriptor({
    serverType, tag, server, port, uuidOrPassword, tlsEnabled, sni, host, path,
    fingerprint, alpn, fragmentMode, fragmentFallbackDelay, fnfCsValue, fnfFmValue,
    insecure, packetEncoding, earlyDataLength, earlyDataName,
    randomizeHeaders, headerKey, headerValue, echDomain, echDns, echSingboxMode
}) {
    const headers = {};
    if (cleanStr(host)) headers["Host"] = host.trim();
    if (randomizeHeaders) {
        Object.assign(headers, generateDpiBypassHeaders());
    } else if (headerKey?.trim() && headerValue?.trim()) {
        headers[headerKey.trim()] = headerValue.trim();
    }
    return {
        serverType, tag, server, port: parseInt(port, 10), uuidOrPassword, tlsEnabled, sni, host, path,
        fingerprint, alpn, fragmentMode, fragmentFallbackDelay,
        fnfCsValue: fnfCsValue || '', fnfFmValue: fnfFmValue || '',
        insecure: !!insecure, packetEncoding,
        earlyDataLength, earlyDataName,
        echDomain: cleanStr(echDomain), echDns: normalizeDnsUrl(echDns), echSingboxMode: echSingboxMode || 'modern',
        headers
    };
}

function toSingboxOutbound(v, hasDnsBlock = false) {
    const outbound = {
        type: v.serverType,
        tag: v.tag,
        server: v.server.replace(/[\[\]]/g, ''),
        server_port: v.port
    };

    if (v.serverType === 'trojan') outbound.password = v.uuidOrPassword;
    else {
        outbound.uuid = v.uuidOrPassword;
        if (v.serverType === 'vmess') outbound.security = 'auto';
        if (v.packetEncoding && v.packetEncoding !== 'none') outbound.packet_encoding = v.packetEncoding;
    }

    if (v.tlsEnabled) {
        outbound.tls = {
            enabled: true,
            server_name: v.sni,
            insecure: v.insecure
        };
        if (v.fingerprint && !['none', 'unsafe'].includes(v.fingerprint)) {
            outbound.tls.utls = { enabled: true, fingerprint: v.fingerprint };
        }
        if (v.alpn) outbound.tls.alpn = [v.alpn];
        if (v.fragmentMode === 'tls_fragment') {
            outbound.tls.fragment = true;
            outbound.tls.fragment_fallback_delay = v.fragmentFallbackDelay;
        } else if (v.fragmentMode === 'tls_record_fragment') {
            outbound.tls.record_fragment = true;
        }

        if (v.echDomain || v.echDns) {
            const echObj = { enabled: true };
            if (v.echDomain) {
                if (v.echDomain.includes('BEGIN ECH CONFIGS')) {
                    echObj.config = v.echDomain.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                } else if (isStaticEchPayload(v.echDomain)) {
                    echObj.config = ['-----BEGIN ECH CONFIGS-----', v.echDomain, '-----END ECH CONFIGS-----'];
                } else {
                    echObj.query_server_name = v.echDomain;
                }
            }
            outbound.tls.ech = echObj;
            if (hasDnsBlock && v.echSingboxMode === 'modern') {
                outbound.domain_resolver = 'ech-dns';
            }
        }
    }

    outbound.transport = { type: 'ws', path: v.path, headers: { ...v.headers } };
    if (v.earlyDataLength) {
        const ed = parseInt(v.earlyDataLength, 10);
        if (ed > 0) outbound.transport.max_early_data = ed;
    }
    if (cleanStr(v.earlyDataName)) outbound.transport.early_data_header_name = v.earlyDataName.trim();
    return outbound;
}

function buildXrayEchValue(v) {
    const dom = cleanStr(v.echDomain);
    const dns = normalizeDnsUrl(v.echDns);
    if (!dom && !dns) return '';
    if (isStaticEchPayload(dom)) return dom.replace(/-----BEGIN ECH CONFIGS-----|-----END ECH CONFIGS-----|\s+/g, '');
    if (dom && dns && dns !== 'local') return `${dom}+${dns}`;
    if (dns && dns !== 'local') return dns;
    if (dom) return `${dom}+udp://1.1.1.1`;
    return '';
}

function buildXrayUriParams(v) {
    const params = [];
    params.push(`security=${v.tlsEnabled ? 'tls' : 'none'}`);
    if (v.serverType === 'vless') params.push('encryption=none');
    params.push('type=ws');
    if (v.host) params.push(`host=${encodeURIComponent(v.host)}`);
    params.push(`path=${encodeURIComponent(v.path)}`);

    if (v.tlsEnabled) {
        if (v.sni) params.push(`sni=${encodeURIComponent(v.sni)}`);
        if (v.alpn) params.push(`alpn=${encodeURIComponent(v.alpn)}`);
        if (v.fingerprint) params.push(`fp=${encodeURIComponent(v.fingerprint)}`);

        if (v.fragmentMode === 'fnf') {
            if (v.fnfCsValue) params.push(`cs=${encodeURIComponent(v.fnfCsValue)}`);
            if (v.fnfFmValue) params.push(`fm=${encodeURIComponent(v.fnfFmValue)}`);
        } else if (v.fragmentMode === 'tls_record_fragment') {
            params.push('tls_record_fragment=true', 'record_fragment=1', 'recordFragment=1', 'fragment=100-200,10-20,tlshello');
        } else if (v.fragmentMode === 'tls_fragment') {
            params.push('tls_fragment=true', 'fragment=100-200,10-20,tlshello');
            if (v.fragmentFallbackDelay) params.push(`fragment_fallback_delay=${encodeURIComponent(v.fragmentFallbackDelay)}`);
        }

        if (v.insecure) params.push('allowInsecure=1');
        const echVal = buildXrayEchValue(v);
        if (echVal) params.push(`ech=${encodeURIComponent(echVal)}`);
    }

    params.push('headerType=none');

    if (v.headers) {
        const hPairs = Object.entries(v.headers)
            .filter(([k, val]) => k.toLowerCase() !== 'host' && val !== undefined && val !== null && val !== '')
            .map(([k, val]) => `${k}|${val}`);
        if (hPairs.length) params.push(`headers=${encodeURIComponent(hPairs.join('|')).replace(/%7C/g, '|')}`);
    }
    if (v.earlyDataLength) {
        params.push(`max_early_data=${encodeURIComponent(v.earlyDataLength)}`, `ed=${encodeURIComponent(v.earlyDataLength)}`, `early_data_length=${encodeURIComponent(v.earlyDataLength)}`);
    }
    if (v.earlyDataName) params.push(`early_data_header_name=${encodeURIComponent(v.earlyDataName)}`);
    if (v.serverType === 'vless' && v.packetEncoding && v.packetEncoding !== 'none') {
        params.push(`packetEncoding=${encodeURIComponent(v.packetEncoding)}`);
    }
    return params;
}

function toStandardUri(v) {
    const formattedHost = formatHostForUri(v.server);
    if (v.serverType === 'vless' || v.serverType === 'trojan') {
        return `${v.serverType}://${encodeURIComponent(v.uuidOrPassword)}@${formattedHost}:${v.port}?${buildXrayUriParams(v).join('&')}#${encodeURIComponent(v.tag)}`;
    }
    if (v.serverType === 'vmess') {
        const vmessObj = {
            v: "2", ps: v.tag, add: v.server.replace(/[\[\]]/g, ''), port: v.port, id: v.uuidOrPassword,
            aid: 0, scy: "auto", net: "ws", type: "none", host: v.host || "", path: v.path || "/", tls: v.tlsEnabled ? "tls" : ""
        };
        if (v.tlsEnabled) {
            if (v.sni) vmessObj.sni = v.sni;
            if (v.fingerprint) vmessObj.fp = v.fingerprint;
            if (v.alpn) vmessObj.alpn = v.alpn;
            if (v.fragmentMode === 'fnf') {
                if (v.fnfCsValue) vmessObj.cs = v.fnfCsValue;
                if (v.fnfFmValue) vmessObj.fm = v.fnfFmValue;
            } else if (v.fragmentMode === 'tls_record_fragment') {
                vmessObj.tls_record_fragment = true; vmessObj.record_fragment = true; vmessObj.recordFragment = true; vmessObj.fragment = "100-200,10-20,tlshello";
            } else if (v.fragmentMode === 'tls_fragment') {
                vmessObj.tls_fragment = true; vmessObj.fragment = "100-200,10-20,tlshello";
                if (v.fragmentFallbackDelay) vmessObj.fragment_fallback_delay = v.fragmentFallbackDelay;
            }
            const echVal = buildXrayEchValue(v);
            if (echVal) vmessObj.ech = echVal;
        }
        if (v.packetEncoding && v.packetEncoding !== 'none') {
            vmessObj.packetEncoding = v.packetEncoding; vmessObj.packet_encoding = v.packetEncoding;
        }
        if (v.earlyDataLength) {
            const ed = parseInt(v.earlyDataLength, 10) || 2560;
            vmessObj.max_early_data = ed; vmessObj.ed = ed; vmessObj.early_data_length = ed;
        }
        if (v.earlyDataName) vmessObj.early_data_header_name = v.earlyDataName;
        if (v.headers) {
            const extraH = Object.fromEntries(Object.entries(v.headers).filter(([k]) => k.toLowerCase() !== 'host'));
            if (Object.keys(extraH).length) vmessObj.headers = extraH;
        }
        return 'vmess://' + Base64.encode(JSON.stringify(vmessObj));
    }
    return '';
}

function generateServerVariants(parsedServer, serverType, sub, ipv4List, ipv6List, domainList, config, prefix, urlHostname, fnfCsValue, fnfFmValue) {
    const variants = [];
    const baseName = (serverType === 'vmess' ? parsedServer.ps : parsedServer.name || parsedServer.password).trim();
    const addr = parsedServer.host || parsedServer.sni || parsedServer.add;
    let rawPath = `${addr}:${parsedServer.port}`;
    if (parsedServer.path && parsedServer.path !== '/') rawPath += `/${parsedServer.path.replace(/^\//, '')}`;
    const finalPath = `/${generateRandomToken()}/${Base64.encode(rawPath)}`;

    const useCustomDomains = sub.domainsMode === 'custom';
    const rawWorkerDomains = useCustomDomains ? (sub.customDomainsWorker || []) : (config.domainsWorker || []);
    const rawPagesDomains = useCustomDomains ? (sub.customDomainsPages || []) : (config.domainsPages || []);
    const isSubPagesDomain = (d) => {
        if (!d) return false;
        const low = d.toLowerCase();
        return low.endsWith('.pages.dev') || rawPagesDomains.some(p => p.toLowerCase() === low) || (!useCustomDomains && isPagesDomain(d, config));
    };
    const workerDomains = rawWorkerDomains.length ? rawWorkerDomains : (rawPagesDomains.length ? [] : [urlHostname]);
    const safeWorkerDomains = rawWorkerDomains.filter(d => !isSubPagesDomain(d));
    const hostNoTlsList = safeWorkerDomains.length ? safeWorkerDomains : (!rawPagesDomains.length && !isSubPagesDomain(urlHostname) ? [urlHostname] : []);
    const randomHostNoTls = () => hostNoTlsList.length ? hostNoTlsList[Math.floor(Math.random() * hostNoTlsList.length)] : null;
    const tlsDomains = [...workerDomains, ...rawPagesDomains];
    const randomSni = () => tlsDomains.length ? tlsDomains[Math.floor(Math.random() * tlsDomains.length)] : urlHostname;
    const randomDomain = () => domainList.length ? domainList[Math.floor(Math.random() * domainList.length)] : null;
    const uuid = serverType === 'trojan' ? parsedServer.password : parsedServer.id;

    const activeTlsPorts = sub.portsMode === 'custom' && sub.customPortsTLS?.length ? sub.customPortsTLS : config.portListTLS;
    const activeNoTlsPorts = sub.portsMode === 'custom' && sub.customPortsNoTLS?.length ? sub.customPortsNoTLS : config.portListNoTLS;
    const tlsPorts = activeTlsPorts?.length ? activeTlsPorts : [443];
    const noTlsPorts = activeNoTlsPorts?.length ? activeNoTlsPorts : [80];

    const activeModes = Array.isArray(sub.genModes) ? sub.genModes : [];
    const gen = {
        ipTls: activeModes.includes('ip_tls'), ipNoTls: activeModes.includes('ip_notls'),
        ipv6Tls: activeModes.includes('ipv6_tls'), ipv6NoTls: activeModes.includes('ipv6_notls'),
        domainTls: activeModes.includes('domain_tls'), domainNoTls: activeModes.includes('domain_notls')
    };
    const getFullName = (s) => `${prefix ? `${prefix}${baseName ? ' ' : ''}` : ''}${baseName} ${s}`.trim();

    const addVariant = (tagSuffix, serverAddr, portNum, tlsEnabled, customSni, customHost) => {
        variants.push(buildServerDescriptor({
            serverType,
            tag: getFullName(tagSuffix),
            server: serverAddr,
            port: portNum,
            uuidOrPassword: uuid,
            tlsEnabled,
            sni: tlsEnabled ? randomizeCase(customSni) : '',
            host: customHost,
            path: finalPath,
            fingerprint: tlsEnabled ? resolveFingerprint(sub, config) : '',
            alpn: tlsEnabled ? resolveAlpn(sub, config) : '',
            fragmentMode: sub.fragmentMode,
            fragmentFallbackDelay: sub.fragmentFallbackDelay,
            fnfCsValue: tlsEnabled ? fnfCsValue : '',
            fnfFmValue: tlsEnabled ? fnfFmValue : '',
            insecure: sub.allowInsecure,
            packetEncoding: sub.packetEncoding,
            earlyDataLength: sub.earlyDataLength,
            earlyDataName: sub.earlyDataName,
            randomizeHeaders: sub.randomizeHeaders,
            headerKey: sub.headerKey,
            headerValue: sub.headerValue,
            echDomain: tlsEnabled ? sub.echConfig : '',
            echDns: tlsEnabled ? sub.echDns : '',
            echSingboxMode: sub.echSingboxMode
        }));
    };

    if (gen.ipTls && ipv4List.length) {
        const d = randomSni();
        addVariant('[TLS-IPv4]', addressSelector.select(ipv4List[Math.floor(Math.random() * ipv4List.length)]), tlsPorts[Math.floor(Math.random() * tlsPorts.length)], true, sub.randomizeSniPrefix ? randomizeSubdomain(d) : d, d);
    }
    if (gen.ipNoTls && ipv4List.length) {
        const h = randomHostNoTls();
        if (h) addVariant('[No-TLS-IPv4]', addressSelector.select(ipv4List[Math.floor(Math.random() * ipv4List.length)]), noTlsPorts[Math.floor(Math.random() * noTlsPorts.length)], false, '', h);
    }
    if (gen.ipv6Tls && ipv6List.length) {
        const d = randomSni();
        addVariant('[TLS-IPv6]', addressSelector.select(ipv6List[Math.floor(Math.random() * ipv6List.length)]), tlsPorts[Math.floor(Math.random() * tlsPorts.length)], true, sub.randomizeSniPrefix ? randomizeSubdomain(d) : d, d);
    }
    if (gen.ipv6NoTls && ipv6List.length) {
        const h = randomHostNoTls();
        if (h) addVariant('[No-TLS-IPv6]', addressSelector.select(ipv6List[Math.floor(Math.random() * ipv6List.length)]), noTlsPorts[Math.floor(Math.random() * noTlsPorts.length)], false, '', h);
    }
    const domTls = randomDomain();
    if (gen.domainTls && domTls) {
        const d = randomSni();
        addVariant('[TLS-Domain]', domTls, tlsPorts[Math.floor(Math.random() * tlsPorts.length)], true, sub.randomizeSniPrefix ? randomizeSubdomain(d) : d, d);
    }
    const domNoTls = randomDomain();
    if (gen.domainNoTls && domNoTls) {
        const h = randomHostNoTls();
        if (h) addVariant('[No-TLS-Domain]', domNoTls, noTlsPorts[Math.floor(Math.random() * noTlsPorts.length)], false, '', h);
    }

    if (sub.extraServers) {
        for (const line of sub.extraServers.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean)) {
            const parsed = parseServerAddressAndPort(line);
            if (parsed) {
                const d = randomSni();
                addVariant(`[Extra-${formatShortAddress(parsed.addr)}]`, parsed.addr, parsed.port, true, sub.randomizeSniPrefix ? randomizeSubdomain(d) : d, d);
            }
        }
    }
    return variants;
}

async function buildSubscriptionContent(request, env, ctx, config, sub) {
    const allVariants = [];
    const url = new URL(request.url);
    const customSublink = url.searchParams.get('sublink');
    const activeIpPool = sub.ipPoolMode === 'custom' ? (sub.customIpList || []) : (config.ipList || []);
    const ipv4List = activeIpPool.filter(item => isIpv4(item));
    const ipv6List = activeIpPool.filter(item => isIpv6(item));
    const domainList = activeIpPool.filter(item => !isIpv4(item) && !isIpv6(item));

    const fnfCsValue = sub.fragmentMode === 'fnf' && sub.fnfCsId
        ? (config.csPresets?.find(p => p.id === sub.fnfCsId)?.value || '')
        : '';
    const fnfFmValue = sub.fragmentMode === 'fnf' && sub.fnfFmId
        ? (config.fmPresets?.find(p => p.id === sub.fnfFmId)?.value || '')
        : '';

    if (sub.includeCustomServers && config.customServers?.length) {
        let counter = 1;
        for (const serverLink of config.customServers) {
            try {
                let parsed, type;
                if (serverLink.startsWith('vmess://')) {
                    parsed = cleanParsedServer(JSON.parse(Base64.decode(serverLink.replace('vmess://', ''))));
                    type = 'vmess';
                } else if (serverLink.startsWith('vless://') || serverLink.startsWith('trojan://')) {
                    parsed = decodeUriConfig(serverLink);
                    type = parsed.protocol;
                } else continue;

                if (!((type === 'vmess' && parsed.net === 'ws') || (type !== 'vmess' && parsed.type === 'ws'))) continue;

                if (type === 'vmess') parsed.ps = `📝 [${counter}] ${parsed.ps}`;
                else parsed.name = `📝 [${counter}] ${parsed.name || parsed.password}`;

                const variants = generateServerVariants(parsed, type, sub, ipv4List, ipv6List, domainList, config, '', url.hostname, fnfCsValue, fnfFmValue);
                if (variants.length) { allVariants.push(...variants); counter++; }
            } catch (e) { console.error('Error processing custom server:', e); }
        }
    }

    if (sub.includeSubLinks || customSublink) {
        const sublinksToFetch = sub.includeSubLinks ? [...(config.defaultSublink || [])] : [];
        if (customSublink) sublinksToFetch.push(customSublink);

        const fetchedResults = await Promise.all(sublinksToFetch.map(async (subLink) => {
            const cacheKey = `sub_cache:${Base64.encode(subLink)}`;
            try {
                const cachedData = await env.KV.get(cacheKey);
                if (cachedData) return { subLink, text: cachedData };
            } catch {}

            try {
                const resp = await fetchWithTimeout(subLink, 2500);
                if (!resp.ok) return null;
                const text = await resp.text();
                ctx.waitUntil(env.KV.put(cacheKey, text, { expirationTtl: 900 }));
                return { subLink, text };
            } catch { return null; }
        }));

        let subCounter = 1;
        const seenServers = new Set();

        for (const result of fetchedResults) {
            if (!result) { subCounter++; continue; }
            let text = result.text;
            if (/^[A-Za-z0-9+/\-_=\s]*$/.test(text) && text.trim().length > 0) {
                try {
                    const decoded = Base64.decode(text);
                    if (decoded.includes('://') || decoded.startsWith('{')) text = decoded;
                } catch {}
            }

            const configs = [];
            let isSingboxJson = false;

            try {
                const trimmed = text.trim();
                if (trimmed.startsWith('{')) {
                    const json = JSON.parse(trimmed);
                    if (Array.isArray(json?.outbounds)) {
                        isSingboxJson = true;
                        for (const out of json.outbounds) {
                            if (['vless', 'vmess', 'trojan'].includes(out.type)) {
                                const parsed = {
                                    add: out.server, port: out.server_port, id: out.uuid || out.password, password: out.password,
                                    path: out.transport?.path || '', host: out.transport?.headers?.Host || out.transport?.headers?.host || '',
                                    tls: out.tls?.enabled || false, sni: out.tls?.server_name || '', net: out.transport?.type || '', type: out.transport?.type || ''
                                };
                                if (out.type === 'vmess') parsed.ps = out.tag || '';
                                else parsed.name = out.tag || '';
                                configs.push({ parsed, type: out.type });
                            }
                        }
                    }
                }
            } catch {}

            if (!isSingboxJson) {
                for (const configLink of text.split(/[\r\n]+/).filter(Boolean)) {
                    try {
                        let parsed, type;
                        if (configLink.startsWith('vmess://')) {
                            parsed = cleanParsedServer(JSON.parse(Base64.decode(configLink.replace('vmess://', ''))));
                            type = 'vmess';
                        } else if (configLink.startsWith('vless://') || configLink.startsWith('trojan://')) {
                            parsed = decodeUriConfig(configLink);
                            type = parsed.protocol;
                        } else continue;
                        configs.push({ parsed, type });
                    } catch {}
                }
            }

            let serverCounter = 1;
            for (const item of configs) {
                try {
                    const { parsed, type } = item;
                    if (!((type === 'vmess' && parsed.net === 'ws') || (type !== 'vmess' && parsed.type === 'ws'))) continue;

                    const uuid = type === 'vmess' ? parsed.id : (type === 'trojan' ? parsed.password : parsed.id);
                    const dupKey = `${uuid}|${parsed.host || parsed.add || ''}|${parsed.path || ''}|${parsed.tls}`.toLowerCase();
                    if (seenServers.has(dupKey)) continue;
                    seenServers.add(dupKey);

                    const prefix = `🔗 [${subCounter}/${serverCounter}]`;
                    const baseName = type === 'vmess' ? parsed.ps : (parsed.name || parsed.password);
                    const variants = generateServerVariants({ ...parsed, ps: baseName, name: baseName }, type, sub, ipv4List, ipv6List, domainList, config, prefix, url.hostname, fnfCsValue, fnfFmValue);
                    if (variants.length) { allVariants.push(...variants); serverCounter++; }
                } catch (e) { console.error('Error processing config item:', e); }
            }
            subCounter++;
        }
    }

    let plainText = '', contentType = 'text/plain; charset=utf-8';
    if (sub.coreType === 'singbox' && sub.fragmentMode !== 'fnf') {
        const dnsBlock = buildSingboxDnsBlock(sub.echDns, sub.echSingboxMode);
        const hasDnsBlock = !!(dnsBlock && allVariants.some(v => v.tlsEnabled && (v.echDomain || v.echDns)));
        const outbounds = allVariants.map(v => toSingboxOutbound(v, hasDnsBlock));
        outbounds.push({ type: "direct", tag: "direct" });
        const rootObj = hasDnsBlock ? { dns: dnsBlock, outbounds } : { outbounds };
        plainText = JSON.stringify(rootObj, null, 2);
        if (sub.outputFormat === 'plain') contentType = 'application/json; charset=utf-8';
    } else {
        plainText = allVariants.map(toStandardUri).join('\n');
    }

    const output = sub.outputFormat === 'base64' ? Base64.encode(plainText) : plainText;
    return {
        output,
        plainText,
        count: allVariants.length,
        contentType: sub.outputFormat === 'base64' ? 'text/plain; charset=utf-8' : contentType
    };
}

async function handleSubscriptionRequest(request, env, ctx, config, sub) {
    const { output, contentType } = await buildSubscriptionContent(request, env, ctx, config, sub);
    return new Response(output, { headers: { 'Content-Type': contentType } });
}

async function handleWebSocketProxy(request) {
    const url = new URL(request.url);
    const pathSegments = url.pathname.replace(/^\/+/, '').split('/');
    if (!pathSegments[0]) return new Response('Bad Request: Invalid URL path.', { status: 400 });

    const encodedTarget = pathSegments[1] || pathSegments[0];
    const additionalPath = pathSegments.length > 2 ? pathSegments.slice(2).join('/') : '';
    let decoded;
    try {
        decoded = Base64.decode(encodedTarget);
    } catch {
        return new Response('Bad Request: Invalid encoded target.', { status: 400 });
    }

    const firstSlash = decoded.indexOf('/');
    const addressPart = firstSlash === -1 ? decoded : decoded.substring(0, firstSlash);
    let targetPath = firstSlash !== -1 ? decoded.substring(firstSlash) : '/';

    const parsed = parseServerAddressAndPort(addressPart);
    const host = parsed ? parsed.addr : addressPart.replace(/[\[\]]/g, '');
    const port = parsed ? parsed.port : '';

    const newUrl = new URL(`https://${formatHostForUri(host)}`);
    if (port) newUrl.port = port;
    if (additionalPath) targetPath = targetPath.replace(/\/+$/, '') + '/' + additionalPath;
    newUrl.pathname = targetPath;
    return fetch(new Request(newUrl, request));
}

function getAdminPanelHtml(adminPath) {
    const safeAdminPath = JSON.stringify(adminPath);
    const safeVersion = JSON.stringify(APP_VERSION);
    const safeGithubUrl = JSON.stringify(GITHUB_REPO_URL);
    const tlsPortsJson = JSON.stringify(ALL_TLS_PORTS);
    const noTlsPortsJson = JSON.stringify(ALL_NOTLS_PORTS);

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>EdgeRelay ${APP_VERSION} — Cloudflare Proxy &amp; Subscription Panel</title>
<style>
:root {
    --bg: #f3f5f9;
    --surface: #ffffff;
    --surface-alt: #f8fafc;
    --border: #e2e8f0;
    --border-focus: #6366f1;
    --text: #0f172a;
    --text-muted: #64748b;
    --primary: #4f46e5;
    --primary-hover: #4338ca;
    --primary-soft: rgba(79, 70, 229, 0.1);
    --success: #059669;
    --success-soft: rgba(5, 150, 105, 0.12);
    --warning: #d97706;
    --warning-soft: rgba(217, 119, 6, 0.12);
    --danger: #dc2626;
    --danger-soft: rgba(220, 38, 38, 0.1);
    --info: #0284c7;
    --info-soft: rgba(2, 132, 199, 0.12);
    --shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.06);
    --shadow-lg: 0 20px 45px -10px rgba(15, 23, 42, 0.18);
    --radius: 14px;
    --radius-sm: 9px;
}
html.dark {
    --bg: #0b1120;
    --surface: #111827;
    --surface-alt: #182235;
    --border: #263248;
    --border-focus: #818cf8;
    --text: #f1f5f9;
    --text-muted: #94a3b8;
    --primary: #6366f1;
    --primary-hover: #4f46e5;
    --primary-soft: rgba(99, 102, 241, 0.18);
    --success: #34d399;
    --success-soft: rgba(52, 211, 153, 0.14);
    --warning: #fbbf24;
    --warning-soft: rgba(251, 191, 36, 0.14);
    --danger: #f87171;
    --danger-soft: rgba(248, 113, 113, 0.14);
    --info: #38bdf8;
    --info-soft: rgba(56, 189, 248, 0.15);
    --shadow: 0 4px 24px -4px rgba(0, 0, 0, 0.45);
    --shadow-lg: 0 24px 50px -10px rgba(0, 0, 0, 0.7);
}
* { box-sizing: border-box; }
html, body {
    max-width: 100%;
    overflow-x: clip;
}
html.modal-open, body.modal-open {
    overflow: hidden !important;
}
body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.5;
    min-height: 100vh;
    transition: background-color 0.2s, color 0.2s;
}
.hidden { display: none !important; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }

.auth-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
.auth-card {
    width: 100%; max-width: 390px; background: var(--surface); border: 1px solid var(--border);
    border-radius: 20px; padding: 34px 28px; box-shadow: var(--shadow-lg);
}
.auth-logo {
    width: 50px; height: 50px; border-radius: 14px;
    background: linear-gradient(135deg, #4f46e5, #06b6d4);
    display: flex; align-items: center; justify-content: center; color: #fff; margin: 0 auto 16px;
}
.auth-card h1 { margin: 0 0 6px; font-size: 22px; text-align: center; }
.auth-card p { margin: 0 0 24px; font-size: 13px; color: var(--text-muted); text-align: center; }

.app-header { position: sticky; top: 0; z-index: 40; background: var(--surface); border-bottom: 1px solid var(--border); width: 100%; }
.header-inner {
    max-width: 1240px; margin: 0 auto; padding: 12px 20px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
}
.brand { display: flex; align-items: center; gap: 11px; min-width: 0; }
.brand-icon {
    width: 36px; height: 36px; border-radius: 10px;
    background: linear-gradient(135deg, #4f46e5, #06b6d4);
    color: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.brand-title-row { display: flex; align-items: center; gap: 7px; }
.brand-title { font-weight: 700; font-size: 16px; line-height: 1.2; }
.version-pill {
    font-size: 10.5px; font-weight: 700; padding: 1px 7px; border-radius: 999px;
    background: var(--primary-soft); color: var(--primary);
}
.brand-sub { font-size: 11px; color: var(--text-muted); }
.header-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

.tabs-bar { max-width: 1240px; margin: 0 auto; padding: 0 20px; display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none; }
.tabs-bar::-webkit-scrollbar { display: none; }
.tab-btn {
    border: none; background: transparent; color: var(--text-muted); font-size: 13.5px; font-weight: 600;
    padding: 12px 16px; cursor: pointer; border-bottom: 2px solid transparent;
    display: inline-flex; align-items: center; gap: 7px; white-space: nowrap; transition: all 0.15s;
}
.tab-btn:hover { color: var(--text); }
.tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); }
.tab-count {
    font-size: 11px; padding: 1px 7px; border-radius: 999px;
    background: var(--surface-alt); border: 1px solid var(--border); color: var(--text-muted);
}
.tab-btn.active .tab-count { background: var(--primary-soft); border-color: transparent; color: var(--primary); }

.main-container { max-width: 1240px; width: 100%; margin: 0 auto; padding: 24px 20px 80px; }
.section-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px; flex-wrap: wrap; }
.section-head h2 { margin: 0; font-size: 19px; font-weight: 700; }
.section-desc { margin: 2px 0 0; font-size: 13px; color: var(--text-muted); }
.section-tools { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.sub-search { width: 220px !important; height: 36px; }

.grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
.grid-start { align-items: start; }
@media (max-width: 760px) { .grid-2 { grid-template-columns: minmax(0, 1fr); } }

.card, .sub-card, .preset-item, .list-stack, .field, .modal-section { min-width: 0; max-width: 100%; }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; box-shadow: var(--shadow); }
.card-flex { display: flex; flex-direction: column; }
.field-grow { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
.card-title { font-size: 15.5px; font-weight: 700; margin: 0; }
.card-subtitle { font-size: 12.5px; color: var(--text-muted); margin-top: 2px; overflow-wrap: anywhere; }

label.field-label { display: block; font-size: 12.5px; font-weight: 600; color: var(--text-muted); margin-bottom: 5px; }
input[type="text"], input[type="search"], input[type="password"], select, textarea {
    width: 100%; max-width: 100%; min-width: 0;
    padding: 8px 11px; font-size: 13.5px; color: var(--text);
    background: var(--surface-alt); border: 1px solid var(--border); border-radius: var(--radius-sm);
    outline: none; transition: border-color 0.15s, box-shadow 0.15s; font-family: inherit;
}
textarea { resize: vertical; min-height: 92px; }
textarea.pool-box {
    height: 108px;
    min-height: 108px;
    max-height: 108px;
    overflow-y: auto;
    resize: none;
    transition: max-height 0.2s ease;
}
.card-flex .field-grow textarea.pool-box:not(.expanded) {
    flex: 1;
    height: auto;
    min-height: 185px;
    max-height: 100%;
}
textarea.pool-box.expanded {
    flex: none !important;
    max-height: none !important;
    overflow-y: hidden !important;
}
textarea.sub-pool-box {
    min-height: 108px;
    max-height: 240px;
    overflow-y: auto;
    resize: vertical;
}
textarea.sub-pool-box.expanded {
    max-height: none;
    overflow-y: hidden;
}
@media (max-width: 760px) {
    .card-flex .field-grow textarea.pool-box:not(.expanded) {
        min-height: 130px;
        max-height: 165px;
    }
}
input:focus, select:focus, textarea:focus { border-color: var(--border-focus); box-shadow: 0 0 0 3px var(--primary-soft); }
.field { margin-bottom: 14px; }
.field:last-child { margin-bottom: 0; }
.hint { font-size: 11.5px; color: var(--text-muted); margin-top: 5px; overflow-wrap: anywhere; }

.btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    height: 36px; padding: 0 14px; font-size: 13px; font-weight: 600;
    border-radius: var(--radius-sm); border: 1px solid var(--border);
    background: var(--surface); color: var(--text); cursor: pointer; transition: all 0.15s;
    white-space: nowrap; text-decoration: none;
}
.btn:hover { background: var(--surface-alt); }
.btn:active { transform: translateY(1px); }
.btn-primary { background: var(--primary); border-color: var(--primary); color: #fff; }
.btn-primary:hover { background: var(--primary-hover); border-color: var(--primary-hover); }
.btn-danger { background: var(--danger-soft); border-color: transparent; color: var(--danger); }
.btn-soft { background: var(--primary-soft); border-color: transparent; color: var(--primary); }
.btn-sm { height: 30px; padding: 0 10px; font-size: 12px; border-radius: 7px; }
.btn-icon { width: 32px; height: 32px; padding: 0; }
.btn-block { width: 100%; height: 42px; font-size: 14px; }
.update-badge {
    background: var(--success-soft);
    border-color: transparent;
    color: var(--success);
    gap: 5px;
    padding: 0 10px;
}
.update-badge:hover { background: var(--success-soft); filter: brightness(0.95); }
.update-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--success); flex-shrink: 0; }
.release-notes-box {
    background: var(--surface-alt);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 12px 14px;
    max-height: 280px;
    overflow-y: auto;
    font-size: 13px;
    line-height: 1.6;
    overflow-wrap: anywhere;
}
.release-notes-box h3 { margin: 10px 0 5px; font-size: 13.5px; }
.release-notes-box h3:first-child { margin-top: 0; }
.release-notes-box ul { margin: 4px 0 8px 18px; padding: 0; }
.release-notes-box code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    background: var(--surface);
    border: 1px solid var(--border);
    padding: 1px 5px;
    border-radius: 4px;
}

.filter-bar { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
.filter-pill {
    border: 1px solid var(--border); background: var(--surface-alt); color: var(--text-muted);
    font-size: 11.5px; font-weight: 600; padding: 4px 10px; border-radius: 999px;
    cursor: pointer; transition: all 0.15s;
}
.filter-pill:hover { color: var(--text); border-color: var(--border-focus); }
.filter-pill.active { background: var(--primary); border-color: var(--primary); color: #fff; }

.badge {
    display: inline-flex; align-items: center; gap: 4px; padding: 2px 9px;
    border-radius: 999px; font-size: 11.5px; font-weight: 600; border: 1px solid transparent;
    max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.badge-primary { background: var(--primary-soft); color: var(--primary); }
.badge-success { background: var(--success-soft); color: var(--success); }
.badge-warning { background: var(--warning-soft); color: var(--warning); }
.badge-danger { background: var(--danger-soft); color: var(--danger); }
.badge-info { background: var(--info-soft); color: var(--info); }
.badge-neutral { background: var(--surface-alt); border-color: var(--border); color: var(--text-muted); }
.unsaved-pill {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 2px 3px 2px 10px; border-radius: 999px;
    background: var(--warning-soft); color: var(--warning);
    border: 1px solid rgba(217, 119, 6, 0.28);
    font-size: 11.5px; font-weight: 600;
}
.unsaved-discard {
    border: none; border-radius: 999px; cursor: pointer;
    height: 22px; padding: 0 8px; font-size: 11px; font-weight: 700;
    background: var(--warning); color: #fff; transition: filter 0.15s;
}
.unsaved-discard:hover { filter: brightness(0.92); }

.switch { position: relative; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; font-size: 13px; font-weight: 500; }
.switch input {
    appearance: none; width: 40px; height: 22px; border-radius: 999px; background: var(--border);
    position: relative; cursor: pointer; transition: background 0.2s; flex-shrink: 0; margin: 0;
}
.switch input::after {
    content: ""; position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%;
    background: #fff; transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.25);
}
.switch input:checked { background: var(--primary); }
.switch input:checked::after { transform: translateX(18px); }

.sub-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
    padding: 18px; box-shadow: var(--shadow); display: flex; flex-direction: column; gap: 12px;
}
.sub-card.disabled { opacity: 0.62; }
.sub-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.sub-card-top > div { min-width: 0; flex: 1; }
.sub-name { font-size: 16px; font-weight: 700; margin: 0 0 4px; overflow-wrap: anywhere; }
.sub-url-box {
    display: flex; align-items: center; justify-content: space-between; gap: 8px; min-width: 0;
    padding: 7px 10px; background: var(--surface-alt); border: 1px solid var(--border);
    border-radius: 8px; font-size: 12.5px;
}
.sub-url-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--primary); font-weight: 600; }
.sub-pills { display: flex; flex-wrap: wrap; gap: 6px; }
.sub-actions {
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
    padding-top: 10px; border-top: 1px solid var(--border); flex-wrap: wrap;
}
.sub-actions-left, .sub-actions-right { display: flex; gap: 6px; flex-wrap: wrap; }

.list-stack { display: flex; flex-direction: column; gap: 10px; }
.item-row {
    display: flex; align-items: center; gap: 8px; background: var(--surface-alt);
    border: 1px solid var(--border); border-radius: 10px; padding: 8px 10px; min-width: 0; max-width: 100%;
}
.item-num { font-size: 12px; font-weight: 700; color: var(--text-muted); min-width: 24px; text-align: center; flex-shrink: 0; }
.item-body { flex: 1; min-width: 0; }
.item-meta { font-size: 11px; color: var(--text-muted); margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.item-row input { background: var(--surface); }
.item-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.list-expand-footer { text-align: center; padding-top: 4px; }

.check-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(138px, 1fr)); gap: 7px; }
.check-pill {
    display: flex; align-items: center; gap: 7px; padding: 7px 9px; border: 1px solid var(--border);
    border-radius: 8px; background: var(--surface-alt); font-size: 12.5px; font-weight: 500; cursor: pointer;
}
.check-pill input { width: auto; margin: 0; accent-color: var(--primary); }

.method-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
@media (max-width: 560px) { .method-grid { grid-template-columns: minmax(0, 1fr); } }
.method-card {
    border: 1px solid var(--border); background: var(--surface-alt); border-radius: 9px;
    padding: 8px 11px; cursor: pointer; display: flex; align-items: flex-start; gap: 8px; transition: all 0.15s; min-width: 0;
}
.method-card.selected { border-color: var(--primary); background: var(--primary-soft); }
.method-card input { width: auto; margin-top: 3px; accent-color: var(--primary); }
.method-title { font-size: 12.5px; font-weight: 700; }
.method-desc { font-size: 11px; color: var(--text-muted); line-height: 1.35; }

.modal-backdrop {
    position: fixed; inset: 0; z-index: 100; background: rgba(2, 6, 23, 0.65);
    backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 16px;
    overscroll-behavior: contain;
}
.modal-dialog {
    width: 100%; max-width: 740px; max-height: 90vh; background: var(--surface);
    border: 1px solid var(--border); border-radius: 18px; box-shadow: var(--shadow-lg);
    display: flex; flex-direction: column; overflow: hidden;
}
.modal-dialog.wide { max-width: 900px; }
.modal-dialog.narrow { max-width: 520px; }
.modal-dialog.confirm-dialog { max-width: 420px; }
.confirm-icon {
    width: 34px; height: 34px; border-radius: 10px;
    background: var(--danger-soft); color: var(--danger);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.confirm-target {
    font-size: 12px; color: var(--text-muted);
    background: var(--surface-alt); border: 1px solid var(--border);
    border-radius: 8px; padding: 8px 10px; max-height: 80px;
    overflow: hidden; overflow-wrap: anywhere; word-break: break-all;
}
.modal-header { padding: 14px 18px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.modal-header h3 { margin: 0; font-size: 16px; font-weight: 700; }
.modal-body { padding: 18px; overflow-y: auto; flex: 1; overscroll-behavior: contain; }
.modal-footer { padding: 12px 18px; border-top: 1px solid var(--border); display: flex; align-items: center; justify-content: flex-end; gap: 10px; background: var(--surface-alt); flex-wrap: wrap; }
.modal-section { border: 1px solid var(--border); border-radius: 11px; padding: 12px 14px; margin-bottom: 10px; }
.modal-section:last-child { margin-bottom: 0; }
.modal-section-title { font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); margin: 0 0 9px; }

#sub-modal .modal-body { padding: 14px 18px; }
#sub-modal .grid-2 { gap: 10px 14px; }
#sub-modal .field { margin-bottom: 8px; }
#sub-modal .field:last-child { margin-bottom: 0; }
#sub-modal label.field-label { margin-bottom: 4px; font-size: 12px; }
#sub-modal .hint { margin-top: 3px; font-size: 11px; }

.preset-item { border: 1px solid var(--border); background: var(--surface-alt); border-radius: 11px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; }
.preset-code { font-size: 11.5px; color: var(--text-muted); background: var(--surface); border: 1px solid var(--border); border-radius: 7px; padding: 8px 10px; max-height: 76px; overflow: hidden; overflow-wrap: anywhere; word-break: break-all; }

.toast-container { position: fixed; top: 16px; right: 16px; z-index: 200; display: flex; flex-direction: column; gap: 8px; max-width: 360px; }
.toast { padding: 11px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; box-shadow: var(--shadow-lg); border: 1px solid transparent; animation: slideIn 0.2s ease; }
.toast-success { background: #ecfdf5; color: #065f46; border-color: #a7f3d0; }
.toast-error { background: #fef2f2; color: #991b1b; border-color: #fecaca; }
.toast-info { background: #eff6ff; color: #1e40af; border-color: #bfdbfe; }
html.dark .toast-success { background: #064e3b; color: #a7f3d0; border-color: #047857; }
html.dark .toast-error { background: #7f1d1d; color: #fecaca; border-color: #b91c1c; }
html.dark .toast-info { background: #1e3a8a; color: #bfdbfe; border-color: #1d4ed8; }
@keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }

.empty-state { text-align: center; padding: 36px 20px; border: 1px dashed var(--border); border-radius: var(--radius); color: var(--text-muted); font-size: 13.5px; }
.input-group { display: flex; gap: 8px; align-items: center; min-width: 0; }
.input-group input { flex: 1; min-width: 0; }
.divider-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }

@media (max-width: 600px) {
    .header-inner { padding: 10px 12px; }
    .tabs-bar { padding: 0 12px; }
    .main-container { padding: 16px 12px 72px; }
    .card, .sub-card { padding: 14px; }
    .section-tools { width: 100%; }
    .sub-search { flex: 1; width: auto !important; }
    .modal-backdrop { padding: 10px; }
    .modal-body, #sub-modal .modal-body { padding: 12px; }
    .modal-section { padding: 11px; }
    .toast-container { left: 12px; right: 12px; max-width: none; }
    .item-row { flex-wrap: wrap; gap: 6px; padding: 10px; }
    .item-row .item-num { min-width: 18px; text-align: left; }
    .item-row .item-body { flex: 1 1 calc(100% - 28px); min-width: 0; }
    .item-row .item-actions { width: 100%; justify-content: flex-end; }
}
</style>
</head>
<body>
<div id="toast-container" class="toast-container"></div>

<!-- Login Screen -->
<div id="login-view" class="auth-wrap hidden">
    <div class="auth-card">
        <div class="auth-logo">
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        </div>
        <h1>EdgeRelay <span class="version-pill mono">${APP_VERSION}</span></h1>
        <p>Cloudflare Edge Proxy &amp; Multi-Core Subscription Manager</p>
        <div class="field">
            <label class="field-label" for="login-password">Admin Password</label>
            <input type="password" id="login-password" placeholder="Enter password...">
        </div>
        <button id="login-btn" class="btn btn-primary btn-block" style="margin-top: 8px;">Sign In</button>
    </div>
</div>

<!-- Main App -->
<div id="app-view" class="hidden">
    <header class="app-header">
        <div class="header-inner">
            <div class="brand">
                <div class="brand-icon">
                    <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                </div>
                <div>
                    <div class="brand-title-row">
                        <span class="brand-title">EdgeRelay</span>
                        <span class="version-pill mono">${APP_VERSION}</span>
                    </div>
                    <div class="brand-sub">Cloudflare Edge Proxy &amp; Subscription Engine</div>
                </div>
            </div>
            <div class="header-actions">
                <div id="unsaved-pill" class="unsaved-pill hidden"><span>Unsaved Changes</span><button id="discard-btn" class="unsaved-discard" type="button" onclick="discardChanges()" title="Discard unsaved changes">Discard</button></div>
                <button id="update-badge-btn" class="btn btn-sm update-badge hidden" type="button" onclick="openUpdateModal()" title="New update available">
                    <span class="update-dot"></span>
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 16V8m0 0l-3.5 3.5M12 8l3.5 3.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <span id="update-badge-tag" class="mono"></span>
                </button>
                <a id="github-link-btn" class="btn btn-sm btn-icon" target="_blank" rel="noopener noreferrer" title="GitHub Repository (EdgeRelay)" aria-label="GitHub Repository">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                </a>
                <button id="theme-btn" class="btn btn-sm" type="button">Dark</button>
                <button id="save-all-btn" class="btn btn-primary btn-sm" type="button">Save Changes</button>
                <button id="logout-btn" class="btn btn-danger btn-sm" type="button">Logout</button>
            </div>
        </div>
        <nav class="tabs-bar">
            <button class="tab-btn active" data-tab="subscriptions">Subscriptions <span id="cnt-subs" class="tab-count">0</span></button>
            <button class="tab-btn" data-tab="sources">Sources <span id="cnt-sources" class="tab-count">0</span></button>
            <button class="tab-btn" data-tab="network">Network &amp; Pools</button>
            <button class="tab-btn" data-tab="fnf">F&amp;F Presets <span id="cnt-fnf" class="tab-count">0</span></button>
            <button class="tab-btn" data-tab="settings">General &amp; Security</button>
        </nav>
    </header>

    <main class="main-container">
        <!-- Tab 1: Subscriptions -->
        <section id="tab-subscriptions">
            <div class="section-head">
                <div>
                    <h2>Output Subscription Links</h2>
                    <p class="section-desc">Create unlimited subscription endpoints with independent core, format, ECH/DNS, generation modes, and F&amp;F settings.</p>
                </div>
                <div class="section-tools">
                    <input type="search" id="sub-search-input" class="sub-search" placeholder="Search subscriptions...">
                    <button id="btn-new-sub" class="btn btn-primary" type="button">+ Create Subscription</button>
                </div>
            </div>
            <div id="subs-grid" class="grid-2"></div>
        </section>

        <!-- Tab 2: Sources -->
        <section id="tab-sources" class="hidden">
            <div class="section-head">
                <div>
                    <h2>Input Sources</h2>
                    <p class="section-desc">Manage WebSocket custom servers and upstream external subscription links.</p>
                </div>
            </div>
            <div class="grid-2 grid-start">
                <div class="card">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">Custom Servers (WS)</h3>
                            <div class="card-subtitle">Supports VMess, VLESS, and Trojan WebSocket links</div>
                        </div>
                        <div style="display:flex; gap:6px; flex-wrap:wrap;">
                            <button id="btn-expand-custom" class="btn btn-sm hidden" type="button" onclick="toggleSourceExpand('custom')">Show All</button>
                            <button class="btn btn-sm" type="button" onclick="openBulkModal('custom')">Bulk</button>
                            <button class="btn btn-primary btn-sm" type="button" onclick="addSourceItem('custom')">+ Add</button>
                        </div>
                    </div>
                    <div id="custom-servers-list" class="list-stack"></div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">External Subscription Links</h3>
                            <div class="card-subtitle">Plain URIs, Base64 subscriptions, or Sing-box JSON URLs</div>
                        </div>
                        <div style="display:flex; gap:6px; flex-wrap:wrap;">
                            <button id="btn-expand-sublink" class="btn btn-sm hidden" type="button" onclick="toggleSourceExpand('sublink')">Show All</button>
                            <button class="btn btn-sm" type="button" onclick="openBulkModal('sublink')">Bulk</button>
                            <button class="btn btn-primary btn-sm" type="button" onclick="addSourceItem('sublink')">+ Add</button>
                        </div>
                    </div>
                    <div id="sub-links-list" class="list-stack"></div>
                </div>
            </div>
        </section>

        <!-- Tab 3: Network & Pools -->
        <section id="tab-network" class="hidden">
            <div class="section-head">
                <div>
                    <h2>Network, IP Pools &amp; Ports</h2>
                    <p class="section-desc">Shared Cloudflare IPs, CIDR ranges, Worker/Pages domains, ports, ALPN, and Fingerprint pools.</p>
                </div>
            </div>
            <div class="grid-2" style="margin-bottom: 18px;">
                <div class="card card-flex">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">IP / CIDR / Domain Pool</h3>
                            <div class="card-subtitle" id="ip-stats">0 IPv4, 0 IPv6, 0 Domains</div>
                        </div>
                        <div style="display:flex; gap:6px; flex-wrap:wrap;">
                            <button class="btn btn-sm" type="button" onclick="togglePoolFormat('cfg-ipList', this)" title="Toggle comma vs one-per-line">Sep: ,</button>
                            <button class="btn btn-sm" type="button" onclick="togglePoolExpand('cfg-ipList', this)">Expand</button>
                            <button class="btn btn-primary btn-sm" type="button" onclick="openPoolAddModal('cfg-ipList', 'Add IPs / CIDRs / Domains')">+ Add</button>
                        </div>
                    </div>
                    <div class="filter-bar" id="ip-filter-bar">
                        <button type="button" class="filter-pill active" data-filter="all" onclick="setIpFilter('all')">All</button>
                        <button type="button" class="filter-pill" data-filter="ipv4" onclick="setIpFilter('ipv4')">IPv4</button>
                        <button type="button" class="filter-pill" data-filter="ipv6" onclick="setIpFilter('ipv6')">IPv6</button>
                        <button type="button" class="filter-pill" data-filter="domain" onclick="setIpFilter('domain')">Domains</button>
                    </div>
                    <div class="field field-grow">
                        <textarea id="cfg-ipList" class="mono pool-box" placeholder="104.21.32.1, 172.66.210.0/24, 2606:4700::/48, www.speedtest.net"></textarea>
                        <div class="hint">Supports IPv4, IPv4 CIDR, IPv6, IPv6 CIDR, and clean domains. Filter safely without losing hidden entries.</div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">Your Cloudflare Domains</h3>
                            <div class="card-subtitle">Pages domains are automatically excluded from No-TLS modes</div>
                        </div>
                    </div>
                    <div class="field">
                        <div class="divider-row" style="margin-bottom:6px;">
                            <label class="field-label" for="cfg-domainsWorker" style="margin:0;">Worker Domains (TLS &amp; No-TLS)</label>
                            <div style="display:flex; gap:6px; flex-wrap:wrap;">
                                <button class="btn btn-sm" type="button" onclick="togglePoolFormat('cfg-domainsWorker', this)" title="Toggle comma vs one-per-line">Sep: ,</button>
                                <button class="btn btn-sm" type="button" onclick="togglePoolExpand('cfg-domainsWorker', this)">Expand</button>
                                <button class="btn btn-primary btn-sm" type="button" onclick="openPoolAddModal('cfg-domainsWorker', 'Add Worker Domains')">+ Add</button>
                            </div>
                        </div>
                        <textarea id="cfg-domainsWorker" class="mono pool-box" placeholder="my-worker.workers.dev, sub.mydomain.com"></textarea>
                    </div>
                    <div class="field">
                        <div class="divider-row" style="margin-bottom:6px;">
                            <label class="field-label" for="cfg-domainsPages" style="margin:0;">Pages Domains (TLS Only)</label>
                            <div style="display:flex; gap:6px; flex-wrap:wrap;">
                                <button class="btn btn-sm" type="button" onclick="togglePoolFormat('cfg-domainsPages', this)" title="Toggle comma vs one-per-line">Sep: ,</button>
                                <button class="btn btn-sm" type="button" onclick="togglePoolExpand('cfg-domainsPages', this)">Expand</button>
                                <button class="btn btn-primary btn-sm" type="button" onclick="openPoolAddModal('cfg-domainsPages', 'Add Pages Domains')">+ Add</button>
                            </div>
                        </div>
                        <textarea id="cfg-domainsPages" class="mono pool-box" placeholder="my-pages.pages.dev"></textarea>
                    </div>
                </div>
            </div>

            <div class="grid-2">
                <div class="card">
                    <div class="card-header"><h3 class="card-title">Global Ports</h3></div>
                    <div class="field">
                        <label class="field-label">TLS Ports</label>
                        <div id="tls-ports-grid" class="check-grid"></div>
                    </div>
                    <div class="field">
                        <label class="field-label">No-TLS Ports</label>
                        <div id="notls-ports-grid" class="check-grid"></div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header"><h3 class="card-title">Global ALPN &amp; Fingerprint Pools</h3></div>
                    <div class="field">
                        <label class="field-label" for="cfg-alpnList">ALPN Pool (semicolon ; separated)</label>
                        <input type="text" id="cfg-alpnList" class="mono" placeholder="http/1.1; h2; h3">
                    </div>
                    <div class="field">
                        <label class="field-label" for="cfg-fpList">Fingerprint Pool (comma , separated)</label>
                        <input type="text" id="cfg-fpList" class="mono" placeholder="chrome, firefox, safari, edge, ios, android, random">
                    </div>
                </div>
            </div>
        </section>

        <!-- Tab 4: F&F Presets -->
        <section id="tab-fnf" class="hidden">
            <div class="section-head">
                <div>
                    <h2>F&amp;F Presets (Patterniha / PattNG / Throne)</h2>
                    <p class="section-desc">Create and store reusable Cipher Suite (cs) and Final Mask (fm) configurations for Xray F&amp;F subscriptions.</p>
                </div>
            </div>
            <div class="grid-2 grid-start">
                <div class="card">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">Cipher Suites (cs)</h3>
                            <div class="card-subtitle">Colon-separated TLS cipher suites</div>
                        </div>
                        <div style="display:flex; gap:6px; flex-wrap:wrap;">
                            <button id="btn-expand-cs" class="btn btn-sm hidden" type="button" onclick="togglePresetExpand('cs')">Show All</button>
                            <button class="btn btn-primary btn-sm" type="button" onclick="openPresetModal('cs')">+ New CS</button>
                        </div>
                    </div>
                    <div id="cs-presets-list" class="list-stack"></div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">Final Masks (fm)</h3>
                            <div class="card-subtitle">JSON configuration for fragment / mask rules</div>
                        </div>
                        <div style="display:flex; gap:6px; flex-wrap:wrap;">
                            <button id="btn-expand-fm" class="btn btn-sm hidden" type="button" onclick="togglePresetExpand('fm')">Show All</button>
                            <button class="btn btn-primary btn-sm" type="button" onclick="openPresetModal('fm')">+ New FM</button>
                        </div>
                    </div>
                    <div id="fm-presets-list" class="list-stack"></div>
                </div>
            </div>
        </section>

        <!-- Tab 5: Settings -->
        <section id="tab-settings" class="hidden">
            <div class="section-head">
                <div>
                    <h2>General &amp; Security Settings</h2>
                    <p class="section-desc">Configure fallback masquerade website, admin panel path, password, and subscription cache.</p>
                </div>
            </div>
            <div class="grid-2">
                <div class="card">
                    <div class="card-header"><h3 class="card-title">Worker &amp; Security</h3></div>
                    <div class="field">
                        <label class="field-label" for="cfg-defaultWebsite">Fallback Website URL (Masquerade)</label>
                        <input type="text" id="cfg-defaultWebsite" placeholder="https://www.w3schools.com">
                    </div>
                    <div class="field">
                        <label class="field-label" for="cfg-adminPath">Admin Panel Path</label>
                        <div class="input-group">
                            <input type="text" id="cfg-adminPath" class="mono" placeholder="/panel">
                            <button class="btn btn-sm" type="button" onclick="copyText('https://' + location.host + document.getElementById('cfg-adminPath').value)">Copy URL</button>
                        </div>
                    </div>
                    <div class="field">
                        <label class="field-label" for="cfg-newPassword">New Admin Password (leave blank to keep current)</label>
                        <input type="password" id="cfg-newPassword" placeholder="Enter new password...">
                    </div>
                </div>

                <div class="card">
                    <div class="card-header"><h3 class="card-title">Cache &amp; Maintenance</h3></div>
                    <p class="card-subtitle" style="margin-bottom: 14px;">Upstream subscription links are cached in Cloudflare KV for 15 minutes (900s) to maximize speed. Clear cache if you updated your upstream links.</p>
                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                        <button id="clear-cache-btn" class="btn btn-soft" type="button">Clear Subscription Cache Now</button>
                        <button id="check-update-btn" class="btn" type="button" onclick="checkForUpdates(true)">Check for Updates</button>
                    </div>
                </div>
            </div>
        </section>
    </main>
</div>

<!-- Subscription Editor Modal -->
<div id="sub-modal" class="modal-backdrop hidden">
    <div class="modal-dialog wide">
        <div class="modal-header">
            <h3 id="sub-modal-title">Edit Subscription</h3>
            <button class="btn btn-sm btn-icon" type="button" onclick="closeModal('sub-modal')">&#10005;</button>
        </div>
        <div class="modal-body">
            <div class="modal-section">
                <div class="modal-section-title">1. Identity, Path &amp; Core</div>
                <div class="grid-2">
                    <div class="field">
                        <label class="field-label">Profile Name</label>
                        <input type="text" id="sm-name" placeholder="e.g. Xray F&amp;F Main">
                    </div>
                    <div class="field">
                        <label class="field-label">Endpoint Path</label>
                        <input type="text" id="sm-path" class="mono" placeholder="/fnf">
                    </div>
                    <div class="field">
                        <label class="field-label">Target Core</label>
                        <select id="sm-coreType">
                            <option value="singbox">Sing-box (JSON Outbounds)</option>
                            <option value="xray">Xray / v2rayNG / PattNG / Throne (URIs)</option>
                        </select>
                        <div id="sm-core-lock-hint" class="hint hidden" style="color: var(--primary);">Locked to Xray because F&amp;F mode is selected.</div>
                    </div>
                    <div class="field">
                        <label class="field-label">Output Format</label>
                        <select id="sm-outputFormat">
                            <option value="plain">Plain (JSON / Raw URI lines)</option>
                            <option value="base64">Base64 Encoded</option>
                        </select>
                    </div>
                </div>
                <div style="margin-top: 6px;">
                    <label class="switch"><input type="checkbox" id="sm-enabled"> <span>Subscription Enabled</span></label>
                </div>
            </div>

            <div class="modal-section">
                <div class="modal-section-title">2. Input Sources &amp; Generation Modes</div>
                <div style="display:flex; gap:18px; flex-wrap:wrap; margin-bottom:10px;">
                    <label class="switch"><input type="checkbox" id="sm-includeCustom"> <span>Include Custom Servers</span></label>
                    <label class="switch"><input type="checkbox" id="sm-includeSubLinks"> <span>Include External Sub Links</span></label>
                </div>
                <label class="field-label">Generation Modes</label>
                <div class="check-grid" id="sm-genModes" style="margin-bottom: 10px;">
                    <label class="check-pill"><input type="checkbox" value="ip_tls"> IPv4 TLS</label>
                    <label class="check-pill"><input type="checkbox" value="ip_notls"> IPv4 No-TLS</label>
                    <label class="check-pill"><input type="checkbox" value="ipv6_tls"> IPv6 TLS</label>
                    <label class="check-pill"><input type="checkbox" value="ipv6_notls"> IPv6 No-TLS</label>
                    <label class="check-pill"><input type="checkbox" value="domain_tls"> Domain TLS</label>
                    <label class="check-pill"><input type="checkbox" value="domain_notls"> Domain No-TLS</label>
                </div>
                <div class="field">
                    <label class="field-label">Profile Extra Servers (optional, one per line: IP:Port or [IPv6]:Port)</label>
                    <textarea id="sm-extraServers" class="mono" style="min-height: 64px;" rows="2" placeholder="127.0.0.1:40443"></textarea>
                </div>
            </div>

            <div class="modal-section">
                <div class="modal-section-title">3. Fragment &amp; F&amp;F Method</div>
                <div class="method-grid" id="sm-method-grid">
                    <label class="method-card"><input type="radio" name="sm-fragmentMode" value="none"><div><div class="method-title">None</div><div class="method-desc">Standard TLS without fragmentation</div></div></label>
                    <label class="method-card"><input type="radio" name="sm-fragmentMode" value="tls_fragment"><div><div class="method-title">TLS Fragment</div><div class="method-desc">Standard TLS ClientHello fragment</div></div></label>
                    <label class="method-card"><input type="radio" name="sm-fragmentMode" value="tls_record_fragment"><div><div class="method-title">TLS Record Fragment</div><div class="method-desc">Split TLS record layer packets</div></div></label>
                    <label class="method-card"><input type="radio" name="sm-fragmentMode" value="fnf"><div><div class="method-title">F&amp;F (Patterniha)</div><div class="method-desc">Xray-only Cipher Suite (cs) &amp; Final Mask (fm)</div></div></label>
                </div>

                <div id="sm-frag-delay-wrap" class="field hidden" style="margin-top: 10px;">
                    <label class="field-label">Fragment Fallback Delay</label>
                    <input type="text" id="sm-fragmentFallbackDelay" class="mono" placeholder="450ms">
                </div>

                <div id="sm-fnf-wrap" class="grid-2 hidden" style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--border);">
                    <div class="field">
                        <label class="field-label">Cipher Suite Preset (cs)</label>
                        <select id="sm-fnfCsId"></select>
                    </div>
                    <div class="field">
                        <label class="field-label">Final Mask Preset (fm)</label>
                        <select id="sm-fnfFmId"></select>
                    </div>
                </div>
            </div>

            <div class="modal-section">
                <div class="modal-section-title">4. ECH (Encrypted Client Hello) &amp; DNS</div>
                <div class="grid-2">
                    <div class="field">
                        <label class="field-label">Quick ECH Preset</label>
                        <select id="sm-echPreset">
                            <option value="">-- Select a preset or customize below --</option>
                            <option value="cf_udp">crypto.cloudflare.com + udp://1.1.1.1</option>
                            <option value="cf_doh">cloudflare-ech.com + https://1.1.1.1/dns-query</option>
                            <option value="cf_dot">crypto.cloudflare.com + tls://1.1.1.1</option>
                            <option value="cf_google_udp">cloudflare-ech.com + udp://8.8.8.8</option>
                            <option value="cf_h3">cloudflare-ech.com + h3://1.1.1.1/dns-query</option>
                            <option value="clear">Clear ECH (Disabled)</option>
                        </select>
                    </div>
                    <div id="sm-ech-sb-wrap" class="field">
                        <label class="field-label">Sing-box ECH / DNS Schema</label>
                        <select id="sm-echSingboxMode">
                            <option value="modern">Sing-box 1.12+ / 1.13+ / 1.14+ (Typed DNS + domain_resolver)</option>
                            <option value="legacy">Sing-box 1.10–1.11 Legacy (DNS address + detour)</option>
                            <option value="outbound_only">Outbound Only (No root dns block)</option>
                        </select>
                    </div>
                    <div class="field">
                        <label class="field-label">ECH Query Domain (or Static Base64/PEM)</label>
                        <input type="text" id="sm-echConfig" class="mono" placeholder="crypto.cloudflare.com">
                        <div class="hint">Also accepts shorthand like <span class="mono">crypto.cloudflare.com+udp://1.1.1.1</span></div>
                    </div>
                    <div class="field">
                        <label class="field-label">ECH DNS Server (udp://, tcp://, tls://, https://, h3://, quic://, local)</label>
                        <input type="text" id="sm-echDns" class="mono" placeholder="udp://1.1.1.1 or https://1.1.1.1/dns-query">
                        <div class="hint">Xray: <span class="mono">ech=domain+dns</span> · Sing-box: <span class="mono">dns.servers</span> + <span class="mono">tls.ech</span></div>
                    </div>
                </div>
            </div>

            <div class="modal-section">
                <div class="modal-section-title">5. TLS, Fingerprint, Headers &amp; Transport</div>
                <div class="grid-2">
                    <div class="field">
                        <label class="field-label">TLS Fingerprint (fp)</label>
                        <select id="sm-fpMode">
                            <option value="random_list">Random from Global FP List</option>
                            <option value="unsafe">unsafe (Recommended for F&amp;F)</option>
                            <option value="none">none (fp=none)</option>
                            <option value="omit">Omit fp parameter</option>
                            <option value="chrome">chrome</option>
                            <option value="firefox">firefox</option>
                            <option value="safari">safari</option>
                            <option value="edge">edge</option>
                            <option value="ios">ios</option>
                            <option value="android">android</option>
                            <option value="random">random</option>
                            <option value="custom">Custom value...</option>
                        </select>
                        <input type="text" id="sm-fpCustom" class="mono hidden" style="margin-top:5px;" placeholder="Enter custom fp">
                    </div>
                    <div class="field">
                        <label class="field-label">ALPN</label>
                        <select id="sm-alpnMode">
                            <option value="random_list">Random from Global ALPN List</option>
                            <option value="h3">h3</option>
                            <option value="h2">h2</option>
                            <option value="http/1.1">http/1.1</option>
                            <option value="none">Omit ALPN</option>
                            <option value="custom">Custom value...</option>
                        </select>
                        <input type="text" id="sm-alpnCustom" class="mono hidden" style="margin-top:5px;" placeholder="Enter custom alpn">
                    </div>
                    <div class="field">
                        <label class="field-label">Packet Encoding</label>
                        <input type="text" id="sm-packetEncoding" class="mono" placeholder="xudp, packet, or none">
                    </div>
                    <div class="field">
                        <label class="field-label">EarlyData Length</label>
                        <input type="text" id="sm-earlyDataLength" class="mono" placeholder="2560">
                    </div>
                    <div class="field" style="grid-column: 1 / -1;">
                        <label class="field-label">EarlyData Header Name</label>
                        <input type="text" id="sm-earlyDataName" class="mono" placeholder="Sec-WebSocket-Protocol">
                    </div>
                </div>

                <div style="display:flex; gap:16px; flex-wrap:wrap; margin: 10px 0 6px;">
                    <label class="switch"><input type="checkbox" id="sm-allowInsecure"> <span>Allow Insecure</span></label>
                    <label class="switch"><input type="checkbox" id="sm-randomizeSniPrefix"> <span>Randomize SNI Subdomain</span></label>
                    <label class="switch"><input type="checkbox" id="sm-randomizeHeaders"> <span>Randomize DPI Headers</span></label>
                </div>

                <div id="sm-custom-header-wrap" class="grid-2 hidden" style="margin-top: 8px;">
                    <div class="field">
                        <label class="field-label">Custom Header Key</label>
                        <input type="text" id="sm-headerKey" class="mono" placeholder="X-Real-IP">
                    </div>
                    <div class="field">
                        <label class="field-label">Custom Header Value</label>
                        <input type="text" id="sm-headerValue" class="mono" placeholder="1.1.1.1">
                    </div>
                </div>
            </div>

            <div class="modal-section">
                <div class="modal-section-title">6. Network &amp; Pools Override</div>
                <div class="field">
                    <div class="divider-row" style="margin-bottom:4px;">
                        <label class="field-label" style="margin:0;">IP / CIDR / Domain Pool</label>
                        <div style="display:flex; gap:6px;">
                            <button id="sm-expand-ip" class="btn btn-sm hidden" type="button" onclick="toggleSubPoolExpand('sm-customIpList', this)">Expand</button>
                            <button id="sm-copy-global-ip" class="btn btn-sm hidden" type="button" onclick="copyGlobalPoolToSub('ip')">Copy Global</button>
                        </div>
                    </div>
                    <select id="sm-ipPoolMode">
                        <option value="global">Use Global IP / CIDR / Domain Pool (Random)</option>
                        <option value="custom">Custom List for this Subscription</option>
                    </select>
                    <div id="sm-custom-ip-wrap" class="hidden" style="margin-top:6px;">
                        <textarea id="sm-customIpList" class="mono sub-pool-box" rows="4" placeholder="104.21.32.1, 172.66.210.0/24, www.speedtest.net"></textarea>
                        <div class="hint">Single or multiple IPv4, IPv6, CIDR, or domains (comma or newline separated).</div>
                    </div>
                </div>

                <div class="field">
                    <div class="divider-row" style="margin-bottom:4px;">
                        <label class="field-label" style="margin:0;">Your Cloudflare Domains</label>
                        <button id="sm-copy-global-domains" class="btn btn-sm hidden" type="button" onclick="copyGlobalPoolToSub('domains')">Copy Global</button>
                    </div>
                    <select id="sm-domainsMode">
                        <option value="global">Use Global Cloudflare Domains (Random)</option>
                        <option value="custom">Custom Domains for this Subscription</option>
                    </select>
                    <div id="sm-custom-domains-wrap" class="grid-2 hidden" style="margin-top:6px;">
                        <div class="field">
                            <div class="divider-row" style="margin-bottom:4px;">
                                <label class="field-label" style="margin:0;">Worker Domains (TLS &amp; No-TLS)</label>
                                <button id="sm-expand-worker" class="btn btn-sm" type="button" onclick="toggleSubPoolExpand('sm-customDomainsWorker', this)">Expand</button>
                            </div>
                            <textarea id="sm-customDomainsWorker" class="mono sub-pool-box" rows="4" placeholder="my-worker.workers.dev"></textarea>
                        </div>
                        <div class="field">
                            <div class="divider-row" style="margin-bottom:4px;">
                                <label class="field-label" style="margin:0;">Pages Domains (TLS Only)</label>
                                <button id="sm-expand-pages" class="btn btn-sm" type="button" onclick="toggleSubPoolExpand('sm-customDomainsPages', this)">Expand</button>
                            </div>
                            <textarea id="sm-customDomainsPages" class="mono sub-pool-box" rows="4" placeholder="my-pages.pages.dev"></textarea>
                        </div>
                    </div>
                </div>

                <div class="field">
                    <label class="field-label">Ports</label>
                    <select id="sm-portsMode">
                        <option value="global">Use Global Ports (Random)</option>
                        <option value="custom">Custom Ports for this Subscription</option>
                    </select>
                    <div id="sm-custom-ports-wrap" class="grid-2 hidden" style="margin-top:8px;">
                        <div class="field">
                            <label class="field-label">TLS Ports (1 or multiple)</label>
                            <div id="sm-customPortsTLS" class="check-grid"></div>
                        </div>
                        <div class="field">
                            <label class="field-label">No-TLS Ports (1 or multiple)</label>
                            <div id="sm-customPortsNoTLS" class="check-grid"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn" type="button" onclick="previewFromEditor()">Live Preview</button>
            <button class="btn" type="button" onclick="closeModal('sub-modal')">Cancel</button>
            <button class="btn btn-primary" type="button" onclick="saveSubModal()">Apply Subscription</button>
        </div>
    </div>
</div>

<!-- Pool Add Modal (IP / Worker / Pages) -->
<div id="pool-add-modal" class="modal-backdrop hidden">
    <div class="modal-dialog narrow">
        <div class="modal-header">
            <h3 id="pool-add-title">Add Entries</h3>
            <button class="btn btn-sm btn-icon" type="button" onclick="closeModal('pool-add-modal')">&#10005;</button>
        </div>
        <div class="modal-body">
            <div class="field">
                <label class="field-label">Enter one item per line or comma-separated:</label>
                <textarea id="pool-add-textarea" class="mono" style="min-height: 150px;" placeholder="104.21.32.1&#10;172.66.210.0/24&#10;www.speedtest.net"></textarea>
                <div class="hint">Duplicates already in the list are skipped automatically.</div>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn" type="button" onclick="closeModal('pool-add-modal')">Cancel</button>
            <button class="btn btn-primary" type="button" onclick="confirmPoolAdd()">Add Entries</button>
        </div>
    </div>
</div>

<!-- Custom Server Edit Modal -->
<div id="server-modal" class="modal-backdrop hidden">
    <div class="modal-dialog narrow">
        <div class="modal-header">
            <h3>Edit WS Server</h3>
            <button class="btn btn-sm btn-icon" type="button" onclick="closeModal('server-modal')">&#10005;</button>
        </div>
        <div class="modal-body">
            <div class="grid-2">
                <div class="field" style="grid-column: 1 / -1;">
                    <label class="field-label">Protocol</label>
                    <select id="srv-protocol"><option value="vless">VLESS</option><option value="vmess">VMess</option><option value="trojan">Trojan</option></select>
                </div>
                <div class="field" style="grid-column: 1 / -1;">
                    <label class="field-label">Remarks / Name</label>
                    <input type="text" id="srv-name" placeholder="My Server">
                </div>
                <div class="field"><label class="field-label">Address</label><input type="text" id="srv-address" class="mono"></div>
                <div class="field"><label class="field-label">Port</label><input type="text" id="srv-port" class="mono"></div>
                <div class="field" style="grid-column: 1 / -1;"><label class="field-label">UUID / Password</label><input type="text" id="srv-id" class="mono"></div>
                <div class="field"><label class="field-label">WS Path</label><input type="text" id="srv-path" class="mono"></div>
                <div class="field"><label class="field-label">WS Host</label><input type="text" id="srv-host" class="mono"></div>
                <div class="field" style="display:flex; align-items:center; padding-top:18px;">
                    <label class="switch"><input type="checkbox" id="srv-tls"> <span>TLS Enabled</span></label>
                </div>
                <div class="field"><label class="field-label">SNI</label><input type="text" id="srv-sni" class="mono"></div>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn" type="button" onclick="closeModal('server-modal')">Cancel</button>
            <button class="btn btn-primary" type="button" onclick="saveServerModal()">Save Server</button>
        </div>
    </div>
</div>

<!-- Bulk Modal -->
<div id="bulk-modal" class="modal-backdrop hidden">
    <div class="modal-dialog">
        <div class="modal-header">
            <h3 id="bulk-modal-title">Bulk Edit</h3>
            <button class="btn btn-sm btn-icon" type="button" onclick="closeModal('bulk-modal')">&#10005;</button>
        </div>
        <div class="modal-body">
            <label class="field-label" id="bulk-modal-hint">One entry per line.</label>
            <textarea id="bulk-textarea" class="mono" style="min-height: 320px;"></textarea>
        </div>
        <div class="modal-footer">
            <button class="btn" type="button" onclick="closeModal('bulk-modal')">Cancel</button>
            <button class="btn btn-primary" type="button" onclick="saveBulkModal()">Apply Lines</button>
        </div>
    </div>
</div>

<!-- F&F Preset Modal -->
<div id="preset-modal" class="modal-backdrop hidden">
    <div class="modal-dialog">
        <div class="modal-header">
            <h3 id="preset-modal-title">Edit Preset</h3>
            <button class="btn btn-sm btn-icon" type="button" onclick="closeModal('preset-modal')">&#10005;</button>
        </div>
        <div class="modal-body">
            <div class="field">
                <label class="field-label">Preset Name</label>
                <input type="text" id="pm-name" placeholder="e.g. Fragment v1">
            </div>
            <div class="field">
                <div class="divider-row" style="margin-bottom:6px;">
                    <label class="field-label" style="margin:0;">Value</label>
                    <div id="pm-json-tools" class="hidden" style="display:flex; gap:6px; align-items:center;">
                        <span id="pm-json-status" class="badge badge-neutral">JSON</span>
                        <button class="btn btn-sm" type="button" onclick="formatFmJson(true)">Format</button>
                        <button class="btn btn-sm" type="button" onclick="formatFmJson(false)">Minify</button>
                    </div>
                </div>
                <textarea id="pm-value" class="mono" style="min-height: 200px;"></textarea>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn" type="button" onclick="closeModal('preset-modal')">Cancel</button>
            <button class="btn btn-primary" type="button" onclick="savePresetModal()">Save Preset</button>
        </div>
    </div>
</div>

<!-- Live Preview Modal -->
<div id="preview-modal" class="modal-backdrop hidden">
    <div class="modal-dialog wide">
        <div class="modal-header">
            <div>
                <h3 id="pv-title">Subscription Output Preview</h3>
                <div id="pv-meta" class="card-subtitle">Loading...</div>
            </div>
            <button class="btn btn-sm btn-icon" type="button" onclick="closeModal('preview-modal')">&#10005;</button>
        </div>
        <div class="modal-body">
            <div class="field">
                <div class="divider-row" style="margin-bottom:6px;">
                    <label class="field-label" style="margin:0;">Raw Output (exact response served by endpoint)</label>
                    <button class="btn btn-sm btn-soft" type="button" onclick="copyText(document.getElementById('pv-output').value)">Copy Output</button>
                </div>
                <textarea id="pv-output" class="mono" style="min-height: 280px;" readonly></textarea>
            </div>
            <div id="pv-decoded-wrap" class="field hidden">
                <label class="field-label">Decoded Content (Base64 preview)</label>
                <textarea id="pv-decoded" class="mono" style="min-height: 180px;" readonly></textarea>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-primary" type="button" onclick="closeModal('preview-modal')">Close</button>
        </div>
    </div>
</div>

<!-- Update Details Modal -->
<div id="update-modal" class="modal-backdrop hidden">
    <div class="modal-dialog">
        <div class="modal-header">
            <div>
                <h3 id="upd-title">Update Available</h3>
                <div id="upd-meta" class="card-subtitle"></div>
            </div>
            <button class="btn btn-sm btn-icon" type="button" onclick="closeModal('update-modal')">&#10005;</button>
        </div>
        <div class="modal-body">
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:12px;">
                <span class="badge badge-neutral mono" id="upd-cur-ver"></span>
                <span style="color: var(--text-muted); font-size:12px;">&#8594;</span>
                <span class="badge badge-success mono" id="upd-new-ver"></span>
                <span id="upd-date" class="hint" style="margin:0;"></span>
            </div>
            <div class="field">
                <label class="field-label">Release Notes</label>
                <div id="upd-notes" class="release-notes-box"></div>
            </div>
            <div id="upd-assets-wrap" class="field hidden">
                <label class="field-label">Release Files</label>
                <div id="upd-assets" style="display:flex; gap:8px; flex-wrap:wrap;"></div>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn" type="button" onclick="checkForUpdates(true)">Re-check</button>
            <button class="btn" type="button" onclick="closeModal('update-modal')">Close</button>
            <a id="upd-github-link" class="btn btn-primary" target="_blank" rel="noopener noreferrer">Open Release on GitHub</a>
        </div>
    </div>
</div>

<!-- Confirm Delete Modal -->
<div id="confirm-modal" class="modal-backdrop hidden">
    <div class="modal-dialog confirm-dialog">
        <div class="modal-header">
            <div style="display:flex; align-items:center; gap:10px; min-width:0;">
                <div class="confirm-icon">
                    <svg width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </div>
                <h3 id="cfm-title">Confirm Delete</h3>
            </div>
            <button class="btn btn-sm btn-icon" type="button" onclick="resolveConfirm(false)">&#10005;</button>
        </div>
        <div class="modal-body" style="padding: 16px 18px;">
            <p id="cfm-message" style="margin:0 0 10px; font-size:13.5px; color:var(--text);"></p>
            <div id="cfm-target" class="confirm-target mono hidden"></div>
        </div>
        <div class="modal-footer">
            <button id="cfm-cancel-btn" class="btn" type="button" onclick="resolveConfirm(false)">Cancel</button>
            <button id="cfm-ok-btn" class="btn btn-danger" style="background: var(--danger); color: #fff;" type="button" onclick="resolveConfirm(true)">Delete</button>
        </div>
    </div>
</div>

<script>
const ADMIN_PATH = ${safeAdminPath};
const APP_VERSION = ${safeVersion};
const GITHUB_REPO_URL = ${safeGithubUrl};
const ALL_TLS_PORTS = ${tlsPortsJson};
const ALL_NOTLS_PORTS = ${noTlsPortsJson};
const SOURCE_PREVIEW_LIMIT = 6;
const PRESET_PREVIEW_LIMIT = 4;

document.getElementById('github-link-btn').href = GITHUB_REPO_URL;

const Base64 = {
    encode: (s) => btoa(encodeURIComponent(s).replace(/%([0-9A-F]{2})/g, (_, p) => String.fromCharCode('0x' + p))),
    decode: (s) => {
        let n = String(s).trim().replace(/-/g, '+').replace(/_/g, '/');
        while (n.length % 4) n += '=';
        return decodeURIComponent(atob(n).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    }
};

const cleanStr = (v) => (v === null || v === undefined) ? '' : (['null', 'undefined'].includes(String(v).trim().toLowerCase()) ? '' : String(v).trim());
const formatHostForUri = (a) => !a ? '' : (a.includes(':') ? '[' + a.replace(/[\\[\\]]/g, '') + ']' : a);
const splitPoolEntries = (val) => (val || '').split(/[,\\r\\n]+/).map(x => x.trim()).filter(Boolean);

function classifyPoolItem(item) {
    const s = (item || '').trim();
    if (/^(?:[0-9]{1,3}\\.){3}[0-9]{1,3}(?:\\/[0-9]{1,2})?$/.test(s)) return 'ipv4';
    const clean = s.replace(/[\\[\\]]/g, '').split('/')[0];
    if (clean.includes(':') && /^[0-9a-fA-F:]+$/.test(clean)) return 'ipv6';
    return 'domain';
}

let state = null;
let savedSnapshot = null;
let dirty = false;
let editingSubIdx = -1;
let editingServerIdx = -1;
let bulkMode = '';
let presetMode = '';
let editingPresetIdx = -1;
let poolAddTargetId = '';
let sourceExpanded = { custom: false, sublink: false };
let presetExpanded = { cs: false, fm: false };
let poolDisplayMode = { 'cfg-ipList': 'comma', 'cfg-domainsWorker': 'comma', 'cfg-domainsPages': 'comma' };
let ipFilter = 'all';
let latestUpdateInfo = null;

function markDirty(flag = true) {
    dirty = flag;
    document.getElementById('unsaved-pill').classList.toggle('hidden', !dirty);
}

function toast(msg, type = 'success') {
    const box = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = 'toast toast-' + type;
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(() => { el.remove(); }, 3400);
}

function copyText(txt) {
    navigator.clipboard.writeText(txt).then(() => toast('Copied to clipboard!')).catch(() => toast('Copy failed', 'error'));
}

function applyTheme(dark) {
    document.documentElement.classList.toggle('dark', dark);
    document.getElementById('theme-btn').textContent = dark ? 'Light' : 'Dark';
    localStorage.setItem('darkMode', dark ? 'true' : 'false');
}
applyTheme(localStorage.getItem('darkMode') === 'true');
document.getElementById('theme-btn').onclick = () => applyTheme(!document.documentElement.classList.contains('dark'));

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const target = btn.dataset.tab;
        ['subscriptions', 'sources', 'network', 'fnf', 'settings'].forEach(t => {
            document.getElementById('tab-' + t).classList.toggle('hidden', t !== target);
        });
        if (target === 'network') {
            ['cfg-ipList', 'cfg-domainsWorker', 'cfg-domainsPages'].forEach(refreshExpandedHeight);
        }
    });
});

function syncBodyScrollLock() {
    const hasOpen = !!document.querySelector('.modal-backdrop:not(.hidden)');
    document.documentElement.classList.toggle('modal-open', hasOpen);
    document.body.classList.toggle('modal-open', hasOpen);
}

function openModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('hidden');
    const body = el.querySelector('.modal-body');
    if (body) body.scrollTop = 0;
    syncBodyScrollLock();
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
    syncBodyScrollLock();
}

let confirmResolver = null;

function confirmDelete(title, message, targetPreview = '', confirmLabel = 'Delete') {
    return new Promise(resolve => {
        confirmResolver = resolve;
        document.getElementById('cfm-title').textContent = title || 'Confirm Delete';
        document.getElementById('cfm-message').textContent = message || 'Are you sure you want to delete this item?';
        document.getElementById('cfm-ok-btn').textContent = confirmLabel;
        const tgt = document.getElementById('cfm-target');
        if (targetPreview) {
            tgt.textContent = targetPreview;
            tgt.classList.remove('hidden');
        } else {
            tgt.textContent = '';
            tgt.classList.add('hidden');
        }
        openModal('confirm-modal');
        setTimeout(() => document.getElementById('cfm-cancel-btn').focus(), 30);
    });
}

window.resolveConfirm = (result) => {
    closeModal('confirm-modal');
    if (confirmResolver) {
        const fn = confirmResolver;
        confirmResolver = null;
        fn(result);
    }
};

document.getElementById('confirm-modal').addEventListener('click', (e) => {
    if (e.target.id === 'confirm-modal') resolveConfirm(false);
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !document.getElementById('confirm-modal').classList.contains('hidden')) {
        resolveConfirm(false);
    }
});

function refreshExpandedHeight(id) {
    const tx = document.getElementById(id);
    if (!tx) return;
    if (tx.classList.contains('expanded')) {
        tx.style.height = 'auto';
        tx.style.height = Math.max(108, tx.scrollHeight + 4) + 'px';
    } else {
        tx.style.height = '';
    }
}

window.togglePoolExpand = (id, btn) => {
    const tx = document.getElementById(id);
    const expanded = tx.classList.toggle('expanded');
    btn.textContent = expanded ? 'Collapse' : 'Expand';
    refreshExpandedHeight(id);
};

window.togglePoolFormat = (id, btn) => {
    if (id === 'cfg-ipList') commitIpPoolTextareaToState();
    const nextMode = poolDisplayMode[id] === 'comma' ? 'lines' : 'comma';
    poolDisplayMode[id] = nextMode;
    btn.textContent = nextMode === 'comma' ? 'Sep: ,' : 'Sep: ↵';

    if (id === 'cfg-ipList') {
        renderIpPoolTextarea();
    } else {
        const tx = document.getElementById(id);
        const items = splitPoolEntries(tx.value);
        tx.value = items.join(nextMode === 'lines' ? '\\n' : ', ');
        refreshExpandedHeight(id);
    }
};

function renderIpPoolTextarea() {
    const allItems = state?.ipList || [];
    const visible = ipFilter === 'all' ? allItems : allItems.filter(x => classifyPoolItem(x) === ipFilter);
    const sep = poolDisplayMode['cfg-ipList'] === 'lines' ? '\\n' : ', ';
    document.getElementById('cfg-ipList').value = visible.join(sep);
    refreshExpandedHeight('cfg-ipList');
    updateIpStats();
}

function commitIpPoolTextareaToState() {
    if (!state) return;
    const parsed = splitPoolEntries(document.getElementById('cfg-ipList').value);
    if (ipFilter === 'all') {
        state.ipList = parsed;
    } else {
        const kept = (state.ipList || []).filter(x => classifyPoolItem(x) !== ipFilter);
        state.ipList = kept.concat(parsed);
    }
    updateIpStats();
}

window.setIpFilter = (filter) => {
    commitIpPoolTextareaToState();
    ipFilter = filter;
    document.querySelectorAll('#ip-filter-bar .filter-pill').forEach(p => {
        p.classList.toggle('active', p.dataset.filter === filter);
    });
    renderIpPoolTextarea();
};

function updateIpStats() {
    const items = state?.ipList || splitPoolEntries(document.getElementById('cfg-ipList').value);
    let v4 = 0, v6 = 0, dom = 0;
    items.forEach(i => {
        const t = classifyPoolItem(i);
        if (t === 'ipv4') v4++;
        else if (t === 'ipv6') v6++;
        else dom++;
    });
    const shownCount = ipFilter === 'all' ? items.length : (ipFilter === 'ipv4' ? v4 : (ipFilter === 'ipv6' ? v6 : dom));
    const suffix = ipFilter !== 'all' ? ' (showing ' + shownCount + ')' : '';
    document.getElementById('ip-stats').textContent = v4 + ' IPv4, ' + v6 + ' IPv6, ' + dom + ' Domains' + suffix;

    const counts = { all: items.length, ipv4: v4, ipv6: v6, domain: dom };
    const labels = { all: 'All', ipv4: 'IPv4', ipv6: 'IPv6', domain: 'Domains' };
    document.querySelectorAll('#ip-filter-bar .filter-pill').forEach(p => {
        const f = p.dataset.filter;
        p.textContent = labels[f] + ' (' + counts[f] + ')';
    });
}

window.openPoolAddModal = (targetId, title) => {
    poolAddTargetId = targetId;
    document.getElementById('pool-add-title').textContent = title;
    const area = document.getElementById('pool-add-textarea');
    area.value = '';
    openModal('pool-add-modal');
    setTimeout(() => area.focus(), 40);
};

window.confirmPoolAdd = () => {
    const area = document.getElementById('pool-add-textarea');
    const newEntries = splitPoolEntries(area.value);
    if (!newEntries.length) return toast('Enter at least one entry', 'error');

    if (poolAddTargetId === 'cfg-ipList') {
        commitIpPoolTextareaToState();
        const existing = state.ipList || [];
        const seen = new Set(existing.map(x => x.toLowerCase()));
        let added = 0;
        let mismatchFilter = false;
        newEntries.forEach(item => {
            if (!seen.has(item.toLowerCase())) {
                existing.push(item);
                seen.add(item.toLowerCase());
                added++;
                if (ipFilter !== 'all' && classifyPoolItem(item) !== ipFilter) mismatchFilter = true;
            }
        });
        state.ipList = existing;
        if (mismatchFilter) {
            ipFilter = 'all';
            document.querySelectorAll('#ip-filter-bar .filter-pill').forEach(p => {
                p.classList.toggle('active', p.dataset.filter === 'all');
            });
        }
        renderIpPoolTextarea();
        markDirty(true);
        closeModal('pool-add-modal');
        toast('Added ' + added + ' new entry(s)');
        return;
    }

    const target = document.getElementById(poolAddTargetId);
    const existing = splitPoolEntries(target.value);
    const seen = new Set(existing.map(x => x.toLowerCase()));
    let added = 0;
    newEntries.forEach(item => {
        if (!seen.has(item.toLowerCase())) {
            existing.push(item);
            seen.add(item.toLowerCase());
            added++;
        }
    });

    const sep = poolDisplayMode[poolAddTargetId] === 'lines' ? '\\n' : ', ';
    target.value = existing.join(sep);
    refreshExpandedHeight(poolAddTargetId);
    markDirty(true);
    closeModal('pool-add-modal');
    toast('Added ' + added + ' new entry(s)');
};

function parseServerLink(link) {
    link = link.trim();
    if (link.startsWith('vmess://')) {
        try {
            const obj = JSON.parse(Base64.decode(link.replace('vmess://', '').trim()));
            return {
                protocol: 'vmess', name: cleanStr(obj.ps), address: cleanStr(obj.add), port: cleanStr(obj.port),
                id: cleanStr(obj.id), path: cleanStr(obj.path), host: cleanStr(obj.host),
                tls: ['tls', true, '1'].includes(obj.tls), sni: cleanStr(obj.sni), net: cleanStr(obj.net)
            };
        } catch { return null; }
    }
    if (link.startsWith('vless://') || link.startsWith('trojan://')) {
        const proto = link.startsWith('trojan://') ? 'trojan' : 'vless';
        const raw = link.replace(proto + '://', '');
        const [mainPart, afterQ] = raw.split('?');
        const [queryPart, hashPart] = (afterQ || '').split('#');
        const atIdx = mainPart.indexOf('@');
        const cred = atIdx !== -1 ? mainPart.substring(0, atIdx) : '';
        const hp = atIdx !== -1 ? mainPart.substring(atIdx + 1) : mainPart;
        const lastC = hp.lastIndexOf(':');
        const isB = hp.startsWith('[');
        const closeB = hp.indexOf(']');
        const addr = isB ? hp.substring(1, closeB) : (lastC !== -1 ? hp.substring(0, lastC) : hp);
        const port = isB ? hp.substring(closeB + 1).replace(/^:/, '') : (lastC !== -1 ? hp.substring(lastC + 1) : '');
        const res = { protocol: proto, name: hashPart ? decodeURIComponent(hashPart) : '', id: decodeURIComponent(cred), address: cleanStr(addr), port: cleanStr(port), type: '' };
        if (queryPart) {
            new URLSearchParams(queryPart).forEach((v, k) => {
                if (['path', 'host', 'sni', 'type'].includes(k)) res[k] = decodeURIComponent(v);
                if (k === 'security' || k === 'tls') res.tls = (v === 'tls' || v === '1');
            });
        }
        return res;
    }
    return null;
}

function composeServerLink(o) {
    if (o.protocol === 'vmess') {
        return 'vmess://' + Base64.encode(JSON.stringify({
            v: "2", ps: o.name, add: o.address, port: parseInt(o.port, 10) || 443,
            id: o.id, aid: "0", scy: "auto", net: "ws", type: "none",
            host: o.host, path: o.path, tls: o.tls ? "tls" : "", ...(o.sni ? { sni: o.sni } : {})
        }));
    }
    const p = ['type=ws'];
    if (o.path) p.push('path=' + encodeURIComponent(o.path));
    if (o.host) p.push('host=' + encodeURIComponent(o.host));
    if (o.tls) { p.push('security=tls'); if (o.sni) p.push('sni=' + encodeURIComponent(o.sni)); }
    return o.protocol + '://' + encodeURIComponent(o.id) + '@' + formatHostForUri(o.address) + ':' + o.port + '?' + p.join('&') + (o.name ? '#' + encodeURIComponent(o.name) : '');
}

function isWebSocketLink(l) {
    const p = parseServerLink(l);
    if (!p) return false;
    return p.protocol === 'vmess' ? p.net === 'ws' : p.type === 'ws';
}

function updateCounts() {
    if (!state) return;
    document.getElementById('cnt-subs').textContent = (state.subscriptions || []).length;
    document.getElementById('cnt-sources').textContent = (state.customServers || []).length + (state.defaultSublink || []).length;
    document.getElementById('cnt-fnf').textContent = (state.csPresets || []).length + (state.fmPresets || []).length;
}

document.getElementById('sub-search-input').addEventListener('input', () => renderSubscriptions());

function renderSubscriptions() {
    const grid = document.getElementById('subs-grid');
    const subs = state.subscriptions || [];
    if (!subs.length) {
        grid.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;">No subscription profiles yet. Click <strong>+ Create Subscription</strong> to add your first endpoint.</div>';
        return;
    }

    const query = (document.getElementById('sub-search-input')?.value || '').trim().toLowerCase();
    const matched = subs.map((sub, idx) => ({ sub, idx })).filter(({ sub }) => {
        if (!query) return true;
        const hay = [sub.name, sub.path, sub.coreType, sub.outputFormat, sub.fragmentMode].join(' ').toLowerCase();
        return hay.includes(query);
    });

    if (!matched.length) {
        grid.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;">No subscriptions match your search. <button type="button" class="btn btn-sm btn-soft" style="margin-left:8px;" onclick="clearSubSearch()">Clear</button></div>';
        return;
    }

    const modeLabels = { ip_tls: 'IPv4 TLS', ip_notls: 'IPv4 No-TLS', ipv6_tls: 'IPv6 TLS', ipv6_notls: 'IPv6 No-TLS', domain_tls: 'Dom TLS', domain_notls: 'Dom No-TLS' };
    const fragLabels = { none: 'No Fragment', tls_fragment: 'TLS Fragment', tls_record_fragment: 'Record Fragment', fnf: 'F&F Patterniha' };

    grid.innerHTML = '';
    matched.forEach(({ sub, idx }) => {
        const card = document.createElement('div');
        card.className = 'sub-card' + (sub.enabled ? '' : ' disabled');
        const fullUrl = 'https://' + location.host + sub.path;
        const coreBadge = sub.coreType === 'xray'
            ? '<span class="badge badge-info">Xray</span>'
            : '<span class="badge badge-primary">Sing-box</span>';
        const fmtBadge = sub.outputFormat === 'base64'
            ? '<span class="badge badge-neutral">Base64</span>'
            : '<span class="badge badge-neutral">Plain</span>';
        const methodBadge = sub.fragmentMode === 'fnf'
            ? '<span class="badge badge-warning">F&amp;F (cs + fm)</span>'
            : '<span class="badge badge-neutral">' + (fragLabels[sub.fragmentMode] || 'None') + '</span>';

        const fpBadge = sub.fpMode && sub.fpMode !== 'random_list'
            ? '<span class="badge badge-neutral">fp: ' + (sub.fpMode === 'custom' ? sub.fpCustom : sub.fpMode) + '</span>'
            : '';

        const echBadge = (sub.echConfig || sub.echDns)
            ? '<span class="badge badge-primary">ECH' + (sub.echDns ? '+DNS' : '') + '</span>'
            : '';

        const netBadges = [
            sub.ipPoolMode === 'custom' ? '<span class="badge badge-info">Custom IPs</span>' : '',
            sub.domainsMode === 'custom' ? '<span class="badge badge-info">Custom Domains</span>' : '',
            sub.portsMode === 'custom' ? '<span class="badge badge-info">Custom Ports</span>' : ''
        ].join('');

        const modePills = (sub.genModes || []).map(m => '<span class="badge badge-success">' + (modeLabels[m] || m) + '</span>').join('');
        const srcText = [sub.includeCustomServers ? 'Custom' : '', sub.includeSubLinks ? 'SubLinks' : ''].filter(Boolean).join(' + ') || 'No Sources';

        card.innerHTML =
            '<div class="sub-card-top">' +
                '<div>' +
                    '<h3 class="sub-name"></h3>' +
                    '<div class="card-subtitle">Sources: ' + srcText + '</div>' +
                '</div>' +
                '<label class="switch"><input type="checkbox" ' + (sub.enabled ? 'checked' : '') + ' onchange="toggleSubEnabled(' + idx + ', this.checked)"></label>' +
            '</div>' +
            '<div class="sub-url-box">' +
                '<span class="sub-url-text mono"></span>' +
                '<button class="btn btn-sm btn-soft" type="button" onclick="copyText(\\'' + fullUrl.replace(/'/g, "\\\\'") + '\\')">Copy URL</button>' +
            '</div>' +
            '<div class="sub-pills">' + coreBadge + fmtBadge + methodBadge + echBadge + netBadges + fpBadge + modePills + '</div>' +
            '<div class="sub-actions">' +
                '<div class="sub-actions-left">' +
                    '<button class="btn btn-sm btn-primary" type="button" onclick="openSubModal(' + idx + ')">Edit</button>' +
                    '<button class="btn btn-sm" type="button" onclick="previewSubscription(' + idx + ')">Preview</button>' +
                    '<button class="btn btn-sm" type="button" onclick="duplicateSub(' + idx + ')">Duplicate</button>' +
                '</div>' +
                '<div class="sub-actions-right">' +
                    '<button class="btn btn-sm btn-danger" type="button" onclick="deleteSub(' + idx + ')">Delete</button>' +
                '</div>' +
            '</div>';

        card.querySelector('.sub-name').textContent = sub.name;
        card.querySelector('.sub-url-text').textContent = sub.path;
        grid.appendChild(card);
    });
}

window.clearSubSearch = () => {
    document.getElementById('sub-search-input').value = '';
    renderSubscriptions();
};

window.toggleSubEnabled = (idx, val) => {
    state.subscriptions[idx].enabled = val;
    markDirty(true);
    renderSubscriptions();
};

window.duplicateSub = (idx) => {
    const copy = JSON.parse(JSON.stringify(state.subscriptions[idx]));
    copy.id = 'sub_' + Math.random().toString(36).slice(2, 9);
    copy.name = copy.name + ' (Copy)';
    copy.path = copy.path + '-copy';
    state.subscriptions.push(copy);
    markDirty(true);
    updateCounts();
    renderSubscriptions();
};

window.deleteSub = async (idx) => {
    const sub = state.subscriptions[idx];
    if (!sub) return;
    const ok = await confirmDelete('Delete Subscription', 'This subscription profile will be removed from your configuration.', sub.name + ' (' + sub.path + ')');
    if (!ok) return;
    state.subscriptions.splice(idx, 1);
    markDirty(true);
    updateCounts();
    renderSubscriptions();
};

window.toggleSourceExpand = (kind) => {
    sourceExpanded[kind] = !sourceExpanded[kind];
    renderSources();
};

function renderSources() {
    renderSourceList('custom-servers-list', state.customServers || [], 'custom');
    renderSourceList('sub-links-list', state.defaultSublink || [], 'sublink');
}

function renderSourceList(containerId, items, kind) {
    const el = document.getElementById(containerId);
    const expBtn = document.getElementById(kind === 'custom' ? 'btn-expand-custom' : 'btn-expand-sublink');

    if (items.length > SOURCE_PREVIEW_LIMIT) {
        expBtn.classList.remove('hidden');
        expBtn.textContent = sourceExpanded[kind] ? 'Collapse' : 'Show All (' + items.length + ')';
    } else {
        expBtn.classList.add('hidden');
    }

    if (!items.length) {
        el.innerHTML = '<div class="empty-state">No entries yet. Click <strong>+ Add</strong> or <strong>Bulk</strong>.</div>';
        return;
    }

    const isExpanded = sourceExpanded[kind] || items.length <= SOURCE_PREVIEW_LIMIT;
    const visibleItems = isExpanded ? items : items.slice(0, SOURCE_PREVIEW_LIMIT);

    el.innerHTML = '';
    visibleItems.forEach((val, idx) => {
        const row = document.createElement('div');
        row.className = 'item-row';
        let meta = '';
        if (kind === 'custom' && val) {
            const p = parseServerLink(val);
            if (p) meta = '<div class="item-meta mono">' + p.protocol.toUpperCase() + (p.name ? ' · ' + p.name : '') + (p.host ? ' · Host: ' + p.host : ' · ' + p.address) + '</div>';
        }
        const editBtn = kind === 'custom'
            ? '<button class="btn btn-sm btn-soft" type="button" onclick="openServerModal(' + idx + ')">Edit</button>'
            : '';

        row.innerHTML =
            '<span class="item-num">' + (idx + 1) + '</span>' +
            '<div class="item-body">' + meta + '<input type="text" class="mono" placeholder="Enter URL / Config link..."></div>' +
            '<div class="item-actions">' +
                editBtn +
                '<button class="btn btn-sm btn-danger" type="button" onclick="deleteSourceItem(\\'' + kind + '\\', ' + idx + ')">&#10005;</button>' +
            '</div>';

        const inp = row.querySelector('input');
        inp.value = val;
        inp.addEventListener('input', () => {
            if (kind === 'custom') state.customServers[idx] = inp.value.trim();
            else state.defaultSublink[idx] = inp.value.trim();
            markDirty(true);
        });
        el.appendChild(row);
    });

    if (!isExpanded && items.length > SOURCE_PREVIEW_LIMIT) {
        const footer = document.createElement('div');
        footer.className = 'list-expand-footer';
        footer.innerHTML = '<button type="button" class="btn btn-sm btn-soft" onclick="toggleSourceExpand(\\'' + kind + '\\')">Show ' + (items.length - SOURCE_PREVIEW_LIMIT) + ' more item(s)...</button>';
        el.appendChild(footer);
    }
}

window.addSourceItem = (kind) => {
    const arr = kind === 'custom' ? state.customServers : state.defaultSublink;
    arr.push('');
    if (arr.length > SOURCE_PREVIEW_LIMIT) sourceExpanded[kind] = true;
    markDirty(true);
    updateCounts();
    renderSources();
    const containerId = kind === 'custom' ? 'custom-servers-list' : 'sub-links-list';
    const inputs = document.querySelectorAll('#' + containerId + ' input');
    if (inputs.length) {
        const last = inputs[inputs.length - 1];
        last.focus();
        last.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
};

window.deleteSourceItem = async (kind, idx) => {
    const arr = kind === 'custom' ? state.customServers : state.defaultSublink;
    const val = (arr[idx] || '').trim();
    if (val) {
        const label = kind === 'custom' ? 'Delete Custom Server' : 'Delete Subscription Link';
        let preview = val;
        if (kind === 'custom') {
            const p = parseServerLink(val);
            if (p) preview = (p.protocol ? p.protocol.toUpperCase() + ' · ' : '') + (p.name || p.host || p.address || val);
        }
        const ok = await confirmDelete(label, 'Remove this entry from Input Sources?', preview);
        if (!ok) return;
    }
    arr.splice(idx, 1);
    markDirty(true);
    updateCounts();
    renderSources();
};

window.openBulkModal = (kind) => {
    bulkMode = kind;
    document.getElementById('bulk-modal-title').textContent = kind === 'custom' ? 'Bulk Edit Custom Servers (WS)' : 'Bulk Edit External Subscription Links';
    document.getElementById('bulk-modal-hint').textContent = kind === 'custom'
        ? 'One link per line. Non-WebSocket configs will be filtered out automatically.'
        : 'One subscription URL per line.';
    const arr = kind === 'custom' ? (state.customServers || []) : (state.defaultSublink || []);
    document.getElementById('bulk-textarea').value = arr.join('\\n');
    openModal('bulk-modal');
};

window.saveBulkModal = () => {
    let lines = document.getElementById('bulk-textarea').value.split(/\\r?\\n/).map(l => l.trim()).filter(Boolean);
    if (bulkMode === 'custom') {
        const before = lines.length;
        lines = lines.filter(isWebSocketLink);
        if (lines.length < before) toast('Filtered out ' + (before - lines.length) + ' non-WS link(s)', 'info');
        state.customServers = lines;
    } else {
        state.defaultSublink = lines;
    }
    markDirty(true);
    updateCounts();
    renderSources();
    closeModal('bulk-modal');
};

window.openServerModal = (idx) => {
    const raw = (state.customServers[idx] || '').trim();
    if (!raw) return toast('Paste a VMess/VLESS/Trojan WS link first, or use Add', 'error');
    const p = parseServerLink(raw);
    if (!p) return toast('Invalid link format', 'error');
    editingServerIdx = idx;
    document.getElementById('srv-protocol').value = p.protocol || 'vless';
    document.getElementById('srv-name').value = p.name || '';
    document.getElementById('srv-address').value = p.address || '';
    document.getElementById('srv-port').value = p.port || '';
    document.getElementById('srv-id').value = p.id || '';
    document.getElementById('srv-path').value = p.path || '';
    document.getElementById('srv-host').value = p.host || '';
    document.getElementById('srv-sni').value = p.sni || '';
    document.getElementById('srv-tls').checked = !!p.tls;
    openModal('server-modal');
};

window.saveServerModal = () => {
    const o = {
        protocol: document.getElementById('srv-protocol').value,
        name: document.getElementById('srv-name').value.trim(),
        address: document.getElementById('srv-address').value.trim(),
        port: document.getElementById('srv-port').value.trim(),
        id: document.getElementById('srv-id').value.trim(),
        path: document.getElementById('srv-path').value.trim(),
        host: document.getElementById('srv-host').value.trim(),
        sni: document.getElementById('srv-sni').value.trim(),
        tls: document.getElementById('srv-tls').checked
    };
    if (!o.address || !o.port || !o.id) return toast('Address, Port, and UUID/Password are required', 'error');
    state.customServers[editingServerIdx] = composeServerLink(o);
    markDirty(true);
    renderSources();
    closeModal('server-modal');
};

window.togglePresetExpand = (kind) => {
    presetExpanded[kind] = !presetExpanded[kind];
    renderPresets();
};

function renderPresets() {
    renderPresetGroup('cs-presets-list', state.csPresets || [], 'cs');
    renderPresetGroup('fm-presets-list', state.fmPresets || [], 'fm');
}

function renderPresetGroup(containerId, list, kind) {
    const el = document.getElementById(containerId);
    const expBtn = document.getElementById(kind === 'cs' ? 'btn-expand-cs' : 'btn-expand-fm');

    if (list.length > PRESET_PREVIEW_LIMIT) {
        expBtn.classList.remove('hidden');
        expBtn.textContent = presetExpanded[kind] ? 'Collapse' : 'Show All (' + list.length + ')';
    } else {
        expBtn.classList.add('hidden');
    }

    if (!list.length) {
        el.innerHTML = '<div class="empty-state">No presets saved. Click <strong>+ New</strong> to create one.</div>';
        return;
    }

    const isExpanded = presetExpanded[kind] || list.length <= PRESET_PREVIEW_LIMIT;
    const visibleList = isExpanded ? list : list.slice(0, PRESET_PREVIEW_LIMIT);

    el.innerHTML = '';
    visibleList.forEach((p, idx) => {
        const card = document.createElement('div');
        card.className = 'preset-item';
        let validBadge = '';
        if (kind === 'fm') {
            try { JSON.parse(p.value); validBadge = '<span class="badge badge-success">Valid JSON</span>'; }
            catch { validBadge = '<span class="badge badge-danger">Invalid JSON</span>'; }
        }
        card.innerHTML =
            '<div class="divider-row">' +
                '<div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; min-width:0;">' +
                    '<strong class="preset-name"></strong>' + validBadge +
                '</div>' +
                '<div style="display:flex; gap:6px; flex-shrink:0;">' +
                    '<button class="btn btn-sm" type="button" onclick="copyText(state.' + (kind === 'cs' ? 'csPresets' : 'fmPresets') + '[' + idx + '].value)">Copy</button>' +
                    '<button class="btn btn-sm btn-primary" type="button" onclick="openPresetModal(\\'' + kind + '\\', ' + idx + ')">Edit</button>' +
                    '<button class="btn btn-sm btn-danger" type="button" onclick="deletePreset(\\'' + kind + '\\', ' + idx + ')">&#10005;</button>' +
                '</div>' +
            '</div>' +
            '<div class="preset-code mono"></div>';
        card.querySelector('.preset-name').textContent = p.name;
        card.querySelector('.preset-code').textContent = p.value;
        el.appendChild(card);
    });

    if (!isExpanded && list.length > PRESET_PREVIEW_LIMIT) {
        const footer = document.createElement('div');
        footer.className = 'list-expand-footer';
        footer.innerHTML = '<button type="button" class="btn btn-sm btn-soft" onclick="togglePresetExpand(\\'' + kind + '\\')">Show ' + (list.length - PRESET_PREVIEW_LIMIT) + ' more preset(s)...</button>';
        el.appendChild(footer);
    }
}

window.openPresetModal = (kind, idx = -1) => {
    presetMode = kind;
    editingPresetIdx = idx;
    const isFm = kind === 'fm';
    document.getElementById('preset-modal-title').textContent = (idx === -1 ? 'New ' : 'Edit ') + (isFm ? 'Final Mask (fm)' : 'Cipher Suite (cs)');
    document.getElementById('pm-json-tools').classList.toggle('hidden', !isFm);

    if (idx === -1) {
        document.getElementById('pm-name').value = '';
        document.getElementById('pm-value').value = '';
    } else {
        const item = (isFm ? state.fmPresets : state.csPresets)[idx];
        document.getElementById('pm-name').value = item.name;
        document.getElementById('pm-value').value = item.value;
    }
    validateFmField();
    openModal('preset-modal');
};

function validateFmField() {
    if (presetMode !== 'fm') return;
    const badge = document.getElementById('pm-json-status');
    const val = document.getElementById('pm-value').value.trim();
    if (!val) { badge.className = 'badge badge-neutral'; badge.textContent = 'Empty'; return; }
    try { JSON.parse(val); badge.className = 'badge badge-success'; badge.textContent = 'Valid JSON'; }
    catch { badge.className = 'badge badge-danger'; badge.textContent = 'Invalid JSON'; }
}
document.getElementById('pm-value').addEventListener('input', validateFmField);

window.formatFmJson = (pretty) => {
    try {
        const obj = JSON.parse(document.getElementById('pm-value').value);
        document.getElementById('pm-value').value = pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
        validateFmField();
    } catch {
        toast('Cannot format: invalid JSON syntax', 'error');
    }
};

window.savePresetModal = () => {
    const name = document.getElementById('pm-name').value.trim();
    let value = document.getElementById('pm-value').value.trim();
    if (!name || !value) return toast('Name and value are required', 'error');
    if (presetMode === 'fm') {
        try { value = JSON.stringify(JSON.parse(value)); }
        catch {
            if (!confirm('The Final Mask value is not valid JSON. Save anyway?')) return;
        }
    }
    const list = presetMode === 'fm' ? state.fmPresets : state.csPresets;
    if (editingPresetIdx === -1) {
        list.push({ id: presetMode + '_' + Math.random().toString(36).slice(2, 9), name, value });
        if (list.length > PRESET_PREVIEW_LIMIT) presetExpanded[presetMode] = true;
    } else {
        list[editingPresetIdx].name = name;
        list[editingPresetIdx].value = value;
    }
    markDirty(true);
    updateCounts();
    renderPresets();
    closeModal('preset-modal');
};

window.deletePreset = async (kind, idx) => {
    const list = kind === 'fm' ? state.fmPresets : state.csPresets;
    const item = list[idx];
    if (!item) return;
    const label = kind === 'fm' ? 'Delete Final Mask Preset' : 'Delete Cipher Suite Preset';
    const ok = await confirmDelete(label, 'Are you sure you want to delete this preset?', item.name);
    if (!ok) return;
    list.splice(idx, 1);
    markDirty(true);
    updateCounts();
    renderPresets();
};

function populatePresetSelects(csId, fmId) {
    const csSel = document.getElementById('sm-fnfCsId');
    const fmSel = document.getElementById('sm-fnfFmId');
    csSel.innerHTML = '<option value="">-- None (omit cs) --</option>';
    (state.csPresets || []).forEach(p => {
        const o = document.createElement('option');
        o.value = p.id; o.textContent = p.name;
        csSel.appendChild(o);
    });
    fmSel.innerHTML = '<option value="">-- None (omit fm) --</option>';
    (state.fmPresets || []).forEach(p => {
        const o = document.createElement('option');
        o.value = p.id; o.textContent = p.name;
        fmSel.appendChild(o);
    });
    csSel.value = csId || '';
    fmSel.value = fmId || '';
}

function syncSubModalVisibility() {
    const method = document.querySelector('input[name="sm-fragmentMode"]:checked')?.value || 'none';
    document.querySelectorAll('#sm-method-grid .method-card').forEach(c => {
        c.classList.toggle('selected', c.querySelector('input').checked);
    });
    document.getElementById('sm-frag-delay-wrap').classList.toggle('hidden', method !== 'tls_fragment');
    document.getElementById('sm-fnf-wrap').classList.toggle('hidden', method !== 'fnf');

    const coreSel = document.getElementById('sm-coreType');
    const lockHint = document.getElementById('sm-core-lock-hint');
    if (method === 'fnf') {
        coreSel.value = 'xray';
        coreSel.disabled = true;
        lockHint.classList.remove('hidden');
    } else {
        coreSel.disabled = false;
        lockHint.classList.add('hidden');
    }

    document.getElementById('sm-ech-sb-wrap').classList.toggle('hidden', coreSel.value !== 'singbox');
    document.getElementById('sm-fpCustom').classList.toggle('hidden', document.getElementById('sm-fpMode').value !== 'custom');
    document.getElementById('sm-alpnCustom').classList.toggle('hidden', document.getElementById('sm-alpnMode').value !== 'custom');
    document.getElementById('sm-custom-header-wrap').classList.toggle('hidden', document.getElementById('sm-randomizeHeaders').checked);

    const customIp = document.getElementById('sm-ipPoolMode').value === 'custom';
    document.getElementById('sm-custom-ip-wrap').classList.toggle('hidden', !customIp);
    document.getElementById('sm-copy-global-ip').classList.toggle('hidden', !customIp);
    document.getElementById('sm-expand-ip').classList.toggle('hidden', !customIp);

    const customDom = document.getElementById('sm-domainsMode').value === 'custom';
    document.getElementById('sm-custom-domains-wrap').classList.toggle('hidden', !customDom);
    document.getElementById('sm-copy-global-domains').classList.toggle('hidden', !customDom);

    document.getElementById('sm-custom-ports-wrap').classList.toggle('hidden', document.getElementById('sm-portsMode').value !== 'custom');
    ['sm-customIpList', 'sm-customDomainsWorker', 'sm-customDomainsPages'].forEach(resizeSubPoolBox);
}

function resizeSubPoolBox(id) {
    const tx = document.getElementById(id);
    if (!tx || tx.offsetParent === null) return;
    tx.style.height = 'auto';
    const sh = tx.scrollHeight + 4;
    tx.style.height = (tx.classList.contains('expanded') ? Math.max(108, sh) : Math.min(240, Math.max(108, sh))) + 'px';
}

window.toggleSubPoolExpand = (id, btn) => {
    const tx = document.getElementById(id);
    const expanded = tx.classList.toggle('expanded');
    btn.textContent = expanded ? 'Collapse' : 'Expand';
    resizeSubPoolBox(id);
};

window.copyGlobalPoolToSub = (kind) => {
    syncNetworkAndSettingsToState();
    if (kind === 'ip') {
        document.getElementById('sm-customIpList').value = (state.ipList || []).join(', ');
        resizeSubPoolBox('sm-customIpList');
    } else if (kind === 'domains') {
        document.getElementById('sm-customDomainsWorker').value = (state.domainsWorker || []).join(', ');
        document.getElementById('sm-customDomainsPages').value = (state.domainsPages || []).join(', ');
        resizeSubPoolBox('sm-customDomainsWorker');
        resizeSubPoolBox('sm-customDomainsPages');
    }
    toast('Copied global pool values');
};

function renderSubPortChecks(selectedTls, selectedNoTls) {
    const tlsBox = document.getElementById('sm-customPortsTLS');
    tlsBox.innerHTML = '';
    ALL_TLS_PORTS.forEach(p => {
        const lbl = document.createElement('label');
        lbl.className = 'check-pill';
        lbl.innerHTML = '<input type="checkbox" value="' + p + '" ' + (selectedTls.includes(p) ? 'checked' : '') + '> <span>' + p + '</span>';
        tlsBox.appendChild(lbl);
    });
    const noTlsBox = document.getElementById('sm-customPortsNoTLS');
    noTlsBox.innerHTML = '';
    ALL_NOTLS_PORTS.forEach(p => {
        const lbl = document.createElement('label');
        lbl.className = 'check-pill';
        lbl.innerHTML = '<input type="checkbox" value="' + p + '" ' + (selectedNoTls.includes(p) ? 'checked' : '') + '> <span>' + p + '</span>';
        noTlsBox.appendChild(lbl);
    });
}

document.querySelectorAll('input[name="sm-fragmentMode"]').forEach(r => r.addEventListener('change', () => {
    if (r.value === 'fnf' && r.checked) {
        const fp = document.getElementById('sm-fpMode');
        if (fp.value === 'random_list') fp.value = 'unsafe';
    }
    syncSubModalVisibility();
}));
document.getElementById('sm-coreType').addEventListener('change', syncSubModalVisibility);
document.getElementById('sm-fpMode').addEventListener('change', syncSubModalVisibility);
document.getElementById('sm-alpnMode').addEventListener('change', syncSubModalVisibility);
document.getElementById('sm-randomizeHeaders').addEventListener('change', syncSubModalVisibility);
document.getElementById('sm-ipPoolMode').addEventListener('change', syncSubModalVisibility);
['sm-customIpList', 'sm-customDomainsWorker', 'sm-customDomainsPages'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => resizeSubPoolBox(id));
});
document.getElementById('sm-domainsMode').addEventListener('change', syncSubModalVisibility);
document.getElementById('sm-portsMode').addEventListener('change', () => {
    if (document.getElementById('sm-portsMode').value === 'custom') {
        const hasTls = document.querySelectorAll('#sm-customPortsTLS input:checked').length > 0;
        const hasNoTls = document.querySelectorAll('#sm-customPortsNoTLS input:checked').length > 0;
        if (!hasTls && !hasNoTls) {
            syncNetworkAndSettingsToState();
            renderSubPortChecks(state.portListTLS || [], state.portListNoTLS || []);
        }
    }
    syncSubModalVisibility();
});

document.getElementById('sm-echPreset').addEventListener('change', (e) => {
    const v = e.target.value;
    const dom = document.getElementById('sm-echConfig');
    const dns = document.getElementById('sm-echDns');
    if (v === 'cf_udp') { dom.value = 'crypto.cloudflare.com'; dns.value = 'udp://1.1.1.1'; }
    else if (v === 'cf_doh') { dom.value = 'cloudflare-ech.com'; dns.value = 'https://1.1.1.1/dns-query'; }
    else if (v === 'cf_dot') { dom.value = 'crypto.cloudflare.com'; dns.value = 'tls://1.1.1.1'; }
    else if (v === 'cf_google_udp') { dom.value = 'cloudflare-ech.com'; dns.value = 'udp://8.8.8.8'; }
    else if (v === 'cf_h3') { dom.value = 'cloudflare-ech.com'; dns.value = 'h3://1.1.1.1/dns-query'; }
    else if (v === 'clear') { dom.value = ''; dns.value = ''; }
});

window.openSubModal = (idx = -1) => {
    editingSubIdx = idx;
    const isNew = idx === -1;
    document.getElementById('sub-modal-title').textContent = isNew ? 'Create Subscription' : 'Edit Subscription';
    const sub = isNew ? {
        id: 'sub_' + Math.random().toString(36).slice(2, 9),
        name: 'New Subscription',
        enabled: true,
        path: '/sub-' + ((state.subscriptions || []).length + 1),
        coreType: 'singbox',
        outputFormat: 'plain',
        includeCustomServers: true,
        includeSubLinks: true,
        genModes: ['ip_tls'],
        extraServers: '',
        fragmentMode: 'none',
        fragmentFallbackDelay: '450ms',
        fnfCsId: (state.csPresets?.[0]?.id || ''),
        fnfFmId: (state.fmPresets?.[0]?.id || ''),
        fpMode: 'random_list',
        fpCustom: '',
        alpnMode: 'random_list',
        alpnCustom: '',
        allowInsecure: true,
        randomizeSniPrefix: true,
        randomizeHeaders: true,
        headerKey: '',
        headerValue: '',
        packetEncoding: 'xudp',
        earlyDataLength: '',
        earlyDataName: '',
        echConfig: '',
        echDns: '',
        echSingboxMode: 'modern',
        ipPoolMode: 'global',
        customIpList: [],
        domainsMode: 'global',
        customDomainsWorker: [],
        customDomainsPages: [],
        portsMode: 'global',
        customPortsTLS: [],
        customPortsNoTLS: []
    } : state.subscriptions[idx];

    document.getElementById('sm-name').value = sub.name || '';
    document.getElementById('sm-path').value = sub.path || '/sub';
    document.getElementById('sm-coreType').value = sub.coreType || 'singbox';
    document.getElementById('sm-outputFormat').value = sub.outputFormat || 'plain';
    document.getElementById('sm-enabled').checked = sub.enabled !== false;
    document.getElementById('sm-includeCustom').checked = sub.includeCustomServers !== false;
    document.getElementById('sm-includeSubLinks').checked = sub.includeSubLinks !== false;
    document.querySelectorAll('#sm-genModes input').forEach(c => { c.checked = (sub.genModes || []).includes(c.value); });
    document.getElementById('sm-extraServers').value = sub.extraServers || '';

    const fragRadio = document.querySelector('input[name="sm-fragmentMode"][value="' + (sub.fragmentMode || 'none') + '"]');
    if (fragRadio) fragRadio.checked = true;
    document.getElementById('sm-fragmentFallbackDelay').value = sub.fragmentFallbackDelay || '450ms';
    populatePresetSelects(sub.fnfCsId, sub.fnfFmId);

    document.getElementById('sm-echPreset').value = '';
    document.getElementById('sm-echConfig').value = sub.echConfig || '';
    document.getElementById('sm-echDns').value = sub.echDns || '';
    document.getElementById('sm-echSingboxMode').value = sub.echSingboxMode || 'modern';

    document.getElementById('sm-fpMode').value = sub.fpMode || 'random_list';
    document.getElementById('sm-fpCustom').value = sub.fpCustom || '';
    document.getElementById('sm-alpnMode').value = sub.alpnMode || 'random_list';
    document.getElementById('sm-alpnCustom').value = sub.alpnCustom || '';
    document.getElementById('sm-packetEncoding').value = sub.packetEncoding || 'xudp';
    document.getElementById('sm-earlyDataLength').value = sub.earlyDataLength || '';
    document.getElementById('sm-earlyDataName').value = sub.earlyDataName || '';
    document.getElementById('sm-allowInsecure').checked = sub.allowInsecure !== false;
    document.getElementById('sm-randomizeSniPrefix').checked = sub.randomizeSniPrefix !== false;
    document.getElementById('sm-randomizeHeaders').checked = sub.randomizeHeaders !== false;
    document.getElementById('sm-headerKey').value = sub.headerKey || '';
    document.getElementById('sm-headerValue').value = sub.headerValue || '';

    document.getElementById('sm-ipPoolMode').value = sub.ipPoolMode || 'global';
    document.getElementById('sm-customIpList').value = (sub.customIpList || []).join(', ');
    document.getElementById('sm-domainsMode').value = sub.domainsMode || 'global';
    document.getElementById('sm-customDomainsWorker').value = (sub.customDomainsWorker || []).join(', ');
    document.getElementById('sm-customDomainsPages').value = (sub.customDomainsPages || []).join(', ');
    document.getElementById('sm-portsMode').value = sub.portsMode || 'global';
    renderSubPortChecks(sub.customPortsTLS || [], sub.customPortsNoTLS || []);
    ['sm-customIpList', 'sm-customDomainsWorker', 'sm-customDomainsPages'].forEach(id => document.getElementById(id).classList.remove('expanded'));
    ['sm-expand-ip', 'sm-expand-worker', 'sm-expand-pages'].forEach(id => { document.getElementById(id).textContent = 'Expand'; });

    syncSubModalVisibility();
    openModal('sub-modal');
};

function collectSubFromModal() {
    let p = document.getElementById('sm-path').value.trim();
    if (!p.startsWith('/')) p = '/' + p;
    if (p.length > 1) p = p.replace(/\\/+$/, '');
    const fragmentMode = document.querySelector('input[name="sm-fragmentMode"]:checked')?.value || 'none';
    const existingId = editingSubIdx >= 0 ? state.subscriptions[editingSubIdx].id : ('sub_' + Math.random().toString(36).slice(2, 9));

    return {
        id: existingId,
        name: document.getElementById('sm-name').value.trim() || 'Untitled Subscription',
        enabled: document.getElementById('sm-enabled').checked,
        path: p,
        coreType: fragmentMode === 'fnf' ? 'xray' : document.getElementById('sm-coreType').value,
        outputFormat: document.getElementById('sm-outputFormat').value,
        includeCustomServers: document.getElementById('sm-includeCustom').checked,
        includeSubLinks: document.getElementById('sm-includeSubLinks').checked,
        genModes: Array.from(document.querySelectorAll('#sm-genModes input:checked')).map(c => c.value),
        extraServers: document.getElementById('sm-extraServers').value,
        fragmentMode,
        fragmentFallbackDelay: document.getElementById('sm-fragmentFallbackDelay').value.trim() || '450ms',
        fnfCsId: document.getElementById('sm-fnfCsId').value,
        fnfFmId: document.getElementById('sm-fnfFmId').value,
        echConfig: document.getElementById('sm-echConfig').value.trim(),
        echDns: document.getElementById('sm-echDns').value.trim(),
        echSingboxMode: document.getElementById('sm-echSingboxMode').value,
        fpMode: document.getElementById('sm-fpMode').value,
        fpCustom: document.getElementById('sm-fpCustom').value.trim(),
        alpnMode: document.getElementById('sm-alpnMode').value,
        alpnCustom: document.getElementById('sm-alpnCustom').value.trim(),
        packetEncoding: document.getElementById('sm-packetEncoding').value.trim(),
        earlyDataLength: document.getElementById('sm-earlyDataLength').value.trim(),
        earlyDataName: document.getElementById('sm-earlyDataName').value.trim(),
        allowInsecure: document.getElementById('sm-allowInsecure').checked,
        randomizeSniPrefix: document.getElementById('sm-randomizeSniPrefix').checked,
        randomizeHeaders: document.getElementById('sm-randomizeHeaders').checked,
        headerKey: document.getElementById('sm-headerKey').value.trim(),
        headerValue: document.getElementById('sm-headerValue').value.trim(),
        ipPoolMode: document.getElementById('sm-ipPoolMode').value,
        customIpList: splitPoolEntries(document.getElementById('sm-customIpList').value),
        domainsMode: document.getElementById('sm-domainsMode').value,
        customDomainsWorker: splitPoolEntries(document.getElementById('sm-customDomainsWorker').value),
        customDomainsPages: splitPoolEntries(document.getElementById('sm-customDomainsPages').value),
        portsMode: document.getElementById('sm-portsMode').value,
        customPortsTLS: Array.from(document.querySelectorAll('#sm-customPortsTLS input:checked')).map(c => parseInt(c.value, 10)),
        customPortsNoTLS: Array.from(document.querySelectorAll('#sm-customPortsNoTLS input:checked')).map(c => parseInt(c.value, 10))
    };
}

window.saveSubModal = () => {
    const sub = collectSubFromModal();
    if (!sub.genModes.length && !sub.extraServers.trim()) {
        return toast('Select at least one generation mode or add extra servers', 'error');
    }
    if (sub.portsMode === 'custom' && !sub.customPortsTLS.length && !sub.customPortsNoTLS.length) {
        return toast('Select at least one TLS or No-TLS port in Custom Ports', 'error');
    }
    const adminP = document.getElementById('cfg-adminPath').value.trim();
    if (sub.path === adminP) return toast('Subscription path cannot match Admin Path', 'error');

    const dup = state.subscriptions.findIndex((s, i) => i !== editingSubIdx && s.path === sub.path);
    if (dup !== -1) toast('Warning: another profile also uses path ' + sub.path, 'info');

    if (editingSubIdx === -1) state.subscriptions.push(sub);
    else state.subscriptions[editingSubIdx] = sub;

    markDirty(true);
    updateCounts();
    renderSubscriptions();
    closeModal('sub-modal');
};

document.getElementById('btn-new-sub').onclick = () => openSubModal(-1);

function syncNetworkAndSettingsToState() {
    commitIpPoolTextareaToState();
    state.domainsWorker = splitPoolEntries(document.getElementById('cfg-domainsWorker').value);
    state.domainsPages = splitPoolEntries(document.getElementById('cfg-domainsPages').value);
    state.alpnList = document.getElementById('cfg-alpnList').value.split(';').map(x => x.trim()).filter(Boolean);
    state.fpList = document.getElementById('cfg-fpList').value.split(',').map(x => x.trim()).filter(Boolean);
    state.portListTLS = Array.from(document.querySelectorAll('#tls-ports-grid input:checked')).map(c => parseInt(c.value, 10));
    state.portListNoTLS = Array.from(document.querySelectorAll('#notls-ports-grid input:checked')).map(c => parseInt(c.value, 10));
    state.defaultWebsite = document.getElementById('cfg-defaultWebsite').value.trim();
    state.adminPath = document.getElementById('cfg-adminPath').value.trim() || '/panel';

    renderIpPoolTextarea();
    document.getElementById('cfg-domainsWorker').value = state.domainsWorker.join(poolDisplayMode['cfg-domainsWorker'] === 'lines' ? '\\n' : ', ');
    document.getElementById('cfg-domainsPages').value = state.domainsPages.join(poolDisplayMode['cfg-domainsPages'] === 'lines' ? '\\n' : ', ');
    ['cfg-domainsWorker', 'cfg-domainsPages'].forEach(refreshExpandedHeight);
}

async function runPreview(sub) {
    syncNetworkAndSettingsToState();
    document.getElementById('pv-title').textContent = 'Preview: ' + sub.name + ' (' + sub.path + ')';
    document.getElementById('pv-meta').textContent = 'Generating live output...';
    document.getElementById('pv-output').value = '';
    document.getElementById('pv-decoded-wrap').classList.add('hidden');
    openModal('preview-modal');

    try {
        const res = await fetch(ADMIN_PATH + '/preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription: sub, draftConfig: state })
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        document.getElementById('pv-meta').textContent = 'Generated ' + data.count + ' server node(s) · ' + (sub.coreType === 'xray' ? 'Xray' : 'Sing-box') + ' · ' + sub.outputFormat;
        document.getElementById('pv-output').value = data.output || '(empty output)';
        if (sub.outputFormat === 'base64') {
            document.getElementById('pv-decoded').value = data.plainText || '';
            document.getElementById('pv-decoded-wrap').classList.remove('hidden');
        }
    } catch (e) {
        document.getElementById('pv-meta').textContent = 'Error';
        document.getElementById('pv-output').value = e.message;
    }
}

window.previewSubscription = (idx) => runPreview(state.subscriptions[idx]);
window.previewFromEditor = () => runPreview(collectSubFromModal());

function renderNetworkAndSettings() {
    renderIpPoolTextarea();
    document.getElementById('cfg-domainsWorker').value = (state.domainsWorker || []).join(poolDisplayMode['cfg-domainsWorker'] === 'lines' ? '\\n' : ', ');
    document.getElementById('cfg-domainsPages').value = (state.domainsPages || []).join(poolDisplayMode['cfg-domainsPages'] === 'lines' ? '\\n' : ', ');
    document.getElementById('cfg-alpnList').value = (state.alpnList || []).join('; ');
    document.getElementById('cfg-fpList').value = (state.fpList || []).join(', ');
    document.getElementById('cfg-defaultWebsite').value = state.defaultWebsite || '';
    document.getElementById('cfg-adminPath').value = state.adminPath || '/panel';

    const tlsBox = document.getElementById('tls-ports-grid');
    tlsBox.innerHTML = '';
    ALL_TLS_PORTS.forEach(p => {
        const lbl = document.createElement('label');
        lbl.className = 'check-pill';
        lbl.innerHTML = '<input type="checkbox" value="' + p + '" ' + ((state.portListTLS || []).includes(p) ? 'checked' : '') + '> <span>' + p + '</span>';
        lbl.querySelector('input').addEventListener('change', () => markDirty(true));
        tlsBox.appendChild(lbl);
    });

    const noTlsBox = document.getElementById('notls-ports-grid');
    noTlsBox.innerHTML = '';
    ALL_NOTLS_PORTS.forEach(p => {
        const lbl = document.createElement('label');
        lbl.className = 'check-pill';
        lbl.innerHTML = '<input type="checkbox" value="' + p + '" ' + ((state.portListNoTLS || []).includes(p) ? 'checked' : '') + '> <span>' + p + '</span>';
        lbl.querySelector('input').addEventListener('change', () => markDirty(true));
        noTlsBox.appendChild(lbl);
    });
    ['cfg-domainsWorker', 'cfg-domainsPages'].forEach(refreshExpandedHeight);
}

['cfg-ipList', 'cfg-domainsWorker', 'cfg-domainsPages', 'cfg-alpnList', 'cfg-fpList', 'cfg-defaultWebsite', 'cfg-adminPath', 'cfg-newPassword'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
        if (id === 'cfg-ipList') commitIpPoolTextareaToState();
        if (['cfg-ipList', 'cfg-domainsWorker', 'cfg-domainsPages'].includes(id)) refreshExpandedHeight(id);
        markDirty(true);
    });
});

async function loadConfig() {
    const res = await fetch(ADMIN_PATH + '/config');
    if (res.status === 401) {
        showLogin();
        return;
    }
    if (!res.ok) throw new Error('Failed to load config');
    state = await res.json();
    savedSnapshot = JSON.stringify(state);
    applyStateToUi();
    checkForUpdates(false);
}

function applyStateToUi() {
    document.getElementById('cfg-newPassword').value = '';
    updateCounts();
    renderSubscriptions();
    renderSources();
    renderNetworkAndSettings();
    renderPresets();
    markDirty(false);
}

window.discardChanges = async () => {
    if (!dirty || !savedSnapshot) return;
    const ok = await confirmDelete('Discard Unsaved Changes', 'All unsaved edits across all tabs will be reverted to the last saved state.', '', 'Discard');
    if (!ok) return;
    state = JSON.parse(savedSnapshot);
    applyStateToUi();
    toast('Unsaved changes discarded', 'info');
};

function escapeHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderReleaseNotes(md) {
    const text = escapeHtml(md || 'No release notes provided.');
    const lines = text.split(/\\r?\\n/);
    let html = '', inList = false;
    lines.forEach(rawLine => {
        const line = rawLine.trim();
        const fmt = (s) => s
            .replace(/\\x60([^\\x60]+)\\x60/g, '<code>$1</code>')
            .replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');
        if (/^#{1,3}\\s+/.test(line)) {
            if (inList) { html += '</ul>'; inList = false; }
            html += '<h3>' + fmt(line.replace(/^#{1,3}\\s+/, '')) + '</h3>';
        } else if (/^[-*]\\s+/.test(line)) {
            if (!inList) { html += '<ul>'; inList = true; }
            html += '<li>' + fmt(line.replace(/^[-*]\\s+/, '')) + '</li>';
        } else if (!line) {
            if (inList) { html += '</ul>'; inList = false; }
        } else {
            if (inList) { html += '</ul>'; inList = false; }
            html += '<p style="margin:4px 0;">' + fmt(line) + '</p>';
        }
    });
    if (inList) html += '</ul>';
    return html || '<p style="margin:0;">No release notes provided.</p>';
}

window.openUpdateModal = () => {
    if (!latestUpdateInfo) return;
    const d = latestUpdateInfo;
    document.getElementById('upd-title').textContent = d.name || ('Update ' + d.tagName);
    document.getElementById('upd-meta').textContent = d.updateAvailable ? 'A new release is available on GitHub' : 'You are on the latest release';
    document.getElementById('upd-cur-ver').textContent = 'Current: ' + (d.currentVersion || APP_VERSION);
    document.getElementById('upd-new-ver').textContent = 'Latest: ' + (d.tagName || APP_VERSION);
    document.getElementById('upd-date').textContent = d.publishedAt ? ('Published: ' + d.publishedAt.slice(0, 10)) : '';
    document.getElementById('upd-notes').innerHTML = renderReleaseNotes(d.body);
    document.getElementById('upd-github-link').href = d.htmlUrl || (GITHUB_REPO_URL + '/releases/latest');

    const assetsWrap = document.getElementById('upd-assets-wrap');
    const assetsBox = document.getElementById('upd-assets');
    assetsBox.innerHTML = '';
    const safeAssets = (d.assets || []).filter(a => /^https:\\/\\//i.test(a.url || ''));
    if (safeAssets.length) {
        safeAssets.forEach(a => {
            const link = document.createElement('a');
            link.className = 'btn btn-sm btn-soft mono';
            link.href = a.url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = a.name;
            assetsBox.appendChild(link);
        });
        assetsWrap.classList.remove('hidden');
    } else {
        assetsWrap.classList.add('hidden');
    }
    openModal('update-modal');
};

window.checkForUpdates = async (manual = false) => {
    const btn = document.getElementById('check-update-btn');
    if (manual && btn) { btn.disabled = true; btn.textContent = 'Checking...'; }
    try {
        const res = await fetch(ADMIN_PATH + '/check-update' + (manual ? '?force=1' : ''));
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (data.tagName) latestUpdateInfo = data;

        const badge = document.getElementById('update-badge-btn');
        if (data.updateAvailable) {
            document.getElementById('update-badge-tag').textContent = data.tagName;
            badge.classList.remove('hidden');
            if (!document.getElementById('update-modal').classList.contains('hidden')) openUpdateModal();
            else if (manual) openUpdateModal();
        } else {
            badge.classList.add('hidden');
            if (manual) {
                if (data.rateLimited) toast('GitHub rate limit reached; try again later', 'info');
                else if (data.error) toast('Update check failed: ' + data.error, 'error');
                else toast('You are running the latest version (' + APP_VERSION + ')');
            }
        }
    } catch (e) {
        if (manual) toast('Update check error: ' + e.message, 'error');
    } finally {
        if (manual && btn) { btn.disabled = false; btn.textContent = 'Check for Updates'; }
    }
};

async function saveAll() {
    syncNetworkAndSettingsToState();
    const payload = {
        ...state,
        customServers: (state.customServers || []).map(x => x.trim()).filter(Boolean),
        defaultSublink: (state.defaultSublink || []).map(x => x.trim()).filter(Boolean)
    };
    const newPass = document.getElementById('cfg-newPassword').value.trim();
    if (newPass) payload.newAdminPassword = newPass;

    try {
        const btn = document.getElementById('save-all-btn');
        btn.textContent = 'Saving...';
        btn.disabled = true;
        const res = await fetch(ADMIN_PATH + '/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        state.customServers = payload.customServers;
        state.defaultSublink = payload.defaultSublink;
        savedSnapshot = JSON.stringify(state);
        document.getElementById('cfg-newPassword').value = '';
        updateCounts();
        renderSources();
        markDirty(false);
        toast('All settings saved to Cloudflare KV!');
        if (data.adminPath && data.adminPath !== ADMIN_PATH) {
            toast('Admin path changed. Redirecting...', 'info');
            setTimeout(() => { location.pathname = data.adminPath; }, 900);
        }
    } catch (e) {
        toast('Save error: ' + e.message, 'error');
    } finally {
        const btn = document.getElementById('save-all-btn');
        btn.textContent = 'Save Changes';
        btn.disabled = false;
    }
}
document.getElementById('save-all-btn').onclick = saveAll;

document.getElementById('clear-cache-btn').onclick = async () => {
    try {
        const res = await fetch(ADMIN_PATH + '/clear-cache', { method: 'POST' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error');
        toast('Cleared ' + data.cleared + ' cached subscription(s)');
    } catch (e) {
        toast('Error clearing cache: ' + e.message, 'error');
    }
};

function showLogin() {
    document.getElementById('app-view').classList.add('hidden');
    document.getElementById('login-view').classList.remove('hidden');
}

function showApp() {
    document.getElementById('login-view').classList.add('hidden');
    document.getElementById('app-view').classList.remove('hidden');
}

async function doLogin() {
    const pw = document.getElementById('login-password').value;
    try {
        const res = await fetch(ADMIN_PATH + '/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pw })
        });
        if (!res.ok) throw new Error('Invalid password');
        document.getElementById('login-password').value = '';
        showApp();
        await loadConfig();
    } catch (e) {
        toast(e.message, 'error');
    }
}
document.getElementById('login-btn').onclick = doLogin;
document.getElementById('login-password').addEventListener('keypress', e => { if (e.key === 'Enter') doLogin(); });

document.getElementById('logout-btn').onclick = async () => {
    await fetch(ADMIN_PATH + '/logout', { method: 'POST' });
    state = null;
    showLogin();
};

window.addEventListener('beforeunload', (e) => {
    if (dirty) { e.preventDefault(); e.returnValue = ''; }
});

(async function init() {
    try {
        const res = await fetch(ADMIN_PATH + '/session');
        const data = await res.json();
        if (data.authenticated) {
            showApp();
            await loadConfig();
        } else {
            showLogin();
        }
    } catch {
        showLogin();
    }
})();
</script>
</body>
</html>`;
}
