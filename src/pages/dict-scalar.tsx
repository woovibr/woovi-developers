import React from 'react';
// eslint-disable-next-line import/no-unresolved
import BrowserOnly from '@docusaurus/BrowserOnly';
// eslint-disable-next-line import/no-unresolved
import Layout from '@theme/Layout';

import ScalarApiReference from '../components/ScalarApiReference';

export default function BacenDictApiPage() {
  return (
    <Layout
      title='Bacen DICT API'
      description='Bacen DICT API Documentation'
    >
      <BrowserOnly fallback={<div>Loading...</div>}>
        {() => (
          <ScalarApiReference
            configuration={{
              url: '/swaggers/bacen-dict.json',
              theme: 'default',
            }}
          />
        )}
      </BrowserOnly>
    </Layout>
  );
}
