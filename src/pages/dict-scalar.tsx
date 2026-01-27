import React, { useEffect, useState } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Layout from '@theme/Layout';

function ApiScalarInner() {
  const [ApiReference, setApiReference] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const mod = await import('@scalar/api-reference-react');
      await import('@scalar/api-reference-react/style.css');

      if (mounted) setApiReference(() => mod.ApiReferenceReact);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (!ApiReference) return <div>Loading...</div>;

  return (
    <div style={{ height: 'calc(100vh - 60px)' }}>
      <ApiReference
        configuration={{
          url: '/swaggers/bacen-dict.json',
          theme: 'default',
        }}
      />
    </div>
  );
}

export default function ApiScalar() {
  return (
    <Layout
      title="Bacen DICT API"
      description="Bacen DICT API Documentation"
    >
      <BrowserOnly fallback={<div>Loading...</div>}>
        {() => <ApiScalarInner />}
      </BrowserOnly>
    </Layout>
  );
}
