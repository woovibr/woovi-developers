import React, { useEffect, useState } from 'react';

import BrowserOnly from '@docusaurus/BrowserOnly';
import Layout from '@theme/Layout';

import { buildStableOpenApi } from '../openapi/stableOpenApi';

import styles from './stable.module.css';

const OPENAPI_URL = 'https://api.woovi.com/api/openapi.json';

type ApiReferenceComponent =
  (typeof import('@scalar/api-reference-react'))['ApiReferenceReact'];

const LoadingState = () => (
  <div className={styles.status}>
    <div className={styles.statusCard} role='status'>
      <span className={styles.statusMark} aria-hidden='true' />
      <h1>Loading Stablecoin API</h1>
      <p>Preparing On Ramp, Off Ramp and Wallets endpoints.</p>
    </div>
  </div>
);

function StableApiReference() {
  const [ApiReference, setApiReference] =
    useState<ApiReferenceComponent | null>(null);
  const [openApi, setOpenApi] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();
    let mounted = true;

    const loadReference = async () => {
      try {
        const [scalar, response] = await Promise.all([
          import('@scalar/api-reference-react'),
          fetch(OPENAPI_URL, { signal: abortController.signal }),
          import('@scalar/api-reference-react/style.css'),
        ]);

        if (!response.ok) {
          throw new Error(
            `OpenAPI request failed with status ${response.status}.`,
          );
        }

        const stableOpenApi = buildStableOpenApi(await response.json());

        if (mounted) {
          setApiReference(() => scalar.ApiReferenceReact);
          setOpenApi(stableOpenApi);
        }
      } catch (loadError) {
        if (mounted && !abortController.signal.aborted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'The Stablecoin API reference could not be loaded.',
          );
        }
      }
    };

    void loadReference();

    return () => {
      mounted = false;
      abortController.abort();
    };
  }, []);

  if (error) {
    return (
      <div className={styles.status}>
        <div className={styles.statusCard} role='alert'>
          <h1>Stablecoin API is unavailable</h1>
          <p>{error}</p>
          <a href={OPENAPI_URL}>Open the complete OpenAPI document</a>
        </div>
      </div>
    );
  }

  if (!ApiReference || !openApi) return <LoadingState />;

  return (
    <div className={styles.reference}>
      <ApiReference
        configuration={{
          content: openApi,
          hideModels: true,
          theme: 'default',
        }}
      />
    </div>
  );
}

export default function StableApiPage() {
  return (
    <Layout
      title='Stablecoin API'
      description='Woovi Stablecoin API: On Ramp, Off Ramp and Wallets'
    >
      <BrowserOnly fallback={<LoadingState />}>
        {() => <StableApiReference />}
      </BrowserOnly>
    </Layout>
  );
}
