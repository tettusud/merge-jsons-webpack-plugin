const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MergeJsonWebpackPlugin = require('../');

module.exports = {
  context: path.resolve(__dirname),
  entry: {
    app: ["./app/main.js"]
  },
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "bundle.js"
  },
  plugins: [
    new HtmlWebpackPlugin({  // Also generate a test.html
      filename: 'index.html',
      template: 'app/index.html'
    }),
    new MergeJsonWebpackPlugin({
      "debug": false,
      "files": ['app/files/file1.json',
        'app/files/file2.json',
        'app/files/file3.json',
        'app/files/file4.txt',
        'groupBy/locales/fr.json'],
      "output": {
        "fileName": "files/file.json"
      }
    })

  ]
}