const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const fs = require('fs');

const testFolder = path.resolve(__dirname, '../demo');
const entry = fs.readdirSync(testFolder)
  .filter(c => process.env.DEV_ONLY === undefined || process.env.DEV_ONLY === 'false' || c === 'dev-test.js')
  .reduce((result, current) => {
    if (current.indexOf('.js') < 0) {
      return result;
    }
    const moduleName = current.replace('.js', '');
    result[moduleName] = path.resolve(testFolder, current);
    return result;
  }, {});

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  entry: entry,
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, '../demo/dist')
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [{
          loader: 'style-loader' // creates style nodes from JS strings
        }, {
          loader: 'css-loader' // translates CSS into CommonJS
        }]
      },
      {
        test: /.scss?$/,
        use: [{
          loader: 'style-loader' // creates style nodes from JS strings
        }, {
          loader: 'css-loader' // translates CSS into CommonJS
        }, {
          loader: 'sass-loader' // compiles Sass to CSS
        }]
      },
      {
        test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
        use: [{
          loader: 'url-loader',
          options: {
            limit: 10000,
            mimeType: 'application/font-woff'
          }
        }]
      },
      {
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
        use: [{
          loader: 'url-loader',
          options: {
            limit: 10000,
            mimeType: 'application/octet-stream'
          }
        }]
      },
      {
        test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
        use: [{
          loader: 'file-loader'
        }]
      },
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        use: [{
          loader: 'url-loader',
          options: {
            limit: 10000,
            mimeType: 'image/svg+xml'
          }
        }]
      },
      {
        enforce: 'pre',
        test: /\.js$/,
        use: [{
          loader: 'eslint-loader'
        }],
        exclude: /node_modules/
      },
      {
        test: /.jsx?$/,
        use: [{
          loader: 'babel-loader'
        }],
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin({cleanOnceBeforeBuildPatterns: path.join(process.cwd(), 'dist/**')})
  ],
  resolve: {
    extensions: ['.js', '.jsx']
  }
};
