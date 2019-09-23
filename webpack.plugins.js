const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const webpack = require('webpack');

// https://github.com/palantir/blueprint/issues/3739
const replaceEnvarHack = {
  "process.env.BLUEPRINT_NAMESPACE": JSON.stringify(false),
  "process.env.REACT_APP_BLUEPRINT_NAMESPACE": JSON.stringify(false),
};

module.exports = [
  new ForkTsCheckerWebpackPlugin({
    async: false
  }),
  new webpack.DefinePlugin(replaceEnvarHack),
];
