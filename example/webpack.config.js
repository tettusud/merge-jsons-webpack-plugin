var path = require("path");
var MergeJsonWebpackPlugin =require('merge-jsons-webpack-plugin');
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
plugins:[
   new HtmlWebpackPlugin({  // Also generate a test.html
      filename: 'index.html',
      template: 'app/index.html'
    }),
      new MergeJsonWebpackPlugin({
            "files": ['app/jsons/file1.json',
                'app/jsons/file2.json', 'app/jsons/file3.json'                ],
            "output":{
                "fileName":"jsons/result.json"
            }
        })        
  ]
};