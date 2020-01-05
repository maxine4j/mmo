const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CheckerPlugin } = require('awesome-typescript-loader');


module.exports = {
    entry: './src/client/index.ts',
    devtool: 'inline-source-map',
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'awesome-typescript-loader?configFileName=./tsconfig.client.json',
                exclude: /node_modules/,
            },
            {
                test: /\.scss$/,
                use: ['style-loader', 'css-loader', 'sass-loader'],
            },
            {
                test: /\.(png|jpe?g|gif)$/i,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            outputPath: './assets',
                            name: '[name].[ext]',
                        },
                    },
                ],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.scss'],
    },
    output: {
        path: `${__dirname}/dist/client/`,
        filename: 'bundle.js',
    },
    externals: [
        'fs',
        'uws',
    ],
    plugins: [
        new CheckerPlugin(),
        new HtmlWebpackPlugin({
            hash: true,
            title: 'MMO',
            template: './src/client/index.html',
            filename: 'index.html',
        }),
    ],
};
