//references https://basarat.gitbooks.io/typescript/content/docs/quick/nodejs.html
import { Promise } from "es6-promise";
import path = require('path');
import Glob = require('glob');
import fs = require('fs');

const _root = path.resolve(__dirname, "./"); // project root folder
const UTF8_ENCODING="utf8";

class MergeJsonWebpackPlugin {

    //options for the plugin
    options: any;

    constructor(options: any) {
        this.options = options;
    }


    apply = (compiler: any) => {
        compiler.plugin("this-compilation", (compilation: any) => {
            console.log("MergeJsonWebpackPlugin compiling....");
            this.init();
        });
    }

    /**
     *
     * @param files
     * @returns {Array}
     */
    load = (files: Array<any>): Promise<Array<Object>> => {

        return new Promise((resolve, reject) => {

            let mergedJsons: Array<Object> = [];

            for (let f of files) {

                f = f.trim();

                if (!f.endsWith(".json") && !f.endsWith(".JSON")) {
                    throw new Error("Not a valid json file " + f);
                }

                let entryData = undefined;

                try {
                    let encoding= this.options.encoding;
                    if(!encoding){
                        encoding=UTF8_ENCODING;
                    }
                    entryData = fs.readFileSync(f, encoding);

                } catch (e) {
                    console.error("File missing [", f, "]  error ", e);
                    throw e;
                }

                if (!entryData) {
                    throw new Error("Data appears to be empty in file [" + f + " ]");
                }

                // try to get a JSON object from the file data
                let entryDataAsJSON = {};

                try {
                    entryDataAsJSON = JSON.parse(entryData);
                } catch (e) {
                    console.error("Error parsing the json file [ ", f, " ] and error is ", e);
                    throw e;
                }

                if (typeof entryDataAsJSON !== 'object') {
                    throw new Error("Not a valid object , file  [ " + f + " ]");
                }

                // let's put the data aside for now
                mergedJsons.push(entryDataAsJSON);
            }

            let mergedContents = {};

            for (let entryData of mergedJsons) {
                mergedContents = this.mergeDeep(mergedContents, entryData);
            }
            //return the stringify version of json
            let retVal = JSON.stringify(mergedContents);
            resolve(retVal);
        });
    }

    /**t
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
     * writes the combined json string to file system to a folder output
     *test
     * @param _path
     * @param data
     */
    write = (_path: string, data: any): void => {

        try {
            // fs.writeJson(_path, data, 'utf8');
            this.ensureDirExists(_path)
                .then(() => {
                    fs.writeFileSync(_path, data, 'utf8');
                })
        } catch (e) {
            console.error("Unable to write output data to the file system ", e);
            throw e;
        }
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
                    throw err;
                }

                resolve(matches);
            })
        });

    }

    init = () => {
        let files  = this.options.files;
        let output = this.options.output;
        let groupBy= output.groupBy;

        if (files && groupBy) {
            throw new Error('Specify either files (all the files to merge with filename) or groupBy to specifiy a pattern(s)' +
                'of file(s) to merge. ');
        }
        if (files) {
            this.processFiles(files, output.fileName);
        } else if (groupBy) {
            this.processGlob(groupBy);
        }

    }

    /**
     * this method process files options
     */
    processFiles = (files: Array<string>, filename: string) => {
        this.load(files)
                    .then((res) => {
                        this.write(filename, res);
                    });
    }

    processGlob = (groupBy: any) => {
        if (groupBy.length == 0) {
            throw new Error('\"groupBy\" must be non empty object');
        }

        for (let g of groupBy) {
            let pattern = g.pattern;
            let fileName = g.fileName;
            this._glob(pattern)
                .then((res) => {
                    return this.load(res);
                })
                .then((res) => {
                    this.write(fileName, res);
                })
        }
    }

    ensureDirExists = (aPath: string) => {
        return new Promise((resolve, reject) => {
            this.isDirExists(aPath);
            resolve();
        });
    }
    /**
     *
     * @param aPath
     */
    isDirExists = (aPath: string) => {
        let dirname = path.dirname(aPath);

        if (fs.existsSync(dirname)) {
            return;
        }
        this.isDirExists(dirname);

        try {
            fs.mkdirSync(dirname);
        } catch (e) {
            console.error(' unable to create dir ', dirname, e);
        }

    }
}

export =MergeJsonWebpackPlugin;
