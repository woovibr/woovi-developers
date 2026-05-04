import React from 'react';
// eslint-disable-next-line import/no-unresolved
import BrowserOnly from '@docusaurus/BrowserOnly';
// eslint-disable-next-line import/no-unresolved
import Layout from '@theme/Layout';

import CobvSimulator from '../components/CobvSimulator/CobvSimulator';

const CobvSimulatorPage = () => {
  return (
    <Layout
      title='Simulador de cobv'
      description='Simulador interativo de cobranças Pix com vencimento (cobv) — desconto, multa e juros calculados localmente.'
    >
      <main>
        <div style={{ textAlign: 'center', padding: '24px 16px 0' }}>
          <h1>Simulador de cobv</h1>
          <p style={{ maxWidth: 720, margin: '0 auto', opacity: 0.8 }}>
            Ajuste o valor, vencimento, desconto, multa e juros para ver como o
            valor da cobrança evolui ao longo do tempo. Todos os cálculos são
            feitos localmente — nenhuma chamada à API é executada.
          </p>
        </div>
        <BrowserOnly fallback={<div>Carregando…</div>}>
          {() => <CobvSimulator />}
        </BrowserOnly>
      </main>
    </Layout>
  );
};

export default CobvSimulatorPage;
