import React from 'react';
// eslint-disable-next-line import/no-unresolved
import Head from '@docusaurus/Head';
// eslint-disable-next-line import/no-unresolved
import { useLocation } from '@docusaurus/router';
// eslint-disable-next-line import/no-unresolved
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
// eslint-disable-next-line import/no-unresolved
import Metadata from '@theme-original/DocItem/Metadata';

// docusaurus-plugin-llms writes a Markdown twin of every doc at `<route>.md`,
// from the default-locale tree only. Announce it so answer engines can fetch the
// page without the HTML chrome; the /en/ pages point at the same twin.
export default function MetadataWrapper(props) {
  const { pathname } = useLocation();
  const { siteConfig, i18n } = useDocusaurusContext();

  const localePrefix =
    i18n.currentLocale === i18n.defaultLocale ? '' : `/${i18n.currentLocale}`;
  const route = pathname.slice(localePrefix.length).replace(/\/$/, '');

  return (
    <>
      <Metadata {...props} />
      <Head>
        <link
          rel='alternate'
          type='text/markdown'
          href={`${siteConfig.url}${route}.md`}
        />
      </Head>
    </>
  );
}
