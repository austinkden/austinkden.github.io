// universal.js - Loads and applies the persistent accent theme across all pages
(function() {
    // 0. Device & Session Telemetry Collector
    (async function initTelemetry() {
        try {
            const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
            const { getFirestore, doc, getDoc, setDoc, arrayUnion, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
            const { firebaseConfig } = await import("https://astrong.xyz/firebase-config.js");

            // Initialize Firebase App & Firestore
            const app = initializeApp(firebaseConfig);
            const db = getFirestore(app);

            // 1. Device & Session ID Setup (8-character alphanumeric uppercase format)
            function generate8CharDeviceId() {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                let res = '';
                const array = new Uint8Array(8);
                if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
                    crypto.getRandomValues(array);
                    for (let i = 0; i < 8; i++) {
                        res += chars.charAt(array[i] % chars.length);
                    }
                } else {
                    for (let i = 0; i < 8; i++) {
                        res += chars.charAt(Math.floor(Math.random() * chars.length));
                    }
                }
                return res;
            }

            function getRootCookie(name) {
                const value = `; ${document.cookie}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) return parts.pop().split(';').shift();
                return null;
            }

            function setRootCookie(name, value, days) {
                const d = new Date();
                d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
                const expires = `expires=${d.toUTCString()}`;
                const domainStr = window.location.hostname.endsWith('astrong.xyz') ? '; domain=.astrong.xyz' : '';
                document.cookie = `${name}=${value}; ${expires}; path=/${domainStr}; SameSite=Lax`;
            }

            // Clear local storage on subdomains so state is managed exclusively via root-domain cookies (.astrong.xyz)
            if (window.location.hostname !== 'astrong.xyz' && window.location.hostname.endsWith('astrong.xyz')) {
                try { localStorage.clear(); } catch (e) {}
            }

            let deviceId = getRootCookie('astrong_device_id');
            if (!deviceId && window.location.hostname === 'astrong.xyz') {
                deviceId = localStorage.getItem('astrong_device_id');
            }

            if (!deviceId || !/^[A-Z0-9]{8}$/.test(deviceId)) {
                let candidate = generate8CharDeviceId();
                let attempts = 0;
                while (attempts < 5) {
                    try {
                        const checkRef = doc(db, "devices", candidate);
                        const checkSnap = await getDoc(checkRef);
                        if (checkSnap.exists()) {
                            candidate = generate8CharDeviceId();
                            attempts++;
                        } else {
                            break;
                        }
                    } catch (e) {
                        break;
                    }
                }
                deviceId = candidate;
            }
            setRootCookie('astrong_device_id', deviceId, 3650);
            if (window.location.hostname === 'astrong.xyz') {
                try { localStorage.setItem('astrong_device_id', deviceId); } catch (e) {}
            }
            window.__ASTRONG_DEVICE_ID__ = deviceId;
            console.log(`[Telemetry] Active Device ID: ${deviceId}`);

            function syncDeviceIdUI() {
                const loader = document.getElementById('astrong-loading-screen');
                if (loader && !loader.querySelector('#loading-device-id')) {
                    const idDiv = document.createElement('div');
                    idDiv.className = 'loading-device-id';
                    idDiv.id = 'loading-device-id';
                    idDiv.innerHTML = `<span>${deviceId}</span>`;
                    loader.appendChild(idDiv);
                }
                const displays = document.querySelectorAll('#loading-device-id span, #help-device-id, .device-id-display');
                displays.forEach(el => {
                    el.textContent = deviceId;
                });
            }
            syncDeviceIdUI();
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', syncDeviceIdUI);
            }

            let sessionId = sessionStorage.getItem('astrong_session_id');
            let isNewSession = false;
            if (!sessionId) {
                sessionId = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
                sessionStorage.setItem('astrong_session_id', sessionId);
                isNewSession = true;
            }

            let firstSeen = localStorage.getItem('astrong_first_seen');
            if (!firstSeen) {
                firstSeen = new Date().toISOString();
                localStorage.setItem('astrong_first_seen', firstSeen);
            }

            let visitCount = parseInt(localStorage.getItem('astrong_visit_count') || '0', 10);
            if (isNewSession) {
                visitCount += 1;
                localStorage.setItem('astrong_visit_count', visitCount.toString());
            }

            // 2. Parse User Agent for Browser & OS
            const ua = navigator.userAgent || '';
            let browserName = 'Unknown Browser';
            let browserVer = '';
            let osName = 'Unknown OS';

            // Detect OS
            if (ua.indexOf('Win') !== -1) osName = 'Windows';
            else if (ua.indexOf('Mac') !== -1) {
                if (ua.indexOf('iPhone') !== -1 || ua.indexOf('iPad') !== -1 || ua.indexOf('iPod') !== -1) osName = 'iOS';
                else osName = 'macOS';
            } else if (ua.indexOf('Android') !== -1) osName = 'Android';
            else if (ua.indexOf('Linux') !== -1) osName = 'Linux';
            else if (ua.indexOf('CrOS') !== -1) osName = 'ChromeOS';

            // Detect Browser
            if (ua.indexOf('Firefox') !== -1) {
                browserName = 'Firefox';
                browserVer = ua.match(/Firefox\/([\d.]+)/)?.[1] || '';
            } else if (ua.indexOf('SamsungBrowser') !== -1) {
                browserName = 'Samsung Internet';
                browserVer = ua.match(/SamsungBrowser\/([\d.]+)/)?.[1] || '';
            } else if (ua.indexOf('Opera') !== -1 || ua.indexOf('OPR') !== -1) {
                browserName = 'Opera';
                browserVer = ua.match(/(?:Opera|OPR)\/([\d.]+)/)?.[1] || '';
            } else if (ua.indexOf('Edg') !== -1) {
                browserName = 'Microsoft Edge';
                browserVer = ua.match(/Edg\/([\d.]+)/)?.[1] || '';
            } else if (ua.indexOf('Chrome') !== -1) {
                browserName = 'Google Chrome';
                browserVer = ua.match(/Chrome\/([\d.]+)/)?.[1] || '';
            } else if (ua.indexOf('Safari') !== -1) {
                browserName = 'Safari';
                browserVer = ua.match(/Version\/([\d.]+)/)?.[1] || '';
            }

            // Device Category
            let deviceType = 'Desktop';
            if (/Mobi|Android|iPhone|iPod/i.test(ua)) deviceType = 'Mobile';
            else if (/Tablet|iPad/i.test(ua) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && osName === 'macOS')) deviceType = 'Tablet';

            // 3. Hardware & Graphics Telemetry
            let gpuVendor = 'Unknown';
            let gpuRenderer = 'Unknown';
            try {
                const canvas = document.createElement('canvas');
                const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                if (gl) {
                    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                    if (debugInfo) {
                        gpuVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Unknown';
                        gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Unknown';
                    }
                }
            } catch (e) {
                // WebGL detection fallback
            }

            // Battery Telemetry
            let batteryInfo = { level: null, charging: null, chargingTime: null, dischargingTime: null };
            try {
                if (typeof navigator.getBattery === 'function') {
                    const battery = await navigator.getBattery();
                    batteryInfo = {
                        level: Math.round(battery.level * 100),
                        charging: battery.charging,
                        chargingTime: battery.chargingTime !== Infinity ? battery.chargingTime : null,
                        dischargingTime: battery.dischargingTime !== Infinity ? battery.dischargingTime : null
                    };
                }
            } catch (e) { }

            // Connection Telemetry
            let connectionInfo = { effectiveType: 'Unknown', downlink: null, rtt: null, saveData: false };
            if (navigator.connection) {
                connectionInfo = {
                    effectiveType: navigator.connection.effectiveType || 'Unknown',
                    downlink: navigator.connection.downlink || null,
                    rtt: navigator.connection.rtt || null,
                    saveData: !!navigator.connection.saveData
                };
            }

            // Display & Preferences Telemetry
            const orientationType = screen.orientation?.type || (window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
            const orientationAngle = screen.orientation?.angle || 0;
            const colorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'no-preference');
            const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const isAutomatedBot = !!navigator.webdriver;

            // 4. IP & Geolocation Fetching (with localStorage caching and ipify check)
            let ipData = {
                ip: 'Unknown',
                city: 'Unknown',
                region: 'Unknown',
                country: 'Unknown',
                countryCode: '',
                isp: 'Unknown',
                org: 'Unknown',
                lat: null,
                lon: null
            };

            async function fetchIpData() {
                let cached = null;
                try {
                    cached = JSON.parse(localStorage.getItem('astrong_cached_ip_data') || 'null');
                } catch (e) {}

                let currentIp = null;
                try {
                    const ipifyRes = await fetch('https://api.ipify.org?format=json').catch(() => null);
                    if (ipifyRes && ipifyRes.ok) {
                        const data = await ipifyRes.json();
                        currentIp = data.ip || null;
                    }
                } catch (e) {}

                // Reuse cached location data if IP matches or ipify was unreachable but cache exists
                if (cached && cached.ip && (currentIp === null || currentIp === cached.ip)) {
                    console.log(`[Telemetry] IP cache hit (${cached.ip} - ${cached.city}, ${cached.country}). Skipping IP API fetch.`);
                    return cached;
                }

                console.log(`[Telemetry] Uncached or changed IP (${currentIp || 'Unknown'}). Fetching geolocation data...`);

                // Primary Provider: ipapi.co
                try {
                    const res = await fetch('https://ipapi.co/json/').catch(() => null);
                    if (res && res.ok) {
                        const data = await res.json().catch(() => null);
                        if (data && !data.error) {
                            const freshData = {
                                ip: data.ip || currentIp || 'Unknown',
                                city: data.city || 'Unknown',
                                region: data.region || 'Unknown',
                                country: data.country_name || data.country || 'Unknown',
                                countryCode: data.country_code || '',
                                isp: data.org || data.asn || 'Unknown',
                                org: data.org || 'Unknown',
                                lat: data.latitude || null,
                                lon: data.longitude || null
                            };
                            localStorage.setItem('astrong_cached_ip_data', JSON.stringify(freshData));
                            console.log(`[Telemetry] Successfully updated IP cache for ${freshData.ip}`);
                            return freshData;
                        }
                    }
                } catch (err) {}

                // Secondary Fallback Provider: ipwho.is (CORS enabled)
                try {
                    const res = await fetch('https://ipwho.is/').catch(() => null);
                    if (res && res.ok) {
                        const data = await res.json().catch(() => null);
                        if (data && data.success !== false) {
                            const freshData = {
                                ip: data.ip || currentIp || 'Unknown',
                                city: data.city || 'Unknown',
                                region: data.region || 'Unknown',
                                country: data.country || 'Unknown',
                                countryCode: data.country_code || '',
                                isp: data.connection?.isp || data.connection?.org || 'Unknown',
                                org: data.connection?.org || 'Unknown',
                                lat: data.latitude || null,
                                lon: data.longitude || null
                            };
                            localStorage.setItem('astrong_cached_ip_data', JSON.stringify(freshData));
                            console.log(`[Telemetry] Successfully updated IP cache for ${freshData.ip} (via ipwho.is)`);
                            return freshData;
                        }
                    }
                } catch (err) {}

                if (cached) return cached;
                if (currentIp) ipData.ip = currentIp;
                return ipData;
            }

            ipData = await fetchIpData();

            // 5. Build Telemetry Payload
            const nowIso = new Date().toISOString();

            const pageVisitEntry = {
                url: window.location.href,
                path: window.location.pathname,
                title: document.title,
                timestamp: nowIso,
                referrer: document.referrer || 'Direct'
            };

            const devicePayload = {
                deviceId: deviceId,
                lastSessionId: sessionId,
                deviceType: deviceType,
                browser: {
                    name: browserName,
                    version: browserVer,
                    userAgent: ua,
                    language: navigator.language || 'Unknown',
                    languages: navigator.languages ? Array.from(navigator.languages) : [],
                    cookiesEnabled: navigator.cookieEnabled,
                    online: navigator.onLine,
                    doNotTrack: navigator.doNotTrack || 'Unspecified',
                    pdfViewerEnabled: navigator.pdfViewerEnabled ?? null,
                    webdriver: isAutomatedBot
                },
                operatingSystem: {
                    name: osName,
                    platform: navigator.platform || 'Unknown'
                },
                hardware: {
                    screenWidth: screen.width,
                    screenHeight: screen.height,
                    screenAvailWidth: screen.availWidth,
                    screenAvailHeight: screen.availHeight,
                    viewportWidth: window.innerWidth,
                    viewportHeight: window.innerHeight,
                    pixelRatio: window.devicePixelRatio || 1,
                    colorDepth: screen.colorDepth || 24,
                    pixelDepth: screen.pixelDepth || 24,
                    cpuCores: navigator.hardwareConcurrency || 'Unknown',
                    deviceMemoryGB: navigator.deviceMemory || 'Unknown',
                    maxTouchPoints: navigator.maxTouchPoints || 0,
                    gpuVendor: gpuVendor,
                    gpuRenderer: gpuRenderer
                },
                preferences: {
                    colorScheme: colorScheme,
                    reducedMotion: reducedMotion,
                    orientation: `${orientationType} (${orientationAngle}°)`
                },
                network: {
                    ip: ipData.ip,
                    city: ipData.city,
                    region: ipData.region,
                    country: ipData.country,
                    countryCode: ipData.countryCode || '',
                    isp: ipData.isp,
                    lat: ipData.lat,
                    lon: ipData.lon,
                    connectionType: connectionInfo.effectiveType,
                    downlinkMbps: connectionInfo.downlink,
                    rttMs: connectionInfo.rtt,
                    saveData: connectionInfo.saveData
                },
                battery: batteryInfo,
                locale: {
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
                    timeZoneOffsetMinutes: new Date().getTimezoneOffset()
                },
                meta: {
                    firstSeen: firstSeen,
                    lastSeen: nowIso,
                    updatedAt: serverTimestamp(),
                    visitCount: visitCount,
                    lastPath: window.location.pathname,
                    lastReferrer: document.referrer || 'Direct'
                },
                recentViews: arrayUnion(pageVisitEntry)
            };

            // 6. Check Ban Status & Write Telemetry Record to Firestore
            const deviceRef = doc(db, "devices", deviceId);

            try {
                const docSnap = await getDoc(deviceRef);
                if (docSnap.exists()) {
                    const record = docSnap.data();
                    if (record.isBanned) {
                        enforceBanScreen();
                        window.__ASTRONG_BAN_VERIFIED__ = true;
                        window.dispatchEvent(new CustomEvent('astrong-ban-verified'));
                        return;
                    }
                }
            } catch (err) {
                if (err.code === 'permission-denied' || (err.message && err.message.includes('permissions'))) {
                    console.warn(`[Telemetry] Firestore Security Rules Warning: Unauthenticated access to "/devices/${deviceId}" was denied. Ensure Firestore Rules allow get access for /devices/{deviceId}.`);
                }
            } finally {
                window.__ASTRONG_BAN_VERIFIED__ = true;
                window.dispatchEvent(new CustomEvent('astrong-ban-verified'));
            }

            await setDoc(deviceRef, devicePayload, { merge: true }).catch(() => {});

            // 7. Periodic Telemetry Heartbeat & User Activity Listeners (Every 30s & on interaction)
            async function sendHeartbeat() {
                try {
                    let currentBattery = batteryInfo;
                    if (typeof navigator.getBattery === 'function') {
                        try {
                            const b = await navigator.getBattery();
                            currentBattery = {
                                level: Math.round(b.level * 100),
                                charging: b.charging,
                                chargingTime: b.chargingTime !== Infinity ? b.chargingTime : null,
                                dischargingTime: b.dischargingTime !== Infinity ? b.dischargingTime : null
                            };
                        } catch (e) {}
                    }

                    let currentConn = connectionInfo;
                    if (navigator.connection) {
                        currentConn = {
                            effectiveType: navigator.connection.effectiveType || 'Unknown',
                            downlink: navigator.connection.downlink || null,
                            rtt: navigator.connection.rtt || null,
                            saveData: !!navigator.connection.saveData
                        };
                    }

                    const heartbeatPayload = {
                        meta: {
                            lastSeen: new Date().toISOString(),
                            updatedAt: serverTimestamp(),
                            lastPath: window.location.pathname
                        },
                        battery: currentBattery,
                        network: {
                            connectionType: currentConn.effectiveType,
                            downlinkMbps: currentConn.downlink,
                            rttMs: currentConn.rtt,
                            saveData: currentConn.saveData
                        },
                        hardware: {
                            viewportWidth: window.innerWidth,
                            viewportHeight: window.innerHeight
                        }
                    };

                    await setDoc(deviceRef, heartbeatPayload, { merge: true });

                    // Check ban status on heartbeat
                    const checkSnap = await getDoc(deviceRef).catch(() => null);
                    if (checkSnap && checkSnap.exists()) {
                        const isBanned = !!checkSnap.data().isBanned;
                        if (isBanned) {
                            enforceBanScreen();
                        }
                    }
                } catch (err) {}
            }

            // Send periodic heartbeat every 30 seconds
            setInterval(sendHeartbeat, 30000);

            // Send immediate heartbeat on visibility or window focus
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    sendHeartbeat();
                }
            });

            window.addEventListener('focus', () => {
                sendHeartbeat();
            });

            // Send telemetry update on SPA navigation (history popstate)
            window.addEventListener('popstate', () => {
                const pathPayload = {
                    meta: {
                        lastSeen: new Date().toISOString(),
                        updatedAt: serverTimestamp(),
                        lastPath: window.location.pathname
                    },
                    recentViews: arrayUnion({
                        url: window.location.href,
                        path: window.location.pathname,
                        title: document.title,
                        timestamp: new Date().toISOString(),
                        referrer: document.referrer || 'Direct'
                    })
                };
                setDoc(deviceRef, pathPayload, { merge: true }).catch(() => {});
            });

        } catch (error) {
            console.error('[Telemetry] Error logging device telemetry:', error);
        }
    })();

    function enforceBanScreen() {
        window.__ASTRONG_BANNED__ = true;

        try {
            if (window.stop) window.stop();
        } catch (e) {}

        // Ensure banned loading screen style is present in head
        if (!document.getElementById('astrong-banned-loading-style')) {
            const style = document.createElement('style');
            style.id = 'astrong-banned-loading-style';
            style.textContent = `
                html, body {
                    background-color: #121016 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    overflow: hidden !important;
                    width: 100vw !important;
                    height: 100vh !important;
                    user-select: none !important;
                    -webkit-user-select: none !important;
                }
                #astrong-loading-screen {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100vw !important;
                    height: 100vh !important;
                    background-color: #121016 !important;
                    display: flex !important;
                    justify-content: center !important;
                    align-items: center !important;
                    z-index: 2147483647 !important;
                    opacity: 1 !important;
                    visibility: visible !important;
                    pointer-events: all !important;
                }
                .loading-spinner {
                    width: 58px !important;
                    height: 58px !important;
                    animation: banned-spin 1.2s linear infinite !important;
                    will-change: transform !important;
                }
                .loading-device-id {
                    position: absolute !important;
                    bottom: 16px !important;
                    right: 20px !important;
                    font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
                    font-size: 0.75rem !important;
                    color: #eb3f56 !important;
                    letter-spacing: 0.05em !important;
                    user-select: none !important;
                    -webkit-user-select: none !important;
                    z-index: 2147483648 !important;
                    cursor: pointer !important;
                    transition: color 0.2s ease !important;
                }
                .loading-device-id:hover {
                    color: #ff6b7e !important;
                }
                @keyframes banned-spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        const activeDevId = window.__ASTRONG_DEVICE_ID__ || localStorage.getItem('astrong_device_id') || '';
        const devIdMarkup = `<div class="loading-device-id banned" id="loading-device-id"><span>${activeDevId}</span></div>`;
        const loaderSvgHtml = '<svg viewBox="0 0 1 1" class="loading-spinner"><path d="M0.3955 0.0590C0.4007 0.0547 0.4033 0.0526 0.4057 0.0508C0.4615 0.0081 0.5385 0.0081 0.5943 0.0508C0.5967 0.0526 0.5993 0.0547 0.6045 0.0590C0.6068 0.0609 0.6079 0.0619 0.6091 0.0628C0.6354 0.0837 0.6675 0.0955 0.7010 0.0966C0.7024 0.0966 0.7039 0.0966 0.7069 0.0967C0.7136 0.0968 0.7170 0.0968 0.7199 0.0970C0.7898 0.1005 0.8488 0.1506 0.8644 0.2195C0.8651 0.2224 0.8657 0.2257 0.8670 0.2324C0.8675 0.2353 0.8678 0.2368 0.8681 0.2383C0.8749 0.2713 0.8921 0.3013 0.9170 0.3238C0.9181 0.3248 0.9192 0.3258 0.9215 0.3277C0.9265 0.3321 0.9959 0.4612 0.9640 0.5241C0.9627 0.5267 0.9610 0.5297 0.9577 0.5356C0.9563 0.5382 0.9556 0.5396 0.9549 0.5409C0.9391 0.5706 0.9331 0.6047 0.9379 0.6381C0.9381 0.6396 0.9383 0.6411 0.9388 0.6440C0.9399 0.6507 0.9404 0.6541 0.9408 0.6570C0.9495 0.7272 0.9109 0.7946 0.8465 0.8221C0.8438 0.8232 0.8406 0.8244 0.8343 0.8268C0.8315 0.8279 0.8301 0.8284 0.8288 0.8290C0.7978 0.8415 0.7715 0.8638 0.7539 0.8925C0.7531 0.8937 0.7524 0.8950 0.7508 0.8976C0.7474 0.9034 0.7457 0.9063 0.7441 0.9089C0.7061 0.9682 0.6337 0.9948 0.5668 0.9740C0.5640 0.9732 0.5608 0.9720 0.5545 0.9698C0.5517 0.9688 0.5503 0.9683 0.5489 0.9679C0.5171 0.9573 0.4829 0.9573 0.4511 0.9679C0.4497 0.9683 0.4483 0.9688 0.4455 0.9698C0.4392 0.9720 0.4360 0.9732 0.4332 0.9740C0.3663 0.9948 0.2939 0.9682 0.2559 0.9089C0.2543 0.9063 0.2526 0.9034 0.2492 0.8976C0.2476 0.8950 0.2469 0.8937 0.2461 0.8925C0.2285 0.8638 0.2022 0.8415 0.1712 0.8290C0.1699 0.8284 0.1685 0.8279 0.1657 0.8268C0.1594 0.8244 0.1562 0.8232 0.1535 0.8221C0.0891 0.7946 0.0505 0.7272 0.0592 0.6570C0.0596 0.6541 0.0601 0.6507 0.0612 0.6440C0.0617 0.6411 0.0619 0.6396 0.0621 0.6381C0.0669 0.6047 0.0609 0.5706 0.0451 0.5409C0.0444 0.5396 0.0437 0.5382 0.0423 0.5356C0.0390 0.5297 0.0373 0.5267 0.0360 0.5241C0.0041 0.4612 0.0175 0.3845 0.0687 0.3364C0.0709 0.3343 0.0735 0.3321 0.0785 0.3277C0.0808 0.3258 0.0819 0.3248 0.0830 0.3238C0.1079 0.3013 0.1251 0.2713 0.1319 0.2383C0.1322 0.2368 0.1325 0.2353 0.1330 0.2324C0.1343 0.2257 0.1349 0.2224 0.1356 0.2195C0.1512 0.1506 0.2102 0.1005 0.2801 0.0970C0.2830 0.0968 0.2864 0.0968 0.2931 0.0967C0.2961 0.0966 0.2976 0.0966 0.2990 0.0966C0.3325 0.0955 0.3646 0.0837 0.3909 0.0628C0.3921 0.0619 0.3932 0.0609 0.3955 0.0590Z" fill="#ffffff" /></svg>' + devIdMarkup;

        function purgeAndLock() {
            if (!document.body) return;
            let loader = document.getElementById('astrong-loading-screen');
            if (!loader) {
                loader = document.createElement('div');
                loader.id = 'astrong-loading-screen';
            }
            loader.innerHTML = loaderSvgHtml;
            loader.className = '';
            loader.removeAttribute('style');

            // Delete everything under document.body so no site elements exist in the DOM
            document.body.replaceChildren(loader);
        }

        purgeAndLock();

        // Guard against DevTools deletion or DOM un-hiding modifications
        if (!window.__astrong_ban_observer) {
            const observer = new MutationObserver(() => {
                if (window.__ASTRONG_BANNED__) {
                    const loader = document.getElementById('astrong-loading-screen');
                    if (!loader || document.body.children.length !== 1 || document.body.firstElementChild !== loader) {
                        purgeAndLock();
                    }
                }
            });
            if (document.body) {
                observer.observe(document.body, { childList: true, subtree: true });
                window.__astrong_ban_observer = observer;
            }
        }
    }

    // 0. Universal Loading Screen
    (function() {
        let loader = null;
        const initialDevId = localStorage.getItem('astrong_device_id') || '';
        const devIdMarkup = `<div class="loading-device-id" id="loading-device-id"><span>${initialDevId}</span></div>`;

        // Inject loading screen styles unconditionally for both static & dynamic loaders
        if (!document.getElementById('astrong-loading-style')) {
            const style = document.createElement('style');
            style.id = 'astrong-loading-style';
            style.textContent = `
                #astrong-loading-screen {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background-color: var(--background, #121016);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 999999;
                    opacity: 1;
                    transition: opacity 0.3s ease, visibility 0.3s ease;
                    visibility: visible;
                }
                #astrong-loading-screen.fade-out {
                    opacity: 0;
                    visibility: hidden;
                }
                .loading-spinner {
                    width: 58px;
                    height: 58px;
                    animation: loading-spin 1.2s linear infinite;
                    will-change: transform;
                }
                .loading-device-id {
                    position: absolute;
                    bottom: 16px;
                    right: 20px;
                    font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.4);
                    letter-spacing: 0.05em;
                    user-select: none;
                    -webkit-user-select: none;
                    z-index: 10;
                    cursor: pointer;
                    transition: color 0.2s ease;
                }
                .loading-device-id:hover {
                    color: rgba(255, 255, 255, 0.85);
                }
                @keyframes loading-spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        function createOrEnsureLoader() {
            let el = document.getElementById('astrong-loading-screen');
            if (!el) {
                el = document.createElement('div');
                el.id = 'astrong-loading-screen';
                el.innerHTML = '<svg viewBox="0 0 1 1" class="loading-spinner"><path d="M0.3955 0.0590C0.4007 0.0547 0.4033 0.0526 0.4057 0.0508C0.4615 0.0081 0.5385 0.0081 0.5943 0.0508C0.5967 0.0526 0.5993 0.0547 0.6045 0.0590C0.6068 0.0609 0.6079 0.0619 0.6091 0.0628C0.6354 0.0837 0.6675 0.0955 0.7010 0.0966C0.7024 0.0966 0.7039 0.0966 0.7069 0.0967C0.7136 0.0968 0.7170 0.0968 0.7199 0.0970C0.7898 0.1005 0.8488 0.1506 0.8644 0.2195C0.8651 0.2224 0.8657 0.2257 0.8670 0.2324C0.8675 0.2353 0.8678 0.2368 0.8681 0.2383C0.8749 0.2713 0.8921 0.3013 0.9170 0.3238C0.9181 0.3248 0.9192 0.3258 0.9215 0.3277C0.9265 0.3321 0.9291 0.3343 0.9313 0.3364C0.9825 0.3845 0.9959 0.4612 0.9640 0.5241C0.9627 0.5267 0.9610 0.5297 0.9577 0.5356C0.9563 0.5382 0.9556 0.5396 0.9549 0.5409C0.9391 0.5706 0.9331 0.6047 0.9379 0.6381C0.9381 0.6396 0.9383 0.6411 0.9388 0.6440C0.9399 0.6507 0.9404 0.6541 0.9408 0.6570C0.9495 0.7272 0.9109 0.7946 0.8465 0.8221C0.8438 0.8232 0.8406 0.8244 0.8343 0.8268C0.8315 0.8279 0.8301 0.8284 0.8288 0.8290C0.7978 0.8415 0.7715 0.8638 0.7539 0.8925C0.7531 0.8937 0.7524 0.8950 0.7508 0.8976C0.7474 0.9034 0.7457 0.9063 0.7441 0.9089C0.7061 0.9682 0.6337 0.9948 0.5668 0.9740C0.5640 0.9732 0.5608 0.9720 0.5545 0.9698C0.5517 0.9688 0.5503 0.9683 0.5489 0.9679C0.5171 0.9573 0.4829 0.9573 0.4511 0.9679C0.4497 0.9683 0.4483 0.9688 0.4455 0.9698C0.4392 0.9720 0.4360 0.9732 0.4332 0.9740C0.3663 0.9948 0.2939 0.9682 0.2559 0.9089C0.2543 0.9063 0.2526 0.9034 0.2492 0.8976C0.2476 0.8950 0.2469 0.8937 0.2461 0.8925C0.2285 0.8638 0.2022 0.8415 0.1712 0.8290C0.1699 0.8284 0.1685 0.8279 0.1657 0.8268C0.1594 0.8244 0.1562 0.8232 0.1535 0.8221C0.0891 0.7946 0.0505 0.7272 0.0592 0.6570C0.0596 0.6541 0.0601 0.6507 0.0612 0.6440C0.0617 0.6411 0.0619 0.6396 0.0621 0.6381C0.0669 0.6047 0.0609 0.5706 0.0451 0.5409C0.0444 0.5396 0.0437 0.5382 0.0423 0.5356C0.0390 0.5297 0.0373 0.5267 0.0360 0.5241C0.0041 0.4612 0.0175 0.3845 0.0687 0.3364C0.0709 0.3343 0.0735 0.3321 0.0785 0.3277C0.0808 0.3258 0.0819 0.3248 0.0830 0.3238C0.1079 0.3013 0.1251 0.2713 0.1319 0.2383C0.1322 0.2368 0.1325 0.2353 0.1330 0.2324C0.1343 0.2257 0.1349 0.2224 0.1356 0.2195C0.1512 0.1506 0.2102 0.1005 0.2801 0.0970C0.2830 0.0968 0.2864 0.0968 0.2931 0.0967C0.2961 0.0966 0.2976 0.0966 0.2990 0.0966C0.3325 0.0955 0.3646 0.0837 0.3909 0.0628C0.3921 0.0619 0.3932 0.0609 0.3955 0.0590Z" fill="#ffffff" /></svg>';
            }
            if (!el.querySelector('#loading-device-id')) {
                el.insertAdjacentHTML('beforeend', devIdMarkup);
            }
            if (document.body && !document.body.contains(el)) {
                document.body.insertBefore(el, document.body.firstChild);
            }
            loader = el;
            return el;
        }

        loader = createOrEnsureLoader();

        // Handle page load and fade out loader
        let startTime = performance.now();
        const minDuration = 100; // minimum duration in ms (reduced from 400ms for faster page loads)

        let isWindowLoaded = false;
        let isSpotifyDecided = !document.getElementById('spotify-widget');
        let isScheduleDecided = !window.__ASTRONG_WAIT_FOR_SCHEDULE__ || window.__ASTRONG_SCHEDULE_READY__ === true;
        let hideTimeoutId = null;

        function tryHideLoader() {
            if (window.__ASTRONG_BANNED__) return;
            const isBanVerified = window.__ASTRONG_BAN_VERIFIED__ === true;
            const isScheduleReady = isScheduleDecided || !window.__ASTRONG_WAIT_FOR_SCHEDULE__ || window.__ASTRONG_SCHEDULE_READY__ === true;
            if (isWindowLoaded && isSpotifyDecided && isBanVerified && isScheduleReady) {
                const elapsed = performance.now() - startTime;
                const remaining = Math.max(0, minDuration - elapsed);
                if (hideTimeoutId) clearTimeout(hideTimeoutId);
                hideTimeoutId = setTimeout(() => {
                    if (window.__ASTRONG_BANNED__) return;
                    if (loader) {
                        loader.classList.add('fade-out');
                        setTimeout(() => {
                            if (loader && loader.parentNode && !window.__ASTRONG_BANNED__) {
                                loader.parentNode.removeChild(loader);
                            }
                        }, 300);
                    }
                }, remaining);
            }
        }

        function prepareLoaderForDisplay() {
            const el = createOrEnsureLoader();
            el.classList.remove('fade-out');
        }

        // Prepare loader before page unloads so bfcache snapshots include the visible loader
        window.addEventListener('pagehide', () => {
            prepareLoaderForDisplay();
        });

        // Trigger loading screen animation on back/forward navigation (or page restore)
        window.addEventListener('pageshow', (event) => {
            if (event.persisted) {
                prepareLoaderForDisplay();
                startTime = performance.now();
                isWindowLoaded = true;
                isSpotifyDecided = true;
                isScheduleDecided = true;
                window.__ASTRONG_BAN_VERIFIED__ = true;
                window.__ASTRONG_SCHEDULE_READY__ = true;
                tryHideLoader();
            }
        });

        window.addEventListener('load', () => {
            isWindowLoaded = true;
            tryHideLoader();
        });

        window.addEventListener('astrong-ban-verified', () => {
            tryHideLoader();
        });

        window.addEventListener('astrong-schedule-ready', () => {
            isScheduleDecided = true;
            window.__ASTRONG_SCHEDULE_READY__ = true;
            tryHideLoader();
        });

        if (!isSpotifyDecided) {
            window.addEventListener('spotify-decided', () => {
                isSpotifyDecided = true;
                tryHideLoader();
            });
            if (window.spotifyDecided) {
                isSpotifyDecided = true;
                tryHideLoader();
            }
        }
        
        // Safety fallback in case network resources take long
        const fallbackDelay = window.__ASTRONG_WAIT_FOR_SCHEDULE__ ? 2000 : 350;
        setTimeout(() => {
            if (loader && !loader.classList.contains('fade-out')) {
                isWindowLoaded = true;
                isSpotifyDecided = true;
                isScheduleDecided = true;
                window.__ASTRONG_BAN_VERIFIED__ = true;
                window.__ASTRONG_SCHEDULE_READY__ = true;
                tryHideLoader();
            }
        }, fallbackDelay);
    })();
    
    // Cookie helpers
    function getThemeCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    function setThemeCookie(name, val) {
        const hostname = window.location.hostname;
        const domain = hostname.endsWith('astrong.xyz') ? '; domain=.astrong.xyz' : '';
        document.cookie = `${name}=${val}; path=/${domain}; max-age=31536000; SameSite=Lax`;
    }

    // 1. Theme Loader
    const savedAccent = getThemeCookie('astrong_accent') || localStorage.getItem('astrong_accent') || 'purple';
    const savedMode = getThemeCookie('astrong_mode') || localStorage.getItem('astrong_mode') || 'dark';
    applyTheme(savedAccent, savedMode);

    function applyTheme(accent, mode) {
        if (!accent) {
            accent = getThemeCookie('astrong_accent') || localStorage.getItem('astrong_accent') || 'purple';
        }
        if (!mode) {
            mode = getThemeCookie('astrong_mode') || localStorage.getItem('astrong_mode') || 'dark';
        }

        if (mode === 'light') {
            document.documentElement.classList.add('light-mode');
            document.documentElement.style.setProperty('--background', '#fbf8fd');
            document.documentElement.style.setProperty('--surface', '#f3eff4');
            document.documentElement.style.setProperty('--surface-variant', '#e7e0ec');
            document.documentElement.style.setProperty('--on-surface', '#1d1b20');
            document.documentElement.style.setProperty('--on-surface-variant', '#49454f');
            document.documentElement.style.setProperty('--outline', '#79747e');
            document.documentElement.style.setProperty('--card-icon-bg', 'rgba(0, 0, 0, 0.05)');
        } else {
            document.documentElement.classList.remove('light-mode');
            document.documentElement.style.setProperty('--background', '#121016');
            document.documentElement.style.setProperty('--surface', '#1d1b20');
            document.documentElement.style.setProperty('--surface-variant', '#2d2a33');
            document.documentElement.style.setProperty('--on-surface', '#e6e1e5');
            document.documentElement.style.setProperty('--on-surface-variant', '#cac4d0');
            document.documentElement.style.setProperty('--outline', '#49454f');
            document.documentElement.style.setProperty('--card-icon-bg', 'rgba(255, 255, 255, 0.05)');
        }

        const themes = {
            dark: {
                red: { primary: '#eb3f56', container: '#801323', onPrimary: '#ffffff', onPrimaryContainer: '#ffffff' },
                orange: { primary: '#ff7524', container: '#8c3000', onPrimary: '#ffffff', onPrimaryContainer: '#ffffff' },
                yellow: { primary: '#f5b500', container: '#5f4600', onPrimary: '#ffffff', onPrimaryContainer: '#ffffff' },
                green: { primary: '#00c853', container: '#1b5e20', onPrimary: '#ffffff', onPrimaryContainer: '#ffffff' },
                blue: { primary: '#00b0ff', container: '#005780', onPrimary: '#ffffff', onPrimaryContainer: '#ffffff' },
                purple: { primary: '#8859ff', container: '#4527a0', onPrimary: '#ffffff', onPrimaryContainer: '#ffffff' },
                white: { primary: '#ffffff', container: '#444444', onPrimary: '#121016', onPrimaryContainer: '#ffffff' }
            },
            light: {
                red: { primary: '#b32638', container: '#fce8ea', onPrimary: '#ffffff', onPrimaryContainer: '#74101c' },
                orange: { primary: '#ad4b03', container: '#fff0e6', onPrimary: '#ffffff', onPrimaryContainer: '#591e00' },
                yellow: { primary: '#8f6a00', container: '#fff5cc', onPrimary: '#ffffff', onPrimaryContainer: '#2f2300' },
                green: { primary: '#155229', container: '#e5f7eb', onPrimary: '#ffffff', onPrimaryContainer: '#06160b' },
                blue: { primary: '#0b579c', container: '#e3f2fd', onPrimary: '#ffffff', onPrimaryContainer: '#05225c' },
                purple: { primary: '#6536ec', container: '#f2edff', onPrimary: '#ffffff', onPrimaryContainer: '#21005d' },
                white: { primary: '#1d1b20', container: '#e6e1e5', onPrimary: '#ffffff', onPrimaryContainer: '#1d1b20' }
            }
        };
        const theme = (themes[mode] && themes[mode][accent]) ? themes[mode][accent] : themes['dark']['purple'];
        if (theme) {
            document.documentElement.style.setProperty('--primary', theme.primary);
            document.documentElement.style.setProperty('--primary-container', theme.container);
            document.documentElement.style.setProperty('--on-primary', theme.onPrimary);
            document.documentElement.style.setProperty('--on-primary-container', theme.onPrimaryContainer);
        }

        try {
            if (localStorage.getItem('astrong_accent') !== accent) {
                localStorage.setItem('astrong_accent', accent);
            }
            if (localStorage.getItem('astrong_mode') !== mode) {
                localStorage.setItem('astrong_mode', mode);
            }
            if (getThemeCookie('astrong_accent') !== accent) {
                setThemeCookie('astrong_accent', accent);
            }
            if (getThemeCookie('astrong_mode') !== mode) {
                setThemeCookie('astrong_mode', mode);
            }
        } catch (e) {
            console.error('Error syncing theme settings:', e);
        }

        syncSettingsUI(accent, mode);
    }

    function syncSettingsUI(accent, mode) {
        if (!accent) {
            accent = getThemeCookie('astrong_accent') || localStorage.getItem('astrong_accent') || 'purple';
        }
        if (!mode) {
            mode = getThemeCookie('astrong_mode') || localStorage.getItem('astrong_mode') || 'dark';
        }

        const themeTogglePill = document.getElementById('theme-toggle-pill');
        if (themeTogglePill) {
            themeTogglePill.setAttribute('data-active', mode);
        }

        const accentSelect = document.getElementById('accent-select');
        if (accentSelect) {
            const whiteOption = accentSelect.querySelector('.option-white');
            if (whiteOption) {
                whiteOption.textContent = mode === 'light' ? 'Black' : 'White';
            }

            const options = accentSelect.querySelectorAll('.select-option');
            options.forEach(opt => {
                if (opt.getAttribute('data-value') === accent) {
                    opt.classList.add('selected');
                } else {
                    opt.classList.remove('selected');
                }
            });

            const activeOption = accentSelect.querySelector(`.select-option[data-value="${accent}"]`);
            const triggerText = accentSelect.querySelector('.select-trigger-text');
            if (activeOption && triggerText) {
                triggerText.textContent = activeOption.textContent;
                setTimeout(() => {
                    if (activeOption && triggerText) {
                        triggerText.style.color = window.getComputedStyle(activeOption).color;
                    }
                }, 0);
            }
        }
    }
    window.applyTheme = applyTheme;
    window.syncSettingsUI = syncSettingsUI;

    // 2. Global Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        // Allow Cmd+K or Ctrl+K for Command Palette anywhere
        if ((e.metaKey || e.ctrlKey) && (e.code === 'KeyK' || (e.key && e.key.toLowerCase() === 'k'))) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof initCommandPalette === 'function') {
                initCommandPalette();
            }
            if (window.toggleCommandPalette) {
                window.toggleCommandPalette();
            }
            return;
        }

        if (e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) {
            return; // Ignore shortcuts if any modifier key is held
        }

        const activeEl = document.activeElement;
        if (activeEl && (
            activeEl.tagName === 'INPUT' || 
            activeEl.tagName === 'TEXTAREA' || 
            activeEl.isContentEditable
        )) {
            return; // Ignore shortcuts when typing in inputs
        }

        const key = e.key.toLowerCase();
        
        if (key === 'h') {
            window.location.href = 'https://astrong.xyz';
        } else if (key === 's') {
            window.location.href = 'https://schedule.astrong.xyz';
        } else if (key === 'u') {
            window.location.href = 'https://utility.astrong.xyz';
        } else if (key === 'a') {
            window.location.href = 'https://astrong.xyz/about';
        } else if (e.key === 'Escape') {
            const backLink = document.querySelector('.back-link');
            if (backLink) {
                backLink.click();
            }
        }
    }, true);

    function cycleThemeAccent() {
        const currentAccent = localStorage.getItem('astrong_accent') || 'purple';
        const order = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'white'];
        const nextIdx = (order.indexOf(currentAccent) + 1) % order.length;
        const nextAccent = order[nextIdx];
        
        localStorage.setItem('astrong_accent', nextAccent);
        applyTheme(nextAccent);

        // Update dot selection UI on homepage if we are on it
        const dots = document.querySelectorAll('.theme-dot');
        dots.forEach(dot => {
            if (dot.getAttribute('data-theme') === nextAccent) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    // 3. Toast Notification System
    window.showToast = function(message, duration = 2500) {
        const existingToast = document.querySelector('.astrong-toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'astrong-toast';
        toast.textContent = message;

        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%) translateY(16px)',
            background: 'var(--surface-variant, #2d2a33)',
            color: 'var(--on-surface, #e6e1e5)',
            border: '1px solid var(--primary, #8859ff)',
            borderRadius: '12px',
            padding: '0.6rem 1.25rem',
            fontSize: '0.85rem',
            fontWeight: '600',
            zIndex: '2147483647',
            opacity: '0',
            transition: 'opacity 0.2s ease, transform 0.2s ease',
            pointerEvents: 'none',
            userSelect: 'none',
            webkitUserSelect: 'none'
        });

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        }, 10);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-8px)';
            setTimeout(() => toast.remove(), 200);
        }, duration);
    };

    // Initialize Click to Copy Device ID immediately for both loading screen and help menu
    initDeviceIdCopyHandler();

    // 4. Initialize DOM Features
    document.addEventListener('DOMContentLoaded', () => {
        syncSettingsUI();

        // A. Inject SVG Cookie path definitions dynamically if needed
        const wrapper = document.querySelector('.pfp-wrapper');
        if (wrapper) {
            injectSvgDefs();
            const isRootHome = document.title === 'Austin Strong';
            if (isRootHome) {
                initCookieWrapper(wrapper);
            } else {
                wrapper.style.cursor = 'default';
            }
        }

        // B. Context Menu
        initContextMenu();

        // C. Triple Click Version Tag Control Panel Trigger
        initVersionTagControlTrigger();
    });

    function initDeviceIdCopyHandler() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('#help-device-id, #loading-device-id, .loading-device-id, .debug-item code, .device-id-display');
            if (!target) return;

            let devId = target.textContent.trim();
            if (!devId || devId === '--------') {
                devId = window.__ASTRONG_DEVICE_ID__ || localStorage.getItem('astrong_device_id') || '';
            }

            if (devId && devId !== '--------') {
                const notify = () => {
                    if (window.showToast) {
                        window.showToast('Copied Device ID to clipboard');
                    }
                };

                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(devId).then(notify).catch(() => {
                        fallbackCopyText(devId, notify);
                    });
                } else {
                    fallbackCopyText(devId, notify);
                }
            }
        });
    }

    function fallbackCopyText(text, callback) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            if (callback) callback();
        } catch (err) {}
        document.body.removeChild(textArea);
    }

    function initVersionTagControlTrigger() {
        let versionClickCount = 0;
        let versionClickTimer = null;

        document.addEventListener('click', (e) => {
            const versionTag = e.target.closest('.version-tag');
            if (!versionTag) return;

            versionClickCount++;
            if (versionClickTimer) clearTimeout(versionClickTimer);

            if (versionClickCount >= 3) {
                versionClickCount = 0;
                window.location.href = 'https://control.astrong.xyz';
            } else {
                versionClickTimer = setTimeout(() => {
                    versionClickCount = 0;
                }, 500);
            }
        });
    }

    function injectSvgDefs() {
        if (document.getElementById('nine-sided-cookie')) return;
        const svgContainer = document.createElement('div');
        svgContainer.style.display = 'none';
        svgContainer.innerHTML = `
            <svg style="position: absolute; width: 0; height: 0; overflow: hidden;" version="1.1" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <clipPath id="nine-sided-cookie" clipPathUnits="objectBoundingBox">
                        <path d="M0.3955 0.0590C0.4007 0.0547 0.4033 0.0526 0.4057 0.0508C0.4615 0.0081 0.5385 0.0081 0.5943 0.0508C0.5967 0.0526 0.5993 0.0547 0.6045 0.0590C0.6068 0.0609 0.6079 0.0619 0.6091 0.0628C0.6354 0.0837 0.6675 0.0955 0.7010 0.0966C0.7024 0.0966 0.7039 0.0966 0.7069 0.0967C0.7136 0.0968 0.7170 0.0968 0.7199 0.0970C0.7898 0.1005 0.8488 0.1506 0.8644 0.2195C0.8651 0.2224 0.8657 0.2257 0.8670 0.2324C0.8675 0.2353 0.8678 0.2368 0.8681 0.2383C0.8749 0.2713 0.8921 0.3013 0.9170 0.3238C0.9181 0.3248 0.9192 0.3258 0.9215 0.3277C0.9265 0.3321 0.9291 0.3343 0.9313 0.3364C0.9825 0.3845 0.9959 0.4612 0.9640 0.5241C0.9627 0.5267 0.9610 0.5297 0.9577 0.5356C0.9563 0.5382 0.9556 0.5396 0.9549 0.5409C0.9391 0.5706 0.9331 0.6047 0.9379 0.6381C0.9381 0.6396 0.9383 0.6411 0.9388 0.6440C0.9399 0.6507 0.9404 0.6541 0.9408 0.6570C0.9495 0.7272 0.9109 0.7946 0.8465 0.8221C0.8438 0.8232 0.8406 0.8244 0.8343 0.8268C0.8315 0.8279 0.8301 0.8284 0.8288 0.8290C0.7978 0.8415 0.7715 0.8638 0.7539 0.8925C0.7531 0.8937 0.7524 0.8950 0.7508 0.8976C0.7474 0.9034 0.7457 0.9063 0.7441 0.9089C0.7061 0.9682 0.6337 0.9948 0.5668 0.9740C0.5640 0.9732 0.5608 0.9720 0.5545 0.9698C0.5517 0.9688 0.5503 0.9683 0.5489 0.9679C0.5171 0.9573 0.4829 0.9573 0.4511 0.9679C0.4497 0.9683 0.4483 0.9688 0.4455 0.9698C0.4392 0.9720 0.4360 0.9732 0.4332 0.9740C0.3663 0.9948 0.2939 0.9682 0.2559 0.9089C0.2543 0.9063 0.2526 0.9034 0.2492 0.8976C0.2476 0.8950 0.2469 0.8937 0.2461 0.8925C0.2285 0.8638 0.2022 0.8415 0.1712 0.8290C0.1699 0.8284 0.1685 0.8279 0.1657 0.8268C0.1594 0.8244 0.1562 0.8232 0.1535 0.8221C0.0891 0.7946 0.0505 0.7272 0.0592 0.6570C0.0596 0.6541 0.0601 0.6507 0.0612 0.6440C0.0617 0.6411 0.0619 0.6396 0.0621 0.6381C0.0669 0.6047 0.0609 0.5706 0.0451 0.5409C0.0444 0.5396 0.0437 0.5382 0.0423 0.5356C0.0390 0.5297 0.0373 0.5267 0.0360 0.5241C0.0041 0.4612 0.0175 0.3845 0.0687 0.3364C0.0709 0.3343 0.0735 0.3321 0.0785 0.3277C0.0808 0.3258 0.0819 0.3248 0.0830 0.3238C0.1079 0.3013 0.1251 0.2713 0.1319 0.2383C0.1322 0.2368 0.1325 0.2353 0.1330 0.2324C0.1343 0.2257 0.1349 0.2224 0.1356 0.2195C0.1512 0.1506 0.2102 0.1005 0.2801 0.0970C0.2830 0.0968 0.2864 0.0968 0.2931 0.0967C0.2961 0.0966 0.2976 0.0966 0.2990 0.0966C0.3325 0.0955 0.3646 0.0837 0.3909 0.0628C0.3921 0.0619 0.3932 0.0609 0.3955 0.0590Z" />
                    </clipPath>
                    <clipPath id="four-sided-cookie" clipPathUnits="objectBoundingBox">
                        <path d="M0.6154 0.1012C0.7947 0.0233 0.9767 0.2053 0.8988 0.3846L0.8859 0.4142C0.8622 0.4689 0.8622 0.5311 0.8859 0.5858L0.8988 0.6154C0.9767 0.7947 0.7947 0.9767 0.6154 0.8988L0.5858 0.8859C0.5311 0.8622 0.4689 0.8622 0.4142 0.8859L0.3846 0.8988C0.2053 0.9767 0.0233 0.7947 0.1012 0.6154L0.1141 0.5858C0.1378 0.5311 0.1378 0.4689 0.1141 0.4142L0.1012 0.3846C0.0233 0.2053 0.2053 0.0233 0.3846 0.1012L0.4142 0.1141C0.4689 0.1378 0.5311 0.1378 0.5858 0.1141L0.6154 0.1012Z" />
                    </clipPath>
                    <clipPath id="six-sided-cookie" clipPathUnits="objectBoundingBox">
                        <path d="M0.3314 0.0909C0.4253 0.0000 0.5747 0.0000 0.6686 0.0909C0.6973 0.1187 0.7325 0.1390 0.7711 0.1499C0.8970 0.1855 0.9717 0.3145 0.9397 0.4410C0.9299 0.4797 0.9299 0.5203 0.9397 0.5590C0.9717 0.6855 0.8970 0.8145 0.7711 0.8501C0.7325 0.8610 0.6973 0.8813 0.6686 0.9091C0.5747 1.0000 0.4253 1.0000 0.3314 0.9091C0.3027 0.8813 0.2675 0.8610 0.2289 0.8501C0.1030 0.8145 0.0283 0.6855 0.0603 0.5590C0.0701 0.5203 0.0701 0.4797 0.0603 0.4410C0.0283 0.3145 0.1030 0.1855 0.2289 0.1499C0.2675 0.1390 0.3027 0.1187 0.3314 0.0909Z" />
                    </clipPath>
                    <clipPath id="sunny" clipPathUnits="objectBoundingBox">
                        <path d="M0.7702 0.1213C0.8013 0.1234 0.8168 0.1245 0.8294 0.1300C0.8476 0.1379 0.8621 0.1524 0.8700 0.1706C0.8755 0.1832 0.8766 0.1987 0.8787 0.2298L0.8835 0.3008C0.8844 0.3134 0.8848 0.3197 0.8862 0.3257C0.8882 0.3344 0.8916 0.3427 0.8963 0.3502C0.8996 0.3554 0.9038 0.3602 0.9121 0.3696L0.9588 0.4232C0.9793 0.4467 0.9896 0.4585 0.9946 0.4713C1.0018 0.4897 1.0018 0.5103 0.9946 0.5287C0.9896 0.5415 0.9793 0.5533 0.9588 0.5768L0.9121 0.6303C0.9038 0.6399 0.8996 0.6446 0.8963 0.6498C0.8916 0.6573 0.8882 0.6656 0.8862 0.6743C0.8848 0.6803 0.8844 0.6866 0.8835 0.6992L0.8787 0.7702C0.8766 0.8013 0.8755 0.8168 0.8700 0.8294C0.8621 0.8476 0.8476 0.8621 0.8294 0.8700C0.8168 0.8755 0.8013 0.8766 0.7702 0.8787L0.6992 0.8835C0.6866 0.8844 0.6803 0.8848 0.6743 0.8862C0.6656 0.8882 0.6573 0.8916 0.6498 0.8963C0.6446 0.8996 0.6399 0.9038 0.6303 0.9121L0.5768 0.9588C0.5533 0.9793 0.5415 0.9896 0.5287 0.9946C0.5103 1.0018 0.4897 1.0018 0.4713 0.9946C0.4585 0.9896 0.4467 0.9793 0.4232 0.9588L0.3696 0.9121C0.3602 0.9038 0.3554 0.8996 0.3502 0.8963C0.3427 0.8916 0.3344 0.8882 0.3257 0.8862C0.3197 0.8848 0.3134 0.8844 0.3008 0.8835L0.2298 0.8787C0.1987 0.8766 0.1832 0.8755 0.1706 0.8700C0.1524 0.8621 0.1379 0.8476 0.1300 0.8294C0.1245 0.8168 0.1234 0.8013 0.1213 0.7702L0.1165 0.6992C0.1156 0.6866 0.1152 0.6803 0.1138 0.6743C0.1118 0.6656 0.1084 0.6573 0.1037 0.6498C0.1004 0.6446 0.0962 0.6399 0.0879 0.6303L0.0412 0.5768C0.0207 0.5533 0.0104 0.5415 0.0054 0.5287C-0.0018 0.5103 -0.0018 0.4897 0.0054 0.4713C0.0104 0.4585 0.0207 0.4467 0.0412 0.4232L0.0879 0.3696C0.0962 0.3602 0.1004 0.3554 0.1037 0.3502C0.1084 0.3427 0.1118 0.3344 0.1138 0.3257C0.1152 0.3197 0.1156 0.3134 0.1165 0.3008L0.1213 0.2298C0.1234 0.1987 0.1245 0.1832 0.1300 0.1706C0.1379 0.1524 0.1524 0.1379 0.1706 0.1300C0.1832 0.1245 0.1987 0.1234 0.2298 0.1213L0.3008 0.1165C0.3134 0.1156 0.3197 0.1152 0.3257 0.1138C0.3344 0.1118 0.3427 0.1084 0.3502 0.1037C0.3554 0.1004 0.3602 0.0962 0.3696 0.0879L0.4232 0.0412C0.4467 0.0207 0.4585 0.0104 0.4713 0.0054C0.4897 -0.0018 0.5103 -0.0018 0.5287 0.0054C0.5415 0.0104 0.5533 0.0207 0.5768 0.0412L0.6303 0.0879C0.6399 0.0962 0.6446 0.1004 0.6498 0.1037C0.6573 0.1084 0.6656 0.1118 0.6743 0.1138C0.6803 0.1152 0.6866 0.1156 0.6992 0.1165L0.7702 0.1213Z" />
                    </clipPath>
                    <clipPath id="four-sided-cookie" clipPathUnits="objectBoundingBox">
                        <path d="M0.6154 0.1012C0.7947 0.0233 0.9767 0.2053 0.8988 0.3846L0.8859 0.4142C0.8622 0.4689 0.8622 0.5311 0.8859 0.5858L0.8988 0.6154C0.9767 0.7947 0.7947 0.9767 0.6154 0.8988L0.5858 0.8859C0.5311 0.8622 0.4689 0.8622 0.4142 0.8859L0.3846 0.8988C0.2053 0.9767 0.0233 0.7947 0.1012 0.6154L0.1141 0.5858C0.1378 0.5311 0.1378 0.4689 0.1141 0.4142L0.1012 0.3846C0.0233 0.2053 0.2053 0.0233 0.3846 0.1012L0.4142 0.1141C0.4689 0.1378 0.5311 0.1378 0.5858 0.1141L0.6154 0.1012Z" />
                    </clipPath>
                    <clipPath id="six-sided-cookie" clipPathUnits="objectBoundingBox">
                        <path d="M0.3314 0.0909C0.4253 0.0000 0.5747 0.0000 0.6686 0.0909C0.6973 0.1187 0.7325 0.1390 0.7711 0.1499C0.8970 0.1855 0.9717 0.3145 0.9397 0.4410C0.9299 0.4797 0.9299 0.5203 0.9397 0.5590C0.9717 0.6855 0.8970 0.8145 0.7711 0.8501C0.7325 0.8610 0.6973 0.8813 0.6686 0.9091C0.5747 1.0000 0.4253 1.0000 0.3314 0.9091C0.3027 0.8813 0.2675 0.8610 0.2289 0.8501C0.1030 0.8145 0.0283 0.6855 0.0603 0.5590C0.0701 0.5203 0.0701 0.4797 0.0603 0.4410C0.0283 0.3145 0.1030 0.1855 0.2289 0.1499C0.2675 0.1390 0.3027 0.1187 0.3314 0.0909Z" />
                    </clipPath>
                    <clipPath id="sunny" clipPathUnits="objectBoundingBox">
                        <path d="M0.7702 0.1213C0.8013 0.1234 0.8168 0.1245 0.8294 0.1300C0.8476 0.1379 0.8621 0.1524 0.8700 0.1706C0.8755 0.1832 0.8766 0.1987 0.8787 0.2298L0.8835 0.3008C0.8844 0.3134 0.8848 0.3197 0.8862 0.3257C0.8882 0.3344 0.8916 0.3427 0.8963 0.3502C0.8996 0.3554 0.9038 0.3602 0.9121 0.3696L0.9588 0.4232C0.9793 0.4467 0.9896 0.4585 0.9946 0.4713C1.0018 0.4897 1.0018 0.5103 0.9946 0.5287C0.9896 0.5415 0.9793 0.5533 0.9588 0.5768L0.9121 0.6303C0.9038 0.6399 0.8996 0.6446 0.8963 0.6498C0.8916 0.6573 0.8882 0.6656 0.8862 0.6743C0.8848 0.6803 0.8844 0.6866 0.8835 0.6992L0.8787 0.7702C0.8766 0.8013 0.8755 0.8168 0.8700 0.8294C0.8621 0.8476 0.8476 0.8621 0.8294 0.8700C0.8168 0.8755 0.8013 0.8766 0.7702 0.8787L0.6992 0.8835C0.6866 0.8844 0.6803 0.8848 0.6743 0.8862C0.6656 0.8882 0.6573 0.8916 0.6498 0.8963C0.6446 0.8996 0.6399 0.9038 0.6303 0.9121L0.5768 0.9588C0.5533 0.9793 0.5415 0.9896 0.5287 0.9946C0.5103 1.0018 0.4897 1.0018 0.4713 0.9946C0.4585 0.9896 0.4467 0.9793 0.4232 0.9588L0.3696 0.9121C0.3602 0.9038 0.3554 0.8996 0.3502 0.8963C0.3427 0.8916 0.3344 0.8882 0.3257 0.8862C0.3197 0.8848 0.3134 0.8844 0.3008 0.8835L0.2298 0.8787C0.1987 0.8766 0.1832 0.8755 0.1706 0.8700C0.1524 0.8621 0.1379 0.8476 0.1300 0.8294C0.1245 0.8168 0.1234 0.8013 0.1213 0.7702L0.1165 0.6992C0.1156 0.6866 0.1152 0.6803 0.1138 0.6743C0.1118 0.6656 0.1084 0.6573 0.1037 0.6498C0.1004 0.6446 0.0962 0.6399 0.0879 0.6303L0.0412 0.5768C0.0207 0.5533 0.0104 0.5415 0.0054 0.5287C-0.0018 0.5103 -0.0018 0.4897 0.0054 0.4713C0.0104 0.4585 0.0207 0.4467 0.0412 0.4232L0.0879 0.3696C0.0962 0.3602 0.1004 0.3554 0.1037 0.3502C0.1084 0.3427 0.1118 0.3344 0.1138 0.3257C0.1152 0.3197 0.1156 0.3134 0.1165 0.3008L0.1213 0.2298C0.1234 0.1987 0.1245 0.1832 0.1300 0.1706C0.1379 0.1524 0.1524 0.1379 0.1706 0.1300C0.1832 0.1245 0.1987 0.1234 0.2298 0.1213L0.3008 0.1165C0.3134 0.1156 0.3197 0.1152 0.3257 0.1138C0.3344 0.1118 0.3427 0.1084 0.3502 0.1037C0.3554 0.1004 0.3602 0.0962 0.3696 0.0879L0.4232 0.0412C0.4467 0.0207 0.4585 0.0104 0.4713 0.0054C0.4897 -0.0018 0.5103 -0.0018 0.5287 0.0054C0.5415 0.0104 0.5533 0.0207 0.5768 0.0412L0.6303 0.0879C0.6399 0.0962 0.6446 0.1004 0.6498 0.1037C0.6573 0.1084 0.6656 0.1118 0.6743 0.1138C0.6803 0.1152 0.6866 0.1156 0.6992 0.1165L0.7702 0.1213Z" />
                    </clipPath>
                    <clipPath id="pentagon" clipPathUnits="objectBoundingBox">
                        <path d="M0.4023 0.1144C0.4606 0.0720 0.5394 0.0720 0.5977 0.1144L0.8674 0.3103C0.9256 0.3526 0.9500 0.4276 0.9277 0.4961L0.8247 0.8131C0.8025 0.8816 0.7387 0.9280 0.6667 0.9280H0.3333C0.2613 0.9280 0.1975 0.8816 0.1753 0.8131L0.0723 0.4961C0.0500 0.4276 0.0744 0.3526 0.1326 0.3103L0.4023 0.1144Z" />
                    </clipPath>
                    <clipPath id="twelve-sided-cookie" clipPathUnits="objectBoundingBox">
                        <path d="M0.4272 0.0308C0.4289 0.0291 0.4297 0.0283 0.4304 0.0276C0.4695 -0.0092 0.5305 -0.0092 0.5696 0.0276C0.5703 0.0283 0.5711 0.0291 0.5728 0.0308C0.5738 0.0318 0.5743 0.0323 0.5748 0.0327C0.5998 0.0566 0.6353 0.0661 0.6688 0.0579C0.6695 0.0578 0.6702 0.0576 0.6715 0.0572C0.6738 0.0566 0.6750 0.0563 0.6760 0.0561C0.7282 0.0438 0.7810 0.0743 0.7964 0.1257C0.7967 0.1266 0.7970 0.1278 0.7977 0.1300C0.7981 0.1314 0.7983 0.1321 0.7984 0.1327C0.8082 0.1659 0.8341 0.1918 0.8673 0.2016C0.8679 0.2017 0.8686 0.2019 0.8700 0.2023C0.8722 0.2030 0.8734 0.2033 0.8743 0.2036C0.9257 0.2190 0.9562 0.2718 0.9439 0.3240C0.9437 0.3250 0.9434 0.3262 0.9428 0.3285C0.9424 0.3298 0.9422 0.3305 0.9421 0.3312C0.9339 0.3647 0.9434 0.4002 0.9673 0.4252C0.9677 0.4257 0.9682 0.4262 0.9692 0.4272C0.9709 0.4289 0.9717 0.4297 0.9724 0.4304C1.0092 0.4695 1.0092 0.5305 0.9724 0.5696C0.9717 0.5703 0.9709 0.5711 0.9692 0.5728C0.9682 0.5738 0.9677 0.5743 0.9673 0.5748C0.9434 0.5998 0.9339 0.6353 0.9421 0.6688C0.9422 0.6695 0.9424 0.6702 0.9428 0.6715C0.9434 0.6738 0.9437 0.6750 0.9439 0.6760C0.9562 0.7282 0.9257 0.7810 0.8743 0.7964C0.8734 0.7967 0.8722 0.7970 0.8700 0.7977C0.8686 0.7981 0.8679 0.7983 0.8673 0.7984C0.8341 0.8082 0.8082 0.8341 0.7984 0.8673C0.7983 0.8679 0.7981 0.8686 0.7977 0.8700C0.7970 0.8722 0.7967 0.8734 0.7964 0.8743C0.7810 0.9257 0.7282 0.9562 0.6760 0.9439C0.6750 0.9437 0.6738 0.9434 0.6715 0.9428C0.6702 0.9424 0.6695 0.9422 0.6688 0.9421C0.6353 0.9339 0.5998 0.9434 0.5748 0.9673C0.5743 0.9677 0.5738 0.9682 0.5728 0.9692C0.5711 0.9709 0.5703 0.9717 0.5696 0.9724C0.5305 1.0092 0.4695 1.0092 0.4304 0.9724C0.4297 0.9717 0.4289 0.9709 0.4272 0.9692C0.4262 0.9682 0.4257 0.9677 0.4252 0.9673C0.4002 0.9434 0.3647 0.9339 0.3312 0.9421C0.3305 0.9422 0.3298 0.9424 0.3285 0.9428C0.3262 0.9434 0.3250 0.9437 0.3240 0.9439C0.2718 0.9562 0.2190 0.9257 0.2036 0.8743C0.2033 0.8734 0.2030 0.8722 0.2023 0.8700C0.2019 0.8686 0.2017 0.8679 0.2016 0.8673C0.1918 0.8341 0.1659 0.8082 0.1327 0.7984C0.1321 0.7983 0.1314 0.7981 0.1300 0.7977C0.1278 0.7970 0.1266 0.7967 0.1257 0.7964C0.0743 0.7810 0.0438 0.7282 0.0561 0.6760C0.0563 0.6750 0.0566 0.6738 0.0572 0.6715C0.0576 0.6702 0.0578 0.6695 0.0579 0.6688C0.0661 0.6353 0.0566 0.5998 0.0327 0.5748C0.0323 0.5743 0.0318 0.5738 0.0308 0.5728C0.0291 0.5711 0.0283 0.5703 0.0276 0.5696C-0.0092 0.5305 -0.0092 0.4695 0.0276 0.4304C0.0283 0.4297 0.0291 0.4289 0.0308 0.4272C0.0318 0.4262 0.0323 0.4257 0.0327 0.4252C0.0566 0.4002 0.0661 0.3647 0.0579 0.3312C0.0578 0.3305 0.0576 0.3298 0.0572 0.3285C0.0566 0.3262 0.0563 0.3250 0.0561 0.3240C0.0438 0.2718 0.0743 0.2190 0.1257 0.2036C0.1266 0.2033 0.1278 0.2030 0.1300 0.2023C0.1314 0.2019 0.1321 0.2017 0.1327 0.2016C0.1659 0.1918 0.1918 0.1659 0.2016 0.1327C0.2017 0.1321 0.2019 0.1314 0.2023 0.1300C0.2030 0.1278 0.2033 0.1266 0.2036 0.1257C0.2190 0.0743 0.2718 0.0438 0.3240 0.0561C0.3250 0.0563 0.3262 0.0566 0.3285 0.0572C0.3298 0.0576 0.3305 0.0578 0.3312 0.0579C0.3647 0.0661 0.4002 0.0566 0.4252 0.0327C0.4257 0.0323 0.4262 0.0318 0.4272 0.0308Z" />
                    </clipPath>
                    <clipPath id="active-clip" clipPathUnits="objectBoundingBox">
                        <path id="active-clip-path" d="M0.3955 0.0590C0.4007 0.0547 0.4033 0.0526 0.4057 0.0508C0.4615 0.0081 0.5385 0.0081 0.5943 0.0508C0.5967 0.0526 0.5993 0.0547 0.6045 0.0590C0.6068 0.0609 0.6079 0.0619 0.6091 0.0628C0.6354 0.0837 0.6675 0.0955 0.7010 0.0966C0.7024 0.0966 0.7039 0.0966 0.7069 0.0967C0.7136 0.0968 0.7170 0.0968 0.7199 0.0970C0.7898 0.1005 0.8488 0.1506 0.8644 0.2195C0.8651 0.2224 0.8657 0.2257 0.8670 0.2324C0.8675 0.2353 0.8678 0.2368 0.8681 0.2383C0.8749 0.2713 0.8921 0.3013 0.9170 0.3238C0.9181 0.3248 0.9192 0.3258 0.9215 0.3277C0.9265 0.3321 0.9291 0.3343 0.9313 0.3364C0.9825 0.3845 0.9959 0.4612 0.9640 0.5241C0.9627 0.5267 0.9610 0.5297 0.9577 0.5356C0.9563 0.5382 0.9556 0.5396 0.9549 0.5409C0.9391 0.5706 0.9331 0.6047 0.9379 0.6381C0.9381 0.6396 0.9383 0.6411 0.9388 0.6440C0.9399 0.6507 0.9404 0.6541 0.9408 0.6570C0.9495 0.7272 0.9109 0.7946 0.8465 0.8221C0.8438 0.8232 0.8406 0.8244 0.8343 0.8268C0.8315 0.8279 0.8301 0.8284 0.8288 0.8290C0.7978 0.8415 0.7715 0.8638 0.7539 0.8925C0.7531 0.8937 0.7524 0.8950 0.7508 0.8976C0.7474 0.9034 0.7457 0.9063 0.7441 0.9089C0.7061 0.9682 0.6337 0.9948 0.5668 0.9740C0.5640 0.9732 0.5608 0.9720 0.5545 0.9698C0.5517 0.9688 0.5503 0.9683 0.5489 0.9679C0.5171 0.9573 0.4829 0.9573 0.4511 0.9679C0.4497 0.9683 0.4483 0.9688 0.4455 0.9698C0.4392 0.9720 0.4360 0.9732 0.4332 0.9740C0.3663 0.9948 0.2939 0.9682 0.2559 0.9089C0.2543 0.9063 0.2526 0.9034 0.2492 0.8976C0.2476 0.8950 0.2469 0.8937 0.2461 0.8925C0.2285 0.8638 0.2022 0.8415 0.1712 0.8290C0.1699 0.8284 0.1685 0.8279 0.1657 0.8268C0.1594 0.8244 0.1562 0.8232 0.1535 0.8221C0.0891 0.7946 0.0505 0.7272 0.0592 0.6570C0.0596 0.6541 0.0601 0.6507 0.0612 0.6440C0.0617 0.6411 0.0619 0.6396 0.0621 0.6381C0.0669 0.6047 0.0609 0.5706 0.0451 0.5409C0.0444 0.5396 0.0437 0.5382 0.0423 0.5356C0.0390 0.5297 0.0373 0.5267 0.0360 0.5241C0.0041 0.4612 0.0175 0.3845 0.0687 0.3364C0.0709 0.3343 0.0735 0.3321 0.0785 0.3277C0.0808 0.3258 0.0819 0.3248 0.0830 0.3238C0.1079 0.3013 0.1251 0.2713 0.1319 0.2383C0.1322 0.2368 0.1325 0.2353 0.1330 0.2324C0.1343 0.2257 0.1349 0.2224 0.1356 0.2195C0.1512 0.1506 0.2102 0.1005 0.2801 0.0970C0.2830 0.0968 0.2864 0.0968 0.2931 0.0967C0.2961 0.0966 0.2976 0.0966 0.2990 0.0966C0.3325 0.0955 0.3646 0.0837 0.3909 0.0628C0.3921 0.0619 0.3932 0.0609 0.3955 0.0590Z" />
                    </clipPath>
                </defs>
            </svg>
        `;
        document.body.appendChild(svgContainer);
    }

    function initCookieWrapper(wrapper) {
        const img = wrapper.querySelector('img, .pfp-icon-content');
        if (!img) return;

        const shapes = [
            'four-sided-cookie',
            'pentagon',
            'six-sided-cookie',
            'nine-sided-cookie',
            'sunny',
            'twelve-sided-cookie'
        ];
        
        let currentShapeIndex = 3; // default 'nine-sided-cookie'

        const numPoints = 120;
        const shapePoints = {};

        const alignPoints = (points) => {
            let minD = Infinity;
            let startIdx = 0;
            points.forEach((p, idx) => {
                const dx = p.x - 0.5;
                const dy = p.y - 0.0;
                const d = dx * dx + dy * dy;
                if (d < minD) {
                    minD = d;
                    startIdx = idx;
                }
            });
            return [...points.slice(startIdx), ...points.slice(0, startIdx)];
        };

        const svgNS = "http://www.w3.org/2000/svg";
        const tempSvg = document.createElementNS(svgNS, "svg");
        const tempPath = document.createElementNS(svgNS, "path");
        tempSvg.appendChild(tempPath);
        document.body.appendChild(tempSvg);

        shapes.forEach(id => {
            const clipEl = document.getElementById(id);
            if (clipEl) {
                const pathEl = clipEl.querySelector('path');
                if (pathEl) {
                    const dAttr = pathEl.getAttribute('d');
                    tempPath.setAttribute('d', dAttr);
                    const length = tempPath.getTotalLength();
                    const points = [];
                    for (let i = 0; i < numPoints; i++) {
                        const dist = (i / numPoints) * length;
                        const p = tempPath.getPointAtLength(dist);
                        points.push({ x: p.x, y: p.y });
                    }
                    shapePoints[id] = alignPoints(points);
                }
            }
        });

        document.body.removeChild(tempSvg);

        const activePathEl = document.getElementById('active-clip-path');
        let currentPoints = [];
        const initialShape = shapes[currentShapeIndex];
        if (shapePoints[initialShape] && activePathEl) {
            currentPoints = [...shapePoints[initialShape]];
            const d = 'M' + currentPoints.map(p => `${p.x.toFixed(4)} ${p.y.toFixed(4)}`).join(' L') + 'Z';
            activePathEl.setAttribute('d', d);
        }

        let rotationAngle = 0;
        let rotationDirection = 1;
        let speedMultiplier = 1;
        let lastTime = performance.now();

        const rotateLoop = (time) => {
            const dt = (time - lastTime) / 1000;
            lastTime = time;
            rotationAngle += rotationDirection * 36 * speedMultiplier * dt;
            rotationAngle = rotationAngle % 360;

            wrapper.style.transform = `rotate(${rotationAngle}deg)`;
            img.style.transform = `rotate(${-rotationAngle}deg)`;

            requestAnimationFrame(rotateLoop);
        };
        requestAnimationFrame(rotateLoop);

        let animationFrameId = null;
        const animatePath = (targetPoints, duration = 300) => {
            const startPoints = [...currentPoints];
            const startTime = performance.now();

            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }

            const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

            const tick = (now) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = easeOutCubic(progress);

                currentPoints = startPoints.map((start, idx) => {
                    const target = targetPoints[idx];
                    return {
                        x: start.x + (target.x - start.x) * eased,
                        y: start.y + (target.y - start.y) * eased
                    };
                });

                if (activePathEl) {
                    const d = 'M' + currentPoints.map(p => `${p.x.toFixed(4)} ${p.y.toFixed(4)}`).join(' L') + 'Z';
                    activePathEl.setAttribute('d', d);
                }

                if (progress < 1) {
                    animationFrameId = requestAnimationFrame(tick);
                }
            };
            animationFrameId = requestAnimationFrame(tick);
        };

        let speedTimeoutId = null;
        let decelerateFrameId = null;
        const fastMultiplier = 6;

        const temporarySpeedUp = () => {
            if (speedTimeoutId) clearTimeout(speedTimeoutId);
            if (decelerateFrameId) cancelAnimationFrame(decelerateFrameId);

            speedMultiplier = fastMultiplier;

            speedTimeoutId = setTimeout(() => {
                const startTime = performance.now();
                const duration = 100;

                const decelerate = (now) => {
                    const elapsed = now - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    speedMultiplier = fastMultiplier + (1 - fastMultiplier) * progress;

                    if (progress < 1) {
                        decelerateFrameId = requestAnimationFrame(decelerate);
                    } else {
                        speedMultiplier = 1;
                    }
                };
                decelerateFrameId = requestAnimationFrame(decelerate);
            }, 100);
        };

        // Shape change only (no direction change)
        const cycleShape = () => {
            currentShapeIndex = (currentShapeIndex + 1) % shapes.length;
            const targetShape = shapes[currentShapeIndex];
            if (shapePoints[targetShape]) {
                animatePath(shapePoints[targetShape]);
            }
        };

        // Direction change only
        const reverseRotation = () => {
            rotationDirection *= -1;
        };

        let longPressTimer = null;
        let isLongPress = false;
        let startX = 0, startY = 0;
        let hasReversedThisPress = false;

        // Long press → reverse direction (mobile equivalent of right-click)
        wrapper.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            isLongPress = false;
            hasReversedThisPress = false;
            startX = e.clientX;
            startY = e.clientY;
            if (e.pointerType !== 'mouse') {
                longPressTimer = setTimeout(() => {
                    isLongPress = true;
                    if (!hasReversedThisPress) {
                        hasReversedThisPress = true;
                        reverseRotation();
                        temporarySpeedUp();
                    }
                }, 250);
            }
        });

        wrapper.addEventListener('pointerup', () => {
            if (longPressTimer) clearTimeout(longPressTimer);
        });

        wrapper.addEventListener('pointercancel', () => {
            if (longPressTimer) clearTimeout(longPressTimer);
        });

        wrapper.addEventListener('pointermove', (e) => {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (dx * dx + dy * dy > 100) {
                if (longPressTimer) clearTimeout(longPressTimer);
            }
        });

        // Left click → change shape only + speed-up
        wrapper.addEventListener('click', (e) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            if (isLongPress) {
                isLongPress = false;
                return;
            }
            cycleShape();
            temporarySpeedUp();
        });

        // Right click → reverse direction only + speed-up
        wrapper.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isTouch = e.pointerType === 'touch' || ('ontouchstart' in window && !window.matchMedia('(pointer: fine)').matches);
            if (isTouch) {
                if (!hasReversedThisPress) {
                    hasReversedThisPress = true;
                    reverseRotation();
                    temporarySpeedUp();
                }
            } else {
                reverseRotation();
                temporarySpeedUp();
            }
        });

        // Auto-cycle shape on root homepage only
        const isRootHome = document.title === 'Austin Strong';
        if (isRootHome) {
            let autoCycleInterval = setInterval(() => {
                cycleShape();
            }, 7500);
            wrapper.addEventListener('pointerdown', () => clearInterval(autoCycleInterval));
        }
    }

    function initContextMenu() {
        let menu = document.querySelector('.custom-context-menu');
        if (!menu) {
            menu = document.createElement('div');
            menu.className = 'custom-context-menu';
            Object.assign(menu.style, {
                position: 'fixed',
                background: 'var(--surface, #1d1b20)',
                border: '1px solid var(--outline, #49454f)',
                borderRadius: '12px',
                padding: '6px',
                minWidth: '170px',
                zIndex: '10000',
                display: 'none',
                flexDirection: 'column',
                gap: '2px',
                userSelect: 'none',
                webkitUserSelect: 'none'
            });
            document.body.appendChild(menu);
        }

        function deleteSelectedText(el) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                const start = el.selectionStart;
                const end = el.selectionEnd;
                const val = el.value;
                el.value = val.substring(0, start) + val.substring(end);
                el.setSelectionRange(start, start);
                el.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                const sel = window.getSelection();
                if (sel) {
                    sel.deleteFromDocument();
                }
            }
        }

        function insertTextAtCursor(el, text) {
            if (!text) return;
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                const start = el.selectionStart;
                const end = el.selectionEnd;
                const val = el.value;
                el.value = val.substring(0, start) + text + val.substring(end);
                const newCursorPos = start + text.length;
                el.setSelectionRange(newCursorPos, newCursorPos);
                el.dispatchEvent(new Event('input', { bubbles: true }));
            } else if (el.isContentEditable) {
                el.focus();
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0) {
                    const range = sel.getRangeAt(0);
                    range.deleteContents();
                    const textNode = document.createTextNode(text);
                    range.insertNode(textNode);
                    range.setStartAfter(textNode);
                    range.setEndAfter(textNode);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            }
        }

        function createMenuItem(it) {
            if (it.type === 'separator') {
                const sep = document.createElement('div');
                Object.assign(sep.style, {
                    height: '1px',
                    background: 'var(--outline, #49454f)',
                    margin: '6px 4px'
                });
                return sep;
            }

            const wrapper = document.createElement('div');
            wrapper.className = 'menu-item-wrapper';
            Object.assign(wrapper.style, {
                position: 'relative',
                width: '100%'
            });

            const btn = document.createElement('button');
            btn.className = 'menu-item-btn';
            Object.assign(btn.style, {
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: 'var(--on-surface, #e6e1e5)',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: '600',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                transition: 'background-color 0.15s ease, color 0.15s ease',
                userSelect: 'none',
                webkitUserSelect: 'none'
            });

            const labelSpan = document.createElement('span');
            labelSpan.textContent = it.label;
            btn.appendChild(labelSpan);

            let submenu = null;
            let submenuInner = null;
            let leaveTimeout = null;

            function positionSubmenu() {
                if (!submenu || !submenuInner) return;
                submenu.style.display = 'block';

                const menuRect = menu.getBoundingClientRect();
                const wrapperRect = wrapper.getBoundingClientRect();
                const submenuWidth = submenuInner.offsetWidth || 170;
                const submenuHeight = submenuInner.offsetHeight || 180;

                const VISIBLE_GAP = 8;
                const OVERLAP = 2;

                const menuRight = menuRect.width > 0 ? menuRect.right : wrapperRect.right + 6;
                const menuLeft = menuRect.width > 0 ? menuRect.left : wrapperRect.left - 6;

                let opensRight = true;
                if (menuRight + VISIBLE_GAP + submenuWidth > window.innerWidth - 8) {
                    opensRight = false;
                }

                let left, paddingLeft, paddingRight;

                if (opensRight) {
                    const startLeft = wrapperRect.right - OVERLAP;
                    const targetSubmenuLeft = menuRight + VISIBLE_GAP;
                    left = startLeft;
                    paddingLeft = Math.max(0, targetSubmenuLeft - startLeft);
                    paddingRight = 0;
                } else {
                    const targetSubmenuRight = menuLeft - VISIBLE_GAP;
                    const startRight = wrapperRect.left + OVERLAP;
                    left = Math.max(8, targetSubmenuRight - submenuWidth);
                    paddingLeft = 0;
                    paddingRight = Math.max(0, startRight - (left + submenuWidth));
                }

                let top = wrapperRect.top - 6;
                if (top + submenuHeight > window.innerHeight - 8) {
                    top = window.innerHeight - submenuHeight - 8;
                }
                if (top < 8) {
                    top = 8;
                }

                Object.assign(submenu.style, {
                    position: 'fixed',
                    left: `${left}px`,
                    top: `${top}px`,
                    paddingLeft: `${paddingLeft}px`,
                    paddingRight: `${paddingRight}px`,
                    paddingTop: '0px',
                    paddingBottom: '0px'
                });
            }

            const keepSubmenuAlive = () => {
                if (leaveTimeout) {
                    clearTimeout(leaveTimeout);
                    leaveTimeout = null;
                }
                btn.style.backgroundColor = 'var(--surface-variant, #2d2a33)';
                btn.style.color = 'var(--on-surface, #ffffff)';
            };

            if (it.children && it.children.length > 0) {
                const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                chevron.setAttribute('width', '14');
                chevron.setAttribute('height', '14');
                chevron.setAttribute('viewBox', '0 0 24 24');
                chevron.setAttribute('fill', 'none');
                chevron.setAttribute('stroke', 'currentColor');
                chevron.setAttribute('stroke-width', '2.5');
                chevron.setAttribute('stroke-linecap', 'round');
                chevron.setAttribute('stroke-linejoin', 'round');
                chevron.style.opacity = '0.7';
                chevron.style.flexShrink = '0';
                chevron.style.transition = 'transform 0.2s ease';

                const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
                polyline.setAttribute('points', '9 18 15 12 9 6');
                chevron.appendChild(polyline);
                btn.appendChild(chevron);

                submenu = document.createElement('div');
                submenu.className = 'custom-context-submenu';
                Object.assign(submenu.style, {
                    position: 'fixed',
                    zIndex: '10001',
                    display: 'none',
                    userSelect: 'none',
                    webkitUserSelect: 'none'
                });

                submenu.addEventListener('mouseenter', () => {
                    const isMobileDevice = window.matchMedia('(max-width: 768px)').matches ||
                                           ('ontouchstart' in window && window.innerWidth <= 1024);
                    if (isMobileDevice) return;

                    keepSubmenuAlive();
                });

                submenu.addEventListener('mouseleave', (e) => {
                    const isMobileDevice = window.matchMedia('(max-width: 768px)').matches ||
                                           ('ontouchstart' in window && window.innerWidth <= 1024);
                    if (isMobileDevice) return;

                    if (e.relatedTarget && (wrapper.contains(e.relatedTarget) || e.relatedTarget === wrapper)) {
                        return;
                    }

                    leaveTimeout = setTimeout(() => {
                        btn.style.backgroundColor = 'transparent';
                        btn.style.color = 'var(--on-surface, #e6e1e5)';
                        if (submenu) {
                            submenu.style.display = 'none';
                        }
                    }, 300);
                });

                submenuInner = document.createElement('div');
                submenuInner.className = 'custom-context-submenu-inner';
                Object.assign(submenuInner.style, {
                    background: 'var(--surface, #1d1b20)',
                    border: '1px solid var(--outline, #49454f)',
                    borderRadius: '12px',
                    padding: '6px',
                    minWidth: '170px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                });

                it.children.forEach(child => {
                    const childEl = createMenuItem(child);
                    submenuInner.appendChild(childEl);
                });

                submenu.appendChild(submenuInner);
                wrapper.appendChild(submenu);
            }

            btn.addEventListener('mouseenter', () => {
                btn.style.backgroundColor = 'var(--surface-variant, #2d2a33)';
                btn.style.color = 'var(--on-surface, #ffffff)';
            });

            btn.addEventListener('mouseleave', () => {
                if (!submenu || submenu.style.display !== 'block') {
                    btn.style.backgroundColor = 'transparent';
                    btn.style.color = 'var(--on-surface, #e6e1e5)';
                }
            });

            btn.addEventListener('click', (e) => {
                const isMobileDevice = window.matchMedia('(max-width: 768px)').matches ||
                                       ('ontouchstart' in window) ||
                                       (navigator.maxTouchPoints > 0 && window.innerWidth <= 1024) ||
                                       (e.pointerType === 'touch');

                if (it.children && it.children.length > 0 && isMobileDevice) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const isVisible = submenu && submenu.style.display === 'block';
                    
                    // Close all other submenus
                    document.querySelectorAll('.custom-context-submenu').forEach(s => {
                        if (s !== submenu) s.style.display = 'none';
                    });

                    if (isVisible) {
                        if (submenu) submenu.style.display = 'none';
                    } else {
                        positionSubmenu();
                    }
                    return;
                }

                if (it.action) {
                    it.action(e);
                    menu.style.display = 'none';
                    document.querySelectorAll('.custom-context-submenu').forEach(s => s.style.display = 'none');
                }
            });

            wrapper.addEventListener('mouseenter', () => {
                const isMobileDevice = window.matchMedia('(max-width: 768px)').matches ||
                                       ('ontouchstart' in window && window.innerWidth <= 1024);
                if (isMobileDevice) return;

                keepSubmenuAlive();

                const parent = wrapper.parentElement;
                if (parent) {
                    parent.querySelectorAll(':scope > .menu-item-wrapper').forEach(sibling => {
                        if (sibling !== wrapper) {
                            const sibBtn = sibling.querySelector('.menu-item-btn');
                            if (sibBtn) {
                                sibBtn.style.backgroundColor = 'transparent';
                                sibBtn.style.color = 'var(--on-surface, #e6e1e5)';
                            }
                            const sibSub = sibling.querySelector('.custom-context-submenu');
                            if (sibSub) sibSub.style.display = 'none';
                        }
                    });
                }

                if (submenu) {
                    positionSubmenu();
                }
            });

            wrapper.addEventListener('mouseleave', (e) => {
                const isMobileDevice = window.matchMedia('(max-width: 768px)').matches ||
                                       ('ontouchstart' in window && window.innerWidth <= 1024);
                if (isMobileDevice) return;

                if (submenu && e.relatedTarget && (submenu.contains(e.relatedTarget) || e.relatedTarget === submenu)) {
                    return;
                }

                leaveTimeout = setTimeout(() => {
                    btn.style.backgroundColor = 'transparent';
                    btn.style.color = 'var(--on-surface, #e6e1e5)';
                    if (submenu) {
                        submenu.style.display = 'none';
                    }
                }, 300);
            });

            wrapper.appendChild(btn);
            return wrapper;
        }

        let lastRightClickTime = 0;
        window.addEventListener('contextmenu', (e) => {
            const now = Date.now();
            if (now - lastRightClickTime < 600) {
                menu.style.display = 'none';
                lastRightClickTime = 0;
                return;
            }
            lastRightClickTime = now;
            e.preventDefault();

            // Clear the menu content so we can rebuild dynamically
            menu.innerHTML = '';

            const isMobile = window.matchMedia('(max-width: 768px)').matches ||
                             ('ontouchstart' in window && window.innerWidth <= 1024) ||
                             (navigator.maxTouchPoints > 0 && window.innerWidth <= 1024);

            const scheduleChildren = [
                ...(isMobile ? [{ label: 'Schedule Portal', action: () => window.location.href = 'https://schedule.astrong.xyz' }] : []),
                { label: 'Starbucks Schedule', action: () => window.location.href = 'https://schedule.astrong.xyz/starbucks' },
                { label: 'School Schedule', action: () => window.location.href = 'https://schedule.astrong.xyz/school/' },
                { label: 'Find a Time', action: () => window.open('https://calendar.app.google/j4EnNgkWWep23ZZC7', '_blank') }
            ];

            const utilityChildren = [
                ...(isMobile ? [{ label: 'Utility Portal', action: () => window.location.href = 'https://utility.astrong.xyz' }] : []),
                { label: 'Lorem Ipsum', action: () => window.location.href = 'https://utility.astrong.xyz/lorem' },
                { label: 'METAR Weather', action: () => window.location.href = 'https://utility.astrong.xyz/metar' },
                { label: 'Password Generator', action: () => window.location.href = 'https://utility.astrong.xyz/password' },
                { label: 'Progress Tracker', action: () => window.location.href = 'https://utility.astrong.xyz/progress' },
                { label: 'QR Code Generator', action: () => window.location.href = 'https://utility.astrong.xyz/qrcode' },
                { label: 'Text Tools', action: () => window.location.href = 'https://utility.astrong.xyz/text' },
                { label: 'Time Converter', action: () => window.location.href = 'https://utility.astrong.xyz/time' }
            ];

            const items = [
                { label: 'Home', action: () => window.location.href = 'https://astrong.xyz' },
                {
                    label: 'Schedule',
                    action: () => window.location.href = 'https://schedule.astrong.xyz',
                    children: scheduleChildren
                },
                {
                    label: 'Utilities',
                    action: () => window.location.href = 'https://utility.astrong.xyz',
                    children: utilityChildren
                },
                {
                    label: 'About',
                    action: () => window.location.href = 'https://astrong.xyz/about'
                }
            ];

            const selection = window.getSelection();
            const selectedText = selection ? selection.toString() : '';
            const hasSelection = selectedText.length > 0;
            const target = e.target;
            const isEditable = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

            const editItems = [];

            if (hasSelection) {
                editItems.push({
                    label: 'Copy',
                    action: () => {
                        navigator.clipboard.writeText(selectedText).catch(() => {
                            document.execCommand('copy');
                        });
                    }
                });
            }

            if (isEditable) {
                if (hasSelection) {
                    editItems.push({
                        label: 'Cut',
                        action: () => {
                            navigator.clipboard.writeText(selectedText).then(() => {
                                deleteSelectedText(target);
                            }).catch(() => {
                                document.execCommand('cut');
                            });
                        }
                    });
                }

                editItems.push({
                    label: 'Paste',
                    action: async () => {
                        try {
                            const text = await navigator.clipboard.readText();
                            insertTextAtCursor(target, text);
                        } catch (err) {
                            console.error('Failed to paste:', err);
                            document.execCommand('paste');
                        }
                    }
                });

                if (hasSelection) {
                    editItems.push({
                        label: 'Delete',
                        action: () => {
                            deleteSelectedText(target);
                        }
                    });
                }
            }

            if (editItems.length > 0) {
                items.push({ type: 'separator' });
                items.push(...editItems);
            }

            // Build DOM elements for the items
            items.forEach(it => {
                menu.appendChild(createMenuItem(it));
            });

            menu.style.display = 'flex';

            let x = e.clientX;
            let y = e.clientY;
            
            const menuWidth = 180;
            const menuHeight = menu.offsetHeight || 190;
            
            if (x + menuWidth > window.innerWidth) {
                x = window.innerWidth - menuWidth - 8;
            }
            if (y + menuHeight > window.innerHeight) {
                y = window.innerHeight - menuHeight - 8;
            }
            
            menu.style.left = `${x}px`;
            menu.style.top = `${y}px`;
        });

        window.addEventListener('click', (e) => {
            if (!menu.contains(e.target) && !e.target.closest('.custom-context-submenu')) {
                menu.style.display = 'none';
                document.querySelectorAll('.custom-context-submenu').forEach(s => s.style.display = 'none');
            }
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                menu.style.display = 'none';
                document.querySelectorAll('.custom-context-submenu').forEach(s => s.style.display = 'none');
            }
        });
    }

    // 5. Command Palette (Cmd+K / Ctrl+K) Implementation
    function initCommandPalette() {
        if (document.getElementById('astrong-cmd-palette')) return;

        if (!document.getElementById('jetbrains-mono-font-link')) {
            const fontLink = document.createElement('link');
            fontLink.id = 'jetbrains-mono-font-link';
            fontLink.rel = 'stylesheet';
            fontLink.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap';
            document.head.appendChild(fontLink);
        }

        const style = document.createElement('style');
        style.id = 'astrong-cmd-palette-style';
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap');

            .cmd-palette-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: 100000;
                display: none;
                align-items: flex-start;
                justify-content: center;
                padding-top: 12vh;
                padding-left: 1rem;
                padding-right: 1rem;
            }
            .cmd-palette-modal.active {
                display: flex;
            }
            .cmd-palette-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(18, 16, 22, 0.75);
                backdrop-filter: blur(4px);
                user-select: none;
                -webkit-user-select: none;
            }
            :root.light-mode .cmd-palette-overlay {
                background-color: rgba(253, 251, 255, 0.75);
            }
            .cmd-palette-container {
                position: relative;
                width: 100%;
                max-width: 580px;
                background-color: var(--surface, #1d1b20);
                border: 1px solid var(--outline, #49454f);
                border-radius: 16px;
                z-index: 100001;
                overflow: hidden;
                box-shadow: none;
                animation: cmdPaletteFadeIn 0.15s ease-out;
                font-family: 'Google Sans Flex', 'Google Sans', system-ui, -apple-system, sans-serif;
            }
            @keyframes cmdPaletteFadeIn {
                from { opacity: 0; transform: translateY(-8px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .cmd-palette-header {
                display: flex;
                align-items: center;
                padding: 0.85rem 1.1rem;
                border-bottom: 1px solid var(--outline, #49454f);
                gap: 0.75rem;
            }
            .cmd-palette-search-icon {
                color: var(--on-surface-variant, #cac4d0);
                flex-shrink: 0;
            }
            .cmd-palette-input {
                flex: 1;
                background: transparent;
                border: none;
                outline: none;
                font-family: inherit;
                font-size: 1rem;
                color: var(--on-surface, #e6e1e5);
            }
            .cmd-palette-input::placeholder {
                color: var(--on-surface-variant, #cac4d0);
                opacity: 0.7;
            }
            .cmd-palette-badge {
                font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                font-size: 0.7rem;
                padding: 2px 6px;
                background: var(--surface-variant, #2d2a33);
                border: 1px solid var(--outline, #49454f);
                border-radius: 4px;
                color: var(--on-surface-variant, #cac4d0);
                user-select: none;
                -webkit-user-select: none;
            }
            .cmd-palette-results {
                max-height: 340px;
                overflow-y: auto;
                padding: 0.5rem;
            }
            .cmd-palette-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0.65rem 0.85rem;
                border-radius: 8px;
                cursor: pointer;
                user-select: none;
                -webkit-user-select: none;
                transition: background-color 0.1s ease, color 0.1s ease;
                color: var(--on-surface, #e6e1e5);
            }
            .cmd-palette-item-left {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            .cmd-palette-item-icon {
                font-size: 1.1rem;
                width: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .cmd-palette-item-title {
                font-size: 0.9rem;
                font-weight: 500;
                font-family: inherit;
            }
            .cmd-palette-item-category {
                font-size: 0.75rem;
                color: var(--on-surface-variant, #cac4d0);
                opacity: 0.8;
                background: var(--surface-variant, #2d2a33);
                padding: 2px 8px;
                border-radius: 12px;
                font-family: inherit;
            }
            .cmd-palette-item.selected {
                background-color: var(--primary-container, #4527a0);
                color: var(--on-primary-container, #ffffff);
            }
            .cmd-palette-item.selected .cmd-palette-item-category {
                background-color: rgba(255, 255, 255, 0.15);
                color: var(--on-primary-container, #ffffff);
            }
            :root.light-mode .cmd-palette-item.selected .cmd-palette-item-category {
                background-color: rgba(0, 0, 0, 0.08);
                color: var(--on-primary-container, #1d1b20);
            }
            .cmd-palette-no-results {
                padding: 1.5rem;
                text-align: center;
                font-size: 0.88rem;
                color: var(--on-surface-variant, #cac4d0);
                font-family: inherit;
            }
            .cmd-palette-footer {
                display: flex;
                align-items: center;
                justify-content: flex-end;
                gap: 1.25rem;
                padding: 0.5rem 1rem;
                border-top: 1px solid var(--outline, #49454f);
                font-size: 0.75rem;
                color: var(--on-surface-variant, #cac4d0);
                user-select: none;
                -webkit-user-select: none;
                font-family: inherit;
            }
            .cmd-palette-footer kbd, .cmd-palette-container kbd {
                font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                padding: 1px 4px;
                background: var(--surface-variant, #2d2a33);
                border: 1px solid var(--outline, #49454f);
                border-radius: 3px;
                margin-right: 3px;
            }
        `;
        document.head.appendChild(style);

        const modal = document.createElement('div');
        modal.id = 'astrong-cmd-palette';
        modal.className = 'cmd-palette-modal';
        modal.setAttribute('aria-hidden', 'true');
        modal.innerHTML = `
            <div class="cmd-palette-overlay"></div>
            <div class="cmd-palette-container">
                <div class="cmd-palette-header">
                    <svg class="cmd-palette-search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" id="cmd-palette-input" class="cmd-palette-input" placeholder="Type a command or search pages..." autocomplete="off" spellcheck="false" />
                    <kbd class="cmd-palette-badge">ESC</kbd>
                </div>
                <div class="cmd-palette-results" id="cmd-palette-results"></div>
                <div class="cmd-palette-footer">
                    <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
                    <span><kbd>↵</kbd> select</span>
                    <span><kbd>esc</kbd> close</span>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const input = modal.querySelector('#cmd-palette-input');
        const resultsContainer = modal.querySelector('#cmd-palette-results');
        const overlay = modal.querySelector('.cmd-palette-overlay');

        let selectedIndex = 0;
        let filteredItems = [];

        const icons = {
            home: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-home"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
            schedule: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`,
            school: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-graduation-cap"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
            starbucks: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-coffee"><path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h12Z"/><path d="M6 2v2"/><path d="M17 12h1a3 3 0 0 1 0 6h-1"/></svg>`,
            utility: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-wrench"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
            contrast: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-palette"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.92 0 1.7-.74 1.7-1.67 0-.42-.16-.82-.44-1.12-.27-.3-.43-.7-.43-1.13 0-.93.75-1.68 1.68-1.68h2.09c3.04 0 5.4-2.46 5.4-5.5 0-4.97-4.48-9-10-9z"/></svg>`,
            metar: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plane"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>`,
            password: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-key-round"><path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/></svg>`,
            lorem: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-text"><path d="M17 6.1H3"/><path d="M21 12.1H3"/><path d="M15.1 18H3"/></svg>`,
            progress: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-activity"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
            qrcode: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-qr-code"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg>`,
            text: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-type"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`,
            time: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
            about: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
            control: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>`,
            theme: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-moon"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
            accent: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-palette"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.92 0 1.7-.74 1.7-1.67 0-.42-.16-.82-.44-1.12-.27-.3-.43-.7-.43-1.13 0-.93.75-1.68 1.68-1.68h2.09c3.04 0 5.4-2.46 5.4-5.5 0-4.97-4.48-9-10-9z"/></svg>`,
            settings: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`
        };

        const itemsList = [
            { id: 'home', title: 'Home', category: 'Navigation', icon: icons.home, url: 'https://astrong.xyz' },
            { id: 'schedule', title: 'Schedule Portal', category: 'Navigation', icon: icons.schedule, url: 'https://schedule.astrong.xyz' },
            { id: 'starbucks', title: 'Starbucks Schedule', category: 'Schedule', icon: icons.starbucks, url: 'https://schedule.astrong.xyz/starbucks/' },
            { id: 'school', title: 'School Schedule', category: 'Schedule', icon: icons.school, url: 'https://schedule.astrong.xyz/school/' },
            { id: 'utility', title: 'Utility Portal', category: 'Navigation', icon: icons.utility, url: 'https://utility.astrong.xyz' },
            { id: 'contrast', title: 'Color Contrast', category: 'Utilities', icon: icons.contrast, url: 'https://utility.astrong.xyz/contrast/' },
            { id: 'metar', title: 'METAR Aviation Weather', category: 'Utilities', icon: icons.metar, url: 'https://utility.astrong.xyz/metar/' },
            { id: 'password', title: 'Password Generator', category: 'Utilities', icon: icons.password, url: 'https://utility.astrong.xyz/password/' },
            { id: 'lorem', title: 'Lorem Ipsum Generator', category: 'Utilities', icon: icons.lorem, url: 'https://utility.astrong.xyz/lorem/' },
            { id: 'progress', title: 'Progress Tracker', category: 'Utilities', icon: icons.progress, url: 'https://utility.astrong.xyz/progress/' },
            { id: 'qrcode', title: 'QR Code Generator', category: 'Utilities', icon: icons.qrcode, url: 'https://utility.astrong.xyz/qrcode/' },
            { id: 'text', title: 'Text Toolkit', category: 'Utilities', icon: icons.text, url: 'https://utility.astrong.xyz/text/' },
            { id: 'time', title: 'Time', category: 'Utilities', icon: icons.time, url: 'https://utility.astrong.xyz/time/' },
            { id: 'about', title: 'About Austin', category: 'Navigation', icon: icons.about, url: 'https://astrong.xyz/about/' },
            { id: 'theme-toggle', title: 'Toggle Light / Dark Mode', category: 'Actions', icon: icons.theme, action: () => {
                const currentMode = localStorage.getItem('astrong_mode') || 'dark';
                const newMode = currentMode === 'light' ? 'dark' : 'light';
                applyTheme(null, newMode);
                if (window.showToast) window.showToast(`Switched to ${newMode} mode`);
            }},
            { id: 'accent-cycle', title: 'Cycle Theme', category: 'Actions', icon: icons.accent, action: () => cycleThemeAccent() },
            { id: 'settings', title: 'Open Settings', category: 'Actions', icon: icons.settings, action: () => {
                const btn = document.getElementById('settings-btn') || document.getElementById('settings-toggle');
                if (btn) btn.click();
            }}
        ];

        function renderResults() {
            resultsContainer.innerHTML = '';
            const query = input.value.trim().toLowerCase();
            filteredItems = itemsList.filter(item => 
                item.title.toLowerCase().includes(query) || 
                item.category.toLowerCase().includes(query)
            );

            if (filteredItems.length === 0) {
                resultsContainer.innerHTML = `<div class="cmd-palette-no-results">No matching commands or pages found.</div>`;
                return;
            }

            if (selectedIndex >= filteredItems.length) selectedIndex = 0;
            if (selectedIndex < 0) selectedIndex = filteredItems.length - 1;

            filteredItems.forEach((item, index) => {
                const div = document.createElement('div');
                div.className = `cmd-palette-item ${index === selectedIndex ? 'selected' : ''}`;
                div.innerHTML = `
                    <div class="cmd-palette-item-left">
                        <span class="cmd-palette-item-icon">${item.icon}</span>
                        <span class="cmd-palette-item-title">${item.title}</span>
                    </div>
                    <span class="cmd-palette-item-category">${item.category}</span>
                `;
                div.addEventListener('click', () => {
                    executeItem(item);
                });
                div.addEventListener('mouseenter', () => {
                    selectedIndex = index;
                    updateSelection();
                });
                resultsContainer.appendChild(div);
            });

            const selectedEl = resultsContainer.children[selectedIndex];
            if (selectedEl) {
                selectedEl.scrollIntoView({ block: 'nearest' });
            }
        }

        function updateSelection() {
            const children = resultsContainer.children;
            for (let i = 0; i < children.length; i++) {
                if (i === selectedIndex) {
                    children[i].classList.add('selected');
                    children[i].scrollIntoView({ block: 'nearest' });
                } else {
                    children[i].classList.remove('selected');
                }
            }
        }

        function executeItem(item) {
            closeCommandPalette();
            if (item.url) {
                window.location.href = item.url;
            } else if (item.action) {
                item.action();
            }
        }

        input.addEventListener('input', () => {
            selectedIndex = 0;
            renderResults();
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (filteredItems.length > 0) {
                    selectedIndex = (selectedIndex + 1) % filteredItems.length;
                    updateSelection();
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (filteredItems.length > 0) {
                    selectedIndex = (selectedIndex - 1 + filteredItems.length) % filteredItems.length;
                    updateSelection();
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredItems[selectedIndex]) {
                    executeItem(filteredItems[selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                closeCommandPalette();
            }
        });

        function openCommandPalette() {
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
            input.value = '';
            selectedIndex = 0;
            renderResults();
            setTimeout(() => input.focus(), 20);
        }

        function closeCommandPalette() {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
        }

        function toggleCommandPalette() {
            if (modal.classList.contains('active')) {
                closeCommandPalette();
            } else {
                openCommandPalette();
            }
        }

        window.openCommandPalette = openCommandPalette;
        window.closeCommandPalette = closeCommandPalette;
        window.toggleCommandPalette = toggleCommandPalette;

        overlay.addEventListener('click', closeCommandPalette);

        document.querySelectorAll('#search-btn, .search-btn, [data-action="cmd-palette"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                openCommandPalette();
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCommandPalette);
    } else {
        initCommandPalette();
    }
})();