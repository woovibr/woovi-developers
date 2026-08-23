import React from 'react';
import Link from '@docusaurus/Link';
import clsx from 'clsx';

import styles from './Hero.module.css';
import { HeroBackground } from './HeroBackground';
import { CodeCard } from './CodeCard';

type Props = {
  integrationsCount: number;
};

const Hero = ({ integrationsCount }: Props) => {
  return (
    <header className={styles.hero}>
      <HeroBackground />
      <div className={styles.scrim} aria-hidden='true' />

      <div className={styles.inner}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>
            <span className={styles['eyebrow--dot']} />
            API Pix, webhooks em tempo real e SDKs
          </span>

          <h1 className={styles.title}>
            Pix na sua aplicação
            <br />
            <span className={styles['title--accent']}>em minutos</span>
          </h1>

          <p className={styles.subtitle}>
            Documentação, APIs e SDKs da Woovi para criar cobranças, receber a
            confirmação do pagamento no mesmo segundo e integrar Pix onde você
            já vende.
          </p>

          <div className={styles.actions}>
            <Link
              className={clsx(styles.button, styles['button--primary'])}
              to='/docs/intro/getting-started'
            >
              Começar agora
            </Link>
            <Link
              className={clsx(styles.button, styles['button--ghost'])}
              to='/api'
            >
              Explorar a API
            </Link>
          </div>

          <p className={styles.secondary}>
            <Link to='/docs/test-environment'>Ambiente de teste</Link>
            <span aria-hidden='true'>·</span>
            <Link to='/docs/apis/api-getting-started'>Chaves de API</Link>
            <span aria-hidden='true'>·</span>
            <Link to='/docs/webhook/platform/webhook-platform-api'>
              Webhooks
            </Link>
          </p>
        </div>

        <div className={styles.showcase}>
          <CodeCard />
        </div>

        <dl className={styles.stats}>
          <div className={styles['stats--item']}>
            <dt>{integrationsCount}+</dt>
            <dd>integrações e plugins prontos</dd>
          </div>
          <div className={styles['stats--item']}>
            <dt>Webhooks</dt>
            <dd>eventos de pagamento em tempo real</dd>
          </div>
          <div className={styles['stats--item']}>
            <dt>Sandbox</dt>
            <dd>ambiente de teste gratuito</dd>
          </div>
        </dl>
      </div>
    </header>
  );
};

export { Hero };
