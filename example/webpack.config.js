var path = require("path");
var MergeJsonWebpackPlugin =require('../index');
module.exports = {
  entry: {
    app: ["./index.js"]
  },
  output: {
    path: path.resolve(__dirname, "build"),
    publicPath: "/assets/",
    filename: "bundle.js"
  },
  plugins:[
      new MergeJsonWebpackPlugin({
            "files": ['./jsons/file1.json',
                './jsons/file3.json',
                './jsons/file2.json'],
            "output":{
                "fileName":"./jsons/result.json"
            }
        }),
        new MergeJsonWebpackPlugin({
            "encoding":"ascii",
            "output": {
                "groupBy": [{
                    "pattern": "{./node_modules/module*/en.json,./jsons/file1.json}",
                    "fileName": "./out/module1/module2/en.json"
                },
               {"pattern": "./jsons/module*/es.json", "fileName": "./dist/es.json"}]

            }
        })
  ]
};