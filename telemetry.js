// telemetry.js - Device & session telemetry collector for astrong.xyz
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, arrayUnion, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "https://astrong.xyz/firebase-config.js";

(async function () {
    try {
        // Initialize Firebase App & Firestore
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);

        // 1. Device & Session ID Setup
        let deviceId = localStorage.getItem('astrong_device_id');
        if (!deviceId) {
            deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('astrong_device_id', deviceId);
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

        // 4. IP & Geolocation Fetching (with failovers)
        let ipData = {
            ip: 'Unknown',
            city: 'Unknown',
            region: 'Unknown',
            country: 'Unknown',
            isp: 'Unknown',
            org: 'Unknown',
            lat: null,
            lon: null
        };

        try {
            const res = await fetch('https://ipapi.co/json/').catch(() => null);
            if (res && res.ok) {
                const data = await res.json();
                if (data && !data.error) {
                    ipData = {
                        ip: data.ip || 'Unknown',
                        city: data.city || 'Unknown',
                        region: data.region || 'Unknown',
                        country: data.country_name || data.country || 'Unknown',
                        countryCode: data.country_code || '',
                        isp: data.org || data.asn || 'Unknown',
                        org: data.org || 'Unknown',
                        lat: data.latitude || null,
                        lon: data.longitude || null
                    };
                }
            }
            if (ipData.ip === 'Unknown') {
                const fallbackRes = await fetch('https://api.ipify.org?format=json').catch(() => null);
                if (fallbackRes && fallbackRes.ok) {
                    const fallbackData = await fallbackRes.json();
                    if (fallbackData.ip) ipData.ip = fallbackData.ip;
                }
            }
        } catch (err) {
            console.warn('[Telemetry] Geolocation fetch error:', err);
        }

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
                if (checkSnap && checkSnap.exists() && checkSnap.data().isBanned) {
                    enforceBanScreen();
                }
            } catch (err) {
                console.warn('[Telemetry] Heartbeat error:', err);
            }
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
            @keyframes banned-spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    const loaderSvgHtml = '<svg viewBox="0 0 1 1" class="loading-spinner"><path d="M0.3955 0.0590C0.4007 0.0547 0.4033 0.0526 0.4057 0.0508C0.4615 0.0081 0.5385 0.0081 0.5943 0.0508C0.5967 0.0526 0.5993 0.0547 0.6045 0.0590C0.6068 0.0609 0.6079 0.0619 0.6091 0.0628C0.6354 0.0837 0.6675 0.0955 0.7010 0.0966C0.7024 0.0966 0.7039 0.0966 0.7069 0.0967C0.7136 0.0968 0.7170 0.0968 0.7199 0.0970C0.7898 0.1005 0.8488 0.1506 0.8644 0.2195C0.8651 0.2224 0.8657 0.2257 0.8670 0.2324C0.8675 0.2353 0.8678 0.2368 0.8681 0.2383C0.8749 0.2713 0.8921 0.3013 0.9170 0.3238C0.9181 0.3248 0.9192 0.3258 0.9215 0.3277C0.9265 0.3321 0.9291 0.3343 0.9313 0.3364C0.9825 0.3845 0.9959 0.4612 0.9640 0.5241C0.9627 0.5267 0.9610 0.5297 0.9577 0.5356C0.9563 0.5382 0.9556 0.5396 0.9549 0.5409C0.9391 0.5706 0.9331 0.6047 0.9379 0.6381C0.9381 0.6396 0.9383 0.6411 0.9388 0.6440C0.9399 0.6507 0.9404 0.6541 0.9408 0.6570C0.9495 0.7272 0.9109 0.7946 0.8465 0.8221C0.8438 0.8232 0.8406 0.8244 0.8343 0.8268C0.8315 0.8279 0.8301 0.8284 0.8288 0.8290C0.7978 0.8415 0.7715 0.8638 0.7539 0.8925C0.7531 0.8937 0.7524 0.8950 0.7508 0.8976C0.7474 0.9034 0.7457 0.9063 0.7441 0.9089C0.7061 0.9682 0.6337 0.9948 0.5668 0.9740C0.5640 0.9732 0.5608 0.9720 0.5545 0.9698C0.5517 0.9688 0.5503 0.9683 0.5489 0.9679C0.5171 0.9573 0.4829 0.9573 0.4511 0.9679C0.4497 0.9683 0.4483 0.9688 0.4455 0.9698C0.4392 0.9720 0.4360 0.9732 0.4332 0.9740C0.3663 0.9948 0.2939 0.9682 0.2559 0.9089C0.2543 0.9063 0.2526 0.9034 0.2492 0.8976C0.2476 0.8950 0.2469 0.8937 0.2461 0.8925C0.2285 0.8638 0.2022 0.8415 0.1712 0.8290C0.1699 0.8284 0.1685 0.8279 0.1657 0.8268C0.1594 0.8244 0.1562 0.8232 0.1535 0.8221C0.0891 0.7946 0.0505 0.7272 0.0592 0.6570C0.0596 0.6541 0.0601 0.6507 0.0612 0.6440C0.0617 0.6411 0.0619 0.6396 0.0621 0.6381C0.0669 0.6047 0.0609 0.5706 0.0451 0.5409C0.0444 0.5396 0.0437 0.5382 0.0423 0.5356C0.0390 0.5297 0.0373 0.5267 0.0360 0.5241C0.0041 0.4612 0.0175 0.3845 0.0687 0.3364C0.0709 0.3343 0.0735 0.3321 0.0785 0.3277C0.0808 0.3258 0.0819 0.3248 0.0830 0.3238C0.1079 0.3013 0.1251 0.2713 0.1319 0.2383C0.1322 0.2368 0.1325 0.2353 0.1330 0.2324C0.1343 0.2257 0.1349 0.2224 0.1356 0.2195C0.1512 0.1506 0.2102 0.1005 0.2801 0.0970C0.2830 0.0968 0.2864 0.0968 0.2931 0.0967C0.2961 0.0966 0.2976 0.0966 0.2990 0.0966C0.3325 0.0955 0.3646 0.0837 0.3909 0.0628C0.3921 0.0619 0.3932 0.0609 0.3955 0.0590Z" fill="#ffffff" /></svg>';

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
