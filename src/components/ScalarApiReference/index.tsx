import React, { useEffect, useState } from 'react';

// Loads Scalar on the client and undoes the one thing it leaves behind.
//
// @scalar/use-hooks writes `light-mode`/`dark-mode` on document.body and its
// own teardown drops only the matchMedia listener, so under SPA navigation the
// class outlives the page. Scalar's stylesheet ships in the single Docusaurus
// bundle and carries `body { background-color: var(--scalar-background-1) }`,
// a variable defined only on those two classes — so an orphaned class repaints
// every later route (white docs in dark mode), and removing it makes the whole
// sheet inert again. Upstream fixes the same defect in its CDN build with
// retainStandaloneStyles/releaseStandaloneStyles, which this bundle cannot reach.
//
// Every page that renders Scalar goes through here: the six copies of this
// loader were identical apart from the spec url, and /api being the one copy
// that drifted is why the leak shipped.
export default function ScalarApiReference({
  configuration,
}: {
  configuration: Record<string, unknown>;
}) {
  const [ApiReference, setApiReference] =
    useState<React.ComponentType<{ configuration: unknown }> | null>(null);

  useEffect(() => {
    const state = { mounted: true };

    (async () => {
      const [mod] = await Promise.all([
        import('@scalar/api-reference-react'),
        import('@scalar/api-reference-react/style.css'),
      ]);

      if (!state.mounted) return;

      setApiReference(() => mod.ApiReferenceReact);
    })();

    return () => {
      state.mounted = false;
      document.body.classList.remove('light-mode', 'dark-mode');
    };
  }, []);

  if (!ApiReference) return <div>Loading...</div>;

  return (
    <div style={{ height: 'calc(100vh - 60px)' }}>
      <ApiReference configuration={configuration} />
    </div>
  );
}
