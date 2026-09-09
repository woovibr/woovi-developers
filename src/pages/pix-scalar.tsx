import React from 'react';
// eslint-disable-next-line import/no-unresolved
import BrowserOnly from '@docusaurus/BrowserOnly';
// eslint-disable-next-line import/no-unresolved
import Layout from '@theme/Layout';

import ScalarApiReference from '../components/ScalarApiReference';

export default function BacenPixApiPage() {
  return (
    <Layout
      title='Bacen Pix API'
      description='Bacen Pix API Documentation'
    >
      <BrowserOnly fallback={<div>Loading...</div>}>
        {() => (
          <ScalarApiReference
            configuration={{
              url: '/swaggers/bacen-pix.yaml',
              theme: 'default',
            }}
          />
        )}
      </BrowserOnly>
    </Layout>
  );
}
