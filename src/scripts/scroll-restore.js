/**
 * Scroll Position Restoration
 * Remembers and restores scroll position when navigating back
 */

export function setupScrollRestore() {
    const SCROLL_STORAGE_KEY = 'scrollPositions';
    const DEBUG = true;

    function log(...args) {
        if (DEBUG) console.log('[ScrollRestore]', ...args);
    }

    log('Initializing...');

    // Get the main scrollable container
    function getScrollContainer() {
        // Priority: .main (Astro app) > window (Fallback)
        const mainContainer = document.querySelector('.main');
        if (mainContainer) {
            return mainContainer;
        }
        log('Warning: .main container NOT found, falling back to window');
        return window;
    }

    // Get current scroll position
    function getScrollPosition() {
        const container = getScrollContainer();
        if (container === window) {
            return window.scrollY;
        }
        return container.scrollTop;
    }

    // Set scroll position
    function setScrollPosition(position) {
        const container = getScrollContainer();
        log(`Setting scroll position to ${position} on`, container === window ? 'window' : '.main');
        if (container === window) {
            window.scrollTo(0, position);
        } else {
            container.scrollTop = position;
        }
    }

    // Get stored scroll positions
    function getStoredPositions() {
        try {
            const stored = sessionStorage.getItem(SCROLL_STORAGE_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            log('Error reading storage', e);
            return {};
        }
    }

    // Save scroll position for current page
    function saveScrollPosition() {
        const positions = getStoredPositions();
        const currentPath = window.location.pathname;
        const position = getScrollPosition();

        positions[currentPath] = position;
        log(`Saving position for ${currentPath}: ${position}`);

        try {
            sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(positions));
        } catch (e) {
            console.warn('Scroll restore: Failed to save position', e);
        }
    }

    // Restore scroll position for current page
    function restoreScrollPosition() {
        const positions = getStoredPositions();
        const currentPath = window.location.pathname;
        const savedPosition = positions[currentPath];

        log(`Attempting to restore for ${currentPath}. Saved: ${savedPosition}`);

        if (savedPosition !== undefined && savedPosition > 0) {
            // Attempt restoration immediately
            setScrollPosition(savedPosition);

            // Retry a few times in case content loads dynamically
            [50, 100, 300, 500].forEach(delay => {
                setTimeout(() => {
                    const currentPos = getScrollPosition();
                    log(`Retry (${delay}ms) - Current: ${currentPos}, Target: ${savedPosition}`);

                    // Force restore if we are far off
                    if (Math.abs(currentPos - savedPosition) > 10) {
                        log(`Retry (${delay}ms) - correcting position`);
                        setScrollPosition(savedPosition);
                    }
                }, delay);
            });
        } else {
            log('No saved position or position is 0');
        }
    }

    // Event Handlers

    // 1. Save on scroll (throttled)
    let scrollTimeout;
    function handleScroll() {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            // log('Scroll event (debounced)'); // Too detailed
            saveScrollPosition();
        }, 100);
    }

    // 2. Save before unloading (refresh/nav)
    function handleBeforeUnload() {
        log('beforeunload event');
        saveScrollPosition();
    }

    // 3. Save on link clicks (internal navigation)
    function handleLinkClick(event) {
        const link = event.target.closest('a');
        if (link && link.href && link.host === window.location.host && !link.target) {
            log('Link click detected', link.href);
            saveScrollPosition();
        }
    }

    // 4. Restore on PopState (browser back/forward)
    function handlePopState() {
        log('popstate event detected');
        restoreScrollPosition();
    }

    // Initialize
    const container = getScrollContainer();
    log('Container found:', container === window ? 'window' : '.main');

    // Attach listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('click', handleLinkClick);

    if (container === window) {
        window.addEventListener('scroll', handleScroll, { passive: true });
    } else {
        container.addEventListener('scroll', handleScroll, { passive: true });
    }

    // Check navigation type to decide if we should restore
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }

    // Initial restore check
    restoreScrollPosition();

    return function cleanup() {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('popstate', handlePopState);
        document.removeEventListener('click', handleLinkClick);

        if (container === window) {
            window.removeEventListener('scroll', handleScroll);
        } else {
            container.removeEventListener('scroll', handleScroll);
        }
    };
}
