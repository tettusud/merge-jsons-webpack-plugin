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
    /**
     *  Merge one or more files by glob options
     */
    new MergeJsonWebpackPlugin({
      "debug":false,     
      "encoding": "ascii",
      "output": {
        "groupBy": [
          {
            "pattern": "app/groupBy/countries/*.json",
            "fileName": "groupBy/countries/countries.json"
          }
        ]
      },
      "globOptions":{
        "nosort":true
      }
    }), 

    /**
     *    Merge one or more files by glob options
     */
    new MergeJsonWebpackPlugin({
      "debug":false,     
      "encoding": "utf8",
      "output": {
        "groupBy": [
          {
            "pattern": "app/groupBy/lang/**/locales/en.json",
            "fileName": "groupBy/locales/en.json"
          },
          {
            "pattern": "app/groupby/lang/**/locales/fr.json",
            "fileName": "groupBy/locales/fr.json"
          }
        ]
      },
      "globOptions":{
        "nosort":true
      }
    }),
    /**
     *   Merge files by individual file name.
     *    File name can be
     *      1.File already present on the context path
     *      2.File that is generated and is present in the webpack assets
     *   
     */
    new MergeJsonWebpackPlugin({
      "debug":false,     
      "files": ['app/files/file1.json',
                'app/files/file2.json',
                'app/files/file3.json',
                'app/files/file4.txt',
                'groupBy/locales/fr.json'],
      "output": {
        "fileName": "files/file.json"
      }
    }), 

   /**
    *  Merge content of the file and prefix the individual file name as root element of the
    *  correspoinding file content
    *  for eg:
    *   sign_in.json 
    *       {
    *         'filename':'sign_in'
    *       }
    *   sign_up.json 
    *       {
    *         'filename':'sign_up'
    *       }
    *   
    *  --------OUTPUT----------
    *  prefixFileName.json
    *       {
    *         'sign_in':{
    *           'filename':'sign_in'
    *          },
    *         'sign_up':{
    *           'filename':'sign_up'
    *          }
    *       }
    */
    new MergeJsonWebpackPlugin({
      "debug":false,
      "prefixFileName":true,
      "files": [
             'app/prefixFileName/sign_in.json',
             'app/prefixFileName/sign_up.json'
          ],
      "output": {
        "fileName": "prefixfilename/prefixFileName.json"
      }
    }),

    /**
     * This file contains the 3 BOM bytes EF BB BF
     * The library should be able to look pass them and
     * still parse the JSON file.
     * Fourth byte should be a `{` character, hex: 7B
     */
    new MergeJsonWebpackPlugin({
      "debug":false,
      "files": ['app/bom-bytes/bom-bytes.json'], // Check this file with a HEX viewer.
      "output": {
        "fileName": "bom-bytes/bom-bytes.json"
      }
    }), 
     
  ]
};
