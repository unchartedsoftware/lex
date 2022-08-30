const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const OUTFILE = process.env.MINIFY ? 'lex.min.js' : 'lex.js';

module.exports = {
  mode: 'production',
  devtool: 'source-map',
  entry: './src/lex.jsx',
  output: {
    filename: OUTFILE,
    library: 'lex',
    libraryTarget: 'commonjs2',
    path: path.resolve(__dirname, '../dist')
  },
  optimization: {
    minimize: process.env.MINIFY !== undefined
  },
  plugins: [new MiniCssExtractPlugin({filename: 'lex.css'})],
  module: {
    rules: [
      {
        test: /.jsx?$/,
        use: [{
          loader: 'babel-loader'
        }],
        exclude: /node_modules/
      },
      {
        test: /\.scss$/,
        use: [{
          loader: MiniCssExtractPlugin.loader,
          options: {}
        }, 'css-loader', 'sass-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  externals: {
    preact: 'preact',
    'moment-timezone': 'moment-timezone',
    'element-resize-detector': 'element-resize-detector',
    flatpickr: 'flatpickr',
    h: 'h'
  }
};
