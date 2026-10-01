import fs from 'node:fs';
import path from 'node:path';
import { themes } from 'prism-react-renderer';
import mdxMermaid from 'mdx-mermaid';
import remarkApiRefLinks from './plugins/remarkApiRefLinks.mjs';

const lightCodeTheme = themes.github;
const darkCodeTheme = themes.dracula;

const locales = ['pt-BR', 'en'];

const localeConfigs = {
  en: {
    label: 'English',
  },
  'pt-BR': {
    label: 'Português',
  },
};

const docsTrees = [
  'docs',
  ...locales.map((locale) => `i18n/${locale}/docusaurus-plugin-content-docs/current`),
];

// A relative .md link does not cross the translation boundary: the resolver only
// looks in the tree of the locale being built. facebook/docusaurus#10907
const resolveAcrossLocales = ({ sourceFilePath, url }) => {
  const [target, anchor] = url.split('#');
  if (!/\.mdx?$/.test(target)) return console.warn(`[links] unresolved ${url} in ${sourceFilePath}`);

  const filePath = path.posix.normalize(path.posix.join(path.posix.dirname(sourceFilePath), target));
  const tree = docsTrees.find((dir) => filePath.startsWith(`${dir}/`));
  if (!tree) return console.warn(`[links] unresolved ${url} in ${sourceFilePath}`);

  const docPath = filePath.slice(tree.length + 1);
  const found = docsTrees.map((dir) => path.join(dir, docPath)).find((file) => fs.existsSync(file));
  if (!found) return console.warn(`[links] ${url} in ${sourceFilePath} has no file in any locale`);

  // the route comes from the frontmatter id when it is set, not from the file name
  const [, frontmatter = ''] = fs.readFileSync(found, 'utf-8').split(/^---$/m);
  const id = frontmatter.match(/^id:\s*(\S+)/m);
  const route = id ? path.posix.join(path.posix.dirname(docPath), id[1]) : docPath.replace(/\.mdx?$/, '');

  return `/docs/${route}${anchor ? `#${anchor}` : ''}`;
};

const siteUrl = 'https://developers.woovi.com';

// Thin or duplicate routes: tag listings, the search page and the alternate
// renderers of the same OpenAPI spec that /api already serves.
const sitemapIgnorePatterns = [
  '/docs/tags/**',
  '/en/docs/tags/**',
  '/search',
  '/en/search',
  ...['api-elements', 'api-redoc', 'api-scalar', 'pix-scalar', 'dict-scalar', 'indirect-scalar'].flatMap(
    (page) => [`/${page}`, `/en/${page}`],
  ),
];

const sitemapPriority = (url) => {
  const { pathname } = new URL(url);
  const route = pathname.replace(/^\/en(?=\/|$)/, '') || '/';
  if (route === '/') return 1.0;
  if (['/api', '/docs/intro/getting-started', '/docs/apis/api-getting-started'].includes(route)) return 0.9;
  if (route.startsWith('/docs/supported-banks/')) return 0.3;
  if (route.startsWith('/docs/category/')) return 0.5;
  return 0.7;
};

const flattenRoutes = (routes) => routes.flatMap((route) => [route, ...flattenRoutes(route.routes ?? [])]);

// Under /en/, a doc with no translated file is built from the Portuguese source
// (its sourceFilePath stays under docs/) and a generated category index lists
// Portuguese titles. Their canonical is the Portuguese page (src/theme/SiteMetadata),
// so they stay out of the English sitemap.
const untranslatedDocUrls = ({ routes, siteConfig }) => {
  if (siteConfig.baseUrl === '/') return new Set();
  const isUntranslated = (route) =>
    route.path.startsWith(`${siteConfig.baseUrl}docs/`) &&
    !route.metadata?.sourceFilePath?.startsWith('i18n/');
  return new Set(
    flattenRoutes(routes)
      .filter(isUntranslated)
      .map((route) => `${siteConfig.url}${route.path}`),
  );
};

// docusaurus-plugin-llms reads docs/ (Portuguese) whatever the locale, so the en
// build would only write a second copy of the same twins and llms-full.txt, and
// DocItem/Metadata points /en/ pages at the root twins anyway. Skipping it there
// saves ~20s of postBuild.
const llmsPlugins =
  process.env.DOCUSAURUS_CURRENT_LOCALE !== 'en'
    ? [
        [
          'docusaurus-plugin-llms',
          {
            // llms.txt is curated by hand in static/; generating it here would overwrite it
            generateLLMsTxt: false,
            generateLLMsFullTxt: true,
            // a Markdown twin next to every doc (/docs/x -> /docs/x.md) that answer engines
            // read for a fraction of the HTML's tokens; DocItem/Metadata links it
            generateMarkdownFiles: true,
            excludeImports: true,
            docsDir: 'docs',
            title: 'Woovi Developers',
            description:
              'Documentação da API, webhooks, SDKs e plugins da Woovi, Instituição de Pagamento regulada pelo Banco Central e participante direta do Pix. Índice curado: https://developers.woovi.com/llms.txt',
          },
        ],
      ]
    : [];

// Ties the docs to the same entity woovi.com describes (same @id), so answer
// engines attribute developers.woovi.com to the regulated Payment Institution.
// Only facts woovi.com itself publishes.
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': ['Organization', 'FinancialService'],
      '@id': 'https://woovi.com/#organization',
      name: 'Woovi',
      legalName: 'Woovi Instituição de Pagamento LTDA',
      taxID: '54.811.417/0001-63',
      url: 'https://woovi.com/',
      logo: 'https://woovi.com/logo.png',
      sameAs: [
        'https://twitter.com/woovibr',
        'https://www.instagram.com/woovibr/',
        'https://www.linkedin.com/company/sejawoovi/',
        'https://www.youtube.com/@woovibr',
        'https://github.com/woovibr',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: `${siteUrl}/`,
      name: 'Woovi Developers',
      description: 'Documentação da API Pix, webhooks, SDKs e plugins da Woovi.',
      inLanguage: ['pt-BR', 'en'],
      publisher: { '@id': 'https://woovi.com/#organization' },
    },
  ],
};

module.exports = {
  headTags: [
    {
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify(jsonLd),
    },
    {
      tagName: 'link',
      attributes: { rel: 'describedby', type: 'text/plain', href: '/llms.txt' },
    },
  ],
  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: resolveAcrossLocales,
    },
  },
  themes: ['@docusaurus/theme-mermaid'],
  future: {
    v4: {
      removeLegacyPostBuildHeadAttribute: true,
    },
    faster: {
      swcJsLoader: true,
      swcJsMinimizer: true,
      swcHtmlMinimizer: true,
      lightningCssMinimizer: true,
      rspackBundler: true,
      rspackPersistentCache: true,
      mdxCrossCompilerCache: true,
      ssgWorkerThreads: true,
      // read the git history once instead of one `git log` per doc for the
      // last-update dates (showLastUpdateTime, sitemap lastmod): the en build
      // spent ~200s here
      gitEagerVcs: true,
    },
    experimental_vcs: true,
  },
  i18n: {
    defaultLocale: 'pt-BR',
    locales,
    localeConfigs,
  },
  title: 'Woovi Developers',
  tagline: 'Instant payments Docs, APIs, SDKs',
  url: siteUrl,
  baseUrl: '/',
  organizationName: 'woovi',
  projectName: 'developer-portal',
  scripts: [],
  favicon: 'img/icons/woovi.svg',
  onBrokenLinks: 'throw',
  trailingSlash: false,
  plugins: [
    ...llmsPlugins,
    // [
    //   'docusaurus-plugin-mcp-server',
    //   {
    //     outputDir: 'mcp',
    //     server: {
    //       name: 'woovi-developers',
    //       version: '1.0.0',
    //     },
    //     excludeRoutes: ['/404*', '/search*', '/api-redoc*', '/pix*', '/dict*', '/indirect*'],
    //   },
    // ],
    [
      '@gracefullight/docusaurus-plugin-microsoft-clarity',
      { projectId: 'j6ihzvjzvu' },
    ],
    require.resolve('./webpack/sitePlugin'),
    require.resolve('./plugins/translatedDocs'),
    [
      require.resolve('@cmfcmf/docusaurus-search-local'),
      {
        language: ['pt', 'en'],
        indexBlog: false,
      },
    ],
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          {
            from: '/docs/test/adding-funds-in-test-account',
            to: '/docs/test-environment/test-account/adding-funds-in-test-account',
          },
          {
            from: '/docs/test/flow-company-bank-test',
            to: '/docs/test-environment/test-account/flow-company-bank-test',
          },
          {
            from: '/docs/test/introduction-to-test-account',
            to: '/docs/test-environment/test-account/introduction-to-test-account',
          },
          {
            from: '/docs/test/test-pay-pix-qrcode',
            to: '/docs/test-environment/test-account/test-pay-pix-qrcode',
          },
          {
            from: '/docs/test/test-pay-pix',
            to: '/docs/test-environment/test-account/test-pay-pix',
          },
          {
            from: '/docs/test/paying-a-pix-key-with-test-account',
            to: '/docs/test-environment/test-account/paying-a-pix-key-with-test-account',
          },
          {
            // the standalone prototype became the Cobrança Pix playground
            from: '/pix-na-pratica',
            to: '/docs/playground/playground-cobranca-pix',
          },
          {
            from: '/docs/flows/api-pix-key-campaign',
            to: '/docs/apis/api-pix-key-campaign',
          },
          {
            from: '/docs/baas/documents-nescessary',
            to: '/docs/baas/documentos-kyc',
          },
          {
            from: '/docs/baas/baas-compliance',
            to: '/docs/baas/documentos-kyc',
          },
          {
            from: '/docs/ecommerce/woocommerce-plugin',
            to: '/docs/ecommerce/woocommerce/woocommerce-plugin',
          },
          {
            from: '/docs/ecommerce/woocommerce-subscriptions',
            to: '/docs/ecommerce/woocommerce/woocommerce-subscriptions',
          },
          {
            from: '/docs/ecommerce/magento1-plugin',
            to: '/docs/ecommerce/magento1/magento1-plugin',
          },
          {
            from: '/docs/ecommerce/magento2-plugin',
            to: '/docs/ecommerce/magento2/magento2-plugin',
          },
          {
            from: '/docs/ecommerce/oracle-commerce-cloud',
            to: '/docs/ecommerce/oracle/occ-getting-started',
          },
          {
            from: '/docs/getting-started',
            to: '/docs/intro/getting-started',
          },
          {
            from: '/docs/pix-automatic/pix-automatic-in-sandbox',
            to: '/docs/test-environment/pix-automatic-in-sandbox',
          },
          {
            from: '/docs/charge/refund/charge-refund-create-api',
            to: '/docs/refund/charge-refund-create-api',
          },
          {
            from: '/docs/charge/refund/charge-refund-get-all-api',
            to: '/docs/refund/charge-refund-get-all-api',
          },
          {
            from: '/docs/category/segurança',
            to: '/docs/category/security',
          },
          {
            from: '/docs/category/segurança-1',
            to: '/docs/category/security',
          },
          {
            from: '/docs/category/reembolso-de-cobrança',
            to: '/docs/category/refund',
          },
          {
            from: '/docs/category/reembolso-de-cobrança-1',
            to: '/docs/category/refund',
          },
          {
            from: '/docs/category/how-to',
            to: '/docs/category/charge-how-to',
          },
          {
            from: '/docs/category/how-to-1',
            to: '/docs/plugin/how-to-render-plugin-without-modal',
          },
          {
            from: '/docs/category/webhooks',
            to: '/docs/category/pix-automatic-webhooks',
          },
          {
            from: '/docs/category/webhook-1',
            to: '/docs/category/webhook',
          },
          {
            from: '/docs/category/webhook-2',
            to: '/docs/category/webhook',
          },
          {
            from: '/docs/webhook/api/webhook-api',
            to: '/docs/webhook/webhook-api',
          },
          {
            from: '/docs/category/api',
            to: '/docs/webhook/webhook-api',
          },
          {
            from: '/docs/plugin/how-to/how-to-render-plugin-without-modal',
            to: '/docs/plugin/how-to-render-plugin-without-modal',
          },
          {
            from: '/docs/flows/webhook/flow-create-webhook',
            to: '/docs/webhook/platform/webhook-platform-api',
          },
          {
            from: '/docs/category/flows-webhook',
            to: '/docs/webhook/platform/webhook-platform-api',
          },
          {
            from: '/docs/category/plugin-how-to',
            to: '/docs/plugin/how-to-render-plugin-without-modal',
          },
        ],
      },
    ],
  ],
  themeConfig: {
    // default social card; twitter:card is already summary_large_image
    image: 'img/og-card.png',
    mermaid: {
      options: {
        securityLevel: 'loose',
      },
    },
    navbar: {
      title: 'Woovi Developers',
      logo: {
        alt: 'Woovi Developers',
        src: 'img/icons/woovi.svg',
      },
      items: [
        {
          to: 'docs/intro/getting-started',
          label: 'Documentação',
          position: 'left',
        },
        {
          to: '/api',
          label: 'API',
          position: 'left',
        },
        {
          to: '/stable',
          label: 'Stable',
          position: 'left',
        },
        {
          to: 'docs/apis/api-explorer',
          label: 'API Explorer',
          position: 'left',
        },
        {
          to: 'docs/webhook/webhook-events-explorer',
          label: 'Webhook Explorer',
          position: 'left',
        },
        {
          to: 'docs/plugin',
          label: 'Plugin',
          position: 'left',
        },
        {
          to: 'docs/tags',
          position: 'left',
          label: 'Tags',
        },
        {
          href: 'https://woovi.com/',
          label: 'Woovi',
          position: 'right',
        },
        {
          href: 'https://github.com/Open-Pix/woovi-developers',
          label: 'Github',
          position: 'right',
        },
        // {
        //   to: 'docs/help',
        //   label: 'Help',
        //   position: 'right',
        // },
        {
          type: 'localeDropdown',
          position: 'right',
        },
      ],
    },
    prism: {
      theme: lightCodeTheme,
      darkTheme: darkCodeTheme,
      additionalLanguages: ['php'],
    },
    footer: {
      links: [
        {
          label: 'Woovi',
          href: 'https://woovi.com',
        },
        {
          label: 'OpenPix',
          href: 'https://openpix.com.br',
        },
      ],
      copyright: 'Copyright © Woovi / OpenPix',
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
          path: './docs',
          sidebarPath: './sidebars.js',
          editUrl: ({ versionDocsDirPath, docPath }) => {
            return `https://github.com/Open-Pix/woovi-developers/edit/main/${versionDocsDirPath}/${docPath}`;
          },
          editCurrentVersion: true,
          remarkPlugins: [
            mdxMermaid,
            [
              remarkApiRefLinks,
              { specUrl: 'https://api.woovi.com/api/openapi.json' },
            ],
          ],
        },
        // there is no blog/ directory: the default plugin only published an empty /blog
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
        sitemap: {
          // the date of the last commit that touched the doc (showLastUpdateTime), never the build date
          lastmod: 'date',
          changefreq: null,
          priority: null,
          ignorePatterns: sitemapIgnorePatterns,
          createSitemapItems: async ({ defaultCreateSitemapItems, ...params }) => {
            const items = await defaultCreateSitemapItems(params);
            const untranslated = untranslatedDocUrls(params);
            return items
              .filter((item) => !untranslated.has(item.url))
              .map((item) => ({ ...item, priority: sitemapPriority(item.url) }));
          },
        },
        googleAnalytics: {
          trackingID: 'G-DFFLN19210',
        },
      },
    ],
    [
      'redocusaurus',
      {
        specs: [
          {
            route: '/pix/',
            spec: './static/swaggers/bacen-pix.yaml',
          },
          {
            route: '/dict/',
            spec: './static/swaggers/bacen-dict.json',
          },
          {
            // `id` names the plugin instance whose global data <ApiLink> reads;
            // without it the id is positional (`plugin-redoc-<index>`).
            id: 'woovi',
            route: '/api-redoc/',
            spec: 'https://api.woovi.com/api/openapi.json',
          },
          {
            route: '/indirect/',
            spec: './static/swaggers/pixIndirect.json',
          },
        ],
      },
    ],
  ],
};
