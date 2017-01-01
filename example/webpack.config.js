/*
 MIT License http://www.opensource.org/licenses/mit-license.php
 Author Sebastien Dubois @dSebastien
 */
"use strict";

const MergeJsonWebpackPlugin = require('../index');

// Webpack config
module.exports = {
    debug: true,
    entry: {
        "main": "./index.js",
    },
    output: {
        path: "./dist",
        filename: "[name].bundle.js",
    },
    module: {
        loaders: [
            // Support for *.json files
            {
                test: /\.json$/,
                loaders: [
                    "json-loader"
                ]
            }
        ],
    },
    plugins: [
        new MergeJsonWebpackPlugin({
            "output": {
                "groupBy": [{
                    "pattern": "{./node_modules/module*/en.json,./jsons/file1.json}",
                    "fileName": "./out/module1/module2/en.json"
                },
                    {"pattern": "{./jsons/module*/es.json,./jsons/file2.json}", "fileName": "./dist/es.json"}]

            }
        })
        /*  new JsonsMerge({
         "files": ['./jsons/file1.json',
         './jsons/file3.json',
         './jsons/file2.json'],
         "output":{
         "fileName":"./dist/result.json"

         }
         })*/
    ]


};

