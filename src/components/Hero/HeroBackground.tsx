import React, { Suspense, lazy, useEffect, useState } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

import styles from './Hero.module.css';

// The shader lives in its own async chunk so it never touches the initial payload.
// To swap the look, point this import at another threeui background component and
// update the module declaration in `src/global.d.ts`. Other WebGL-only options
// (no extra `three` chunk): LiquidFormBackground, DotMatrixBackground,
// CondensationBackground, CrtBackground.
const RibbonField = lazy(() =>
  import('@designcodeio/threeui/components/RibbonFieldBackground').then(
    (mod) => ({ default: mod.RibbonFieldBackground }),
  ),
);

const hasWebGL = () => {
  try {
    const canvas = document.createElement('canvas');

    return Boolean(
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl'),
    );
  } catch {
    return false;
  }
};

const ShaderLayer = () => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const webgl = hasWebGL();
    const update = () => setEnabled(webgl && !media.matches);

    update();
    media.addEventListener('change', update);

    return () => media.removeEventListener('change', update);
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <RibbonField hue={-24} saturation={1.1} brightness={1.05} speed={0.85} />
    </Suspense>
  );
};

// Animated WebGL ribbons behind the hero. Falls back to the CSS gradient
// underneath on SSR, without WebGL, or with `prefers-reduced-motion`.
const HeroBackground = () => (
  <div className={styles.shader} aria-hidden='true'>
    <BrowserOnly>{() => <ShaderLayer />}</BrowserOnly>
  </div>
);

export { HeroBackground };
