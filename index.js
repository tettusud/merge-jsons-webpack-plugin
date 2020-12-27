"use strict";
const path = require("path");
const fs = require("fs");
const glob = require("glob");
const UTF8_ENCODING = "utf8";
const plugin = "MergeJsonWebpackPlugin";
const defaultOpts = {
    encoding: UTF8_ENCODING,
    debug: false
};
class MergeJsonWebpackPlugin {
    constructor(options) {
        this.getFiles = (compiler) => {
            var _a, _b;
            const filesToProcess = [];
            const groupBy = (_a = this.options.output) === null || _a === void 0 ? void 0 : _a.groupBy;
            const files = this.options.files;
            if (groupBy) {
                const defaultGlobOptions = { mark: true, cwd: compiler.context };
                const globOptions = Object.assign(Object.assign({}, defaultGlobOptions), this.options.globOptions);
                groupBy.map((g) => {
                    const { pattern, fileName } = g;
                    const files = glob.sync(pattern, globOptions);
                    filesToProcess.push({
                        files,
                        outputPath: fileName
                    });
                });
            }
            else if (files) {
                filesToProcess.push({
                    files,
                    outputPath: (_b = this.options.output) === null || _b === void 0 ? void 0 : _b.fileName
                });
            }
            return filesToProcess;
        };
        this.apply = (compiler) => {
            this.logger.debug('Running apply1() ::::::');
            compiler.hooks.emit.tapAsync('MergeJsonWebpackPlugin', (compilation, callback) => {
                const fileGroups = this.getFiles(compiler);
                const files = [].concat.apply([], fileGroups.map(g => g.files));
                for (const file of files) {
                    const filePath = path.join(compilation.compiler.context, file);
                    if (!compilation.fileDependencies.has(filePath)) {
                        compilation.fileDependencies.add(filePath);
                    }
                }
                for (const fileGroup of fileGroups) {
                    this.processFiles(compilation, fileGroup.files, fileGroup.outputPath);
                }
                callback();
            });
        };
        this.processFiles = (compilation, files, outputPath) => {
            const mergedJSON = files.map(file => {
                try {
                    const content = this.readContent(compilation, file);
                    return this.parseJson(file, content.toString());
                }
                catch (e) {
                    this.logger.error(e);
                }
                return null;
            })
                .reduce((acc, curr) => this.mergeDeep(acc, curr));
            this.addAssets(compilation, outputPath, JSON.stringify(mergedJSON, null, this.options.space));
        };
        this.readContent = (compilation, fileName) => {
            fileName = fileName.trim();
            let filePath = path.join(compilation.compiler.context, fileName);
            try {
                return fs.readFileSync(filePath, this.options.encoding);
            }
            catch (e) {
                this.logger.debug(`${fileName} missing,looking for it in assets.`);
                if (compilation.assets[fileName]) {
                    this.logger.debug(` Loading ${fileName} from compilation assets.`);
                    return compilation.assets[fileName].source();
                }
                else {
                    throw new Error(`File ${fileName} not found.`);
                }
            }
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
                        if (!target[key]) {
                            target[key] = {};
                        }
                        else {
                            if (this.options.duplicates) {
                                if (!(target[key] instanceof Array)) {
                                    target[key] = [target[key]];
                                }
                                target[key].push(source[key]);
                            }
                        }
                        this.mergeDeep(target[key], source[key]);
                    }
                    else {
                        target[key] = source[key];
                    }
                }
            }
            return target;
        };
        this.options = Object.assign(defaultOpts, options);
        this.logger = new Logger(this.options.debug);
        this.logger.debug(' options: ', options);
    }
    parseJson(fileName, content) {
        if (!content) {
            throw new Error(`Data appears to be empty in the file := [ ${fileName} ]`);
        }
        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
        }
        let json = {};
        try {
            let fileContent = JSON.parse(content);
            if (this.options.prefixFileName) {
                if (typeof this.options.prefixFileName === 'function') {
                    json[this.options.prefixFileName(fileName)] = fileContent;
                }
                else {
                    json[path.basename(fileName, ".json")] = fileContent;
                }
            }
            else {
                json = fileContent;
            }
        }
        catch (e) {
            throw e;
        }
        if (typeof json !== 'object') {
            throw new Error(`Not a valid json data in ${fileName}`);
        }
        return json;
    }
    addAssets(compilation, filePath, content) {
        compilation.assets[filePath] = {
            size: function () {
                return content.length;
            },
            source: function () {
                return content;
            }
        };
    }
}
class Logger {
    constructor(isDebug) {
        this.isDebug = false;
        this.debug = (...logs) => {
            if (this.isDebug) {
                console.log('\x1b[46m%s\x1b[0m', `${plugin} : ${logs}`);
            }
        };
        this.error = (e) => {
            console.error('\x1b[41m%s\x1b[0m', `${plugin} : ${e.message}`);
        };
        this.isDebug = isDebug;
    }
}
module.exports = MergeJsonWebpackPlugin;
