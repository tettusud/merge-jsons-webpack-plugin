# JsonFilesMerge

Merge Json files using this webpack plugin.

For example,it will be useful to
merge i18n json files which are in different modules into a single
final json files in angular2 or react modules.

 

 
## Usage

Install with npm

```
npm i merge-jsons-webpack-plugin
```

```javascript
var MergeJsonWebpackPlugin = require("merge-jsons-webpack-plugin")

// options is optional
 new MergeJsonWebpackPlugin({
            "files": ['./jsons/file1.json',
                './jsons/file3.json',
                './jsons/file2.json'],
            "output":{
                "fileName":"./dist/result.json"

            }
        })
```

##Details
  You can specify either files or  groupBy under output.
  
  1. **By files**
  
     If you want to merge group of files use like this
 ``` 
  // options is optional
   new MergeJsonWebpackPlugin({
              "files": ['./jsons/file1.json',
                  './jsons/file3.json',
                  './jsons/file2.json'],
              "output":{
                  "fileName":"./dist/result.json"
  
              }
          })
  ```

  **files** 
   >>Input json files to be merged.
   
  **output.fileName**
   >>File name for the resultant json file.

2. **By pattern**
  
     This plugin uses glob for searching file patterns,please refer glob for usage for sample
     pattern
     
     You can specify a pattern to pull all the files that satify the particular pattern and
     output a single json file.    
     
     
    
 ```  
  new MergeJsonWebpackPlugin({
                   "output":{
                     "groupBy":[
                                   { "pattern":"{./jsons/module*/en.json,
                                                 ./jsons/file1.json}", 
                                      "fileName":"./dist/en.json" 
                                   },
                                   { "pattern":"{./jsons/module*/es.json,
                                                 ./jsons/file2.json}", 
                                       "fileName":"./dist/es.json" }
                               ]        
                           }
                  })

```
 
**groupBy** 
   >> Array of patterns and corresponding fileNames.

**groupBy[].pattern**
   >> Pattern to search files for. eg:  **/en.json will pull all en.json files under
          current working directory and sub directories.
          
  >> Do **not use** curly brackets if there is only single pattern to consider
 
 ```angular2html
pattern:"./node_modules/**/en.json"
```
  >> **Use** curly brackets to group more than one pattern together
      
 ```
  pattern:"{./node_modules/**/en.json,./src/assets/i18n/en.json}"

```
           
          
   **groupBy[].fileName**     
   >> output file name for the corresponding pattern.
   
##Sample
  Please navigate to example folder
 
 ```
   cd example
   > npm install
   > npm run webpack

```

##References

 - https://www.npmjs.com/package/glob
