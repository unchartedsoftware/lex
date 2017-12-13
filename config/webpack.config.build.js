const webpack = require('webpack');
const path = require('path');

const MINIFY = process.env.MINIFY ? [
  new webpack.optimize.UglifyJsPlugin({
    cache: true,
    parallel: true,
    sourceMap: false
  })
] : [];

const OUTFILE = process.env.MINIFY ? 'lex.min.js' : 'lex.js';

module.exports = {
  entry: './src/lex.jsx',
  output: {
    filename: OUTFILE,
    path: path.resolve(__dirname, '../dist')
  },
  plugins: [...MINIFY],
  module: {
    loaders: [
      {
        test: /.jsx?$/,
        loader: 'babel-loader'
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  externals: {
    'preact': 'preact',
    'h': 'h'
  }
};
