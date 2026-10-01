// eslint-disable-next-line
module.exports = function (context, options) {
  return {
    name: 'custom-docusaurus-plugin',
    // Docusaurus runs postcss-preset-env over every stylesheet, including
    // @scalar/api-reference-react's prebuilt Tailwind CSS. Its is-pseudo-class
    // polyfill cannot rewrite Tailwind's `:is(:where(.group):first-child *)`
    // selectors and emits ~100 warnings per build; every browser we target
    // (package.json browserslist) supports :is() natively.
    configurePostCss(postcssOptions) {
      for (const plugin of postcssOptions.plugins) {
        if (
          Array.isArray(plugin) &&
          String(plugin[0]).includes('postcss-preset-env')
        ) {
          plugin[1] = {
            ...plugin[1],
            features: { ...plugin[1]?.features, 'is-pseudo-class': false },
          };
        }
      }
      return postcssOptions;
    },
     
    configureWebpack(config, isServer, utils) {
      const bundler = utils.currentBundler.instance;
      return {
        // Scalar's standalone bundle loads plugins from runtime URLs with a
        // `/* @vite-ignore */ import(url)`, which the bundler reports as a
        // critical dependency; it is never reached from the React component.
        ignoreWarnings: [
          { module: /@scalar[\\/]api-reference[\\/].*load-plugins-from-urls/ },
        ],
        resolve: {
          alias: {
            path: require.resolve('path-browserify'),
          },
          fallback: {
            fs: false,
            http: require.resolve('stream-http'),
            https: require.resolve('https-browserify'),
            os: require.resolve('os-browserify/browser'),
            tty: require.resolve('tty-browserify'),
            url: require.resolve('url/'),
          },
        },
        plugins: [
          new bundler.ProvidePlugin({
            process: require.resolve('process/browser'),
          }),
        ],
      };
    },
  };
};
