import React from 'react';
// eslint-disable-next-line import/no-unresolved
import BrowserOnly from '@docusaurus/BrowserOnly';
// eslint-disable-next-line import/no-unresolved
import Layout from '@theme/Layout';

import ScalarApiReference from '../components/ScalarApiReference';

export default function WooviApiPage() {
  return (
    <Layout
      title='Woovi API'
      description='Woovi API Documentation'
    >
      <BrowserOnly fallback={<div>Loading...</div>}>
        {() => (
          <ScalarApiReference
            configuration={{
              url: 'https://api.woovi.com/api/openapi.json',
              theme: 'default',
            }}
          />
        )}
      </BrowserOnly>
    </Layout>
  );
}
