//references https://basarat.gitbooks.io/typescript/content/docs/quick/nodejs.html
import * as path from 'path';
import * as fs from 'fs';
import * as glob from 'glob';

const UTF8_ENCODING = "utf8";
const plugin = "MergeJsonWebpackPlugin";

/**
 * 
 *  Files to merge, and output path.
 */
interface IMergeJsonFiles {
    files: string[];
    outputPath: string;
}

class MergeJsonWebpackPlugin {
    //options for the plugin
    options: any;
    fileDependencies;
    logger: Logger;

    constructor(options: any) {
        this.options = Object.assign({
            debug: false,
            encoding: UTF8_ENCODING,
            overwrite: true
        }, options);
        this.logger = new Logger(this.options.debug);
        this.logger.debug(JSON.stringify(this.options, undefined, 2));
    }


    /**
     * Extract files from the input options.
     * It can be either string or pattern.
     * @param compiler 
     * @returns Array of { files , outputPath}
     */
    getFileToProcess(compiler): Array<IMergeJsonFiles> {
        // placeholder to collect files and output file name.
        const filesToProcess: Array<IMergeJsonFiles> = [];

        const groupBy = this.options.output?.groupBy;
        const files = this.options.files;

        // check if groupby
        if (groupBy) {
            const defaultGlobOptions = { mark: true, cwd: compiler.context };
            // glob option
            const globOptions = { ...defaultGlobOptions, ...this.options.globOptions };
            // extract files
            groupBy.map((g) => {
                const { pattern, fileName } = g;
                const files = glob.sync(pattern, globOptions);
                filesToProcess.push(
                    {
                        files,
                        outputPath: fileName
                    }
                )
            })
        } else if (files) {
            filesToProcess.push(
                {
                    files,
                    outputPath: this.options.output?.fileName
                }
            )
        }
        return filesToProcess;
    }


    /**
     * Entry point for webpack apply.
     * @param compiler webpack compiler object.
     */
    apply(compiler: any) {
        this.logger.debug('Running apply() ::::::');

        compiler.hooks.emit.tapAsync('MergeJsonWebpackPlugin', (compilation, callback) => {
            // add filedependcies
            const fileList: Array<IMergeJsonFiles> = this.getFileToProcess(compiler);

            // extract (flatten) all files from all input list and add to file watch.
            const files = [].concat.apply([], fileList.map(g => g.files));

            for (const file of files) {
                const filePath = path.join(compilation.compiler.context, file)
                if (!compilation.fileDependencies.has(filePath)) {
                    compilation.fileDependencies.add(filePath);
                }
            }
            // process each input group.
            for (const opt of fileList) {
                this.processFiles(compilation, opt.files, opt.outputPath);
            }
            callback();
        });
    };

    /**
     * 
     * @param compilation webpack compilation object.
     * @param files List of file names.
     * @param outputPath Output path to write merged json files.
     */
    processFiles = (compilation, files: Array<string>, outputPath) => {
        const mergedJSON = files.map(file => {
            try {
                const content = this.readContent(compilation, file);
                return this.parseJson(file, content.toString());
            } catch (e) {
                this.logger.error(e);
            }
            return {};
        })
            .reduce((acc, curr) => this.mergeDeep(acc, curr));
        // add assets to compilation.
        this.addAssets(compilation, outputPath, JSON.stringify(mergedJSON, null, this.options.space));
    }


    /**
     * Reads a file from file system, if not found it will search in assets.
     * @param compilation 
     * @param contextPath 
     * @param compilation fileName
     */
    readContent = (compilation, fileName: string) => {
        //cleanup the spaces
        fileName = fileName.trim();
        //check if valid json file or not ,if not reject
        let filePath = path.join(compilation.compiler.context, fileName);
        try {
            return fs.readFileSync(filePath, this.options.encoding);
        } catch (e) {
            //check if its available in assets, it happens in case of dynamically generated files 
            //for details check issue#25
            this.logger.debug(`${fileName} missing,looking for it in assets.`);
            if (compilation.assets[fileName]) {
                this.logger.debug(` Loading ${fileName} from compilation assets.`);
                return compilation.assets[fileName].source();
            } else {
                throw new Error(`File ${fileName} not found.`);
            }
        }
    }

    /**
     * 
     * @param fileName 
     * @param content 
     */
    parseJson(fileName: string, content: string) {
        if (!content) {
            throw new Error(`Data appears to be empty in the file := [ ${fileName} ]`);
        }
        // Source: https://github.com/sindresorhus/strip-bom/blob/master/index.js
        // Catches EFBBBF (UTF-8 BOM) because the buffer-to-string
        // conversion translates it to FEFF (UTF-16 BOM)
        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
        }
        // try to get a JSON object from the file data
        let json = {};
        try {
            let fileContent = JSON.parse(content);
            //to prefix object with filename ,requirement as request in issue#31            
            if (this.options.prefixFileName) {
                if (typeof this.options.prefixFileName === 'function') {
                    json[this.options.prefixFileName(fileName)] = fileContent;
                } else {
                    json[path.basename(fileName, ".json")] = fileContent;
                }
            } else {
                json = fileContent
            }
        } catch (e) {
            throw e;
        }
        if (typeof json !== 'object') {
            throw new Error(`Not a valid json data in ${fileName}`);
        }
        return json;
    }

    /**
     * deep merging of json child object
     * code contributed by @leonardopurro
     */
    mergeDeep = (target, source) => {
        if (typeof target == "object" && typeof source == "object") {
            for (const key in source) {
                // check if merge is false, then preserve in an array
                if (!target[key]) {
                    target[key] = source[key];
                } else {
                    // check if overwrite is false, then merge into array.
                    if (this.options.overwrite === false) {
                        target[key] = [].concat(target[key], source[key]);
                    } else {
                        if (typeof source[key] == "object") {
                            this.mergeDeep(target[key], source[key]);
                        } else {
                            target[key] = source[key];
                        }
                    }
                }
            }
        }
        return target;
    }


    /**
     * after succesful generation of assets ,add it to compilation.assets
     * @param compilation 
     * @param res 
     */
    private addAssets(compilation: any, filePath: string, content: string) {
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
    isDebug: boolean = false;
    constructor(isDebug: boolean) {
        this.isDebug = isDebug;
    }
    debug = (...logs) => {
        if (this.isDebug) {
            console.log('\x1b[36m%s\x1b[0m', `${plugin} :: ${logs}`);
        }
    }
    error = (e: any) => {
        console.error('\x1b[41m%s\x1b[0m', `${plugin} : ${e.message}`);
    }
}

export = MergeJsonWebpackPlugin;
