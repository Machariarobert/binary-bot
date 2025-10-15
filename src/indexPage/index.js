// Landing page completely removed - index.html now immediately redirects to bot.html
// This file is kept minimal for the webpack build process

// Redirect to bot.html if somehow loaded
if (typeof window !== 'undefined') {
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        window.location.replace('bot.html');
    }
}

// Export empty functions for compatibility with bot page imports
export const setTimeOutBanner = () => {};
export const getComponent = () => ({ Component: null, dynamicRoutePathanme: null });
