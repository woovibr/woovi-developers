import React from 'react';
// eslint-disable-next-line import/no-unresolved
import BrowserOnly from '@docusaurus/BrowserOnly';
// eslint-disable-next-line import/no-unresolved
import Layout from '@theme/Layout';

function ApiElementsInner() {
  const [Component, setComponent] =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    React.useState<React.ComponentType<any> | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    // Add CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/@stoplight/elements@8.3.0/styles.min.css';
    document.head.appendChild(link);

    // Dynamic import of the React component
    import('@stoplight/elements')
      .then((mod) => {
        if (mounted) {
          setComponent(() => mod.API);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err?.message || 'Failed to load Stoplight Elements');
        }
      });

    return () => {
      mounted = false;
      // Stoplight's sheet restyles bare html/body, so it must not outlive the page.
      link.remove();
    };
  }, []);

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        Error loading API documentation: {error}
      </div>
    );
  }

  if (!Component) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        Loading API documentation...
      </div>
    );
  }

  return (
    <div style={{ height: 'calc(100vh - 60px)' }}>
      <Component
        apiDescriptionUrl='https://api.woovi.com/api/openapi.json'
        router='hash'
        layout='sidebar'
      />
    </div>
  );
}

export default function ApiElements() {
  return (
    <Layout
      title='Woovi API - Stoplight Elements'
      description='Woovi API Documentation with Stoplight Elements'
    >
      <BrowserOnly fallback={<div style={{ padding: '20px' }}>Loading...</div>}>
        {() => <ApiElementsInner />}
      </BrowserOnly>
    </Layout>
  );
}
