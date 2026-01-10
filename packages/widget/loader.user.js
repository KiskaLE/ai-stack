// ==UserScript==
// @name         AI Widget Loader
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Injects AI Widget into the page
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const WIDGET_URL = 'http://localhost:5173/src/main.tsx'; // Dev
    // const WIDGET_URL = 'http://localhost:3000/static/widget.js'; // Prod

    const isDev = true;

    if (isDev) {
        // Vite Client
        const viteClient = document.createElement('script');
        viteClient.type = 'module';
        viteClient.src = 'http://localhost:5173/@vite/client';
        document.body.appendChild(viteClient);

        // React Refresh
        const preambleInfo = `
        import RefreshRuntime from 'http://localhost:5173/@react-refresh';
        RefreshRuntime.injectIntoGlobalHook(window);
        window.$RefreshReg$ = () => {};
        window.$RefreshSig$ = () => (type) => type;
        window.__vite_plugin_react_preamble_installed__ = true;
        `;
        const preambleScript = document.createElement('script');
        preambleScript.type = 'module';
        preambleScript.textContent = preambleInfo;
        document.body.appendChild(preambleScript);

        // Load Widget
        setTimeout(() => {
            const script = document.createElement('script');
            script.type = 'module';
            script.src = WIDGET_URL;
            document.body.appendChild(script);
        }, 100);
    }
})();
