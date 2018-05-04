const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const MINIFY = process.env.MINIFY ? [
  new webpack.optimize.UglifyJsPlugin({
    cache: true,
    parallel: true,
    sourceMap: true
  })
] : [];

const OUTFILE = process.env.MINIFY ? 'lex.min.js' : 'lex.js';

module.exports = {
  devtool: 'source-map',
  entry: './src/lex.jsx',
  output: {
    filename: OUTFILE,
    library: 'lex',
    libraryTarget: 'commonjs2',
    path: path.resolve(__dirname, '../dist')
  },
  plugins: [new ExtractTextPlugin({filename: 'lex.css'}), ...MINIFY],
  module: {
    rules: [
      {
        test: /.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.scss$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: ['css-loader', 'sass-loader']
        })
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  externals: {
    'preact': 'preact',
    'moment': 'moment',
    'moment-timezone': 'moment-timezone',
    'element-resize-detector': 'element-resize-detector',
    'tiny-date-picker': 'tiny-date-picker',
    'h': 'h'
  }
};
