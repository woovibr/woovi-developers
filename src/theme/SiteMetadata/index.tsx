// Ejected from @docusaurus/theme-classic 3.10.2 (SiteMetadata). The only change:
// a doc with no translation (see plugins/translatedDocs.js) is Portuguese under
// every locale, so it announces no hreflang alternates, and its /en/ copy names
// the Portuguese page as canonical instead of itself.
import React from 'react';
// eslint-disable-next-line import/no-unresolved
import Head from '@docusaurus/Head';
// eslint-disable-next-line import/no-unresolved
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
// eslint-disable-next-line import/no-unresolved
import useBaseUrl from '@docusaurus/useBaseUrl';
import { PageMetadata, useThemeConfig } from '@docusaurus/theme-common';
import {
  DEFAULT_SEARCH_TAG,
  useAlternatePageUtils,
} from '@docusaurus/theme-common/internal';
// eslint-disable-next-line import/no-unresolved
import { useLocation } from '@docusaurus/router';
// eslint-disable-next-line import/no-unresolved
import { usePluginData } from '@docusaurus/useGlobalData';
import { applyTrailingSlash } from '@docusaurus/utils-common';
// eslint-disable-next-line import/no-unresolved
import SearchMetadata from '@theme/SearchMetadata';
// True when the current page is a doc that only exists in the default locale.
function useIsUntranslatedDoc() {
  const {
    siteConfig: { baseUrl },
    i18n: { currentLocale, defaultLocale, locales },
  } = useDocusaurusContext();
  const { pathname } = useLocation();
  const { translated } = usePluginData('translated-docs');
  const route = `/${pathname.slice(baseUrl.length)}`.replace(/\/$/, '');
  if (!route.startsWith('/docs/')) {
    return false;
  }
  const otherLocales = locales.filter((locale) => locale !== defaultLocale);
  const locale =
    currentLocale === defaultLocale ? otherLocales[0] : currentLocale;
  return !translated[locale]?.includes(route);
}
// TODO move to SiteMetadataDefaults or theme-common ?
// Useful for i18n/SEO
// See https://developers.google.com/search/docs/advanced/crawling/localized-versions
// See https://github.com/facebook/docusaurus/issues/3317
function AlternateLangHeaders() {
  const {
    i18n: { currentLocale, defaultLocale, localeConfigs },
  } = useDocusaurusContext();
  const alternatePageUtils = useAlternatePageUtils();
  const currentHtmlLang = localeConfigs[currentLocale].htmlLang;
  // HTML lang is a BCP 47 tag, but the Open Graph protocol requires
  // using underscores instead of dashes.
  // See https://ogp.me/#optional
  // See https://en.wikipedia.org/wiki/IETF_language_tag)
  const bcp47ToOpenGraphLocale = (code) => code.replace('-', '_');
  const isUntranslatedDoc = useIsUntranslatedDoc();
  // Note: it is fine to use both "x-default" and "en" to target the same url
  // See https://www.searchviu.com/en/multiple-hreflang-tags-one-url/
  return (
    <Head>
      {!isUntranslatedDoc &&
        Object.entries(localeConfigs).map(([locale, { htmlLang }]) => (
          <link
            key={locale}
            rel='alternate'
            href={alternatePageUtils.createUrl({
              locale,
              fullyQualified: true,
            })}
            hrefLang={htmlLang}
          />
        ))}
      {!isUntranslatedDoc && (
        <link
          rel='alternate'
          href={alternatePageUtils.createUrl({
            locale: defaultLocale,
            fullyQualified: true,
          })}
          hrefLang='x-default'
        />
      )}

      <meta
        property='og:locale'
        content={bcp47ToOpenGraphLocale(currentHtmlLang)}
      />
      {Object.values(localeConfigs)
        .filter((config) => currentHtmlLang !== config.htmlLang)
        .map((config) => (
          <meta
            key={`meta-og-${config.htmlLang}`}
            property='og:locale:alternate'
            content={bcp47ToOpenGraphLocale(config.htmlLang)}
          />
        ))}
    </Head>
  );
}
// Default canonical url inferred from current page location pathname
function useDefaultCanonicalUrl() {
  const {
    siteConfig: { url: siteUrl, baseUrl, trailingSlash },
  } = useDocusaurusContext();
  // TODO using useLocation().pathname is not a super idea
  // See https://github.com/facebook/docusaurus/issues/9170
  const { pathname } = useLocation();
  const canonicalPathname = applyTrailingSlash(useBaseUrl(pathname), {
    trailingSlash,
    baseUrl,
  });
  return siteUrl + canonicalPathname;
}
// TODO move to SiteMetadataDefaults or theme-common ?
function CanonicalUrlHeaders({ permalink }) {
  const {
    siteConfig: { url: siteUrl },
  } = useDocusaurusContext();
  const {
    i18n: { currentLocale, defaultLocale },
  } = useDocusaurusContext();
  const defaultCanonicalUrl = useDefaultCanonicalUrl();
  const alternatePageUtils = useAlternatePageUtils();
  const isUntranslatedDoc = useIsUntranslatedDoc();
  let canonicalUrl = permalink ? `${siteUrl}${permalink}` : defaultCanonicalUrl;
  if (isUntranslatedDoc && currentLocale !== defaultLocale) {
    canonicalUrl = alternatePageUtils.createUrl({
      locale: defaultLocale,
      fullyQualified: true,
    });
  }
  return (
    <Head>
      <meta property='og:url' content={canonicalUrl} />
      <link rel='canonical' href={canonicalUrl} />
    </Head>
  );
}
export default function SiteMetadata() {
  const {
    i18n: { currentLocale },
  } = useDocusaurusContext();
  // TODO maybe move these 2 themeConfig to siteConfig?
  // These seems useful for other themes as well
  const { metadata, image: defaultImage } = useThemeConfig();
  return (
    <>
      <Head>
        <meta name='twitter:card' content='summary_large_image' />
        {/* The keyboard focus class name need to be applied when SSR so links
        are outlined when JS is disabled */}
        <body />
      </Head>

      {defaultImage && <PageMetadata image={defaultImage} />}

      <CanonicalUrlHeaders />

      <AlternateLangHeaders />

      <SearchMetadata tag={DEFAULT_SEARCH_TAG} locale={currentLocale} />

      {/*
          It's important to have an additional <Head> element here, as it allows
          react-helmet to override default metadata values set in previous <Head>
          like "twitter:card". In same Head, the same meta would appear twice
          instead of overriding.
        */}
      <Head>
        {/* Yes, "metadatum" is the grammatically correct term */}
        {metadata.map((metadatum, i) => (
          <meta key={i} {...metadatum} />
        ))}
      </Head>
    </>
  );
}
