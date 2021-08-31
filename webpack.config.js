var webpack = require('webpack');
var CopyWebpackPlugin =  require('copy-webpack-plugin');

module.exports = {
  mode: 'development',

  entry: './src/index.tsx',

  output: {
    publicPath: './build/',
    filename: 'bundle.js',
    path: __dirname + '/build'
  },

  devtool: 'source-map',

  target: 'web',

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json']
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    }),
    new CopyWebpackPlugin([
      { from: '../tedClientBoilerplate/build/bundle.js', to: '../../tedServerBoilerplate/public/build' },
      { from: '../tedClientBoilerplate/build/bundle.js.map', to: '../../tedServerBoilerplate/public/build' },
    ]),
  ]
};
//       { from: './build/bundle.js', to: '../../tedword/public/build' },
