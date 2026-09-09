import React from 'react';
// eslint-disable-next-line import/no-unresolved
import BrowserOnly from '@docusaurus/BrowserOnly';
// eslint-disable-next-line import/no-unresolved
import Layout from '@theme/Layout';

import ScalarApiReference from '../components/ScalarApiReference';

export default function WooviPixIndirectApiPage() {
  return (
    <Layout
      title='Woovi Pix Indirect API'
      description='Woovi Pix Indirect API Documentation'
    >
      <BrowserOnly fallback={<div>Loading...</div>}>
        {() => (
          <ScalarApiReference
            configuration={{
              url: '/swaggers/pixIndirect.json',
              theme: 'default',
            }}
          />
        )}
      </BrowserOnly>
    </Layout>
  );
}
