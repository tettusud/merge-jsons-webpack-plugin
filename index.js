"use strict";
const path = require("path");
const fs = require("fs");
const glob = require("glob");
const UTF8_ENCODING = "utf8";
const plugin = "MergeJsonWebpackPlugin";
class MergeJsonWebpackPlugin {
    constructor(options) {
        this.processFiles = (compilation, files, outputPath) => {
            const mergedJSON = files.map(file => {
                try {
                    const content = this.readContent(compilation, file);
                    return this.parseJson(file, content.toString());
                }
                catch (e) {
                    this.logger.error(e);
                }
                return {};
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
                    if (!target[key]) {
                        target[key] = source[key];
                    }
                    else {
                        if (this.options.overwrite === false) {
                            target[key] = [].concat(target[key], source[key]);
                        }
                        else {
                            if (typeof source[key] == "object") {
                                this.mergeDeep(target[key], source[key]);
                            }
                            else {
                                target[key] = source[key];
                            }
                        }
                    }
                }
            }
            return target;
        };
        this.options = Object.assign({
            debug: false,
            encoding: UTF8_ENCODING,
            overwrite: true
        }, options);
        this.logger = new Logger(this.options.debug);
        this.logger.debug(JSON.stringify(this.options, undefined, 2));
    }
    getFileToProcess(compiler) {
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
    }
    apply(compiler) {
        this.logger.debug('Running apply() ::::::');
        compiler.hooks.thisCompilation.tap('MergeJsonWebpackPlugin', (compilation) => {
            compilation.hooks.additionalAssets.tap('MergeJsonWebpackPlugin', () => {
                const fileList = this.getFileToProcess(compiler);
                const files = [].concat.apply([], fileList.map(g => g.files));
                for (const file of files) {
                    const filePath = path.join(compilation.compiler.context, file);
                    if (!compilation.fileDependencies.has(filePath)) {
                        compilation.fileDependencies.add(filePath);
                    }
                }
                for (const opt of fileList) {
                    this.processFiles(compilation, opt.files, opt.outputPath);
                }
            });
        });
    }
    ;
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
                console.log('\x1b[36m%s\x1b[0m', `${plugin} :: ${logs}`);
            }
        };
        this.error = (e) => {
            console.error('\x1b[41m%s\x1b[0m', `${plugin} : ${e.message}`);
        };
        this.isDebug = isDebug;
    }
}
module.exports = MergeJsonWebpackPlugin;
