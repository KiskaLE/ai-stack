// ==UserScript==
// @name        AI chatbot
// @namespace   usspa
// @match       *://hana2.usspa.cz:4300/usspa/portal/*
// @run-at      document-end
// @grant       none
// @version     2.0.0
// @description  Vloží AI bota
// ==/UserScript==

(function () {
    'use strict';

    injectOverrideCSS();

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

    function injectOverrideCSS() {
        const id = 'vojta-override-sapUiForcedHidden';
        if (document.getElementById(id)) return;
        const style = document.createElement('style');
        style.id = id;
        style.textContent = `
            /* override hidden rule for our iframe and top-level elements */
            .ai-chat * { visibility: visible !important; display: block !important; opacity: 1 !important; }
        `;
        document.body.appendChild(style);
    }
})();
