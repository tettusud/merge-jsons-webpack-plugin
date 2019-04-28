"use strict";
const es6_promise_1 = require("es6-promise");
const path = require("path");
const Glob = require("glob");
const fs = require("fs");
const _root = path.resolve(__dirname, "./");
const UTF8_ENCODING = "utf8";
const allowedExtensions = ".json";
class MergeJsonWebpackPlugin {
    constructor(options) {
        this.apply = (compiler) => {
            this.options.compiler = compiler;
            const emit = (compilation, done) => {
                this.logger.debug('MergeJsonsWebpackPlugin emit started...');
                this.fileDependencies = [];
                this.options.compilation = compilation;
                let files = this.options.files;
                let output = this.options.output;
                let groupBy = output.groupBy;
                if (files && groupBy) {
                    compilation.errors.push('MergeJsonWebpackPlugin: Specify either files (all the files to merge with filename) or groupBy to specifiy a pattern(s)' +
                        'of file(s) to merge. ');
                }
                if (files) {
                    let outputPath = output.fileName;
                    new es6_promise_1.Promise((resolve, reject) => {
                        this.processFiles(files, outputPath, resolve, reject);
                    })
                        .then((res) => {
                        this.addAssets(compilation, res);
                        done();
                    })
                        .catch((err) => {
                        this.handleErrors(compilation, err, done);
                    });
                }
                else if (groupBy) {
                    if (groupBy.length == 0) {
                        compilation.errors.push('MergeJsonWebpackPlugin: \"groupBy\" must be non empty object');
                    }
                    let globOptions = this.options.globOptions || {};
                    let groupByPromises = groupBy.map((globs) => {
                        return new es6_promise_1.Promise((resolve, reject) => {
                            let pattern = globs.pattern;
                            let outputPath = globs.fileName;
                            this._glob(pattern, globOptions).then((files) => {
                                this.processFiles(files, outputPath, resolve, reject);
                            });
                        });
                    });
                    es6_promise_1.Promise.all(groupByPromises)
                        .then((opsResponse) => {
                        opsResponse.forEach((res) => {
                            this.addAssets(compilation, res);
                        });
                        done();
                    })
                        .catch((err) => {
                        this.handleErrors(compilation, err, done);
                    });
                }
                this.logger.debug('MergeJsonsWebpackPlugin emit completed...');
            };
            const afterEmit = (compilation, done) => {
                this.logger.debug("MergeJsonsWebpackPlugin after-emit starts...");
                let compilationFileDependencies;
                let addFileDependency;
                if (Array.isArray(compilation.fileDependencies)) {
                    compilationFileDependencies = new Set(compilation.fileDependencies);
                    addFileDependency = (file) => compilation.fileDependencies.push(file);
                }
                else {
                    compilationFileDependencies = compilation.fileDependencies;
                    addFileDependency = (file) => compilation.fileDependencies.add(file);
                }
                for (const file of this.fileDependencies) {
                    let filePath = path.join(compiler.context, file);
                    if (!compilationFileDependencies.has(filePath)) {
                        addFileDependency(filePath);
                    }
                }
                this.logger.debug("MergeJsonsWebpackPlugin after-emit completed...");
                done();
            };
            if (compiler.hooks) {
                const plugin = "MergeJsonWebpackPlugin";
                compiler.hooks.emit.tapAsync(plugin, emit);
                compiler.hooks.afterEmit.tapAsync(plugin, afterEmit);
            }
            else {
                compiler.plugin('emit', emit);
                compiler.plugin("after-emit", afterEmit);
            }
        };
        this.processFiles = (files, outputPath, resolve, reject) => {
            this.fileDependencies = this.fileDependencies.concat(files);
            let readFiles = files.map((f) => {
                return new es6_promise_1.Promise((res, rej) => {
                    this.readFile(f, res, rej);
                });
            });
            let mergedContents = {};
            es6_promise_1.Promise.all(readFiles)
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
        };
        this.readFile = (f, resolve, reject) => {
            let compilation = this.options.compilation;
            let contextPath = this.options.compiler.context;
            f = f.trim();
            let extn = path.extname(f).toLowerCase();
            if (extn !== allowedExtensions) {
                this.logger.error(`${f} doesn't contain a valid file extention,trying to load it contents.`);
            }
            let entryData = undefined;
            try {
                let filePath = path.join(contextPath, f);
                entryData = fs.readFileSync(filePath, this.options.encoding);
            }
            catch (e) {
                this.logger.error(`${f} missing,looking for it in assets.`);
                if (compilation.assets[f]) {
                    this.logger.debug(`${f} found in the compilation assets so loading from assets.`);
                    entryData = compilation.assets[f].source();
                }
                else {
                    this.logger.error(`MergeJsonWebpackPlugin: File missing [ ${f}] in path or assets `, e);
                    reject(`MergeJsonWebpackPlugin: Unable to locate file ${f}`);
                    return;
                }
            }
            if (!entryData) {
                this.logger.error(`MergeJsonWebpackPlugin: Data appears to be empty in file [${f}]`);
                reject(`MergeJsonWebpackPlugin: Data appears to be empty in file [ ${f} ]`);
            }
            if (entryData.charCodeAt(0) === 0xFEFF) {
                entryData = entryData.slice(1);
            }
            let entryDataAsJSON = {};
            try {
                let fileContent = JSON.parse(entryData);
                if (this.options.prefixFileName) {
                    if (typeof this.options.prefixFileName === 'function') {
                        entryDataAsJSON[this.options.prefixFileName(f)] = fileContent;
                    }
                    else {
                        entryDataAsJSON[path.basename(f, allowedExtensions)] = fileContent;
                    }
                }
                else {
                    entryDataAsJSON = fileContent;
                }
            }
            catch (e) {
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
        };
        this.mergeDeep = (target, source) => {
            if (typeof target == "object" && typeof source == "object") {
                for (const key in source) {
                    if (source[key] === null && (target[key] === undefined || target[key] === null)) {
                        target[key] = null;
                    }
                    else if (source[key] instanceof Array) {
                        if (!target[key])
                            target[key] = [];
                        target[key] = target[key].concat(source[key]);
                    }
                    else if (typeof source[key] == "object") {
                        if (!target[key])
                            target[key] = {};
                        this.mergeDeep(target[key], source[key]);
                    }
                    else {
                        target[key] = source[key];
                    }
                }
            }
            return target;
        };
        this._glob = (pattern, options) => {
            return new es6_promise_1.Promise((resolve, reject) => {
                const defaultOptions = { mark: true, cwd: this.options.compiler.context };
                new Glob(pattern, Object.assign({}, options, defaultOptions), function (err, matches) {
                    if (err) {
                        reject(err);
                    }
                    resolve(matches);
                });
            });
        };
        this.handleErrors = (compilation, error, done) => {
            compilation.errors.push(error);
            done();
        };
        this.options = options;
        this.options.encoding = this.options.encoding != null ? this.options.encoding : UTF8_ENCODING;
        this.logger = new Logger(this.options.debug);
    }
    addAssets(compilation, res) {
        compilation.assets[res.filepath] = {
            size: function () {
                return res.content.length;
            },
            source: function () {
                return res.content;
            }
        };
    }
}
class Response {
    constructor(filepath, content) {
        this.filepath = filepath;
        this.content = content;
    }
}
class Logger {
    constructor(isDebug) {
        this.isDebug = false;
        this.debug = (msg) => {
            if (this.isDebug)
                console.log(msg);
        };
        this.error = (msg, e) => {
            console.error(msg, e != undefined ? e : "");
        };
        this.isDebug = isDebug;
    }
}
module.exports = MergeJsonWebpackPlugin;
