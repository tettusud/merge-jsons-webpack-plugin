//references https://basarat.gitbooks.io/typescript/content/docs/quick/nodejs.html
import { Promise } from "es6-promise";
import path = require('path');
import Glob = require('glob');
import fs = require('fs');

const _root = path.resolve(__dirname, "./"); // project root folder
const UTF8_ENCODING = "utf8";

class MergeJsonWebpackPlugin {

    //options for the plugin
    options: any;
    
    constructor(options: any) {
        this.options = options;
        this.options.encoding = this.options.encoding != null ? this.options.encoding : UTF8_ENCODING;
    }


    apply = (compiler: any) => {


        compiler.plugin('emit', (compilation, done) => {
            
            console.log('MergeJsonsWebpackPlugin emit...');

            let files = this.options.files;
            let output = this.options.output;
            let groupBy = output.groupBy;

            if (files && groupBy) {
                compilation.errors.push('MergeJsonWebpackPlugin: Specify either files (all the files to merge with filename) or groupBy to specifiy a pattern(s)' +
                    'of file(s) to merge. ');
            }
            
            if (files) {
                let outputPath = output.fileName;
                this.processFiles(compilation, files, outputPath).then((result: any) => {
                    done();
                });
            } else if (groupBy) {
                if (groupBy.length == 0) {
                    compilation.errors.push('MergeJsonWebpackPlugin: \"groupBy\" must be non empty object');
                }

                groupBy.forEach((globs: any) => {
                    let pattern = globs.pattern;
                    let outputPath = globs.fileName;
                    this._glob(pattern).then((files) => {
                        this.processFiles(compilation, files, outputPath).then((result: any) => {
                            done();
                        });
                    });
                });

            }
        });
    }

    /**
     * Process array of files 
     */
    processFiles = (compilation: any, files: Array<string>, outputPath: string) => {
        var fileContents = files.map(this.readFile);
        let mergedContents: any = {};
        return Promise.all(fileContents)
            .then((contents) => {
                contents.forEach((content) => {
                    mergedContents = this.mergeDeep(mergedContents, content);
                });
                mergedContents = JSON.stringify(mergedContents);
                compilation.assets[outputPath] = {
                    size: function () {
                        return mergedContents.length;
                    },
                    source: function () {
                        return mergedContents;
                    }
                };
                return;
            })
            .catch(function (reason) {
                console.error("MergeJsonWebpackPlugin: Unable to process json files, ", reason);
                compilation.errors.push(`MergeJsonWebpackPlugin: ${reason}`);
            });
    }



    /**
     * this method reads the file and returns content as json object 
     */
    readFile = (f: string) => {

        return new Promise((resolve, reject) => {

            f = f.trim();

            if (!f.endsWith(".json") && !f.endsWith(".JSON")) {
                reject(`MergeJsonWebpackPlugin: Not a valid Json file ${f}`);
            }

            let entryData = undefined;

            try {

                entryData = fs.readFileSync(f, this.options.encoding);

            } catch (e) {
                console.error("MergeJsonWebpackPlugin: File missing [", f, "]  error ", e);
                reject(`MergeJsonWebpackPlugin: Unable to locate file ${f}`);
            }

            if (!entryData) {
                console.error("MergeJsonWebpackPlugin: Data appears to be empty in file [" + f + " ]");
                reject(`MergeJsonWebpackPlugin: Data appears to be empty in file [ ${f} ]`);
            }

            // try to get a JSON object from the file data
            let entryDataAsJSON = {};

            try {
                entryDataAsJSON = JSON.parse(entryData);
            } catch (e) {
                console.error("MergeJsonWebpackPlugin: Error parsing the json file [ ", f, " ] and error is ", e);
                reject(`MergeJsonWebpackPlugin: Error parsing the json file [${f}] `);
            }

            if (typeof entryDataAsJSON !== 'object') {
                console.error("MergeJsonWebpackPlugin: Not a valid object , file  [ " + f + " ]");
                reject(`MergeJsonWebpackPlugin: Not a valid object , file  [${f} ]`);
            }
            resolve(entryDataAsJSON);
        });
    }



    /**
     * deep merging of json child object
     * code contributed by @leonardopurro
     */
    mergeDeep = (target, source) => {
        if (typeof target == "object" && typeof source == "object") {
            for (const key in source) {
                if (source[key] === null && (target[key] === undefined || target[key] === null)) {
                    target[key] = null;
                } else if (source[key] instanceof Array) {
                    if (!target[key]) target[key] = [];
                    //concatenate arrays
                    target[key] = target[key].concat(source[key]);
                } else if (typeof source[key] == "object") {
                    if (!target[key]) target[key] = {};
                    this.mergeDeep(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }
        return target;
    }




    /**
     * this returns array of file paths
     * @param pattern
     * @returns {Promise}
     * @private
     */
    private _glob = (pattern: string): Promise<Array<string>> => {
        return new Promise((resolve, reject) => {
            new Glob(pattern, { mark: true }, function (err: any, matches: any) {
                if (err) {
                    reject(err);
                }
                resolve(matches);
            })
        });
    }
}

export =MergeJsonWebpackPlugin;
