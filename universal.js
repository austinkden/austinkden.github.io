// universal.js - Loads and applies the persistent accent theme across all pages
(function() {
    console.log("Version 0.2.2");

    // 0. Universal Loading Screen
    (function() {
        let loader = document.getElementById('astrong-loading-screen');
        if (!loader) {
            // Fallback: If not present in HTML, create and inject it dynamically
            loader = document.createElement('div');
            loader.id = 'astrong-loading-screen';
            loader.innerHTML = '<svg viewBox="0 0 1 1" class="loading-spinner"><path d="M0.3955 0.0590C0.4007 0.0547 0.4033 0.0526 0.4057 0.0508C0.4615 0.0081 0.5385 0.0081 0.5943 0.0508C0.5967 0.0526 0.5993 0.0547 0.6045 0.0590C0.6068 0.0609 0.6079 0.0619 0.6091 0.0628C0.6354 0.0837 0.6675 0.0955 0.7010 0.0966C0.7024 0.0966 0.7039 0.0966 0.7069 0.0967C0.7136 0.0968 0.7170 0.0968 0.7199 0.0970C0.7898 0.1005 0.8488 0.1506 0.8644 0.2195C0.8651 0.2224 0.8657 0.2257 0.8670 0.2324C0.8675 0.2353 0.8678 0.2368 0.8681 0.2383C0.8749 0.2713 0.8921 0.3013 0.9170 0.3238C0.9181 0.3248 0.9192 0.3258 0.9215 0.3277C0.9265 0.3321 0.9291 0.3343 0.9313 0.3364C0.9825 0.3845 0.9959 0.4612 0.9640 0.5241C0.9627 0.5267 0.9610 0.5297 0.9577 0.5356C0.9563 0.5382 0.9556 0.5396 0.9549 0.5409C0.9391 0.5706 0.9331 0.6047 0.9379 0.6381C0.9381 0.6396 0.9383 0.6411 0.9388 0.6440C0.9399 0.6507 0.9404 0.6541 0.9408 0.6570C0.9495 0.7272 0.9109 0.7946 0.8465 0.8221C0.8438 0.8232 0.8406 0.8244 0.8343 0.8268C0.8315 0.8279 0.8301 0.8284 0.8288 0.8290C0.7978 0.8415 0.7715 0.8638 0.7539 0.8925C0.7531 0.8937 0.7524 0.8950 0.7508 0.8976C0.7474 0.9034 0.7457 0.9063 0.7441 0.9089C0.7061 0.9682 0.6337 0.9948 0.5668 0.9740C0.5640 0.9732 0.5608 0.9720 0.5545 0.9698C0.5517 0.9688 0.5503 0.9683 0.5489 0.9679C0.5171 0.9573 0.4829 0.9573 0.4511 0.9679C0.4497 0.9683 0.4483 0.9688 0.4455 0.9698C0.4392 0.9720 0.4360 0.9732 0.4332 0.9740C0.3663 0.9948 0.2939 0.9682 0.2559 0.9089C0.2543 0.9063 0.2526 0.9034 0.2492 0.8976C0.2476 0.8950 0.2469 0.8937 0.2461 0.8925C0.2285 0.8638 0.2022 0.8415 0.1712 0.8290C0.1699 0.8284 0.1685 0.8279 0.1657 0.8268C0.1594 0.8244 0.1562 0.8232 0.1535 0.8221C0.0891 0.7946 0.0505 0.7272 0.0592 0.6570C0.0596 0.6541 0.0601 0.6507 0.0612 0.6440C0.0617 0.6411 0.0619 0.6396 0.0621 0.6381C0.0669 0.6047 0.0609 0.5706 0.0451 0.5409C0.0444 0.5396 0.0437 0.5382 0.0423 0.5356C0.0390 0.5297 0.0373 0.5267 0.0360 0.5241C0.0041 0.4612 0.0175 0.3845 0.0687 0.3364C0.0709 0.3343 0.0735 0.3321 0.0785 0.3277C0.0808 0.3258 0.0819 0.3248 0.0830 0.3238C0.1079 0.3013 0.1251 0.2713 0.1319 0.2383C0.1322 0.2368 0.1325 0.2353 0.1330 0.2324C0.1343 0.2257 0.1349 0.2224 0.1356 0.2195C0.1512 0.1506 0.2102 0.1005 0.2801 0.0970C0.2830 0.0968 0.2864 0.0968 0.2931 0.0967C0.2961 0.0966 0.2976 0.0966 0.2990 0.0966C0.3325 0.0955 0.3646 0.0837 0.3909 0.0628C0.3921 0.0619 0.3932 0.0609 0.3955 0.0590Z" fill="#ffffff" /></svg>';
            
            // Inject fallback style
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
                @keyframes loading-spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
            
            const injectLoader = () => {
                if (document.body) {
                    document.body.insertBefore(loader, document.body.firstChild);
                } else {
                    document.addEventListener('DOMContentLoaded', () => {
                        document.body.insertBefore(loader, document.body.firstChild);
                    });
                }
            };
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', injectLoader);
            } else {
                injectLoader();
            }
        }

        // Handle page load and fade out loader
        const startTime = performance.now();
        const minDuration = 400; // minimum duration in ms to prevent abrupt flashes

        let isWindowLoaded = false;
        let isSpotifyDecided = !document.getElementById('spotify-widget');

        function tryHideLoader() {
            if (isWindowLoaded && isSpotifyDecided) {
                const elapsed = performance.now() - startTime;
                const remaining = Math.max(0, minDuration - elapsed);
                setTimeout(() => {
                    loader.classList.add('fade-out');
                    setTimeout(() => {
                        if (loader.parentNode) {
                            loader.parentNode.removeChild(loader);
                        }
                    }, 300);
                }, remaining);
            }
        }

        window.addEventListener('load', () => {
            isWindowLoaded = true;
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
        
        // Safety fallback in case resources take too long to load
        setTimeout(() => {
            if (!loader.classList.contains('fade-out')) {
                isWindowLoaded = true;
                isSpotifyDecided = true;
                tryHideLoader();
            }
        }, 3000);
    })();
    
    // 1. Theme Loader
    const savedAccent = localStorage.getItem('astrong_accent') || 'purple';
    const savedMode = localStorage.getItem('astrong_mode') || 'dark';
    applyTheme(savedAccent, savedMode);

    function applyTheme(accent, mode) {
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
                red: { primary: '#eb3f56', container: '#801323', onPrimary: '#ffffff' },
                orange: { primary: '#ff7524', container: '#8c3000', onPrimary: '#ffffff' },
                yellow: { primary: '#f5b500', container: '#5f4600', onPrimary: '#ffffff' },
                green: { primary: '#00c853', container: '#1b5e20', onPrimary: '#ffffff' },
                blue: { primary: '#00b0ff', container: '#005780', onPrimary: '#ffffff' },
                purple: { primary: '#8859ff', container: '#4527a0', onPrimary: '#ffffff' },
                white: { primary: '#ffffff', container: '#444444', onPrimary: '#121016' }
            },
            light: {
                red: { primary: '#eb3f56', container: '#fad7da', onPrimary: '#ffffff' },
                orange: { primary: '#ff7524', container: '#ffd0b3', onPrimary: '#ffffff' },
                yellow: { primary: '#bf8d00', container: '#ffe199', onPrimary: '#ffffff' },
                green: { primary: '#1f793c', container: '#ccefd6', onPrimary: '#ffffff' },
                blue: { primary: '#1976d2', container: '#bbdefb', onPrimary: '#ffffff' },
                purple: { primary: '#8859ff', container: '#f2edff', onPrimary: '#ffffff' },
                white: { primary: '#1d1b20', container: '#e6e1e5', onPrimary: '#ffffff' }
            }
        };
        const theme = (themes[mode] && themes[mode][accent]) ? themes[mode][accent] : themes['dark']['purple'];
        if (theme) {
            document.documentElement.style.setProperty('--primary', theme.primary);
            document.documentElement.style.setProperty('--primary-container', theme.container);
            document.documentElement.style.setProperty('--on-primary', theme.onPrimary);
        }
    }
    window.applyTheme = applyTheme;

    // 2. Global Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
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
    });

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
            zIndex: '9999',
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

    // 4. Initialize DOM Features
    document.addEventListener('DOMContentLoaded', () => {
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
    });

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
                    <clipPath id="arrow" clipPathUnits="objectBoundingBox">
                        <path d="M0.7049 0.2604C0.7616 0.3503 0.8750 0.5301 0.8750 0.5301C0.8750 0.5301 0.9475 0.6474 0.9487 0.7154C0.9500 0.7900 0.9027 0.8625 0.8367 0.8881C0.7836 0.9087 0.7245 0.9002 0.6695 0.8863C0.6144 0.8724 0.5597 0.8532 0.5031 0.8532C0.4371 0.8531 0.3737 0.8791 0.3089 0.8928C0.2498 0.9054 0.1712 0.9091 0.1226 0.8633C0.0762 0.8194 0.0500 0.7523 0.0597 0.6864C0.0678 0.6319 0.0976 0.5841 0.1266 0.5383C0.1878 0.4419 0.2490 0.3455 0.3101 0.2491C0.3328 0.2134 0.3557 0.1774 0.3853 0.1482C0.4149 0.1189 0.4524 0.0965 0.4928 0.0939C0.5389 0.0909 0.5838 0.1138 0.6185 0.1462C0.6531 0.1785 0.6792 0.2197 0.7049 0.2604Z" />
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
            'arrow',
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

        // Long press → reverse direction (mobile equivalent of right-click)
        wrapper.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            isLongPress = false;
            startX = e.clientX;
            startY = e.clientY;
            longPressTimer = setTimeout(() => {
                isLongPress = true;
                reverseRotation();
                temporarySpeedUp();
            }, 600);
        });

        wrapper.addEventListener('pointerup', () => {
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
            reverseRotation();
            temporarySpeedUp();
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

            const items = [
                { label: 'Home', action: () => window.location.href = 'https://astrong.xyz' },
                { label: 'Schedule', action: () => window.location.href = 'https://schedule.astrong.xyz' },
                { label: 'Utilities', action: () => window.location.href = 'https://utility.astrong.xyz' },
                { label: 'About', action: () => window.location.href = 'https://astrong.xyz/about' }
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
                if (it.type === 'separator') {
                    const sep = document.createElement('div');
                    Object.assign(sep.style, {
                        height: '1px',
                        background: 'var(--outline, #49454f)',
                        margin: '6px 4px'
                    });
                    menu.appendChild(sep);
                } else {
                    const btn = document.createElement('button');
                    btn.textContent = it.label;
                    Object.assign(btn.style, {
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--on-surface, #e6e1e5)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease, color 0.15s ease'
                    });
                    
                    btn.addEventListener('mouseenter', () => {
                        btn.style.background = 'var(--surface-variant, #2d2a33)';
                        btn.style.color = '#ffffff';
                    });
                    btn.addEventListener('mouseleave', () => {
                        btn.style.background = 'transparent';
                        btn.style.color = 'var(--on-surface, #e6e1e5)';
                    });
                    btn.addEventListener('click', () => {
                        it.action();
                        menu.style.display = 'none';
                    });

                    menu.appendChild(btn);
                }
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
            if (!menu.contains(e.target)) {
                menu.style.display = 'none';
            }
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                menu.style.display = 'none';
            }
        });
    }
})();