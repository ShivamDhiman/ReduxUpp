const withPlugins = require('next-compose-plugins');
const withImages = require('next-images');
const withSass = require('@zeit/next-sass');
const withCSS = require('@zeit/next-css');
const webpack = require('webpack');
const path = require('path');

module.exports = withPlugins([[withSass, { cssModules: true }], [withImages], [withCSS]], {
  webpack(config, options) {
    config.resolve.modules.push(path.resolve('./'));
    return config;
  },
});

module.exports = {
  sassOptions: {
    includePaths: [path.join(__dirname, 'src/stylesheets')],
  },
  swcMinify: true,
};
