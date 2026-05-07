// eslint-disable-next-line
module.exports = function (context, options) {
  return {
    name: 'custom-docusaurus-plugin',
    // eslint-disable-next-line
    configureWebpack(config, isServer, utils) {
      const bundler = utils.currentBundler.instance;
      return {
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
