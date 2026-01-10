import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const MOUNT_POINT_ID = 'ai-widget-root';
const CONTAINER_ID = 'ai-widget-container';

const mountWidget = () => {
    // Check if we are in dev mode (standalone index.html)
    const devRoot = document.getElementById(MOUNT_POINT_ID);
    if (devRoot) {
        createRoot(devRoot).render(
            <StrictMode>
                <App />
            </StrictMode>
        );
        return;
    }

    // Injection Mode
    if (document.getElementById(CONTAINER_ID)) return;

    const container = document.createElement('div');
    container.id = CONTAINER_ID;
    container.style.position = 'fixed';

    // We don't want the wrapper div to block interactions when chat is closed,
    // but we need it to be consistent. 
    // Usually, we set zIndex high. But `position: fixed` without size might collapse or behave oddly differently.
    // The App component itself handles positioning of FAB and Window.
    // So we can let the container just be a mounting point.
    // However, for ShadowDOM to work reliably with Tailwind, we need to ensure styles are INSIDE the shadow root.

    document.body.appendChild(container);

    const shadow = container.attachShadow({ mode: 'open' });
    const rootElement = document.createElement('div');
    shadow.appendChild(rootElement);

    // --------------------------------------------------------
    // CRITICAL FIX: Inject styles into Shadow DOM
    // --------------------------------------------------------
    // 'vite-plugin-css-injected-by-js' (and generic Vite dev) puts styles in <head>.
    // Shadow DOM isolates them, so we must manually copy them or link them.
    // In production build (single file), the styles are often JS-injected into head too.
    // A robust way for widgets is to find the relevant style tags and clone them,
    // OR allow global styles (not recommended)
    // OR use the adoptedStyleSheets API if we can get the CSS text.

    // Since we use @tailwindcss/vite, classes are generated associated with the content.
    // We will attempt a runtime trick: observe <head> for styles and copy them,
    // or specifically for this setup, we rely on the fact that `vite-plugin-css-injected-by-js`
    // can be configured to use a custom function, OR we just do it manually here.

    // Simple Hack for Dev/Prod alignment: 
    // Copy all <style> and <link rel="stylesheet"> from document.head to shadowRoot
    // THIS IS HEAVY but ensures styles apply.

    const copyStyles = () => {
        const styles = document.head.querySelectorAll('style, link[rel="stylesheet"]');
        styles.forEach((style) => {
            shadow.appendChild(style.cloneNode(true));
        });
    };

    // Initial copy
    copyStyles();

    // Observer for new styles (e.g. HMR or lazy loading)
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeName === 'STYLE' || (node.nodeName === 'LINK' && (node as HTMLLinkElement).rel === 'stylesheet')) {
                    shadow.appendChild(node.cloneNode(true));
                }
            });
        });
    });

    observer.observe(document.head, { childList: true, subtree: true });
    // --------------------------------------------------------

    createRoot(rootElement).render(
        <StrictMode>
            <App />
        </StrictMode>
    );
};

mountWidget();
