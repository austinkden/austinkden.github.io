
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
        });

        // Mobile Long Press & Desktop Right-Click / Long Left-Click using PointerEvents
        wrapper.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'mouse' && e.button === 2) {
                reverseRotation();
                return;
            }
            if (e.pointerType === 'mouse' && e.button !== 0) {
                return;
            }
            isLongPress = false;
            startX = e.clientX;
            startY = e.clientY;

            longPressTimer = setTimeout(() => {
                isLongPress = true;
                reverseRotation();
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

        function cleanSongTitle(title) {
            if (!title) return '';
            // Remove (feat. ...), [feat. ...], (ft. ...), [ft. ...] or (feat.), (ft.)
            return title.replace(/\s*[\(\[](feat|ft)\.?\s*[^)\]]*[\)\]]/gi, '').trim();
        }

        let accessToken = '';

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

        async function updateCurrentlyPlaying() {
            try {
                let data;
                if (hasWorker) {
                    // Worker returns a refreshed access token — use it to call Spotify directly
                    if (!accessToken) {
                        const tokenRes = await fetch(SPOTIFY_CONFIG.workerUrl);
                        const tokenData = await tokenRes.json();
                        accessToken = tokenData.access_token;
                    }
                    data = await fetchSpotifyCurrentlyPlaying();
                } else {
                    if (!accessToken) {
                        await refreshAccessToken();
                    }
                    data = await fetchSpotifyCurrentlyPlaying();
                }

                if (data && data.isPlaying) {
                    trackName.textContent = cleanSongTitle(data.title);
                    artistName.textContent = data.artist;
                    widget.href = data.link || '#';
                    widget.classList.add('active');
                    widget.style.display = 'flex';
                } else {
                    trackName.textContent = '';
                    artistName.textContent = '';
                    widget.href = '#';
                    widget.classList.remove('active');
                    widget.style.display = 'none';
                }
            } catch (err) {
                console.error('Spotify API Error:', err);
                accessToken = ''; // Reset token on error
            } finally {
                window.spotifyDecided = true;
                window.dispatchEvent(new CustomEvent('spotify-decided'));
            }
        }

        async function refreshAccessToken() {
            // 1. Must use HTTPS
            // 2. Must hit the actual Spotify accounts ID service
            const url = `${SPOTIFY_CONFIG.corsProxy}https://accounts.spotify.com/api/token`;
            const body = new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: SPOTIFY_CONFIG.refreshToken
            });

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + btoa(`${SPOTIFY_CONFIG.clientId}:${SPOTIFY_CONFIG.clientSecret}`)
                },
                body: body
            });

            if (!res.ok) {
                throw new Error(`Failed to refresh Spotify access token: ${res.statusText}`);
            }

            const data = await res.json();
            accessToken = data.access_token;
        }

        async function fetchSpotifyCurrentlyPlaying() {
            // Must hit the real Spotify production API endpoint over HTTPS
            const url = 'https://api.spotify.com/v1/me/player/currently-playing';
            const res = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (res.status === 204) {
                return { isPlaying: false };
            }

            if (res.status === 401) {
                accessToken = '';
                if (hasWorker) {
                    const tokenRes = await fetch(SPOTIFY_CONFIG.workerUrl);
                    const tokenData = await tokenRes.json();
                    accessToken = tokenData.access_token;
                } else {
                    await refreshAccessToken();
                }
                return fetchSpotifyCurrentlyPlaying();
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

    // 3. Initialize Modals
    initHelpModal();
    initSettingsModal();

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
