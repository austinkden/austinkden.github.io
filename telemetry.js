// telemetry.js - Device & session telemetry collector for astrong.xyz
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, setDoc, arrayUnion, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
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
        let batteryInfo = { level: null, charging: null };
        try {
            if (typeof navigator.getBattery === 'function') {
                const battery = await navigator.getBattery();
                batteryInfo = {
                    level: Math.round(battery.level * 100),
                    charging: battery.charging
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
                pdfViewerEnabled: navigator.pdfViewerEnabled ?? null
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
                cpuCores: navigator.hardwareConcurrency || 'Unknown',
                deviceMemoryGB: navigator.deviceMemory || 'Unknown',
                maxTouchPoints: navigator.maxTouchPoints || 0,
                gpuVendor: gpuVendor,
                gpuRenderer: gpuRenderer
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

        // 6. Write to Firestore
        const deviceRef = doc(db, "devices", deviceId);
        await setDoc(deviceRef, devicePayload, { merge: true });

    } catch (error) {
        console.error('[Telemetry] Error logging device telemetry:', error);
    }
})();
