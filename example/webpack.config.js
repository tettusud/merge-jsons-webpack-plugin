var path = require("path");
var MergeJsonWebpackPlugin = require('../index.js');
var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    app: ["./app/main.js"]
  },
  output: {
    path: path.resolve(__dirname, "build"),
    publicPath: "/assets/",
    filename: "bundle.js"
  },
  plugins: [
    new HtmlWebpackPlugin({  // Also generate a test.html
      filename: 'index.html',
      template: 'app/index.html'
    }),
    new MergeJsonWebpackPlugin({
      "files": ['app/jsons/file1.json',
        'app/jsons/file2.json', 'app/jsons/file3.json'],
      "output": {
        "fileName": "jsons/result.json"
      }
    }),
    new MergeJsonWebpackPlugin({
      "encoding": "ascii",
      "output": {
        "groupBy": [
          {
            "pattern": "app/groupby/countries/*.json",
            "fileName": "jsons/countries.json"
          }
        ]
      }
    }),
    //lang views
    new MergeJsonWebpackPlugin({
      "encoding": "utf8",
      "output": {
        "groupBy": [
          {
            "pattern": "app/groupby/lang/**/locales/en.json",
            "fileName": "locales/en.json"
          },
          {
            "pattern": "app/groupby/lang/**/locales/fr.json",
            "fileName": "locales/fr.json"
          }
        ]
      }
    })
  ]
};