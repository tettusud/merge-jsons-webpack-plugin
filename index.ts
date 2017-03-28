//references https://basarat.gitbooks.io/typescript/content/docs/quick/nodejs.html
import {Promise} from "es6-promise";
import path = require('path');
import Glob=require('glob');
import fs = require('fs');

const _root = path.resolve(__dirname, "./"); // project root folder


class MergeJsonWebpackPlugin {


    constructor(options: any) {
        this.init(options);
    }


    apply = (compiler: any) => {
        compiler.plugin("compile", (params: any) => {
            console.log("merge-jsons-webpack-plugin compilation starts");
        });

        compiler.plugin("done", (params: any) => {
            console.log("merge-jsons-webpack-plugin compilation done");
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
                    entryData = fs.readFileSync(f, 'utf8');

                } catch (e) {
                    console.error("File missing [",f,"]  error ", e);
                    throw e;
                }

                if (!entryData) {
                    throw new Error("Data appears to be empty in file ["+f +" ]");
                }

                // try to get a JSON object from the file data
                let entryDataAsJSON = {};

                try {
                    entryDataAsJSON = JSON.parse(entryData);
                } catch (e) {
                    console.error("Error parsing the json file [ ",f," ] and error is ", e);
                    throw e;
                }

                if (typeof entryDataAsJSON !== 'object') {
                    throw new Error("Not a valid object , file  [ "+f+" ]");
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
    mergeDeep(target, source) {
        if (typeof target == "object" && typeof source == "object") {
            for (const key in source) {
                if (source[key] === null && target[key] === undefined) {
                    target[key] = null;
                }
                else if (source[key] instanceof Array) {
                    if (!target[key]) target[key]=[];
                    //concatenate arrays
                    target[key]= target[key].concat(source[key]);
                }else if (typeof source[key] == "object") {
                    if (!target[key]) target[key]={};
                    this.mergeDeep(target[key], source[key]);
                } else {
                   target[key]=source[key];
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

    resolve = (options: any) => {
        let output = options.output;
        let pattern = "";

        if (output.groupBy) {
            let groupBy: any = output.groupBy;

            if (!Array.isArray(groupBy) || groupBy.length == 0) {
                throw new Error('\"groupBy\" must be a non empty array, eg  \"groupBy\":[{\"pattern":\"**/**\",\"fileName\":\"sampleOutput\"}]')
            }
            let matches = [];
            for (let g of groupBy) {
                if (!g.pattern) {
                    throw new Error('When you are merging using \"groupBy\" options ,please specifiy a file/directory pattern to group by ' + JSON.stringify(g));
                }
                matches.push(this._glob(g.pattern))
            }
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

            new Glob(pattern, {mark: true}, function (err:any, matches:any) {

                if (err) {
                    throw err;
                }

                resolve(matches);
            })
        });

    }

    init = (options: any) => {

        let files = options.files;
        let output = options.output;
        let groupBy = output.groupBy;

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
                }
            )
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

export=MergeJsonWebpackPlugin;
