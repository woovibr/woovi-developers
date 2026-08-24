import { themes } from 'prism-react-renderer';
import mdxMermaid from 'mdx-mermaid';

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

module.exports = {
  markdown: {
    mermaid: true,
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
    },
  },
  i18n: {
    defaultLocale: 'pt-BR',
    locales,
    localeConfigs,
  },
  title: 'Woovi Developers',
  tagline: 'Instant payments Docs, APIs, SDKs',
  url: 'https://developers.woovi.com',
  baseUrl: '/',
  organizationName: 'woovi',
  projectName: 'developer-portal',
  scripts: [],
  favicon: 'img/icons/woovi.svg',
  onBrokenLinks: 'log',
  onBrokenMarkdownLinks: 'warn',
  trailingSlash: false,
  plugins: [
    [
      'docusaurus-plugin-llms',
      {
        generateLLMsTxt: true,
        generateLLMsFullTxt: true,
        docsDir: 'docs',
        title: 'Woovi Developers',
        description: 'Instant payments Docs, APIs, SDKs',
      },
    ],
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
    require.resolve('@cmfcmf/docusaurus-search-local', { language: 'pt-BR' }),
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
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
          remarkPlugins: [mdxMermaid],
        },
        // "blog": {
        //   "path": "blog"
        // },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
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
            route: '/api-redoc/',
            spec: './src/swaggers/woovi.json',
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
