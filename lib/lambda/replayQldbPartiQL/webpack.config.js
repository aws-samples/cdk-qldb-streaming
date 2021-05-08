const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

// Webpack doesn't support code-split chunks 'initial' or 'all' when target is set to node. It does output two code-split files
// but doesn't provide linkages between the two. The below plugin provides that linkage by modifying the main template which
// is used for generating the output Javascript. The code first imports the "vendors" module which contains the dependencies,
// then it adds a line into the webpack required function that fetches the module from the vendors chunk if it doesn't exist
// in the main chunk.
class VendorImportPlugin {
    constructor(options) {
        this.options = options;
    }
    apply(compiler) {
        compiler.hooks.compilation.tap('VendorImport', (compilation) => {
            compilation.mainTemplate.hooks.localVars.tap('Require', (source) => {
                return `const vendor = require('${this.options.filename}');\n${source}`;
            });
            compilation.mainTemplate.hooks.require.tap('Resolve', (source) => {
                const resolver =
                    'if (!modules[moduleId] && vendor.modules[moduleId]) { modules[moduleId] = vendor.modules[moduleId]; }\n';
                const identifier = '// Execute the module function';
                const newSource = source.replace(identifier, resolver + identifier);
                return newSource;
            });
        });
    }
}

module.exports = {
    mode: 'production',
    devtool: 'inline-source-map',
    entry: { index: './index.ts' },
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    target: 'node',
    output: {
        path: path.resolve(__dirname, 'output'),
        filename: '[name].js',
        libraryTarget: 'umd',
    },
    node: {
        __dirname: false,
    },
    plugins: [
        new VendorImportPlugin({
            filename: './vendors~index.js',
        }),
    ],
    optimization: {
        sideEffects: false,
        namedModules: true,
        namedChunks: true,
        splitChunks: {
            chunks: 'all',
        },
        minimize: true,
        minimizer: [
            // Minifiy the dependency chunk but leave the main chunk with source code readable
            new TerserPlugin({
                test: /vendor/i,
            }),
        ],
    },
};
