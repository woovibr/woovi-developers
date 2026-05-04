import React from 'react';
// eslint-disable-next-line import/no-unresolved
import BrowserOnly from '@docusaurus/BrowserOnly';
// eslint-disable-next-line import/no-unresolved
import Layout from '@theme/Layout';

import WebhookEventExplorer from '../components/WebhookEventExplorer/WebhookEventExplorer';

const WebhookEventsPage = () => {
  return (
    <Layout
      title='Explorador de eventos de webhook'
      description='Selecione um tipo de evento de webhook da Woovi e copie o payload em JSON, TypeScript, JSON Schema, Yup ou Zod.'
    >
      <main>
        <div style={{ textAlign: 'center', padding: '24px 16px 0' }}>
          <h1>Explorador de eventos de webhook</h1>
          <p style={{ maxWidth: 760, margin: '0 auto', opacity: 0.8 }}>
            Selecione um tipo de evento, veja o payload de exemplo e copie como
            JSON, TypeScript types, JSON Schema, Yup ou Zod schemas.
          </p>
        </div>
        <BrowserOnly fallback={<div>Carregando…</div>}>
          {() => <WebhookEventExplorer />}
        </BrowserOnly>
      </main>
    </Layout>
  );
};

export default WebhookEventsPage;
