import path from 'path';

import fs from 'fs-extra';

import {CompilationResult, ExecutionOptions} from '../../types/compilation/compilation.interfaces';
import {BaseCompiler} from '../base-compiler';
import {logger} from '../logger';

export class HareCompiler extends BaseCompiler {
    static get key() {
        return 'hare';
    }

    override async runCompiler(
        compiler: string,
        options: string[],
        inputFilename: string,
        execOptions: ExecutionOptions,
    ): Promise<CompilationResult> {
        const workdir = await this.newTempDir();

        if (!execOptions) {
            execOptions = this.getDefaultExecOptions();
        }

        if (!execOptions.customCwd) {
            execOptions.customCwd = path.dirname(inputFilename);
        }

        execOptions.env.HARE_DEBUG_WORKDIR = workdir;

        const result = await this.exec(compiler, options, execOptions);

        logger.debug(`execOptions: ${JSON.stringify(execOptions)}`);
        logger.debug(`options: ${options}`);

        if (options.includes('-c')) {
            try {
                if (this.compiler.name.includes('QBE IR')) {
                    const irFileNames = fs.readdirSync(workdir).filter(f => f.endsWith('.ssa'));
                    if (irFileNames.length > 0) {
                        const irFilePath = path.join(workdir, irFileNames[0]);
                        if (await fs.pathExists(irFilePath)) {
                            fs.copyFileSync(
                                irFilePath,
                                this.getOutputFilename(path.dirname(inputFilename), this.outputFilebase),
                            );
                        }
                    }
                } else {
                    const asmFileNames = fs.readdirSync(workdir).filter(f => f.endsWith('.s'));
                    if (asmFileNames.length > 0) {
                        const asmFilePath = path.join(workdir, asmFileNames[0]);
                        if (await fs.pathExists(asmFilePath)) {
                            fs.copyFileSync(
                                asmFilePath,
                                this.getOutputFilename(path.dirname(inputFilename), this.outputFilebase),
                            );
                        }
                    }
                }
            } catch (err) {
                logger.error('Caught an error during compilation: ', {err});
            } finally {
                fs.remove(workdir);
            }
        }

        return {
            ...this.transformToCompilationResult(result, inputFilename),
            languageId: this.getCompilerResultLanguageId(),
        };
    }

    override getOutputFilename(dirPath: string, outputFilebase: string, key?: any): string {
        let filename;
        if (key && key.backendOptions && key.backendOptions.customOutputFilename) {
            filename = key.backendOptions.customOutputFilename;
        } else {
            filename = `${outputFilebase}`;
        }

        if (dirPath) {
            return path.join(dirPath, filename);
        } else {
            return filename;
        }
    }

    override optionsForFilter(filters, outputFilename, userOptions) {
        if (filters.binary) {
            return ['build', '-o', outputFilename];
        } else {
            return ['build', '-c', '-o', outputFilename];
        }
    }

    override getSharedLibraryPathsAsArguments() {
        return [];
    }
}
