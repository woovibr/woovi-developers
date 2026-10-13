/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
const fs = require('node:fs');
const path = require('node:path');

// Most docs have no translation: under /en/ Docusaurus serves the Portuguese
// file, and every page still advertises an `en` hreflang alternate. This plugin
// publishes, per non-default locale, the doc routes that do have a translated
// file, so SiteMetadata can drop the alternates of the Portuguese-only pages and
// point their /en/ copy's canonical at the original. Routes are stored without
// the locale prefix (`/docs/...`) and only the translated ones, which keeps the
// global data small.
module.exports = function translatedDocsPlugin(context) {
  const { siteDir, i18n } = context;
  const translatedLocales = i18n.locales.filter(
    (locale) => locale !== i18n.defaultLocale,
  );

  return {
    name: 'translated-docs',
    async allContentLoaded({ allContent, actions }) {
      const docsContent = allContent['docusaurus-plugin-content-docs']?.default;
      if (!docsContent) return;

      const docs = docsContent.loadedVersions.flatMap(
        (version) => version.docs,
      );
      const localePrefix = context.baseUrl.replace(/\/$/, '');

      const translated = Object.fromEntries(
        translatedLocales.map((locale) => {
          const tree = path.join(
            siteDir,
            'i18n',
            locale,
            'docusaurus-plugin-content-docs',
            'current',
          );
          const routes = docs
            .filter((doc) => {
              const relative = doc.source.replace(
                /^@site\/(docs|i18n\/[^/]+\/docusaurus-plugin-content-docs\/current)\//,
                '',
              );
              return fs.existsSync(path.join(tree, relative));
            })
            .map((doc) =>
              doc.permalink.slice(localePrefix.length).replace(/\/$/, ''),
            );
          return [locale, routes];
        }),
      );

      actions.setGlobalData({ translated });
    },
  };
};
