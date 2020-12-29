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
     *  Merge one or more files and write the json to output.
     */
    new MergeJsonWebpackPlugin({
      "debug": false,
      "files": ['app/merge-by-file-names/file1.json',
        'app/merge-by-file-names/file2.json'
      ],
      "output": {
        "fileName": "merge-by-file-names/output.json"
      }
    }),

    /**
     *    Merge one or more files by glob options
     */
    new MergeJsonWebpackPlugin({
      "debug": false,
      "encoding": "ascii",
      "output": {
        "groupBy": [
          {
            "pattern": "app/glob/multiple/**/locales/en.json",
            "fileName": "glob/multiple/en.json"
          },
          {
            "pattern": "app/glob/multiple/**/locales/fr.json",
            "fileName": "glob/multiple/fr.json"
          }
        ]
      },
      "globOptions": {
        "nosort": true
      }
    }),




    /**
     *   Merge non json files as well.
     *   
     */
    new MergeJsonWebpackPlugin({
      "debug": false,
      "files": ['app/non-json-extn/file1.json',
        'app/non-json-extn/file2.txt'],
      "output": {
        "fileName": "non-json-extn/output.json"
      }
    }),


    /**
     *   Should override value of same key, by default
     */
    new MergeJsonWebpackPlugin({
      "files": [
        'app/overwrite-values/file1.json',
        'app/overwrite-values/file2.json'
      ],
      "output": {
        "fileName": "overwrite-values/actual.json"
      }
    }),

    /**
     *   Should merge values of same key into an array, when overwrite flag is false
     */
    new MergeJsonWebpackPlugin({
      "debug": false,
      "overwrite":false,
      "files": ['app/merge-values/source1.json',
        'app/merge-values/source2.json',
        'app/merge-values/source3.json'
      ],
      "output": {
        "fileName": "merge-values/actual.json"
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
      "debug": false,
      "prefixFileName": true,
      "files": [
        'app/prefixFileName/sign_in.json',
        'app/prefixFileName/sign_up.json'
      ],
      "output": {
        "fileName": "prefixFileName/actual.json"
      }
    }),

    /**
     *  Merge files and prefix them using the provided function
     *  
     *  for eg:
     *   sign_in.en.json
     *       {
     *          "submit": "Sign in"
     *       }
     *   sign_up.en.json
     *       {
     *          "submit": "Sign up"
     *       }
     *       
     *  The "prefixFileName" function: filePath => path.basename(filePath)
     *                                                 .split('.')[0]
     *                                                 .replace(/_+([a-z0-9])/ig, (_, char) => char.toUpperCase())
     *   
     *  --------OUTPUT----------
     *  prefixFileNameFn.json
     *       {
     *          "signIn": {
     *             "submit": "Sign in"
     *          },
     *          "signUp": {
     *             "submit": "Sign up"
     *          }
     *       }
     */
    new MergeJsonWebpackPlugin({
      "debug": false,
      "prefixFileName": filePath => path.basename(filePath).split('.')[0]
        .replace(/_+([a-z0-9])/ig, (_, char) => char.toUpperCase()),
      "files": [
        'app/prefixFileNameFn/sign_in.en.json',
        'app/prefixFileNameFn/sign_up.en.json'
      ],
      "output": {
        "fileName": "prefixFileNameFn/actual.json"
      }
    }),

    /**
     * This file contains the 3 BOM bytes EF BB BF
     * The library should be able to look pass them and
     * still parse the JSON file.
     * Fourth byte should be a `{` character, hex: 7B
     */
    new MergeJsonWebpackPlugin({
      "debug": false,
      "files": ['app/bom-bytes/bom-bytes.json'], // Check this file with a HEX viewer.
      "output": {
        "fileName": "bom-bytes/bom-bytes.json"
      }
    }),

    /**
     * Merge files and produce formatted output
     */
    new MergeJsonWebpackPlugin({
      "debug": false,
      "files": [
        'app/formatted-output/file1.json',
        'app/formatted-output/file2.json'
      ],
      "output": {
        "fileName": "formatted-output/actual.json"
      },
      "space": 4
    }),

     /**
     * Should load file from asset
     */
    // dummy compilation to load a file into asset
    new MergeJsonWebpackPlugin({
      "debug": true,
      "files": [
        'app/asset-files/source2.json',
        'app/asset-files/source3.json' // this file actually exists in webpack asset
      ],
      "output": {
        "fileName": "asset-files/source.json"
      },
      "space": 4
    }),

    new MergeJsonWebpackPlugin({
      "debug": true,
      "files": [
        'app/asset-files/source1.json',
        'asset-files/source.json' // this file actually exists in webpack asset
      ],
      "output": {
        "fileName": "asset-files/actual.json"
      }
    }),

  ]
};
