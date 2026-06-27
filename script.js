const phrases = [
    "Working on it...",
    "In progress...",
    "Magic coming...",
];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Handle shape cycling and reversing the rotation of the cookie
    const wrapper = document.querySelector('.pfp-wrapper');
    const img = document.querySelector('.pfp-wrapper img');

    const shapes = [
        'four-sided-cookie',
        'pentagon',
        'six-sided-cookie',
        'nine-sided-cookie',
        'sunny'
    ];

    if (wrapper && img) {
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

    // 2. Handle cycling through the list of H1 phrases on click
    const h1Element = document.querySelector('h1');
    if (h1Element) {
        // Find initial index if the current text is in the array, otherwise default to 0
        let currentPhraseIndex = phrases.indexOf(h1Element.textContent.trim());
        if (currentPhraseIndex === -1) {
            currentPhraseIndex = 0;
        }

        h1Element.addEventListener('click', () => {
            currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
            h1Element.textContent = phrases[currentPhraseIndex];
        });

        // Prevent double-click text selection on desktop, while still allowing drag selection
        h1Element.addEventListener('mousedown', (e) => {
            if (e.detail > 1) {
                e.preventDefault();
            }
        });

        // Prevent double-tap text selection on mobile devices (iOS & Android)
        let lastTapTime = 0;
        let isDoubleTap = false;

        h1Element.addEventListener('touchstart', (e) => {
            const now = Date.now();
            if (now - lastTapTime < 300) {
                isDoubleTap = true;
            } else {
                isDoubleTap = false;
            }
            lastTapTime = now;
        }, { passive: true });

        document.addEventListener('selectionchange', () => {
            if (isDoubleTap) {
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    if (h1Element.contains(range.commonAncestorContainer)) {
                        selection.removeAllRanges();
                    }
                }
            }
        });
    }
});
