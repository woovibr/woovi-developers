import { themes } from 'prism-react-renderer';
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
    // experimental_faster: true,
    // experimental_faster: {
    //   swcJsLoader: true,
    //   swcJsMinimizer: true,
    //   swcHtmlMinimizer: true,
    //   lightningCssMinimizer: true,
    //   rspackBundler: true,
    //   mdxCrossCompilerCache: true,
    // },
    // experimental_faster: false,
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
        ],
      },
    ],
  ],
  themeConfig: {
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
          editUrl: ({ locale, versionDocsDirPath, docPath }) => {
            return `https://github.com/Open-Pix/woovi-developers/edit/main/${versionDocsDirPath}/${docPath}`;
          },
          editCurrentVersion: true,
          remarkPlugins: [require('mdx-mermaid')],
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
            spec: './src/swaggers/bacen-pix.yaml',
          },
          {
            route: '/dict/',
            spec: './src/swaggers/bacen-dict.json',
          },
          {
            route: '/api/',
            spec: './src/swaggers/woovi.json',
          },
          {
            route: '/indirect/',
            spec: './src/swaggers/pixIndirect.json',
          },
        ],
      },
    ],
  ],
};
