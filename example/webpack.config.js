/*
 MIT License http://www.opensource.org/licenses/mit-license.php
 Author Sebastien Dubois @dSebastien
 */
"use strict";

 
const MergeJsonWebpackPlugin = require('../index');

// Webpack config
module.exports = {  
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
        
        //group by many files example
       
        new MergeJsonWebpackPlugin({
            "output": {
                "groupBy": [{
                    "pattern": "{./node_modules/module*/en.json,./jsons/file1.json}",
                    "fileName": "./out/module1/module2/en.json"
                },
               {"pattern": "./jsons/module*/es.json", "fileName": "./dist/es.json"}]

            }
        }),
        //demonstrate arrays example
        new MergeJsonWebpackPlugin({
            "files": ['./jsons/arrays/array1.json',
                './jsons/arrays/array2.json' ],
            "output":{
                "fileName":"./dist/arrays.json"
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

