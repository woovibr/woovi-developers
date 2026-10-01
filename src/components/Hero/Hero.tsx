import React, { useEffect, useState } from 'react';
import Link from '@docusaurus/Link';
import clsx from 'clsx';

import styles from './Hero.module.css';
import { HeroBackground } from './HeroBackground';
import { CodeCard } from './CodeCard';

type Props = {
  integrationsCount: number;
};

// counts up once on mount; static for reduced motion and on the server
const useCountUp = (target: number, ms = 1100) => {
  const [value, setValue] = useState(target);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    setValue(0);
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [target, ms]);

  return value;
};

const rise = (i: number) => ({ '--rise': i }) as React.CSSProperties;

const Hero = ({ integrationsCount }: Props) => {
  const count = useCountUp(integrationsCount);

  return (
    <header className={styles.hero}>
      <HeroBackground />
      <div className={styles.scrim} aria-hidden='true' />

      <div className={styles.inner}>
        <div className={styles.copy}>
          <span className={clsx(styles.eyebrow, styles.rise)} style={rise(0)}>
            <span className={styles['eyebrow--dot']} />
            API Pix, webhooks em tempo real e SDKs
          </span>

          <h1 className={clsx(styles.title, styles.rise)} style={rise(1)}>
            Pix na sua aplicação
            <br />
            <span className={styles['title--accent']}>em minutos</span>
          </h1>

          <p className={clsx(styles.subtitle, styles.rise)} style={rise(2)}>
            Documentação, APIs e SDKs da Woovi para criar cobranças, receber a
            confirmação do pagamento no mesmo segundo e integrar Pix onde você
            já vende.
          </p>

          <div className={clsx(styles.actions, styles.rise)} style={rise(3)}>
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

          <p className={clsx(styles.secondary, styles.rise)} style={rise(4)}>
            <Link to='/docs/playground'>Playgrounds</Link>
            <span aria-hidden='true'>·</span>
            <Link to='/docs/test-environment'>Ambiente de teste</Link>
            <span aria-hidden='true'>·</span>
            <Link to='/docs/apis/api-getting-started'>Chaves de API</Link>
            <span aria-hidden='true'>·</span>
            <Link to='/docs/webhook/platform/webhook-platform-api'>
              Webhooks
            </Link>
          </p>
        </div>

        <div className={clsx(styles.showcase, styles.rise)} style={rise(2)}>
          <CodeCard />
        </div>

        <dl className={clsx(styles.stats, styles.rise)} style={rise(5)}>
          <div className={styles['stats--item']}>
            <dt>{count}+</dt>
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
