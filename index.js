"use strict";
const es6_promise_1 = require("es6-promise");
const path = require("path");
const Glob = require("glob");
const fs = require("fs");
const _root = path.resolve(__dirname, "./");
const UTF8_ENCODING = "utf8";
class MergeJsonWebpackPlugin {
    constructor(options) {
        this.fileDependencies = [];
        this.apply = (compiler) => {
            compiler.plugin('emit', (compilation, done) => {
                console.log('MergetJsonsWebpackPlugin compilation started...');
                let files = this.options.files;
                let output = this.options.output;
                let groupBy = output.groupBy;
                if (files && groupBy) {
                    compilation.errors.push('MergeJsonWebpackPlugin: Specify either files (all the files to merge with filename) or groupBy to specifiy a pattern(s)' +
                        'of file(s) to merge. ');
                }
                if (files) {
                    let outputPath = output.fileName;
                    this.processFiles(compilation, files, outputPath).then((result) => { done(); });
                }
                else if (groupBy) {
                    if (groupBy.length == 0) {
                        compilation.errors.push('MergeJsonWebpackPlugin: \"groupBy\" must be non empty object');
                    }
                    groupBy.forEach((globs) => {
                        let pattern = globs.pattern;
                        let outputPath = globs.fileName;
                        this._glob(pattern).then((files) => {
                            this.processFiles(compilation, files, outputPath).then((result) => { done(); });
                        });
                    });
                }
                console.log('MergetJsonsWebpackPlugin compilation completed...');
            });
            compiler.plugin("after-emit", (compilation, callback) => {
                console.log("MergetJsonsWebpackPlugin emit starts...");
                if (this.fileDependencies != null) {
                    this.fileDependencies.forEach((f) => {
                        compilation.fileDependencies.push(path.join(compiler.context, f));
                    });
                }
                console.log("MergetJsonsWebpackPlugin emit completed...");
                callback();
            });
        };
        this.processFiles = (compilation, files, outputPath) => {
            this.fileDependencies = this.fileDependencies.concat(files);
            var fileContents = files.map(this.readFile);
            let mergedContents = {};
            return es6_promise_1.Promise.all(fileContents)
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
        };
        this.readFile = (f) => {
            return new es6_promise_1.Promise((resolve, reject) => {
                f = f.trim();
                if (!f.endsWith(".json") && !f.endsWith(".JSON")) {
                    reject(`MergeJsonWebpackPlugin: Not a valid Json file ${f}`);
                }
                let entryData = undefined;
                try {
                    entryData = fs.readFileSync(f, this.options.encoding);
                }
                catch (e) {
                    console.error("MergeJsonWebpackPlugin: File missing [", f, "]  error ", e);
                    reject(`MergeJsonWebpackPlugin: Unable to locate file ${f}`);
                }
                if (!entryData) {
                    console.error("MergeJsonWebpackPlugin: Data appears to be empty in file [" + f + " ]");
                    reject(`MergeJsonWebpackPlugin: Data appears to be empty in file [ ${f} ]`);
                }
                let entryDataAsJSON = {};
                try {
                    entryDataAsJSON = JSON.parse(entryData);
                }
                catch (e) {
                    console.error("MergeJsonWebpackPlugin: Error parsing the json file [ ", f, " ] and error is ", e);
                    reject(`MergeJsonWebpackPlugin: Error parsing the json file [${f}] `);
                }
                if (typeof entryDataAsJSON !== 'object') {
                    console.error("MergeJsonWebpackPlugin: Not a valid object , file  [ " + f + " ]");
                    reject(`MergeJsonWebpackPlugin: Not a valid object , file  [${f} ]`);
                }
                resolve(entryDataAsJSON);
            });
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
        this._glob = (pattern) => {
            return new es6_promise_1.Promise((resolve, reject) => {
                new Glob(pattern, { mark: true }, function (err, matches) {
                    if (err) {
                        reject(err);
                    }
                    resolve(matches);
                });
            });
        };
        this.options = options;
        this.options.encoding = this.options.encoding != null ? this.options.encoding : UTF8_ENCODING;
    }
}
module.exports = MergeJsonWebpackPlugin;
