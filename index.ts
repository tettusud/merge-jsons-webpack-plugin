//references https://basarat.gitbooks.io/typescript/content/docs/quick/nodejs.html
import { Promise } from "es6-promise";
import path = require('path');
import Glob = require('glob');
import fs = require('fs');

const _root = path.resolve(__dirname, "./"); // project root folder
const UTF8_ENCODING = "utf8";
const allowedExtensions = ".json"


class MergeJsonWebpackPlugin {
    //options for the plugin
    options: any;
    fileDependencies;
    logger: Logger;

    constructor(options: any) {
        this.options = options;
        this.options.encoding = this.options.encoding != null ? this.options.encoding : UTF8_ENCODING;
        this.logger = new Logger(this.options.debug);
    }


    apply = (compiler: any) => {
        
        const emit = (compilation, done) => {
            this.logger.debug('MergeJsonsWebpackPlugin emit started...');
            //initialize fileDependency array
            this.fileDependencies = [];
            let files = this.options.files;
            let output = this.options.output;
            let groupBy = output.groupBy;
            if (files && groupBy) {
                compilation.errors.push('MergeJsonWebpackPlugin: Specify either files (all the files to merge with filename) or groupBy to specifiy a pattern(s)' +
                    'of file(s) to merge. ');
            }
            if (files) {
                let outputPath = output.fileName;
                new Promise((resolve, reject) => {
                    this.processFiles(compilation, files, outputPath, resolve, reject);
                })
                    .then((res: Response) => {
                        this.addAssets(compilation, res);
                        done();
                    })
                    .catch((err) => {
                        this.handleErrors(compilation, err, done);
                    });

            } else if (groupBy) {
                if (groupBy.length == 0) {
                    compilation.errors.push('MergeJsonWebpackPlugin: \"groupBy\" must be non empty object');
                }
                let globOptions = this.options.globOptions || {};

                let groupByPromises = groupBy.map((globs: any) => {
                    return new Promise((resolve, reject) => {
                        let pattern = globs.pattern;
                        let outputPath = globs.fileName;
                        this._glob(pattern, globOptions).then((files) => {
                            this.processFiles(compilation, files, outputPath, resolve, reject);
                        });
                    });
                });
                //wait for all groupBy array operations to finish
                Promise.all(groupByPromises)
                    .then((opsResponse) => {
                        //res contains Response of all groupBy operations
                        opsResponse.forEach((res: Response) => {
                            this.addAssets(compilation, res);
                        });
                        done();
                    })
                    .catch((err) => {
                        this.handleErrors(compilation, err, done);
                    });
            }
            this.logger.debug('MergeJsonsWebpackPlugin emit completed...');
        }

        const afterEmit = (compilation, done) => {
            this.logger.debug("MergeJsonsWebpackPlugin after-emit starts...");
            const compilationFileDependencies = new Set(compilation.fileDependencies);
            this.fileDependencies.forEach((file) => {
                let filePath = path.join(compiler.context, file)
                if (!compilationFileDependencies.has(filePath)) {
                    if (compilation.fileDependencies.add) {
                        //for webpack4                        
                        compilation.fileDependencies.add(filePath);
                    } else {
                        //webpack 3                       
                        compilation.fileDependencies.push(filePath);
                    }
                }
            });
            this.logger.debug("MergeJsonsWebpackPlugin after-emit completed...")
            done();
        }

        // code handling for webpack 4
        if(compiler.hooks){           
            const plugin="MergeJsonWebpackPlugin";
            compiler.hooks.emit.tapAsync(plugin, emit);
            compiler.hooks.afterEmit.tapAsync(plugin, afterEmit);
        }else {  //for webpack 3            
            compiler.plugin('emit', emit);    
            compiler.plugin("after-emit", afterEmit);
        }       
    };

    /**
     * 
     */
    processFiles = (compilation, files, outputPath, resolve, reject) => {
        this.fileDependencies = this.fileDependencies.concat(files);
        let readFiles = files.map((f) => {
            return new Promise((res, rej) => {
                this.readFile(compilation, f, res, rej)
            })
        });
        let mergedContents: any = {};
        Promise.all(readFiles)
            .then((contents) => {
                contents.forEach((content) => {
                    mergedContents = this.mergeDeep(mergedContents, content);
                });
                mergedContents = JSON.stringify(mergedContents);
                resolve(new Response(outputPath, mergedContents));
            })
            .catch((error) => {
                reject(error);
            });

    }

    readFile = (compilation, f, resolve, reject) => {
        //cleanup the spaces
        f = f.trim();
        //check if valid json file or not ,if not reject
        let extn = path.extname(f).toLowerCase();
        if (extn !== allowedExtensions) {
            reject(`MergeJsonWebpackPlugin: Not a valid Json file ${f}`);
            return;
        }
        let entryData = undefined;
        try {
            entryData = fs.readFileSync(f, this.options.encoding);
        } catch (e) {
            //check if its available in assets, it happens in case of dynamically generated files 
            //for details check issue#25
            this.logger.error(`${f} missing,looking for it in assets.`);
            if (compilation.assets[f]) {
                this.logger.debug(`${f} found in the compilation assets so loading from assets.`)
                entryData = compilation.assets[f].source();
            } else {
                this.logger.error(`MergeJsonWebpackPlugin: File missing [ ${f}] in path or assets `, e);
                reject(`MergeJsonWebpackPlugin: Unable to locate file ${f}`);
                return;
            }
        }
        if (!entryData) {
            this.logger.error(`MergeJsonWebpackPlugin: Data appears to be empty in file [${f}]`);
            reject(`MergeJsonWebpackPlugin: Data appears to be empty in file [ ${f} ]`);
        }
        // try to get a JSON object from the file data
        let entryDataAsJSON = {};
        try {
            let fileContent = JSON.parse(entryData);
            //to prefix object with filename ,requirement as request in issue#31            
            if (this.options.prefixFileName) {
                entryDataAsJSON[path.basename(f, allowedExtensions)] = fileContent;
            } else {
                entryDataAsJSON = fileContent
            }
        } catch (e) {
            this.logger.error(`MergeJsonWebpackPlugin: Error parsing the json file [ ${f} ] and error is `, e);
            reject(`MergeJsonWebpackPlugin: Error parsing the json file [${f}] `, e);
            return;
        }
        if (typeof entryDataAsJSON !== 'object') {
            this.logger.error(`MergeJsonWebpackPlugin: Not a valid object , file  [ ${f} ]`);
            reject(`MergeJsonWebpackPlugin: Not a valid object , file  [${f} ]`);
            return;
        }
        resolve(entryDataAsJSON);
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
     * @param options
     * @returns {Promise}
     * @private
     */
    private _glob = (pattern: string, options?: any): Promise<Array<string>> => {
        return new Promise((resolve, reject) => {
            const defaultOptions = { mark: true };
            new Glob(pattern, { ...options, ...defaultOptions }, function (err: any, matches: any) {
                if (err) {
                    reject(err);
                }
                resolve(matches);
            })
        });
    }

    /**
     * after succesful generation of assets ,add it to compilation.assets
     * @param compilation 
     * @param res 
     */
    private addAssets(compilation: any, res: Response) {
        compilation.assets[res.filepath] = {
            size: function () {
                return res.content.length;
            },
            source: function () {
                return res.content;
            }
        };
    }

    /**
     * handle errors at the time of compilation
     */
    handleErrors = (compilation: any, error: string, done) => {
        compilation.errors.push(error);
        done();
    }
}

class Response {
    filepath: string;
    content: string;
    constructor(filepath: string, content: string) {
        this.filepath = filepath;
        this.content = content;
    }
}

class Logger {
    isDebug: boolean = false;
    constructor(isDebug: boolean) {
        this.isDebug = isDebug;
    }
    debug = (msg) => {
        if (this.isDebug)
            console.log(msg);
    }
    error = (msg, e?: any) => {
        console.error(msg, e != undefined ? e : "");
    }
}

export = MergeJsonWebpackPlugin;
