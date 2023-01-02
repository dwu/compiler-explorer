import {BaseCompiler} from '../base-compiler';

export class QbeCompiler extends BaseCompiler {
    static get key() {
        return 'qbe';
    }

    override optionsForFilter(filters, outputFilename, userOptions) {
        return ['-o', outputFilename];
    }

    override getSharedLibraryPathsAsArguments() {
        return [];
    }
}
