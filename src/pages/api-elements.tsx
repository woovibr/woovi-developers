import React, { useEffect, useRef, useState } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Layout from '@theme/Layout';

function ApiElementsInner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadElements = async () => {
      try {
        // Initialize Prism globally BEFORE loading Stoplight Elements
        // This prevents the "Cannot set properties of undefined" error
        if (typeof window !== 'undefined') {
          const prismMod = await import('prismjs');
          const Prism = prismMod.default ?? prismMod;

          // Ensure Prism and languages object exist
          (window as any).Prism = Prism;
          if (!Prism.languages) {
            Prism.languages = {};
          }
          Prism.manual = true;
        }

        // Load CSS
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://unpkg.com/@stoplight/elements@8/styles.min.css';
        document.head.appendChild(cssLink);

        await new Promise((resolve) => {
          cssLink.onload = resolve;
          cssLink.onerror = resolve;
        });

        // Load web components
        const script = document.createElement('script');
        script.src =
          'https://unpkg.com/@stoplight/elements@8/web-components.min.js';

        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () =>
            reject(new Error('Failed to load Stoplight Elements'));
          document.body.appendChild(script);
        });

        if (mounted && containerRef.current) {
          const elementsApi = document.createElement('elements-api');
          elementsApi.setAttribute('apiDescriptionUrl', '/swaggers/woovi.json');
          elementsApi.setAttribute('router', 'hash');
          elementsApi.setAttribute('layout', 'sidebar');

          containerRef.current.innerHTML = '';
          containerRef.current.appendChild(elementsApi);
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load API documentation',
          );
          setIsLoading(false);
        }
      }
    };

    loadElements();

    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div style={{ height: 'calc(100vh - 60px)', position: 'relative' }}>
      {isLoading && (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          Loading API documentation...
        </div>
      )}
      <div ref={containerRef} style={{ height: '100%' }} />
    </div>
  );
}

export default function ApiElements() {
  return (
    <Layout
      title="Woovi API - Stoplight Elements"
      description="Woovi API Documentation with Stoplight Elements"
    >
      <BrowserOnly fallback={<div style={{ padding: '20px' }}>Loading...</div>}>
        {() => <ApiElementsInner />}
      </BrowserOnly>
    </Layout>
  );
}
