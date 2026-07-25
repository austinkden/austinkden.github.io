
// Spotify API Integration Configuration
const SPOTIFY_CONFIG = {
    // Mode 1: Secure Cloudflare Worker URL (Highly Recommended)
    workerUrl: 'https://spotify-proxy.d-dolphin-9160.workers.dev/', // paste your real cloudflare link here

    // Mode 2: Client-side Token Refresh (Alternative)
    clientId: '7f0f7769cc3d4846bdb29b07a6e20d6b',
    clientSecret: '', // clear this
    refreshToken: '', // clear this
    corsProxy: '',    // clear this
};

document.addEventListener('DOMContentLoaded', () => {
    // Dynamic Autonomous Random Floating Accent Bubble with Edge-Distance Brightness
    const ambientBubble = document.querySelector('.ambient-bubble');
    if (ambientBubble) {
        const getRandomWaypoint = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            return {
                x: (Math.random() * 1.3 - 0.15) * w,
                y: (Math.random() * 1.3 - 0.15) * h
            };
        };

        let startPos = getRandomWaypoint();
        let currX = startPos.x;
        let currY = startPos.y;
        let targetPos = getRandomWaypoint();
        let startTime = performance.now();
        let duration = 6000 + Math.random() * 6000;

        const updateBubble = (now) => {
            let elapsed = now - startTime;
            let progress = Math.min(1, elapsed / duration);

            // Smooth cubic ease-in-out curve
            let ease = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            currX = startPos.x + (targetPos.x - startPos.x) * ease;
            currY = startPos.y + (targetPos.y - startPos.y) * ease;

            if (progress >= 1) {
                startPos = { x: currX, y: currY };
                targetPos = getRandomWaypoint();
                startTime = now;
                duration = 6000 + Math.random() * 6000;
            }

            // Calculate distance to nearest screen edge
            const w = window.innerWidth;
            const h = window.innerHeight;
            const distLeft = currX;
            const distRight = w - currX;
            const distTop = currY;
            const distBottom = h - currY;

            const minEdgeDist = Math.min(distLeft, distRight, distTop, distBottom);
            const maxEdgeDist = Math.min(w, h) / 2;

            // Closeness factor: 1 at/beyond edge, 0 at exact screen center
            const edgeCloseness = Math.max(0, Math.min(1, 1 - (minEdgeDist / maxEdgeDist)));

            // Calculate brightness strictly from edge distance (0.35 at center -> 1.0 at edge)
            const opacity = 0.35 + 0.65 * Math.pow(edgeCloseness, 0.85);

            ambientBubble.style.transform = `translate3d(${currX.toFixed(1)}px, ${currY.toFixed(1)}px, 0)`;
            ambientBubble.style.opacity = opacity.toFixed(3);

            requestAnimationFrame(updateBubble);
        };

        requestAnimationFrame(updateBubble);
    }

    // 1. Handle shape cycling and reversing the rotation of the cookie
    const wrapper = document.querySelector('.pfp-wrapper');
    const img = document.querySelector('.pfp-wrapper img');

    const shapes = [
        'four-sided-cookie',
        'pentagon',
        'six-sided-cookie',
        'nine-sided-cookie',
        'sunny',
        'twelve-sided-cookie'
    ];

    if (false && wrapper && img) {
        // Pre-sample and align points for all shapes
        const numPoints = 120;
        const shapePoints = {};
        let currentShapeIndex = 3; // Default to 'nine-sided-cookie'

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

        // Create a temporary SVG element in document body to measure path lengths
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

        // Active clip path element
        const activePathEl = document.getElementById('active-clip-path');
        let currentPoints = [];

        // Initialize current points to the default shape (nine-sided-cookie)
        const initialShape = shapes[currentShapeIndex];
        if (shapePoints[initialShape]) {
            currentPoints = [...shapePoints[initialShape]];
            // Set initial path string
            const d = 'M' + currentPoints.map(p => `${p.x.toFixed(4)} ${p.y.toFixed(4)}`).join(' L') + 'Z';
            activePathEl.setAttribute('d', d);
        }

        let longPressTimer = null;
        let isLongPress = false;
        let hasReversedThisPress = false;
        let startX = 0;
        let startY = 0;
        let lastCycleTime = 0;
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

                // Interpolate
                currentPoints = startPoints.map((start, idx) => {
                    const target = targetPoints[idx];
                    return {
                        x: start.x + (target.x - start.x) * eased,
                        y: start.y + (target.y - start.y) * eased
                    };
                });

                // Generate path string
                const d = 'M' + currentPoints.map(p => `${p.x.toFixed(4)} ${p.y.toFixed(4)}`).join(' L') + 'Z';
                activePathEl.setAttribute('d', d);

                if (progress < 1) {
                    animationFrameId = requestAnimationFrame(tick);
                }
            };

            animationFrameId = requestAnimationFrame(tick);
        };

        let rotationAngle = 0;
        let rotationDirection = 1; // 1 = clockwise, -1 = counter-clockwise
        let speedMultiplier = 1;
        let lastTime = performance.now();

        const rotateLoop = (time) => {
            const dt = (time - lastTime) / 1000;
            lastTime = time;

            // 36 degrees per second is 360deg over 10 seconds
            rotationAngle += rotationDirection * 36 * speedMultiplier * dt;
            rotationAngle = rotationAngle % 360;

            wrapper.style.transform = `rotate(${rotationAngle}deg)`;
            img.style.transform = `rotate(${-rotationAngle}deg)`;

            requestAnimationFrame(rotateLoop);
        };
        requestAnimationFrame(rotateLoop);

        let speedTimeoutId = null;
        let decelerateFrameId = null;
        const fastMultiplier = 6;

        const temporarySpeedUp = () => {
            if (speedTimeoutId) clearTimeout(speedTimeoutId);
            if (decelerateFrameId) cancelAnimationFrame(decelerateFrameId);

            speedMultiplier = fastMultiplier;

            speedTimeoutId = setTimeout(() => {
                const startTime = performance.now();
                const duration = 100; // 100ms deceleration

                const decelerate = (now) => {
                    const elapsed = now - startTime;
                    const progress = Math.min(elapsed / duration, 1);

                    speedMultiplier = fastMultiplier + (1 - fastMultiplier) * progress;

                    if (progress < 1) {
                        decelerateFrameId = requestAnimationFrame(decelerate);
                    } else {
                        decelerateFrameId = null;
                    }
                };

                decelerateFrameId = requestAnimationFrame(decelerate);
            }, 300);
        };

        const cycleShape = (e) => {
            const now = Date.now();
            if (now - lastCycleTime < 250) {
                if (e) e.preventDefault();
                return;
            }
            lastCycleTime = now;

            if (e) e.preventDefault();
            currentShapeIndex = (currentShapeIndex + 1) % shapes.length;
            const targetShape = shapes[currentShapeIndex];

            if (shapePoints[targetShape]) {
                animatePath(shapePoints[targetShape], 300);
                temporarySpeedUp();
            }

            // Reset the auto-cycle timer whenever the shape is cycled (either manually or automatically)
            startAutoCycle();
        };

        let autoCycleInterval = null;
        const startAutoCycle = () => {
            stopAutoCycle();
            // Only auto-cycle shape on the root homepage index.html
            const isRootHome = document.title === 'Austin Strong';
            if (!isRootHome) return;

            autoCycleInterval = setInterval(() => {
                cycleShape();
            }, 7500);
        };
        const stopAutoCycle = () => {
            if (autoCycleInterval) {
                clearInterval(autoCycleInterval);
                autoCycleInterval = null;
            }
        };

        // Start the auto shape cycling initially
        startAutoCycle();

        const reverseRotation = () => {
            rotationDirection *= -1;
        };
        // Click handler (cycles shape, ignores long-presses and non-left-clicks)
        wrapper.addEventListener('click', (e) => {
            if (e.pointerType === 'mouse' && e.button !== 0) {
                return;
            }
            if (isLongPress) {
                isLongPress = false;
                return;
            }

            cycleShape(e);
        });

        // Desktop Right-Click (contextmenu)
        wrapper.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (!hasReversedThisPress) {
                hasReversedThisPress = true;
                reverseRotation();
            }
        });

        // Mobile Long Press & Desktop Right-Click / Long Left-Click using PointerEvents
        wrapper.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'mouse' && e.button === 2) {
                if (!hasReversedThisPress) {
                    hasReversedThisPress = true;
                    reverseRotation();
                }
                return;
            }
            if (e.pointerType === 'mouse' && e.button !== 0) {
                return;
            }
            isLongPress = false;
            hasReversedThisPress = false;
            startX = e.clientX;
            startY = e.clientY;

            longPressTimer = setTimeout(() => {
                isLongPress = true;
                if (!hasReversedThisPress) {
                    hasReversedThisPress = true;
                    reverseRotation();
                }
            }, 250);
        });

        const cancelPress = () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        };

        wrapper.addEventListener('pointerup', cancelPress);
        wrapper.addEventListener('pointercancel', cancelPress);
        wrapper.addEventListener('pointermove', (e) => {
            if (longPressTimer) {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                if (Math.sqrt(dx * dx + dy * dy) > 10) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
            }
        });
    }



    // Initialize Spotify Widget
    initSpotifyWidget();

    function initSpotifyWidget() {
        const widget = document.getElementById('spotify-widget');
        const trackName = document.getElementById('spotify-track');
        const artistName = document.getElementById('spotify-artist');
        
        if (!widget || !trackName || !artistName) return;

        // Ensure widget is hidden by default while checking
        widget.style.display = 'none';

        function cleanSongTitle(title) {
            if (!title) return '';
            // Remove (feat. ...), [feat. ...], (ft. ...), [ft. ...] or (feat.), (ft.)
            return title.replace(/\s*[\(\[](feat|ft)\.?\s*[^)\]]*[\)\]]/gi, '').trim();
        }

        let accessToken = '';
        let isInitialCheckCompleted = false;

        const hasWorker = !!SPOTIFY_CONFIG.workerUrl;
        const hasClientCredentials = 
            SPOTIFY_CONFIG.clientId !== 'YOUR_CLIENT_ID' && 
            SPOTIFY_CONFIG.clientSecret !== 'YOUR_CLIENT_SECRET' && 
            SPOTIFY_CONFIG.refreshToken !== 'YOUR_REFRESH_TOKEN';

        if (!hasWorker && !hasClientCredentials) {
            widget.style.display = 'none';
            window.spotifyDecided = true;
            window.dispatchEvent(new CustomEvent('spotify-decided'));
            return;
        }

        // Spend up to 3 seconds checking for a Spotify connection during page load.
        // If it cannot connect after 3 seconds, unblock page loading without showing the widget.
        const initialTimeout = setTimeout(() => {
            if (!isInitialCheckCompleted) {
                isInitialCheckCompleted = true;
                widget.style.display = 'none';
                window.spotifyDecided = true;
                window.dispatchEvent(new CustomEvent('spotify-decided'));
            }
        }, 3000);

        async function fetchWithTimeout(url, options = {}, timeoutMs = 3000) {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);
            try {
                return await fetch(url, { ...options, signal: controller.signal });
            } finally {
                clearTimeout(timer);
            }
        }

        async function updateCurrentlyPlaying() {
            try {
                let data;
                const timeoutMs = isInitialCheckCompleted ? 8000 : 3000;
                if (hasWorker) {
                    // Worker returns a refreshed access token — use it to call Spotify directly
                    if (!accessToken) {
                        const tokenRes = await fetchWithTimeout(SPOTIFY_CONFIG.workerUrl, {}, timeoutMs);
                        const tokenData = await tokenRes.json();
                        accessToken = tokenData.access_token;
                    }
                    data = await fetchSpotifyCurrentlyPlaying(timeoutMs);
                } else {
                    if (!accessToken) {
                        await refreshAccessToken(timeoutMs);
                    }
                    data = await fetchSpotifyCurrentlyPlaying(timeoutMs);
                }

                if (data && data.isPlaying) {
                    trackName.textContent = cleanSongTitle(data.title);
                    artistName.textContent = data.artist;
                    widget.href = data.link || '#';
                    widget.classList.add('active');
                    widget.style.display = 'flex';
                    window.isSpotifyPlaying = true;
                } else {
                    trackName.textContent = '';
                    artistName.textContent = '';
                    widget.href = '#';
                    widget.classList.remove('active');
                    widget.style.display = 'none';
                    window.isSpotifyPlaying = false;
                }
                if (window.updateLiveStatus) {
                    window.updateLiveStatus();
                }
            } catch (err) {
                console.error('Spotify API Error:', err);
                accessToken = ''; // Reset token on error
                widget.style.display = 'none';
                window.isSpotifyPlaying = false;
                if (window.updateLiveStatus) {
                    window.updateLiveStatus();
                }
            } finally {
                if (!isInitialCheckCompleted) {
                    isInitialCheckCompleted = true;
                    clearTimeout(initialTimeout);
                    window.spotifyDecided = true;
                    window.dispatchEvent(new CustomEvent('spotify-decided'));
                }
            }
        }

        async function refreshAccessToken(timeoutMs = 5000) {
            const url = `${SPOTIFY_CONFIG.corsProxy}https://accounts.spotify.com/api/token`;
            const body = new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: SPOTIFY_CONFIG.refreshToken
            });

            const res = await fetchWithTimeout(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + btoa(`${SPOTIFY_CONFIG.clientId}:${SPOTIFY_CONFIG.clientSecret}`)
                },
                body: body
            }, timeoutMs);

            if (!res.ok) {
                throw new Error(`Failed to refresh Spotify access token: ${res.statusText}`);
            }

            const data = await res.json();
            accessToken = data.access_token;
        }

        async function fetchSpotifyCurrentlyPlaying(timeoutMs = 5000) {
            const url = 'https://api.spotify.com/v1/me/player/currently-playing';
            const res = await fetchWithTimeout(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }, timeoutMs);

            if (res.status === 204) {
                return { isPlaying: false };
            }

            if (res.status === 401) {
                accessToken = '';
                if (hasWorker) {
                    const tokenRes = await fetchWithTimeout(SPOTIFY_CONFIG.workerUrl, {}, timeoutMs);
                    const tokenData = await tokenRes.json();
                    accessToken = tokenData.access_token;
                } else {
                    await refreshAccessToken(timeoutMs);
                }
                return fetchSpotifyCurrentlyPlaying(timeoutMs);
            }

            if (!res.ok) {
                throw new Error(`Failed to fetch currently playing: ${res.statusText}`);
            }

            const song = await res.json();
            return {
                isPlaying: song.is_playing,
                title: song.item.name,
                artist: song.item.artists.map(a => a.name).join(', '),
                link: song.item.external_urls.spotify
            };
        }

        updateCurrentlyPlaying();
        setInterval(updateCurrentlyPlaying, 10000);
    }

    // Initialize Accent Theme Switcher
    initThemeSwitcher();

    // Speed up Spotify equalizer bars on hover without resetting their position
    const spotifyCard = document.querySelector('.spotify-card');
    if (spotifyCard) {
        spotifyCard.addEventListener('mouseenter', () => {
            spotifyCard.querySelectorAll('.eq-bar').forEach(bar => {
                if (bar.getAnimations) {
                    bar.getAnimations().forEach(anim => {
                        anim.playbackRate = 1.75;
                    });
                }
            });
        });
        spotifyCard.addEventListener('mouseleave', () => {
            spotifyCard.querySelectorAll('.eq-bar').forEach(bar => {
                if (bar.getAnimations) {
                    bar.getAnimations().forEach(anim => {
                        anim.playbackRate = 1.0;
                    });
                }
            });
        });
    }

    function initThemeSwitcher() {
        const accentSelect = document.getElementById('accent-select');
        if (!accentSelect) return;

        const trigger = accentSelect.querySelector('.select-trigger');
        const triggerText = accentSelect.querySelector('.select-trigger-text');
        const options = accentSelect.querySelectorAll('.select-option');

        const savedAccent = localStorage.getItem('astrong_accent') || 'purple';
        const savedMode = localStorage.getItem('astrong_mode') || 'dark';

        const updateWhiteOptionLabel = (mode) => {
            const whiteOption = accentSelect.querySelector('.option-white');
            if (whiteOption) {
                whiteOption.textContent = mode === 'light' ? 'Black' : 'White';
            }
        };

        // Initialize label first
        updateWhiteOptionLabel(savedMode);

        // Set initial selected value text and active style
        const activeOption = accentSelect.querySelector(`.select-option[data-value="${savedAccent}"]`);
        if (activeOption) {
            triggerText.textContent = activeOption.textContent;
            triggerText.style.color = window.getComputedStyle(activeOption).color;
            activeOption.classList.add('selected');
        }

        // Toggle open/close on click
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            accentSelect.classList.toggle('open');
        });

        // Click handler for options
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const themeName = option.getAttribute('data-value');
                
                options.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                
                triggerText.textContent = option.textContent;
                triggerText.style.color = window.getComputedStyle(option).color;
                
                localStorage.setItem('astrong_accent', themeName);
                const currentMode = localStorage.getItem('astrong_mode') || 'dark';
                
                if (window.applyTheme) {
                    window.applyTheme(themeName, currentMode);
                }
                
                accentSelect.classList.remove('open');
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            accentSelect.classList.remove('open');
        });
    }

    function initSettingsModal() {
        const settingsBtn = document.getElementById('settings-btn');
        const settingsModal = document.getElementById('settings-modal');
        const closeBtn = document.getElementById('settings-close-btn');
        const overlay = settingsModal ? settingsModal.querySelector('.settings-modal-overlay') : null;
        const themeTogglePill = document.getElementById('theme-toggle-pill');

        if (!settingsBtn || !settingsModal) return;

        function openModal() {
            settingsModal.classList.add('active');
            settingsModal.setAttribute('aria-hidden', 'false');
            
            // Re-update select trigger color to ensure it matches active stylesheet variables
            const savedAccent = localStorage.getItem('astrong_accent') || 'purple';
            const activeOption = document.querySelector(`#accent-select .select-option[data-value="${savedAccent}"]`);
            const triggerText = document.querySelector('#accent-select .select-trigger-text');
            if (activeOption && triggerText) {
                triggerText.style.color = window.getComputedStyle(activeOption).color;
            }
        }

        function closeModal() {
            settingsModal.classList.remove('active');
            settingsModal.setAttribute('aria-hidden', 'true');
        }

        settingsBtn.addEventListener('click', openModal);
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (overlay) overlay.addEventListener('click', closeModal);

        // Escape key to close the modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (settingsModal.classList.contains('active')) {
                    closeModal();
                    e.stopImmediatePropagation();
                }
            }
        }, true);

        // Initialize theme-toggle-pill state
        const savedMode = localStorage.getItem('astrong_mode') || 'dark';
        if (themeTogglePill) {
            themeTogglePill.setAttribute('data-active', savedMode);

            themeTogglePill.addEventListener('click', () => {
                const currentMode = localStorage.getItem('astrong_mode') || 'dark';
                const nextMode = currentMode === 'dark' ? 'light' : 'dark';
                
                localStorage.setItem('astrong_mode', nextMode);
                themeTogglePill.setAttribute('data-active', nextMode);

                // Apply theme changes
                const savedAccent = localStorage.getItem('astrong_accent') || 'purple';
                if (window.applyTheme) {
                    window.applyTheme(savedAccent, nextMode);
                }

                // Update the white option label dynamically
                const accentSelect = document.getElementById('accent-select');
                if (accentSelect) {
                    const whiteOption = accentSelect.querySelector('.option-white');
                    if (whiteOption) {
                        whiteOption.textContent = nextMode === 'light' ? 'Black' : 'White';
                    }
                }

                // Update trigger text and color if dropdown exists (e.g. white/black changes text and color)
                const activeOption = document.querySelector(`#accent-select .select-option[data-value="${savedAccent}"]`);
                const triggerText = document.querySelector('#accent-select .select-trigger-text');
                if (activeOption && triggerText) {
                    triggerText.textContent = activeOption.textContent;
                    setTimeout(() => {
                        triggerText.style.color = window.getComputedStyle(activeOption).color;
                    }, 50);
                }
            });
        }
    }

    // 3. Initialize Modals & Live Status Bar
    initHelpModal();
    initSettingsModal();
    initLiveStatusBar();

    function initLiveStatusBar() {
        const statusBar = document.getElementById('live-status-bar');
        const statusText = document.getElementById('live-status-text');

        if (!statusBar || !statusText) return;

        const apiKey = 'AIzaSyBIwrZ7LnEPCEGs5CM_Pq61YtGZ3jHVQHY';
        const calendarId = 'dolphin.kden@gmail.com';

        // Fallback schedule data in case API key access is blocked or offline
        const FALLBACK_STARBUCKS_SCHEDULE = {
            "2026-06-30": { start: "11:15", end: "15:15" },
            "2026-07-02": { start: "12:15", end: "16:15" },
            "2026-07-03": { start: "13:30", end: "17:45" },
            "2026-07-08": { start: "11:00", end: "15:00" },
            "2026-07-09": { start: "10:00", end: "14:00" },
            "2026-07-10": { start: "14:00", end: "20:30" },
            "2026-07-12": { start: "09:00", end: "15:15" },
            "2026-07-14": { start: "08:30", end: "12:30" },
            "2026-07-15": { start: "13:00", end: "17:30" },
            "2026-07-16": { start: "15:15", end: "19:15" },
            "2026-07-18": { start: "07:45", end: "12:30" },
            "2026-07-19": { start: "12:00", end: "16:00" },
            "2026-07-21": { start: "10:00", end: "17:00" },
            "2026-07-22": { start: "12:00", end: "16:00" },
            "2026-07-23": { start: "10:45", end: "16:00" },
            "2026-07-24": { start: "10:45", end: "14:45" },
            "2026-07-26": { start: "08:00", end: "12:45" },
            "2026-07-28": { start: "12:00", end: "20:30" },
            "2026-07-29": { start: "07:15", end: "12:00" },
            "2026-07-30": { start: "07:00", end: "13:30" },
            "2026-07-31": { start: "12:45", end: "19:15" },
            "2026-08-02": { start: "11:00", end: "18:30" },
            "2026-08-03": { start: "14:15", end: "19:00" },
            "2026-08-05": { start: "11:15", end: "15:45" },
            "2026-08-06": { start: "07:00", end: "13:00" },
            "2026-08-08": { start: "09:30", end: "17:00" },
            "2026-08-09": { start: "08:00", end: "12:30" }
        };

        let apiDisabled = false;
        let apiWarned = false;

        function updateUI(status, label) {
            statusBar.setAttribute('data-status', status);
            statusText.textContent = label;
        }

        function parseCalendarEvents(items) {
            const events = [];
            if (!items || !Array.isArray(items)) return events;

            for (const event of items) {
                if (event.status === 'cancelled') continue;

                let start, end;
                if (event.start && event.start.dateTime) {
                    start = new Date(event.start.dateTime);
                    end = new Date(event.end.dateTime);
                } else if (event.start && event.start.date) {
                    // Parse all-day events in local timezone midnight
                    const [sy, sm, sd] = event.start.date.split('-').map(Number);
                    const [ey, em, ed] = event.end.date.split('-').map(Number);
                    start = new Date(sy, sm - 1, sd, 0, 0, 0);
                    end = new Date(ey, em - 1, ed, 0, 0, 0);
                } else {
                    continue;
                }

                const summary = (event.summary || '').trim().toLowerCase();
                const isStarbucks = summary.includes('starbucks shift') || summary.includes('starbucks');
                const isBusy = event.transparency !== 'transparent';

                if (isStarbucks) {
                    events.push({ type: 'at-work', start, end });
                } else if (isBusy) {
                    events.push({ type: 'busy', start, end });
                }
            }
            return events;
        }

        function parseFallbackEvents(now) {
            const schedule = window.STARBUCKS_SCHEDULE || FALLBACK_STARBUCKS_SCHEDULE;
            const pad = (n) => String(n).padStart(2, '0');
            const events = [];

            // Check yesterday, today, and tomorrow to properly capture overnight or adjacent shifts
            for (let dayOffset = -1; dayOffset <= 1; dayOffset++) {
                const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);
                const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
                const dayData = schedule[dateStr];
                if (!dayData) continue;

                const dayItems = Array.isArray(dayData) ? dayData : [dayData];
                for (const item of dayItems) {
                    if (!item.start || !item.end) continue;
                    const [sh, sm] = item.start.split(':').map(Number);
                    const [eh, em] = item.end.split(':').map(Number);

                    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), sh, sm, 0);
                    let end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), eh, em, 0);
                    if (end <= start) {
                        end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, eh, em, 0);
                    }

                    const notes = (item.notes || '').toLowerCase();
                    const title = (item.title || '').toLowerCase();
                    const isBusyFlag = item.type === 'busy' || item.busy === true || item.isStarbucks === false || item.status === 'busy' || notes.includes('busy') || title.includes('busy');
                    const type = isBusyFlag ? 'busy' : 'at-work';

                    events.push({ type, start, end });
                }
            }
            return events;
        }

        function formatDurationText(totalMinutes) {
            const mins = Math.max(1, totalMinutes);
            const hours = Math.floor(mins / 60);
            const remainingMins = mins % 60;

            const parts = [];
            if (hours > 0) {
                parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
            }
            if (remainingMins > 0 || hours === 0) {
                parts.push(`${remainingMins} ${remainingMins === 1 ? 'minute' : 'minutes'}`);
            }

            return parts.join(' and ');
        }

        function evaluateStatusFromEvents(events, now) {
            let activeAtWork = null;
            let activeBusy = null;
            let upcomingEvent = null;

            for (const evt of events) {
                if (evt.start <= now && now < evt.end) {
                    if (evt.type === 'at-work') {
                        if (!activeAtWork || evt.end > activeAtWork.end) {
                            activeAtWork = evt;
                        }
                    } else if (evt.type === 'busy') {
                        if (!activeBusy || evt.end > activeBusy.end) {
                            activeBusy = evt;
                        }
                    }
                } else if (evt.start > now) {
                    if (!upcomingEvent || evt.start < upcomingEvent.start) {
                        upcomingEvent = evt;
                    }
                }
            }

            const activeEvent = activeAtWork || activeBusy;

            if (activeEvent) {
                const minsRemaining = Math.ceil((activeEvent.end.getTime() - now.getTime()) / 60000);
                const statusType = activeEvent.type;
                const prefix = statusType === 'at-work' ? 'At work' : 'Busy';
                const durationStr = formatDurationText(minsRemaining);

                return {
                    status: statusType,
                    label: `${prefix} for another ${durationStr}`
                };
            } else {
                const baseStatus = window.isSpotifyPlaying ? 'listening' : 'available';
                const baseLabel = window.isSpotifyPlaying ? 'Listening to music' : 'Available';

                if (upcomingEvent) {
                    const minsUntilStart = Math.ceil((upcomingEvent.start.getTime() - now.getTime()) / 60000);
                    if (minsUntilStart <= 60 && minsUntilStart >= 1) {
                        const unit = minsUntilStart === 1 ? 'minute' : 'minutes';
                        return {
                            status: baseStatus,
                            label: `Available for ${minsUntilStart} more ${unit}`
                        };
                    }
                }

                return {
                    status: baseStatus,
                    label: baseLabel
                };
            }
        }

        async function fetchCalendarStatus() {
            const now = new Date();
            let events = [];
            let apiSuccess = false;

            if (!apiDisabled) {
                const timeMin = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
                const timeMax = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
                const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${apiKey}&singleEvents=true&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&orderBy=startTime`;

                try {
                    const res = await fetch(url);
                    if (!res.ok) {
                        throw new Error(`HTTP ${res.status}`);
                    }
                    const data = await res.json();
                    events = parseCalendarEvents(data.items);
                    apiSuccess = true;
                } catch (err) {
                    // Try live serverless proxy endpoint /api/calendar
                    try {
                        const proxyUrl = `/api/calendar?calendarId=${encodeURIComponent(calendarId)}`;
                        const proxyRes = await fetch(proxyUrl);
                        if (proxyRes.ok) {
                            const proxyData = await proxyRes.json();
                            if (proxyData.items) {
                                events = parseCalendarEvents(proxyData.items);
                                apiSuccess = true;
                            }
                        }
                    } catch (proxyErr) {
                        // Proxy fetch failed, fallback to local schedule
                    }

                    if (!apiSuccess && !apiWarned) {
                        console.warn(`[Live Status] Google Calendar REST API returned error. Falling back to live /api/calendar proxy or local schedule.`);
                        apiWarned = true;
                    }
                }
            }

            if (!apiSuccess) {
                events = parseFallbackEvents(now);
            }

            const result = evaluateStatusFromEvents(events, now);
            updateUI(result.status, result.label);
        }

        window.updateLiveStatus = fetchCalendarStatus;

        function scheduleNextAlignedUpdate() {
            fetchCalendarStatus();
            const now = new Date();
            const delay = 10000 - ((now.getSeconds() % 10) * 1000 + now.getMilliseconds());
            setTimeout(scheduleNextAlignedUpdate, delay);
        }

        fetchCalendarStatus();
        const initialNow = new Date();
        const initialDelay = 10000 - ((initialNow.getSeconds() % 10) * 1000 + initialNow.getMilliseconds());
        setTimeout(scheduleNextAlignedUpdate, initialDelay);
    }

    function initHelpModal() {
        const helpBtn = document.getElementById('help-btn');
        const helpModal = document.getElementById('help-modal');
        const closeBtn = document.getElementById('help-close-btn');
        const overlay = helpModal ? helpModal.querySelector('.help-modal-overlay') : null;

        if (!helpBtn || !helpModal) return;

        function openModal() {
            helpModal.classList.add('active');
            helpModal.setAttribute('aria-hidden', 'false');
        }

        function closeModal() {
            helpModal.classList.remove('active');
            helpModal.setAttribute('aria-hidden', 'true');
        }

        helpBtn.addEventListener('click', openModal);
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (overlay) overlay.addEventListener('click', closeModal);

        // Escape key to close the modal, using capture phase to run before universal.js back action
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (helpModal.classList.contains('active')) {
                    closeModal();
                    e.stopImmediatePropagation();
                }
            }
        }, true);
    }
});
