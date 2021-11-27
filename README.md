# Merge json files

Merge Json files using this webpack plugin.

For example,it will be useful to
merge i18n json files which are in different modules into a single
final json files in angular2 or react modules.

# Latest version and breaking changes.

-   Breaking changes introduced in latest version 2.0.0, now all values will be overwritten including arrays, earlier behaviour
    was to concatenate array and overrite literals.Going foward to concatenate either literals or arrays, pass **overwrite** false as an input, this will concatenate all values in target with source values.

-   This version also fixes compatibility issue with **Webpack 5**

## Usage

Install with npm

```
npm i merge-jsons-webpack-plugin
```

```javascript
var MergeJsonWebpackPlugin = require("merge-jsons-webpack-plugin");
new MergeJsonWebpackPlugin({
    files: ["./jsons/file1.json", "./jsons/file3.json", "./jsons/file2.json"],
    output: {
        fileName: "./dist/result.json",
    },
});
```

## Details

You can specify either files or groupBy under output.

**1) By files**  
 If you want to merge group of files use like this.

```javascript
new MergeJsonWebpackPlugin({
    debug: true,
    files: ["./jsons/file1.json", "./jsons/file3.json", "./jsons/file2.json"],
    output: {
        fileName: "./dist/result.json",
    },
});
```

| Field Name      | Description                                                      |
| --------------- | ---------------------------------------------------------------- |
| files           | Array of json files to be merged                                 |
| output.fileName | Name of merged output file ,relative path from output.path entry |

**2) By Patterns**  
 This plugin uses glob for searching file patterns,please refer glob for usage for sample pattern. You can specify a pattern to pull all the files that satify the particular pattern and output a single json file.

```javascript
new MergeJsonWebpackPlugin({
    encoding: "ascii",
    debug: true,
    output: {
        groupBy: [
            {
                pattern: "{./jsons/module*/en.json,./jsons/file1.json}",
                fileName: "./dist/en.json",
            },
            {
                pattern: "{./jsons/module*/es.json,./jsons/file2.json}",
                fileName: "./dist/es.json",
            },
        ],
    },
    globOptions: {
        nosort: true,
    },
});
```

| groupBy            | Array of patterns and corresponding fileNames.                                                                                |                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| groupBy[].pattern  | Pattern to search files for. eg: \*\*/en.json will pull all en.json files under current working directory and sub directories |                                                                   |
|                    | Do **not use** curly brackets if there is only single pattern to consider                                                     | pattern:"./node_modules/\*\*/en.json"                             |
|                    | **Use** curly brackets to group more than one pattern together                                                                | pattern:"{./node_modules/\*\*/en.json,./src/assets/i18n/en.json}" |
| groupBy[].fileName | output file name for the corresponding pattern.Relative path from output.path entry                                           |                                                                   |

**3) Run time files**

Files generated at run time can also be specified as input to the pattern.The plugin will lookup in the compilation.assets of webpack and try to load it for processing.

## Options

| key            | Description.                                                                                                                                                                                                                                                                                                                                                                         |     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --- |
| debug          | if true, logs will be enabled, by default debug is false.                                                                                                                                                                                                                                                                                                                            |
| encoding       | Optional, encoding to be used default is utf-8.                                                                                                                                                                                                                                                                                                                                      |     |
| globOptions    | Optional, [glob options](https://github.com/isaacs/node-glob#options) to change pattern matching behavior.                                                                                                                                                                                                                                                                           |     |
| prefixFileName | Optional. If true, file names will be prefixed to each file content and merged with outfile<br><br>By default, the generated prefix is ​​simply the filename without the .json extension. If you want to customize the process of generating prefixes, you can pass a function as this option. The function should take exactly one argument (the file path) and returns the prefix. |
| space          | Optional. A `String` or `Number` object that's used to insert white space into the output JSON file for readability purposes. See [`space` parameter description on MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#Parameters) for details.                                                                                    |
| ~~duplicates~~ | ~~**Default** value is false.If true, keys at same heirarchy will be preserved in an array, check [example](https://gist.github.com/alexxlagutin/68f89cae748282f19104f94a04196132#gistcomment-3039950).~~                                                                                                                                                                            |
| overwrite      | Default true, if false values(for same keys) at same heirarchy will be preserved in an array. Check [example](https://gist.github.com/alexxlagutin/68f89cae748282f19104f94a04196132#gistcomment-3039950), [issue #31](https://github.com/tettusud/merge-jsons-webpack-plugin/issues/31), [issue #63](https://github.com/tettusud/merge-jsons-webpack-plugin/issues/63) .             |

## Change Logs

| Version     | Changes                                                                                                                                                                                                                                                                           |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0.8       | Error handling improved. Now **fileName** is relative path to output path specified                                                                                                                                                                                               |
| 1.0.10      | File watching feature added, result will be automatically refreshed if json files are modified                                                                                                                                                                                    |
| 1.0.11      | Publish issues with previous version                                                                                                                                                                                                                                              |
| 1.0.12      | Added glob options handling                                                                                                                                                                                                                                                       |
| 1.0.13      | When using groupBy,fixed issue of compilation more than once, added capability to read dynamically generated files,and conditional logging                                                                                                                                        |
| 1.0.14      | Webpack 4 breaking changes fix                                                                                                                                                                                                                                                    |
| 1.0.15      | prefixFileName option added, for feature request #31                                                                                                                                                                                                                              |
| 1.0.16      | Webpack 4 compatibile api changes                                                                                                                                                                                                                                                 |
| 1.0.17      | Filex extension check removed,file can be of any extention as long as content is json.Testcases also added                                                                                                                                                                        |
| 1.0.18      | Bom issue fix #22                                                                                                                                                                                                                                                                 |
| 1.0.19      | Support for custom "prefixFileName" function                                                                                                                                                                                                                                      |
| 1.0.20      | Output formatting via `space` parameter added, preserving duplicates in an array if `duplicates:true` instead of overriding existing value.                                                                                                                                       |
| 2.0.0-alpha | **Breaking Changes** Webpack 5 compatibility update, removed **duplicates** option, instead added **overwrite** with default value true, this will break existing behaviour of concatination in case of an array, instead now by default overwrites array value in target object. |
| 2.0.0       | Json processing moved to compilation hook **additionalAssets** and changed to sync to fix issue #68                                                                                                                                                                               |

## Sample

To see sample you can navigate to example folder.
From the root folder merge-jsons-webpack-plugin, you can start the sample application
as mentioned below

```

   > npm install
   > npm start

```

Access the web application at

```
 http://localhost:8080
```

## References

-   https://www.npmjs.com/package/glob
