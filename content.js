(function() {
    'use strict';

    let isProcessing = false;
    let lastProcessTime = 0;
    const THROTTLE_DELAY = 100;

    function blockShortsUrls() {
        if (window.location.pathname.includes('/shorts/') || window.location.pathname.includes('/playables/')) {
            window.location.href = 'https://www.youtube.com/';
            return;
        }
    }

    function removeShortsElements() {
        const now = Date.now();
        if (isProcessing || (now - lastProcessTime) < THROTTLE_DELAY) {
            return;
        }
        
        isProcessing = true;
        lastProcessTime = now;

        requestAnimationFrame(() => {
            try {
                const shortsElements = document.querySelectorAll([
                    'ytd-rich-shelf-renderer[is-shorts]',
                    'ytd-reel-shelf-renderer', 
                    'ytd-shorts-shelf-renderer',
                    'ytd-gaming-home-header-renderer',
                    'ytd-rich-shelf-renderer[title*="Playables"]',
                    'ytd-rich-shelf-renderer:has([title*="Shorts"])',
                    'div[aria-label*="Shorts"]',
                    '[title*="Shorts"]'
                ].join(','));

                for (const element of shortsElements) {
                    if (element.style.display !== 'none') {
                        element.style.display = 'none';
                    }
                }

                const shortLinks = document.querySelectorAll('a[href*="/shorts/"], a[href*="/playables/"]');
                for (const link of shortLinks) {
                    const container = link.closest('ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer, ytd-rich-item-renderer, ytd-thumbnail');
                    if (container && container.style.display !== 'none') {
                        container.style.display = 'none';
                    }
                }

                const titleElements = document.querySelectorAll('[title*="Shorts"], [aria-label*="Shorts"]');
                for (const element of titleElements) {
                    const container = element.closest('ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer, ytd-rich-item-renderer, ytd-rich-shelf-renderer');
                    if (container && container.style.display !== 'none') {
                        container.style.display = 'none';
                    }
                }
            } finally {
                isProcessing = false;
            }
        });
    }

    function blockShortsLinks() {
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (link && link.href && (link.href.includes('/shorts/') || link.href.includes('/playables/'))) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }, true);
    }

    let observerTimeout;
    function handleMutations(mutations) {
        clearTimeout(observerTimeout);
        observerTimeout = setTimeout(() => {
            removeShortsElements();
        }, 50);
    }

    function init() {
        blockShortsUrls();
        removeShortsElements();
        blockShortsLinks();

        const observer = new MutationObserver(handleMutations);
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    let urlCheckTimeout;
    function throttledUrlCheck() {
        clearTimeout(urlCheckTimeout);
        urlCheckTimeout = setTimeout(() => {
            blockShortsUrls();
            removeShortsElements();
        }, 200);
    }

    window.addEventListener('popstate', throttledUrlCheck);

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function() {
        originalPushState.apply(history, arguments);
        throttledUrlCheck();
    };

    history.replaceState = function() {
        originalReplaceState.apply(history, arguments);
        throttledUrlCheck();
    };
})();